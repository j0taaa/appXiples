const express = require('express');
const path = require('path');
const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Turso SQLite client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function init() {
  await db.execute(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )`);
}

init().catch(err => {
  console.error('Failed to initialize database', err);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/categories', async (req, res) => {
  const result = await db.execute('SELECT * FROM categories');
  res.json(result.rows);
});

app.get('/api/categories/:id', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ? LIMIT 1',
    args: [req.params.id],
  });
  res.json(result.rows[0] || null);
});

app.post('/api/categories', async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color)
    return res.status(400).json({ error: 'name and color required' });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO categories (id, name, color) VALUES (?,?,?)',
    args: [id, name, color],
  });
  res.json({ id, name, color });
});

app.get('/api/expenses', async (req, res) => {
  const { categoryId, limit } = req.query;
  let sql = 'SELECT * FROM expenses';
  const args = [];
  if (categoryId) {
    sql += ' WHERE category_id = ?';
    args.push(categoryId);
  }
  sql += ' ORDER BY created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    args.push(Number(limit));
  }
  const result = await db.execute({ sql, args });
  res.json(result.rows);
});

app.post('/api/expenses', async (req, res) => {
  const { categoryId, amount, name } = req.body;
  if (!categoryId || amount === undefined) return res.status(400).json({ error: 'categoryId and amount required' });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO expenses (id, category_id, amount, name) VALUES (?,?,?,?)',
    args: [id, categoryId, amount, name]
  });
  res.json({ id, categoryId, amount, name });
});

// Monthly totals across all expenses
app.get('/api/summary/monthly', async (req, res) => {
  const result = await db.execute(
    "SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total FROM expenses GROUP BY month ORDER BY month"
  );
  res.json(result.rows);
});

// Totals per category for a given month (defaults to current month)
app.get('/api/summary/categories', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
  const result = await db.execute({
    sql: "SELECT c.id, c.name, c.color, IFNULL(SUM(e.amount),0) as total FROM categories c LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.created_at) = ? GROUP BY c.id ORDER BY total DESC",
    args: [month],
  });
  res.json(result.rows);
});

// Monthly totals for a specific category
app.get('/api/summary/category/:id/monthly', async (req, res) => {
  const result = await db.execute({
    sql: "SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total FROM expenses WHERE category_id = ? GROUP BY month ORDER BY month",
    args: [req.params.id],
  });
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});