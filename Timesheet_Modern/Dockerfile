FROM node:18-alpine
WORKDIR /app
# copy backend and frontend
COPY backend ./backend
COPY frontend ./frontend
WORKDIR /app/backend
RUN npm install --production
WORKDIR /app
CMD ["sh", "-c", "node backend/db/init-db.js && node backend/server.js"]
EXPOSE 3000
