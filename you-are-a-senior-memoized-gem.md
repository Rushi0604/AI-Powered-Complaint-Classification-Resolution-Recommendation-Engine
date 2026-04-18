# TS-14 — AI-Powered Complaint Classification & Resolution Engine

**Hackathon:** Lakshya 2.0, LDCE — Haastra (24-Hour) | **Problem Owner:** Dev IT Limited
**Stack (finalized):** Next.js (latest stable, 15.x+) + **Python 3.11 + Flask (API + AI)** + SQLite
**Every service below has a zero-cost tier (student-friendly). No credit card, no billing surprises.**
**Rubric (100):** Innovation 25 · Tech Complexity 25 · Problem Relevance 20 · Demo 15 · Code Quality 10 · **Checkpoint Progress 5**
**Non-negotiables:** (1) **No bulk commits** — commit history is graded. (2) **Real AI/ML classification** — no static rule-based mapping.

> **This plan is optimized for AI coding agents (Claude Code, Cursor, Aider).** Every task has a unique ID, explicit file paths, acceptance commands the agent can run to self-verify, and a Conventional-Commit message template. Contracts (DB schema, API shapes, LLM JSON schema, prompt template) are defined *once* in Section 4 so the agent has a single source of truth and never has to guess field names.

---

## 1. Context

Wellness-business customer complaints arrive via call center, email, and direct channels. Manual triage causes SLA breaches and inconsistent categorization. We're building a 24-hour demoable system: **ingest complaint → AI classifies → priority tag → resolution recommendation → lifecycle tracking with SLA clocks on a real-time dashboard**.

Target outcome: a clickable live demo + clean commit history + strong AI story for judges.

---

## 2. Project Understanding

### Core objectives (P0 demo-blockers)
1. Accept complaint text (form / paste / mocked email-call JSON).
2. AI-classify into **Product / Packaging / Trade** (extensible).
3. Assign priority **High / Medium / Low** from urgency + impact.
4. Recommend 2–3 concrete resolution steps.
5. Persist ticket, render dashboard with counts + charts + SLA-at-risk.
6. Track lifecycle (Open → In Progress → Resolved) with timeline.
7. SLA due-at timestamp per ticket, color-coded badge.

### Personas (drive UI surfaces)
- **Customer Support Executive** — submits, views AI result, follows resolution, updates status.
- **QA Team** — reviews categorization accuracy, spots trends.
- **Operations Manager** — monitors dashboard KPIs, SLA compliance.

### Out of scope (v1)
Auth, multi-tenant, real call/email ingestion, model fine-tuning, mobile app, notifications.

---

## 3. Assumptions

