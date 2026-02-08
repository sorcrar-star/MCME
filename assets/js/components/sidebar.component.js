// assets/js/components/sidebar.component.js
// Renderiza el árbol de carpetas virtuales

import { getChildFolders } from "../services/folder.service.js";

/**
 * Crea un nodo visual de carpeta (recursivo)
 */
function createFolderNode(folder) {
  const li = document.createElement("li");
  li.className = "sidebar-folder";

  if (folder.id === window.__ACTIVE_FOLDER_ID__) {
    li.classList.add("active");
  }

  // Si esta carpeta es parte de la ruta activa, abrirla
  if (window.__ACTIVE_FOLDER_PATH__?.includes(folder.id)) {
    li.classList.add("expanded");
  }



  // Contenedor interno (flecha + nombre)
  const row = document.createElement("div");
  row.className = "sidebar-row";

 // Flecha (solo visual si hay hijos)
 const arrow = document.createElement("span");
arrow.className = "sidebar-arrow";
arrow.textContent = "";


  // Título
  const label = document.createElement("span");
  label.className = "sidebar-label";
  label.textContent = folder.name;

  // Armar fila
  row.appendChild(arrow);
  row.appendChild(label);
  li.appendChild(row);

  li.dataset.folderId = folder.id;
arrow.addEventListener("click", (e) => {if (children.length > 0) {
  arrow.addEventListener("click", (e) => {
    e.stopPropagation();

    li.classList.toggle("expanded");

    const sub = li.querySelector(".sidebar-subfolders");
    if (sub) {
      sub.classList.toggle("collapsed");
    }

    arrow.textContent = li.classList.contains("expanded") ? "▼" : "▶";
  });
}

  e.stopPropagation();

  li.classList.toggle("expanded");

  const sub = li.querySelector(".sidebar-subfolders");
  if (sub) {
    sub.classList.toggle("collapsed");
  }

  arrow.textContent = li.classList.contains("expanded") ? "▼" : "▶";
});

  label.addEventListener("click", (e) => {

  e.stopPropagation();

  // quitar activo anterior
  document
    .querySelectorAll(".sidebar-folder.active")
    .forEach(el => el.classList.remove("active"));

  // marcar activo actual
  li.classList.add("active");

  const event = new CustomEvent("folder:selected", {
    detail: { folderId: folder.id }
  });

  document.dispatchEvent(event);
});


  const children = getChildFolders(folder.id);
  if (children.length > 0) {
    arrow.textContent = window.__ACTIVE_FOLDER_PATH__?.includes(folder.id)
  ? "▼"
  : "▶";

    li.classList.add("has-children");

// Flecha abierta si está en ruta activa
if (window.__ACTIVE_FOLDER_PATH__?.includes(folder.id)) {
  arrow.textContent = "▼";
}

    const ul = document.createElement("ul");
ul.className = "sidebar-subfolders";

 // Si la carpeta NO está en la ruta activa → colapsar
 if (!window.__ACTIVE_FOLDER_PATH__?.includes(folder.id)) {
  ul.classList.add("collapsed");
}
;


    children.forEach(child => {
      ul.appendChild(createFolderNode(child));
    });

    li.classList.add("has-children");

    li.appendChild(ul);
  }

  return li;
}


/**
 * Renderiza la sidebar completa
 */

export function renderSidebar(activeFolderId, containerId = "app-sidebar") {
  window.__ACTIVE_FOLDER_ID__ = activeFolderId;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "<h2>Carpetas</h2>";

  const ul = document.createElement("ul");
  ul.className = "sidebar-tree";

  // Raíz lógica
  const rootFolders = getChildFolders("root");
  rootFolders.forEach(folder => {
    ul.appendChild(createFolderNode(folder));
  });

  container.appendChild(ul);
}
