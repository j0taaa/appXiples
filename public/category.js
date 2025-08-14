async function fetchJSON(url, options) {
  const res = await fetch(url, options);
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
    li.textContent = `${date} - $${e.amount}${e.name ? ' - ' + e.name : ''}`;
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
