// assets/js/services/folder.service.js

import { folders } from "../data/folders.data.js";
import { books } from "../data/books.data.js";

export function getChildFolders(parentId) {
  return folders.filter(folder => folder.parentId === parentId);
}

export function getFolderById(id) {
  return folders.find(folder => folder.id === id);
}

export function getBooksByFolder(folderId) {
  const folder = getFolderById(folderId);
  if (!folder) return [];

  // 1. Si la carpeta tiene filtro → usarlo
  if (typeof folder.filter === "function") {
    return books.filter(folder.filter);
  }

  // 2. Si NO tiene filtro pero tiene hijos → unir libros de los hijos
  if (folder.children && folder.children.length > 0) {
    const childBooks = folder.children.flatMap(childId =>
      getBooksByFolder(childId)
    );

    // eliminar duplicados
    return [...new Map(childBooks.map(b => [b.id, b])).values()];
  }

  // 3. Si no hay nada
  return [];
}
export function getFolderPath(folderId) {
  const path = [];
  let current = getFolderById(folderId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? getFolderById(current.parentId)
      : null;
  }

  return path;
}
