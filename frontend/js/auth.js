// auth.js — included in every protected page
(function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetch('/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        } else {
          return r.json();
        }
      })
      .then(data => {
        if (!data) return;
        const footer = document.querySelector('.sidebar-footer');
        if (!footer) return;

        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px';

        const userInfo = document.createElement('div');
        userInfo.style.cssText = 'display:flex;align-items:center;gap:6px;color:#64748b;font-size:12px';
        userInfo.innerHTML = `<i class="bi bi-person-circle" style="font-size:14px"></i><span>${data.username}</span>`;

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-ghost btn-sm';
        logoutBtn.style.cssText = 'width:100%;justify-content:flex-start;color:#ef4444;padding:6px 8px';
        logoutBtn.innerHTML = '<i class="bi bi-box-arrow-left"></i> Logout';
        logoutBtn.addEventListener('click', logout);

        wrap.appendChild(userInfo);
        wrap.appendChild(logoutBtn);
        footer.innerHTML = '';
        footer.appendChild(wrap);
      });
  });
})();

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
