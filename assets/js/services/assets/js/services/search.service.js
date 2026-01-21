// assets/js/services/search.service.js
// Búsqueda avanzada de libros

export function searchBooks(books, query) {
  if (!query) return books;

  const q = query.toLowerCase();

  return books.filter(book => {
    return (
      book.title.toLowerCase().includes(q) ||
      book.subject.toLowerCase().includes(q) ||
      (book.tags && book.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  });
}
