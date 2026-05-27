import hashlib
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app import config


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Schema helpers
# ---------------------------------------------------------------------------

def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(row[1] == column for row in rows)


def init_db() -> None:
    config.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(config.DATABASE_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                original_filename TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                content_type TEXT,
                size_bytes INTEGER NOT NULL,
                status TEXT NOT NULL,
                ocr_text TEXT,
                analysis_json TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        # Schema migrations for columns added after initial release
        if not _column_exists(conn, "invoices", "file_sha256"):
            conn.execute("ALTER TABLE invoices ADD COLUMN file_sha256 TEXT")

        # History / audit log table
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

@contextmanager
def _conn():
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# SHA-256 deduplication
# ---------------------------------------------------------------------------

def compute_sha256(path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65_536), b""):
            h.update(chunk)
    return h.hexdigest()


def find_duplicate_sha256(sha256: str) -> str | None:
    """Return invoice_id of an existing record with the same file hash, or None."""
    with _conn() as conn:
        row = conn.execute(
            "SELECT id FROM invoices WHERE file_sha256 = ?", (sha256,)
        ).fetchone()
    return row["id"] if row else None


# ---------------------------------------------------------------------------
# Event / audit log
# ---------------------------------------------------------------------------

def log_event(invoice_id: str, event_type: str, message: str | None = None) -> None:
    """Append an audit event for an invoice (best-effort — errors are suppressed)."""
    try:
        with _conn() as conn:
            conn.execute(
                "INSERT INTO events (invoice_id, event_type, message, created_at) VALUES (?, ?, ?, ?)",
                (invoice_id, event_type, message, _utc_now()),
            )
    except Exception:  # noqa: BLE001
        pass


def get_invoice_events(invoice_id: str) -> list[dict]:
    """Return all audit events for an invoice ordered by time."""
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, invoice_id, event_type, message, created_at FROM events "
            "WHERE invoice_id = ? ORDER BY created_at ASC",
            (invoice_id,),
        ).fetchall()
    return [dict(row) for row in rows]


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def create_invoice(
    *,
    invoice_id: str,
    original_filename: str | None,
    stored_path: Path,
    content_type: str | None,
    size_bytes: int,
    file_sha256: str | None = None,
) -> None:
    now = _utc_now()
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO invoices (
                id, original_filename, stored_path, content_type, size_bytes,
                status, file_sha256, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                invoice_id,
                original_filename or "",
                str(stored_path),
                content_type,
                size_bytes,
                "uploaded",
                file_sha256,
                now,
                now,
            ),
        )
    log_event(invoice_id, "uploaded", original_filename or "")


def mark_processing(invoice_id: str) -> None:
    with _conn() as conn:
        conn.execute(
            "UPDATE invoices SET status = ?, error_message = NULL, updated_at = ? WHERE id = ?",
            ("processing", _utc_now(), invoice_id),
        )
    log_event(invoice_id, "processing")


def mark_processed(invoice_id: str, *, ocr_text: str, analysis: dict) -> None:
    with _conn() as conn:
        conn.execute(
            """
            UPDATE invoices
            SET status = ?, ocr_text = ?, analysis_json = ?, error_message = NULL, updated_at = ?
            WHERE id = ?
            """,
            ("processed", ocr_text, json.dumps(analysis, ensure_ascii=False), _utc_now(), invoice_id),
        )
    log_event(
        invoice_id,
        "processed",
        f"category={analysis.get('category')} bielik={analysis.get('bielik_status')}",
    )


def mark_failed(invoice_id: str, message: str) -> None:
    with _conn() as conn:
        conn.execute(
            "UPDATE invoices SET status = ?, error_message = ?, updated_at = ? WHERE id = ?",
            ("failed", message, _utc_now(), invoice_id),
        )
    log_event(invoice_id, "failed", message[:500])


def get_invoice(invoice_id: str) -> dict | None:
    with _conn() as conn:
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
    if row is None:
        return None
    result = dict(row)
    result["analysis"] = json.loads(result["analysis_json"]) if result["analysis_json"] else None
    result.pop("analysis_json", None)
    return result


