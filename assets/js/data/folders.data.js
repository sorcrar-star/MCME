// assets/js/data/folders.data.js

export const folders = [

  {
    id: "root",
    name: "Biblioteca",
    parentId: null,
    children: ["all-books", "collections", "favorites"]
  },

  {
    id: "all-books",
    name: "Libros",
    parentId: "root",
    filter: () => true
  },

  {
  id: "collections",
  name: "Colecciones",
  parentId: "root",
  children: ["collection-acls", "collection-bls"],
  filter: book => !!book.collection
},


  {
    id: "collection-acls",
    name: "ACLS",
    parentId: "collections",
    children: ["collection-acls-2025"],
    filter: book => book.collection === "ACLS"
  },

  {
    id: "collection-acls-2025",
    name: "2025",
    parentId: "collection-acls",
    filter: book =>
      book.collection === "ACLS" && book.year === 2025
  },
  
  {
  id: "collection-bls",
  name: "BLS",
  parentId: "collections",
  children: ["collection-bls-2025"],
  filter: book => book.collection === "BLS"
},

{
  id: "collection-bls-2025",
  name: "2025",
  parentId: "collection-bls",
  filter: book =>
    book.collection === "BLS" && book.year === 2025
},


 {
  id: "favorites",
  name: "Favoritos",
  parentId: "root",
  filter: (book) => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    return favorites.includes(book.id);
  }
}


];
