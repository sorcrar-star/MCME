import { isFavorite, toggleFavorite } from "../services/favorites.service.js";
import { openNotesPanel } from "./book-notes.component.js";
import { openPdfModal } from "./pdf-modal.component.js";

export function renderBookCard(book) {
  const article = document.createElement("article");
  article.className = "book-card";

  const favorite = isFavorite(book.id);

  article.innerHTML = `
    <div class="book-card-header">
      <h3>${book.title}</h3>

      <div class="card-actions">
        <button class="notes-btn" title="Notas">📝</button>
        <button class="favorite-btn" title="Favorito">
          ${favorite ? "★" : "☆"}
        </button>
      </div>
    </div>

    <p>${book.collection} · ${book.year}</p>

    <button class="pdf-open-btn">Abrir PDF</button>
  `;

  article.querySelector(".favorite-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      const active = toggleFavorite(book.id);
      e.target.textContent = active ? "★" : "☆";
      document.dispatchEvent(new CustomEvent("favorites:updated"));
    });

  article.querySelector(".notes-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      openNotesPanel(book);
    });

  article.querySelector(".pdf-open-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      openPdfModal(book);
    });

  return article;
}
