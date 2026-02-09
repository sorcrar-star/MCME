const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";

let currentBookId = null;
let selectionPopup = null;
let linkPopup = null;
let selectedColor = "rgba(255,230,0,0.6)";

/* =====================================================
   INIT
===================================================== */

export function initUnderlineTool(bookId) {
  currentBookId = bookId;

  if (!selectionPopup) createSelectionPopup();
  if (!linkPopup) createLinkPopup();

  hideSelectionPopup();

  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.removeEventListener("mouseup", handleTextSelection);
  container.addEventListener("mouseup", handleTextSelection);

  setTimeout(() => applyHighlights(), 300);
}

/* =====================================================
   PAGE DETECTION
===================================================== */

function detectCurrentPageNumber() {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return 1;

  const pages = container.querySelectorAll(".pdf-page");
  const middle = container.scrollTop + container.clientHeight / 2;

  let detected = 1;

  pages.forEach(page => {
    const top = page.offsetTop;
    const bottom = top + page.clientHeight;
    if (middle >= top && middle < bottom) {
      detected = Number(page.dataset.page);
    }
  });

  return detected;
}

/* =====================================================
   POPUPS
===================================================== */

function createSelectionPopup() {
  selectionPopup = document.createElement("div");
  selectionPopup.className = "underline-popup";

  selectionPopup.innerHTML = `
    <div class="color-picker">
      <button class="color-option" data-color="rgba(255,230,0,0.6)" style="background:yellow"></button>
      <button class="color-option" data-color="rgba(144,238,144,0.6)" style="background:lightgreen"></button>
      <button class="color-option" data-color="rgba(0,255,255,0.6)" style="background:cyan"></button>
      <button class="color-option" data-color="rgba(255,182,193,0.6)" style="background:pink"></button>
    </div>
    <button id="highlightBtn">Subrayar</button>
  `;

  document.body.appendChild(selectionPopup);

  selectionPopup.querySelectorAll(".color-option").forEach(btn => {
    btn.onclick = () => {
      selectedColor = btn.dataset.color;
    };
  });

  selectionPopup.querySelector("#highlightBtn").onclick = () => {
    applyCurrentSelection();
    hideSelectionPopup();
  };
}

function createLinkPopup() {
  linkPopup = document.createElement("div");
  linkPopup.className = "underline-link-popup";
  document.body.appendChild(linkPopup);
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

function saveHighlights(highlights) {
  localStorage.setItem(STORAGE_KEY_UNDERLINE, JSON.stringify(highlights));
}

/* =====================================================
   APPLY SELECTION
===================================================== */

export function applyCurrentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const container = document.querySelector(".pdf-canvas-container");
  if (!container.contains(range.commonAncestorContainer)) return;

  const pageNumber = detectCurrentPageNumber();
  const spans = container.querySelectorAll(".textLayer span");

  const highlights = getHighlights();

  spans.forEach(span => {
    if (range.intersectsNode(span)) {

      if (!span.classList.contains("pdf-highlight")) {
        span.classList.add("pdf-highlight");
        span.style.backgroundColor = selectedColor;

        highlights.push({
          bookId: currentBookId,
          page: pageNumber,
          text: span.textContent.trim(),
          color: selectedColor
        });
      }
    }
  });

  saveHighlights(highlights);
  selection.removeAllRanges();
}

/* =====================================================
   REAPPLY
===================================================== */

export function applyHighlights() {
  const highlights = getHighlights();
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  container.querySelectorAll(".pdf-page").forEach(pageDiv => {
    const pageNum = Number(pageDiv.dataset.page);

    highlights
      .filter(h => h.bookId === currentBookId && h.page === pageNum)
      .forEach(h => {
        const spans = pageDiv.querySelectorAll(".textLayer span");

        spans.forEach(span => {
          if (span.textContent.trim() === h.text.trim()) {
            span.classList.add("pdf-highlight");
            span.style.backgroundColor = h.color;
          }
        });
      });
  });
}
