// ── DOM refs ──────────────────────────────────────────────────────────────
const backendUrlInput      = document.getElementById("backendUrl");
const invoiceFileInput     = document.getElementById("invoiceFile");
const uploadBtn            = document.getElementById("uploadBtn");
const uploadBtnText        = document.getElementById("uploadBtnText");
const uploadSpinner        = document.getElementById("uploadSpinner");
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
const bielikStatusBadge    = document.getElementById("bielikStatusBadge");
const confirmedBadge       = document.getElementById("confirmedBadge");
const confirmBtn           = document.getElementById("confirmBtn");
const reprocessBtn         = document.getElementById("reprocessBtn");
const linesTableBody       = document.getElementById("linesTableBody");
const analysisSection      = document.getElementById("analysisSection");
const linesSection         = document.getElementById("linesSection");
const editBtn              = document.getElementById("editBtn");

// Filter
const filterSearch    = document.getElementById("filterSearch");
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
const editCategorySelect = document.getElementById("editCategorySelect");

// Stats
const statTotalCount   = document.getElementById("statTotalCount");
const statTotalGross   = document.getElementById("statTotalGross");
const refreshStatsBtn  = document.getElementById("refreshStatsBtn");

// ── State ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "agent_ks_backend_url";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

let currentInvoiceId = null;   // invoice shown in the analysis panel
let chartCategory = null;      // Chart.js instance for category chart
let chartMonth    = null;      // Chart.js instance for month chart

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

function formatAmount(value) {
  if (value == null || value === "") return "-";
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

// ── Toast notifications ───────────────────────────────────────────────────
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "info", duration = 4000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toastMsg">${escapeHtml(message)}</span>
    <button class="toastClose" aria-label="Zamknij">✕</button>
  `;
  const close = () => {
    toast.classList.add("toastFadeOut");
    setTimeout(() => toast.remove(), 300);
  };
  toast.querySelector(".toastClose").addEventListener("click", close);
  toastContainer.appendChild(toast);
  if (duration > 0) setTimeout(close, duration);
}

// ── Loading state ─────────────────────────────────────────────────────────
function setUploading(loading) {
  uploadBtn.disabled = loading;
  uploadBtnText.textContent = loading ? "Przetwarzanie…" : "Przetwórz dokument";
  uploadSpinner.style.display = loading ? "inline-block" : "none";
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
    { label: "Nazwa sprzedawcy",    value: analysis.seller_name      || "-" },
    { label: "NIP sprzedawcy",      value: analysis.seller_nip       || "-" },
    { label: "Nazwa nabywcy",       value: analysis.buyer_name       || "-" },
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

  // Bielik status badge
  if (analysis.bielik_status) {
    const isBielik = analysis.bielik_status === "applied";
    bielikStatusBadge.style.display = "";
    bielikStatusBadge.textContent = isBielik ? "🤖 Bielik" : "📐 Heurystyka";
    bielikStatusBadge.className = `badge bielikBadge ${isBielik ? "bielikApplied" : "neutral"}`;
    bielikStatusBadge.title = isBielik
      ? "Analiza wzbogacona przez model Bielik"
      : "Analiza oparta tylko na heurystyce";
  } else {
    bielikStatusBadge.style.display = "none";
  }

  // Confirmed badge + button
  const isConfirmed = analysis.confirmed === true;
  confirmedBadge.style.display = "";
  confirmedBadge.textContent = isConfirmed ? "✓ Zatwierdzone" : "Niezatwierdzone";
  confirmedBadge.className = `badge ${isConfirmed ? "success" : "warning"}`;
  confirmBtn.style.display = isConfirmed ? "none" : "";
  confirmBtn.disabled = false;

  // Re-process button (show only for processed/failed/uploaded)
  reprocessBtn.style.display = (data.status && data.status !== "processing") ? "" : "none";

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
    const hasOcrWarn = isProcessed && analysis.ocr_warning;
    const isConfirmed = analysis.confirmed === true;
    const statusClass = item.status === "processed" ? "success" : item.status === "failed" ? "error" : "neutral";

    card.innerHTML = `
      <div class="historyCardTop">
        <div class="historyName">${escapeHtml(item.original_filename || "(brak nazwy)")}</div>
        <div class="historyBadges">
          ${hasOcrWarn ? `<span class="badge warning small" title="${escapeHtml(analysis.ocr_warning)}">⚠ OCR</span>` : ""}
          ${isConfirmed ? `<span class="badge success small" title="Faktura zatwierdzona">✓</span>` : ""}
          <span class="badge ${statusClass} small">${escapeHtml(item.status || "-")}</span>
        </div>
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
    showToast(`Błąd ładowania szczegółów: ${err.message}`, "error");
    setStatus(`Błąd ładowania szczegółów: ${err.message}`, true);
  }
}

