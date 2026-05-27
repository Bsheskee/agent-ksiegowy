// ── DOM refs ──────────────────────────────────────────────────────────────
const backendUrlInput      = document.getElementById("backendUrl");
const invoiceFileInput     = document.getElementById("invoiceFile");
const uploadBtn            = document.getElementById("uploadBtn");
const statusText           = document.getElementById("statusText");
const resultBox            = document.getElementById("resultBox");
const refreshBtn           = document.getElementById("refreshBtn");
const saveBackendBtn       = document.getElementById("saveBackendBtn");
const invoicesList         = document.getElementById("invoicesList");
const factTableBody        = document.getElementById("factTableBody");
const metaTableBody        = document.getElementById("metaTableBody");
const ocrPreviewText       = document.getElementById("ocrPreviewText");
const ocrPreviewSummary    = document.getElementById("ocrPreviewSummary");
const ocrPreviewWarning    = document.getElementById("ocrPreviewWarning");
const resultStatusBadge    = document.getElementById("resultStatusBadge");
const linesTableBody       = document.getElementById("linesTableBody");
const analysisSection      = document.getElementById("analysisSection");
const linesSection         = document.getElementById("linesSection");
const editBtn              = document.getElementById("editBtn");

// Filter
const filterCategory  = document.getElementById("filterCategory");
const filterStatus    = document.getElementById("filterStatus");
const filterDateFrom  = document.getElementById("filterDateFrom");
const filterDateTo    = document.getElementById("filterDateTo");
const applyFilterBtn  = document.getElementById("applyFilterBtn");
const clearFilterBtn  = document.getElementById("clearFilterBtn");

// Export
const exportCsvBtn    = document.getElementById("exportCsvBtn");
const exportXlsxBtn   = document.getElementById("exportXlsxBtn");

// Edit modal
const editModal        = document.getElementById("editModal");
const editModalBackdrop = document.getElementById("editModalBackdrop");
const editModalClose   = document.getElementById("editModalClose");
const editCancelBtn    = document.getElementById("editCancelBtn");
const editForm         = document.getElementById("editForm");
const editStatus       = document.getElementById("editStatus");

// ── State ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "agent_ks_backend_url";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

let currentInvoiceId = null;   // invoice shown in the analysis panel

backendUrlInput.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_BACKEND_URL;

// ── Helpers ───────────────────────────────────────────────────────────────
function getBaseUrl() {
  return backendUrlInput.value.trim().replace(/\/+$/, "");
}

function shortId(value) {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b91c1c" : "#065f46";
}

function setResultBadge(st) {
  resultStatusBadge.className = "badge";
  if (st === "processed") {
    resultStatusBadge.classList.add("success");
    resultStatusBadge.textContent = "Przetworzono";
  } else if (st === "failed") {
    resultStatusBadge.classList.add("error");
    resultStatusBadge.textContent = "Błąd";
  } else {
    resultStatusBadge.classList.add("neutral");
    resultStatusBadge.textContent = st || "Brak wyniku";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTableRows(target, rows) {
  target.innerHTML = rows
    .map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value ?? "-")}</td></tr>`,
    )
    .join("");
}

function categoryBadge(cat) {
  if (!cat || cat === "-") return escapeHtml(cat || "-");
  const colour = {
    "oprogramowanie": "#6d28d9", "sprzęt IT": "#0369a1", "paliwo": "#b45309",
    "transport": "#0891b2", "delegacje": "#0f766e", "media": "#7c3aed",
    "materiały biurowe": "#4338ca", "usługi doradcze": "#be185d",
    "marketing": "#dc2626", "surowce": "#92400e", "wyposażenie": "#1d4ed8",
    "ubezpieczenia": "#166534", "inne": "#475569",
  }[cat] || "#475569";
  return `<span class="catBadge" style="background:${colour}20;color:${colour};border-color:${colour}40">${escapeHtml(cat)}</span>`;
}

function renderLineItems(items) {
  if (!items || !items.length) {
    linesTableBody.innerHTML = `<tr><td colspan="9" class="empty">Brak pozycji.</td></tr>`;
    return;
  }
  linesTableBody.innerHTML = items
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.lp)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.unit || "-")}</td>
        <td>${escapeHtml(row.quantity)}</td>
        <td>${escapeHtml(row.unit_price_net)}</td>
        <td>${escapeHtml(row.vat_rate)}</td>
        <td>${escapeHtml(row.net_amount)}</td>
        <td>${escapeHtml(row.vat_amount)}</td>
        <td>${escapeHtml(row.gross_amount)}</td>
      </tr>`,
    )
    .join("");
}

