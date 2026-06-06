import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

// Ensure database directory and file exist
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = { logins: [], users: [], bills: [], billCounters: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    console.log(`Created new database at ${DB_PATH}`);
  }
}
ensureDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Helper functions for database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { logins: [], users: [], bills: [], billCounters: {} };
  }
}

function writeDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// LOGINS API
app.get('/logins', (req, res) => {
  const db = readDB();
  res.json(db.logins || []);
});

app.get('/logins/:id', (req, res) => {
  const db = readDB();
  const item = (db.logins || []).find(l => l.id == req.params.id);
  if (item) res.json(item);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/logins', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now() };
  if (!db.logins) db.logins = [];
  db.logins.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.patch('/logins/:id', (req, res) => {
  const db = readDB();
  if (!db.logins) db.logins = [];
  const idx = db.logins.findIndex(l => l.id == req.params.id);
  if (idx >= 0) {
    db.logins[idx] = { ...db.logins[idx], ...req.body };
    writeDB(db);
    res.json(db.logins[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// USERS API
app.get('/users', (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

app.get('/users/:id', (req, res) => {
  const db = readDB();
  const item = (db.users || []).find(u => u.id == req.params.id);
  if (item) res.json(item);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/users', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now() };
  if (!db.users) db.users = [];
  db.users.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.put('/users/:id', (req, res) => {
  const db = readDB();
  if (!db.users) db.users = [];
  const idx = db.users.findIndex(u => u.id == req.params.id);
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...req.body };
    writeDB(db);
    res.json(db.users[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/users/:id', (req, res) => {
  const db = readDB();
  if (!db.users) db.users = [];
  const idx = db.users.findIndex(u => u.id == req.params.id);
  if (idx >= 0) {
    db.users.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// BILLS API
app.get('/bills', (req, res) => {
  const db = readDB();
  res.json(db.bills || []);
});

app.post('/bills', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now() };
  if (!db.bills) db.bills = [];
  db.bills.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.put('/bills/:id', (req, res) => {
  const db = readDB();
  if (!db.bills) db.bills = [];
  const idx = db.bills.findIndex(b => b.id == req.params.id);
  if (idx >= 0) {
    db.bills[idx] = { ...db.bills[idx], ...req.body };
    writeDB(db);
    res.json(db.bills[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// BILL COUNTERS API
app.get('/billCounters', (req, res) => {
  const db = readDB();
  res.json(db.billCounters || {});
});

app.patch('/billCounters', (req, res) => {
  const db = readDB();
  if (!db.billCounters) db.billCounters = {};
  db.billCounters = { ...db.billCounters, ...req.body };
  writeDB(db);
  res.json(db.billCounters);
});

// SPA Fallback - serve index.html for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/logins') || 
      req.path.startsWith('/users') || 
      req.path.startsWith('/bills') || 
      req.path.startsWith('/billCounters')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Don't serve index.html for file requests
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`API endpoints: /logins, /users, /bills, /billCounters`);
});