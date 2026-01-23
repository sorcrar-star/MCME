// assets/js/components/pdf-viewer.component.js
// Control del visor PDF en pantalla completa

export function openPdfViewer(book) {
  const viewer = document.getElementById("pdfViewer");
  const frame = document.getElementById("pdfFrame");
  const title = document.getElementById("pdfTitle");

  if (!viewer || !frame || !title) return;

  title.textContent = book.title;
  frame.src = book.pdfUrl;

  viewer.classList.remove("hidden");
}

export function closePdfViewer() {
  const viewer = document.getElementById("pdfViewer");
  const frame = document.getElementById("pdfFrame");

  if (!viewer || !frame) return;

  frame.src = "";
  viewer.classList.add("hidden");
}
