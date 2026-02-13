// assets/js/medical-stopwatch.js

import { isAuthenticated } from "./services/auth.service.js";

if (!isAuthenticated()) {
  window.location.href = "login.html";
}

const display = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const logList = document.getElementById("logList");

let totalSeconds = 0;
let interval = null;
let running = false;
let activeEvents = [];

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function updateDisplay() {
  display.textContent = formatTime(totalSeconds);
}

function tick() {
  totalSeconds++;
  updateDisplay();
  checkEvents();
}

function start() {
  if (running) return;
  running = true;
  interval = setInterval(tick, 1000);
}

function pause() {
  running = false;
  clearInterval(interval);
}

function reset() {
  pause();
  totalSeconds = 0;
  activeEvents = [];
  logList.innerHTML = "";
  display.classList.remove("alert");
  updateDisplay();
}

function addLog(message) {
  const li = document.createElement("li");
  li.textContent = `${formatTime(totalSeconds)} – ${message}`;
  logList.appendChild(li);
}

function activateEvent(type) {
  if (activeEvents.includes(type)) return;

  activeEvents.push(type);
  addLog(`Evento activado: ${type}`);

  if (type === "paro") {
    totalSeconds = 0;
    updateDisplay();
  }
}

function checkEvents() {
  if (activeEvents.includes("rcp") && totalSeconds % 120 === 0) {
    triggerAlert("Cambio de ciclo RCP");
  }

  if (activeEvents.includes("epi") && totalSeconds % 180 === 0) {
    triggerAlert("Administrar Epinefrina");
  }
}

function triggerAlert(message) {
  display.classList.add("alert");
  addLog(message);

  setTimeout(() => {
    display.classList.remove("alert");
  }, 3000);
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);

document.querySelectorAll("[data-event]").forEach(btn => {
  btn.addEventListener("click", () => {
    activateEvent(btn.dataset.event);
  });
});

/* Usuario */
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

updateDisplay();
