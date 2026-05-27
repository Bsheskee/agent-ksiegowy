import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app import config


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


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
        conn.commit()


@contextmanager
def _conn():
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_invoice(
    *,
    invoice_id: str,
    original_filename: str | None,
    stored_path: Path,
    content_type: str | None,
    size_bytes: int,
) -> None:
    now = _utc_now()
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO invoices (
                id, original_filename, stored_path, content_type, size_bytes,
                status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                invoice_id,
                original_filename or "",
                str(stored_path),
                content_type,
                size_bytes,
                "uploaded",
                now,
                now,
            ),
        )


def mark_processing(invoice_id: str) -> None:
    with _conn() as conn:
        conn.execute(
            "UPDATE invoices SET status = ?, error_message = NULL, updated_at = ? WHERE id = ?",
            ("processing", _utc_now(), invoice_id),
        )


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


def mark_failed(invoice_id: str, message: str) -> None:
    with _conn() as conn:
        conn.execute(
            "UPDATE invoices SET status = ?, error_message = ?, updated_at = ? WHERE id = ?",
            ("failed", message, _utc_now(), invoice_id),
        )


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
    *,
    category: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    """Return invoices with optional filtering by category, status, and issue date range."""
    query = "SELECT * FROM invoices"
    conditions: list[str] = []
    params: list = []

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

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    with _conn() as conn:
        rows = conn.execute(query, params).fetchall()
    results = []
    for row in rows:
        item = dict(row)
        item["analysis"] = json.loads(item["analysis_json"]) if item["analysis_json"] else None
        item.pop("analysis_json", None)
        results.append(item)
    return results


def update_invoice_analysis(invoice_id: str, analysis_patch: dict) -> bool:
    """Merge patch into existing analysis_json. Returns True if the record was found."""
    with _conn() as conn:
        row = conn.execute(
            "SELECT analysis_json FROM invoices WHERE id = ?", (invoice_id,)
        ).fetchone()
        if row is None:
            return False
        existing: dict = json.loads(row["analysis_json"]) if row["analysis_json"] else {}
        existing.update({k: v for k, v in analysis_patch.items() if v is not None or k in analysis_patch})
        conn.execute(
            "UPDATE invoices SET analysis_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(existing, ensure_ascii=False), _utc_now(), invoice_id),
        )
    return True
