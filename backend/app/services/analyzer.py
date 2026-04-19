import re
from typing import Any


def _normalize_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _find(pattern: str, text: str, flags: int = re.IGNORECASE) -> str | None:
    match = re.search(pattern, text, flags=flags)
    if not match:
        return None
    return (match.group(1) or "").strip()


def extract_invoice_number(text: str) -> str | None:
    patterns = [
        r"Faktura\s+VAT\s+nr\.?\s*([A-Z0-9\/\s\-]+?)(?:\s*\(|$|\n)",
        r"Faktura\s+nr\.?\s*([A-Z0-9\/\s\-]+?)(?:\s*\(|$|\n)",
        r"Nr\s+faktury\s*[:\s]+\s*([A-Z0-9\/\s\-]+)",
    ]
    for pat in patterns:
        m = _find(pat, text, flags=re.IGNORECASE | re.MULTILINE)
        if m:
            cleaned = _normalize_spaces(m)
            if cleaned.upper() == "VAT":
                continue
            return cleaned
    return None


def extract_dates(text: str) -> dict[str, str | None]:
    issue = _find(
        r"Data\s+wystawienia\s*[:\s]+\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})",
        text,
    )
    sale = _find(
        r"Data\s+sprzedaży\s*[:\s]+\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})",
        text,
    )
    payment_due = _find(
        r"Termin\s+zapłaty\s+([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})",
        text,
    )
    return {
        "issue_date": issue,
        "sale_date": sale,
        "payment_due_date": payment_due,
    }


def extract_place_of_issue(text: str) -> str | None:
    raw = _find(
        r"(?:Miejsce\s+wystawienia|Miejscowość)\s*(?::|-)?\s*([^\n]+)",
        text,
        flags=re.IGNORECASE,
    )
    if not raw:
        return None
    cleaned = _normalize_spaces(raw)
    if not cleaned or cleaned in {"-", "—"}:
        return None
    if re.search(r"Sprzedawca|Nabywca", cleaned, flags=re.IGNORECASE):
        return None
    return cleaned


def extract_nips(text: str) -> dict[str, str | None]:
    nips = re.findall(
        r"NIP\s*[:\s]*([0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2})",
        text,
        flags=re.IGNORECASE,
    )
    seller = nips[0] if len(nips) > 0 else None
    buyer = nips[1] if len(nips) > 1 else None
    return {"seller_nip": seller, "buyer_nip": buyer}


_AMT = r"(?:\d[\d\s]*,\d{2,3})"


def extract_totals(text: str) -> dict[str, str | None]:
    m = re.search(
        rf"RAZEM\s+({_AMT})\s+({_AMT})\s+({_AMT})",
        text,
        flags=re.IGNORECASE,
    )
    if m:
        return {
            "total_net": _normalize_spaces(m.group(1)),
            "total_vat": _normalize_spaces(m.group(2)),
            "total_gross": _normalize_spaces(m.group(3)),
        }

    pay = _find(
        r"Do\s+zapłaty\s*:\s*([0-9\s,\.\-]+)",
        text,
        flags=re.IGNORECASE,
    )
    if pay:
        return {
            "total_net": None,
            "total_vat": None,
            "total_gross": _normalize_spaces(pay),
        }
    return {"total_net": None, "total_vat": None, "total_gross": None}


def _split_amounts(line: str) -> list[str]:
    return re.findall(_AMT, line)


