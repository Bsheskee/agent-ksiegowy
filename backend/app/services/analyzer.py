import re
import unicodedata
from typing import Any

_DATE_RE = r"(?:[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})"
_AMOUNT_RE = r"\d[\d\s]*,\d{2,3}"
_UNIT_RE = r"(?:Mg|szt\.?|kg|kpl\.?|m2|m3|godz\.?)"
_CITY_RE = r"[A-ZĄĆĘŁŃÓŚŹŻ][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż.\- ]{1,40}"


def _normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.replace("\xa0", " ").strip()


def _normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" ,:")


def _flatten_text(text: str) -> str:
    return _normalize_spaces(_normalize_text(text).replace("\n", " "))


def _normalize_amount(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = _normalize_spaces(value).replace(".", ",")
    return re.sub(r"\s+", " ", cleaned)


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    value = _normalize_spaces(value)
    if re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value):
        return value
    match = re.fullmatch(r"([0-9]{2})[.\-/]([0-9]{2})[.\-/]([0-9]{4})", value)
    if not match:
        return value
    day, month, year = match.groups()
    return f"{year}-{month}-{day}"


def _find(pattern: str, text: str, flags: int = re.IGNORECASE) -> str | None:
    match = re.search(pattern, text, flags=flags)
    if not match:
        return None
    return _normalize_spaces(match.group(1) or "")


def _find_date_after(label_pattern: str, text: str) -> str | None:
    return _normalize_date(
        _find(rf"{label_pattern}\s*[:\-]?\s*({_DATE_RE})", text, flags=re.IGNORECASE)
    )


def _find_date_before(label_pattern: str, text: str) -> str | None:
    return _normalize_date(
        _find(rf"({_DATE_RE})\s*{label_pattern}", text, flags=re.IGNORECASE)
    )


def _format_nip(digits: str) -> str | None:
    only_digits = re.sub(r"\D", "", digits)
    if len(only_digits) != 10:
        return None
    return f"{only_digits[:3]}-{only_digits[3:6]}-{only_digits[6:8]}-{only_digits[8:10]}"


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _clean_name(value: str) -> str:
    value = _normalize_spaces(value)
    value = re.sub(r"^(?:Sprzedawca|Nabywca|Faktura VAT|wartość netto|Kwota VAT)\b", "", value, flags=re.IGNORECASE)
    return _normalize_spaces(value)


def _fix_broken_city_name(value: str) -> str:
    tokens = value.split()
    if len(tokens) == 2 and len(tokens[0]) <= 3 and tokens[1][:1].islower():
        return "".join(tokens)
    return value


def extract_invoice_number(text: str) -> str | None:
    normalized = _normalize_text(text)
    flattened = _flatten_text(normalized)
    patterns = [
        r"Faktura\s+VAT\s+nr\.?\s*([A-Z0-9\/\-\s]+?)(?:\s*\(|$|\n)",
        r"Faktura\s+VAT\s+([A-Z0-9\/\-\s]+?)\s+oryginał",
        r"Faktura\s+nr\.?\s*([A-Z0-9\/\-\s]+?)(?:\s*\(|$|\n)",
        r"Nr\s+faktury\s*[:\s]+\s*([A-Z0-9\/\-\s]+)",
    ]
    for source in (normalized, flattened):
        for pattern in patterns:
            found = _find(pattern, source, flags=re.IGNORECASE | re.MULTILINE)
            if not found:
                continue
            cleaned = _normalize_spaces(found)
            if cleaned and cleaned.upper() != "VAT":
                return cleaned
    return None


def extract_dates(text: str) -> dict[str, str | None]:
    normalized = _normalize_text(text)
    flattened = _flatten_text(normalized)

    issue = _find_date_after(r"Data\s+wystawienia", normalized) or _find_date_before(
        r"Data\s+wystawienia", flattened
    )
    sale = _find_date_after(
        r"(?:Data\s+sprzedaży|Data\s+zakończenia\s+dostawy/usług)", normalized
    ) or _find_date_before(r"(?:Data\s+sprzedaży|Data\s+zakończenia\s+dostawy/usług)", flattened)

    payment_due = _find_date_after(
        r"(?:Termin\s+zapłaty|termin\s+płatności)", normalized
    ) or _find_date_before(r"(?:Termin\s+zapłaty|termin\s+płatności)", flattened)

    dates_in_order = [_normalize_date(match) for match in re.findall(_DATE_RE, normalized)]
    dates_in_order = [value for value in dates_in_order if value]
    if not issue and dates_in_order:
        issue = dates_in_order[0]
    if not sale and len(dates_in_order) > 1:
        sale = dates_in_order[1]
    if not sale and issue:
        sale = issue

    return {
        "issue_date": issue,
        "sale_date": sale,
        "payment_due_date": payment_due,
    }


