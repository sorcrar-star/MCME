// assets/js/aplicaciones.js

/* ===============================
   Protección de ruta simple
=============================== */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

/* ===============================
   Redirección a herramienta
=============================== */

document.addEventListener("DOMContentLoaded", () => {
  const stopwatchCard = document.getElementById("openStopwatch");

  if (stopwatchCard) {
    stopwatchCard.addEventListener("click", () => {
      window.location.href = "./medical-stopwatch.html";
    });
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
});
