// SPA frontend mejorado: mantiene estado al cambiar de sección, guarda en backend y actualiza UI.
const API = '/api';
const AUTH = '/api/auth';

// Estado local
const state = {
  user: null,
  projects: [],
  users: [],
  times: [], // list of time records
  view: 'times'
};

// Helpers
function el(q){ return document.querySelector(q); }
function fmtDate(d){ if(!d) return ''; const dt=new Date(d); return dt.toLocaleDateString(); }

// Auth
async function fetchMe(){ try{ const r = await fetch(AUTH + '/me', { credentials:'include' }); if(!r.ok) return null; const j=await r.json(); return j.user;}catch(e){return null;} }

async function loadInitialData(){
  const me = await fetchMe();
  state.user = me;
  renderAuth();
  await loadProjects();
  await loadUsers();
  await loadTimes();
  renderView(state.view);
}

async function loadProjects(){
  try{
    const r = await fetch(API + '/projects', { credentials:'include' });
    if(r.ok) state.projects = await r.json();
    else state.projects = [];
  }catch(e){ state.projects = []; }
}

async function loadUsers(){
  try{
    const r = await fetch(API + '/users', { credentials:'include' });
    if(r.ok) state.users = await r.json();
    else {
      // if not admin, at least include self
      if(state.user) state.users = [{ id: state.user.id, name: state.user.name }];
      else state.users = [];
    }
  }catch(e){ state.users = state.user ? [{ id: state.user.id, name: state.user.name }] : []; }
}

async function loadTimes(){
  try{
    const r = await fetch(API + '/times', { credentials:'include' });
    if(r.ok) state.times = await r.json();
    else state.times = [];
  }catch(e){ state.times = []; }
}

// Renderers
function renderAuth(){
  const auth = el('#authControls');
  const userInfo = el('#userInfo');
  if(state.user){
    auth.innerHTML = `<div class="login-row"><span class="muted">${state.user.name}</span><button id="logoutBtn" class="btn" style="background:#ef4444">Cerrar</button></div>`;
    userInfo.textContent = state.user.email || state.user.name;
    document.getElementById('logoutBtn').onclick = async ()=>{ await fetch(AUTH + '/logout', { method:'POST', credentials:'include' }); location.reload(); }
  } else {
    auth.innerHTML = `<div class="login-row"><button id="openLogin" class="btn">Iniciar sesión</button></div>`;
    userInfo.textContent = 'No conectado';
    document.getElementById('openLogin').onclick = ()=> openLogin();
  }
}

function openLogin(){
  const email = prompt('Email','admin@company');
  if(!email) return;
  const pass = prompt('Contraseña','admin');
  if(!pass) return;
  fetch(AUTH + '/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, pass }), credentials:'include' })
    .then(r=>{ if(!r.ok) throw new Error('login failed'); return r.json(); })
    .then(()=> location.reload())
    .catch(()=> alert('Login falló'));
}

// Menu
document.getElementById('menu').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  const view = btn.dataset.view;
  state.view = view;
  document.querySelectorAll('#menu button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderView(view);
});

function renderView(view){
  const title = document.getElementById('pageTitle');
  const content = document.getElementById('contentArea');
  title.textContent = view === 'times' ? 'Horas' : view === 'new' ? 'Nuevo registro' : view === 'reports' ? 'Reportes' : 'Usuarios';
  content.innerHTML = '';
  if(view === 'times') renderTimes(content);
  else if(view === 'new') renderNew(content);
  else if(view === 'reports') renderReports(content);
  else if(view === 'users') renderUsers(content);
}

