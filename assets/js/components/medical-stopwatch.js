/* ===============================
   Protección de ruta simple
=============================== */
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "login.html";
}

/* ===============================
   Lógica del Cronómetro y Eventos
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  // Elementos UI
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

  // Estado del timer
  let mode = modeSelect.value;
  let initialSeconds = 0;
  let remainingSeconds = 0;
  let elapsed = 0;
  let intervalId = null;
  let running = false;

  // Eventos activos
  let activeEvents = [];
  let epiInterval = 180;   // Epinefrina cada 3 min
  let rcpCycle = 120;      // RCP cada 2 min
  let soundEnabled = false;
  let zeroMessage = zeroMessageInput.value || "Fin del tiempo";

  // Función de sonido beep
  const beep = (() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      return (freq = 800, duration = 0.1) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.value = 0.05;
        o.start();
        setTimeout(() => o.stop(), duration*1000);
      };
    } catch {
      return () => {};
    }
  })();

  // Utilitarios
  function parseDuration(text) {
    if (!text) return 0;
    if (/^\d+:\d{1,2}$/.test(text)) {
      const [m,s] = text.split(":").map(Number);
      return m*60 + s;
    }
    if (/^\d+$/.test(text)) {
      return Number(text)*60;
    }
    return 0;
  }
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(sec/60)).padStart(2,"0");
    const s = String(sec%60).padStart(2,"0");
    return `${m}:${s}`;
  }
  function addLog(text) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${text}</span><span class="log-time">${nowStamp()}</span>`;
    logList.prepend(li);
  }
  function nowStamp() {
    // Tiempo transcurrido HH:MM:SS
    const h = Math.floor(elapsed/3600);
    const m = Math.floor((elapsed%3600)/60);
    const s = elapsed % 60;
    return (h>0? h+":" : "") + 
           String(m).padStart(2,"0") + ":" + 
           String(s).padStart(2,"0");
  }
  function updateDisplay() {
    display.textContent = (mode==="countdown")
      ? formatTime(remainingSeconds)
      : formatTime(elapsed);
  }

  // Manejo visual de estado persistente
  function clearStatus() {
    display.classList.remove("timer-status-red","timer-status-orange","timer-status-yellow","timer-flash");
  }
  function setPersistent(type) {
    clearStatus();
    if (type==="paro") display.classList.add("timer-status-red");
    if (type==="epi")  display.classList.add("timer-status-orange");
    if (type==="defib") display.classList.add("timer-status-yellow");
  }
  function flashRCP() {
    display.classList.add("timer-flash");
    if (soundEnabled) beep(600, 0.14);
    setTimeout(() => {
      display.classList.remove("timer-flash");
      refreshPersistent();
    }, 800);
  }
  function refreshPersistent() {
    if (activeEvents.includes("paro")) setPersistent("paro");
    else if (activeEvents.includes("defib")) setPersistent("defib");
    else if (activeEvents.includes("epi")) setPersistent("epi");
    else clearStatus();
  }

  // Verifica eventos en cada tick
  function checkEvents() {
    const t = elapsed; 
    // Ciclos RCP cada 2 min
    if (activeEvents.includes("rcp") && t>0 && t % rcpCycle === 0) {
      addLog("Ciclo RCP completado");
      flashRCP();
    }
    // Epinefrina cada 3 min
    if (activeEvents.includes("epi") && t>0 && t % epiInterval === 0) {
      addLog("Recordatorio: administrar Epinefrina");
      display.classList.add("timer-status-orange");
      if (soundEnabled) beep(520, 0.12);
      setTimeout(refreshPersistent, 3000);
    }
  }

  function triggerZero() {
    addLog(`ALERTA: ${zeroMessage}`);
    if (soundEnabled) {
      beep(320, 0.3);
      setTimeout(() => beep(440, 0.12), 350);
    }
    alert(zeroMessage);
  }

  // Lógica del cronómetro
  function tick() {
    if (mode === "countdown") {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        elapsed++;
        updateDisplay();
        checkEvents();
        if (remainingSeconds <= 0) {
          pause();
          refreshPersistent();
          triggerZero();
        }
      }
    } else {
      // cuenta ascendente
      elapsed++;
      updateDisplay();
      checkEvents();
    }
  }
  function start() {
    if (running) return;
    running = true;
    // Inicializa cuenta regresiva si es necesario
    if (mode === "countdown" && initialSeconds === 0 && remainingSeconds === 0) {
      initialSeconds = parseDuration(durationInput.value) || 0;
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
    if (mode==="countdown") {
      initialSeconds = parseDuration(durationInput.value) || 0;
      remainingSeconds = initialSeconds;
    } else {
      remainingSeconds = 0;
    }
    activeEvents = [];
    eventButtons.forEach(b => b.classList.remove("active"));
    clearStatus();
    logList.innerHTML = "";
    updateDisplay();
    addLog("Timer reseteado");
  }

  // Activación/Desactivación de eventos
  function activateEvent(type) {
    const idx = activeEvents.indexOf(type);
    if (idx !== -1) {
      // Desactivar evento
      activeEvents.splice(idx, 1);
      addLog(`Evento desactivado: ${type}`);
      refreshPersistent();
      document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.remove("active"));
      return;
    }
    // Activar evento
    if (type === "paro") {
      const userInput = prompt("Duración del paro (MM:SS o min)", "10");
      const sec = parseDuration(userInput);
      if (!sec) { alert("Duración inválida. Paro cancelado."); return; }
      modeSelect.value = "countdown";
      mode = "countdown";
      initialSeconds = sec;
      remainingSeconds = sec;
      elapsed = 0;
      addLog(`Paro activado (${formatTime(sec)})`);
      setPersistent("paro");
      if (!running) start();
    } else if (type === "rcp") {
      addLog("Ciclos RCP activados");
      activeEvents.push("rcp");
      document.querySelectorAll(`[data-event="rcp"]`).forEach(b => b.classList.add("active"));
      if (!running) start();
    } else if (type === "epi") {
      const userI = prompt("Intervalo Epinefrina (segundos)", "180");
      const val = parseInt(userI,10);
      if (!isNaN(val) && val>0) epiInterval = val;
      addLog(`Epinefrina activada (cada ${epiInterval}s)`);
      activeEvents.push("epi");
      document.querySelectorAll(`[data-event="epi"]`).forEach(b => b.classList.add("active"));
    } else if (type === "defib") {
      addLog("Desfibrilación: presionar Shock");
      display.classList.add("timer-status-yellow");
      if (soundEnabled) beep(900, 0.12);
      setTimeout(refreshPersistent, 2500);
    }
    if (type !== "paro") {
      document.querySelectorAll(`[data-event="${type}"]`).forEach(b => b.classList.add("active"));
    }
    refreshPersistent();
  }

  // Asignar eventos a botones
  modeSelect.addEventListener("change", () => {
    mode = modeSelect.value;
    addLog(`Modo: ${mode}`);
    if (mode === "countdown") {
      initialSeconds = parseDuration(durationInput.value) || initialSeconds;
      remainingSeconds = initialSeconds;
    }
    updateDisplay();
    refreshPersistent();
  });
  durationInput.addEventListener("change", () => {
    addLog(`Duración establecida: ${durationInput.value}`);
  });
  zeroMessageInput.addEventListener("change", () => {
    zeroMessage = zeroMessageInput.value || "Fin del tiempo";
    addLog(`Mensaje al 0: ${zeroMessage}`);
  });
  soundToggle.addEventListener("change", () => {
    soundEnabled = soundToggle.checked;
    addLog(`Sonido ${soundEnabled ? "ON" : "OFF"}`);
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
    const blob = new Blob([lines.join("\n")], {type: "text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mcme-log-${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    addLog("Log exportado");
  });

  eventButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-event");
      activateEvent(type);
    });
  });

  // Presets del sidebar
  function applyPreset(sec, message, status) {
    pause();
    elapsed = 0;
    initialSeconds = sec;
    remainingSeconds = sec;
    modeSelect.value = "countdown";
    mode = "countdown";
    updateDisplay();
    clearStatus();
    if (status) display.classList.add(status);
    addLog(message);
    if (!running) start();
  }
  document.getElementById("preset0").addEventListener("click", () => {
    applyPreset(0, "Inicio de RCP", null);
  });
  document.getElementById("preset120").addEventListener("click", () => {
    applyPreset(120, "2:00 min – Cambio compresor / chequeo", "timer-status-red");
  });
  document.getElementById("preset180").addEventListener("click", () => {
    applyPreset(180, "3:00 min – Administrar Epinefrina", "timer-status-orange");
  });
  document.getElementById("preset240").addEventListener("click", () => {
    applyPreset(240, "4:00 min – Revisión vía aérea", null);
  });
  document.getElementById("preset300").addEventListener("click", () => {
    applyPreset(300, "5:00 min – 2ª Epinefrina", "timer-status-orange");
  });
  document.getElementById("preset420").addEventListener("click", () => {
    applyPreset(420, "7:00 min – Preparar próximo shock", null);
  });
  document.getElementById("preset480").addEventListener("click", () => {
    applyPreset(480, "8:00 min – 3ª Epinefrina", "timer-status-orange");
  });
  document.getElementById("preset600").addEventListener("click", () => {
    applyPreset(600, "10:00 min – Considerar intubación", null);
  });
  document.getElementById("preset900").addEventListener("click", () => {
    applyPreset(900, "15:00 min – Informe al equipo", null);
  });
  document.getElementById("preset1800").addEventListener("click", () => {
    applyPreset(1800, "30:00 min – Tiempo crítico", null);
  });

  // Mostrar tiempo inicial
  updateDisplay();

  /* ===============================
     Información de usuario + logout
  =============================== */
  const userSpan = document.querySelector("#app-header .header-right span");
  const logoutBtn = document.getElementById("logoutBtn");
  if (userSpan && user) userSpan.textContent = user.name || user.email;
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
});
