# MindLoop - Quick Start Guide

## 🚀 Lokální Testování (Doporučeno)

### Krok 1: Supabase Setup

1. **Vytvoř Supabase projekt** na [supabase.com](https://supabase.com)
2. **Spusť schema**:
   - Přejdi na `SQL Editor`
   - Zkopíruj obsah `backend/database/schema.sql`
   - Klikni na `RUN`
3. **Získej credentials**:
   - Settings → API
   - Zkopíruj `Project URL` a `anon public` key

### Krok 2: Environment Variables

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://tvuj-projekt.supabase.co
SUPABASE_KEY=tvuj_service_role_key
OPENAI_API_KEY=sk-xxx  # Nepovinné pro MVP
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvuj_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Krok 3: Seed Demo Data

**Varianta A - SQL** (Jednodušší):
```bash
# V Supabase SQL Editor spusť:
backend/database/seed_demo.sql
```

**Varianta B - Python Script**:
```bash
cd backend
python scripts/seed_demo.py
```

### Krok 4: Spuštění

**Terminal 1 - Backend**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
📍 API běží na: `http://localhost:8000/docs`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```
📍 App běží na: `http://localhost:3000`

---

## 🎯 Co Můžeš Testovat

### 1. **Learning Graph**
- Otevři `http://localhost:3000`
- Uvidíš 3 uzly: ✅ DONE → 🟦 OPEN → 🔒 LOCKED
- Klikni na **OPEN uzel** (useEffect Dependencies)

### 2. **Study Mode**
- Přečti si Markdown obsah s code examples
- Klikni **"Start Active Recall Test"**

### 3. **Active Recall Test**
- Napiš esej (min 20 znaků pro pass podle mock logiky)
- Submit → uvidíš AI feedback
- **Pass**: Uzel se unlock
- **Fail**: Vytvoří se "remedial" detour node

### 4. **Create New Goal**
- Klikni **"+ New Goal"** vpravo nahoře
- Vyplň: "Learn TypeScript", Type: KNOWLEDGE
- Submit → AI vygeneruje 3-node curriculum

---

## 🔧 Troubleshooting

### Backend nespadne, ale nevrací data?
```bash
# Zkontroluj Supabase RLS
# Jelikož používáš Service Role Key, RLS by měl být bypassed
# Ověř, že SUPABASE_KEY je Service Role, ne Anon key
```

### Frontend neukazuje nodes?
```bash
# Otevři Browser Console (F12)
# Zkontroluj Supabase errory
# Ověř, že .env.local má správné keys
```

### Port 8000 nebo 3000 jsou obsazené?
```bash
# Backend na jiném portu:
uvicorn app.main:app --reload --port 8001

# Frontend na jiném portu:
npm run dev -- -p 3001
```

---

## 📊 Demo Data Overview

Po seednutí máš:

**Goal**: "Master React Hooks"

**Nodes**:
1. ✅ **useState Basics** (DONE)
   - Content: Základy useState
   - KPIs: 2 koncepty
   
2. 🟦 **useEffect Dependencies** (OPEN)
   - Content: Dependency array patterns
   - KPIs: 3 koncepty
   - **← Začni tady!**
   
3. 🔒 **useReducer** (LOCKED)
   - Odemkne se po completion Node 2

---

## 🎨 Customizace

### Změň Seed Data
Edituj `backend/database/seed_demo.sql`:
- Změň goal title/type
- Přidej vlastní markdown obsah
- Uprav KPIs

### Uprav Evaluator Logic
V `backend/app/api/endpoints/evaluate.py`:
```python
class MockEvaluatorAgent:
    async def evaluate(self, input_data: EvaluatorInput):
        # Změň pass/fail logiku zde
        passed = len(input_data.user_essay) > 20
```

---

## ✅ Checklist před prvním spuštěním

- [ ] Supabase projekt vytvořen
- [ ] `schema.sql` spuštěn v SQL Editor
- [ ] `seed_demo.sql` spuštěn
- [ ] Backend `.env` vyplněn
- [ ] Frontend `.env.local` vyplněn
- [ ] Backend běží na :8000
- [ ] Frontend běží na :3000
- [ ] V browseru vidím Graf s 3 uzly

---

**Úspěch?** 🎉 Máš funkční MindLoop MVP!

**Problémy?** Pošli error z console a pomůžu debugovat.
