// assets/js/components/pdf-modal.component.js

import { openNotesPanel } from "./book-notes.component.js";

let currentPdfBook = null;

export function openPdfModal(book) {
  currentPdfBook = book;

  const modal = document.getElementById("pdfModal");
  const frame = document.getElementById("pdfModalFrame");
  const title = document.getElementById("pdfModalTitle");

  if (!modal || !frame || !title) return;

  title.textContent = book.title;
  frame.src = book.pdfUrl;

  modal.classList.remove("hidden");
}

// cerrar PDF
document.addEventListener("click", (e) => {
  if (e.target.id === "closePdfModal") {
    const modal = document.getElementById("pdfModal");
    const frame = document.getElementById("pdfModalFrame");

    frame.src = "";
    modal.classList.add("hidden");
    currentPdfBook = null;
  }

  if (e.target.id === "openNotesFromPdf") {
    if (currentPdfBook) {
      openNotesPanel(currentPdfBook);
    }
  }
});
