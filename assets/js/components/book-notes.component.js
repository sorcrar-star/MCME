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

  const pdfModal = document.getElementById("pdfViewer");
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

  // 🔴 ESTE ES EL CAMBIO CLAVE
  pdfModal.appendChild(panel);

  document.getElementById("closeNotesBtn")
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
        ${note.page ? `Página ${note.page} · ` : ""}
        ${new Date(note.createdAt).toLocaleString()}
      </small>
    `;
    list.appendChild(li);
  });
}

