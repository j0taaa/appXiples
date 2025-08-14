async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  return res.json();
}

async function loadCategories() {
  const categories = await fetchJSON('/api/categories');
  const list = document.getElementById('category-list');
  const select = document.getElementById('exp-category');
  list.innerHTML = '';
  select.innerHTML = '';
  categories.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c.name;
    li.style.color = c.color;
    list.appendChild(li);

    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    option.style.color = c.color;
    select.appendChild(option);
  });
}

async function loadExpenses() {
  const expenses = await fetchJSON('/api/expenses');
  const list = document.getElementById('expenses-list');
  list.innerHTML = '';
  expenses.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.amount} - ${e.name || ''}`;
    list.appendChild(li);
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
  loadCategories();
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
  loadExpenses();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

loadCategories();
loadExpenses();
