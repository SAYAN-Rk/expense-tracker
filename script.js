// script.js
// Expense Tracker v2
// - Stores transactions in localStorage
// - Supports date & category for each transaction
// - Filtering by date range and category
// - Monthly summary (income/expense/net per month)
// - CSV export of filtered transactions
// - Backward-compatible with older saved transactions (adds defaults)

// ---- DOM Elements ----
// Cache references to frequently used DOM elements for performance and clarity.
const transactionForm = document.getElementById('transactionForm');
const transactionNameInput = document.getElementById('transactionName');
const transactionAmountInput = document.getElementById('transactionAmount');
const transactionDateInput = document.getElementById('transactionDate');
const transactionCategoryInput = document.getElementById('transactionCategory');
const transactionTypeSelect = document.getElementById('transactionType');

const transactionList = document.getElementById('transactionList');
const balanceDisplay = document.getElementById('balance');

const filterStart = document.getElementById('filterStart');
const filterEnd = document.getElementById('filterEnd');
const filterCategorySelect = document.getElementById('filterCategory');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');

const monthlySummaryDiv = document.getElementById('monthlySummary');
const exportCsvBtn = document.getElementById('exportCsv');

// ---- Local Storage Key ----
// Use a versioned key so future changes can be handled safely.
const STORAGE_KEY = 'expenseTrackerTransactions_v2';

// ---- State: transactions array ----
// Each transaction object shape:
// { id: number, name: string, amount: number, type: 'income'|'expense', date: 'YYYY-MM-DD', category: string }
let transactions = [];

/* -------------------------
   Persistence helpers
   ------------------------- */

// Save current transactions array to localStorage (stringified)
function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Load transactions from localStorage and normalize them (backwards compatibility)
function loadTransactions() {
    const raw = localStorage.getItem(STORAGE_KEY);
    try {
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
            transactions = [];
        } else {
            // Normalize: ensure each transaction has id, name, amount, type, date, category
            transactions = parsed.map(t => ({
                id: t.id ?? (Date.now() + Math.floor(Math.random() * 1000)),
                name: t.name ?? 'Unnamed',
                amount: Number(t.amount ?? 0),
                // default to 'income' if type is missing or invalid
                type: t.type === 'expense' ? 'expense' : 'income',
                // if date missing, set to today's date (YYYY-MM-DD)
                date: t.date ?? new Date().toISOString().slice(0,10),
                category: t.category ?? 'Uncategorized'
            }));
        }
    } catch (e) {
        console.error('Could not parse transactions from localStorage, resetting.', e);
        transactions = [];
    }
}

/* -------------------------
   Formatting helpers
   ------------------------- */

// Ensure currency-like 2-decimal formatting (string)
function formatAmount(num) {
    const n = Number(num) || 0;
    return n.toFixed(2);
}

// Return human-friendly date string; here inputs are already YYYY-MM-DD so return as-is
function formatDate(isoDateStr) {
    if (!isoDateStr) return '';
    return isoDateStr;
}

/* -------------------------
   Filtering helpers
   ------------------------- */

// Read the filter form and return usable Date objects and selected category
function getFilters() {
    const start = filterStart.value ? new Date(filterStart.value) : null;
    const end = filterEnd.value ? new Date(filterEnd.value) : null;
    // If 'end' provided, make it inclusive by setting to end of day
    if (end) {
        end.setHours(23,59,59,999);
    }
    const category = filterCategorySelect.value || 'all';
    return { start, end, category };
}

// Apply currently selected filters to a transactions array
function applyFilters(transArray) {
    const { start, end, category } = getFilters();
    return transArray.filter(t => {
        const tDate = new Date(t.date + 'T00:00:00'); // interpret as local date
        if (start && tDate < start) return false;
        if (end && tDate > end) return false;
        if (category && category !== 'all' && t.category !== category) return false;
        return true;
    });
}

/* -------------------------
   Rendering functions
   ------------------------- */

// Render the transaction list in the UI, using current filters
function renderTransactions() {
    transactionList.innerHTML = '';
    const filtered = applyFilters(transactions);

    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No transactions found for applied filters.';
        li.style.textAlign = 'center';
        li.style.color = '#666';
        transactionList.appendChild(li);
        return;
    }

    filtered.forEach(tx => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        // Left column: name and meta (category & date)
        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';

        const name = document.createElement('span');
        name.textContent = tx.name;
        name.style.fontWeight = '600';

        const meta = document.createElement('small');
        meta.textContent = `${tx.category} • ${formatDate(tx.date)}`;
        meta.style.opacity = '0.8';
        meta.style.fontSize = '12px';

        left.appendChild(name);
        left.appendChild(meta);

        // Right column: amount and delete button
        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.alignItems = 'center';
        right.style.gap = '10px';

        const amountSpan = document.createElement('span');
        amountSpan.textContent = (tx.type === 'income' ? '+' : '-') + formatAmount(tx.amount);
        amountSpan.className = tx.type === 'income' ? 'income' : 'expense';
        amountSpan.style.fontWeight = '700';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.title = 'Delete transaction';
        // Confirm before deleting (simple safeguard)
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete this transaction?')) deleteTransaction(tx.id);
        });

        right.appendChild(amountSpan);
        right.appendChild(deleteBtn);

        li.appendChild(left);
        li.appendChild(right);

        transactionList.appendChild(li);
    });
}

// Update displayed balance based on currently filtered transactions
function updateBalance() {
    // Show balance for the currently filtered set (so filters affect balance too)
    const filtered = applyFilters(transactions);
    const totalIncome = filtered
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalExpense = filtered
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;
    balanceDisplay.textContent = formatAmount(balance);
}

