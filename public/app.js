async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  return res.json();
}

let monthlyChart, categoryChart;

async function loadCategories() {
  const categories = await fetchJSON('/api/categories');
  const list = document.getElementById('category-list');
  const select = document.getElementById('exp-category');
  list.innerHTML = '';
  select.innerHTML = '';
  categories.forEach(c => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/category.html?id=${c.id}`;
    link.textContent = c.name;
    link.className = 'block rounded-lg px-3 py-2 text-white text-center shadow-sm hover:shadow transition';
    link.style.background = c.color;
    li.appendChild(link);
    list.appendChild(li);

    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    select.appendChild(option);
  });
}

async function loadExpenses() {
  const expenses = await fetchJSON('/api/expenses?limit=10');
  const list = document.getElementById('expenses-list');
  list.innerHTML = '';
  expenses.forEach(e => {
    const li = document.createElement('li');
    const date = new Date(e.created_at).toLocaleDateString();
    li.className = 'flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm';
    const left = document.createElement('div');
    left.className = 'text-sm text-slate-700';
    left.textContent = `${date}${e.name ? ' • ' + e.name : ''}`;
    const right = document.createElement('div');
    right.className = 'text-sm font-semibold text-slate-900';
    right.textContent = `$${e.amount}`;
    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

async function loadMonthlyChart() {
  const data = await fetchJSON('/api/summary/monthly');
  const labels = data.map(d => d.month);
  const totals = data.map(d => d.total);
  const ctx = document.getElementById('monthlyChart');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Spent', data: totals, backgroundColor: '#3b82f6' }]
    },
    options: { responsive: true }
  });
}

async function loadCategoryChart() {
  const month = new Date().toISOString().slice(0, 7);
  const data = await fetchJSON(`/api/summary/categories?month=${month}`);
  const labels = data.map(d => d.name);
  const totals = data.map(d => d.total);
  const colors = data.map(d => d.color);
  const ctx = document.getElementById('categoryChart');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: totals, backgroundColor: colors }] },
    options: { responsive: true }
  });
}

document.getElementById('category-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('cat-name').value;
  const color = document.getElementById('cat-color').value;
  await fetchJSON('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color })
  });
  e.target.reset();
  await loadCategories();
  await loadCategoryChart();
});

document.getElementById('expense-form').addEventListener('submit', async e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const name = document.getElementById('exp-name').value;
  const categoryId = document.getElementById('exp-category').value;
  await fetchJSON('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, name, categoryId })
  });
  e.target.reset();
  await loadExpenses();
  await loadMonthlyChart();
  await loadCategoryChart();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

loadCategories();
loadExpenses();
loadMonthlyChart();
loadCategoryChart();