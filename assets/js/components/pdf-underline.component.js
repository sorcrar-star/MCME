const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";

let currentBookId = null;
let selectionPopup = null;
let selectedColor = "rgba(255,230,0,0.4)";

/* =====================================================
   INIT
===================================================== */

export function initUnderlineTool(bookId) {
  currentBookId = bookId;

  if (!selectionPopup) createSelectionPopup();
  hideSelectionPopup();

  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.removeEventListener("mouseup", handleTextSelection);
  container.addEventListener("mouseup", handleTextSelection);

  setTimeout(() => applyHighlights(), 300);
}

/* =====================================================
   POPUP
===================================================== */

function createSelectionPopup() {
  selectionPopup = document.createElement("div");
  selectionPopup.className = "underline-popup";
  selectionPopup.innerHTML = `
    <button id="highlightBtn">Subrayar</button>
  `;
  document.body.appendChild(selectionPopup);

  selectionPopup.querySelector("#highlightBtn").onclick = () => {
    applyCurrentSelection();
    hideSelectionPopup();
  };
}

function showSelectionPopup(x, y) {
  selectionPopup.style.top = `${y + window.scrollY}px`;
  selectionPopup.style.left = `${x + window.scrollX}px`;
  selectionPopup.classList.add("visible");
}

function hideSelectionPopup() {
  if (!selectionPopup) return;
  selectionPopup.classList.remove("visible");
}

/* =====================================================
   TEXT SELECTION
===================================================== */

function handleTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container.contains(range.commonAncestorContainer)) return;

  const rect = range.getBoundingClientRect();
  showSelectionPopup(rect.right, rect.top - 40);
}

/* =====================================================
   STORAGE
===================================================== */

function getHighlights() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_UNDERLINE)) || [];
  } catch {
    return [];
  }
}

function saveHighlights(data) {
  localStorage.setItem(STORAGE_KEY_UNDERLINE, JSON.stringify(data));
}

/* =====================================================
   APPLY SELECTION (PRO VERSION)
===================================================== */

export function applyCurrentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container.contains(range.commonAncestorContainer)) return;

  const rects = Array.from(range.getClientRects());

  const page = range.startContainer.parentElement.closest(".pdf-page");
  if (!page) return;

  const pageRect = page.getBoundingClientRect();

  const highlights = getHighlights();

  rects.forEach(r => {
    const highlight = {
      bookId: currentBookId,
      page: Number(page.dataset.page),
      top: r.top - pageRect.top + page.scrollTop,
      left: r.left - pageRect.left,
      width: r.width,
      height: r.height,
      color: selectedColor
    };

    highlights.push(highlight);
  });

  saveHighlights(highlights);
  selection.removeAllRanges();

  applyHighlights();
}

/* =====================================================
   RENDER HIGHLIGHTS (OVERLAY SYSTEM)
===================================================== */

export function applyHighlights() {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  const highlights = getHighlights();

  container.querySelectorAll(".pdf-page").forEach(page => {
    page.querySelectorAll(".pdf-overlay-highlight").forEach(el => el.remove());

    highlights
      .filter(h => h.bookId === currentBookId && h.page === Number(page.dataset.page))
      .forEach(h => {
        const overlay = document.createElement("div");
        overlay.className = "pdf-overlay-highlight";

        overlay.style.position = "absolute";
        overlay.style.top = `${h.top}px`;
        overlay.style.left = `${h.left}px`;
        overlay.style.width = `${h.width}px`;
        overlay.style.height = `${h.height}px`;
        overlay.style.background = h.color;
        overlay.style.pointerEvents = "none";

        page.appendChild(overlay);
      });
  });
}
