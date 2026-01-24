// assets/js/components/book-notes.component.js
// Panel de notas por libro (frontend)

import { getCurrentUser } from "../services/auth.service.js";

const STORAGE_KEY = "mcme_notes";

/* ==========================
   UTILIDADES STORAGE
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
   PDF – PÁGINA ACTUAL
========================== */

function getCurrentPdfPage() {
  const iframe = document.getElementById("pdfFrame");
  if (!iframe || !iframe.src) return null;

  const hash = iframe.src.split("#page=")[1];
  return hash ? hash.split("&")[0] : null;
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
    page: getCurrentPdfPage(),
    createdAt: new Date().toISOString()
  });

  saveAllNotes(notes);
}

/* ==========================
   PANEL DE NOTAS
========================== */

export function openNotesPanel(book) {
  if (document.getElementById("notes-panel")) return;

  const panel = document.createElement("div");
  panel.id = "notes-panel";
  panel.className = "notes-panel";
  panel.style.zIndex = "1100";
  
  panel.innerHTML = `
    <header class="notes-header">
      <h3>Notas – ${book.title}</h3>
      <button id="closeNotesBtn" title="Cerrar">✕</button>
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

  renderNotes(book.id);

  document.getElementById("closeNotesBtn").addEventListener("click", () => {
    panel.remove();
  });

  document.getElementById("saveNoteBtn").addEventListener("click", () => {
    const textarea = document.getElementById("noteInput");
    addNote(book.id, textarea.value);
    textarea.value = "";
    renderNotes(book.id);
  });
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
        ${note.page ? `Página ${note.page} · ` : ""}
        ${new Date(note.createdAt).toLocaleString()}
      </small>
    `;
    list.appendChild(li);
  });
}
