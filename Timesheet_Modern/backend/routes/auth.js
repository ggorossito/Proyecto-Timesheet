const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'Missing' });
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if(err) return res.status(500).json({ error:'DB error' });
    if(!user) return res.status(401).json({ error:'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ error:'Invalid credentials' });
    const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:'8h' });
    res.json({ token, user:{ id:user.id, username:user.username, role:user.role } });
  });
});

module.exports = router;
