// assets/js/services/search.service.js

export function searchBooks(books, query) {
  if (!query || query.trim() === "") return books;

  const q = query.toLowerCase();

  return books.filter(book =>
    book.title.toLowerCase().includes(q) ||
    (book.tags && book.tags.some(tag => tag.toLowerCase().includes(q)))
  );
}