// ── Render analysis panel ─────────────────────────────────────────────────
function renderResult(data) {
  resultBox.textContent = JSON.stringify(data, null, 2);
  const analysis = data.analysis || {};
  const summary  = data.processing_summary || {};
  const st       = data.status || "-";

  currentInvoiceId = data.id || null;

  renderTableRows(factTableBody, [
    { label: "Numer faktury",       value: analysis.invoice_number   || "-" },
    { label: "Data wystawienia",    value: analysis.issue_date       || "-" },
    { label: "Data sprzedaży",      value: analysis.sale_date        || "-" },
    { label: "Termin zapłaty",      value: analysis.payment_due_date || "-" },
    { label: "Miejsce wystawienia", value: analysis.issue_place      || "-" },
    { label: "NIP sprzedawcy",      value: analysis.seller_nip       || "-" },
    { label: "NIP nabywcy",         value: analysis.buyer_nip        || "-" },
    { label: "Suma netto",          value: analysis.net_amount       || "-" },
    { label: "Suma VAT",            value: analysis.vat_amount       || "-" },
    { label: "Suma brutto",         value: analysis.gross_amount     || "-" },
    { label: "Waluta",              value: analysis.currency         || "-" },
    { label: "Kategoria kosztu",    value: analysis.category         || "-" },
  ]);

  // Replace category cell with coloured badge
  const rows = factTableBody.querySelectorAll("tr");
  const catRow = rows[rows.length - 1];
  if (catRow) catRow.querySelector("td").innerHTML = categoryBadge(analysis.category);

  renderLineItems(analysis.line_items);

  renderTableRows(metaTableBody, [
    { label: "ID dokumentu", value: shortId(data.id) },
    { label: "Nazwa pliku",  value: data.original_filename || "-" },
    { label: "Typ pliku",    value: data.content_type     || "-" },
    { label: "Rozmiar",      value: formatBytes(data.size_bytes) },
    { label: "Silnik OCR",   value: analysis.ocr_engine || summary.engine || "-" },
    { label: "Długość OCR",  value: `${analysis.ocr_text_length || summary.text_length || 0} znaków` },
  ]);

  if (ocrPreviewText)    ocrPreviewText.textContent    = summary.preview || "Brak podglądu OCR.";
  if (ocrPreviewWarning) {
    ocrPreviewWarning.textContent  = summary.warning || "";
    ocrPreviewWarning.style.display = summary.warning ? "block" : "none";
  }
  if (ocrPreviewSummary) {
    const len = analysis.ocr_text_length || summary.text_length || 0;
    ocrPreviewSummary.textContent = `Tekst OCR (podgląd, ${len} znaków)`;
  }
  setResultBadge(st);

  // Show analysis and lines sections
  analysisSection.style.display = "";
  linesSection.style.display = analysis.line_items?.length ? "" : "none";
  analysisSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── History list ──────────────────────────────────────────────────────────
function renderInvoices(items) {
  invoicesList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "historyCard";
    empty.textContent = "Brak dokumentów spełniających kryteria.";
    invoicesList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "historyCard clickable";
    const analysis = item.analysis || {};
    const isProcessed = item.status === "processed";
    card.innerHTML = `
      <div class="historyCardTop">
        <div class="historyName">${escapeHtml(item.original_filename || "(brak nazwy)")}</div>
        <span class="badge ${item.status === "processed" ? "success" : item.status === "failed" ? "error" : "neutral"} small">
          ${escapeHtml(item.status || "-")}
        </span>
      </div>
      <div class="historyMeta">
        Numer: <b>${escapeHtml(analysis.invoice_number || "-")}</b>
        &nbsp;|&nbsp; Brutto: <b>${escapeHtml(analysis.gross_amount || "-")} ${escapeHtml(analysis.currency || "")}</b>
      </div>
      <div class="historyMeta">
        ${categoryBadge(analysis.category || "-")}
        &nbsp; Data: ${escapeHtml(analysis.issue_date || "-")}
        &nbsp;|&nbsp; ID: <code>${escapeHtml(shortId(item.id))}</code>
      </div>
      ${isProcessed ? '<div class="historyHint">Kliknij, aby zobaczyć szczegóły</div>' : ""}
    `;

    if (isProcessed) {
      card.addEventListener("click", () => loadInvoiceDetail(item.id));
    }
    invoicesList.appendChild(card);
  });
}

async function loadInvoiceDetail(invoiceId) {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/v1/invoices/${invoiceId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderResult(data);
    setStatus(`Załadowano dokument ${shortId(invoiceId)}.`);
  } catch (err) {
    setStatus(`Błąd ładowania szczegółów: ${err.message}`, true);
  }
}

// ── Fetch recent invoices ─────────────────────────────────────────────────
function buildFilterParams() {
  const params = new URLSearchParams();
  if (filterCategory.value)  params.set("category",  filterCategory.value);
  if (filterStatus.value)    params.set("status",     filterStatus.value);
  if (filterDateFrom.value)  params.set("date_from",  filterDateFrom.value);
  if (filterDateTo.value)    params.set("date_to",    filterDateTo.value);
  params.set("limit", "50");
  return params;
}

