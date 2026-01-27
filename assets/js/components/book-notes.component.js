// assets/js/components/book-notes.component.js
// Panel de notas por libro (frontend)

import { getCurrentUser } from "../services/auth.service.js";
import {
  getCurrentPdfPage,
  goToPdfPage
} from "./pdf-viewer.component.js";

const STORAGE_KEY = "mcme_notes";

/* ==========================
   STORAGE
========================== */

function getAllNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAllNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function getNotesByBook(bookId) {
  const user = getCurrentUser();
  if (!user) return [];

  return getAllNotes().filter(
    n => n.bookId === bookId && n.userEmail === user.email
  );
}

/* ==========================
   NOTAS
========================== */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function addNote(bookId, content) {
  const user = getCurrentUser();
  if (!user || !content.trim()) return;

  const notes = getAllNotes();

  notes.push({
    id: generateId(),
    bookId,
    userEmail: user.email,
    content: content.trim(),
    page: getCurrentPdfPage(), // 🔥 PDF.js
    createdAt: new Date().toISOString()
  });

  saveAllNotes(notes);
}

/* ==========================
   PANEL DE NOTAS
========================== */

export function openNotesPanel(book) {
  if (document.getElementById("notes-panel")) return;

  const pdfModal = document.getElementById("pdfModal");
  if (!pdfModal) return;

  const panel = document.createElement("div");
  panel.id = "notes-panel";
  panel.className = "notes-panel";

  panel.innerHTML = `
    <header class="notes-header">
      <h3>Notas – ${book.title}</h3>
      <button id="closeNotesBtn">✕</button>
    </header>

    <textarea
      id="noteInput"
      placeholder="Escribe aquí tu nota…"
    ></textarea>

    <button id="saveNoteBtn" class="save-note-btn">
      Guardar nota
    </button>

    <ul class="notes-list"></ul>
  `;

  pdfModal.appendChild(panel);

  renderNotes(book.id);

  document.getElementById("saveNoteBtn").addEventListener("click", () => {
    const input = document.getElementById("noteInput");
    if (!input) return;

    addNote(book.id, input.value);
    input.value = "";
    renderNotes(book.id);
  });

  document
    .getElementById("closeNotesBtn")
    .addEventListener("click", () => panel.remove());
}

/* ==========================
   RENDER LISTA
========================== */

function renderNotes(bookId) {
  const list = document.querySelector(".notes-list");
  if (!list) return;

  const notes = getNotesByBook(bookId);
  list.innerHTML = "";

  if (notes.length === 0) {
    list.innerHTML = "<li><em>No hay notas aún.</em></li>";
    return;
  }

  notes.forEach(note => {
    const li = document.createElement("li");

    li.innerHTML = `
      <p>${note.content}</p>
      <small>
        ${
          note.page
            ? `<span class="note-page" data-page="${note.page}">
                 Página ${note.page}
               </span> · `
            : ""
        }
        ${new Date(note.createdAt).toLocaleString()}
      </small>
    `;

    const pageLink = li.querySelector(".note-page");
    if (pageLink) {
      pageLink.addEventListener("click", () => {
        goToPdfPage(pageLink.dataset.page); // 🔥 PDF.js
      });
    }

    list.appendChild(li);
  });
}
