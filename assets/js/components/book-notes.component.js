import { getCurrentUser } from "../services/auth.service.js";
import { getCurrentPdfPage, goToPdfPage } from "./pdf-viewer.component.js";

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
  return crypto.randomUUID();
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
    page: getCurrentPdfPage(), // 🔥 se guarda UNA VEZ
    createdAt: new Date().toISOString()
  });

  saveAllNotes(notes);
}

function updateNote(id, newContent) {
  const notes = getAllNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;

  note.content = newContent.trim();
  saveAllNotes(notes);
}

function deleteNote(id) {
  const notes = getAllNotes().filter(n => n.id !== id);
  saveAllNotes(notes);
}

export function openNotesPanel(book) {
  if (document.getElementById("notes-panel")) return;

  const pdfViewer = document.getElementById("pdfViewer");

  const panel = document.createElement("div");
  panel.id = "notes-panel";
  panel.className = "notes-panel";

  panel.innerHTML = `
    <header class="notes-header">
      <h3>Notas – ${book.title}</h3>
      <button id="closeNotesBtn">✕</button>
    </header>

    <textarea id="noteInput" placeholder="Escribe aquí tu nota…"></textarea>
    <button id="saveNoteBtn" class="save-note-btn">Guardar nota</button>

    <ul class="notes-list"></ul>
  `;

  pdfViewer.appendChild(panel);
  renderNotes(book.id);

  document.getElementById("saveNoteBtn").onclick = () => {
    const input = document.getElementById("noteInput");
    addNote(book.id, input.value);
    input.value = "";
    renderNotes(book.id);
  };

  document.getElementById("closeNotesBtn").onclick = () => panel.remove();
}

function renderNotes(bookId) {
  const list = document.querySelector(".notes-list");
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
      <textarea class="note-edit">${note.content}</textarea>

      <div class="note-actions">
        <small>Página ${note.page}</small>

        <button title="Ir a página ${note.page}" class="go-btn">↩</button>
        <button title="Guardar cambios" class="save-btn">💾</button>
        <button title="Eliminar nota" class="delete-btn">🗑</button>
      </div>
    `;

    li.querySelector(".go-btn").onclick = () => goToPdfPage(note.page);
    li.querySelector(".save-btn").onclick = () => {
      updateNote(note.id, li.querySelector(".note-edit").value);
    };
    li.querySelector(".delete-btn").onclick = () => {
      deleteNote(note.id);
      renderNotes(bookId);
    };

    list.appendChild(li);
  });
}
