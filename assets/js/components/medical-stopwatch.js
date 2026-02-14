// assets/js/components/medical-stopwatch.js
// Cronómetro ACLS / BLS — UX refinado, sonidos por evento, presets y log.

(() => {
  // protección de ruta simple (mantenla si quieres)
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) {
    // Si no hay usuario, mantener comportamiento anterior:
    // window.location.href = "login.html";
    // Para desarrollo local puedes comentar la redirección.
  }

  document.addEventListener("DOMContentLoaded", () => {
    /* ======== Elementos ======== */
    const display = document.getElementById("timerDisplay");
    const modeSelect = document.getElementById("modeSelect");
    const durationInput = document.getElementById("durationInput");
    const zeroMessageInput = document.getElementById("zeroMessage");
    const soundToggle = document.getElementById("soundToggle");
    const themeToggle = document.getElementById("themeToggle");

    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const markBtn = document.getElementById("markBtn");
    const exportBtn = document.getElementById("exportLogBtn");

    const eventCards = Array.from(document.querySelectorAll(".btn-card"));
    const logList = document.getElementById("logList");
    const logCount = document.getElementById("logCount");

    /* ======== Estado ======== */
    let running = false;
    let timerId = null;
    let elapsed = 0;           // segundos transcurridos (siempre incrementa cuando corre)
    let remaining = 0;         // para countdown (segundos)
    let initialSeconds = 0;

    // eventos activos
    let active = {
      paro: false,
      rcp: false,
      epi: false,
      defib: false
    };

    // configurables
    let rcpCycle = 120;     // 2 min
    let epiInterval = 180;  // 3 min

    // persistencia UI
    const savePrefs = () => {
      try {
        localStorage.setItem("mcme_timer_sound", soundToggle.checked ? "1" : "0");
        localStorage.setItem("mcme_timer_theme_dark", document.body.classList.contains("dark") ? "1" : "0");
      } catch {}
    };
    // restore
    try {
      const s = localStorage.getItem("mcme_timer_sound");
      if (s !== null) soundToggle.checked = s === "1";
      const t = localStorage.getItem("mcme_timer_theme_dark");
      if (t === "1") document.body.classList.add("dark");
    } catch {}

    /* ======== Utilidades ======== */
    const clamp = (n) => Math.max(0, Math.floor(n));
    function fmt(sec) {
      sec = clamp(sec);
      const m = String(Math.floor(sec / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return `${m}:${s}`;
    }
    function nowTime() {
      const d = new Date();
      return d.toLocaleTimeString();
    }
    function beep(freq = 880, dur = 0.12) {
      if (!soundToggle.checked) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.value = 0.06;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, dur * 1000);
      } catch {}
    }

    function setDisplayClass(cls) {
      display.classList.remove("timer-status-red","timer-status-orange","timer-status-yellow","timer-flash");
      if (cls) display.classList.add(cls);
    }

    function refreshStatusVisual() {
      // Prioridad: paro > defib > epi > none
      if (active.paro) setDisplayClass("timer-status-red");
      else if (active.defib) setDisplayClass("timer-status-yellow");
      else if (active.epi) setDisplayClass("timer-status-orange");
      else setDisplayClass(null);
    }

    function addLog(text, type = "") {
      const li = document.createElement("li");
      li.className = "log-item";
      const tspan = document.createElement("div");
      tspan.className = "text";
      tspan.textContent = text;
      const timespan = document.createElement("div");
      timespan.className = "time";
      // show elapsed (H:MM:SS) or remaining if countdown mode
      const show = modeSelect.value === "countdown" ? fmt(remaining) : fmt(elapsed);
      timespan.textContent = `${show} • ${nowTime()}`;
      li.appendChild(tspan);
      li.appendChild(timespan);
      logList.prepend(li);
      updateLogCount();
    }

    function updateLogCount() {
      logCount.textContent = `${logList.children.length} eventos`;
    }

    /* ======== Timer core (tick) ======== */
    function tick() {
      if (modeSelect.value === "countdown") {
        if (remaining > 0) {
          remaining--;
          elapsed++;
          display.textContent = fmt(remaining);
          // check events using elapsed as timeline
          checkEventTriggers();
          if (remaining === 0) {
            stopTimer();
            // alerta personalizada
            addLog(`ALERTA: ${zeroMessageInput.value || "Tiempo finalizado"}`);
            beep(320, 0.35);
            setTimeout(() => beep(440, 0.12), 300);
            refreshStatusVisual();
          }
        }
      } else {
        elapsed++;
        display.textContent = fmt(elapsed);
        checkEventTriggers();
      }
    }

    function startTimer() {
      if (running) return;
      // initialize countdown
      if (modeSelect.value === "countdown" && remaining === 0) {
        const d = parseDurationInput(durationInput.value);
        if (d <= 0) {
          alert("Introduce duración válida (MM:SS o minutos).");
          return;
        }
        remaining = d;
        initialSeconds = d;
        display.textContent = fmt(remaining);
      }
      running = true;
      timerId = setInterval(tick, 1000);
      addLog("Timer iniciado");
    }
    function stopTimer() {
      running = false;
      clearInterval(timerId);
    }
    function pauseTimer() {
      if (!running) return;
      stopTimer();
      addLog("Timer pausado");
    }
    function resetTimer() {
      stopTimer();
      elapsed = 0;
      remaining = modeSelect.value === "countdown" ? parseDurationInput(durationInput.value) || 0 : 0;
      initialSeconds = remaining;
      active = {paro:false, rcp:false, epi:false, defib:false};
      eventCards.forEach(c => c.setAttribute("aria-pressed","false"));
      setDisplayClass(null);
      logList.innerHTML = "";
      updateLogCount();
      display.textContent = modeSelect.value === "countdown" ? fmt(remaining) : fmt(elapsed);
      addLog("Timer reseteado");
    }

    /* ======== Event triggers logic ======== */
    function checkEventTriggers() {
      // checks run every second while timer runs. Use elapsed as timeline reference.
      // RCP flash every rcpCycle seconds when active
      if (active.rcp && elapsed > 0 && elapsed % rcpCycle === 0) {
        // visual flash + beep + log
        display.classList.add("timer-flash");
        beep(600, 0.14);
        addLog("Cambio de ciclo: RCP (2 min)");
        setTimeout(() => { display.classList.remove("timer-flash"); refreshStatusVisual(); }, 900);
      }
      // Epinefrina reminders
      if (active.epi && elapsed > 0 && elapsed % epiInterval === 0) {
        addLog("Recordatorio: administrar Epinefrina");
        display.classList.add("timer-status-orange");
        beep(520, 0.12);
        setTimeout(refreshStatusVisual, 2500);
      }
    }

    /* ======== UI helpers ======== */
    function parseDurationInput(text) {
      if (!text) return 0;
      text = text.trim();
      if (/^\d+:\d{1,2}$/.test(text)) {
        const [m,s] = text.split(":").map(Number);
        return m*60 + s;
      }
      if (/^\d+$/.test(text)) {
        return Number(text)*60;
      }
      return 0;
    }
    function parseDurationInputSafe(text) {
      try { return parseDurationInput(text); } catch { return 0; }
    }

    /* ======== Event handlers for cards and buttons ======== */
    // Event cards (toggle)
    eventCards.forEach(card => {
      card.addEventListener("click", () => {
        const type = card.dataset.event;
        const pressed = card.getAttribute("aria-pressed") === "true";
        if (pressed) {
          // deactivate
          card.setAttribute("aria-pressed","false");
          active[type] = false;
          addLog(`Evento desactivado: ${type}`);
          refreshStatusVisual();
        } else {
          // activate (special handling)
          if (type === "paro") {
            // ask duration
            const u = prompt("Duración paro (MM:SS o minutos). Ej: 10 o 10:00", "10");
            const s = parseDurationInputSafe(u);
            if (s <= 0) { alert("Duración inválida"); return; }
            // set countdown
            modeSelect.value = "countdown";
            remaining = s;
            initialSeconds = s;
            elapsed = 0;
            display.textContent = fmt(remaining);
            active.paro = true;
            card.setAttribute("aria-pressed","true");
            addLog(`Paro activado: ${fmt(s)}`);
            setDisplayClass("timer-status-red");
            // start timer automatically
            if (!running) startTimer();
            beep(360,0.18);
            return;
          } else if (type === "rcp") {
            active.rcp = true;
            card.setAttribute("aria-pressed","true");
            addLog("Ciclos RCP activados (2 min)");
            // ensure timer running
            if (!running) startTimer();
            return;
          } else if (type === "epi") {
            const u = prompt("Intervalo Epinefrina en segundos (default 180)", "180");
            const v = parseInt(u,10);
            if (!isNaN(v) && v>0) epiInterval = v;
            active.epi = true;
            card.setAttribute("aria-pressed","true");
            addLog(`Epinefrina activada (cada ${epiInterval}s)`);
            if (!running) startTimer();
            return;
          } else if (type === "defib") {
            // manual mark: flash yellow + log
            addLog("Desfibrilación marcada");
            setDisplayClass("timer-status-yellow");
            beep(950,0.12);
            // visual briefly on card
            card.setAttribute("aria-pressed","true");
            setTimeout(() => { card.setAttribute("aria-pressed","false"); refreshStatusVisual(); }, 1400);
            return;
          }
        }
        // update display status for toggles not handled above
        card.setAttribute("aria-pressed", (!pressed).toString());
      });
    });

    /* ======== Presets (sidebar) ======== */
    function applyPreset(seconds, message, statusClass) {
      pauseTimer();
      elapsed = 0;
      remaining = seconds;
      initialSeconds = seconds;
      modeSelect.value = "countdown";
      display.textContent = fmt(remaining);
      // clear previous
      active = {paro:false, rcp:false, epi:false, defib:false};
      eventCards.forEach(c => c.setAttribute("aria-pressed","false"));
      setDisplayClass(null);
      if (statusClass) setDisplayClass(statusClass);
      addLog(message);
      // start timer automatically
      startTimer();
    }
    // wire presets
    const bindPreset = (id, s, msg, status) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", () => applyPreset(s, msg, status));
    };
    bindPreset("preset0", 0, "Inicio RCP (preset)", null);
    bindPreset("preset120", 120, "2:00 — Cambio compresor", "timer-status-red");
    bindPreset("preset180", 180, "3:00 — Administrar Epinefrina", "timer-status-orange");
    bindPreset("preset240", 240, "4:00 — Revisar vía aérea", null);
    bindPreset("preset300", 300, "5:00 — 2ª Epinefrina", "timer-status-orange");
    bindPreset("preset420", 420, "7:00 — Preparar Shock", null);
    bindPreset("preset480", 480, "8:00 — 3ª Epinefrina", "timer-status-orange");
    bindPreset("preset600", 600, "10:00 — Considerar intubación", null);
    bindPreset("preset900", 900, "15:00 — Informe equipo", null);
    bindPreset("preset1800", 1800, "30:00 — Tiempo crítico", "timer-status-red");

    /* ======== Button wiring ======== */
    startBtn.addEventListener("click", () => {
      startTimer();
    });
    pauseBtn.addEventListener("click", () => {
      pauseTimer();
      addLog("Pausado");
    });
    resetBtn.addEventListener("click", () => {
      resetTimer();
    });
    markBtn.addEventListener("click", () => {
      addLog("Marca manual");
      beep(720,0.08);
    });
    exportBtn.addEventListener("click", () => {
      // export logs
      const lines = Array.from(logList.children).map(li => `${li.querySelector(".time").textContent} — ${li.querySelector(".text").textContent}`);
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcme-codeblue-log-${new Date().toISOString().slice(0,19)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addLog("Registro exportado");
    });

    /* ======== Controls & toggles ======== */
    soundToggle.addEventListener("change", savePrefs);
    themeToggle && themeToggle.addEventListener("change", () => {
      document.body.classList.toggle("dark");
      savePrefs();
    });

    modeSelect.addEventListener("change", () => {
      // switching mode updates display values
      if (modeSelect.value === "countdown") {
        // try parse duration
        remaining = parseDurationInput(durationInput.value) || remaining || 0;
        display.textContent = fmt(remaining);
      } else {
        display.textContent = fmt(elapsed);
      }
      addLog(`Modo: ${modeSelect.value}`);
    });

    durationInput.addEventListener("change", () => {
      remaining = parseDurationInput(durationInput.value) || remaining;
      addLog(`Duración establecida: ${durationInput.value}`);
    });

    zeroMessageInput.addEventListener("change", () => {
      addLog(`Mensaje al 0 actualizado`);
    });

    /* ======== Startup UI values ======== */
    // set initial display
    display.textContent = fmt(0);

    // restore some last settings maybe
    updateInitial = () => {
      updateLogCount();
    };
    updateInitial();

    // helper parse duration available to other scopes
    function parseDurationInput(text) {
      if (!text) return 0;
      const t = text.trim();
      if (/^\d+:\d{1,2}$/.test(t)) {
        const [m,s] = t.split(":").map(Number);
        return m*60 + s;
      }
      if (/^\d+$/.test(t)) return Number(t)*60;
      return 0;
    }
  });
})();
