// assets/js/components/book-notes.component.js

import { getCurrentUser } from "../services/auth.service.js";
import { getCurrentPdfPage } from "./pdf-viewer.component.js";

const STORAGE_KEY = "mcme_notes";

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
    page: getCurrentPdfPage(),
    createdAt: new Date().toISOString()
  });

  saveAllNotes(notes);
}

export function openNotesPanel(book) {
  if (document.getElementById("notes-panel")) return;

  const pdfViewer = document.getElementById("pdfViewer");
  if (!pdfViewer) return;

  const panel = document.createElement("div");
  panel.id = "notes-panel";
  panel.className = "notes-panel";

  panel.innerHTML = `
    <header class="notes-header">
      <h3>Notas – ${book.title}</h3>
      <button id="closeNotesBtn">✕</button>
    </header>

    <textarea id="noteInput" placeholder="Escribe aquí tu nota…"></textarea>

    <button id="saveNoteBtn" class="save-note-btn">
      Guardar nota
    </button>

    <ul class="notes-list"></ul>
  `;

  pdfViewer.appendChild(panel);
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

function renderNotes(bookId) {
  const list = document.querySelector(".notes-list");
  if (!list) return;

  const notes = getNotesByBook(bookId);
  list.innerHTML = "";

  if (!notes.length) {
    list.innerHTML = "<li><em>No hay notas aún.</em></li>";
    return;
  }

  notes.forEach(note => {
    const li = document.createElement("li");
    li.innerHTML = `
      <p>${note.content}</p>
      <small>
        ${note.page ? `Página ${note.page} · ` : ""}
        ${new Date(note.createdAt).toLocaleString()}
      </small>
    `;
    list.appendChild(li);
  });
}