async function fetchRecent() {
  const baseUrl = getBaseUrl();
  try {
    const params = buildFilterParams();
    const response = await fetch(`${baseUrl}/api/v1/invoices?${params}`);
    if (!response.ok) throw new Error(`Błąd listy dokumentów: ${response.status}`);
    const data = await response.json();
    renderInvoices(data);
  } catch (error) {
    setStatus(error.message, true);
  }
}

// ── Export helpers ────────────────────────────────────────────────────────
function exportFile(format) {
  const baseUrl = getBaseUrl();
  const params = buildFilterParams();
  params.set("limit", "1000");
  const url = `${baseUrl}/api/v1/invoices/export/${format}?${params}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `faktury.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal() {
  if (!currentInvoiceId) return;
  // Pre-fill form from current table
  const rows = factTableBody.querySelectorAll("tr");
  const fieldMap = {
    "Numer faktury":       "invoice_number",
    "Data wystawienia":    "issue_date",
    "Data sprzedaży":      "sale_date",
    "Termin zapłaty":      "payment_due_date",
    "Miejsce wystawienia": "issue_place",
    "NIP sprzedawcy":      "seller_nip",
    "NIP nabywcy":         "buyer_nip",
    "Suma netto":          "net_amount",
    "Suma VAT":            "vat_amount",
    "Suma brutto":         "gross_amount",
    "Waluta":              "currency",
    "Kategoria kosztu":    "category",
  };
  rows.forEach((row) => {
    const label = row.querySelector("th")?.textContent?.trim();
    const value = row.querySelector("td")?.textContent?.trim();
    const fieldName = fieldMap[label];
    if (!fieldName) return;
    const input = editForm.elements[fieldName];
    if (!input) return;
    if (input.tagName === "SELECT") {
      input.value = value === "-" ? "inne" : value;
    } else if (input.type === "date") {
      input.value = value && value !== "-" ? value : "";
    } else {
      input.value = value === "-" ? "" : value;
    }
  });
  editStatus.textContent = "";
  editModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  editModal.style.display = "none";
  document.body.style.overflow = "";
}

async function saveEditForm(event) {
  event.preventDefault();
  if (!currentInvoiceId) return;

  const formData = new FormData(editForm);
  const patch = {};
  formData.forEach((value, key) => {
    patch[key] = value.trim() || null;
  });

  editStatus.textContent = "Zapisywanie…";
  editStatus.style.color = "#475569";

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/v1/invoices/${currentInvoiceId}/analysis`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    const data = await response.json();
    renderResult(data);
    editStatus.textContent = "✓ Zapisano zmiany.";
    editStatus.style.color = "#065f46";
    await fetchRecent();
    setTimeout(closeEditModal, 800);
  } catch (err) {
    editStatus.textContent = `Błąd: ${err.message}`;
    editStatus.style.color = "#b91c1c";
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
uploadBtn.addEventListener("click", async () => {
  const baseUrl = getBaseUrl();
  const file = invoiceFileInput.files?.[0];
  if (!file) { setStatus("Najpierw wybierz plik.", true); return; }

  uploadBtn.disabled = true;
  setStatus("Przesyłanie i przetwarzanie…");

  try {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${baseUrl}/api/v1/invoices/upload-and-process`, {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || `Błąd: ${response.status}`);
    renderResult(data);
    setStatus("Sukces: dokument przetworzony.");
    await fetchRecent();
  } catch (error) {
    setStatus(error.message || "Wystąpił błąd.", true);
  } finally {
    uploadBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", fetchRecent);
applyFilterBtn.addEventListener("click", fetchRecent);
clearFilterBtn.addEventListener("click", () => {
  filterCategory.value = "";
  filterStatus.value   = "";
  filterDateFrom.value = "";
  filterDateTo.value   = "";
  fetchRecent();
});

exportCsvBtn.addEventListener("click",  () => exportFile("csv"));
exportXlsxBtn.addEventListener("click", () => exportFile("xlsx"));

editBtn.addEventListener("click", openEditModal);
editModalClose.addEventListener("click",  closeEditModal);
editCancelBtn.addEventListener("click",   closeEditModal);
editModalBackdrop.addEventListener("click", closeEditModal);
editForm.addEventListener("submit", saveEditForm);

saveBackendBtn.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY, backendUrlInput.value.trim() || DEFAULT_BACKEND_URL);
  setStatus("Zapisano ustawienia backendu.");
  fetchRecent();
});

// ── Init ──────────────────────────────────────────────────────────────────
fetchRecent();
