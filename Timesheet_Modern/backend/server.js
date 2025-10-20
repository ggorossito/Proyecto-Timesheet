const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const auth = require('./routes/auth');
const entries = require('./routes/entries');
const projects = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', auth);
app.use('/api/entries', entries);
app.use('/api/projects', projects);

// serve frontend static from ../frontend
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

app.listen(PORT, () => console.log('Server listening on', PORT));
