const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'timesheet.db');
const db = new sqlite3.Database(dbFile);
module.exports = db;
