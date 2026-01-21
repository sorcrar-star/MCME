// assets/js/main.js

import { renderBookCard } from "./components/book-card.component.js";
import { searchBooks } from "./services/search.service.js";
import { renderSidebar } from "./components/sidebar.component.js";
import { getBooksByFolder, getFolderPath } from "./services/folder.service.js";
import { renderHeader } from "./components/header.component.js";
import { isAuthenticated } from "./services/auth.service.js";

// 🔒 Protección de ruta
if (!isAuthenticated()) {
  window.location.href = "login.html";
}

// ===============================
// Protección de ruta (frontend)
// ===============================
if (!isAuthenticated()) {
  window.location.href = "login.html";
}

// ===============================
// Constantes de storage
// ===============================
const STORAGE_ACTIVE_FOLDER = "activeFolderId";
const STORAGE_SEARCH_QUERY = "searchQuery";

// ===============================
// Estado de la app
// ===============================
let activeFolderId =
  localStorage.getItem(STORAGE_ACTIVE_FOLDER) || "all-books";

let currentSearch =
  localStorage.getItem(STORAGE_SEARCH_QUERY) || "";

// ===============================
// DOM
// ===============================
const grid = document.getElementById("booksGrid");
const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.value = currentSearch;
}

// ===============================
// Render de libros
// ===============================
function renderBooks() {
  const booksForFolder = getBooksByFolder(activeFolderId);
  const filtered = searchBooks(booksForFolder, currentSearch);

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = "<p>No hay libros en esta carpeta.</p>";
    return;
  }

  filtered.forEach(book => {
    grid.appendChild(renderBookCard(book));
  });
  
  document.addEventListener("favorites:updated", () => {
   renderBooks();

});

}

// ===============================
// Buscador
// ===============================
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    localStorage.setItem(STORAGE_SEARCH_QUERY, currentSearch);
    renderBooks();
  });
}

// ===============================
// Inicialización
// ===============================
// Estado global para la sidebar
window.__ACTIVE_FOLDER_ID__ = activeFolderId;
window.__ACTIVE_FOLDER_PATH__ =
  getFolderPath(activeFolderId).map(f => f.id);

renderHeader();
renderSidebar();
renderBooks();
renderBreadcrumbs(activeFolderId);


// ===============================
// Cambio de carpeta
// ===============================
document.addEventListener("folder:selected", (e) => {
  const folderId = e.detail.folderId;

  // 1️⃣ actualizar estado
  activeFolderId = folderId;
  localStorage.setItem(STORAGE_ACTIVE_FOLDER, folderId);

  // 2️⃣ actualizar estado global de la sidebar
  window.__ACTIVE_FOLDER_ID__ = folderId;
  window.__ACTIVE_FOLDER_PATH__ =
    getFolderPath(folderId).map(f => f.id);

  // 3️⃣ re-render UI
  renderSidebar();
  renderBooks();
  renderBreadcrumbs(folderId);
});


// ===============================
// Breadcrumbs
// ===============================
function renderBreadcrumbs(folderId) {
  const container = document.getElementById("breadcrumbs");
  if (!container) return;

  const path = getFolderPath(folderId);
  container.innerHTML = "";

  path.forEach((folder, index) => {
    const crumb = document.createElement("span");
    crumb.textContent = folder.name;
    crumb.className = "breadcrumb-item";

    crumb.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("folder:selected", {
          detail: { folderId: folder.id }
        })
      );
    });

    container.appendChild(crumb);

    if (index < path.length - 1) {
      const sep = document.createElement("span");
      sep.textContent = " > ";
      sep.className = "separator";
      container.appendChild(sep);
    }
  });
}

