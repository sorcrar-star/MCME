// assets/js/components/book-card.component.js
// Tarjeta visual de libro

import { isFavorite, toggleFavorite } from "../services/favorites.service.js";
import { openNotesPanel } from "./book-notes.component.js";
import { openPdfViewer } from "./pdf-viewer.component.js";


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

    <button class="pdf-open-btn">
      Abrir PDF
    </button>
  `;

  /* ==========================
     FAVORITOS
  ========================== */
  const favBtn = article.querySelector(".favorite-btn");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const active = toggleFavorite(book.id);
    favBtn.textContent = active ? "★" : "☆";

    document.dispatchEvent(
      new CustomEvent("favorites:updated")
    );
  });

  /* ==========================
     NOTAS (desde tarjeta)
  ========================== */
  const notesBtn = article.querySelector(".notes-btn");
  notesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openNotesPanel(book);
  });

  /* ==========================
     PDF (pantalla completa)
  ========================== */
  const pdfBtn = article.querySelector(".pdf-open-btn");
  pdfBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  console.log("CLICK PDF", book);
  openPdfModal(book);
  });


  return article;
}
