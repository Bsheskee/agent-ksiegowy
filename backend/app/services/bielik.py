import json
import os
from typing import Any

import httpx

_PREFIX = "AGENT_KS_BIELIK_"

_RESPONSE_SCHEMA: dict[str, Any] = {
    "invoice_number": "string|null",
    "issue_date": "YYYY-MM-DD|null",
    "sale_date": "YYYY-MM-DD|null",
    "payment_due_date": "YYYY-MM-DD|null",
    "issue_place": "string|null",
    "seller_nip": "string|null",
    "buyer_nip": "string|null",
    "net_amount": "string|null",
    "vat_amount": "string|null",
    "gross_amount": "string|null",
    "currency": "string|null",
    "category": "string|null",
    "line_items": [
        {
            "lp": "string|null",
            "name": "string|null",
            "unit": "string|null",
            "quantity": "string|null",
            "unit_price_net": "string|null",
            "vat_rate": "string|null",
            "net_amount": "string|null",
            "vat_amount": "string|null",
            "gross_amount": "string|null",
        }
    ],
}


def _env(key: str, default: str | None = None) -> str | None:
    return os.environ.get(f"{_PREFIX}{key}", default)


def build_bielik_prompt(text: str, heuristic_analysis: dict[str, Any]) -> str:
    return (
        "Jesteś asystentem księgowym analizującym polskie faktury kosztowe.\n"
        "Uzupełnij i popraw dane wyciągnięte heurystycznie, ale nie zgaduj bez podstaw w tekście.\n"
        "Zwróć wyłącznie JSON zgodny ze schematem. Kwoty pozostaw jako string z przecinkiem dziesiętnym.\n"
        "Jeśli pole nie występuje w dokumencie, zwróć null.\n\n"
        f"SCHEMAT:\n{json.dumps(_RESPONSE_SCHEMA, ensure_ascii=False, indent=2)}\n\n"
        f"WYNIK HEURYSTYCZNY:\n{json.dumps(heuristic_analysis, ensure_ascii=False, indent=2)}\n\n"
        f"TEKST FAKTURY:\n{text}"
    )


def _extract_json(payload: str) -> dict[str, Any] | None:
    payload = payload.strip()
    if not payload:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        start = payload.find("{")
        end = payload.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            return json.loads(payload[start : end + 1])
        except json.JSONDecodeError:
            return None


def _sanitize_line_items(items: Any) -> list[dict[str, Any]] | None:
    if not isinstance(items, list):
        return None
    sanitized: list[dict[str, Any]] = []
    allowed = set(_RESPONSE_SCHEMA["line_items"][0].keys())
    for item in items:
        if not isinstance(item, dict):
            continue
        sanitized.append({key: item.get(key) for key in allowed})
    return sanitized


def _sanitize_response(data: dict[str, Any]) -> dict[str, Any]:
    allowed = set(_RESPONSE_SCHEMA.keys())
    sanitized = {key: data.get(key) for key in allowed}
    sanitized["line_items"] = _sanitize_line_items(data.get("line_items")) or []
    return sanitized


def analyze_with_bielik(text: str, heuristic_analysis: dict[str, Any]) -> dict[str, Any] | None:
    url = _env("URL")
    if not url:
        return None

    headers = {"Content-Type": "application/json"}
    token = _env("TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload = {
        "model": _env("MODEL", "bielik"),
        "prompt": build_bielik_prompt(text, heuristic_analysis),
        "schema": _RESPONSE_SCHEMA,
    }

    timeout_seconds = float(_env("TIMEOUT", "30") or "30")
    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
    except httpx.HTTPError:
        return None

    body = response.json() if "application/json" in response.headers.get("content-type", "") else {}
    if isinstance(body, dict):
        for key in ("result", "output", "text", "response", "content"):
            candidate = body.get(key)
            if isinstance(candidate, dict):
                return _sanitize_response(candidate)
            if isinstance(candidate, str):
                parsed = _extract_json(candidate)
                if parsed:
                    return _sanitize_response(parsed)
        return _sanitize_response(body) if any(field in body for field in _RESPONSE_SCHEMA) else None
    if isinstance(body, str):
        parsed = _extract_json(body)
        if parsed:
            return _sanitize_response(parsed)
    return None


def merge_invoice_analysis(
    heuristic_analysis: dict[str, Any], bielik_analysis: dict[str, Any] | None
) -> dict[str, Any]:
    merged = dict(heuristic_analysis)
    if bielik_analysis:
        for key, value in bielik_analysis.items():
            if key == "line_items":
                if value:
                    merged[key] = value
                continue
            if value not in (None, "", []):
                merged[key] = value
        merged["bielik_status"] = "applied"
        merged["extraction_method"] = "hybrid_heuristic_bielik_v1"
    else:
        merged["bielik_status"] = "not_configured_or_failed"
    return merged
