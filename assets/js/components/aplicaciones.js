// assets/js/aplicaciones.js

/* ===============================
   Protección de ruta simple
=============================== */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

/* ===============================
   DOM Ready
=============================== */
document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     Navegación a aplicaciones
  =============================== */
  document.querySelectorAll(".btn-open-app").forEach(button => {
    button.addEventListener("click", () => {
      const appUrl = button.dataset.app;
      if (appUrl) {
        window.location.href = appUrl;
      }
    });
  });

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
});