def extract_place_of_issue(text: str) -> str | None:
    normalized = _normalize_text(text)
    flattened = _flatten_text(normalized)

    candidates = [
        _find(r"(?:Miejsce\s+wystawienia|Miejscowość)\s*[:\-]?\s*([^\n]+)", normalized),
        _find(rf"({_CITY_RE})\s*Miejsce\s+wystawienia", flattened),
        _find(rf"({_CITY_RE})\s*Miejscowość", flattened),
    ]

    for line in normalized.splitlines()[:4]:
        stripped = _normalize_spaces(line)
        if stripped and re.fullmatch(_CITY_RE, stripped):
            candidates.append(stripped)
            break

    postal_city = _find(rf"\b[0-9]{{2}}-[0-9]{{3}}\s+({_CITY_RE})", normalized)
    if postal_city:
        candidates.append(postal_city)

    for candidate in candidates:
        if not candidate:
            continue
        cleaned = _normalize_spaces(candidate)
        cleaned = _fix_broken_city_name(cleaned)
        if not cleaned or re.search(r"Sprzedawca|Nabywca|Data", cleaned, flags=re.IGNORECASE):
            continue
        return cleaned
    return None


def extract_nips(text: str) -> dict[str, str | None]:
    normalized = _normalize_text(text)
    raw_matches = re.findall(r"NIP\s*[:\s]*([0-9][0-9\-\s]{8,15}[0-9])", normalized, flags=re.IGNORECASE)
    nips = _dedupe_preserve_order(
        [formatted for candidate in raw_matches if (formatted := _format_nip(candidate))]
    )
    seller = nips[0] if len(nips) > 0 else None
    buyer = nips[1] if len(nips) > 1 else None
    return {"seller_nip": seller, "buyer_nip": buyer}


def extract_totals(text: str) -> dict[str, str | None]:
    normalized = _normalize_text(text)
    flattened = _flatten_text(normalized)

    patterns = [
        rf"RAZEM\s+({_AMOUNT_RE})\s+({_AMOUNT_RE})\s+({_AMOUNT_RE})",
        rf"Podatek\s+VAT\s+\d+%?\s+({_AMOUNT_RE})\s+({_AMOUNT_RE})\s+({_AMOUNT_RE})",
        rf"razem\s+({_AMOUNT_RE})\s+zł\s+[xX]\s+({_AMOUNT_RE})\s+zł\s+({_AMOUNT_RE})\s+zł",
        rf"razem\s+({_AMOUNT_RE})\s+zł\s+\d+%?\s+({_AMOUNT_RE})\s+zł\s+({_AMOUNT_RE})\s+zł",
    ]
    for pattern in patterns:
        match = re.search(pattern, normalized, flags=re.IGNORECASE)
        if match:
            return {
                "total_net": _normalize_amount(match.group(1)),
                "total_vat": _normalize_amount(match.group(2)),
                "total_gross": _normalize_amount(match.group(3)),
            }

    pay = _find(r"(?:Razem\s+do\s+zapłaty|Do\s+zapłaty)\s*[:\s]+\s*([0-9\s,\.\-]+)", flattened)
    if pay:
        return {
            "total_net": None,
            "total_vat": None,
            "total_gross": _normalize_amount(pay),
        }
    return {"total_net": None, "total_vat": None, "total_gross": None}


