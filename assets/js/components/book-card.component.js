// assets/js/components/book-card.component.js
// Tarjeta visual de libro

import { isFavorite, toggleFavorite } from "../services/favorites.service.js";

export function renderBookCard(book) {
  const article = document.createElement("article");
  article.className = "book-card";

  const favorite = isFavorite(book.id);

  article.innerHTML = `
    <div class="book-card-header">
      <h3>${book.title}</h3>
      <button class="favorite-btn">
        ${favorite ? "★" : "☆"}
      </button>
    </div>

    <p>${book.collection} · ${book.year}</p>

    <a 
      href="${book.pdfUrl}"
      target="_blank"
      rel="noopener noreferrer"
      class="pdf-link"
    >
      Abrir PDF
    </a>
  `;

  const favBtn = article.querySelector(".favorite-btn");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const active = toggleFavorite(book.id);
    favBtn.textContent = active ? "★" : "☆";

    document.dispatchEvent(
      new CustomEvent("favorites:updated")
    );
  });

  return article;
}
