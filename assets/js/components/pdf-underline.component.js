
/* =====================================================
   PDF UNDERLINE / HIGHLIGHT TOOL
===================================================== */

const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";
let currentBookId = null;
let selectionPopup = null;
let linkPopup = null;

// ================= STORAGE =================

function getHighlights(bookId) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_UNDERLINE)) || [];
  } catch { return []; }
}

function saveHighlights(highlights) {
  localStorage.setItem(STORAGE_KEY_UNDERLINE, JSON.stringify(highlights));
}

// ================= INIT =================

export function initUnderlineTool(bookId) {
  currentBookId = bookId;

  // Crear popup flotante si no existe
  if (!selectionPopup) createSelectionPopup();
  if (!linkPopup) createLinkPopup();

  // Limpiar popup
  hideSelectionPopup();

  // Escuchar selección de texto
  document.querySelector(".pdf-canvas-container")
    .addEventListener("mouseup", handleTextSelection);

  // Reaplicar subrayados ya guardados
  setTimeout(() => {
    applyHighlights();
  }, 500); // esperar que el PDF esté renderizado parcialmente
}

// ================= POPUPS =================

function createSelectionPopup() {
  selectionPopup = document.createElement("div");
  selectionPopup.className = "underline-popup";
  selectionPopup.innerHTML = `
    <button id="highlightBtn">Subrayar</button>
    <button id="highlightLinkBtn">Agregar enlace</button>
  `;
  document.body.appendChild(selectionPopup);

  selectionPopup.querySelector("#highlightBtn").onclick = () => {
    applyCurrentSelection();
    hideSelectionPopup();
  };

  selectionPopup.querySelector("#highlightLinkBtn").onclick = () => {
    const url = prompt("Ingresa el enlace:");
    if (!url) return;
    applyCurrentSelection(url);
    hideSelectionPopup();
  };
}

function createLinkPopup() {
  linkPopup = document.createElement("div");
  linkPopup.className = "underline-link-popup";
  document.body.appendChild(linkPopup);
}

function showSelectionPopup(x, y) {
  selectionPopup.style.top = `${y}px`;
  selectionPopup.style.left = `${x}px`;
  selectionPopup.classList.add("visible");

  // Ocultar automáticamente después de 5s
  setTimeout(() => hideSelectionPopup(), 5000);
}

function hideSelectionPopup() {
  selectionPopup.classList.remove("visible");
}

// ================= SELECCIÓN =================

let currentRange = null;

function handleTextSelection(e) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  currentRange = range;

  // Mostrar popup cerca de la selección
  const rect = range.getBoundingClientRect();
  showSelectionPopup(rect.right, rect.top - 40); // arriba del texto
}

// ================= SUBRAYADO =================

function applyCurrentSelection(link = null) {
  if (!currentRange || currentRange.collapsed) return;

  const span = document.createElement("span");
  span.className = "pdf-highlight";
  span.textContent = currentRange.toString();
  if (link) span.dataset.link = link;

  // Reemplazar el texto seleccionado por el span
  currentRange.deleteContents();
  currentRange.insertNode(span);

  // Guardar en storage
  const highlights = getHighlights(currentBookId);
  highlights.push({
    bookId: currentBookId,
    page: getCurrentPdfPage(), // desde pdf-viewer.component.js
    text: span.textContent,
    color: "yellow",
    link: link || null
  });
  saveHighlights(highlights);

  currentRange = null;
  window.getSelection().removeAllRanges();
}

// ================= REAPLICAR SUBRAYADOS =================

export function applyHighlights() {
  const highlights = getHighlights(currentBookId);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.querySelectorAll(".pdf-page").forEach(pageDiv => {
    const pageNum = Number(pageDiv.dataset.page);

    highlights
      .filter(h => h.page === pageNum)
      .forEach(h => {
        const pageText = pageDiv.textContent;
        const regex = new RegExp(h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        pageDiv.innerHTML = pageDiv.innerHTML.replace(regex, `<span class="pdf-highlight" ${h.link ? `data-link="${h.link}"` : ""}>${h.text}</span>`);
      });
  });
}

// ================= MINI LINK POPUP =================

document.addEventListener("mouseover", (e) => {
  if (e.target.classList.contains("pdf-highlight") && e.target.dataset.link) {
    linkPopup.textContent = e.target.dataset.link;
    const rect = e.target.getBoundingClientRect();
    linkPopup.style.top = `${rect.top - 30}px`;
    linkPopup.style.left = `${rect.left}px`;
    linkPopup.classList.add("visible");
  }
});

document.addEventListener("mouseout", (e) => {
  if (e.target.classList.contains("pdf-highlight")) {
    linkPopup.classList.remove("visible");
  }
});
