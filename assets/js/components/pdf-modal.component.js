// assets/js/components/pdf-modal.component.js

import { openNotesPanel } from "./book-notes.component.js";

let currentPdfBook = null;

export function openPdfModal(book) {
  currentPdfBook = book;

  const modal = document.getElementById("pdfModal");
  const frame = document.getElementById("pdfModalFrame");
  const title = document.getElementById("pdfModalTitle");

  if (!modal || !frame || !title) {
    console.error("PDF Modal: elementos no encontrados");
    return;
  }

  title.textContent = book.title;
  frame.src = book.pdfUrl;

  modal.classList.remove("hidden");
}

// Eventos globales del modal
document.addEventListener("click", (e) => {
  // cerrar PDF
  if (e.target.id === "closePdfModal") {
    const modal = document.getElementById("pdfModal");
    const frame = document.getElementById("pdfModalFrame");

    if (frame) frame.src = "";
    if (modal) modal.classList.add("hidden");

    currentPdfBook = null;
  }

  // abrir notas desde PDF
  if (e.target.id === "openNotesFromPdf") {
    if (currentPdfBook) {
      openNotesPanel(currentPdfBook);
    }
  }
});
