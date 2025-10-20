(async ()=>{
  const token = localStorage.getItem('token');
  if(!token){ window.location.href = '/'; return; }
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('userName').textContent = user.username;

  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  // load projects
  const projectsRes = await fetch('/api/projects', { headers });
  const projects = await projectsRes.json();
  const sel = document.getElementById('projectSelect');
  projects.forEach(p => { const o = document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); });

  // kpis placeholder
  const kpis = document.getElementById('kpis');
  kpis.innerHTML = '<div class="kpi"><strong id="totalHours">0</strong><div class="muted">Horas totales</div></div><div class="kpi"><strong id="projectsCount">0</strong><div class="muted">Proyectos</div></div>';

  async function loadEntries(){
    const res = await fetch('/api/entries', { headers });
    const rows = await res.json();
    const tbody = document.querySelector('#entriesTable tbody');
    tbody.innerHTML='';
    let total=0;
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.project}</td><td>${r.hours}</td><td>${r.user}</td>`;
      tbody.appendChild(tr);
      total += Number(r.hours);
    });
    document.getElementById('totalHours').textContent = total;
    document.getElementById('projectsCount').textContent = new Set(rows.map(x=>x.project)).size;
    if(user.role === 'admin'){ document.getElementById('adminPanel').style.display='block'; }
  }

  document.getElementById('saveBtn').addEventListener('click', async ()=>{
    const project_id = document.getElementById('projectSelect').value;
    const date = document.getElementById('dateInput').value;
    const hours = document.getElementById('hoursInput').value;
    const description = document.getElementById('descInput').value;
    if(!project_id||!date||!hours){ alert('Completá los campos'); return; }
    await fetch('/api/entries', { method:'POST', headers, body: JSON.stringify({ project_id, date, hours, description }) });
    await loadEntries();
  });

  document.getElementById('addProject').addEventListener('click', async ()=>{
    const name = document.getElementById('newProject').value.trim();
    if(!name) return;
    await fetch('/api/projects', { method:'POST', headers, body: JSON.stringify({ name }) });
    document.getElementById('newProject').value='';
    // reload projects
    const projectsRes2 = await fetch('/api/projects', { headers });
    const projects2 = await projectsRes2.json();
    const sel2 = document.getElementById('projectSelect');
    sel2.innerHTML=''; projects2.forEach(p => { const o = document.createElement('option'); o.value=p.id; o.textContent=p.name; sel2.appendChild(o); });
  });

  document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='/'; });

  await loadEntries();
})();
