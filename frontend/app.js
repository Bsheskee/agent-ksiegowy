// ── Constants & state ─────────────────────────────────────────────────
const STORAGE_KEY       = "agent_ks_backend_url";
const DEFAULT_BACKEND   = "http://127.0.0.1:8000";

let currentInvoiceId   = null;   // invoice shown in the analysis panel
let currentAnalysisData = null;  // raw analysis object of current invoice
let chartCategory      = null;   // Chart.js instance – category
let chartMonth         = null;   // Chart.js instance – month

const PAGE_TITLES = {
  dashboard: "Pulpit",
  upload:    "Nowa faktura",
  documents: "Dokumenty",
  analytics: "Statystyki",
  settings:  "Ustawienia",
};

// ── DOM references ─────────────────────────────────────────────────────
const backendUrlInput   = document.getElementById("backendUrl");
const invoiceFileInput  = document.getElementById("invoiceFile");
const uploadBtn         = document.getElementById("uploadBtn");
const uploadBtnText     = document.getElementById("uploadBtnText");
const uploadSpinner     = document.getElementById("uploadSpinner");
const statusText        = document.getElementById("statusText");
const resultBox         = document.getElementById("resultBox");
const saveBackendBtn    = document.getElementById("saveBackendBtn");
const metaTableBody     = document.getElementById("metaTableBody");
const ocrPreviewText    = document.getElementById("ocrPreviewText");
const ocrPreviewSummary = document.getElementById("ocrPreviewSummary");
const ocrPreviewWarning = document.getElementById("ocrPreviewWarning");

// Analysis panel fields
const dfInvoiceNumber = document.getElementById("df-invoice-number");
const dfIssueDate     = document.getElementById("df-issue-date");
const dfSaleDate      = document.getElementById("df-sale-date");
const dfDueDate       = document.getElementById("df-due-date");
const dfIssuePlace    = document.getElementById("df-issue-place");
const dfSellerName    = document.getElementById("df-seller-name");
const dfSellerNip     = document.getElementById("df-seller-nip");
const dfBuyerName     = document.getElementById("df-buyer-name");
const dfBuyerNip      = document.getElementById("df-buyer-nip");
const dfNetAmount     = document.getElementById("df-net-amount");
const dfVatAmount     = document.getElementById("df-vat-amount");
const dfGrossAmount   = document.getElementById("df-gross-amount");
const dfCurrency      = document.getElementById("df-currency");
const dfCategory      = document.getElementById("df-category");

// Analysis section meta
const analysisSection  = document.getElementById("analysisSection");
const linesSection     = document.getElementById("linesSection");
const linesTableBody   = document.getElementById("linesTableBody");
const resultStatusBadge = document.getElementById("resultStatusBadge");
const bielikStatusBadge = document.getElementById("bielikStatusBadge");
const confirmedBadge   = document.getElementById("confirmedBadge");
const confirmBtn       = document.getElementById("confirmBtn");
const reprocessBtn     = document.getElementById("reprocessBtn");
const editBtn          = document.getElementById("editBtn");

// Filter + export
const filterSearch    = document.getElementById("filterSearch");
const filterCategory  = document.getElementById("filterCategory");
const filterStatus    = document.getElementById("filterStatus");
const filterDateFrom  = document.getElementById("filterDateFrom");
const filterDateTo    = document.getElementById("filterDateTo");
const applyFilterBtn  = document.getElementById("applyFilterBtn");
const clearFilterBtn  = document.getElementById("clearFilterBtn");
const exportCsvBtn    = document.getElementById("exportCsvBtn");
const exportXlsxBtn   = document.getElementById("exportXlsxBtn");
const refreshBtn      = document.getElementById("refreshBtn");

// Stats
const statTotalCount  = document.getElementById("statTotalCount");
const statTotalGross  = document.getElementById("statTotalGross");
const statTotalCountB = document.getElementById("statTotalCountB");
const statTotalGrossB = document.getElementById("statTotalGrossB");
const refreshStatsBtn = document.getElementById("refreshStatsBtn");

