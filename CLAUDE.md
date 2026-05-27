# CLAUDE.md – Agent Księgowy

Developer guide for AI-assisted work on this codebase. Keep this file up to date when architecture or tooling changes.

---

## Project overview

**Agent Księgowy** is a local Polish invoice-processing tool. The user uploads a PDF/JPG/PNG invoice; the system OCR-extracts the text, runs a heuristic field extractor, optionally calls the Bielik LLM for enrichment, and saves structured accounting data to SQLite. Results are browsable, filterable, editable, and exportable as CSV/XLSX.

**Stack:** FastAPI (Python 3.12) · SQLite · vanilla JS frontend · Tesseract OCR · pypdf · openpyxl · Bielik LLM (optional, via HTTP)

---

## Quickstart

### macOS / Linux

```bash
# 1. Clone & enter repo
git clone https://github.com/Bsheskee/agent-ksiegowy.git
cd agent-ksiegowy

# 2. One-shot start (creates venv, installs deps, starts both servers)
chmod +x start.sh
./start.sh

# URLs:
#   Frontend  → http://localhost:5500
#   Backend   → http://localhost:8000
#   API docs  → http://localhost:8000/docs
```

### Windows (PowerShell)

```powershell
# One-shot start
.\start.ps1

# Or manually:
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload   # separate terminal

cd ..\frontend
python -m http.server 5500
```

> **Python requirement:** 3.11+. On Windows install via `winget install Python.Python.3.12`. On macOS use `brew install python@3.12` or `pyenv`.

### Tesseract (required for JPG/PNG invoices, optional for PDF)

| OS | Command |
|---|---|
| macOS | `brew install tesseract tesseract-lang` |
| Ubuntu/Debian | `sudo apt install tesseract-ocr tesseract-ocr-pol` |
| Windows | Download installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki); add install dir to `PATH` |

Polish language pack (`pol`) is required. Verify: `tesseract --list-langs | grep pol`.

---

## Repository layout

```
agent-ksiegowy/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── invoices.py      # All REST endpoints (upload, process, list,
│   │   │                        #   filter, edit, export CSV/XLSX)
│   │   ├── services/
│   │   │   ├── analyzer.py      # Heuristic field extractor + 13-category
│   │   │   │                    #   expense classifier (_category_from_text)
│   │   │   ├── bielik.py        # Bielik LLM client + prompt builder +
│   │   │   │                    #   response sanitiser + merge logic
│   │   │   └── ocr.py           # pypdf text layer + Tesseract (images)
│   │   ├── config.py            # Env-var config (AGENT_KS_* prefix)
│   │   ├── db.py                # SQLite helpers: init, CRUD, filter, patch
│   │   └── main.py              # FastAPI app + CORS + startup hook
│   ├── tests/
│   │   └── test_invoice_processing.py   # Regression tests on 3 sample PDFs
│   ├── data/                    # Runtime dir (git-ignored)
│   │   ├── app.db               # SQLite database
│   │   └── uploads/             # Stored invoice files
│   └── requirements.txt
├── frontend/
│   ├── index.html               # Single-page app
│   ├── app.js                   # All client logic (upload, render, filter,
│   │                            #   edit modal, export download)
│   └── styles.css
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   ├── TODO.md                  # Feature checklist (all MVP items done)
│   ├── ARCHITECTURE.md
│   ├── screenshots/             # 5 Playwright screenshots of running app
│   └── data/sample_data/        # 3 test PDFs (f-vat_soft, perf, 2011)
├── start.sh                     # macOS/Linux launcher
├── start.ps1                    # Windows launcher
└── CLAUDE.md                    # ← this file
```

---

## Environment variables

All prefixed `AGENT_KS_`. Set in shell or a `.env` file before starting uvicorn.

| Variable | Default | Description |
|---|---|---|
| `AGENT_KS_UPLOAD_DIR` | `data/uploads` | Where uploaded files are stored |
| `AGENT_KS_DATABASE_PATH` | `data/app.db` | SQLite file path |
| `AGENT_KS_MAX_UPLOAD_BYTES` | `26214400` (25 MB) | Max upload size |
| `AGENT_KS_BIELIK_URL` | *(unset)* | Bielik API base URL – if unset, Bielik is skipped and heuristic result is used directly |
| `AGENT_KS_BIELIK_TOKEN` | *(unset)* | Bearer token for Bielik API |
| `AGENT_KS_BIELIK_MODEL` | `bielik` | Model name sent in request payload |
| `AGENT_KS_BIELIK_TIMEOUT` | `30` | HTTP timeout in seconds |