def _parse_named_line(line: str) -> dict[str, Any] | None:
    line = _normalize_spaces(line)
    standard = re.match(
        rf"^(?P<lp>\d+)\s+(?P<name>.+?)\s+(?P<unit>{_UNIT_RE})\s+(?P<qty>{_AMOUNT_RE})\s+"
        rf"(?P<unit_price>{_AMOUNT_RE})\s+(?P<vat_rate>(?:\d+%|\-\*|\*))\s+"
        rf"(?P<net>{_AMOUNT_RE})\s+(?P<vat>(?:{_AMOUNT_RE}|\-\*|\*))\s+(?P<gross>{_AMOUNT_RE})$",
        line,
        flags=re.IGNORECASE,
    )
    if not standard:
        return None
    return {
        "lp": standard.group("lp"),
        "name": _clean_name(standard.group("name")),
        "unit": standard.group("unit"),
        "quantity": _normalize_amount(standard.group("qty")),
        "unit_price_net": _normalize_amount(standard.group("unit_price")),
        "vat_rate": standard.group("vat_rate"),
        "net_amount": _normalize_amount(standard.group("net")),
        "vat_amount": _normalize_amount(standard.group("vat")) or standard.group("vat"),
        "gross_amount": _normalize_amount(standard.group("gross")),
    }


def _split_price_and_rate(value: str) -> tuple[str | None, str | None]:
    value = _normalize_spaces(value)
    direct = re.match(rf"^({_AMOUNT_RE})\s+(\d{{1,2}}%?)$", value)
    if direct:
        return _normalize_amount(direct.group(1)), direct.group(2)
    compact = re.match(rf"^({_AMOUNT_RE})(\d{{1,2}})$", value)
    if compact:
        return _normalize_amount(compact.group(1)), compact.group(2)
    return _normalize_amount(value), None


def _parse_compact_rows(text: str) -> list[dict[str, Any]]:
    flattened = _flatten_text(text)
    header_match = re.search(r"Lp\s*Nazwa.*?Cena\s+netto", flattened, flags=re.IGNORECASE)
    if header_match:
        flattened = flattened[header_match.end() :]
    summary_match = re.search(r"Podatek\s+VAT|Razem\s*:|Razem\s+do\s+zapłaty", flattened, flags=re.IGNORECASE)
    if summary_match:
        flattened = flattened[: summary_match.start()]
    flattened = re.sub(
        r"(\d[\d\s]*,\d{2})(?=\d+[A-ZĄĆĘŁŃÓŚŹŻ])",
        r"\1 ",
        flattened,
    )
    pattern = re.compile(
        rf"(?<!\S)(?P<lp>\d+)\s*(?P<name>[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż].+?)\s+(?P<qty>{_AMOUNT_RE})\s*(?P<unit>{_UNIT_RE})\s+"
        rf"(?P<price_and_rate>[0-9\s,]+?)\s+(?P<net>{_AMOUNT_RE})\s+(?P<vat>{_AMOUNT_RE})\s+"
        rf"(?P<gross>{_AMOUNT_RE})(?=\s*(?:\d+\s*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]|wartość|Podatek\s+VAT|Razem|Słownie|Wystawił|Odebrał|$))",
        flags=re.IGNORECASE,
    )
    items: list[dict[str, Any]] = []
    for match in pattern.finditer(flattened):
        unit_price_net, vat_rate = _split_price_and_rate(match.group("price_and_rate"))
        item = {
            "lp": match.group("lp"),
            "name": _clean_name(match.group("name")),
            "unit": match.group("unit"),
            "quantity": _normalize_amount(match.group("qty")),
            "unit_price_net": unit_price_net,
            "vat_rate": vat_rate,
            "net_amount": _normalize_amount(match.group("net")),
            "vat_amount": _normalize_amount(match.group("vat")),
            "gross_amount": _normalize_amount(match.group("gross")),
        }
        if item["name"]:
            items.append(item)
    return items


def _extract_tail_item_names(lines: list[str], item_count: int) -> list[str]:
    last_nip_index = max((index for index, line in enumerate(lines) if "NIP:" in line), default=-1)
    tail = [_normalize_spaces(line) for line in lines[last_nip_index + 1 :] if _normalize_spaces(line)]
    candidates = [
        line
        for line in tail
        if not re.search(
            r"^(?:nr konta|sposób zapłaty|termin płatności|do zapłaty|zapłacono|razem|słownie|wystawił|odebrał)",
            line,
            flags=re.IGNORECASE,
        )
        and re.search(r"[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]", line)
    ]
    if item_count <= 0 or len(candidates) < item_count:
        return []
    if len(candidates) % item_count == 0:
        chunk_size = len(candidates) // item_count
        return [
            _normalize_spaces(" ".join(candidates[index : index + chunk_size]))
            for index in range(0, len(candidates), chunk_size)
        ]
    return candidates[:item_count]


