// app.js frontend (simplificado)
const API = "http://localhost:3000/api"
const app = document.getElementById('app')

function getToken(){ return localStorage.getItem('token') }
function getUser(){ return JSON.parse(localStorage.getItem('user') || 'null') }

function renderLogin(){
  app.innerHTML = `
    <h1>Iniciar sesión</h1>
    <form id="loginForm">
      <input id="username" placeholder="usuario" required />
      <input id="password" type="password" placeholder="contraseña" required />
      <button>Ingresar</button>
    </form>
    <div id="msg"></div>
  `
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault()
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    const res = await fetch(API+'/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) })
    const data = await res.json()
    if(res.ok){
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      renderApp()
    } else {
      document.getElementById('msg').innerText = data.error || 'Error'
    }
  })
}

async function fetchJSON(path, opts={}){
  const headers = opts.headers || {}
  const token = getToken()
  if(token) headers['Authorization'] = 'Bearer '+token
  const res = await fetch(API+path, {...opts, headers})
  if(res.status===401){ localStorage.clear(); renderLogin(); throw new Error('No autorizado') }
  const data = await res.json()
  if(!res.ok) throw new Error(data.error || 'Error')
  return data
}

async function renderApp(){
  const token = getToken()
  if(!token) return renderLogin()
  const user = getUser()
  try{
    const proyectos = await fetchJSON('/proyectos')
    app.innerHTML = `
      <h1>Timesheet - Bienvenido ${user.nombre || user.username}</h1>
      <div>
        <button id="logout">Cerrar sesión</button>
      </div>
      <section id="cargarHoras">
        <h2>Cargar horas</h2>
        <form id="formHoras">
          <label>Proyecto
            <select id="proyectoId">${proyectos.map(p=>`<option value="${p.id}">${p.code} - ${p.nombre}</option>`).join('')}</select>
          </label>
          <label>Fecha <input type="date" id="fecha" required /></label>
          <label>Horas <input type="number" step="0.25" id="horas" required /></label>
          <label>Descripción <input id="descripcion" /></label>
          <button>Guardar</button>
        </form>
        <div id="msgHoras"></div>
      </section>
      <section id="misHoras">
        <h2>Mis últimas cargas</h2>
        <ul id="listaHoras"></ul>
      </section>
    `

    document.getElementById('logout').addEventListener('click', ()=>{ localStorage.clear(); renderLogin() })

    document.getElementById('formHoras').addEventListener('submit', async (e)=>{
      e.preventDefault()
      const proyectoId = document.getElementById('proyectoId').value
      const fecha = document.getElementById('fecha').value
      const horas = document.getElementById('horas').value
      const descripcion = document.getElementById('descripcion').value
      try {
        await fetchJSON('/timesheets', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ proyectoId, fecha, horas, descripcion }) })
        document.getElementById('msgHoras').innerText = 'Horas guardadas ✅'
        loadMisHoras()
      } catch(err){
        document.getElementById('msgHoras').innerText = 'Error: '+err.message
      }
    })

    await loadMisHoras()
  } catch(e){
    console.error(e)
    renderLogin()
  }
}

async function loadMisHoras(){
  try {
    const ts = await fetchJSON('/timesheets')
    const ul = document.getElementById('listaHoras')
    ul.innerHTML = ts.map(t=>`<li>${new Date(t.fecha).toLocaleDateString()} - ${t.proyecto?.code || ''} ${t.proyecto?.nombre || ''} — ${t.horas}h — ${t.descripcion || ''}</li>`).join('')
  } catch(e){ console.error(e) }
}

renderLogin()
