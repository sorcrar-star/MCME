// assets/js/services/favorites.service.js
// Manejo de libros favoritos (persistencia local)

const STORAGE_KEY = "favorites";

export function getFavorites() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function isFavorite(bookId) {
  return getFavorites().includes(bookId);
}

export function toggleFavorite(bookId) {
  const favorites = getFavorites();

  const index = favorites.indexOf(bookId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(bookId);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites.includes(bookId);
}