// ── Fetch recent invoices ─────────────────────────────────────────────────
function buildFilterParams() {
  const params = new URLSearchParams();
  if (filterSearch.value.trim())  params.set("search",    filterSearch.value.trim());
  if (filterCategory.value)       params.set("category",  filterCategory.value);
  if (filterStatus.value)         params.set("status",     filterStatus.value);
  if (filterDateFrom.value)       params.set("date_from",  filterDateFrom.value);
  if (filterDateTo.value)         params.set("date_to",    filterDateTo.value);
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
    showToast(error.message, "error");
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

// ── Categories from API ───────────────────────────────────────────────────
async function loadCategories() {
  const baseUrl = getBaseUrl();
  try {
    const resp = await fetch(`${baseUrl}/api/v1/invoices/categories`);
    if (!resp.ok) return;
    const cats = await resp.json();

    // Populate filter dropdown
    filterCategory.innerHTML = '<option value="">Wszystkie</option>';
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      filterCategory.appendChild(opt);
    });

    // Populate edit modal dropdown
    editCategorySelect.innerHTML = "";
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      editCategorySelect.appendChild(opt);
    });
  } catch (_) {
    // Fallback: keep hardcoded options if API is unavailable
  }
}

// ── Statistics / Charts ───────────────────────────────────────────────────
async function fetchAndRenderStats() {
  const baseUrl = getBaseUrl();
  try {
    const resp = await fetch(`${baseUrl}/api/v1/invoices/stats`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const stats = await resp.json();

    statTotalCount.textContent = stats.total_count ?? "-";
    statTotalGross.textContent = stats.total_gross != null
      ? `${stats.total_gross.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} PLN`
      : "-";

    renderCategoryChart(stats.by_category || []);
    renderMonthChart((stats.by_month || []).slice().reverse());
  } catch (err) {
    console.warn("Stats fetch failed:", err.message);
  }
}

function renderCategoryChart(data) {
  const canvas = document.getElementById("chartByCategory");
  if (!canvas || !window.Chart) return;
  if (chartCategory) chartCategory.destroy();

  const labels = data.map((d) => d.category);
  const values = data.map((d) => d.total_gross);
  const colours = labels.map((cat) => ({
    "oprogramowanie": "#6d28d9", "sprzęt IT": "#0369a1", "paliwo": "#b45309",
    "transport": "#0891b2", "delegacje": "#0f766e", "media": "#7c3aed",
    "materiały biurowe": "#4338ca", "usługi doradcze": "#be185d",
    "marketing": "#dc2626", "surowce": "#92400e", "wyposażenie": "#1d4ed8",
    "ubezpieczenia": "#166534", "inne": "#475569",
  }[cat] || "#475569");

  chartCategory = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Suma brutto (PLN)",
        data: values,
        backgroundColor: colours.map((c) => `${c}cc`),
        borderColor: colours,
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { callback: (v) => `${v.toLocaleString("pl")} PLN` } },
      },
    },
  });
}

