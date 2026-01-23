// assets/js/components/pdf-modal.component.js

import { openNotesPanel } from "./book-notes.component.js";

let currentPdfBook = null;

export function openPdfModal(book) {
  currentPdfBook = book;

  const viewer = document.getElementById("pdfViewer");
  const frame = document.getElementById("pdfFrame");
  const title = document.getElementById("pdfTitle");

  if (!viewer || !frame || !title) {
    console.warn("PDF Viewer DOM no encontrado");
    return;
  }

  title.textContent = book.title;
  frame.src = book.pdfUrl;

  viewer.classList.remove("hidden");
}

// Eventos del visor PDF
document.addEventListener("click", (e) => {
  // cerrar PDF
  if (e.target.id === "closePdfBtn") {
    const viewer = document.getElementById("pdfViewer");
    const frame = document.getElementById("pdfFrame");

    if (frame) frame.src = "";
    if (viewer) viewer.classList.add("hidden");

    currentPdfBook = null;
  }

  // abrir notas desde PDF
  if (e.target.id === "openNotesFromPdf") {
    if (currentPdfBook) {
      openNotesPanel(currentPdfBook);
    }
  }
});
