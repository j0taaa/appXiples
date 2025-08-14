async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return res.json();
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const id = getParam('id');
let categoryColor = '#3b82f6';

async function loadCategory() {
  const cat = await fetchJSON(`/api/categories/${id}`);
  const header = document.getElementById('cat-title');
  if (cat) {
    header.textContent = cat.name;
    header.style.backgroundColor = cat.color;
    categoryColor = cat.color;
  }
}

async function loadExpenses() {
  const expenses = await fetchJSON(`/api/expenses?categoryId=${id}&limit=10`);
  const list = document.getElementById('expense-list');
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
      await loadChart();
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

async function loadChart() {
  const data = await fetchJSON(`/api/summary/category/${id}/monthly`);
  const labels = data.map(d => d.month);
  const totals = data.map(d => d.total);
  const ctx = document.getElementById('catMonthlyChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spent',
        data: totals,
        backgroundColor: categoryColor,
      }]
    },
    options: { responsive: true }
  });
}

loadCategory();
loadExpenses();
loadChart();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
