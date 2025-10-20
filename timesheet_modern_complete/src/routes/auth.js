const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const COOKIE_NAME = process.env.COOKIE_NAME || 'ts_token';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
function sign(payload){ return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); }
function verify(token){ try{ return jwt.verify(token, JWT_SECRET); }catch(e){ return null; } }
router.post('/login', (req,res)=>{
  const { email, pass } = req.body;
  if(!email || !pass) return res.status(400).json({ error:'missing' });
  db.get('SELECT id,name,email,pass,role FROM users WHERE email = ?', [email], async (err,row)=>{
    if(err) return res.status(500).json({ error:'db' });
    if(!row) return res.status(401).json({ error:'invalid' });
    const ok = await bcrypt.compare(pass, row.pass);
    if(!ok) return res.status(401).json({ error:'invalid' });
    const payload = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = sign(payload);
    res.cookie(COOKIE_NAME, token, { httpOnly:true, sameSite:'lax' });
    res.json({ user: payload });
  });
});
router.post('/logout', (req,res)=>{ res.clearCookie(COOKIE_NAME); res.json({ ok:true }); });
router.get('/me', (req,res)=>{ const token = req.cookies[COOKIE_NAME]; if(!token) return res.status(401).json({ error:'no-token' }); const data = verify(token); if(!data) return res.status(401).json({ error:'invalid' }); res.json({ user: data }); });
module.exports = router;
