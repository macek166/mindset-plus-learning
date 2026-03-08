from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
from uuid import UUID

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from ...models.agent_models import EvaluatorInput, EvaluatorOutput, KPI, ContentInput
from ...services.database import db_service
from ...agents import evaluator_agent, content_agent, EvaluatorAgent, ContentAgent
from ...core.llm import llm_smart

# Request Models
class EvaluateRequest(BaseModel):
    node_id: UUID
    user_id: UUID
    user_essay: str

class TuningValue(BaseModel):
    depth: int = 0
    breadth: int = 0

class DeepenNodeRequest(BaseModel):
    node_id: UUID
    mode: str = "GENERAL" 
    tuning: Dict[str, TuningValue] = {}


router = APIRouter()

# Dependency Injection
async def get_agents():
    return (evaluator_agent, content_agent)

async def get_content_agent():
    return content_agent


@router.post("/evaluate_attempt")
async def evaluate_attempt(
    request: EvaluateRequest,
    agents: tuple[EvaluatorAgent, ContentAgent] = Depends(get_agents)
):
    """
    Evaluates a user's active recall attempt with SRS logic.
    """
    eval_agent, cont_agent = agents
    node = await db_service.get_node(request.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    kpis_data = node.get('kpis') or []
    kpi_objects = [KPI(**k) for k in kpis_data] if isinstance(kpis_data, list) else []
    
    # 1. Evaluate
    try:
        eval_input = EvaluatorInput(
            original_content=f"LEKCE: {node['title']}\n\n{node.get('content_md', '')}",
            kpis=kpi_objects,
            user_essay=request.user_essay,
            depth_level=node.get('depth_level', 1)
        )
        result = await eval_agent.evaluate(eval_input)
    except Exception as e:
        print(f"Evaluation failed: {e}")
        result = EvaluatorOutput(passed=False, score=0, feedback="System error during evaluation.", missed_kpi_ids=[])

    # 2. Logic Check & Adjustment (95% -> 100%)
    is_remedial = "Doučování" in node['title']
    if is_remedial and result.score >= 95:
        result.score = 100
        result.passed = True
        result.feedback = "Excelentní! Zvládnuto na 100%."

    # 3. Log Attempt
    await db_service.create_test_attempt({
        "node_id": str(request.node_id),
        "user_id": str(request.user_id),
        "user_text": request.user_essay,
        "ai_feedback": result.model_dump(),
        "passed": result.passed,
        "score": result.score,
    })

    current_level = node.get('repetition_level', 0)
    
    # 4. Handle SRS Transition
    # Remedial requires 100 (which we forced above if >=95)
    passed_threshold = 100 if is_remedial else 60
    
    # Override LLM passed status if score is insufficient for this node type
    effective_passed = result.passed and (result.score >= passed_threshold)

    if effective_passed:
        # User passed the node (Standard > 60%, Remedial = 100%)
        new_level = current_level + 1
        
        days_map = {1: 1, 2: 4, 3: 7}
        review_days = days_map.get(new_level, 7) 
        
        next_review = datetime.now(timezone.utc) + timedelta(days=review_days)
        
        update_data = {
            "repetition_level": new_level,
            "next_review_at": next_review.isoformat(),
            "status": "DONE", 
            "last_test_score": result.score
        }
        db_service.client.table("nodes").update(update_data).eq("id", str(request.node_id)).execute()
        
        # Unlock children logic (only on first pass, Level 0 -> 1)
        if new_level >= 1: 
            children_response = db_service.client.table("nodes").select("*").eq("parent_node_id", str(request.node_id)).execute()
            children = children_response.data
            
            for child in children:
                if child['status'] == 'LOCKED':
                    db_service.client.table("nodes").update({"status": "OPEN"}).eq("id", child['id']).execute()
                    if not child.get('content_md'):
                        try:
                            # Prepare context from parent (known material)
                            parent_content_preview = node.get('content_md', '')[:2500] 
                            context_instruction = (
                                f"Toto je pokročilá navazující lekce (Level {child.get('depth_level', 2)}). TÉMA: {child['title']}.\n"
                                f"KŘITICKÝ POŽADAVEK: Obsah musí být VÝRAZNĚ POKROČILEJŠÍ a detailnější než předchozí úroveň.\n"
                                f"ZÁKAZ OPAKOVÁNÍ: Uživatel již ovládá téma '{node['title']}'. Nevysvětluj znovu základy. Jdi rovnou do hloubky, nuance, složitějších mechanismů nebo aplikací.\n"
                                f"KONTEXT PŘEDCHOZÍ LEKCE (Co uživatel zná - NEPSAT ZNOVU): {parent_content_preview}..."
                            )

                            content = await cont_agent.generate_content(ContentInput(
                                node_title=child['title'],
                                node_context=context_instruction,
                                depth_level=child['depth_level'] or 1
                            ))
                            db_service.client.table("nodes").update({
                                "content_md": content.content_markdown,
                                "kpis": [k.model_dump() for k in content.kpis]
                            }).eq("id", child['id']).execute()
                        except Exception as e:
                            print(f"Failed to generate content: {e}")
        
    # EXTRACT CONCEPTS LOGIC (Trigger at Mastery Level - e.g., Level 3)
        if new_level >= 3:
             # Using the dedicated service
             from ...services.concepts_service import concept_extractor
             await concept_extractor.extract_and_save(request.user_essay, node.get('content_md', ''), str(request.user_id), str(request.node_id))

        return {
            "status": "passed",
            "score": result.score,
            "feedback": result.feedback,
            "new_level": new_level,
            "next_review_in_hours": review_days * 24
        }
    
    else:
        # FAILED
        new_level = current_level
        if result.score < 60:
             new_level = max(0, current_level - 1)
        
        # Update SRS state
        db_service.client.table("nodes").update({
            "repetition_level": new_level,
            "last_test_score": result.score,
        }).eq("id", str(request.node_id)).execute()

        # Cleaner title logic with recursion tracking
        import re
        current_title = node['title']
        if "Doučování" in current_title:
             # Try to find existing number
             match = re.search(r"Doučování \((\d+)\)", current_title)
             if match:
                 num = int(match.group(1))
                 remedial_topic = current_title.replace(f"Doučování ({num})", f"Doučování ({num + 1})")
             else:
                 # First level -> Second level
                 remedial_topic = current_title.replace("Doučování:", "Doučování (2):")
        else:
             remedial_topic = f"Doučování: {current_title}"
             
        # Allow LLM to refine topic if strictly different? Usually rigid structure is better for consistency.
        # remedial_topic = result.suggested_remedial_topic or remedial_topic # IGNORE LLM suggestion to enforce structure
        
        parent_depth = node.get('depth_level', 1)
        
        new_node_id = await db_service.create_remedial_node(
            parent_id=request.node_id,
            goal_id=node['goal_id'],
            topic=remedial_topic,
            depth_level=parent_depth + 1
        )
        
        if new_node_id:
            try:
                missed_kpis = result.missed_kpi_ids
                all_kpi_ids = [k.id for k in kpi_objects]
                passed_ids = [kid for kid in all_kpi_ids if kid not in missed_kpis]
                
                passed_text = ", ".join(passed_ids)
                missed_text = ", ".join(missed_kpis)
                
                original_text = node.get('content_md', '')
                
                context_prompt = f"""
                TOTO JE NÁPRAVNÁ LEKCE (REMEDIAL).
                Student selhal v oblastech: {missed_text}.
                Student již ÚSPĚŠNĚ ovládá: {passed_text}.
                
                ZDROJOVÝ MATERIÁL (Původní lekce):
                ---
                {original_text[:6000]}
                ---
                
                INSTRUKCE PRO GENEROVÁNÍ OBSAHU:
                1. VYTVOŘ NOVOU, UPRAVENOU VERZI původní lekce.
                2. ZKRAŤ nebo úplně VYNECH vysvětlení konceptů, které student už zná ({passed_text}). Zmiň je jen pro kontext.
                3. DO HLOUBKY ROZVEĎ a zjednoduš vysvětlení toho, co studentovi chybělo ({missed_text}).
                4. Použij jiné analogie a příklady než v původním textu, aby to student lépe pochopil.
                5. Cílem je, aby student pochopil hlavně to, co minule nezvládl.
                """
                

                
                content = await cont_agent.generate_content(ContentInput(
                    node_title=remedial_topic,
                    node_context=context_prompt,
                    depth_level=parent_depth,
                    style_level="ADVANCED",
                    is_remedial=True
                ))
                
                db_service.client.table("nodes").update({
                    "content_md": content.content_markdown,
                    "kpis": [k.model_dump() for k in content.kpis]
                }).eq("id", new_node_id).execute()
                
                # 4. Extract & Save Concepts for Highlighting (Immediately available)
                try:
                    concept_extraction_prompt = ChatPromptTemplate.from_messages([
                        ("system", """
                        Jsi expert na extrakci znalostí.
                        Analyzuj tento vzdělávací text a vyextrahuj klíčové pojmy (Concepts), které jsou v textu definovány nebo vysvětleny.
                        
                        Cíl: Umožnit studentovi vidět tyto pojmy zvýrazněně.
                        
                        Výstupní formát JSON:
                        {
                          "concepts": [
                            {
                              "term": "Název pojmu",
                              "definition": "Stručná definice (1 věta) dle kontextu",
                              "category": "TERM" | "PERSON" | "THEORY" | "SKILL"
                            }
                          ]
                        }
                        
                        Pouze důležité vzdělávací pojmy (ne obecná slova).
                        """),
                        ("user", content.content_markdown)
                    ])
                    
                    # Using JSON parser
                    concept_chain = concept_extraction_prompt | llm_smart | JsonOutputParser()
                    concept_data = await concept_chain.ainvoke({})
                    
                    extracted_concepts = concept_data.get("concepts", [])
                    
                    if extracted_concepts:
                        records = [{
                            "user_id": str(request.user_id),
                            "node_id": new_node_id,
                            "term": c["term"],
                            "definition": c["definition"],
                            "category": c.get("category", "TERM").upper()
                        } for c in extracted_concepts]
                        
                        db_service.client.table("saved_concepts").insert(records).execute()
                        
                except Exception as e:
                    print(f"Warning: Failed to extract concepts for remedial node: {e}")
                
            except Exception as e:
                 print(f"Failed to generate remedial content: {e}")

        return {
            "status": "failed",
            "score": result.score,
            "feedback": result.feedback,
            "new_level": new_level,
            "remedial_node_id": new_node_id
        }

@router.post("/deepen_node")
async def deepen_node(
    request: DeepenNodeRequest,
    cont_agent: ContentAgent = Depends(get_content_agent)
):
    node = await db_service.get_node(request.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    try:
        current_content = node.get('content_md', '')
        prompt = ""

        if request.mode == "TUNING":
            instructions = []
            
            # 1. Technical Channel
            tech = request.tuning.get("TECHNICAL")
            if tech and (tech.depth != 0 or tech.breadth != 0):
                d, b = tech.depth, tech.breadth
                instr = "CHANNEL [TECHNICAL]:\n"
                if d > 0: instr += f"- INCREASE MATH/LOGIC DEPTH (+{d}/5): Add proofs, formulas, rigorous definitions.\n"
                elif d < 0: instr += f"- SIMPLIFY LOGIC ({d}/5): Less jargon, more intuition.\n"
                if b > 0: instr += f"- EXPAND TECH SCOPE (+{b}/5): Cover edge cases, implementation details.\n"
                instructions.append(instr)

            # 2. Context Channel
            ctx = request.tuning.get("CONTEXT")
            if ctx and (ctx.depth != 0 or ctx.breadth != 0):
                d, b = ctx.depth, ctx.breadth
                instr = "CHANNEL [CONTEXT/HISTORY]:\n"
                if d > 0: instr += f"- DEEPEN HISTORY (+{d}/5): Detailed analysis of origins and evolution.\n"
                if b > 0: instr += f"- WIDEN CONTEXT (+{b}/5): Connect to society, personalities, era.\n"
                instructions.append(instr)

            # 3. Concepts Channel
            con = request.tuning.get("CONCEPTS")
            if con and (con.depth != 0 or con.breadth != 0):
                d, b = con.depth, con.breadth
                instr = "CHANNEL [CONCEPTS]:\n"
                if b > 0: instr += f"- ADD RELATED CONCEPTS (+{b}/5): Create a web of knowledge. More terms.\n"
                if d > 0: instr += f"- DEFINE RIGOROUSLY (+{d}/5): Deep dive into definitions.\n"
                instructions.append(instr)

            if not instructions:
                instructions.append("No specific tuning changes. Just enhance quality slightly.")

            prompt = f"""
            ACT AS AN ADAPTIVE KNOWLEDGE ENGINE.
            TASK: REWRITE and EVOLVE the content based on MULTI-DIMENSIONAL TUNING PARAMETERS.
            
            ACTIVE TUNING CHANNELS:
            {chr(10).join(instructions)}
            
            GENERAL INSTRUCTIONS:
            1. Integrate ALL active channel instructions into a cohesive text.
            2. If 'Technical' is high, use LaTeX and formal logic.
            3. If 'Context' is high, weave in history.
            4. Structure with headers to separate or integrate these layers as appropriate.
            """
        else:
            prompts = {
                "GENERAL": "ACT AS AN ELITE ACADEMIC EDITOR. ITERATIVELY EXPAND and DEEPEN everything.",
                "TECHNICAL": "ACT AS A PHYSICIST. Focus on MATH and LOGIC.",
                "CONTEXT": "ACT AS A HISTORIAN. Focus on HISTORY and PEOPLE.",
                "CONCEPTS": "ACT AS AN ENCYCLOPEDIA. Focus on CONNECTIONS."
            }
            prompt = prompts.get(request.mode, prompts["GENERAL"])

        expansion_context = f"""
        {prompt}
        
        INPUT CONTENT TO MODIFY:
        {current_content[:8000]} 
        """ 
        
        new_content = await cont_agent.generate_content(ContentInput(
            node_title=node['title'] + f" (Tuned)",
            node_context=expansion_context,
            depth_level=10, 
            style_level="EXPERT",
            is_tuning=True
        ))

        db_service.client.table("nodes").update({
            "content_md": new_content.content_markdown,
            "kpis": [k.model_dump() for k in new_content.kpis]
        }).eq("id", str(request.node_id)).execute()

        return {
            "status": "deepened",
            "content": new_content.content_markdown
        }

    except Exception as e:
        print(f"Deepening failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