---

## API reference (key endpoints)

All routes are under `/api/v1/invoices`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload-and-process` | Upload + OCR + analyse in one shot |
| `POST` | `/upload` | Upload only (returns `id`) |
| `POST` | `/{id}/process` | Run OCR + analysis on an already-uploaded file |
| `GET` | `` | List invoices; supports `?category=`, `?status=`, `?date_from=`, `?date_to=`, `?limit=` |
| `GET` | `/{id}` | Single invoice with full analysis JSON |
| `PATCH` | `/{id}/analysis` | Merge-patch selected analysis fields (JSON body) |
| `GET` | `/export/csv` | Download CSV (same filter params as list) |
| `GET` | `/export/xlsx` | Download XLSX with styled header row |
| `GET` | `/status/ocr` | Whether Tesseract is available |

Interactive docs: `http://localhost:8000/docs`

**Route ordering note:** In `invoices.py`, static routes (`/export/csv`, `/export/xlsx`, `/status/ocr`) **must** be declared before the parametric `/{invoice_id}` route, otherwise FastAPI/Starlette will shadow them.

---

## Running tests

```bash
# macOS / Linux
cd backend
source .venv/bin/activate
python -m pytest tests/ -v

# Windows
cd backend
.\.venv\Scripts\python -m pytest tests\ -v
```

The three regression tests in `tests/test_invoice_processing.py` run purely on sample PDFs — no server, no DB. They cover field extraction and line-item parsing for all three sample invoices.

---

## Key implementation notes

### Extraction pipeline

```
Upload → OCR (pypdf text layer OR Tesseract) → analyzer.py heuristic
      → (optional) bielik.py LLM call → merge_invoice_analysis()
      → db.mark_processed()
```

`merge_invoice_analysis()` in `bielik.py` applies Bielik results on top of heuristic output: non-null Bielik values overwrite heuristics; `line_items` list is replaced only if Bielik returns a non-empty one. `bielik_status` is set to `"applied"` or `"not_configured_or_failed"`.

### Expense categories (13)

Defined as `_CATEGORY_RULES` list in `analyzer.py`. Each entry is `(category_name, [keywords])`. Rules are evaluated in order — **first match wins**. To add a category: insert a new tuple before the `"inne"` catch-all.

Current categories: `oprogramowanie`, `sprzęt IT`, `paliwo`, `transport`, `delegacje`, `media`, `materiały biurowe`, `usługi doradcze`, `marketing`, `surowce`, `wyposażenie`, `ubezpieczenia`, `inne`.

### Database schema

Single table `invoices` in SQLite. The analysis result is stored as `analysis_json TEXT` (serialised JSON). `db.get_invoice()` and `db.list_invoices()` deserialise it back into `analysis` dict. Filtering on JSON fields uses SQLite's `json_extract()`.

```sql
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    content_type TEXT,
    size_bytes INTEGER NOT NULL,
    status TEXT NOT NULL,          -- uploaded | processing | processed | failed
    ocr_text TEXT,
    analysis_json TEXT,            -- serialised analysis dict
    error_message TEXT,
    created_at TEXT NOT NULL,      -- ISO-8601 UTC
    updated_at TEXT NOT NULL
);
```

### Bielik integration

Bielik is called only when `AGENT_KS_BIELIK_URL` is set. The prompt in `bielik.py::build_bielik_prompt()` instructs the model to correct and complete the heuristic result according to a fixed JSON schema. The response parser tries multiple keys (`result`, `output`, `text`, `response`, `content`) and falls back to raw JSON extraction from the response body.

To connect a local Ollama or vLLM instance serving Bielik:
```bash
export AGENT_KS_BIELIK_URL=http://localhost:11434/api/generate
export AGENT_KS_BIELIK_MODEL=bielik
```

---

## Suggested improvements

The list below cross-references the PRD (`docs/PRD.md`) and highlights gaps between current state and specification, plus general quality/UX improvements.

