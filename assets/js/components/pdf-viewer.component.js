// assets/js/components/pdf-viewer.component.js

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

    container.innerHTML = "";
    title.textContent = book.title;
    viewer.classList.remove("hidden");

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
    console.error("Error PDF:", err);
  }
}

function detectCurrentPage() {
  const container = document.querySelector(".pdf-canvas-container");
  if (!container) return;

  const pages = container.querySelectorAll(".pdf-page");
  const containerTop = container.getBoundingClientRect().top;

  let closestPage = 1;
  let minDistance = Infinity;

  pages.forEach(page => {
    const rect = page.getBoundingClientRect();
    const distance = Math.abs(rect.top - containerTop);

    if (distance < minDistance) {
      minDistance = distance;
      closestPage = Number(page.dataset.page);
    }
  });

  if (currentPage !== closestPage) {
    currentPage = closestPage;

    // 🔥 NOTIFICAR CAMBIO DE PAGINA
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

  const target = container.querySelector(
    `.pdf-page[data-page="${pageNumber}"]`
  );

  if (!target) return;

  container.scrollTo({
    top: target.offsetTop,
    behavior: "smooth"
  });
}

document.addEventListener("click", (e) => {
  if (e.target.id === "closePdfBtn") {
    document.getElementById("pdfViewer")?.classList.add("hidden");
    currentBook = null;
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook, currentPage);
  }
});
