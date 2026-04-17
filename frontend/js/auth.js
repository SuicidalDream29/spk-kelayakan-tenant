(function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Decode JWT payload locally — no network call needed for username display
  function decodeJWT(t) {
    try {
      const payload = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch { return null; }
  }

  // Show logout button immediately using local JWT data
  document.addEventListener('DOMContentLoaded', () => {
    const payload  = decodeJWT(token);
    const username = payload?.sub || 'Admin';

    const footer = document.querySelector('.sidebar-footer');
    if (footer) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px';

      const userInfo = document.createElement('div');
      userInfo.style.cssText = 'display:flex;align-items:center;gap:6px;color:#64748b;font-size:12px';
      userInfo.innerHTML = `<i class="bi bi-person-circle" style="font-size:14px"></i><span>${username}</span>`;

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn btn-ghost btn-sm';
      logoutBtn.style.cssText = 'width:100%;justify-content:flex-start;color:#ef4444;padding:6px 8px';
      logoutBtn.innerHTML = '<i class="bi bi-box-arrow-left"></i> Logout';
      logoutBtn.addEventListener('click', logout);

      wrap.appendChild(userInfo);
      wrap.appendChild(logoutBtn);
      footer.innerHTML = '';
      footer.appendChild(wrap);
    }

    // Background token verification — only redirect on 401, no UI dependency
    fetch('/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => { if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/login.html'; } })
      .catch(() => { /* network error — keep user on page, token may still be valid */ });
  });
})();

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
