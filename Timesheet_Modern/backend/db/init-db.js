const db = require('./db');
const bcrypt = require('bcrypt');

(async ()=>{
  db.serialize(async ()=>{
    db.run('PRAGMA foreign_keys = ON;');
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, project_id INTEGER NOT NULL, date TEXT NOT NULL, hours REAL NOT NULL, description TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(project_id) REFERENCES projects(id))`);

    const hash = await bcrypt.hash('1234', 10);
    db.get('SELECT COUNT(*) as c FROM users', (err,row)=>{
      if(row && row.c===0){
        db.run('INSERT INTO users (username,password,role) VALUES (?,?,?)', ['admin', hash, 'admin']);
        db.run('INSERT INTO users (username,password,role) VALUES (?,?,?)', ['empleado', hash, 'employee']);
        console.log('Demo users created');
      }
    });
    db.get('SELECT COUNT(*) as c FROM projects', (err,row)=>{
      if(row && row.c===0){
        db.run('INSERT INTO projects (name) VALUES (?)', ['Proyecto Web']);
        db.run('INSERT INTO projects (name) VALUES (?)', ['App Mobile']);
        console.log('Demo projects created.');
      }
    });
    console.log('DB init finished');
  });
})();