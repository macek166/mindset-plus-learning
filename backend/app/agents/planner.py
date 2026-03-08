from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from ..core.llm import llm_smart
from ..models.agent_models import PlannerInput, PlannerOutput, MilestoneNode

class PlannerAgent:
    def __init__(self):
        self.llm = llm_smart
        self.parser = PydanticOutputParser(pydantic_object=PlannerOutput)

    async def plan(self, input_data: PlannerInput) -> PlannerOutput:
        
        system_prompt = """Jsi expert na tvorbu vzdělávacích osnov (Curriculum Designer).
Tvým úkolem je vytvořit strukturovaný vzdělávací plán pro uživatele v Českém jazyce.

Kontext:
- Uživatel se chce naučit: "{goal}"
- Kontext/Pozadí uživatele: "{description}"
- Typ cíle: {type} (SKILL = praktické dovednosti, KNOWLEDGE = teoretické znalosti)
- Požadovaná úroveň: {level}

Instrukce pro úrovně:
- BASIC (Základní): Vycházej z obecných zdrojů (Wikipedia). Struktura má být přehledná, jednoduchá. 3-5 milníků.
- ADVANCED (Pokročilá): Detailnější rozpis, odborné pojmy. 5-7 milníků. Důraz na přesnost.
- EXPERT (Expert): Vycházej z akademických zdrojů (Wikiscripta, vědecké články). Důraz na mechanismy, hluboké detaily. 5-7 milníků.

Instrukce k výstupu:
1. Rozděl cíl do logické sekvence milníků (uzlů).
2. První milník musí být 'Foundational' (Základy).
3. Poslední milník musí být 'Mastery' (Aplikace/Syntéza).
4. Pro každý milník uveď 'title' (název) a 'description' (popis toho, co se bude probírat) - VŠE V ČEŠTINĚ.
5. Odhadni 'estimated_difficulty' (1-10).

Formát výstupu (JSON):
{format_instructions}
"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "Vytvoř plán.")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = await chain.ainvoke({
                "goal": input_data.goal_title,
                "description": input_data.goal_description,
                "type": input_data.goal_type,
                "level": input_data.level,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error in Planner Agent: {e}")
            # Fallback
            return PlannerOutput(
                plan_explanation="Automatické generování selhalo. Používám záložní plán.",
                milestones=[
                    MilestoneNode(title=f"{input_data.goal_title} - Základy", description="Úvod do problematiky a klíčové pojmy.", estimated_difficulty=2),
                    MilestoneNode(title=f"{input_data.goal_title} - Praxe", description="Aplikace získaných znalostí.", estimated_difficulty=5)
                ]
            )
