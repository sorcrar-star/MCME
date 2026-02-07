import { getCurrentUser } from "../services/auth.service.js";
import {
  getCurrentPdfPage,
  goToPdfPage
} from "./pdf-viewer.component.js";

const STORAGE_KEY = "mcme_notes";

/* ================= STORAGE ================= */

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

/* ================= CRUD ================= */

function addNote(bookId, content, page) {
  const user = getCurrentUser();
  if (!user || !content.trim()) return;

  const notes = getAllNotes();

  notes.push({
    id: generateId(),
    bookId,
    userEmail: user.email,
    content: content.trim(),
    page: Number(page),
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

/* ================= PANEL ================= */

export function openNotesPanel(book, forcedPage = null) {
  if (document.getElementById("notes-panel")) return;

  let initialPage =
    forcedPage !== null ? forcedPage : getCurrentPdfPage();

  const panel = document.createElement("div");
  panel.id = "notes-panel";
  panel.className = "notes-panel";

  panel.innerHTML = `
    <header class="notes-header">
      <div>
        <h3>Notas</h3>
        <small>${book.title}</small>
      </div>
      <button id="closeNotesBtn">✕</button>
    </header>

    <section class="note-create">
      <textarea
        id="noteInput"
        placeholder="Escribe aquí tu nota…"
      ></textarea>

      <div class="note-create-actions">
        <div>
          Página
          <input
            type="number"
            id="notePageInput"
            min="1"
            value="${initialPage}"
          />
        </div>

        <button id="saveNoteBtn" class="save-note-btn">
          Guardar
        </button>
      </div>
    </section>

    <section class="notes-history">
      <ul class="notes-list"></ul>
    </section>
  `;

  document.body.appendChild(panel);

  renderNotes(book.id);

  /* ===== SINCRONIZACIÓN CON PDF ===== */

  const pageChangeHandler = (e) => {
    const pageInput = document.getElementById("notePageInput");
    if (!pageInput) return;
    pageInput.value = e.detail.page;
  };

  document.addEventListener("pdf:pageChanged", pageChangeHandler);

  /* ===== GUARDAR ===== */

  document.getElementById("saveNoteBtn").onclick = () => {
    const text = document.getElementById("noteInput");
    const pageInput = document.getElementById("notePageInput");

    addNote(book.id, text.value, pageInput.value);

    text.value = "";
    renderNotes(book.id);
  };

  /* ===== CERRAR ===== */

  document.getElementById("closeNotesBtn").onclick = () => {
    document.removeEventListener("pdf:pageChanged", pageChangeHandler);
    panel.remove();
  };
}

/* ================= RENDER ================= */

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
    li.className = "note-item";

    li.innerHTML = `
      <textarea class="note-edit">${note.content}</textarea>

      <div class="note-meta">
        <small>Página ${note.page}</small>
      </div>

      <div class="note-actions">
        <button class="go-btn">↩</button>
        <button class="save-btn">💾</button>
        <button class="delete-btn">🗑</button>
      </div>
    `;

    li.querySelector(".go-btn").onclick = () => {
      goToPdfPage(note.page);
    };

    li.querySelector(".save-btn").onclick = () => {
      const newText = li.querySelector(".note-edit").value;
      updateNote(note.id, newText);
    };

    li.querySelector(".delete-btn").onclick = () => {
      deleteNote(note.id);
      renderNotes(bookId);
    };

    list.appendChild(li);
  });
}
