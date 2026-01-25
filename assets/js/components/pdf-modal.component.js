// assets/js/components/pdf-modal.component.js
// Modal PDF en pantalla completa

import { openNotesPanel } from "./book-notes.component.js";

let currentBook = null;

export function openPdfModal(book) {
  currentBook = book;

  const modal = document.getElementById("pdfModal");
  const iframe = document.getElementById("pdfModalFrame");
  const title = document.getElementById("pdfModalTitle");

  title.textContent = book.title;
  iframe.src = book.pdf;

  modal.classList.remove("hidden");
}

/* ==========================
   EVENTOS DEL MODAL
========================== */

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closePdfModal");
  const notesBtn = document.getElementById("openNotesFromPdf");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("pdfModal");
      const iframe = document.getElementById("pdfModalFrame");

      iframe.src = "";
      modal.classList.add("hidden");
    });
  }

  if (notesBtn) {
    notesBtn.addEventListener("click", () => {
      if (!currentBook) return;
      openNotesPanel(currentBook);
    });
  }
});