def _parse_line_item_line(line: str) -> dict[str, Any] | None:
    line = _normalize_spaces(line)
    if not re.match(r"^\d+\s+", line):
        return None

    odw = re.match(
        r"^(\d+)\s+(.+?)\s+Mg\s+([\d\s,]+)\s+([\d\s,]+)\s+(\-\*)\s+([\d\s,]+)\s+(\-\*)\s+([\d\s,]+)$",
        line,
        flags=re.IGNORECASE,
    )
    if odw:
        return {
            "lp": odw.group(1),
            "name": _normalize_spaces(odw.group(2)),
            "unit": "Mg",
            "quantity": _normalize_spaces(odw.group(3)),
            "unit_price_net": _normalize_spaces(odw.group(4)),
            "vat_rate": odw.group(5),
            "net_amount": _normalize_spaces(odw.group(6)),
            "vat_amount": odw.group(7),
            "gross_amount": _normalize_spaces(odw.group(8)),
        }

    m_lp = re.match(r"^(\d+)\s+(.*)$", line)
    if not m_lp:
        return None
    lp, rest = m_lp.group(1), m_lp.group(2)

    amounts = _split_amounts(rest)
    if len(amounts) < 3:
        return None

    net_amt = _normalize_spaces(amounts[-3])
    vat_amt = _normalize_spaces(amounts[-2])
    gross_amt = _normalize_spaces(amounts[-1])

    prefix = rest
    for token in (amounts[-3], amounts[-2], amounts[-1]):
        idx = prefix.rfind(token)
        if idx != -1:
            prefix = prefix[:idx].rstrip()

    rate_m = re.search(r"(23%|\d+%|\-\*|\*)\s*$", prefix)
    vat_rate = rate_m.group(1) if rate_m else None
    if rate_m:
        prefix = prefix[: rate_m.start()].rstrip()

    sub_amounts = _split_amounts(prefix)
    if len(sub_amounts) >= 2:
        qty = _normalize_spaces(sub_amounts[0])
        unit_price_net = _normalize_spaces(sub_amounts[1])
    elif len(sub_amounts) == 1:
        qty = _normalize_spaces(sub_amounts[0])
        unit_price_net = None
    else:
        qty = None
        unit_price_net = None

    unit_m = re.search(r"\b(Mg|szt\.?|kg|kpl\.?|m2|m3|godz\.?)\b", prefix, flags=re.IGNORECASE)
    unit = unit_m.group(1) if unit_m else None
    if unit_m:
        name_part = prefix[: unit_m.start()].strip()
    else:
        name_part = prefix

    name_part = re.sub(r"^\d+\s+", "", name_part)
    name = _normalize_spaces(name_part)

    return {
        "lp": lp,
        "name": name,
        "unit": unit,
        "quantity": qty,
        "unit_price_net": unit_price_net,
        "vat_rate": vat_rate,
        "net_amount": net_amt,
        "vat_amount": vat_amt,
        "gross_amount": gross_amt,
    }


def extract_line_items(text: str) -> list[dict[str, Any]]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    items: list[dict[str, Any]] = []
    for ln in lines:
        parsed = _parse_line_item_line(ln)
        if parsed and parsed.get("name"):
            items.append(parsed)
    return items


def _category_from_text(text: str) -> str:
    lower = text.lower()
    if "paliwo" in lower:
        return "paliwo"
    if "transport" in lower:
        return "transport"
    if "hotel" in lower or "gastronomia" in lower:
        return "delegacje"
    if "oprogramowanie" in lower or "subskrypcja" in lower:
        return "oprogramowanie"
    if "złom" in lower:
        return "surowce"
    return "inne"


def analyze_invoice_text(text: str) -> dict[str, Any]:
    """
    Ekstrakcja pól z tekstu faktury (warstwa tekstowa PDF lub OCR).
    Heurystyki pod typowe polskie layouty — bez LLM.
    """
    dates = extract_dates(text)
    totals = extract_totals(text)
    nips = extract_nips(text)
    line_items = extract_line_items(text)

    invoice_number = extract_invoice_number(text)
    issue_place = extract_place_of_issue(text)

    currency = _find(r"\b(PLN|EUR|USD)\b", text) or "PLN"

    return {
        "invoice_number": invoice_number,
        "issue_date": dates.get("issue_date"),
        "sale_date": dates.get("sale_date"),
        "payment_due_date": dates.get("payment_due_date"),
        "issue_place": issue_place,
        "seller_nip": nips.get("seller_nip"),
        "buyer_nip": nips.get("buyer_nip"),
        "net_amount": totals.get("total_net"),
        "vat_amount": totals.get("total_vat"),
        "gross_amount": totals.get("total_gross"),
        "currency": currency,
        "line_items": line_items,
        "category": _category_from_text(text),
        "extraction_method": "heuristic_pl_v2",
    }
