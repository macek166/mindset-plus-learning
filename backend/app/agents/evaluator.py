from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from ..core.llm import llm_smart
from ..models.agent_models import EvaluatorInput, EvaluatorOutput, KPI, Concept

class EvaluatorAgent:
    def __init__(self):
        self.llm = llm_smart
        self.parser = PydanticOutputParser(pydantic_object=EvaluatorOutput)

    async def evaluate(self, input_data: EvaluatorInput) -> EvaluatorOutput:
        
        # Serialize KPIs for prompt
        kpis_text = "\n".join([f"- [{k.id}] {k.description} ({k.importance})" for k in input_data.kpis])
        
        system_prompt = """Jsi vnímavý a spravedlivý akademický mentor (Evaluator).
Tvým úkolem je ohodnotit uživatelovu esej "Active Recall" na základě zdrojového materiálu.

Zdrojový text (Pravda):
---
{original_content}
---

Požadovaná KPI (Musí pokrýt):
{kpis}

Uživatelova Esej:
---
{user_essay}
---

Instrukce:
1. Porovnej esej se zdrojem.
2. Rozhodni, zda uživatel PROŠEL (cover most essential KPIs).
3. Uděl skóre (0-100). (Méně než 60 = Fail).
4. Napiš konstruktivní zpětnou vazbu v ČEŠTINĚ. Co chybí? Co je dobře?
5. Vyextrahuj "Koncepty" (Pojmy), které uživatel ZMÍNIL a správně DEFINOVAL.
   - Pro každý koncept uveď termín ("term") a krátkou definici ("definition").
   - Status konceptu: Pokud ho uživatel chápe -> 'MASTERED'. Pokud ho jen zmínil ale nechápe -> 'DISCOVERED'.
6. Vygeneruj 'semantic_embedding_text' (shrnutí toho co uživatel UMÍ).
7. Pokud neprošel, navrhni 'suggested_remedial_topic' (téma na doučení).

DŮLEŽITÉ ZÁSADY HODNOCENÍ:
- **Ve ZPĚTNÉ VAZBĚ (`feedback`) NIKDY NEPOUŽÍVEJ slova jako "KPI", "body", "id".** Mluv přirozeně jako učitel (např. "Chybělo vysvětlení principu X...", "Pěkně jsi vystihl...").
- Buď BENEVOLENTNÍ k přesné terminologii. Akceptuj synonyma a vlastní slova, pokud sedí logika.
- **NEPENALIZUJ za informace NAVÍC.** Pokud uživatel zmíní koncepty, které v textu nebyly, ale jsou k tématu relevantní a správné, je to PLUS (nebo neutrální), nikoliv chyba.
- **IGNORUJ úvod, závěr a kontextovou omáčku.** Hodnotí se pouze to, zda uživatel POKRYL a POCHOPIL klíčové koncepty a fakta. Pokud vysvětlí jádro věci, dej 100%.
- Hledej pochopení "proč" a "jak", ne jen memorování.

Formát výstupu (JSON):
{format_instructions}
"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "Ohodnoť esej.")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = await chain.ainvoke({
                "original_content": input_data.original_content,
                "kpis": kpis_text,
                "user_essay": input_data.user_essay,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error in Evaluator Agent: {e}")
            # Fallback
            return EvaluatorOutput(
                passed=False,
                score=0,
                feedback="Chyba při hodnocení.",
                missed_kpi_ids=[],
                semantic_embedding_text="Error",
                suggested_remedial_topic="Opakování",
                extracted_concepts=[]
            )
