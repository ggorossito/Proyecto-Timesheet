const db = require('./db');
const bcrypt = require('bcrypt');
db.serialize(async ()=>{
  db.run('PRAGMA foreign_keys = ON;');
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee')`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS times (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, projectId INTEGER NOT NULL, date TEXT NOT NULL, hours REAL NOT NULL, description TEXT, FOREIGN KEY(userId) REFERENCES users(id), FOREIGN KEY(projectId) REFERENCES projects(id))`);
  const adminHash = await bcrypt.hash('admin', 10);
  const empHash = await bcrypt.hash('employee', 10);
  db.run("INSERT OR IGNORE INTO users (id,name,email,pass,role) VALUES (1,'Admin','admin@company',?, 'admin')", [adminHash]);
  db.run("INSERT OR IGNORE INTO users (id,name,email,pass,role) VALUES (2,'Empleado','empleado@company',?, 'employee')", [empHash]);
  console.log('Seed completed. Admin: admin@company / admin');
  db.close();
});
