import * as pdfjsLib from "../vendor/pdfjs/build/pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/build/pdf.worker.mjs",
  import.meta.url
).href;

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;

export async function openPdfModal(book) {
  try {
    currentBook = book;
    currentPage = 1;

    const viewer = document.getElementById("pdfViewer");
    const container = document.querySelector(".pdf-canvas-container");
    const title = document.getElementById("pdfTitle");

    // 🔹 Limpiar contenido y scroll
    container.innerHTML = "";
    container.scrollTop = 0;
    container.removeEventListener("scroll", detectCurrentPage);

    title.textContent = book.title;
    viewer.classList.remove("hidden");

    pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

    // 🔹 Render secuencial seguro
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page";
      canvas.dataset.page = i;

      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 🔹 Esperar render antes de añadir
      await page.render({ canvasContext: ctx, viewport }).promise;
      container.appendChild(canvas);
    }

    // 🔹 Scroll inicial seguro a página 1
    container.scrollTo({ top: 0, behavior: "auto" });

    // 🔹 Listener para detectar página visible
    container.addEventListener("scroll", detectCurrentPage);
    detectCurrentPage();

    // 🔹 Aplicar modo oscuro si estaba activado
    if (document.body.classList.contains("dark-mode")) {
      viewer.classList.add("dark-mode");
    } else {
      viewer.classList.remove("dark-mode");
    }

  } catch (err) {
    console.error("Error PDF:", err);
  }
}

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

export function goToPdfPage(pageNumber) {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  const target = container.querySelector(`.pdf-page[data-page="${pageNumber}"]`);
  if (!target) return;

  container.scrollTo({
    top: target.offsetTop,
    behavior: "smooth"
  });
}

document.addEventListener("click", (e) => {
  const viewer = document.getElementById("pdfViewer");

  if (e.target.id === "closePdfBtn") {
    viewer?.classList.add("hidden");
    currentBook = null;
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook, currentPage);
  }
});
