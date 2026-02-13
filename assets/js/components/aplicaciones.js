// assets/js/aplicaciones.js

/* ===============================
   Protección de ruta simple
=============================== */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

/* ===============================
   Inicialización
=============================== */

function initAplicaciones() {
  /* ===============================
     Navegación a aplicaciones
  =============================== */

  const buttons = document.querySelectorAll(".btn-open-app");

  if (buttons.length > 0) {
    buttons.forEach(button => {
      button.addEventListener("click", function () {
        const appUrl = this.getAttribute("data-app");

        if (appUrl) {
          window.location.href = appUrl;
        } else {
          console.warn("No se encontró data-app en el botón");
        }
      });
    });
  } else {
    console.warn("No se encontraron botones .btn-open-app");
  }

  /* ===============================
     Usuario + logout
  =============================== */

  const userSpan = document.querySelector("#app-header .header-right span");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userSpan && user) {
    userSpan.textContent = user.name || user.email;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

/* ===============================
   Ejecutar cuando el DOM esté listo
=============================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAplicaciones);
} else {
  initAplicaciones();
}
