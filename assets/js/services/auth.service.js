// assets/js/services/auth.service.js

export function isAuthenticated() {
  const user = localStorage.getItem("user");
  return !!user;
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
