const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('1234', 10)
  await prisma.usuario.createMany({
    data: [
      { username: 'admin', password: hashed, rol: 'admin', nombre: 'Administrador' },
      { username: 'gerente', password: hashed, rol: 'gerente', nombre: 'Gerente' },
      { username: 'juan.perez', password: hashed, rol: 'empleado', nombre: 'Juan Perez' }
    ]
  })

  await prisma.proyecto.createMany({
    data: [
      { nombre: 'Proyecto Alpha', descripcion: 'Implementación módulo A', cliente: 'Cliente X' },
      { nombre: 'Proyecto Beta', descripcion: 'Soporte y mejoras', cliente: 'Cliente Y' }
    ]
  })

  const usuario = await prisma.usuario.findUnique({ where: { username: 'juan.perez' } })
  const proyecto = await prisma.proyecto.findFirst()
  if(usuario && proyecto){
    await prisma.hora.create({
      data: {
        usuarioId: usuario.id,
        proyectoId: proyecto.id,
        fecha: new Date(),
        cantidad: 3.5,
        descripcion: 'Análisis y diseño'
      }
    })
  }

  console.log('Seed cargado ✅')
}

main().catch(e=>{ console.error(e); process.exit(1)}).finally(()=>prisma.$disconnect())
