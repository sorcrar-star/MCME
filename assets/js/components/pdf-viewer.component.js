import * as pdfjsLib from "../vendor/pdfjs/build/pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/build/pdf.worker.mjs",
  import.meta.url
).href;

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;
const renderedPages = new Set();
const PAGE_BUFFER = 2; // páginas antes y después de la visible

export async function openPdfModal(book) {
  try {
    currentBook = book;
    currentPage = 1;

    const viewer = document.getElementById("pdfViewer");
    const container = document.querySelector(".pdf-canvas-container");
    const title = document.getElementById("pdfTitle");

    // Limpiar contenido y scroll
    container.innerHTML = "";
    container.scrollTop = 0;
    container.removeEventListener("scroll", lazyRenderPages);

    title.textContent = book.title;
    viewer.classList.remove("hidden");

    // 🔹 Agregar botón de modo lector
    addDarkModeToggle(viewer);

    pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

    // Crear placeholders para cada página
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "pdf-page";
      placeholder.dataset.page = i;
      placeholder.style.minHeight = "600px"; // altura estimada
      container.appendChild(placeholder);
    }

    // Listener de scroll para renderizar solo páginas cercanas
    container.addEventListener("scroll", lazyRenderPages);

    // Renderizar las primeras páginas visibles
    lazyRenderPages();
    detectCurrentPage();

    // Aplicar dark mode inicial si está activo
    if (document.body.classList.contains("dark-mode")) {
      viewer.classList.add("dark-mode");
    } else {
      viewer.classList.remove("dark-mode");
    }

  } catch (err) {
    console.error("Error PDF:", err);
  }
}

// Función para renderizar solo páginas visibles + buffer
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

    // Si está en buffer de visibilidad y no se ha renderizado
    if (!renderedPages.has(pageNum) &&
        (bottom >= scrollTop - clientHeight*PAGE_BUFFER && top <= scrollTop + clientHeight*(PAGE_BUFFER+1))
    ) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Reemplazar placeholder por canvas
      placeholder.innerHTML = "";
      placeholder.appendChild(canvas);
      renderedPages.add(pageNum);
    }
  }

  detectCurrentPage();
}

// Detectar página visible
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
      new CustomEvent("pdf:pageChanged", { detail: { page: currentPage } })
    );
  }
}

export function getCurrentPdfPage() {
  return currentPage;
}

export function goToPdfPage(pageNumber) {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  const target = container.querySelector(`.pdf-page[data-page="${pageNumber}"]`);
  if (!target) return;

  container.scrollTo({
    top: target.offsetTop,
    behavior: "smooth"
  });

  lazyRenderPages(); // asegurarnos de renderizarla
}

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
  }
});

// 🔹 Botón dark mode en el header
function addDarkModeToggle(viewer) {
  const header = viewer.querySelector(".pdf-modal-header .actions");
  if (!header || header.querySelector("#togglePdfDarkMode")) return;

  const btn = document.createElement("button");
  btn.id = "togglePdfDarkMode";
  btn.textContent = "🌙 Modo lector";
  header.appendChild(btn);
}
