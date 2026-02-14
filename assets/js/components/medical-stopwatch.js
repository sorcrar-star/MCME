// assets/js/medical-stopwatch.js

/* ===============================
   Protección de ruta simple
=============================== */
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "login.html";
}

/* ===============================
   Variables globales del timer
=============================== */
document.addEventListener("DOMContentLoaded", () => {

  const display = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const markBtn = document.getElementById("markBtn");
  const exportLogBtn = document.getElementById("exportLogBtn");

  const modeSelect = document.getElementById("modeSelect");
  const durationInput = document.getElementById("durationInput");
  const zeroMessageInput = document.getElementById("zeroMessage");
  const soundToggle = document.getElementById("soundToggle");

  const logList = document.getElementById("logList");
  const eventButtons = document.querySelectorAll("[data-event]");

  let mode = modeSelect.value || "countup";
  let initialSeconds = 0; // for countdown mode
  let remainingSeconds = 0;
  let elapsed = 0;
  let intervalId = null;
  let running = false;

  // Active events & settings
  let activeEvents = [];
  let epiInterval = 180; // default epinefrina cada 180s
  let rcpCycle = 120; // 120s por ciclo
  let soundEnabled = false;
  let zeroMessage = zeroMessageInput.value || "Tiempo finalizado";

  // beep sound (small data uri beep)
  const beep = (() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      return (freq = 880, duration = 0.12) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.value = 0.05;
        o.start();
        setTimeout(() => {
          o.stop();
        }, duration * 1000);
      };
    } catch (e) {
      return () => {};
    }
  })();

  /* ===============================
     Utilidades
  =============================== */
  function parseDurationInput(text) {
    // Expect mm:ss or number (minutes)
    if (!text) return 0;
    if (/^\d+:\d{1,2}$/.test(text)) {
      const [m, s] = text.split(":").map(Number);
      return m * 60 + s;
    }
    if (/^\d+$/.test(text)) {
      return Number(text) * 60;
    }
    return 0;
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function nowStamp() {
    // returns elapsed formatted H:MM:SS relative to timer start
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return (h > 0 ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function addLog(text) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${text}</span><span class="log-time">${nowStamp()}</span>`;
    logList.prepend(li);
  }

  function updateDisplayValue() {
    if (mode === "countdown") {
      display.textContent = formatTime(remainingSeconds);
    } else {
      display.textContent = formatTime(elapsed);
    }
  }

  /* ===============================
     Visual status management
  =============================== */
  function clearStatusClasses() {
    display.classList.remove("timer-status-red", "timer-status-orange", "timer-status-yellow", "timer-flash");
  }

  function setPersistentStatus(type) {
    clearStatusClasses();
    if (type === "paro") {
      display.classList.add("timer-status-red");
    } else if (type === "epi") {
      display.classList.add("timer-status-orange");
    } else if (type === "defib") {
      display.classList.add("timer-status-yellow");
    }
  }

  function flashRCP() {
    // quick flash animation
    display.classList.add("timer-flash");
    if (soundEnabled) beep(600, 0.14);
    setTimeout(() => {
      display.classList.remove("timer-flash");
      // if paro active keep red, else restore default or other persistent
      refreshPersistentStatus();
    }, 800);
  }

  function refreshPersistentStatus() {
    // Priority: paro > defib > epi > none
    if (activeEvents.includes("paro")) {
      setPersistentStatus("paro");
    } else if (activeEvents.includes("defib")) {
      setPersistentStatus("defib");
    } else if (activeEvents.includes("epi")) {
      setPersistentStatus("epi");
    } else {
      clearStatusClasses();
    }
  }

  /* ===============================
     Event triggers & checks
  =============================== */
  function checkEvents() {
    // Use elapsed for cycle timing regardless countup/countdown.
    // For countdown compute elapsed as initialSeconds - remainingSeconds
    const currentElapsed = elapsed;

    // RCP cycles
    if (activeEvents.includes("rcp") && currentElapsed > 0 && currentElapsed % rcpCycle === 0) {
      addLog("Ciclo RCP completado");
      flashRCP();
    }

    // Epinefrina reminders
    if (activeEvents.includes("epi") && currentElapsed > 0 && currentElapsed % epiInterval === 0) {
      addLog("Recordatorio: administrar Epinefrina");
      display.classList.add("timer-status-orange");
      if (soundEnabled) beep(520, 0.12);
      setTimeout(() => refreshPersistentStatus(), 3000);
    }
  }

  function triggerZero() {
    // Called when countdown reaches 0
    addLog(`ALERTA: ${zeroMessage}`);
    // show built-in dialog and then a modal-like alert
    if (soundEnabled) {
      beep(320, 0.3);
      setTimeout(() => beep(440, 0.12), 350);
    }
    alert(zeroMessage);
  }

  /* ===============================
     Timer core
  =============================== */
  function tick() {
    if (mode === "countdown") {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        elapsed++;
        updateDisplayValue();
        checkEvents();

        if (remainingSeconds <= 0) {
          pause();
          refreshPersistentStatus();
          triggerZero();
        }
      }
    } else {
      // count up
      elapsed++;
      updateDisplayValue();
      checkEvents();
    }
  }

  function start() {
    if (running) return;
    running = true;
    // if countdown and not initialized, try to read durationInput
    if (mode === "countdown" && initialSeconds === 0 && remainingSeconds === 0) {
      initialSeconds = parseDurationInput(durationInput.value) || 0;
      remainingSeconds = initialSeconds;
    }
    intervalId = setInterval(tick, 1000);
    addLog("Timer iniciado");
  }

  function pause() {
    if (!running) return;
    running = false;
    clearInterval(intervalId);
    addLog("Timer pausado");
  }

  function reset() {
    pause();
    elapsed = 0;
    if (mode === "countdown") {
      initialSeconds = parseDurationInput(durationInput.value) || 0;
      remainingSeconds = initialSeconds;
    } else {
      remainingSeconds = 0;
    }
    activeEvents = [];
    eventButtons.forEach(b => b.classList.remove("active"));
    logList.innerHTML = "";
    clearStatusClasses();
    updateDisplayValue();
    addLog("Timer reseteado");
  }

  /* ===============================
     Events activation/toggle
  =============================== */
  function activateEvent(type) {
    // toggle: if active remove it
    const idx = activeEvents.indexOf(type);
    if (idx !== -1) {
      // deactivate
      activeEvents.splice(idx, 1);
      addLog(`Evento desactivado: ${type}`);
      refreshPersistentStatus();
      // remove active class
      document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.remove("active"));
      return;
    }

    // activate
    // special behavior per type
    if (type === "paro") {
      // ask duration for paro (in minutes or mm:ss)
      const userInput = prompt("Duración del tiempo de paro (MM:SS o minutos). Ej: 10 ó 10:00", "10");
      const sec = parseDurationInput(userInput);
      if (!sec || sec <= 0) {
        alert("Duración inválida. Se cancela activación de 'paro'.");
        return;
      }
      // force countdown
      modeSelect.value = "countdown";
      mode = "countdown";
      initialSeconds = sec;
      remainingSeconds = sec;
      elapsed = 0;
      addLog(`Paro activado (${formatTime(sec)})`);
      setPersistentStatus("paro");
      // ensure timer running
      start();
    } else if (type === "rcp") {
      addLog("Ciclos RCP activados (cada 2 min)");
      activeEvents.push("rcp");
      // if timer not running, start it to measure cycles
      if (!running) start();
      // give visual
      document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.add("active"));
    } else if (type === "epi") {
      const userI = prompt("Intervalo de Epinefrina en segundos (por defecto 180)", "180");
      const val = parseInt(userI, 10);
      if (!isNaN(val) && val > 0) {
        epiInterval = val;
      }
      addLog(`Epinefrina activada (intervalo: ${epiInterval}s)`);
      activeEvents.push("epi");
      document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.add("active"));
    } else if (type === "defib") {
      // Defib is a manual alert: flash and log immediately and mark active momentarily
      addLog("Desfibrilación: preparado / marcado");
      // show yellow flash
      display.classList.add("timer-status-yellow");
      if (soundEnabled) beep(900, 0.12);
      setTimeout(() => {
        refreshPersistentStatus();
      }, 2500);
    } else {
      // generic
      activeEvents.push(type);
      addLog(`Evento activado: ${type}`);
    }

    // set active class on button
    document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.add("active"));
    refreshPersistentStatus();
  }

  /* ===============================
     UI wiring
  =============================== */

  // initial display value
  updateDisplayValue();

  modeSelect.addEventListener("change", () => {
    mode = modeSelect.value;
    addLog(`Modo cambiado a: ${mode}`);
    // if switching to countdown try to set remaining
    if (mode === "countdown") {
      initialSeconds = parseDurationInput(durationInput.value) || initialSeconds;
      remainingSeconds = initialSeconds;
    }
    updateDisplayValue();
    refreshPersistentStatus();
  });

  durationInput.addEventListener("change", () => {
    // only affects next reset / when explicitly set
    addLog(`Duración establecida: ${durationInput.value}`);
  });

  zeroMessageInput.addEventListener("change", () => {
    zeroMessage = zeroMessageInput.value || "Tiempo finalizado";
    addLog(`Mensaje al 0 actualizado: ${zeroMessage}`);
  });

  soundToggle.addEventListener("change", () => {
    soundEnabled = soundToggle.checked;
    addLog(`Sonido ${soundEnabled ? "activado" : "desactivado"}`);
  });

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", pause);
  resetBtn.addEventListener("click", reset);

  markBtn.addEventListener("click", () => {
    addLog("Marca manual");
    if (soundEnabled) beep(720, 0.08);
  });

  exportLogBtn.addEventListener("click", () => {
    const lines = Array.from(logList.querySelectorAll("li")).map(li => {
      const text = li.querySelector("span").innerText;
      const time = li.querySelector(".log-time").innerText;
      return `[${time}] ${text}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcme-codeblue-log-${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addLog("Exportado log");
  });

  // event button wiring
  eventButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-event");
      activateEvent(type);
    });
  });

  /* ===============================
     Keep UI user info + logout (same as elsewhere)
  =============================== */
  const userSpan = document.querySelector("#app-header .header-right span");
  const logoutBtn = document.getElementById("logoutBtn");
  if (userSpan && user) userSpan.textContent = user.name || user.email;
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  /* ===============================
     Start/Stop helper: ensure initial values
  =============================== */
  // If countdown mode and duration provided, initialize remaining
  if (mode === "countdown" && parseDurationInput(durationInput.value) > 0) {
    initialSeconds = parseDurationInput(durationInput.value);
    remainingSeconds = initialSeconds;
    updateDisplayValue();
  } else {
    updateDisplayValue();
  }
});
