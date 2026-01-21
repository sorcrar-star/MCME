// assets/js/components/header.component.js
import { logout, getCurrentUser } from "../services/auth.service.js";

export function renderHeader() {
  const header = document.getElementById("app-header");
  if (!header) return;

  const user = getCurrentUser();

  header.innerHTML = `
    <div class="header-left">
      <img
        src="assets/images/mcme-logo.svg"
        alt="MCME"
        class="app-logo"
      />
    </div>

    <div class="header-right">
      ${
        user
          ? `
            <span class="user-email">${user.email}</span>
            <button id="logoutBtn">Cerrar sesión</button>
          `
          : ""
      }
    </div>
  `;

  const btn = document.getElementById("logoutBtn");
  if (btn) {
    btn.addEventListener("click", logout);
  }
}
