# Expense Tracker — Local, Lightweight, Beautiful

A simple client-side Expense Tracker web app with persistent storage (localStorage).  
This version adds date & category support, filtering, monthly summaries, CSV export, and a modern glassmorphism UI (black sea green theme).

---

## Features

### Core
- Add transactions with:
  - **Name**
  - **Amount**
  - **Date** (YYYY-MM-DD)
  - **Category** (free text)
  - **Type**: Income or Expense
- Persistent storage using `localStorage` (no backend required).
- Delete transactions.

### Advanced
- **Filter by date range** (From / To).
- **Filter by category** — categories are auto-populated from existing transactions.
- **Monthly summary**: Shows income, expense, and net per month (based on current filters).
- **Export to CSV**: Download currently filtered transactions as a CSV file.
- Backwards-compatible with older saved transactions (defaults added if date/category missing).

### UI & Design
- Glassmorphism styling with a black sea green palette.
- Responsive layout for mobile & desktop.
- Subtle hover and focus interactions, accessible contrast choices.

---

## Files

- `index.html` — The main HTML page (contains layout and input elements).
- `style.css` — Styling (glassmorphism / black-sea-green theme).
- `script.js` — Application logic: storage, rendering, filters, CSV export.
- (Optional) `README.md` — This file.

---

## How to use (quick start)

1. **Download or clone** the project files to a folder on your machine.
2. Ensure files are named exactly:
   - `index.html`
   - `style.css`
   - `script.js`
3. **Open `index.html`** in a modern browser (Chrome, Firefox, Edge).
   - No server required — everything runs in the browser.
4. **Add transactions** using the form on the left (name, amount, date, category, type).
5. **Filter** transactions:
   - Use the "From" and "To" date inputs (inclusive).
   - Use the Category dropdown to filter by category, or choose "All".
   - Click **Apply** to apply filters; **Clear** resets filters.
   - Filters also update the displayed balance and monthly summary.
6. **Export CSV** to download the currently shown (filtered) transactions.

---

## Notes & behavior details

- All amounts are stored as positive numbers; the `type` (`income`/`expense`) controls how they affect balance and display (`+` or `-`).
- The "To" date is inclusive — transactions on the "To" date are included.
- Categories are discovered from existing data and populated into the filter dropdown. New categories added via the form will appear automatically.
- Old/localStorage entries that lack `date` or `category` are automatically normalized when the app loads: `date` becomes today's date and `category` becomes `Uncategorized`.

---

## Optional improvements you might want

- Add charts (e.g., monthly income vs expense bar chart) using Chart.js or Recharts.
- Add categories as selectable tags (with autocomplete and a fixed category list).
- Add transaction editing (update existing transactions).
- Add export/import JSON to backup and restore full state.
- Add user authentication and a backend (Node/Express + DB) for multi-device sync.
- Add undo for deletions.

---

## Troubleshooting

- **I see no transactions after upgrade** — older data may be under a different localStorage key. The app uses `expenseTrackerTransactions_v2`. If you had v1 data under a different key, you can open the browser console and copy it to the new key, or I can provide a small migration snippet.
- **CSV contains odd characters** — CSV fields are quoted and commas within text are escaped. Save as `.csv` and open in Excel/Sheets.
- **Dates appear wrong** — the app uses `YYYY-MM-DD`. If your locale displays differently, spreadsheets may reformat dates; they are still correct in ISO format.

---

## License

MIT-style: feel free to reuse and modify for personal or educational projects. Attribution appreciated if you publish it publicly.

---

If you'd like, I can:
- Provide a one-click export/import JSON backup button.
- Add a nice chart (monthly incomes vs expenses) to the summary (SVG or Canvas).
- Add edit-in-place for transactions and an undo stack.
Which one should I add next?