/* -------------------------
   Category utilities
   ------------------------- */

// Gather unique categories from stored transactions (used to populate filter dropdown)
function getAllCategories() {
    const set = new Set();
    transactions.forEach(t => set.add(t.category || 'Uncategorized'));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
}

// Fill the category select input with "All" + discovered categories
function populateCategoryFilter() {
    const existing = filterCategorySelect.value;
    filterCategorySelect.innerHTML = '<option value="all">All</option>';
    getAllCategories().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterCategorySelect.appendChild(opt);
    });
    if (existing) {
        // restore previously selected category if still present
        filterCategorySelect.value = existing;
    }
}

/* -------------------------
   Monthly summary
   ------------------------- */

// Compute summary (income/expense/net) grouped by month (YYYY-MM)
function computeMonthlySummary(baseArray) {
    const map = new Map();
    baseArray.forEach(t => {
        const month = (t.date && t.date.slice(0,7)) || new Date().toISOString().slice(0,7);
        if (!map.has(month)) map.set(month, { income: 0, expense: 0 });
        const item = map.get(month);
        if (t.type === 'income') item.income += Number(t.amount);
        else item.expense += Number(t.amount);
    });
    const arr = Array.from(map.entries()).map(([month, sums]) => ({
        month, income: sums.income, expense: sums.expense, net: sums.income - sums.expense
    }));
    arr.sort((a,b) => b.month.localeCompare(a.month)); // latest first
    return arr;
}

// Render the monthly summary table into the UI (uses filtered transactions)
function renderMonthlySummary() {
    const filtered = applyFilters(transactions);
    const summary = computeMonthlySummary(filtered);

    if (summary.length === 0) {
        monthlySummaryDiv.innerHTML = '<p style="color:#666">No data for monthly summary.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'summary-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    summary.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.month}</td>
                        <td>$${formatAmount(s.income)}</td>
                        <td>$${formatAmount(s.expense)}</td>
                        <td>$${formatAmount(s.net)}</td>`;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    monthlySummaryDiv.innerHTML = '';
    monthlySummaryDiv.appendChild(table);
}

/* -------------------------
   CRUD actions
   ------------------------- */

// Add a new transaction to state, persist, update UI
function addTransaction(name, amount, type, date, category) {
    const tx = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: name.trim(),
        amount: Number(amount),
        type,
        date: date, // expected 'YYYY-MM-DD'
        category: category.trim() || 'Uncategorized'
    };
    transactions.push(tx);
    saveTransactions();
    populateCategoryFilter();
    renderAll();
}

// Remove a transaction by id, persist, update UI
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    populateCategoryFilter();
    renderAll();
}

/* -------------------------
   CSV Export
   ------------------------- */

// Export a given array of transactions as a CSV file (escaped)
function exportToCsv(filteredArray) {
    const rows = [['id','name','amount','type','date','category']];
    filteredArray.forEach(t => {
        rows.push([t.id, t.name, formatAmount(t.amount), t.type, t.date, t.category]);
    });
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const now = new Date().toISOString().slice(0,10);
    a.download = `transactions_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* -------------------------
   Validation helpers
   ------------------------- */

// Validate form inputs and show alerts for invalid states.
// Returns true if inputs are valid.
function validateInputs(name, amount, date, category) {
    if (!name || name.trim() === '') {
        alert('Please enter a transaction name.');
        return false;
    }
    if (amount === '' || amount === null || isNaN(amount) || !isFinite(Number(amount)) || Number(amount) <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return false;
    }
    if (!date) {
        alert('Please enter a valid date.');
        return false;
    }
    if (!category || category.trim() === '') {
        alert('Please enter a category.');
        return false;
    }
    return true;
}

/* -------------------------
   Render everything (helper)
   ------------------------- */

// Re-render the UI pieces that depend on transactions
function renderAll() {
    renderTransactions();
    updateBalance();
    renderMonthlySummary();
}

/* -------------------------
   Initialization
   ------------------------- */

function init() {
    // Load saved data and populate UI
    loadTransactions();
    populateCategoryFilter();
    renderAll();

    // Form submit handler: validate inputs and create transaction
    transactionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = transactionNameInput.value;
        const amount = Math.abs(Number(transactionAmountInput.value)); // store positive amounts
        const date = transactionDateInput.value || new Date().toISOString().slice(0,10);
        const category = transactionCategoryInput.value || 'Uncategorized';
        const type = transactionTypeSelect.value;

        if (!validateInputs(name, amount, date, category)) return;

        addTransaction(name, amount, type, date, category);

        transactionForm.reset();
        transactionNameInput.focus();
    });

    // Filter controls: apply, clear, and live changes
    applyFiltersBtn.addEventListener('click', function () {
        populateCategoryFilter(); // ensure newest categories are available
        renderAll();
    });

    clearFiltersBtn.addEventListener('click', function () {
        filterStart.value = '';
        filterEnd.value = '';
        filterCategorySelect.value = 'all';
        renderAll();
    });

    // Update rendering when filters change
    filterCategorySelect.addEventListener('change', () => renderAll());
    filterStart.addEventListener('change', () => renderAll());
    filterEnd.addEventListener('change', () => renderAll());

    // CSV export exports currently filtered transactions
    exportCsvBtn.addEventListener('click', function () {
        const filtered = applyFilters(transactions);
        exportToCsv(filtered);
    });
}

// Start the app
init();
