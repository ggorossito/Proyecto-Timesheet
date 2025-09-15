const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function main(){
  const hashed = await bcrypt.hash("1234", 10)

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashed, rol: 'admin', nombre: 'Admin' }
  })

  const juan = await prisma.usuario.upsert({
    where: { username: 'juan' },
    update: {},
    create: { username: 'juan', password: hashed, rol: 'empleado', nombre: 'Juan Perez', email: 'juan@empresa.com' }
  })

  const ana = await prisma.usuario.upsert({
    where: { username: 'ana' },
    update: {},
    create: { username: 'ana', password: hashed, rol: 'empleado', nombre: 'Ana Gomez', email: 'ana@empresa.com' }
  })

  const p1 = await prisma.proyecto.upsert({
    where: { code: 'PROJ-001' },
    update: {},
    create: { code: 'PROJ-001', nombre: 'Portal Clientes', cliente: 'Cliente A' }
  })
  const p2 = await prisma.proyecto.upsert({
    where: { code: 'PROJ-002' },
    update: {},
    create: { code: 'PROJ-002', nombre: 'API Interna', cliente: 'Empresa X' }
  })

  await prisma.timesheet.createMany({
    data: [
      { fecha: new Date('2025-09-01T09:00:00Z'), horas: 4, descripcion: 'Desarrollo feature X', usuarioId: juan.id, proyectoId: p1.id },
      { fecha: new Date('2025-09-02T10:00:00Z'), horas: 3.5, descripcion: 'Bugfix y pruebas', usuarioId: juan.id, proyectoId: p2.id },
      { fecha: new Date('2025-09-03T08:30:00Z'), horas: 6, descripcion: 'Sprint planning', usuarioId: ana.id, proyectoId: p1.id }
    ]
  })

  console.log('Seed cargado ✅')
}

main().catch(e=>{
  console.error(e)
  process.exit(1)
}).finally(()=>prisma.$disconnect())
