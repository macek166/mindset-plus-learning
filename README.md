# Mindset+ (MindLoop) - Autonomous Deliberate Practice Platform

> ⚠️ **Upozornění:** Tento projekt je aktuálně ve fázi aktivního vývoje (Work in Progress). Funkcionality se mohou měnit a rozšiřovat.

Mindset+ (interně MindLoop) je inovativní vzdělávací platforma navržená pro efektivní a autonomní učení pomocí principů **Deliberate Practice** (záznamového učení) a **Spaced Repetition** (rozloženého opakování). Systém funguje jako váš osobní AI tutor, který dynamicky generuje učební osnovy, testuje vaše znalosti, vyhodnocuje vaše pochopení a na základě chyb vytváří personalizované doučování.

## 🚀 Hlavní funkce a jak to funguje

Platforma propojuje pokročilé AI agenty s interaktivním uživatelským rozhraním.

### 1. Vizualizace znalostí (Learning Curriculum)
Cesta za vaším vzdělávacím cílem je vizualizována jako interaktivní mapa (graf uzlů). Vidíte, kde začínáte, jakými milníky musíte projít a jaké jsou prerekvizity (co se musíte naučit, než půjdete dál).

### 2. Dynamické generování obsahu (Content Agent)
Lekce nejsou statické. Jsou generovány AI (*Content Agent*) jako čtivé příběhy s důrazem na logické souvislosti (příčina -> následek). 
Můžete si dokonce upravit, jakým směrem se chcete učit pomocí **Knowledge Tuneru** (chcete více technického textu, historického kontextu, nebo provázat s více koncepty? AI lekci okamžitě uprostřed výuky přepracuje).

### 3. Aktivní testování znalostí (Active Recall)
Po přečtení látky se nespouští klasický kvíz. Namísto toho vás čeká *Active Recall*, kdy musíte vlastními slovy napsat esej o tom, co jste se právě dozvěděli. Vaším úkolem je vysvětlit koncepty tak, abyste dokázali, že je skutečně chápete.

### 4. Inteligentní evaluace a skórování (Evaluator Agent)
Vaši odpověď zhodnotí speciální *Evaluator Agent*. Ten nehledá jen přesná slova, ale posuzuje sémantické pochopení "jak" a "proč". Akceptuje synonyma a přísně hlídá, zda jste pokryli klíčové myšlenky (KPI). Odpouští "omáčku", ale je nekompromisní na faktickou podstatu.

### 5. Nápravné smyčky (Remedial Loop)
Pokud v testu selžete, platforma vás nenechá jít dál. Místo toho vytvoří tzv. **Remedial Node (Doučování)**. AI vygeneruje zcela novou, zjednodušenou lekci z jiného úhlu pohledu, která se zaměřuje **pouze na to, co jste nepochopili**, a přeskočí to, co už znáte. Doučovací test pak musíte zvládnout bezchybně.

### 6. Spaced Repetition (Rozložené opakování) a Knowledge Base (Pojmy)
Když látku zvládnete napoprvé, nebo po doučovací fázi, uzel se zamkne a spustí se odpočet do dalšího opakování. Čím lépe látku znáte, tím delší je interval (1 den, 4 dny, 7 dní...). Jakmile zvládnete úroveň mistrovství, systém navíc extrahuje klíčové pojmy do vaší osobní databáze znalostí (Knowledge Base) pro trvalé uchování vědomostí.

---

## 🛠️ Pod kapotou (Architektura)

Projekt využívá moderní tech stack k dosažení plynulého uživatelského zážitku a komplexní integrace LLM řízení:

- **Frontend:** Next.js 14, React, Tailwind CSS, Shadcn/UI pro čistý design. React Flow (`@xyflow/react`) pro mapu cílů, Lucide pro vizuální ikony.
- **Backend:** Python + FastAPI pro bleskově rychlé API a asynchronní endpointy. Pydantic pro datové modely.
- **AI Vrstva:** LangChain a dedikovaní agenti (Evaluator, Content Planner). Napojení na pokročilé modely (OpenAI) a v plánu využití MCP (Model Context Protocol).
- **Databáze:** Supabase (správa stavů, progressu, relace stromové struktury vědění).

---

## 💻 Rychlý start (Pro vývojáře)

### Prerekvizity
- Python 3.10+
- Node.js 18+
- Supabase Projekt (Free tier je dostačující)
- OpenAI API Key

### Vytvoření proměnných prostředí

**Backend (`backend/.env`)**:
Vytvořte kopii `.env.example` a vyplňte:
- `SUPABASE_URL`: URL adresa Supabase projektu.
- `SUPABASE_KEY`: Service Role Key ze Supabase (pro oprávnění backendu).
- `OPENAI_API_KEY`: Klíč k OpenAI službě.

**Frontend (`frontend/.env.local`)**:
- `NEXT_PUBLIC_SUPABASE_URL`: Taktéž Supabase URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key ze Supabase (pro klientský přístup).
- `NEXT_PUBLIC_API_URL`: Zpravidla `http://localhost:8001/api/v1` pro vývojové účely.

### Spuštění Backendu
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Spuštění Frontendu
```bash
cd frontend
npm install
npm run dev -p 3005
```

Aplikace bude poté bežet na `http://localhost:3005`.

---
*Vybudováno s vizí urychlit lidské učení skrze neúnavou technologickou podporu a laskavý mentoring umělé inteligence.*
