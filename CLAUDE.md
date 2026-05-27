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
│   ├── index.html               # Single-page app (sidebar layout)
│   ├── app.js                   # All client logic (upload, render, filter,
│   │                            #   edit modal, export download, navigation)
│   └── styles.css
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   ├── TODO.md                  # Feature checklist
│   ├── ARCHITECTURE.md
│   ├── screenshots/             # Playwright screenshots of running app
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
| `AGENT_KS_OCR_LANG` | `pol+eng` | Tesseract language pack(s), e.g. `pol` or `pol+eng` |
| `AGENT_KS_BIELIK_URL` | *(unset)* | Bielik API base URL – if unset, Bielik is skipped and heuristic result is used directly |
| `AGENT_KS_BIELIK_TOKEN` | *(unset)* | Bearer token for Bielik API |
| `AGENT_KS_BIELIK_MODEL` | `bielik` | Model name sent in request payload |
| `AGENT_KS_BIELIK_TIMEOUT` | `30` | HTTP timeout in seconds |

---

## API reference (key endpoints)

All routes are under `/api/v1/invoices`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload-and-process` | Upload + OCR + analyse in one shot; returns existing record if SHA-256 duplicate |
| `POST` | `/upload` | Upload only (returns `id`); SHA-256 dedup — returns existing record with `duplicate:true` if already uploaded |
| `POST` | `/{id}/process` | Run OCR + analysis on an already-uploaded file (re-process) |
| `GET` | `` | List invoices; supports `?category=`, `?status=`, `?date_from=`, `?date_to=`, `?limit=`, `?offset=`, `?search=` |
| `GET` | `/{id}` | Single invoice with full analysis JSON |
| `GET` | `/{id}/events` | Audit log (historia operacji) for an invoice |
| `PATCH` | `/{id}/analysis` | Merge-patch selected analysis fields via `AnalysisPatch` Pydantic model |
| `GET` | `/categories` | Ordered list of expense categories from `analyzer.py` |
| `GET` | `/stats` | Spending stats: totals by category and by month |
| `GET` | `/export/csv` | Download CSV (same filter params as list) |
| `GET` | `/export/xlsx` | Download XLSX with styled header row |
| `GET` | `/status/ocr` | Whether Tesseract is available + configured `ocr_lang` |

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
    file_sha256 TEXT,              -- SHA-256 hex of uploaded file (dedup)
    created_at TEXT NOT NULL,      -- ISO-8601 UTC
    updated_at TEXT NOT NULL
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id TEXT NOT NULL,
    event_type TEXT NOT NULL,      -- uploaded | processing | processed | failed | analysis_updated
    message TEXT,
    created_at TEXT NOT NULL
);
```

`file_sha256` is added via `ALTER TABLE` migration in `init_db()` so existing databases upgrade automatically.

The `analysis_json` dict includes: all extracted invoice fields, `seller_name`, `buyer_name`, `confirmed` (bool, default `false`), `bielik_status`, `ocr_engine`, `ocr_warning`, `ocr_text_length`.

### Bielik integration

Bielik is called only when `AGENT_KS_BIELIK_URL` is set. The prompt in `bielik.py::build_bielik_prompt()` instructs the model to correct and complete the heuristic result according to a fixed JSON schema. The response parser tries multiple keys (`result`, `output`, `text`, `response`, `content`) and falls back to raw JSON extraction from the response body.

To connect a local Ollama or vLLM instance serving Bielik:
```bash
export AGENT_KS_BIELIK_URL=http://localhost:11434/api/generate
export AGENT_KS_BIELIK_MODEL=bielik
```

### Frontend navigation

The frontend is a single-page app with a sidebar (pages: Pulpit, Nowa faktura, Dokumenty, Statystyki, Ustawienia). Page switching is handled by `navigateTo(pageId)` in `app.js` which toggles `.hidden` on `.page` divs and updates the active sidebar link.

---

## Remaining / future improvements

- **Google Sheets integration** — requires OAuth credentials; not implemented.
- **PDF thumbnail preview** — requires `pdf.js` or `pypdfium2`.
- **aiosqlite connection pool** — single SQLite file is fine for local/single-user; async pool is a future improvement for concurrent use.
