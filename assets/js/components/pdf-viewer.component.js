import * as pdfjsLib from "../vendor/pdfjs/build/pdf.mjs";
import { openNotesPanel } from "./book-notes.component.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/build/pdf.worker.mjs",
  import.meta.url
).href;

let pdfDoc = null;
let currentPage = 1;
let currentBook = null;

const STORAGE_READER_MODE = "mcme_reader_mode";

/* ======================================================
   OPEN MODAL
====================================================== */

export async function openPdfModal(book) {
  try {
    currentBook = book;
    currentPage = 1;

    const viewer = document.getElementById("pdfViewer");
    const container = document.querySelector(".pdf-canvas-container");
    const title = document.getElementById("pdfTitle");
    const headerActions = document.querySelector(".pdf-modal-header .actions");

    container.innerHTML = "";
    title.textContent = book.title;
    viewer.classList.remove("hidden");

    /* ===============================
       BOTÓN MODO LECTOR
    =============================== */

    if (!document.getElementById("toggleReaderMode")) {
      const readerBtn = document.createElement("button");
      readerBtn.id = "toggleReaderMode";
      readerBtn.textContent = "🌙 Modo lector";

      headerActions.prepend(readerBtn);

      readerBtn.addEventListener("click", () => {
        toggleReaderMode();
      });
    }

    applySavedReaderMode();

    /* ===============================
       RENDER PDF
    =============================== */

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
    detectCurrentPage();

  } catch (err) {
    console.error("Error PDF:", err);
  }
}

/* ======================================================
   READER MODE
====================================================== */

function toggleReaderMode() {
  const viewer = document.getElementById("pdfViewer");
  const isActive = viewer.classList.toggle("dark-mode");

  localStorage.setItem(STORAGE_READER_MODE, isActive ? "dark" : "light");

  updateReaderButtonText(isActive);
}

function applySavedReaderMode() {
  const viewer = document.getElementById("pdfViewer");
  const saved = localStorage.getItem(STORAGE_READER_MODE);

  if (saved === "dark") {
    viewer.classList.add("dark-mode");
    updateReaderButtonText(true);
  } else {
    viewer.classList.remove("dark-mode");
    updateReaderButtonText(false);
  }
}

function updateReaderButtonText(isDark) {
  const btn = document.getElementById("toggleReaderMode");
  if (!btn) return;

  btn.textContent = isDark
    ? "☀ Modo clásico"
    : "🌙 Modo lector";
}

/* ======================================================
   PAGE DETECTION
====================================================== */

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

  const target = container.querySelector(
    `.pdf-page[data-page="${pageNumber}"]`
  );

  if (!target) return;

  container.scrollTo({
    top: target.offsetTop,
    behavior: "smooth"
  });
}

/* ======================================================
   GLOBAL CLICK HANDLERS
====================================================== */

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