function renderMonthChart(data) {
  const canvas = document.getElementById("chartByMonth");
  if (!canvas || !window.Chart) return;
  if (chartMonth) chartMonth.destroy();

  const labels = data.map((d) => d.month);
  const values = data.map((d) => d.total_gross);

  chartMonth = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Suma brutto (PLN)",
        data: values,
        backgroundColor: "#2563ebcc",
        borderColor: "#2563eb",
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v) => `${v.toLocaleString("pl")} PLN` } },
      },
    },
  });
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
    "Nazwa sprzedawcy":    "seller_name",
    "NIP sprzedawcy":      "seller_nip",
    "Nazwa nabywcy":       "buyer_name",
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
      input.value = value === "-" ? "" : value;
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

  // Confirm before overwriting
  if (!confirm("Zapisać zmiany w danych faktury?")) return;

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
    showToast("Zmiany zapisane pomyślnie.", "success");
    await fetchRecent();
    setTimeout(closeEditModal, 800);
  } catch (err) {
    editStatus.textContent = `Błąd: ${err.message}`;
    editStatus.style.color = "#b91c1c";
    showToast(`Błąd zapisu: ${err.message}`, "error");
  }
}

// ── Confirm (approve) invoice ─────────────────────────────────────────────
async function confirmInvoice() {
  if (!currentInvoiceId) return;
  confirmBtn.disabled = true;
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/v1/invoices/${currentInvoiceId}/analysis`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderResult(data);
    showToast("Faktura zatwierdzona.", "success");
    await fetchRecent();
  } catch (err) {
    showToast(`Błąd zatwierdzenia: ${err.message}`, "error");
    confirmBtn.disabled = false;
  }
}

// ── Re-process invoice ────────────────────────────────────────────────────
async function reprocessInvoice() {
  if (!currentInvoiceId) return;
  if (!confirm("Uruchomić ponowne przetwarzanie OCR i analizy dla tej faktury?")) return;

  reprocessBtn.disabled = true;
  reprocessBtn.textContent = "⏳ Przetwarzam…";
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/v1/invoices/${currentInvoiceId}/process`,
      { method: "POST" }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    const data = await response.json();
    renderResult(data);
    showToast("Dokument przetworzony ponownie.", "success");
    await fetchRecent();
    fetchAndRenderStats();
  } catch (err) {
    showToast(`Błąd przetwarzania: ${err.message}`, "error");
  } finally {
    reprocessBtn.disabled = false;
    reprocessBtn.textContent = "🔄 Przetworz ponownie";
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
uploadBtn.addEventListener("click", async () => {
  const baseUrl = getBaseUrl();
  const file = invoiceFileInput.files?.[0];
  if (!file) { showToast("Najpierw wybierz plik.", "warning"); setStatus("Najpierw wybierz plik.", true); return; }

  setUploading(true);
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

    if (data.duplicate) {
      showToast("Plik już istnieje w systemie – wczytano istniejący rekord.", "warning");
    } else {
      showToast("Dokument przetworzony pomyślnie.", "success");
    }

    renderResult(data);
    setStatus(data.duplicate ? "Duplikat – wczytano istniejący dokument." : "Sukces: dokument przetworzony.");
    await fetchRecent();
    fetchAndRenderStats();
  } catch (error) {
    showToast(error.message || "Wystąpił błąd.", "error");
    setStatus(error.message || "Wystąpił błąd.", true);
  } finally {
    setUploading(false);
  }
});

refreshBtn.addEventListener("click", fetchRecent);
applyFilterBtn.addEventListener("click", fetchRecent);
filterSearch.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchRecent(); });
clearFilterBtn.addEventListener("click", () => {
  filterSearch.value  = "";
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

confirmBtn.addEventListener("click", confirmInvoice);
reprocessBtn.addEventListener("click", reprocessInvoice);
refreshStatsBtn.addEventListener("click", fetchAndRenderStats);

saveBackendBtn.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY, backendUrlInput.value.trim() || DEFAULT_BACKEND_URL);
  showToast("Ustawienia backendu zapisane.", "success");
  setStatus("Zapisano ustawienia backendu.");
  loadCategories();
  fetchRecent();
  fetchAndRenderStats();
});

// ── Init ──────────────────────────────────────────────────────────────────
loadCategories();
fetchRecent();
fetchAndRenderStats();