// Edit modal
const editModal          = document.getElementById("editModal");
const editModalBackdrop  = document.getElementById("editModalBackdrop");
const editModalClose     = document.getElementById("editModalClose");
const editCancelBtn      = document.getElementById("editCancelBtn");
const editForm           = document.getElementById("editForm");
const editStatus         = document.getElementById("editStatus");
const editCategorySelect = document.getElementById("editCategorySelect");

// Dashboard
const dashRecentList  = document.getElementById("dashRecentList");
const dashViewAllBtn  = document.getElementById("dashViewAllBtn");

// Sidebar / nav
const sidebar         = document.getElementById("sidebar");
const sidebarOverlay  = document.getElementById("sidebarOverlay");
const sidebarToggle   = document.getElementById("sidebarToggle");
const pageTitle       = document.getElementById("pageTitle");
const dropzone        = document.getElementById("dropzone");
const dropzoneText    = document.getElementById("dropzoneText");

// Init storage
backendUrlInput.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_BACKEND;

// ── Helpers ────────────────────────────────────────────────────────────
function getBaseUrl() {
  return (backendUrlInput.value || DEFAULT_BACKEND).trim().replace(/\/+$/, "");
}

function shortId(v) {
  if (!v) return "—";
  return v.length > 12 ? `${v.slice(0, 8)}…${v.slice(-4)}` : v;
}