- External `supportTickets` endpoint + Bearer token provided at go-time; `api/app/services/external_tickets.py` wraps it — one env var flip switches between external and local mode.
- **LLM uses Google Gemini API (free tier)** — no credit card, instant sign-up at [aistudio.google.com](https://aistudio.google.com). Fallback keyword classifier kicks in automatically on LLM failure — demo never dies.
- All services chosen are free for students: Gemini (free tier), Groq (free tier, backup), Ollama (fully local, offline insurance), GitHub (free), Vercel (free hobby), Render (free instance).
- SLA hours by priority: **High=4h, Medium=12h, Low=24h** (configurable in `api/app/config.py`).
- Team size: **3 developers** (BE / FE / Full-stack).
- Judges will inspect the commit log → every commit is atomic and conventionally messaged.

---

## 4. Contracts (Single Source of Truth)

**Every task below builds against these contracts. Do not deviate without updating this section first.**

### 4.1 Repository layout
```
/
├── web/                          # Next.js (latest stable, 15.x+) app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # landing → redirect to /dashboard
│   │   ├── submit/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── tickets/[id]/page.tsx
│   │   └── dashboard/page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn primitives
│   │   ├── ComplaintForm.tsx
│   │   ├── AIResultCard.tsx
│   │   ├── TicketsTable.tsx
│   │   ├── SlaBadge.tsx
│   │   ├── KpiCard.tsx
│   │   ├── CategoryPie.tsx
│   │   ├── PriorityBar.tsx
│   │   ├── StatusTimeline.tsx
│   │   ├── Sidebar.tsx
│   │   └── EmptyState.tsx
│   ├── lib/
│   │   ├── apiClient.ts          # thin fetch wrapper, BASE_URL from env
│   │   ├── types.ts              # TS types mirroring Pydantic schemas
│   │   └── swrConfig.ts
│   ├── .env.local.example
│   ├── package.json
│   └── tsconfig.json
├── api/                          # Flask backend
│   ├── app/
│   │   ├── __init__.py           # create_app() factory
│   │   ├── config.py             # env-driven config
│   │   ├── extensions.py         # db, cors init
│   │   ├── models.py             # SQLAlchemy: Complaint, StatusLog, LlmCache
│   │   ├── schemas.py            # Pydantic v2: request/response DTOs
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── complaints.py     # CRUD + list + detail + patch
│   │   │   ├── stats.py          # aggregates
│   │   │   ├── sync.py           # external API import
│   │   │   └── health.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── llm.py            # classify_complaint(text, channel) -> dict
│   │       ├── prompts.py        # SYSTEM_PROMPT constant
│   │       ├── fallback_classifier.py
│   │       ├── sla.py            # compute_sla_due_at(priority, created_at)
│   │       ├── cache.py          # sha256-keyed LLM cache
│   │       └── external_tickets.py
│   ├── tests/
│   │   ├── test_llm.py
│   │   ├── test_sla.py
│   │   ├── test_fallback.py
│   │   └── test_routes.py
│   ├── scripts/
│   │   └── seed.py               # inserts 30 realistic complaints
│   ├── .env.example
│   ├── requirements.txt
│   ├── run.py                    # entrypoint: flask run
│   └── pyproject.toml            # ruff + black config
├── docs/
│   ├── prompt-contract.md        # pasted copy of Section 4.4
│   ├── api.md                    # pasted copy of Section 4.3
│   └── architecture.md           # diagram + flow description
├── .husky/                       # commit-msg + pre-commit hooks (for web/)
├── .commitlintrc.json
├── .pre-commit-config.yaml       # ruff + black for api/
├── .gitignore
└── README.md
```

### 4.2 Database schema (SQLAlchemy, SQLite)

**Table: `complaints`**
| Column | Type | Constraints |
|---|---|---|
| id | Integer | PK, autoincrement |
| text | Text | NOT NULL |
| channel | String(16) | NOT NULL, in (`email`, `call`, `direct`) |
| category | String(32) | nullable, in (`Product`, `Packaging`, `Trade`) |
| priority | String(8) | nullable, in (`High`, `Medium`, `Low`) |
| confidence | Float | nullable, 0.0–1.0 |
| reasoning | Text | nullable |
| recommendation | Text | nullable, stores JSON array as string |
| status | String(16) | NOT NULL, default `open`, in (`open`, `in_progress`, `resolved`) |
| sla_due_at | DateTime | NOT NULL |
| text_hash | String(64) | indexed, sha256 of text (cache key) |
| classifier | String(16) | NOT NULL, in (`llm`, `fallback`) |
| created_at | DateTime | NOT NULL, default now |
| updated_at | DateTime | NOT NULL, onupdate now |

**Table: `status_logs`**
| Column | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| complaint_id | Integer | FK → complaints.id, indexed |
| from_status | String(16) | nullable |
| to_status | String(16) | NOT NULL |
| note | Text | nullable |
| created_at | DateTime | NOT NULL, default now |

**Table: `llm_cache`**
| Column | Type | Constraints |
|---|---|---|
| text_hash | String(64) | PK |
| response_json | Text | NOT NULL |
| created_at | DateTime | NOT NULL |

### 4.3 API endpoints

All responses use the envelope: `{ "ok": bool, "data": <payload> | null, "error": <string> | null }`.

| Method | Path | Request body | 200 `data` |
|---|---|---|---|
| POST | `/api/complaints` | `{ text: str, channel: str }` | `Complaint` |
| GET | `/api/complaints` | query: `category`, `priority`, `status`, `page=1`, `limit=20` | `{ items: Complaint[], total: int, page: int, limit: int }` |
| GET | `/api/complaints/<id>` | — | `{ complaint: Complaint, status_logs: StatusLog[] }` |
| PATCH | `/api/complaints/<id>` | `{ status: str, note?: str }` | `Complaint` |
| GET | `/api/complaints/stats` | — | `{ total, by_category, by_priority, by_status, sla_at_risk, avg_resolution_hours, daily_counts }` |
| POST | `/api/sync` | `{ ticket_id: str }` | `Complaint` |
| GET | `/api/health` | — | `{ llm: bool, db: bool, external: bool }` |

### 4.4 LLM prompt contract (verbatim — paste into `api/app/services/prompts.py`)

```
SYSTEM:
You are a complaint-classification assistant for a wellness-products company.
Classify each complaint into exactly one category and assign a priority.

CATEGORIES (pick one):
- Product: quality, effectiveness, defects, taste/texture, missing ingredients, health reactions.
- Packaging: container damage, broken seal, leakage, transit damage, label errors.
- Trade: B2B/distributor concerns, bulk orders, invoicing, pricing, MRP issues.

PRIORITY RUBRIC:
- High: safety/health risk, VIP or bulk customer, legal/compliance, SLA breach imminent.
- Medium: functional defect, refund-worthy, affects usage but no safety risk.
- Low: cosmetic, minor inconvenience, informational only.

OUTPUT FORMAT — return ONLY this JSON object, no prose before or after:
{
  "category": "Product" | "Packaging" | "Trade",
  "priority": "High" | "Medium" | "Low",
  "confidence": <float 0.0 to 1.0>,
  "reasoning": "<one sentence>",
  "recommendation": ["<actionable step 1>", "<actionable step 2>", "<actionable step 3>"]
}

Recommendations must use concrete action verbs (replace, refund, escalate, dispatch, verify,
notify). Never generic advice like "look into it".

USER:
Channel: {channel}
Complaint:
---
{text}
---
```

**Call parameters (primary — Google Gemini, free tier):**
- Model: `gemini-2.0-flash` (free tier: 15 RPM, 1M tokens/min, 1500 req/day — plenty for a 24h hackathon + demo).
- Python SDK: `google-generativeai` (`pip install google-generativeai`).
- Enable JSON mode: pass `generation_config={"response_mime_type": "application/json", "temperature": 0.2, "max_output_tokens": 400}`.
- Response parsed with Pydantic `LlmClassification` model. Invalid JSON → fallback classifier.

**Backup LLM (if Gemini rate-limits or is blocked on conference wifi):** Groq free tier with `llama-3.3-70b-versatile` (OpenAI-compatible API, `pip install groq`). Set `LLM_PROVIDER=groq` in env to switch — the `llm.py` service reads this and routes accordingly.

**Offline fallback (no internet at venue):** Ollama running `llama3.2:3b` locally (`ollama pull llama3.2:3b`). Set `LLM_PROVIDER=ollama`. Quality lower but zero-network demo works.

**Key acquisition — do this in Hour 0, not Hour 10:**
1. Primary: [aistudio.google.com](https://aistudio.google.com) → "Get API key" → copy into `GEMINI_API_KEY`. Instant, no card.
2. Backup: [console.groq.com](https://console.groq.com) → sign up → API Keys → create → copy into `GROQ_API_KEY`. Instant, no card.
3. Offline: `brew install ollama && ollama pull llama3.2:3b`. Only needed if demo venue has no wifi.

### 4.5 TypeScript types (mirror Pydantic — keep in sync)

`web/lib/types.ts` must export: `Complaint`, `StatusLog`, `Stats`, `ApiResponse<T>`, `Priority`, `Category`, `Status`. Field names identical to DB columns (camelCase on client via key-transform in `apiClient.ts`, or snake_case everywhere — pick one at Hour 2 and stick with it).

### 4.6 Next.js 15+ framework notes (agents must follow)

The web app uses **Next.js latest stable (15.x+)**. These changes from 14.x trip up AI agents trained on older patterns — enforce them in code review:

- **Async dynamic APIs.** In server components `params` and `searchParams` are **Promises**. Always: `const { id } = await params`. Same for `cookies()`, `headers()`, `draftMode()` — all await'd.
  Example shape for `web/app/tickets/[id]/page.tsx`:
  ```
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    ...
  }
  ```
- **Fetch is NOT cached by default** in 15+. To opt in: `fetch(url, { cache: 'force-cache' })` or route-segment `export const dynamic = 'force-static'`. Our API calls are dynamic — leave default (no cache).
- **Route handlers** are also uncached by default — good, matches our needs.
- **Turbopack dev** is default via `next dev --turbopack` (the create-next-app flag sets it).
- **React 19** ships with Next 15+. Use the `use()` hook for unwrapping promises in client components when needed.
- **Do NOT** use legacy sync `params`/`searchParams` access; TypeScript will flag it but runtime warnings are easy to miss.

---

## 5. Task Plan — Atomic, AI-Agent-Executable

**Every task specifies: ID, prerequisites, files, acceptance command, commit message.**
**Rule: one task = one commit (minimum). Do not start TASK-N+1 until TASK-N's acceptance command passes and commit is pushed.**

### Phase 0 — Repository Bootstrap (Hour 0–1)

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-0.1 | — | `README.md`, `.gitignore` | `git log --oneline \| wc -l` ≥ 1 | `chore: initialize repository` |
| T-0.2 | T-0.1 | `.husky/commit-msg`, `.commitlintrc.json`, `web/package.json` (as placeholder) | `echo "bad msg" \| npx commitlint` exits non-zero | `chore: enforce conventional commits with commitlint` |
| T-0.3 | T-0.1 | `.pre-commit-config.yaml`, `api/pyproject.toml` | `pre-commit run --all-files` exits 0 | `chore: add ruff + black pre-commit hooks` |
| T-0.4 | T-0.1 | `docs/architecture.md`, `docs/api.md`, `docs/prompt-contract.md` | Files exist with Section 4 content | `docs: add architecture, api, and prompt contracts` |

### Phase 1 — Backend Skeleton (Hour 1–3) — owner: BE

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-1.1 | T-0.3 | `api/requirements.txt`, `api/run.py`, `api/app/__init__.py`, `api/app/config.py`, `api/app/extensions.py` | `cd api && flask run` serves on :5000, `GET /api/health` returns 200 | `feat(api): scaffold flask app factory and config` |
| T-1.2 | T-1.1 | `api/app/models.py` (Complaint, StatusLog, LlmCache) | `python -c "from app import create_app; from app.extensions import db; app=create_app(); app.app_context().push(); db.create_all()"` creates `api.db` with 3 tables | `feat(api): add sqlalchemy models for complaint, statuslog, llmcache` |
| T-1.3 | T-1.2 | `api/app/schemas.py` (Pydantic DTOs: ComplaintCreate, ComplaintOut, StatusLogOut, StatsOut, LlmClassification, ApiResponse) | `pytest tests/test_schemas.py` passes (round-trip serialize/deserialize) | `feat(api): add pydantic schemas for api contracts` |
| T-1.4 | T-1.1 | `api/app/routes/health.py`, registered in factory | `curl localhost:5000/api/health` returns `{"ok":true,"data":{"llm":false,"db":true,"external":false}}` | `feat(api): add health endpoint` |

### Phase 2 — AI Core (Hour 3–6) — owner: BE

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-2.1 | T-0.4 | `api/app/services/prompts.py` | File contains `SYSTEM_PROMPT` string matching Section 4.4 verbatim | `feat(api): add llm prompt contract` |
| T-2.2 | T-1.3, T-2.1 | `api/app/services/llm.py` (stubbed: returns canned response) | `pytest tests/test_llm.py::test_stub_returns_valid_schema` passes | `feat(api): add llm service skeleton with stubbed response` |
| T-2.3 | T-2.2 | `api/app/services/llm.py` (real Gemini call via `google-generativeai`, parses with Pydantic `LlmClassification`; router reads `LLM_PROVIDER` env to support `gemini` \| `groq` \| `ollama`) | `LLM_LIVE=1 pytest tests/test_llm.py::test_live_classification` passes on 3 sample inputs against Gemini free tier | `feat(api): wire gemini 2.0 flash with groq and ollama routers` |
| T-2.4 | T-2.2 | `api/app/services/fallback_classifier.py` (keyword + regex) | `pytest tests/test_fallback.py` passes on 6 fixtures | `feat(api): add keyword-based fallback classifier` |
| T-2.5 | T-2.3, T-2.4 | `api/app/services/llm.py` (wrap real call with try/except → fallback) | `ANTHROPIC_API_KEY=invalid pytest tests/test_llm.py::test_fallback_on_failure` passes | `feat(api): fall back to keyword classifier on llm failure` |
| T-2.6 | T-1.2 | `api/app/services/cache.py` (`get/set` keyed by sha256) | `pytest tests/test_cache.py` passes | `feat(api): add sha256-keyed llm response cache` |
| T-2.7 | T-2.5, T-2.6 | `api/app/services/llm.py` (check cache before call, write after) | Test: submitting identical text twice results in 1 real LLM call | `perf(api): cache llm responses by text hash` |
| T-2.8 | T-1.3 | `api/app/services/sla.py` (`compute_sla_due_at`) | `pytest tests/test_sla.py` passes (High=4h, Medium=12h, Low=24h) | `feat(api): add sla due-at computation` |

### Phase 3 — API Routes (Hour 6–9) — owner: BE

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-3.1 | T-2.7, T-2.8 | `api/app/routes/complaints.py` (POST) | `curl -X POST localhost:5000/api/complaints -d '{"text":"broken seal","channel":"email"}'` returns 200 with classification | `feat(api): implement POST /api/complaints with ai classification` |
| T-3.2 | T-3.1 | same file (GET list with filters + pagination) | `curl "localhost:5000/api/complaints?priority=High"` returns filtered list | `feat(api): implement GET /api/complaints with filters and pagination` |
| T-3.3 | T-3.1 | same file (GET detail with status logs) | `curl localhost:5000/api/complaints/1` returns complaint + logs array | `feat(api): implement GET /api/complaints/<id>` |
| T-3.4 | T-3.3 | same file (PATCH status + write StatusLog) | `curl -X PATCH ... -d '{"status":"in_progress"}'` creates StatusLog row | `feat(api): implement PATCH /api/complaints/<id> with status log` |
| T-3.5 | T-3.2 | `api/app/routes/stats.py` | `curl localhost:5000/api/complaints/stats` returns all 7 aggregate fields | `feat(api): implement GET /api/complaints/stats` |
| T-3.6 | T-1.1 | `api/app/services/external_tickets.py`, `api/app/routes/sync.py` | `curl -X POST localhost:5000/api/sync -d '{"ticket_id":"test"}'` returns complaint | `feat(api): implement external ticket sync endpoint` |
| T-3.7 | T-1.1 | `api/app/extensions.py` (Flask-CORS for `http://localhost:3000`) | Preflight OPTIONS returns 200 with correct headers | `feat(api): enable cors for next.js frontend` |

### Phase 4 — Frontend Scaffolding (Hour 1–4, parallel with Phases 1–2) — owner: FE

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-4.1 | T-0.1 | Next.js scaffold in `web/` via `npx create-next-app@latest` (App Router, TS, Tailwind, use default `--turbopack`) | `cd web && npm run dev` serves on :3000 and `package.json` shows `"next": "^15"` or newer | `feat(web): scaffold next.js (latest) with tailwind` |
| T-4.2 | T-4.1 | shadcn/ui init + Button, Card, Input, Select, Table, Badge, Dialog | `web/components/ui/*` exists, demo imports work | `feat(web): add shadcn/ui primitives` |
| T-4.3 | T-4.1 | `web/lib/apiClient.ts` (fetch wrapper, env-driven base URL) | Unit-style call against health endpoint succeeds | `feat(web): add api client with env-driven base url` |
| T-4.4 | T-1.3 | `web/lib/types.ts` (TS mirrors of Pydantic schemas) | `tsc --noEmit` passes | `feat(web): add typescript types mirroring backend schemas` |
| T-4.5 | T-4.2 | `web/app/layout.tsx`, `web/components/Sidebar.tsx` | Nav between /submit, /tickets, /dashboard works, active link highlighted | `feat(web): add app shell with sidebar navigation` |

### Phase 5 — Frontend Features (Hour 4–14) — owner: FE + FS

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-5.1 | T-4.5 | `web/components/ComplaintForm.tsx`, `web/app/submit/page.tsx` | Form submits, disables button while pending | `feat(web): add complaint submit form` |
| T-5.2 | T-5.1, T-3.1 | `web/components/AIResultCard.tsx` | After submit, card renders category, priority, reasoning, 3 bullets | `feat(web): render ai classification result card` |
| T-5.3 | T-4.4 | `web/components/SlaBadge.tsx` | Returns green if >1h to due, amber <1h, red if overdue | `feat(web): add sla badge component` |
| T-5.4 | T-4.5, T-3.2 | `web/components/TicketsTable.tsx`, `web/app/tickets/page.tsx` | Filters work, sorting by createdAt desc default | `feat(web): add tickets list with filters` |
| T-5.5 | T-5.4, T-3.3 | `web/app/tickets/[id]/page.tsx`, `web/components/StatusTimeline.tsx` | Detail page shows timeline with all status changes | `feat(web): add ticket detail page with status timeline` |
| T-5.6 | T-5.5, T-3.4 | Action buttons on detail page (In Progress, Resolved) | Clicking updates status, timeline refreshes | `feat(web): add status lifecycle actions` |
| T-5.7 | T-4.5, T-3.5 | `web/components/KpiCard.tsx`, `web/app/dashboard/page.tsx` | 4 KPI cards: Total, High priority, SLA at risk, Resolved today | `feat(web): add dashboard kpi cards` |
| T-5.8 | T-5.7 | `web/components/CategoryPie.tsx` | Pie renders with Recharts, legend correct | `feat(web): add category distribution pie chart` |
| T-5.9 | T-5.7 | `web/components/PriorityBar.tsx` | Bar chart with H/M/L counts | `feat(web): add priority distribution bar chart` |
| T-5.10 | T-5.4, T-5.7 | `web/lib/swrConfig.ts`, applied on list + dashboard | New ticket appears on dashboard within 6s without refresh | `feat(web): enable swr polling for real-time feel` |
| T-5.11 | T-5.1 | `web/components/EmptyState.tsx` on all list pages | Fresh DB shows helpful empty state, not blank | `feat(web): add empty-state components` |
| T-5.12 | T-5.10 | Loading skeletons on tickets list + dashboard | No layout shift when data loads | `feat(web): add loading skeletons` |

### Phase 6 — Seeding + P1 Features (Hour 14–18) — owner: FS

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-6.1 | T-3.1 | `api/scripts/seed.py` with 30 realistic wellness complaints | `python scripts/seed.py` creates 30 rows spread across categories + priorities | `chore(api): add seed script with 30 realistic complaints` |
| T-6.2 | T-5.7 | `web/components/DailyTrend.tsx` (Recharts line) | Shows last 7 days | `feat(web): add daily complaint trend chart` |
| T-6.3 | T-5.4 | `web/components/ExportButtons.tsx` (CSV via papaparse) | Downloads filtered list | `feat(web): add csv export for tickets list` |
| T-6.4 | T-6.3 | PDF summary via jspdf | Opens valid PDF | `feat(web): add pdf summary export` |

### Phase 7 — QA, Rehearsal, Demo Prep (Hour 18–24) — owner: ALL

| ID | Prereq | Files | Acceptance | Commit msg |
|---|---|---|---|---|
| T-7.1 | T-6.1, all P0 | — | Golden path runs 3× without error (see Section 12) | `test: verify golden path end-to-end` (commit test script if any) |
| T-7.2 | T-7.1 | `demo/demo-fallback.mp4` | 90-sec screen recording committed | `docs: add demo fallback video` |
| T-7.3 | T-7.1 | `docs/slides.pdf` or `docs/slides.md` | 3 slides: problem, arch, demo | `docs: add pitch slide deck` |
| T-7.4 | All | `README.md` (setup, architecture, demo gif, team) | Fresh clone → follow README → app runs | `docs: polish readme with setup and architecture` |
| T-7.5 | T-7.4 | — | `git tag -a checkpoint-h24-final -m "ship"` pushed | `chore: tag final checkpoint` |

---

## 6. Git & Commit Discipline

**Baseline:** at least **one commit per task above** (~55+ commits across 24h). Never merge a bulk commit.

### Hard rules
1. **Conventional Commits** — `feat:` `fix:` `chore:` `docs:` `test:` `refactor:` `style:` `perf:` `ci:` `build:` — enforced by commitlint hook.
2. **Atomic commits** — one logical change. Never `-am "stuff"`.
3. **Commit cadence** — ≥1 commit per 25–30 min per dev. Push immediately after commit.
4. **Feature branches** — `feat/<task-id>-<slug>` (e.g., `feat/t-5.2-ai-result-card`). Merge with `--no-ff`, **never squash**.
5. **Checkpoint tags** — annotated tags at hours 2, 6, 12, 18, 24.
6. **Branch protection on `main`** — all changes via PR (even solo).
7. **`git add -p`** when staging changes that touch multiple concerns.

### Enforcement stack (set up in Phase 0, no exceptions)
- **Husky** + **commitlint** → rejects non-conventional commit messages in `web/`.
- **pre-commit** framework → runs `ruff` + `black` on staged `api/` files.
- **.gitmessage** template wired via `git config commit.template .gitmessage`.

### Anti-patterns to ban
| Ban | Why |
|---|---|
| `git commit -am "updates"` | Classic bulk commit. |
| End-of-phase mega-merges | The rule organizers wrote against. |
| Squash-merging feature branches | Collapses legitimate progression. |
| `git push --force` to main | Destroys judge-visible history. |
| Committing `.env`, `node_modules`, `api.db` | Code quality deduction + secret leak. |

---

## 7. AI Coding Agent Playbook

**This is how the team drives Claude Code / Cursor / Aider to execute the plan.**

### 7.1 Agent operating principles
1. **One task ID per agent session.** Start each agent invocation with: *"Execute TASK-2.3 from the plan. Files and acceptance criteria are in Section 5."* Agents do best with narrow scope.
2. **Always paste Section 4 contracts** into the agent's context window at the start of a session. They are the source of truth.
3. **Agent must run the acceptance command and report the result** before claiming completion. If command fails, agent fixes before committing.
4. **Agent commits its own work** with the message template from the task row. No human-rewritten commit messages.
5. **One PR per task** when doing PR-style. Agent opens PR, self-reviews diff, merges.

### 7.2 Session prompt template (reuse for every task)

```
Task: TASK-<id> from /Users/jay/.claude/plans/you-are-a-senior-memoized-gem.md
Read Section 4 (Contracts) and the specific task row in Section 5 before coding.

Instructions:
1. Create/modify only the files listed in the task row.
2. Keep changes minimal — no speculative refactors, no unrelated fixes.
3. Run the acceptance command. If it fails, iterate until it passes.
4. Stage only files related to this task (git add -p if needed).
5. Commit with the exact message template from the task row, prefixed
   per Conventional Commits.
6. Push. Report commit sha + acceptance output.
```

### 7.3 What to delegate to AI vs keep human-led
| Delegate to AI | Keep human | Why |
|---|---|---|
| Scaffolding a new file (model, route, component) | Choosing architecture / stack | AI accelerates typing; humans choose shape |
| Writing tests against a known contract | Writing the contract itself | Section 4 must be human-owned |
| Generating seed data JSON | Reviewing seed data realism | AI invents plausible but generic text |
| Boilerplate UI (shadcn layouts) | Final demo flow / story | Demo narrative wins judges, not code |
| Refactors with clear before/after | Cross-cutting design decisions | AI can't hold full-repo context reliably |

### 7.4 Guardrails
- **Always diff-review AI output** before merging — even trivial changes.
- **Never let AI edit Section 4 contracts** without explicit human sign-off.
- **Never paste secrets into agent prompts** — use `.env.example` to show shape only.
- **If AI proposes a new dependency**, pause and evaluate; hackathon prefers boring tech.

---

## 8. Team Roles & Parallelization (3 devs)

| Role | Owner | Phase 0-1 | Phase 2-3 | Phase 4-5 | Phase 6-7 |
|---|---|---|---|---|---|
| **Backend Lead (BE)** | Dev A | T-0.3, T-1.1–T-1.4 | T-2.x, T-3.x | support FE integration | T-6.1, T-7.1 |
| **Frontend Lead (FE)** | Dev B | T-4.1–T-4.5 | T-4.x continued | T-5.1–T-5.9 | T-6.3, T-6.4 |
| **Full-stack / Integration (FS)** | Dev C | T-0.1, T-0.2, T-0.4 | T-4.3, T-4.4, stubs | T-5.10–T-5.12 | T-7.2–T-7.5 |

### Parallelization contract
- **Hour 1 checkpoint:** Section 4 contracts frozen. After this, BE and FE never block each other.
- **Integration windows:** Hour 9, 14, 20 — all devs merge, run E2E, fix conflicts before proceeding.
- **5-min standups:** Hour 0, 6, 12, 18. Slack format: done / doing / blocked.

---

## 9. Hour-by-Hour Timeline

| Hour | Milestone | Tag |
|---|---|---|
| 0 | Kickoff, read plan aloud, assign roles | — |
| 1 | Contracts frozen, commitlint + pre-commit live | — |
| **2** | Phase 0 + backend skeleton done, web scaffolded | `checkpoint-h02-setup` |
| 3–6 | AI core (T-2.x) + frontend shell (T-4.5) | — |
| **6** | POST /api/complaints + submit page both work end-to-end | `checkpoint-h06-vertical-slice` |
| 7–9 | Remaining API routes, tickets list page | — |
| 9 | **Integration window 1** | — |
| 10–12 | Detail page, dashboard, SWR polling | — |
| **12** | Dashboard live with seed data, full P0 UI present | `checkpoint-h12-ui-complete` |
| 13–14 | Status lifecycle, SLA badges, empty states | — |
| 14 | **Integration window 2** | — |
| 15–18 | P1 features (trend, export), visual polish, error UX | — |
| **18** | Feature freeze | `checkpoint-h18-feature-freeze` |
| 19–20 | Seed demo data, golden path rehearsal | — |
| 20 | **Integration window 3** — bugs only after this | — |
| 21–22 | Slides, README, demo video | — |
| 23 | Final rehearsal, pitch timing | — |
| **24** | Submit | `checkpoint-h24-final` |

---

## 10. Suggested Tech Stack

| Layer | Choice | Version | Why |
|---|---|---|---|
| Frontend | Next.js App Router + TS | latest stable (15.x+) — install via `npx create-next-app@latest` | Requested; great DX; hackathon-standard; async `params`/`searchParams` and Turbopack are standard in 15+ |
| Styling | Tailwind + shadcn/ui | latest | Polished UI fast |
| Data fetching | SWR | 2.x | Polling = "real-time" without WebSockets |
| Charts | Recharts | 2.x | 5-min setup |
| Backend | Python + Flask | 3.11 / 3.x | AI/ML ecosystem; team comfort |
| ORM | SQLAlchemy | 2.x | Standard |
| DB | SQLite | — | Zero setup, perfect for hackathon |
| Validation | Pydantic v2 | 2.x | Types + validation + OpenAPI-ready |
| CORS | Flask-CORS | — | one-line setup |
| LLM (primary) | Google Gemini 2.0 Flash via `google-generativeai` | latest | **Free tier**, no credit card, native JSON mode, 1500 req/day |
| LLM (backup) | Groq `llama-3.3-70b-versatile` via `groq` SDK | latest | **Free tier**, fastest inference on the market |
| LLM (offline) | Ollama + `llama3.2:3b` | latest | Runs locally, zero-network demo insurance |
| Deploy web (free) | Vercel hobby tier | — | Free for students, auto-deploys from GitHub |
| Deploy api (free) | Render free instance or Railway free trial or ngrok tunnel from laptop | — | Free tier adequate for 24h demo |
| Testing | pytest | latest | Backend only; manual E2E on UI |
| Linting | ruff + black (Python), ESLint + Prettier (JS) | latest | Clean commits, not noise |
| Git hooks | Husky + commitlint + pre-commit framework | latest | Anti-bulk-commit insurance |

---

## 11. Risks & Simplifications

| Risk | Mitigation |
|---|---|
| Gemini free-tier rate limit hit mid-demo (15 RPM) | Swap to Groq (free) via `LLM_PROVIDER=groq` env flip; also sha256 cache means demo reruns are 0 calls |
| All external LLMs blocked on conference wifi | Ollama local fallback with `llama3.2:3b`; `LLM_PROVIDER=ollama` |
| LLM outage mid-demo | Fallback keyword classifier (always on) + 30 cached seed responses |
| Accidental paid-tier charges | No credit card on any account; all three providers have real free tiers, not trials |
| CORS friction between :3000 and :5000 | Flask-CORS configured in T-3.7; test in Hour 9 integration window |
| Team accidentally bulk-commits | Commitlint + pre-commit hooks set up in Phase 0 |
| Agent hallucinates wrong field names | Section 4 contracts pasted into every agent session |
| Integration breakage at hour 14 | Schedule explicit integration windows, not ad-hoc merges |
| Wifi dies during demo | Pre-recorded 90-sec fallback video (T-7.2) |
| Dashboard looks empty | Seed 30 realistic complaints (T-6.1) |
| Single dev disappears | Task IDs + file paths are explicit enough for another dev to take over |

---

## 12. Verification — Golden Path

Must pass 3× consecutively before demo. Each check lists the exact command the agent/dev runs.

### Backend smoke
```
curl -s localhost:5000/api/health | jq .data
# expect: { llm: true, db: true, external: true|false }

curl -s -X POST localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"text":"Protein tub arrived with broken seal and powder everywhere","channel":"email"}' | jq .data
# expect: category=Packaging, priority=High, classifier=llm, 3 recommendations
```

### Full E2E
1. Open `http://localhost:3000/submit`, paste the same complaint → AI result card appears within 4s.
2. Go to `/dashboard` → SLA-at-risk count increased by 1, Packaging slice grew.
3. Go to `/tickets`, filter priority=High → new ticket visible.
4. Click ticket → detail page shows timeline with single "Open" entry.
5. Click "Mark In Progress" → timeline adds second entry.
6. Click "Mark Resolved" → ticket no longer in Open filter, visible under Resolved.

### Git-history check (judges will run this)
```
git log --oneline | wc -l
# expect: >= 40

git log --oneline | grep -vE '^[a-f0-9]+ (feat|fix|chore|docs|test|refactor|style|perf|ci|build)(\([^)]+\))?: '
# expect: no output (every commit matches Conventional Commits)

git tag -l 'checkpoint-*'
# expect: 5 tags
```

### Fallback path (demo robustness)
```
GEMINI_API_KEY=invalid flask run
# submit a complaint via UI → result still appears, "fallback" badge shown on card

# Test Groq swap:
LLM_PROVIDER=groq GROQ_API_KEY=<key> flask run
# submit → classification still works, via Groq instead of Gemini

# Test offline (Ollama running locally):
ollama serve &
LLM_PROVIDER=ollama flask run
# submit → classification works with zero internet
```

### Demo rehearsal
- Time the live portion: target **<90 seconds**, leaving 60s for Q&A.
- Run 3× back-to-back without errors before final submission.

---

## 13. Next Immediate Steps (do right now, in order)

1. **Collect the free API keys — Hour 0, before any code.**
   - Gemini: [aistudio.google.com](https://aistudio.google.com) → "Get API key" → paste into team 1Password / shared notes as `GEMINI_API_KEY`.
   - Groq (backup): [console.groq.com](https://console.groq.com) → Sign up → API Keys → create → save as `GROQ_API_KEY`.
   - Ollama (offline): `brew install ollama && ollama pull llama3.2:3b` on one laptop as insurance.
   - **No credit cards. If any signup asks for one, stop — we picked the wrong provider.**
2. Read Section 4 (Contracts) aloud with the team — 10 min alignment.
3. Create private GitHub repo, add collaborators, enable branch protection on `main`.
4. Execute Phase 0 (T-0.1 → T-0.4) — **do not write a single feature until commitlint + pre-commit are live**.
5. Split the team per Section 8. BE starts T-1.1, FE starts T-4.1, FS does T-0.2/T-0.4 then helps wherever bottlenecked.
6. At Hour 1: freeze Section 4 contracts. Any change from now requires team agreement.
7. At Hour 2: first checkpoint tag `checkpoint-h02-setup`. Do not skip — cadence is evaluated.
8. From Hour 2 onward: every agent session starts with Section 7.2 prompt template + task ID.
