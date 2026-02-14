// assets/js/components/medical-stopwatch.js

document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     VARIABLES
  =============================== */

  const timerDisplay = document.getElementById("timerDisplay");
  const modeSelect = document.getElementById("modeSelect");
  const durationInput = document.getElementById("durationInput");
  const zeroMessage = document.getElementById("zeroMessage");
  const soundToggle = document.getElementById("soundToggle");

  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const markBtn = document.getElementById("markBtn");
  const exportLogBtn = document.getElementById("exportLogBtn");

  const logList = document.getElementById("logList");
  const logCount = document.getElementById("logCount");

  let interval = null;
  let seconds = 0;
  let running = false;

  /* ===============================
     UTILIDADES
  =============================== */

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function parseDuration(input) {
    const parts = input.split(":");
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs)) return 0;
    return mins * 60 + secs;
  }

  function nowStamp() {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  function playBeep() {
    if (!soundToggle.checked) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(seconds);
  }

  function updateLogCount() {
    logCount.textContent = `${logList.children.length} eventos`;
  }

  function addLog(text) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${text}</span>
      <span class="log-time">${formatTime(seconds)}</span>
    `;
    logList.prepend(li);
    updateLogCount();
  }

  /* ===============================
     CRONÓMETRO
  =============================== */

  function startTimer() {
    if (running) return;

    if (modeSelect.value === "countdown" && seconds <= 0) {
      seconds = parseDuration(durationInput.value);
      if (seconds <= 0) {
        alert("Ingresa una duración válida en formato MM:SS");
        return;
      }
    }

    running = true;

    interval = setInterval(() => {

      if (modeSelect.value === "countup") {
        seconds++;
      } else {
        seconds--;
        if (seconds <= 0) {
          seconds = 0;
          updateDisplay();
          clearInterval(interval);
          running = false;
          playBeep();
          addLog(zeroMessage.value || "Cuenta regresiva finalizada");
          return;
        }
      }

      updateDisplay();

    }, 1000);
  }

  function pauseTimer() {
    clearInterval(interval);
    running = false;
  }

  function resetTimer() {
    clearInterval(interval);
    running = false;
    seconds = 0;
    updateDisplay();
  }

  /* ===============================
     BOTONES
  =============================== */

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  markBtn.addEventListener("click", () => {
    addLog("Marca manual");
  });

  exportLogBtn.addEventListener("click", () => {
    let text = "Registro Clínico - Código Azul\n\n";
    Array.from(logList.children).forEach(li => {
      text += li.innerText + "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "registro_codigo_azul.txt";
    a.click();

    URL.revokeObjectURL(url);
  });

  /* ===============================
     TARJETAS EVENTOS
  =============================== */

  document.querySelectorAll(".event-card").forEach(card => {
    card.addEventListener("click", () => {
      const eventType = card.dataset.event;
      card.classList.add("active");

      switch (eventType) {
        case "paro":
          addLog("Inicio de Paro Cardiorrespiratorio");
          break;
        case "rcp":
          addLog("Ciclo de RCP completado");
          break;
        case "epi":
          addLog("Administración de Epinefrina");
          break;
        case "defib":
          addLog("Desfibrilación aplicada");
          break;
      }

      setTimeout(() => card.classList.remove("active"), 400);
    });
  });

  /* ===============================
     PRESETS SIDEBAR
  =============================== */

  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.id.replace("preset", "");
      seconds = parseInt(id, 10) || 0;
      updateDisplay();
      addLog(`Preset aplicado: ${formatTime(seconds)}`);
    });
  });

  /* ===============================
     INICIALIZACIÓN
  =============================== */

  updateDisplay();
  updateLogCount();

});