// Times view
function renderTimes(container){
  const tpl = document.getElementById('timesTpl');
  container.appendChild(tpl.content.cloneNode(true));
  // fill selects
  const fastUser = el('#fastUser');
  const fastProject = el('#fastProject');
  const newUser = el('#newUser');
  const newProject = el('#newProject');
  [fastUser, newUser].forEach(s=>{ if(!s) return; s.innerHTML = ''; state.users.forEach(u=> s.insertAdjacentHTML('beforeend', `<option value="${u.id}">${u.name}</option>`)); });
  [fastProject, newProject].forEach(s=>{ if(!s) return; s.innerHTML = '<option value="">-- seleccioná --</option>'; state.projects.forEach(p=> s.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`)); });

  // populate list (keeps state.times so data persists when switching)
  const list = el('#timesList');
  list.innerHTML = '';
  state.times.forEach(t=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div><strong>${t.projectName || t.project || 'Proyecto'}</strong><div class="muted">${t.userName || t.user}</div></div>
                     <div style="text-align:right"><div>${t.hours} h</div><div class="muted">${t.date}</div></div>`;
    list.appendChild(div);
  });
  el('#timesCount').textContent = state.times.length + ' registros';

  // fast save handlers
  el('#saveFast').onclick = async ()=>{
    const payload = {
      userId: Number(el('#fastUser').value) || (state.user && state.user.id),
      projectId: Number(el('#fastProject').value),
      date: el('#fastDate').value,
      hours: Number(el('#fastHours').value),
      description: el('#fastDesc').value
    };
    if(!payload.projectId || !payload.date || !payload.hours){ alert('Completa proyecto, fecha y horas'); return; }
    // save to server
    try{
      const r = await fetch(API + '/times', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      if(!r.ok) throw new Error('save failed');
      const data = await r.json();
      // update local state by refetching times (keeps consistent)
      await loadTimes();
      renderView('times');
    }catch(e){ alert('Error guardando'); }
  };
  el('#clearFast').onclick = ()=>{ el('#fastDate').value=''; el('#fastHours').value=''; el('#fastDesc').value=''; };

}

// New entry view (detailed)
function renderNew(container){
  const tpl = document.getElementById('newTpl');
  container.appendChild(tpl.content.cloneNode(true));
  const newUser = el('#newUser');
  const newProject = el('#newProject');
  newUser.innerHTML = ''; newProject.innerHTML = '<option value="">-- seleccioná --</option>';
  state.users.forEach(u=> newUser.insertAdjacentHTML('beforeend', `<option value="${u.id}">${u.name}</option>`));
  state.projects.forEach(p=> newProject.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`));

  el('#saveNew').onclick = async ()=>{
    const payload = {
      userId: Number(el('#newUser').value),
      projectId: Number(el('#newProject').value),
      date: el('#newDate').value,
      hours: Number(el('#newHours').value),
      description: el('#newDesc').value
    };
    if(!payload.userId || !payload.projectId || !payload.date || !payload.hours){ alert('Completa todos los campos'); return; }
    try{
      const r = await fetch(API + '/times', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      if(!r.ok) throw new Error('save failed');
      await loadTimes();
      state.view = 'times';
      document.querySelector('#menu button[data-view="times"]').click();
    }catch(e){ alert('Error guardando'); }
  };
}

// Reports view
async function renderReports(container){
  const tpl = document.getElementById('reportsTpl');
  container.appendChild(tpl.content.cloneNode(true));
  // fetch reports from backend
  try{
    const r = await fetch(API + '/reports/summary', { credentials:'include' });
    if(!r.ok) throw new Error('no reports');
    const data = await r.json();
    // projects
    const projData = data.projects || [];
    const userData = data.users || [];
    renderChart('projChart', projData.map(p=>p.project), projData.map(p=>Number(p.totalHours || 0)));
    renderTable('projTable', ['Proyecto','Horas'], projData.map(p=>[p.project, p.totalHours]));
    renderChart('userChart', userData.map(u=>u.user), userData.map(u=>Number(u.totalHours || 0)));
    renderTable('userTable', ['Usuario','Horas'], userData.map(u=>[u.user, u.totalHours]));
  }catch(e){
    el('#projTable').textContent = 'No hay datos de reportes.';
    el('#userTable').textContent = 'No hay datos de reportes.';
  }
}

function renderTable(containerId, headers, rows){
  const ct = el('#'+containerId);
  ct.innerHTML = '';
  const table = document.createElement('table');
  table.style.width='100%';
  table.style.borderSpacing='0 6px';
  rows.forEach(r=>{
    const tr = document.createElement('div');
    tr.style.display='flex';
    tr.style.justifyContent='space-between';
    tr.style.padding='6px 0';
    tr.innerHTML = `<div>${r[0]}</div><div class="muted">${r[1]}</div>`;
    ct.appendChild(tr);
  });
}

function renderChart(canvasId, labels, values){
  const cnv = el('#'+canvasId);
  const ctx = cnv.getContext('2d');
  // clear
  cnv.width = cnv.clientWidth;
  cnv.height = 220;
  ctx.clearRect(0,0,cnv.width,cnv.height);
  const max = Math.max(...values, 1);
  const barW = Math.floor(cnv.width / Math.max(labels.length,1)) - 10;
  labels.forEach((lab,i)=>{
    const h = Math.round((values[i] / max) * (cnv.height - 40));
    const x = i * (barW + 10) + 20;
    const y = cnv.height - h - 20;
    ctx.fillStyle = '#2563eb';
    // rounded rect
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+barW, y, x+barW, y+r, r);
    ctx.arcTo(x+barW, y+h, x+barW-r, y+h, r);
    ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
    ctx.fill();
    // label
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px Inter, Arial';
    ctx.fillText(lab, x, cnv.height - 4);
  });
}

// Users view (simple list)
function renderUsers(container){
  const tpl = document.getElementById('usersTpl');
  container.appendChild(tpl.content.cloneNode(true));
  const list = el('#usersList');
  list.innerHTML = '';
  state.users.forEach(u=>{
    const d = document.createElement('div');
    d.className = 'item';
    d.textContent = u.name + ' (' + (u.email || 'sin email') + ')';
    list.appendChild(d);
  });
}

// Inicializar
loadInitialData();
