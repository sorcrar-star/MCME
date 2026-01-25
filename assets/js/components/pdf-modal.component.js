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
  frame.src = book.pdfUrl; // ✅ ESTE ERA EL ERROR

  modal.classList.remove("hidden");
}

/* ==========================
   EVENTOS DEL MODAL
========================== */

document.addEventListener("click", (e) => {
  // Cerrar PDF
  if (e.target.id === "closePdfModal") {
    const modal = document.getElementById("pdfModal");
    const frame = document.getElementById("pdfModalFrame");

    if (frame) frame.src = "";
    if (modal) modal.classList.add("hidden");

    currentPdfBook = null;
  }

  // Abrir notas desde PDF
  if (e.target.id === "openNotesFromPdf") {
    if (!currentPdfBook) return;
    openNotesPanel(currentPdfBook);
  }
});
