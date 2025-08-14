async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
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
    li.className = 'relative group';
    const link = document.createElement('a');
    link.href = `/category.html?id=${c.id}`;
    link.textContent = c.name;
    link.className = 'block rounded-lg px-3 py-2 pr-10 text-white text-center shadow-sm hover:shadow transition';
    link.style.background = c.color;
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center rounded-md bg-white/90 text-red-600 hover:bg-white px-2 py-1 shadow border border-red-200';
    delBtn.setAttribute('aria-label', `Delete category ${c.name}`);
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = confirm(`Delete category "${c.name}"? This also deletes its expenses.`);
      if (!ok) return;
      await fetch(`/api/categories/${c.id}`, { method: 'DELETE' });
      await loadCategories();
      await loadExpenses();
      await loadMonthlyChart();
      await loadCategoryChart();
    });
    li.appendChild(link);
    li.appendChild(delBtn);
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
    const amountEl = document.createElement('div');
    amountEl.className = 'text-sm font-semibold text-slate-900';
    amountEl.textContent = `$${e.amount}`;
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'ml-3 inline-flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 border border-red-200';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      const ok = confirm('Delete this expense?');
      if (!ok) return;
      await fetch(`/api/expenses/${e.id}`, { method: 'DELETE' });
      await loadExpenses();
      await loadMonthlyChart();
      await loadCategoryChart();
    });
    const right = document.createElement('div');
    right.className = 'flex items-center';
    right.appendChild(amountEl);
    right.appendChild(delBtn);
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

function setDefaultExpenseDate() {
  const input = document.getElementById('exp-date');
  if (!input) return;
  const now = new Date();
  const ymd = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  input.value = ymd;
  input.max = ymd;
}

function getTodayYMD() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
  const selectedDate = document.getElementById('exp-date').value;
  const payload = { amount, name, categoryId };
  const today = getTodayYMD();
  if (selectedDate && selectedDate !== today) payload.createdAt = selectedDate;
  await fetchJSON('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  e.target.reset();
  setDefaultExpenseDate();
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
setDefaultExpenseDate();