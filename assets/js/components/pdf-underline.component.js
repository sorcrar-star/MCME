/* =====================================================
   PDF UNDERLINE / HIGHLIGHT TOOL
===================================================== */

const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";
let currentBookId = null;
let selectionPopup = null;
let linkPopup = null;
let currentRange = null;

export function initUnderlineTool(bookId) {
  currentBookId = bookId;
  if (!selectionPopup) createSelectionPopup();
  if (!linkPopup) createLinkPopup();

  hideSelectionPopup();

  document.querySelector(".pdf-canvas-container")
    .addEventListener("mouseup", handleTextSelection);

  setTimeout(() => applyHighlights(), 500);
}

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
  setTimeout(() => hideSelectionPopup(), 5000);
}

function hideSelectionPopup() {
  selectionPopup.classList.remove("visible");
}

function handleTextSelection(e) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  if (!range.startContainer.closest(".textLayer")) return;

  currentRange = range;
  const rect = range.getBoundingClientRect();
  showSelectionPopup(rect.right, rect.top - 40);
}

function getHighlights(bookId) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_UNDERLINE)) || []; } 
  catch { return []; }
}

function saveHighlights(highlights) {
  localStorage.setItem(STORAGE_KEY_UNDERLINE, JSON.stringify(highlights));
}

export function applyCurrentSelection(link = null) {
  if (!currentRange || currentRange.collapsed) return;

  const span = document.createElement("span");
  span.className = "pdf-highlight";
  span.textContent = currentRange.toString();
  if (link) span.dataset.link = link;

  currentRange.deleteContents();
  currentRange.insertNode(span);

  const highlights = getHighlights(currentBookId);
  highlights.push({
    bookId: currentBookId,
    page: getCurrentPdfPage(),
    text: span.textContent,
    color: "yellow",
    link: link || null
  });
  saveHighlights(highlights);

  currentRange = null;
  window.getSelection().removeAllRanges();
}

export function applyHighlights() {
  const highlights = getHighlights(currentBookId);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.querySelectorAll(".pdf-page").forEach(pageDiv => {
    const pageNum = Number(pageDiv.dataset.page);
    const textLayer = pageDiv.querySelector(".textLayer");
    if (!textLayer) return;

    highlights
      .filter(h => h.page === pageNum)
      .forEach(h => {
        Array.from(textLayer.childNodes).forEach(node => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          if (node.textContent.includes(h.text)) {
            const span = document.createElement("span");
            span.className = "pdf-highlight";
            if (h.link) span.dataset.link = h.link;
            span.textContent = h.text;

            const parts = node.textContent.split(h.text);
            const frag = document.createDocumentFragment();
            frag.append(parts[0] ? document.createTextNode(parts[0]) : null);
            frag.appendChild(span);
            frag.append(parts[1] ? document.createTextNode(parts[1]) : null);

            node.replaceWith(frag);
          }
        });
      });
  });
}

// Mini link popup
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