function formatBytes(b) {
  if (!Number.isFinite(b)) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function txt(el, val) {
  if (el) el.textContent = val ?? "—";
}

function setStatus(msg, isError = false) {
  if (!statusText) return;
  statusText.textContent = msg;
  statusText.style.color = isError ? "var(--c-error)" : "var(--c-success)";
}

// ── Category colour map ───────────────────────────────────────────────
const CAT_COLOURS = {
  "oprogramowanie":     "#6d28d9",
  "sprzęt IT":          "#0369a1",
  "paliwo":             "#b45309",
  "transport":          "#0891b2",
  "delegacje":          "#0f766e",
  "media":              "#7c3aed",
  "materiały biurowe":  "#4338ca",
  "usługi doradcze":    "#be185d",
  "marketing":          "#dc2626",
  "surowce":            "#92400e",
  "wyposażenie":        "#1d4ed8",
  "ubezpieczenia":      "#166534",
  "inne":               "#475569",
};

function categoryBadge(cat) {
  if (!cat || cat === "—" || cat === "-") return escapeHtml(cat || "—");
  const c = CAT_COLOURS[cat] || "#475569";
  return `<span class="cat-badge" style="background:${c}18;color:${c};border-color:${c}35">${escapeHtml(cat)}</span>`;
}

// ── Toast ──────────────────────────────────────────────────────────────
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "info", duration = 4000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-msg">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Zamknij">✕</button>`;
  const close = () => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 300);
  };
  toast.querySelector(".toast-close").addEventListener("click", close);
  toastContainer.appendChild(toast);
  if (duration > 0) setTimeout(close, duration);
}

// ── Navigation ─────────────────────────────────────────────────────────
function navigateTo(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(l => l.classList.add("active"));

  if (pageTitle) pageTitle.textContent = PAGE_TITLES[pageId] || pageId;

  // Close mobile sidebar
  closeSidebar();

  // Page-specific init
  if (pageId === "dashboard") {
    fetchAndRenderStats();
    fetchDashboardRecent();
  }
  if (pageId === "documents") fetchRecent();
  if (pageId === "analytics") fetchAndRenderStats();
}

// ── Sidebar toggle (mobile) ────────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("open");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
}

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener("click", closeSidebar);

// Nav link clicks
document.querySelectorAll(".nav-link[data-page]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
});

// ── Upload: Loading state ──────────────────────────────────────────────
function setUploading(loading) {
  uploadBtn.disabled = loading;
  if (uploadBtnText) uploadBtnText.textContent = loading ? "Przetwarzanie…" : "Przetwórz dokument";
  if (uploadSpinner) uploadSpinner.style.display = loading ? "inline-block" : "none";
}

// ── Dropzone drag & drop ───────────────────────────────────────────────
if (dropzone) {
  ["dragenter", "dragover"].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add("drag-over"); })
  );
  ["dragleave", "drop"].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove("drag-over"); })
  );
  dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // Manually assign to file input (best-effort)
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        invoiceFileInput.files = dt.files;
        if (dropzoneText) dropzoneText.textContent = file.name;
      } catch (_) { /* DataTransfer not supported everywhere */ }
    }
  });
}

invoiceFileInput?.addEventListener("change", () => {
  const file = invoiceFileInput.files?.[0];
  if (file && dropzoneText) dropzoneText.textContent = file.name;
});

// ── Result badge helpers ───────────────────────────────────────────────
function setResultBadge(st) {
  if (!resultStatusBadge) return;
  resultStatusBadge.className = "badge";
  if (st === "processed") {
    resultStatusBadge.classList.add("badge-success");
    resultStatusBadge.textContent = "Przetworzono";
  } else if (st === "failed") {
    resultStatusBadge.classList.add("badge-error");
    resultStatusBadge.textContent = "Błąd";
  } else {
    resultStatusBadge.classList.add("badge-neutral");
    resultStatusBadge.textContent = st || "Brak wyniku";
  }
}

// ── Render line items ──────────────────────────────────────────────────
function renderLineItems(items) {
  if (!linesTableBody) return;
  if (!items || !items.length) {
    linesTableBody.innerHTML = `<tr><td colspan="9" class="empty-cell">Brak pozycji.</td></tr>`;
    return;
  }
  linesTableBody.innerHTML = items.map(row => `<tr>
    <td>${escapeHtml(row.lp)}</td>
    <td>${escapeHtml(row.name)}</td>
    <td>${escapeHtml(row.unit || "—")}</td>
    <td>${escapeHtml(row.quantity)}</td>
    <td>${escapeHtml(row.unit_price_net)}</td>
    <td>${escapeHtml(row.vat_rate)}</td>
    <td>${escapeHtml(row.net_amount)}</td>
    <td>${escapeHtml(row.vat_amount)}</td>
    <td>${escapeHtml(row.gross_amount)}</td>
  </tr>`).join("");
}

// ── Render analysis result ─────────────────────────────────────────────
function renderResult(data) {
  if (!data) return;
  const analysis = data.analysis || {};
  const summary  = data.processing_summary || {};
  const st       = data.status || "—";

  currentInvoiceId   = data.id || null;
  currentAnalysisData = analysis;

  // Named fields
  txt(dfInvoiceNumber, analysis.invoice_number);
  txt(dfIssueDate,     analysis.issue_date);
  txt(dfSaleDate,      analysis.sale_date);
  txt(dfDueDate,       analysis.payment_due_date);
  txt(dfIssuePlace,    analysis.issue_place);
  txt(dfSellerName,    analysis.seller_name);
  txt(dfSellerNip,     analysis.seller_nip ? `NIP: ${analysis.seller_nip}` : null);
  txt(dfBuyerName,     analysis.buyer_name);
  txt(dfBuyerNip,      analysis.buyer_nip  ? `NIP: ${analysis.buyer_nip}`  : null);
  txt(dfNetAmount,     analysis.net_amount);
  txt(dfVatAmount,     analysis.vat_amount);
  txt(dfGrossAmount,   analysis.gross_amount);
  txt(dfCurrency,      analysis.currency);
  if (dfCategory) dfCategory.innerHTML = categoryBadge(analysis.category) || "—";

  // Status badge
  setResultBadge(st);

  // Bielik badge
  if (bielikStatusBadge) {
    if (analysis.bielik_status) {
      const isBielik = analysis.bielik_status === "applied";
      bielikStatusBadge.style.display = "";
      bielikStatusBadge.textContent = isBielik ? "🤖 Bielik" : "📐 Heurystyka";
      bielikStatusBadge.className = `badge bielikBadge ${isBielik ? "bielikApplied" : "badge-neutral"}`;
      bielikStatusBadge.title = isBielik
        ? "Analiza wzbogacona przez model Bielik"
        : "Analiza oparta tylko na heurystyce";
    } else {
      bielikStatusBadge.style.display = "none";
    }
  }

  // Confirmed badge + button
  if (confirmedBadge) {
    const isConfirmed = analysis.confirmed === true;
    confirmedBadge.style.display = "";
    confirmedBadge.textContent = isConfirmed ? "✓ Zatwierdzone" : "Niezatwierdzone";
    confirmedBadge.className = `badge ${isConfirmed ? "badge-success" : "badge-warning"}`;
    if (confirmBtn) {
      confirmBtn.style.display = isConfirmed ? "none" : "";
      confirmBtn.disabled = false;
    }
  }

  // Re-process button
  if (reprocessBtn) {
    reprocessBtn.style.display = (data.status && data.status !== "processing") ? "" : "none";
  }

  // Line items
  renderLineItems(analysis.line_items);
  if (linesSection) {
    linesSection.style.display = analysis.line_items?.length ? "" : "none";
  }

  // Metadata (settings page)
  if (metaTableBody) {
    metaTableBody.innerHTML = `
      <tr><th>ID dokumentu</th><td><code>${escapeHtml(shortId(data.id))}</code></td></tr>
      <tr><th>Nazwa pliku</th><td>${escapeHtml(data.original_filename || "—")}</td></tr>
      <tr><th>Typ pliku</th><td>${escapeHtml(data.content_type || "—")}</td></tr>
      <tr><th>Rozmiar</th><td>${formatBytes(data.size_bytes)}</td></tr>
      <tr><th>Silnik OCR</th><td>${escapeHtml(analysis.ocr_engine || summary.engine || "—")}</td></tr>
      <tr><th>Długość OCR</th><td>${analysis.ocr_text_length || summary.text_length || 0} znaków</td></tr>`;
  }

  if (ocrPreviewText) ocrPreviewText.textContent = summary.preview || "Brak podglądu.";
  if (ocrPreviewWarning) {
    ocrPreviewWarning.textContent = summary.warning || "";
    ocrPreviewWarning.style.display = summary.warning ? "block" : "none";
  }
  if (ocrPreviewSummary) {
    const len = analysis.ocr_text_length || summary.text_length || 0;
    ocrPreviewSummary.textContent = `Tekst OCR (podgląd, ${len} znaków)`;
  }
  if (resultBox) resultBox.textContent = JSON.stringify(data, null, 2);

  // Show analysis section
  if (analysisSection) analysisSection.style.display = "";
}

// ── Document card HTML ─────────────────────────────────────────────────
function buildDocCard(item, compact = false) {
  const card     = document.createElement("article");
  card.className = "doc-card";
  const analysis  = item.analysis || {};
  const isProc    = item.status === "processed";
  const haswarn   = isProc && analysis.ocr_warning;
  const isConf    = analysis.confirmed === true;
  const stClass   = item.status === "processed" ? "badge-success" : item.status === "failed" ? "badge-error" : "badge-neutral";

  const badges = `
    ${haswarn ? `<span class="badge badge-warning" title="${escapeHtml(analysis.ocr_warning)}">⚠ OCR</span>` : ""}
    ${isConf   ? `<span class="badge badge-success"  title="Zatwierdzona">✓</span>` : ""}
    <span class="badge ${stClass}">${escapeHtml(item.status || "—")}</span>`;

  card.innerHTML = `
    <div class="doc-card-row">
      <div class="doc-card-name">${escapeHtml(item.original_filename || "(brak nazwy)")}</div>
      <div class="doc-card-badges">${badges}</div>
    </div>
    <div class="doc-card-meta">
      Nr: <strong>${escapeHtml(analysis.invoice_number || "—")}</strong>
      &nbsp;·&nbsp;
      Brutto: <strong>${escapeHtml(analysis.gross_amount || "—")} ${escapeHtml(analysis.currency || "")}</strong>
      &nbsp;·&nbsp;
      ${categoryBadge(analysis.category || "—")}
      &nbsp;·&nbsp;
      ${escapeHtml(analysis.issue_date || "—")}
    </div>
    ${isProc && !compact ? `<div class="doc-card-hint">Kliknij, aby zobaczyć szczegóły →</div>` : ""}`;

  if (isProc) {
    card.classList.add("clickable");
    card.addEventListener("click", () => loadInvoiceDetail(item.id));
  }
  return card;
}

// ── Render invoice list ────────────────────────────────────────────────
function renderInvoices(items, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--c-text-faint);padding:20px 0;text-align:center;";
    empty.textContent = "Brak dokumentów spełniających kryteria.";
    container.appendChild(empty);
    return;
  }
  items.forEach(item => container.appendChild(buildDocCard(item)));
}

// ── Load invoice detail ────────────────────────────────────────────────
async function loadInvoiceDetail(invoiceId) {
  navigateTo("upload");
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderResult(data);
    setStatus(`Załadowano: ${data.original_filename || shortId(invoiceId)}`);
    if (analysisSection) analysisSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showToast(`Błąd ładowania: ${err.message}`, "error");
    setStatus(`Błąd: ${err.message}`, true);
  }
}

// ── Dashboard: recent 5 ───────────────────────────────────────────────
async function fetchDashboardRecent() {
  if (!dashRecentList) return;
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/invoices?limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    renderInvoices(items, dashRecentList);
  } catch (err) {
    console.warn("Dashboard recent failed:", err.message);
  }
}

// ── Fetch & render document list (Documents page) ─────────────────────
function buildFilterParams() {
  const p = new URLSearchParams();
  if (filterSearch?.value.trim())  p.set("search",    filterSearch.value.trim());
  if (filterCategory?.value)       p.set("category",  filterCategory.value);
  if (filterStatus?.value)         p.set("status",     filterStatus.value);
  if (filterDateFrom?.value)       p.set("date_from",  filterDateFrom.value);
  if (filterDateTo?.value)         p.set("date_to",    filterDateTo.value);
  p.set("limit", "50");
  return p;
}

async function fetchRecent() {
  const baseUrl = getBaseUrl();
  const container = document.getElementById("invoicesList");
  try {
    const res = await fetch(`${baseUrl}/api/v1/invoices?${buildFilterParams()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    renderInvoices(items, container);
  } catch (err) {
    showToast(err.message, "error");
    setStatus(err.message, true);
  }
}

