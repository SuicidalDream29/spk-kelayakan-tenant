if (localStorage.getItem('token')) window.location.href = '/';

document.getElementById('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('btnLogin');
  const errBox = document.getElementById('loginError');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Masuk...';
  errBox.classList.remove('show');

  const body = new URLSearchParams({
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
  });

  try {
    const res = await fetch('/auth/login', { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login gagal');
    localStorage.setItem('token', data.access_token);
    window.location.href = '/';
  } catch(err) {
    document.getElementById('errorMsg').textContent = err.message;
    errBox.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk';
  }
});
