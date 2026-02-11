// assets/js/aplicaciones.js

import { isAuthenticated } from "./services/auth.service.js";

/* ===============================
   Protección de ruta
=============================== */
if (!isAuthenticated()) {
  window.location.href = "login.html";
}

/* ===============================
   Redirección a herramienta
=============================== */

const stopwatchCard = document.getElementById("openStopwatch");

if (stopwatchCard) {
  stopwatchCard.addEventListener("click", () => {
    window.location.href = "medical-stopwatch.html";
  });
}

/* ===============================
   Usuario + logout
=============================== */
const userData = JSON.parse(localStorage.getItem("user"));

const userSpan = document.querySelector("#app-header .header-right span");
const logoutBtn = document.getElementById("logoutBtn");

if (userSpan && userData) {
  userSpan.textContent = userData.name || userData.email;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}