// ── Export ────────────────────────────────────────────────────────────
function exportFile(format) {
  const p = buildFilterParams();
  p.set("limit", "1000");
  const url = `${getBaseUrl()}/api/v1/invoices/export/${format}?${p}`;
  const a = Object.assign(document.createElement("a"), { href: url, download: `faktury.${format}` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Categories from API ───────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/invoices/categories`);
    if (!res.ok) return;
    const cats = await res.json();

    const makeOpt = (cat) => {
      const o = document.createElement("option");
      o.value = cat;
      o.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      return o;
    };

    if (filterCategory) {
      filterCategory.innerHTML = '<option value="">Wszystkie</option>';
      cats.forEach(c => filterCategory.appendChild(makeOpt(c)));
    }
    if (editCategorySelect) {
      editCategorySelect.innerHTML = "";
      cats.forEach(c => editCategorySelect.appendChild(makeOpt(c)));
    }
  } catch (_) { /* fallback: keep as-is */ }
}

// ── Statistics / Charts ───────────────────────────────────────────────
async function fetchAndRenderStats() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/invoices/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stats = await res.json();

    const count = stats.total_count ?? "—";
    const gross = stats.total_gross != null
      ? `${stats.total_gross.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} PLN`
      : "—";

    if (statTotalCount)  statTotalCount.textContent  = count;
    if (statTotalGross)  statTotalGross.textContent  = gross;
    if (statTotalCountB) statTotalCountB.textContent = count;
    if (statTotalGrossB) statTotalGrossB.textContent = gross;

    renderCategoryChart(stats.by_category || []);
    renderMonthChart((stats.by_month || []).slice().reverse());
  } catch (err) {
    console.warn("Stats failed:", err.message);
  }
}

function renderCategoryChart(data) {
  const canvas = document.getElementById("chartByCategory");
  if (!canvas || !window.Chart) return;
  if (chartCategory) chartCategory.destroy();
  const labels  = data.map(d => d.category);
  const values  = data.map(d => d.total_gross);
  const colours = labels.map(c => CAT_COLOURS[c] || "#475569");
  chartCategory = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Suma brutto (PLN)", data: values,
        backgroundColor: colours.map(c => `${c}cc`),
        borderColor: colours, borderWidth: 1, borderRadius: 6 }],
    },
    options: {
      indexAxis: "y", responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => `${v.toLocaleString("pl")} PLN` } } },
    },
  });
}

function renderMonthChart(data) {
  const canvas = document.getElementById("chartByMonth");
  if (!canvas || !window.Chart) return;
  if (chartMonth) chartMonth.destroy();
  const labels = data.map(d => d.month);
  const values = data.map(d => d.total_gross);
  chartMonth = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Suma brutto (PLN)", data: values,
        backgroundColor: "#2563ebcc",
        borderColor: "#2563eb", borderWidth: 1, borderRadius: 6 }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => `${v.toLocaleString("pl")} PLN` } } },
    },
  });
}

// ── Edit modal ─────────────────────────────────────────────────────────
function openEditModal() {
  if (!currentInvoiceId || !currentAnalysisData) {
    showToast("Najpierw załaduj fakturę.", "warning");
    return;
  }
  const a = currentAnalysisData;

  const setVal = (name, val) => {
    const el = editForm.elements[name];
    if (!el) return;
    if (el.tagName === "SELECT") {
      el.value = val || "";
    } else if (el.type === "date") {
      el.value = val && val !== "—" ? val : "";
    } else {
      el.value = (val && val !== "—") ? val : "";
    }
  };

  setVal("invoice_number",   a.invoice_number);
  setVal("issue_date",       a.issue_date);
  setVal("sale_date",        a.sale_date);
  setVal("payment_due_date", a.payment_due_date);
  setVal("issue_place",      a.issue_place);
  setVal("seller_name",      a.seller_name);
  setVal("seller_nip",       a.seller_nip);
  setVal("buyer_name",       a.buyer_name);
  setVal("buyer_nip",        a.buyer_nip);
  setVal("net_amount",       a.net_amount);
  setVal("vat_amount",       a.vat_amount);
  setVal("gross_amount",     a.gross_amount);
  setVal("currency",         a.currency);
  setVal("category",         a.category);

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
  if (!confirm("Zapisać zmiany w danych faktury?")) return;

  const patch = {};
  new FormData(editForm).forEach((value, key) => {
    patch[key] = value.trim() || null;
  });

  editStatus.textContent = "Zapisywanie…";
  editStatus.style.color = "var(--c-text-muted)";

  try {
    const res = await fetch(
      `${getBaseUrl()}/api/v1/invoices/${currentInvoiceId}/analysis`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    renderResult(data);
    editStatus.textContent = "✓ Zapisano.";
    editStatus.style.color = "var(--c-success)";
    showToast("Zmiany zapisane pomyślnie.", "success");
    fetchAndRenderStats();
    setTimeout(closeEditModal, 700);
  } catch (err) {
    editStatus.textContent = `Błąd: ${err.message}`;
    editStatus.style.color = "var(--c-error)";
    showToast(`Błąd zapisu: ${err.message}`, "error");
  }
}

// ── Confirm invoice ───────────────────────────────────────────────────
async function confirmInvoice() {
  if (!currentInvoiceId) return;
  if (confirmBtn) confirmBtn.disabled = true;
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/v1/invoices/${currentInvoiceId}/analysis`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderResult(data);
    showToast("Faktura zatwierdzona.", "success");
    fetchAndRenderStats();
  } catch (err) {
    showToast(`Błąd zatwierdzenia: ${err.message}`, "error");
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// ── Re-process invoice ────────────────────────────────────────────────
async function reprocessInvoice() {
  if (!currentInvoiceId) return;
  if (!confirm("Uruchomić ponowne przetwarzanie OCR i analizy?")) return;
  if (reprocessBtn) { reprocessBtn.disabled = true; reprocessBtn.textContent = "⏳ Przetwarzam…"; }
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/v1/invoices/${currentInvoiceId}/process`,
      { method: "POST" }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    renderResult(data);
    showToast("Dokument przetworzony ponownie.", "success");
    fetchAndRenderStats();
  } catch (err) {
    showToast(`Błąd przetwarzania: ${err.message}`, "error");
  } finally {
    if (reprocessBtn) { reprocessBtn.disabled = false; reprocessBtn.textContent = "🔄 Przetworz ponownie"; }
  }
}

// ── Upload handler ────────────────────────────────────────────────────
uploadBtn?.addEventListener("click", async () => {
  const file = invoiceFileInput?.files?.[0];
  if (!file) { showToast("Najpierw wybierz plik.", "warning"); return; }

  setUploading(true);
  setStatus("Przesyłanie i przetwarzanie…");

  try {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${getBaseUrl()}/api/v1/invoices/upload-and-process`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || `Błąd HTTP ${res.status}`);

    if (data.duplicate) {
      showToast("Plik już istnieje w systemie — wczytano istniejący rekord.", "warning");
    } else {
      showToast("Dokument przetworzony pomyślnie.", "success");
    }

    renderResult(data);
    setStatus(data.duplicate ? "Duplikat — wczytano istniejący dokument." : "Dokument przetworzony.");
    fetchAndRenderStats();
  } catch (err) {
    showToast(err.message || "Wystąpił błąd.", "error");
    setStatus(err.message || "Wystąpił błąd.", true);
  } finally {
    setUploading(false);
  }
});

