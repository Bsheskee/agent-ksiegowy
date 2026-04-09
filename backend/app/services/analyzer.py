import re


def _find(pattern: str, text: str) -> str | None:
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        return None
    return (match.group(1) or "").strip()


def analyze_invoice_text(text: str) -> dict:
    invoice_number = _find(r"(?:faktura|nr)\s*[:#]?\s*([A-Z0-9\/\-_]+)", text)
    issue_date = _find(r"(?:data(?:\s+wystawienia)?)\s*[:]?[\s]*([0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})", text)
    brutto = _find(r"(?:brutto|razem do zapłaty)\s*[:]?[\s]*([0-9\s,\.]+)", text)
    vat = _find(r"(?:vat)\s*[:]?[\s]*([0-9\s,\.]+)", text)
    currency = _find(r"\b(PLN|EUR|USD)\b", text) or "PLN"

    lower = text.lower()
    if "paliwo" in lower:
        category = "paliwo"
    elif "transport" in lower:
        category = "transport"
    elif "hotel" in lower or "gastronomia" in lower:
        category = "delegacje"
    elif "oprogramowanie" in lower or "subskrypcja" in lower:
        category = "oprogramowanie"
    else:
        category = "inne"

    return {
        "invoice_number": invoice_number,
        "issue_date": issue_date,
        "gross_amount": brutto,
        "vat_amount": vat,
        "currency": currency,
        "category": category,
    }
