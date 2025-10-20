document.getElementById('btnLogin').addEventListener('click', async () => {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');
  msg.textContent='';
  if(!u||!p){ msg.textContent='Completá usuario y contraseña'; return; }
  try{
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: u, password: p }) });
    if(!res.ok){ const e = await res.json(); msg.textContent = e.error || 'Error'; return; }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch(err){
    msg.textContent = 'Error de conexión';
  }
});
