const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";

let currentBookId = null;
let selectionPopup = null;
let selectedColor = "#ffe600";

let eraseMode = false;

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
   ERASE MODE
===================================================== */

export function toggleEraseMode() {
  eraseMode = !eraseMode;

  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.classList.toggle("erase-mode", eraseMode);
}

export function isEraseModeActive() {
  return eraseMode;
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
  if (eraseMode) return;

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
  if (eraseMode) return;

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
   APPLY SELECTION
===================================================== */

export function applyCurrentSelection() {
  if (eraseMode) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container.contains(range.commonAncestorContainer)) return;

  const page = range.startContainer.parentElement.closest(".pdf-page");
  if (!page) return;

  const pageRect = page.getBoundingClientRect();
  const rawRects = Array.from(range.getClientRects());

  if (!rawRects.length) return;

  let boxes = rawRects.map(r => ({
    top: r.top - pageRect.top,
    left: r.left - pageRect.left,
    right: r.right - pageRect.left,
    height: r.height
  }));

  boxes.sort((a, b) => a.top - b.top || a.left - b.left);

  const merged = [];

  boxes.forEach(box => {
    const last = merged[merged.length - 1];

    if (
      last &&
      Math.abs(last.top - box.top) < 3 &&
      box.left <= last.right + 2
    ) {
      last.right = Math.max(last.right, box.right);
    } else {
      merged.push({ ...box });
    }
  });

  const highlights = getHighlights();

  merged.forEach(box => {
    highlights.push({
      id: crypto.randomUUID(),
      bookId: currentBookId,
      page: Number(page.dataset.page),
      top: box.top,
      left: box.left,
      width: box.right - box.left,
      height: box.height,
      color: selectedColor
    });
  });

  saveHighlights(highlights);
  selection.removeAllRanges();
  applyHighlights();
}

/* =====================================================
   REMOVE HIGHLIGHT
===================================================== */

function removeHighlight(id) {
  let highlights = getHighlights();
  highlights = highlights.filter(h => h.id !== id);
  saveHighlights(highlights);
  applyHighlights();
}

/* =====================================================
   RENDER HIGHLIGHTS
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
        overlay.dataset.id = h.id;

        overlay.style.position = "absolute";
        overlay.style.top = `${h.top}px`;
        overlay.style.left = `${h.left}px`;
        overlay.style.width = `${h.width}px`;
        overlay.style.height = `${h.height}px`;
        overlay.style.background = h.color || "#ffe600";
        overlay.style.opacity = "0.45";
        overlay.style.mixBlendMode = "multiply";

        overlay.style.pointerEvents = eraseMode ? "auto" : "none";
        overlay.style.cursor = eraseMode ? "pointer" : "default";

        overlay.onclick = () => {
          if (!eraseMode) return;
          removeHighlight(h.id);
        };

        page.appendChild(overlay);
      });
  });
}
