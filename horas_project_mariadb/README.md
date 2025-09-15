# Plataforma Carga de Horas (MariaDB + Docker)

## Requisitos
- Docker y Docker Compose instalados

## Pasos para ejecutar
1. Clonar/descomprimir proyecto
2. Crear contenedores:
   ```bash
   docker-compose up --build
   ```
3. Prisma aplicará migraciones, seed y el backend quedará en:
   - Backend/API: http://localhost:3000
   - Base de datos: mariadb://root:root@localhost:3306/horasdb

## Usuarios iniciales
- admin / 1234
- gerente / 1234
- juan.perez / 1234
