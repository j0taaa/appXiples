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
    link.className = 'block p-2 rounded text-white text-center';
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
    li.textContent = `${date} - $${e.amount} ${e.name ? '- ' + e.name : ''}`;
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
