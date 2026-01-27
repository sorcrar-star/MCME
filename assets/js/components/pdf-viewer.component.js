// assets/js/components/pdf-viewer.component.js

import * as pdfjsLib from "../vendor/pdfjs/pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../vendor/pdfjs/pdf.worker.mjs";

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;

export async function openPdfModal(book) {
  currentBook = book;
  currentPage = 1;

  const viewer = document.getElementById("pdfViewer");
  const container = document.getElementById("pdfCanvasContainer");
  const title = document.getElementById("pdfTitle");

  container.innerHTML = "";
  title.textContent = book.title;
  viewer.classList.remove("hidden");

  pdfDoc = await pdfjsLib.getDocument(book.pdfUrl).promise;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.4 });

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
}

function detectCurrentPage(e) {
  const pages = [...document.querySelectorAll(".pdf-page")];
  const top = e.target.scrollTop;

  for (const page of pages) {
    if (page.offsetTop + page.offsetHeight > top + 120) {
      currentPage = Number(page.dataset.page);
      break;
    }
  }
}

export function getCurrentPdfPage() {
  return currentPage;
}

document.addEventListener("click", (e) => {
  if (e.target.id === "closePdfBtn") {
    document.getElementById("pdfViewer").classList.add("hidden");
  }

  if (e.target.id === "openNotesFromPdf") {
    if (!currentBook) return;
    openNotesPanel(currentBook);
  }
});
