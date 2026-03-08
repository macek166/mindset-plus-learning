from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from ..core.llm import llm_smart
from ..models.agent_models import ContentInput, ContentOutput, KPI

class ContentAgent:
    def __init__(self):
        self.llm = llm_smart
        self.parser = PydanticOutputParser(pydantic_object=ContentOutput)

    async def generate_content(self, input_data: ContentInput) -> ContentOutput:
        
        system_prompt_standard = """Jsi expert na tvorbu vzdělávacích materiálů.
Tvým úkolem je vytvořit vysoce kvalitní učební lekci na téma "{title}".

Jazyk: ČEŠTINA
Úroveň: {style_level}
Kontext: {context}

KRITICKY DŮLEŽITÉ - STYL VYPRÁVĚNÍ:
- **Piš jako PŘÍBĚH**, ne jako seznam faktů.
- **KAUZALITA A NÁVAZNOST**: Vysvětli, CO vedlo k ČEM. "Díky tomu...", "To umožnilo...", "V důsledku čeho..."
- **DETERMINISTICKÝ DĚJ**: Důsledně propojuj, jak jeden koncept vyplývá z druhého. Zachycuj logický postup myšlenky nebo objevu.
- **SPOJITÝ TEXT**: Vyhýbej se bodům izolovaným od sebe. Vytvářej plynulé odstavce, kde každá věta navazuje na předchozí.

Instrukce ke struktuře a obsahu:
1. **ÚVOD - Historie a Motivace**: 
   - Začni PŘÍBĚHEM. Kdo, kdy, proč? Jaký byl problém nebo otázka?
   - Uveď čtenáře do kontextu tak, aby pochopil, PROČ téma vzniklo.

2. **VÝVOJ A MECHANISMY (Hlavní tělo)**:
   - Vysvětli JAK to funguje, ale jako ŘETĚZ PŘÍČIN A NÁSLEDKŮ.
   - Např.: "Einstein si uvědomil X, což ho dovedlo k myšlence Y. Z toho vyplynulo Z..."
   - Použi technické pojmy, ale vždy je zasaď do kontextu a vysvětli, proč jsou důležité.
   - Propojuj teorie s praxí: "Tato rovnice znamenala, že... Což v praxi vedlo k..."

3. **KLÍČOVÉ POJMY (Koncepty)**:
   - Definice by měly být součástí narativu, ne izolované definice.
   - Např. místo "Foton: částice světla" raději: "Světlo se ukázalo být proudem částic - fotonů - což vysvětlovalo, proč..."

4. **ZÁVĚR - Důsledky a Kontext**:
   - Shrň, kam tento koncept vedl, jak změnil náš pohled.
   - "Díky tomuto objevu dnes..."

Zdroje informací (dle úrovně):
- Pokud je úroveň BASIC: Vysvětluj jednodušeji, ale stále příběhově. Vycházej ze stylu populárně-naučných knih.
- Pokud je úroveň ADVANCED/EXPERT: Přesné definice, ale vždy v kontextu evoluce myšlenky. Cituj studenty, myslitele, experimenty.

Výstup:
- Markdown formát (používej # ##, **tučné**, odrážky POUZE pro strukturu, ne pro samotný obsah).
- Vyextrahuj 3-5 KPI (Klíčové znalosti), na které se budeme uživatele ptát.
- **DŮLEŽITÉ PRO KPI**: Generuj KPI **POUZE** z obsahu, který jsi v tomto kroku podrobně vysvětlil. NEGENERUJ KPI pro témata, která byla zmíněna jen povrchně jako kontext (to, co student už umí). Následný test musí ověřovat jen tuto novou/opravnou látku.
- Pokud možno, uveď relevantní odkazy (do pole citations).

Formát výstupu (JSON):
{format_instructions}
"""

        system_prompt_remedial = """Jsi expert na cílené doučování a vysvětlování chybějících znalostí.
Tvým úkolem je vytvořit nápravný materiál na téma "{title}".
Jazyk: ČEŠTINA
Úroveň: {style_level}
Kontext a Instrukce: {context}

STRUKTURA A ZÁSADY PRO DOUČOVÁNÍ (REMEDIAL):
1. **ŽÁDNÝ ÚVOD ANI ZÁVĚR**:
   - PŘESKOČ úvodní fázi, historii i motivaci (pokud nejsou předmětem chyby).
   - PŘESKOČ závěrečná shrnutí.
   - Jdi OKAMŽITĚ K VĚCI.

2. **VÝHRADNÍ FOKUS NA CHYBĚJÍCÍ KONCEPTY**:
   - Obsah musí být 100% zaměřen na pojmy, teorie, jména a myšlenky, které student nepochopil (dle kontextu).
   - Nevysvětluj znovu to, co student už umí (to je v kontextu jen pro orientaci).
   - Pro každý chybějící koncept poskytni:
     - Jasnou definici.
     - Vysvětlení "Proč" a "Jak".
     - Konkrétní příklad nebo analogii.

3. **FORMA**:
   - Hutný, informacemi nabitý text.
   - Žádná vata.
   - Můžeš použít přímější strukturu (odstavce zaměřené na konkrétní chyby).

Výstup:
- Markdown formát.
- Vyextrahuj 3-5 KPI POUZE z tohoto nového vysvětlení (toho co chybělo).
- DŮLEŽITÉ: Následný test bude ověřovat pouze tyto body.

Formát výstupu (JSON):
{format_instructions}
"""
        
        system_prompt_tuning = """Jsi pokročilý editor a expert na adaptaci učiva (Content Tuner).
Tvým úkolem je PŘEPRACOVAT a VYLEPŠIT poskytnutý text na téma "{title}" přesně podle zadaných parametrů ladění.

Jazyk: ČEŠTINA
Úroveň: {style_level}

ZDROJE A INSTRUKCE (V KONTEXTU):
{context}
(Obsahuje: "ACTIVE TUNING CHANNELS" a "INPUT CONTENT TO MODIFY")

INSTRUKCE PRO EDITACI:
1. PŘEPRACOVÁNÍ: Vezmi zdrojový text a přepiš ho tak, aby reflektoval nové požadavky (např. přidej matematickou hloubku, historický kontext, nebo více příkladů).
2. INTEGRACE: Nové vrstvy informací (např. vzorce, data) musí být organicky zapojeny do textu. Nelep je jen na konec.
3. STYL: Udržuj vysoce kvalitní, čtivý a odborný styl (dle úrovně).
4. KPI: Aktualizuj klíčové body (KPI), pokud se obsah výrazně posunul.
Výstup:
- Markdown formát.
- Kompletní, vylepšený text lekce.

Formát výstupu (JSON):
{format_instructions}
"""

        if getattr(input_data, 'is_tuning', False):
             selected_prompt = system_prompt_tuning
        elif getattr(input_data, 'is_remedial', False):
             selected_prompt = system_prompt_remedial
        else:
             selected_prompt = system_prompt_standard

        prompt = ChatPromptTemplate.from_messages([
            ("system", selected_prompt),
            ("user", "Vygeneruj obsah lekce.")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = await chain.ainvoke({
                "title": input_data.node_title,
                "context": input_data.node_context or "General Knowledge",
                "style_level": input_data.style_level,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error in Content Agent: {e}")
            # Fallback
            return ContentOutput(
                title=input_data.node_title,
                content_markdown=f"# {input_data.node_title}\n\n*Chyba generování obsahu.*",
                kpis=[KPI(id="kpi_err", description="Chyba služby", importance="essential")]
            )