def _parse_orphan_rows(text: str) -> list[dict[str, Any]]:
    lines = [_normalize_spaces(line) for line in _normalize_text(text).splitlines() if _normalize_spaces(line)]
    pattern = re.compile(
        rf"^(?P<qty>\d+)\s+(?P<unit>{_UNIT_RE})\s+(?P<unit_price>{_AMOUNT_RE})\s+"
        rf"(?P<net>{_AMOUNT_RE})\s+(?P<vat_rate>\d{{1,2}})\s+(?P<vat>{_AMOUNT_RE})\s+(?P<gross>{_AMOUNT_RE})$",
        flags=re.IGNORECASE,
    )
    rows = [match for line in lines if (match := pattern.match(line))]
    if not rows:
        return []

    names = _extract_tail_item_names(lines, len(rows))
    items: list[dict[str, Any]] = []
    for index, match in enumerate(rows, start=1):
        items.append(
            {
                "lp": str(index),
                "name": names[index - 1] if len(names) >= index else None,
                "unit": match.group("unit"),
                "quantity": _normalize_amount(match.group("qty")),
                "unit_price_net": _normalize_amount(match.group("unit_price")),
                "vat_rate": f"{match.group('vat_rate')}%",
                "net_amount": _normalize_amount(match.group("net")),
                "vat_amount": _normalize_amount(match.group("vat")),
                "gross_amount": _normalize_amount(match.group("gross")),
            }
        )
    return items


def extract_line_items(text: str) -> list[dict[str, Any]]:
    normalized = _normalize_text(text)
    lines = [_normalize_spaces(line) for line in normalized.splitlines() if _normalize_spaces(line)]

    items: list[dict[str, Any]] = []
    for line in lines:
        parsed = _parse_named_line(line)
        if parsed and parsed.get("name"):
            items.append(parsed)

    if not items:
        items = _parse_compact_rows(normalized)
    if not items:
        items = _parse_orphan_rows(normalized)

    deduped: list[dict[str, Any]] = []
    seen: set[tuple[str | None, str | None, str | None]] = set()
    for item in items:
        key = (item.get("lp"), item.get("name"), item.get("gross_amount"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def _category_from_text(text: str) -> str:
    lower = _normalize_text(text).lower()
    if "paliwo" in lower:
        return "paliwo"
    if "transport" in lower:
        return "transport"
    if "hotel" in lower or "gastronomia" in lower:
        return "delegacje"
    if "oprogramowanie" in lower or "subskrypcja" in lower or "microsoft" in lower:
        return "oprogramowanie"
    if "złom" in lower:
        return "surowce"
    if "perfum" in lower:
        return "inne"
    if "hp " in lower or "intel core" in lower:
        return "sprzęt"
    return "inne"


def analyze_invoice_text(text: str) -> dict[str, Any]:
    normalized = _normalize_text(text)
    dates = extract_dates(normalized)
    totals = extract_totals(normalized)
    nips = extract_nips(normalized)
    line_items = extract_line_items(normalized)

    return {
        "invoice_number": extract_invoice_number(normalized),
        "issue_date": dates.get("issue_date"),
        "sale_date": dates.get("sale_date"),
        "payment_due_date": dates.get("payment_due_date"),
        "issue_place": extract_place_of_issue(normalized),
        "seller_nip": nips.get("seller_nip"),
        "buyer_nip": nips.get("buyer_nip"),
        "net_amount": totals.get("total_net"),
        "vat_amount": totals.get("total_vat"),
        "gross_amount": totals.get("total_gross"),
        "currency": _find(r"\b(PLN|EUR|USD)\b", normalized) or "PLN",
        "line_items": line_items,
        "category": _category_from_text(normalized),
        "extraction_method": "heuristic_pl_v3",
    }
