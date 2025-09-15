const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const path = require('path')

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())
app.use('/public', express.static(path.join(__dirname, '..', 'public')))

const SECRET = process.env.JWT_SECRET || 'clave-muy-secreta'

function sign(user){ return jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '8h' }) }
async function authMiddleware(req,res,next){
  const h = req.headers.authorization; if(!h) return res.status(401).json({error:'No token'})
  const token = h.split(' ')[1]
  try { const payload = jwt.verify(token, SECRET); req.user = await prisma.usuario.findUnique({ where: { id: payload.id } }); if(!req.user) return res.status(401).json({ error: 'Usuario no encontrado' }); next() } catch(e){ return res.status(401).json({ error: 'Token inválido' }) }
}

app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body
  const u = await prisma.usuario.findUnique({ where: { username } })
  if(!u) return res.status(401).json({ error: 'Usuario no encontrado' })
  const ok = await bcrypt.compare(password, u.password)
  if(!ok) return res.status(401).json({ error: 'Contraseña incorrecta' })
  const token = sign(u); const { password: p, ...userSafe } = u; res.json({ token, user: userSafe })
})

app.get('/api/proyectos', authMiddleware, async (req,res)=>{
  const proyectos = await prisma.proyecto.findMany()
  res.json(proyectos)
})
app.post('/api/proyectos', authMiddleware, async (req,res)=>{
  if(!['admin','gerente'].includes(req.user.rol)) return res.status(403).json({ error: 'No autorizado' })
  const { nombre, descripcion, cliente } = req.body
  const creado = await prisma.proyecto.create({ data: { nombre, descripcion, cliente } })
  res.json(creado)
})

app.post('/api/horas', authMiddleware, async (req,res)=>{
  const { proyectoId, fecha, cantidad, descripcion } = req.body
  if(!proyectoId || !cantidad || !fecha) return res.status(400).json({ error: 'Faltan campos' })
  const proyecto = await prisma.proyecto.findUnique({ where: { id: Number(proyectoId) } })
  if(!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' })
  const h = await prisma.hora.create({ data: {
    usuarioId: req.user.id,
    proyectoId: proyecto.id,
    fecha: new Date(fecha),
    cantidad: Number(cantidad),
    descripcion
  }})
  res.json(h)
})

app.get('/api/horas', authMiddleware, async (req,res)=>{
  const user = req.user
  if(['admin','gerente'].includes(user.rol)){
    const horas = await prisma.hora.findMany({ include: { usuario:true, proyecto:true }, orderBy: { fecha: 'desc' } })
    return res.json(horas)
  }
  const horas = await prisma.hora.findMany({ where: { usuarioId: user.id }, include: { proyecto:true }, orderBy: { fecha: 'desc' } })
  res.json(horas)
})

app.get('/api/proyectos/:id/metricas', authMiddleware, async (req,res)=>{
  const id = Number(req.params.id)
  const proyecto = await prisma.proyecto.findUnique({ where: { id } })
  if(!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' })
  const total = await prisma.hora.aggregate({ where: { proyectoId: id }, _sum: { cantidad: true } })
  const porUsuario = await prisma.hora.groupBy({
    by: ['usuarioId'],
    where: { proyectoId: id },
    _sum: { cantidad: true },
  })
  const detalles = await Promise.all(porUsuario.map(async p=>{
    const u = await prisma.usuario.findUnique({ where: { id: p.usuarioId } })
    return { usuarioId: p.usuarioId, username: u.username, nombre: u.nombre, horas: p._sum.cantidad || 0 }
  }))
  res.json({ proyecto, totalHoras: total._sum.cantidad || 0, porUsuario: detalles })
})

app.get('/', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', 'index.html')))

const PORT = process.env.PORT || 3000; app.listen(PORT, ()=> console.log(`✅ Backend corriendo en http://localhost:${PORT}`))
