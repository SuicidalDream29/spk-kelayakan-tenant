// auth.js — included in every protected page
(function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Inject logout button into sidebar footer
  document.addEventListener('DOMContentLoaded', () => {
    // Verify token still valid
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
        if (footer) {
          footer.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;align-items:center;gap:6px;color:#64748b;font-size:12px">
                <i class="bi bi-person-circle" style="font-size:14px"></i>
                <span>${data.username}</span>
              </div>
              <button onclick="logout()" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;color:#ef4444;padding:6px 8px">
                <i class="bi bi-box-arrow-left"></i> Logout
              </button>
            </div>`;
        }
      });
  });
})();

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
