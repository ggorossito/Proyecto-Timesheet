const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())

const SECRET = process.env.JWT_SECRET || 'clave-muy-secreta'

function sign(user){ return jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '8h' }) }
async function authMiddleware(req,res,next){
  const h = req.headers.authorization; if(!h) return res.status(401).json({error:'No token'})
  const token = h.split(' ')[1]
  try {
    const payload = jwt.verify(token, SECRET)
    const u = await prisma.usuario.findUnique({ where: { id: payload.id }})
    if(!u) return res.status(401).json({ error: 'Usuario no encontrado' })
    req.user = u
    next()
  } catch(e){
    return res.status(401).json({ error: 'Token inválido' })
  }
}

app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body
  if(!username || !password) return res.status(400).json({ error: 'Faltan credenciales' })
  const u = await prisma.usuario.findUnique({ where: { username } })
  if(!u) return res.status(401).json({ error: 'Usuario no encontrado' })
  const ok = await bcrypt.compare(password, u.password)
  if(!ok) return res.status(401).json({ error: 'Contraseña incorrecta' })
  const token = sign(u)
  const { password: p, ...userSafe } = u
  res.json({ token, user: userSafe })
})

app.get('/api/proyectos', authMiddleware, async (req,res)=>{
  const proyectos = await prisma.proyecto.findMany()
  res.json(proyectos)
})

app.post('/api/proyectos', authMiddleware, async (req,res)=>{
  if(req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' })
  const { code, nombre, cliente } = req.body
  if(!code || !nombre) return res.status(400).json({ error: 'Faltan datos' })
  try {
    const p = await prisma.proyecto.create({ data: { code, nombre, cliente } })
    res.json(p)
  } catch(e){
    res.status(400).json({ error: 'Error creando proyecto', details: e.message })
  }
})

app.post('/api/timesheets', authMiddleware, async (req,res)=>{
  const { fecha, horas, descripcion, proyectoId, usuarioId } = req.body
  let uid = req.user.id
  if(usuarioId){
    if(req.user.rol !== 'admin') return res.status(403).json({ error: 'No autorizado para cargar por otro usuario' })
    uid = usuarioId
  }
  if(!fecha || !horas || !proyectoId) return res.status(400).json({ error: 'Faltan datos: fecha, horas, proyectoId' })
  try{
    const ts = await prisma.timesheet.create({
      data: {
        fecha: new Date(fecha),
        horas: Number(horas),
        descripcion,
        usuarioId: uid,
        proyectoId: Number(proyectoId)
      }
    })
    res.json(ts)
  } catch(e){
    res.status(400).json({ error: 'Error creando timesheet', details: e.message })
  }
})

app.get('/api/timesheets', authMiddleware, async (req,res)=>{
  const { from, to } = req.query
  const where = {}
  if(req.user.rol !== 'admin') where.usuarioId = req.user.id
  if(from || to) {
    where.fecha = {}
    if(from) where.fecha.gte = new Date(from)
    if(to) where.fecha.lte = new Date(to)
  }
  const ts = await prisma.timesheet.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: { proyecto: true, usuario: { select: { id:true, username:true, nombre:true } } }
  })
  res.json(ts)
})

app.get('/api/metrics/project-hours', authMiddleware, async (req,res)=>{
  const { from, to } = req.query
  const where = {}
  if(from || to){
    where.fecha = {}
    if(from) where.fecha.gte = new Date(from)
    if(to) where.fecha.lte = new Date(to)
  }

  const grouped = await prisma.timesheet.groupBy({
    by: ['proyectoId'],
    where,
    _sum: { horas: true },
  })

  const results = await Promise.all(grouped.map(async g=>{
    const proyecto = await prisma.proyecto.findUnique({ where: { id: g.proyectoId }})
    return {
      proyectoId: g.proyectoId,
      proyectoCode: proyecto?.code || null,
      proyectoNombre: proyecto?.nombre || null,
      horasTotales: g._sum.horas || 0
    }
  }))

  res.json(results)
})

app.get('/', (req,res)=> res.send('Backend timesheet funcionando.'))

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log(`✅ Backend corriendo en http://localhost:${PORT}`))