// ── Event listeners ───────────────────────────────────────────────────
refreshBtn?.addEventListener("click", fetchRecent);
applyFilterBtn?.addEventListener("click", fetchRecent);
clearFilterBtn?.addEventListener("click", () => {
  if (filterSearch)   filterSearch.value   = "";
  if (filterCategory) filterCategory.value = "";
  if (filterStatus)   filterStatus.value   = "";
  if (filterDateFrom) filterDateFrom.value = "";
  if (filterDateTo)   filterDateTo.value   = "";
  fetchRecent();
});
filterSearch?.addEventListener("keydown", e => { if (e.key === "Enter") fetchRecent(); });

exportCsvBtn?.addEventListener("click",  () => exportFile("csv"));
exportXlsxBtn?.addEventListener("click", () => exportFile("xlsx"));

editBtn?.addEventListener("click", openEditModal);
editModalClose?.addEventListener("click",   closeEditModal);
editCancelBtn?.addEventListener("click",    closeEditModal);
editModalBackdrop?.addEventListener("click", closeEditModal);
editForm?.addEventListener("submit", saveEditForm);

confirmBtn?.addEventListener("click",   confirmInvoice);
reprocessBtn?.addEventListener("click", reprocessInvoice);
refreshStatsBtn?.addEventListener("click", fetchAndRenderStats);

dashViewAllBtn?.addEventListener("click", () => navigateTo("documents"));

saveBackendBtn?.addEventListener("click", () => {
  const url = backendUrlInput?.value.trim() || DEFAULT_BACKEND;
  localStorage.setItem(STORAGE_KEY, url);
  showToast("Adres backendu zapisany.", "success");
  loadCategories();
  fetchAndRenderStats();
  fetchDashboardRecent();
});

// ── Init ──────────────────────────────────────────────────────────────
loadCategories();
fetchAndRenderStats();
fetchDashboardRecent();
navigateTo("dashboard");
