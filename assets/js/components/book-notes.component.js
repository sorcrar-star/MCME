// assets/js/components/book-notes.component.js
// Panel de notas por libro (frontend)

import { getCurrentUser } from "../services/auth.service.js";

const STORAGE_KEY = "mcme_notes";

/**
 * Obtiene todas las notas guardadas
 */
function getAllNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/**
 * Guarda todas las notas
 */
function saveAllNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Obtiene notas de un libro para el usuario actual
 */
function getNotesByBook(bookId) {
  const user = getCurrentUser();
  if (!user) return [];

  return getAllNotes().filter(
    n => n.bookId === bookId && n.userEmail === user.email
  );
}

/**
 * Guarda una nueva nota
 */
function addNote(bookId, content) {
  const user = getCurrentUser();
  if (!user || !content.trim()) return;

  const notes = getAllNotes();

  notes.push({
    id: crypto.randomUUID(),
    bookId,
    userEmail: user.email,
    content,
    createdAt: new Date().toISOString()
  });

  saveAllNotes(notes);
}

/**
 * Renderiza el panel de notas
 */
export function openNotesPanel(book) {
  // Evitar duplicados
  if (document.getElementById("notes-panel")) return;

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
      placeholder="Escribe aquí tu nota clínica o recordatorio…"
    ></textarea>

    <button id="saveNoteBtn" class="save-note-btn">
      Guardar nota
    </button>

    <ul class="notes-list"></ul>
  `;

  document.body.appendChild(panel);

  // Renderizar notas existentes
  renderNotes(book.id);

  // Eventos
  document
    .getElementById("closeNotesBtn")
    .addEventListener("click", () => {
      panel.remove();
    });

  document
    .getElementById("saveNoteBtn")
    .addEventListener("click", () => {
      const textarea = document.getElementById("noteInput");
      addNote(book.id, textarea.value);
      textarea.value = "";
      renderNotes(book.id);
    });
}

/**
 * Renderiza lista de notas
 */
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
      <small>${new Date(note.createdAt).toLocaleString()}</small>
    `;
    list.appendChild(li);
  });
}
