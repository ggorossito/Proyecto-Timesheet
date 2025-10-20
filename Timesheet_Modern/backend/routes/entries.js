const express = require('express');
const router = express.Router();
const db = require('../db/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({ error:'No token' });
  const token = h.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; next();
  } catch(e){ return res.status(401).json({ error:'Invalid token' }); }
}

router.get('/', auth, (req,res)=>{
  if(req.user.role === 'admin'){
    db.all('SELECT e.*, u.username as user, p.name as project FROM entries e JOIN users u ON e.user_id=u.id JOIN projects p ON e.project_id=p.id ORDER BY date DESC', [], (err, rows) => {
      if(err) return res.status(500).json({ error:'DB error' });
      res.json(rows);
    });
  } else {
    db.all('SELECT e.*, u.username as user, p.name as project FROM entries e JOIN users u ON e.user_id=u.id JOIN projects p ON e.project_id=p.id WHERE e.user_id=? ORDER BY date DESC', [req.user.id], (err, rows) => {
      if(err) return res.status(500).json({ error:'DB error' });
      res.json(rows);
    });
  }
});

router.post('/', auth, (req,res)=>{
  const { project_id, date, hours, description } = req.body;
  if(!project_id || !date || !hours) return res.status(400).json({ error:'Missing fields' });
  db.run('INSERT INTO entries (user_id, project_id, date, hours, description) VALUES (?,?,?,?,?)', [req.user.id, project_id, date, hours, description||''], function(err){
    if(err) return res.status(500).json({ error:'DB error' });
    res.json({ id:this.lastID });
  });
});

module.exports = router;
