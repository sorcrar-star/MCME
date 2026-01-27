// assets/js/components/book-notes.component.js

import { getCurrentUser } from "../services/auth.service.js";
import { getCurrentPdfPage } from "./pdf-viewer.component.js";

const STORAGE_KEY = "mcme_notes";

let editingNoteId = null;

// ==========================
// STORAGE
// ==========================
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

// ==========================
// CRUD
// ==========================
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

function updateNote(noteId, newContent) {
  const notes = getAllNotes();

  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  note.content = newContent.trim();
  note.updatedAt = new Date().toISOString();

  saveAllNotes(notes);
}

function deleteNote(noteId) {
  const notes = getAllNotes().filter(n => n.id !== noteId);
  saveAllNotes(notes);
}

// ==========================
// UI
// ==========================
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

    if (editingNoteId) {
      updateNote(editingNoteId, input.value);
      editingNoteId = null;
    } else {
      addNote(book.id, input.value);
    }

    input.value = "";
    renderNotes(book.id);
  });

  document
    .getElementById("closeNotesBtn")
    .addEventListener("click", () => panel.remove());
}

function renderNotes(bookId) {
  const list = document.querySelector(".notes-list");
  const input = document.getElementById("noteInput");
  if (!list) return;

  const notes = getNotesByBook(bookId);
  list.innerHTML = "";

  if (!notes.length) {
    list.innerHTML = "<li><em>No hay notas aún.</em></li>";
    return;
  }

  notes.forEach(note => {
    const li = document.createElement("li");
    li.className = "note-item";

    li.innerHTML = `
      <div class="note-content">
        <p>${note.content}</p>
        <small>
          ${note.page ? `Página ${note.page} · ` : ""}
          ${new Date(note.createdAt).toLocaleString()}
        </small>
      </div>

      <div class="note-actions">
        <button class="edit-note-btn">✏️</button>
        <button class="delete-note-btn">🗑</button>
      </div>
    `;

    li.querySelector(".edit-note-btn").addEventListener("click", () => {
      input.value = note.content;
      editingNoteId = note.id;
      input.focus();
    });

    li.querySelector(".delete-note-btn").addEventListener("click", () => {
      if (!confirm("¿Eliminar esta nota?")) return;
      deleteNote(note.id);
      renderNotes(bookId);
    });

    list.appendChild(li);
  });
}
