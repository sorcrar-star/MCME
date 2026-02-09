// 🔹 pdf-viewer.component.js con textLayer y subrayado
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
const renderedPages = new Set();
const PAGE_BUFFER = 2;

/* =====================================================
   OPEN MODAL
===================================================== */

export async function openPdfModal(book) {
  try {
    currentBook = book;
    currentPage = 1;

    const viewer = document.getElementById("pdfViewer");
    const container = document.querySelector(".pdf-canvas-container");
    const title = document.getElementById("pdfTitle");

    if (!viewer || !container) return;

    container.innerHTML = "";
    container.scrollTop = 0;
    container.removeEventListener("scroll", lazyRenderPages);
    renderedPages.clear();

    title.textContent = book.title;
    viewer.classList.remove("hidden");

    addDarkModeToggle(viewer);

    pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

    // Crear placeholders
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "pdf-page";
      placeholder.dataset.page = i;
      placeholder.style.minHeight = "600px";
      container.appendChild(placeholder);
    }

    container.addEventListener("scroll", lazyRenderPages);

    await lazyRenderPages();
    detectCurrentPage();

    // Sincronizar dark mode
    if (document.body.classList.contains("dark-mode")) {
      viewer.classList.add("dark-mode");
      updateDarkModeButton(viewer, true);
    } else {
      viewer.classList.remove("dark-mode");
      updateDarkModeButton(viewer, false);
    }

    // Inicializar subrayado
    initUnderlineTool(book.id);

  } catch (err) {
    console.error("Error PDF:", err);
  }
}

/* =====================================================
   LAZY RENDER + TEXT LAYER
===================================================== */

async function lazyRenderPages() {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container || !pdfDoc) return;

  const scrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;

  const pages = container.querySelectorAll(".pdf-page");

  for (let placeholder of pages) {
    const pageNum = Number(placeholder.dataset.page);
    const top = placeholder.offsetTop;
    const bottom = top + placeholder.clientHeight;

    const isInView =
      bottom >= scrollTop - clientHeight * PAGE_BUFFER &&
      top <= scrollTop + clientHeight * (PAGE_BUFFER + 1);

    if (!renderedPages.has(pageNum) && isInView) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      // Canvas
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      await page.render({ canvasContext: ctx, viewport }).promise;

      placeholder.innerHTML = "";
      placeholder.appendChild(canvas);

      // TextLayer
      const textLayerDiv = document.createElement("div");
      textLayerDiv.className = "textLayer";
      placeholder.appendChild(textLayerDiv);

      const textContent = await page.getTextContent();

      pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport,
        textDivs: [],
      });

      renderedPages.add(pageNum);

      // Reaplicar subrayados después de renderizar
      applyHighlights();
    }
  }

  detectCurrentPage();
}

/* =====================================================
   PAGE DETECTION
===================================================== */

export function detectCurrentPage() {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

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
  const container = document.querySelector(".pdf-canvas-container");
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
   GLOBAL EVENTS
===================================================== */

document.addEventListener("click", (e) => {
  const viewer = document.getElementById("pdfViewer");

  if (e.target.id === "closePdfBtn") {
    viewer?.classList.add("hidden");
    currentBook = null;
    renderedPages.clear();
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook, currentPage);
  }

  if (e.target.id === "togglePdfDarkMode") {
    viewer.classList.toggle("dark-mode");
    const isDark = viewer.classList.contains("dark-mode");
    updateDarkModeButton(viewer, isDark);
  }
});

/* =====================================================
   DARK MODE BUTTON
===================================================== */

function addDarkModeToggle(viewer) {
  const header = viewer.querySelector(".pdf-modal-header .actions");
  if (!header || header.querySelector("#togglePdfDarkMode")) return;

  const btn = document.createElement("button");
  btn.id = "togglePdfDarkMode";
  btn.textContent = "🌙 Modo lector";

  header.firstChild
    ? header.insertBefore(btn, header.firstChild)
    : header.appendChild(btn);
}

function updateDarkModeButton(viewer, isDarkMode) {
  const btn = viewer.querySelector("#togglePdfDarkMode");
  if (!btn) return;

  btn.textContent = isDarkMode
    ? "☀️ Modo normal"
    : "🌙 Modo lector";
}