### 🔴 PRD gaps (specified but not yet implemented)

| PRD section | Requirement | Current state | Suggested fix |
|---|---|---|---|
| §6.4 | "Zatwierdzenie wpisu" — explicit user approval step before saving | Editing is possible but there is no distinct *approve* action; data is saved automatically on process | Add an "Zatwierdź" button that sets a `confirmed: true` flag in `analysis_json`; show unconfirmed entries differently in the list |
| §6.5 | "Wyszukiwanie" (full-text search) | Only categorical/date filters exist | Add `?search=` query param using SQLite `LIKE` on `original_filename` and `json_extract(analysis_json, '$.invoice_number')` |
| §7 | Statystyki wydatków | Not implemented | Add a `/api/v1/stats` endpoint (sum per category, per month); render a simple bar chart in the frontend using a lightweight library such as Chart.js |
| §7 | Historia operacji | Not implemented | Add an `events` table to log each status transition with timestamp and actor |
| §7 | Integracja z Google Sheets | Not implemented | Add a `POST /export/gsheets` endpoint using the Sheets API v4; credentials stored as env vars |
| §8 | Model Bielik as primary analyser | Bielik is optional/fallback | Document a recommended local Bielik setup (Ollama) in `INSTALLATION.md`; add a UI indicator showing whether Bielik was applied (`bielik_status` field already exists in DB) |

### 🟡 Architecture & backend

- **No input validation model** — the `PATCH /{id}/analysis` endpoint accepts any JSON dict. Define a Pydantic `AnalysisPatch` model with optional typed fields to prevent storing garbage.
- **Synchronous OCR in request handler** — `process_invoice` runs OCR/LLM synchronously in the API request. For large PDFs or slow Bielik this blocks the event loop. Move to a background task (`BackgroundTasks`) or a task queue (Celery/ARQ).
- **No pagination cursor** — `list_invoices` uses `LIMIT` only; adding `offset` (or a keyset cursor on `created_at`) is needed once the table grows.
- **Single SQLite file** — fine for local/single-user use, but `sqlite3.connect()` is called per request. Consider using a connection pool (`aiosqlite` + async handlers) for concurrent uploads.
- **No file deduplication** — uploading the same file twice creates two independent records. A SHA-256 check on upload would catch this.
- **Tesseract language** — hardcoded to `pol+eng`. Could be made configurable via `AGENT_KS_BIELIK_OCR_LANG`.

### 🟡 Frontend & UX

- **No loading skeleton / progress indicator** — while processing, the upload button just disables. Show a spinner or progress bar; for large PDFs the wait can be 5–10 s.
- **No toast notifications** — errors and successes are displayed in a small `<p>` element that is easy to miss. Replace with a dismissible toast component.
- **No confirm before edit-save** — clicking "Zapisz zmiany" immediately PATCHes the server. A "are you sure?" prompt (or undo) prevents accidental overwrites.
- **History cards don't show OCR warning** — if OCR returned an empty string or a warning, the card should surface this so the user knows the analysis may be unreliable.
- **No dark mode** — the CSS uses hardcoded light colours. Adding a `prefers-color-scheme: dark` media query would improve accessibility.
- **Mobile layout** — the filter bar and lines table overflow on narrow screens. Consider collapsing filters into a `<details>` on mobile.
- **Category filter dropdown** is hard-coded in HTML** — it must be kept in sync with `_CATEGORY_RULES` in `analyzer.py` manually. Fetch categories from a `/api/v1/categories` endpoint instead.

### 🟢 Quick wins

- **Show Bielik status badge** — `analysis.bielik_status` is stored but never displayed. A small "🤖 Bielik" vs "📐 Heuristic" badge on each analysis card would communicate data quality.
- **Re-process button** — allow re-running OCR + analysis on an existing record (useful after fixing Tesseract or connecting Bielik).
- **Bulk export respects current filters** — already implemented; just needs to be documented for users.
- **Add `seller_name` / `buyer_name` extraction** — the heuristic currently extracts NIPs but not the company names, which are present in most invoices.
- **PDF thumbnail preview** — render the first page of the uploaded PDF as an `<img>` in the analysis panel (using `pdf.js` on the client or `pypdfium2` on the server).
