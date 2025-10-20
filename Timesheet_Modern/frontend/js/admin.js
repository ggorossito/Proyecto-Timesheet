(async ()=>{
  const token = localStorage.getItem('token');
  if(!token){ window.location.href = '/'; return; }
  const headers = { 'Authorization': 'Bearer ' + token };
  const res = await fetch('/api/entries', { headers });
  const rows = await res.json();
  const tbody = document.querySelector('#allEntries tbody');
  tbody.innerHTML='';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.user}</td><td>${r.project}</td><td>${r.date}</td><td>${r.hours}</td><td>${r.description||''}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='/'; });
})();
