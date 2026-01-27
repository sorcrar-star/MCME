// assets/js/components/pdf-viewer.component.js

import * as pdfjsLib from "../pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";

// 🔹 Worker (ruta REAL en GitHub Pages)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "assets/js/pdf.worker.mjs";

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;

/* ==========================
   ABRIR PDF
========================== */

export async function openPdfModal(book) {
  currentBook = book;
  currentPage = 1;

  const viewer = document.getElementById("pdfViewer");
  const container = document.getElementById("pdfCanvasContainer");
  const title = document.getElementById("pdfTitle");

  if (!viewer || !container || !title) {
    console.error("PDF Viewer: elementos no encontrados");
    return;
  }

  container.innerHTML = "";
  title.textContent = book.title;
  viewer.classList.remove("hidden");

  try {
    pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page";
      canvas.dataset.page = i;

      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      container.appendChild(canvas);
    }

    container.addEventListener("scroll", detectCurrentPage);
  } catch (err) {
    console.error("Error cargando PDF:", err);
  }
}

/* ==========================
   DETECTAR PÁGINA ACTUAL
========================== */

function detectCurrentPage(e) {
  const pages = [...document.querySelectorAll(".pdf-page")];
  const top = e.target.scrollTop;

  for (const page of pages) {
    if (page.offsetTop + page.offsetHeight > top + 100) {
      currentPage = Number(page.dataset.page);
      break;
    }
  }
}

export function getCurrentPdfPage() {
  return currentPage;
}

/* ==========================
   EVENTOS GLOBALES
========================== */

document.addEventListener("click", (e) => {
  if (e.target.id === "closePdfBtn") {
    document.getElementById("pdfViewer")?.classList.add("hidden");
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook);
  }
});
