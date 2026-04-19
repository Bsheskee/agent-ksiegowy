const backendUrlInput = document.getElementById("backendUrl");
const invoiceFileInput = document.getElementById("invoiceFile");
const uploadBtn = document.getElementById("uploadBtn");
const statusText = document.getElementById("statusText");
const resultBox = document.getElementById("resultBox");
const refreshBtn = document.getElementById("refreshBtn");
const saveBackendBtn = document.getElementById("saveBackendBtn");
const invoicesList = document.getElementById("invoicesList");
const factTableBody = document.getElementById("factTableBody");
const metaTableBody = document.getElementById("metaTableBody");
const ocrPreviewText = document.getElementById("ocrPreviewText");
const ocrPreviewSummary = document.getElementById("ocrPreviewSummary");
const ocrPreviewWarning = document.getElementById("ocrPreviewWarning");
const resultStatusBadge = document.getElementById("resultStatusBadge");
const linesTableBody = document.getElementById("linesTableBody");

const STORAGE_KEY = "agent_ks_backend_url";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

backendUrlInput.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_BACKEND_URL;

function getBaseUrl() {
  return backendUrlInput.value.trim().replace(/\/+$/, "");
}

function shortId(value) {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
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

function setResultBadge(status) {
  resultStatusBadge.className = "badge";
  if (status === "processed") {
    resultStatusBadge.classList.add("success");
    resultStatusBadge.textContent = "Przetworzono";
    return;
  }
  if (status === "failed") {
    resultStatusBadge.classList.add("error");
    resultStatusBadge.textContent = "Błąd";
    return;
  }
  resultStatusBadge.classList.add("neutral");
  resultStatusBadge.textContent = status || "Brak wyniku";
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

function renderLineItems(items) {
  if (!items || !items.length) {
    linesTableBody.innerHTML = `<tr><td colspan="9">Brak pozycji.</td></tr>`;
    return;
  }
  linesTableBody.innerHTML = items
    .map((row) => {
      return `<tr>
        <td>${escapeHtml(row.lp)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.unit || row.pkwiu_or_unit || "-")}</td>
        <td>${escapeHtml(row.quantity)}</td>
        <td>${escapeHtml(row.unit_price_net)}</td>
        <td>${escapeHtml(row.vat_rate)}</td>
        <td>${escapeHtml(row.net_amount)}</td>
        <td>${escapeHtml(row.vat_amount)}</td>
        <td>${escapeHtml(row.gross_amount)}</td>
      </tr>`;
    })
    .join("");
}

function renderResult(data) {
  resultBox.textContent = JSON.stringify(data, null, 2);
  const analysis = data.analysis || {};
  const summary = data.processing_summary || {};
  const status = data.status || "-";

  renderTableRows(factTableBody, [
    { label: "Numer faktury", value: analysis.invoice_number || "-" },
    { label: "Data wystawienia", value: analysis.issue_date || "-" },
    { label: "Data sprzedaży", value: analysis.sale_date || "-" },
    { label: "Termin zapłaty", value: analysis.payment_due_date || "-" },
    { label: "Miejsce wystawienia", value: analysis.issue_place || "-" },
    { label: "NIP sprzedawcy", value: analysis.seller_nip || "-" },
    { label: "NIP nabywcy", value: analysis.buyer_nip || "-" },
    { label: "Suma netto", value: analysis.net_amount || "-" },
    { label: "Suma VAT", value: analysis.vat_amount || "-" },
    { label: "Suma brutto", value: analysis.gross_amount || "-" },
    { label: "Waluta", value: analysis.currency || "-" },
    { label: "Kategoria kosztu", value: analysis.category || "-" },
  ]);

  renderLineItems(analysis.line_items);

  renderTableRows(metaTableBody, [
    { label: "ID dokumentu", value: shortId(data.id) },
    { label: "Nazwa pliku", value: data.original_filename || "-" },
    { label: "Typ pliku", value: data.content_type || "-" },
    { label: "Rozmiar", value: formatBytes(data.size_bytes) },
    { label: "Silnik OCR", value: analysis.ocr_engine || summary.engine || "-" },
    {
      label: "Długość OCR",
      value: `${analysis.ocr_text_length || summary.text_length || 0} znaków`,
    },
    { label: "Status", value: status },
  ]);

  if (ocrPreviewText) {
    ocrPreviewText.textContent = summary.preview || "Brak podglądu OCR.";
  }
  if (ocrPreviewWarning) {
    ocrPreviewWarning.textContent = summary.warning || "";
    ocrPreviewWarning.style.display = summary.warning ? "block" : "none";
  }
  if (ocrPreviewSummary) {
    const len = analysis.ocr_text_length || summary.text_length || 0;
    ocrPreviewSummary.textContent = `Tekst OCR (podgląd, ${len} znaków)`;
  }
  setResultBadge(status);
}

function renderInvoices(items) {
  invoicesList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "historyCard";
    empty.textContent = "Brak przetworzonych dokumentów.";
    invoicesList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "historyCard";
    const analysis = item.analysis || {};
    card.innerHTML = `
      <div class="historyName">${item.original_filename || "(brak nazwy)"}</div>
      <div class="historyMeta">
        Status: <b>${item.status || "-"}</b> | Numer: ${analysis.invoice_number || "-"} | Brutto: ${
      analysis.gross_amount || "-"
    } ${analysis.currency || ""}
      </div>
      <div class="historyMeta">
        Kategoria: ${analysis.category || "-"} | Data: ${analysis.issue_date || "-"} | Dokument: ${shortId(item.id)}
      </div>
    `;
    invoicesList.appendChild(card);
  });
}

async function fetchRecent() {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/v1/invoices?limit=10`);
    if (!response.ok) {
      throw new Error(`Błąd listy dokumentów: ${response.status}`);
    }
    const data = await response.json();
    renderInvoices(data);
  } catch (error) {
    setStatus(error.message, true);
  }
}

uploadBtn.addEventListener("click", async () => {
  const baseUrl = getBaseUrl();
  const file = invoiceFileInput.files?.[0];

  if (!file) {
    setStatus("Najpierw wybierz plik.", true);
    return;
  }

  uploadBtn.disabled = true;
  setStatus("Przesyłanie i przetwarzanie...");

  try {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${baseUrl}/api/v1/invoices/upload-and-process`, {
      method: "POST",
      body: form,
    });

    const data = await response.json();
    if (!response.ok) {
      const detail = data?.detail || `Błąd: ${response.status}`;
      throw new Error(detail);
    }

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

saveBackendBtn.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY, backendUrlInput.value.trim() || DEFAULT_BACKEND_URL);
  setStatus("Zapisano ustawienia backendu.");
  fetchRecent();
});

fetchRecent();
