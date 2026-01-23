// assets/js/components/book-card.component.js
// Tarjeta visual de libro

import { isFavorite, toggleFavorite } from "../services/favorites.service.js";
import { openNotesPanel } from "./book-notes.component.js";

export function renderBookCard(book) {
  const article = document.createElement("article");
  article.className = "book-card";

  const favorite = isFavorite(book.id);

  article.innerHTML = `
    <div class="book-card-header">
      <h3>${book.title}</h3>

      <div class="card-actions">
        <button class="notes-btn" title="Notas">📝</button>
        <button class="favorite-btn">
          ${favorite ? "★" : "☆"}
        </button>
      </div>
    </div>

    <p>${book.collection} · ${book.year}</p>

    <button class="pdf-link-btn">
  Abrir PDF
</button>

  `;

  // ⭐ Favoritos
  const favBtn = article.querySelector(".favorite-btn");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const active = toggleFavorite(book.id);
    favBtn.textContent = active ? "★" : "☆";

    document.dispatchEvent(
      new CustomEvent("favorites:updated")
    );
  });

  // 📝 Notas
  const notesBtn = article.querySelector(".notes-btn");
  notesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openNotesPanel(book);
  });

  return article;
}
