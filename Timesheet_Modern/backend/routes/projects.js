const express = require('express');
const router = express.Router();
const db = require('../db/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({ error:'No token' });
  const token = h.split(' ')[1];
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); } catch (e){ return res.status(401).json({ error:'Invalid token' }); }
}

router.get('/', auth, (req,res)=>{
  db.all('SELECT * FROM projects', [], (err, rows) => {
    if(err) return res.status(500).json({ error:'DB error' });
    res.json(rows);
  });
});

router.post('/', auth, (req,res)=>{
  if(req.user.role !== 'admin') return res.status(403).json({ error:'Forbidden' });
  const { name } = req.body;
  if(!name) return res.status(400).json({ error:'Missing name' });
  db.run('INSERT INTO projects (name) VALUES (?)', [name], function(err){
    if(err) return res.status(500).json({ error:'DB error' });
    res.json({ id:this.lastID, name });
  });
});

module.exports = router;
