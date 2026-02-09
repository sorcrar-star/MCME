import * as pdfjsLib from "../vendor/pdfjs/build/pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";
import { initUnderlineTool, applyHighlights } from "./pdf-underline.component.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/build/pdf.worker.mjs",
  import.meta.url
).href;

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;
let modalRoot = null; // 👈 referencia fija al modal

const renderedPages = new Set();
const PAGE_BUFFER = 1.5;

/* =====================================================
   OPEN MODAL
===================================================== */

export async function openPdfModal(book) {
  try {
    currentBook = book;
    currentPage = 1;

    modalRoot = document.getElementById("pdfViewer");
    const container = modalRoot?.querySelector(".pdf-canvas-container");
    const title = modalRoot?.querySelector("#pdfTitle");

    if (!modalRoot || !container) return;

    container.innerHTML = "";
    container.scrollTop = 0;
    renderedPages.clear();

    title.textContent = book.title;
    modalRoot.classList.remove("hidden");

    addHeaderButtons(modalRoot);

    pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "pdf-page";
      placeholder.dataset.page = i;
      placeholder.style.minHeight = "800px";
      container.appendChild(placeholder);
    }

    container.removeEventListener("scroll", handleScroll);
    container.addEventListener("scroll", handleScroll);

    await lazyRenderPages();
    detectCurrentPage();
    syncDarkMode();

    initUnderlineTool(book.id);

  } catch (err) {
    console.error("Error PDF:", err);
  }
}

/* =====================================================
   SCROLL
===================================================== */

function handleScroll() {
  lazyRenderPages();
  detectCurrentPage();
}

/* =====================================================
   LAZY RENDER
===================================================== */

async function lazyRenderPages() {
  const container = modalRoot?.querySelector(".pdf-canvas-container");
  if (!container || !pdfDoc) return;

  const scrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  const pages = container.querySelectorAll(".pdf-page");

  for (let placeholder of pages) {
    const pageNum = Number(placeholder.dataset.page);
    if (renderedPages.has(pageNum)) continue;

    const top = placeholder.offsetTop;
    const bottom = top + placeholder.clientHeight;

    const isVisible =
      bottom >= scrollTop - clientHeight * PAGE_BUFFER &&
      top <= scrollTop + clientHeight * (PAGE_BUFFER + 1);

    if (!isVisible) continue;

    renderedPages.add(pageNum);
    renderPage(pageNum, placeholder);
  }
}

/* =====================================================
   RENDER PAGE
===================================================== */

async function renderPage(pageNum, placeholder) {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.4 });

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;
    wrapper.style.margin = "0 auto";

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    wrapper.appendChild(canvas);

    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    wrapper.appendChild(textLayerDiv);

    placeholder.innerHTML = "";
    placeholder.appendChild(wrapper);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      textLayer: {
        container: textLayerDiv
      }
    });

    await renderTask.promise;

    setTimeout(() => applyHighlights(), 80);

  } catch (err) {
    console.error("Render error:", err);
  }
}

/* =====================================================
   PAGE DETECTION
===================================================== */

export function detectCurrentPage() {
  const container = modalRoot?.querySelector(".pdf-canvas-container");
  if (!container) return;

  const pages = container.querySelectorAll(".pdf-page");
  const middle = container.scrollTop + container.clientHeight / 2;

  let detected = currentPage;

  pages.forEach(page => {
    const top = page.offsetTop;
    const bottom = top + page.clientHeight;

    if (middle >= top && middle < bottom) {
      detected = Number(page.dataset.page);
    }
  });

  if (detected !== currentPage) {
    currentPage = detected;

    document.dispatchEvent(
      new CustomEvent("pdf:pageChanged", {
        detail: { page: currentPage }
      })
    );
  }
}

export function getCurrentPdfPage() {
  return currentPage;
}

/* =====================================================
   NAVIGATION
===================================================== */

export function goToPdfPage(pageNumber) {
  const container = modalRoot?.querySelector(".pdf-canvas-container");
  if (!container) return;

  const target = container.querySelector(
    `.pdf-page[data-page="${pageNumber}"]`
  );

  if (!target) return;

  container.scrollTo({
    top: target.offsetTop,
    behavior: "smooth"
  });

  lazyRenderPages();
}

/* =====================================================
   HEADER BUTTONS
===================================================== */

function addHeaderButtons(viewer) {
  const header = viewer.querySelector(".pdf-modal-header .actions");
  if (!header) return;

  if (!header.querySelector("#togglePdfDarkMode")) {
    const darkBtn = document.createElement("button");
    darkBtn.id = "togglePdfDarkMode";
    darkBtn.textContent = "🌙 Modo lector";
    header.prepend(darkBtn);
  }

  if (!header.querySelector("#underlineInfoBtn")) {
    const underlineBtn = document.createElement("button");
    underlineBtn.id = "underlineInfoBtn";
    underlineBtn.textContent = "✏ Subrayar";
    underlineBtn.onclick = () =>
      alert("Selecciona texto dentro del PDF para subrayar.");
    header.prepend(underlineBtn);
  }
}

/* =====================================================
   GLOBAL BUTTON EVENTS
===================================================== */

document.addEventListener("click", (e) => {
  if (!modalRoot) return;

  if (e.target.id === "closePdfBtn") {
    modalRoot.classList.add("hidden");
    currentBook = null;
    renderedPages.clear();
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook, currentPage);
  }

  if (e.target.id === "togglePdfDarkMode") {
    modalRoot.classList.toggle("dark-mode");
    updateDarkModeButton();
  }
});

/* =====================================================
   DARK MODE
===================================================== */

function updateDarkModeButton() {
  const btn = modalRoot?.querySelector("#togglePdfDarkMode");
  if (!btn) return;

  const isDark = modalRoot.classList.contains("dark-mode");
  btn.textContent = isDark
    ? "☀️ Modo normal"
    : "🌙 Modo lector";
}

function syncDarkMode() {
  if (!modalRoot) return;

  if (document.body.classList.contains("dark-mode")) {
    modalRoot.classList.add("dark-mode");
  } else {
    modalRoot.classList.remove("dark-mode");
  }

  updateDarkModeButton();
}
