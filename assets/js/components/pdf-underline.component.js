/* =====================================================
   PDF UNDERLINE / HIGHLIGHT TOOL
===================================================== */

const STORAGE_KEY_UNDERLINE = "mcme_pdf_highlights";

let currentBookId = null;
let selectionPopup = null;
let linkPopup = null;
let currentRange = null;
let selectedColor = "yellow"; // color por defecto

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

  setTimeout(() => applyHighlights(), 400);
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
      <button class="color-option" data-color="yellow" style="background:yellow"></button>
      <button class="color-option" data-color="lightgreen" style="background:lightgreen"></button>
      <button class="color-option" data-color="cyan" style="background:cyan"></button>
      <button class="color-option" data-color="pink" style="background:pink"></button>
    </div>
    <button id="highlightBtn">Subrayar</button>
    <button id="highlightLinkBtn">Agregar enlace</button>
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

  currentRange = range;

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

export function applyCurrentSelection(link = null) {
  if (!currentRange || currentRange.collapsed) return;

  const selectedText = currentRange.toString();
  if (!selectedText.trim()) return;

  const span = document.createElement("span");
  span.className = "pdf-highlight";
  span.style.backgroundColor = selectedColor;
  span.textContent = selectedText;

  if (link) span.dataset.link = link;

  currentRange.deleteContents();
  currentRange.insertNode(span);

  const highlights = getHighlights();
  highlights.push({
    bookId: currentBookId,
    page: detectCurrentPageNumber(),
    text: selectedText,
    link: link || null,
    color: selectedColor
  });

  saveHighlights(highlights);

  currentRange = null;
  window.getSelection().removeAllRanges();
}

/* =====================================================
   REAPPLY HIGHLIGHTS
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

        const walker = document.createTreeWalker(
          pageDiv,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          if (!node.nodeValue.includes(h.text)) continue;

          const span = document.createElement("span");
          span.className = "pdf-highlight";
          span.style.backgroundColor = h.color || "yellow";
          if (h.link) span.dataset.link = h.link;
          span.textContent = h.text;

          const parts = node.nodeValue.split(h.text);
          const fragment = document.createDocumentFragment();

          fragment.appendChild(document.createTextNode(parts[0]));
          fragment.appendChild(span);
          fragment.appendChild(document.createTextNode(parts[1] || ""));

          node.parentNode.replaceChild(fragment, node);
        }
      });
  });
}

/* =====================================================
   LINK MINI POPUP
===================================================== */

document.addEventListener("mouseover", (e) => {
  if (!linkPopup) return;

  if (e.target.classList.contains("pdf-highlight") && e.target.dataset.link) {
    linkPopup.textContent = e.target.dataset.link;

    const rect = e.target.getBoundingClientRect();
    linkPopup.style.top = `${rect.top + window.scrollY - 30}px`;
    linkPopup.style.left = `${rect.left + window.scrollX}px`;
    linkPopup.classList.add("visible");
  }
});

document.addEventListener("mouseout", (e) => {
  if (!linkPopup) return;

  if (e.target.classList.contains("pdf-highlight")) {
    linkPopup.classList.remove("visible");
  }
});
