const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const COOKIE_NAME = process.env.COOKIE_NAME || 'ts_token';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
function verify(token){ try{ return jwt.verify(token, JWT_SECRET); } catch(e){ return null; } }
function getUser(req){ const t = req.cookies[COOKIE_NAME]; return t ? verify(t) : null; }
function auth(req,res,next){ const u = getUser(req); if(!u) return res.status(401).json({ error:'unauthorized' }); req.user = u; next(); }
function adminOnly(req,res,next){ if(req.user.role !== 'admin') return res.status(403).json({ error:'forbidden' }); next(); }
// projects
router.get('/projects', auth, (req,res)=>{ db.all('SELECT id,name FROM projects ORDER BY id DESC', [], (err,rows)=>{ if(err) return res.status(500).json({ error:'db' }); res.json(rows); }); });
router.post('/projects', auth, adminOnly, (req,res)=>{ const { name } = req.body; db.run('INSERT INTO projects (name) VALUES (?)', [name], function(err){ if(err) return res.status(500).json({ error:'db' }); res.json({ id: this.lastID, name }); }); });
// users
router.get('/users', auth, adminOnly, (req,res)=>{ db.all('SELECT id,name,email,role FROM users ORDER BY id DESC', [], (err,rows)=>{ if(err) return res.status(500).json({ error:'db' }); res.json(rows); }); });
router.post('/users', auth, adminOnly, async (req,res)=>{ const { name, email, pass, role } = req.body; const bcrypt = require('bcrypt'); const hash = await bcrypt.hash(pass, 10); db.run('INSERT INTO users (name,email,pass,role) VALUES (?,?,?,?)', [name,email,hash,role], function(err){ if(err) return res.status(500).json({ error:'db' }); res.json({ id: this.lastID, name, email, role }); }); });
// times
router.get('/times', auth, (req,res)=>{
  if(req.user.role === 'admin'){
    const q = `SELECT t.*, u.name as userName, p.name as projectName FROM times t JOIN users u ON u.id=t.userId JOIN projects p ON p.id=t.projectId ORDER BY date DESC`;
    db.all(q, [], (err,rows)=>{ if(err) return res.status(500).json({ error:'db' }); res.json(rows); });
  } else {
    const q = `SELECT t.*, u.name as userName, p.name as projectName FROM times t JOIN users u ON u.id=t.userId JOIN projects p ON p.id=t.projectId WHERE userId=? ORDER BY date DESC`;
    db.all(q, [req.user.id], (err,rows)=>{ if(err) return res.status(500).json({ error:'db' }); res.json(rows); });
  }
});
router.post('/times', auth, (req,res)=>{ const { userId, projectId, date, hours, description } = req.body; if(req.user.role !== 'admin' && req.user.id !== Number(userId)) return res.status(403).json({ error:'forbidden' }); db.run('INSERT INTO times (userId,projectId,date,hours,description) VALUES (?,?,?,?,?)', [userId,projectId,date,hours,description], function(err){ if(err) return res.status(500).json({ error:'db' }); res.json({ id: this.lastID }); }); });
router.put('/times/:id', auth, (req,res)=>{ const id = Number(req.params.id); const { userId, projectId, date, hours, description } = req.body; db.get('SELECT userId FROM times WHERE id=?', [id], (err,row)=>{ if(err) return res.status(500).json({ error:'db' }); if(!row) return res.status(404).json({ error:'notfound' }); if(req.user.role !== 'admin' && req.user.id !== row.userId) return res.status(403).json({ error:'forbidden' }); db.run('UPDATE times SET userId=?,projectId=?,date=?,hours=?,description=? WHERE id=?', [userId,projectId,date,hours,description,id], function(err){ if(err) return res.status(500).json({ error:'db' }); res.json({ ok:true }); }); }); });
router.delete('/times/:id', auth, (req,res)=>{ const id = Number(req.params.id); db.get('SELECT userId FROM times WHERE id=?', [id], (err,row)=>{ if(err) return res.status(500).json({ error:'db' }); if(!row) return res.status(404).json({ error:'notfound' }); if(req.user.role !== 'admin' && req.user.id !== row.userId) return res.status(403).json({ error:'forbidden' }); db.run('DELETE FROM times WHERE id=?', [id], function(err){ if(err) return res.status(500).json({ error:'db' }); res.json({ ok:true }); }); }); });
router.get('/reports/summary', auth, (req,res)=>{ const q1 = `SELECT p.name as project, SUM(t.hours) as totalHours FROM times t JOIN projects p ON p.id=t.projectId GROUP BY p.id`; const q2 = `SELECT u.name as user, SUM(t.hours) as totalHours FROM times t JOIN users u ON u.id=t.userId GROUP BY u.id`; db.all(q1, [], (err,proj)=>{ if(err) return res.status(500).json({ error:'db' }); db.all(q2, [], (err2,users)=>{ if(err2) return res.status(500).json({ error:'db' }); res.json({ projects: proj, users: users }); }); }); });
module.exports = router;