def list_invoices(
    limit: int = 50,
    offset: int = 0,
    *,
    category: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    search: str | None = None,
) -> list[dict]:
    """Return invoices with optional filtering by category, status, date range, and full-text search."""
    query = "SELECT * FROM invoices"
    conditions: list[str] = []
    params: list[Any] = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if date_from:
        conditions.append("json_extract(analysis_json, '$.issue_date') >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("json_extract(analysis_json, '$.issue_date') <= ?")
        params.append(date_to)
    if category:
        conditions.append("json_extract(analysis_json, '$.category') = ?")
        params.append(category)
    if search:
        like = f"%{search}%"
        conditions.append(
            "(original_filename LIKE ? OR json_extract(analysis_json, '$.invoice_number') LIKE ?)"
        )
        params.extend([like, like])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with _conn() as conn:
        rows = conn.execute(query, params).fetchall()

    results = []
    for row in rows:
        item = dict(row)
        item["analysis"] = json.loads(item["analysis_json"]) if item["analysis_json"] else None
        item.pop("analysis_json", None)
        results.append(item)
    return results


def get_stats() -> dict:
    """Aggregate spending statistics: totals per category and per month."""
    # Helper expression that converts "1 000,00" → 1000.00
    _gross_expr = (
        "CAST(NULLIF(REPLACE(REPLACE(json_extract(analysis_json, '$.gross_amount'), ' ', ''), ',', '.'), '') AS REAL)"
    )
    with _conn() as conn:
        cat_rows = conn.execute(
            f"""
            SELECT
                COALESCE(json_extract(analysis_json, '$.category'), 'inne') AS category,
                COUNT(*) AS count,
                SUM({_gross_expr}) AS total_gross
            FROM invoices
            WHERE status = 'processed' AND analysis_json IS NOT NULL
            GROUP BY category
            ORDER BY total_gross DESC NULLS LAST
            """
        ).fetchall()

        month_rows = conn.execute(
            f"""
            SELECT
                substr(json_extract(analysis_json, '$.issue_date'), 1, 7) AS month,
                COUNT(*) AS count,
                SUM({_gross_expr}) AS total_gross
            FROM invoices
            WHERE status = 'processed'
              AND analysis_json IS NOT NULL
              AND json_extract(analysis_json, '$.issue_date') IS NOT NULL
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
            """
        ).fetchall()

        summary_row = conn.execute(
            f"""
            SELECT
                COUNT(*) AS count,
                SUM({_gross_expr}) AS total_gross
            FROM invoices
            WHERE status = 'processed'
            """
        ).fetchone()

    return {
        "by_category": [
            {
                "category": row["category"],
                "count": row["count"],
                "total_gross": round(row["total_gross"] or 0, 2),
            }
            for row in cat_rows
        ],
        "by_month": [
            {
                "month": row["month"],
                "count": row["count"],
                "total_gross": round(row["total_gross"] or 0, 2),
            }
            for row in month_rows
            if row["month"]
        ],
        "total_count": summary_row["count"] if summary_row else 0,
        "total_gross": round((summary_row["total_gross"] or 0) if summary_row else 0, 2),
    }


def update_invoice_analysis(invoice_id: str, analysis_patch: dict) -> bool:
    """Merge patch into existing analysis_json. Returns True if the record was found."""
    with _conn() as conn:
        row = conn.execute(
            "SELECT analysis_json FROM invoices WHERE id = ?", (invoice_id,)
        ).fetchone()
        if row is None:
            return False
        existing: dict = json.loads(row["analysis_json"]) if row["analysis_json"] else {}
        existing.update(analysis_patch)
        conn.execute(
            "UPDATE invoices SET analysis_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(existing, ensure_ascii=False), _utc_now(), invoice_id),
        )
    log_event(invoice_id, "analysis_updated", ", ".join(analysis_patch.keys()))
    return True
