# Codex Prompts — Warehouse & Finance Module Comprehensive Improvement

> Execute these prompts in order after the card CSS improvements are applied.

---

## Prompt A: Warehouse Module — Sidebar Consolidation + Hub Dashboard Enhancement

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

TASK: Restructure the Warehouse module to reduce sidebar items from 18 to 5, and improve the Warehouse Hub dashboard.

Read the full plan at: docs/UI_UX_IMPROVEMENT_PLAN.md

## CONTEXT

The warehouse currently has 18+ separate sidebar items. We need to group them into 5 logical categories while keeping ALL existing pages and routes working.

### Current sidebar items (in DashboardLayout.tsx):
Warehouses, Products, Company Catalog, Inventory Stocks, Stock Movements, Stock Reservations, Warehouse Locations, Warehouse Receipts, Warehouse Transfers, Inbound Requests, Picking Lists, Packing Tasks, Returns, Charges, Storage Fee Rules, Pick & Pack Fee Rules, Warehouse KPIs, Barcode Lookup

### Target sidebar structure:
📦 Warehouse (collapsible group)
   ├── 📊 Hub           → /admin/warehouse/kpis (existing WarehouseKpisPage — enhance it)
   ├── 📥 Inbound       → /admin/warehouse/inbound (NEW page with tabs)
   ├── 📊 Inventory     → /admin/warehouse/inventory (NEW page with tabs)
   ├── 📤 Fulfillment   → /admin/warehouse/fulfillment (NEW page with tabs)
   └── ⚙️ Config        → /admin/warehouse/config (NEW page with tabs)

## STEPS

### Step 1: Create WarehouseInboundPage (NEW)

Create `src/features/warehouse/pages/WarehouseInboundPage.tsx`:
- A page with 3 tabs using the shared Tabs component or link-based tabs
- Tab 1: "Inbound Requests" — Renders the content from MerchantInboundStockRequestsPage
- Tab 2: "Warehouse Receipts" — Renders the content from WarehouseReceiptsPage  
- Tab 3: "Transfers" — Renders the content from WarehouseTransfersPage

IMPORTANT: Do NOT duplicate code. Extract the table/list content from each existing page into a reusable component (e.g., InboundRequestsPanel, WarehouseReceiptsPanel, WarehouseTransfersPanel), then use those components both in the new tabbed page AND keep the old standalone pages working (for now).

### Step 2: Create WarehouseInventoryPage (NEW)

Create `src/features/warehouse/pages/WarehouseInventoryPage.tsx`:
- A page with 5 tabs:
- Tab 1: "Products" — Content from WarehouseProductsPage (+ Company Catalog merged)
- Tab 2: "Stocks" — Content from InventoryStocksPage
- Tab 3: "Movements" — Content from StockMovementsPage
- Tab 4: "Reservations" — Content from StockReservationsPage
- Tab 5: "Locations" — Content from WarehouseLocationsPage

Same approach: extract reusable panels from existing pages.

### Step 3: Create WarehouseFulfillmentPage (NEW)

Create `src/features/warehouse/pages/WarehouseFulfillmentPage.tsx`:
- A page with 2 tabs:
- Tab 1: "Picking Lists" — Content from PickingListsPage
- Tab 2: "Packing Tasks" — Content from PackingTasksPage

### Step 4: Create WarehouseConfigPage (NEW)

Create `src/features/warehouse/pages/WarehouseConfigPage.tsx`:
- A page with 4 tabs:
- Tab 1: "Returns" — Content from WarehouseReturnsPage
- Tab 2: "Charges" — Content from WarehouseChargesPage
- Tab 3: "Storage Fee Rules" — Content from StorageFeeRulesPage
- Tab 4: "Pick & Pack Fee Rules" — Content from PickPackFeeRulesPage

### Step 5: Enhance WarehouseKpisPage (Hub)

Improve the existing `src/features/warehouse/pages/WarehouseKpisPage.tsx`:
- Add a prominent barcode search bar at the top (move from the separate Barcode Lookup page)
- Add "Urgent Tasks" section showing:
  - Pending warehouse receipts count (link to Inbound tab)
  - Overdue picking lists count (link to Fulfillment tab)
  - Returns awaiting inspection count (link to Config > Returns tab)
- Keep existing KPI stat cards
- Add quick action buttons: "Receive Goods", "Start Pick", "Process Return"

### Step 6: Update Router

In `src/app/router.tsx`, add new routes:
- /admin/warehouse/inbound → WarehouseInboundPage
- /admin/warehouse/inventory → WarehouseInventoryPage
- /admin/warehouse/fulfillment → WarehouseFulfillmentPage
- /admin/warehouse/config → WarehouseConfigPage

KEEP all existing routes working (don't remove any). The old individual page routes should still work for backwards compatibility and for detail page "back" links.

### Step 7: Update Sidebar

In `src/layouts/DashboardLayout.tsx`, update the Warehouse group to show only 5 items:
- Hub (→ /admin/warehouse/kpis)
- Inbound (→ /admin/warehouse/inbound)
- Inventory (→ /admin/warehouse/inventory)
- Fulfillment (→ /admin/warehouse/fulfillment)
- Config (→ /admin/warehouse/config)

Keep the Warehouses item (→ /admin/warehouses) as a standalone item or under Config.

## DESIGN GUIDELINES

For the new tabbed pages:
- Use a consistent tab bar at the top below the page header
- Each tab should show a count badge (e.g., "Inbound Requests (5)")
- Active tab should use brand color
- Tab content should load lazily (only fetch data when tab is active)
- Include page-level filters that apply to the active tab

For the Hub dashboard:
- Barcode search bar: full-width, prominent, with a search icon
- Stat cards: use the existing Card variant="stat" component
- Urgent tasks: use a list with colored indicators (red for overdue, yellow for pending)
- Quick actions: horizontal button bar below the barcode search

## CRITICAL RULES
- DO NOT delete any existing page files
- DO NOT change any API calls or endpoints
- Extract reusable panels/components from existing pages instead of duplicating
- Keep all existing detail pages (WarehouseReceiptDetailsPage, etc.) working
- Keep all permission checks
- Run: npm run build — verify no build errors
```

---

## Prompt B: Finance Module — Sidebar Consolidation + Reports Simplification

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

TASK: Restructure the Finance module to reduce sidebar items from 7 to 3, and simplify the finance reports page.

## CONTEXT

The finance module currently has 7 sidebar items. We need to group them into 3 logical pages while keeping all functionality.

### Current sidebar items:
Overview (FinanceReportsPage), Payouts, Invoices, Expenses, Treasury Accounts, Treasury Transactions, Driver Cash Closures

### Target sidebar structure:
💰 Finance (collapsible group)
   ├── 📊 Overview      → /admin/finance (existing FinanceReportsPage — simplify it)
   ├── 💼 Operations    → /admin/finance/operations (NEW page with tabs)
   └── 🏦 Treasury      → /admin/finance/treasury (NEW page with tabs)

## STEPS

### Step 1: Create FinanceOperationsPage (NEW)

Create `src/features/finance/pages/FinanceOperationsPage.tsx`:
- A page with 4 tabs:
- Tab 1: "Merchant Payouts" — Content from MerchantPayoutsPage (19KB)
- Tab 2: "Merchant Invoices" — Content from MerchantInvoicesPage (3.7KB)
- Tab 3: "Expenses" — Content from ExpensesPage (17KB)
- Tab 4: "Driver Cash Closures" — Content from DriverCashClosuresPage (3.7KB)

IMPORTANT: Extract reusable panel components from each existing page. For example:
- MerchantPayoutsPanel.tsx (extracted from MerchantPayoutsPage)
- MerchantInvoicesPanel.tsx
- ExpensesPanel.tsx
- DriverCashClosuresPanel.tsx

Each panel should contain the table, filters, and actions from the original page.
The original standalone pages should import and use these panels too (for backwards compatibility).

### Step 2: Create FinanceTreasuryPage (NEW)

Create `src/features/finance/pages/FinanceTreasuryPage.tsx`:
- A page with 2 tabs:
- Tab 1: "Accounts" — Content from TreasuryAccountsPage (3.5KB)
- Tab 2: "Transactions" — Content from TreasuryTransactionsPage (10.7KB)

Same panel extraction approach.

### Step 3: Simplify FinanceReportsPage

The current FinanceReportsPage.tsx (34KB) is very large and permission-heavy. Simplify it:

Read the current page carefully, then:
- Keep the stat cards at the top (these are important for quick overview)
- Group the report sections into collapsible sections:
  - "Revenue & Profit" section (Company Profit, Profit & Loss)
  - "Merchant Ledger" section (Reconciliation, Merchant balances)
  - "Cash Operations" section (Daily Cash, Driver closures summary)
- Add summary stat cards at the very top:
  - Total Revenue (this month)
  - Total Payouts (this month)
  - Net Profit (this month)
  - Outstanding Balance
- Make each report section collapsible (open/close with smooth animation)
- Add a date range filter at the top that applies to all sections

### Step 4: Update Router

In `src/app/router.tsx`, add new routes:
- /admin/finance/operations → FinanceOperationsPage
- /admin/finance/treasury → FinanceTreasuryPage

KEEP all existing routes working.

### Step 5: Update Sidebar

In `src/layouts/DashboardLayout.tsx`, update the Finance group to show only 3 items:
- Overview (→ /admin/finance)
- Operations (→ /admin/finance/operations)
- Treasury (→ /admin/finance/treasury)

## DESIGN GUIDELINES

For the new tabbed pages:
- Use consistent tab bar at top below page header
- Each tab should show relevant count/total badge
- Active tab uses brand color
- Lazy loading: only fetch data when tab is active
- Include page-level filters that apply to active tab

For the simplified FinanceReportsPage:
- Top-level stat cards in a 4-column grid (responsive)
- Each stat card shows: label, value (large), trend arrow (up/down), percentage change
- Report sections below with collapsible headers
- Clean visual hierarchy with section dividers
- Date range picker: use a dropdown with presets (Today, This Week, This Month, Last Month, Custom Range)

For Finance Operations page:
- The Payouts tab should prominently show:
  - Summary cards: Total Pending, Total Approved, Total Paid
  - Table with filters: Status, Merchant, Date Range
  - Bulk approve action for pending payouts
- The Expenses tab:
  - Summary cards: Total This Month, By Category
  - Table with category filter
- The Invoices tab:
  - Summary: Total Invoiced, Paid, Overdue
  - Table with status filter

## CRITICAL RULES
- DO NOT delete any existing page files
- DO NOT change any API calls or endpoints
- Extract reusable panels from existing pages
- Keep all detail pages (FinanceRecordDetailsPage, TreasuryAccountDetailsPage) working
- Keep all permission checks
- Run: npm run build — verify no build errors
```

---

## Prompt C: Warehouse & Finance — UI/UX Design Polish

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

TASK: Apply visual design improvements across warehouse and finance modules after the restructuring is complete.

## CONTEXT

After Prompts A and B have been executed, the warehouse and finance modules have been restructured into fewer sidebar items with tabbed pages. Now we need to polish the design.

## IMPROVEMENTS

### 1. Tab Bar Design Enhancement

Find ALL tabbed pages created in Prompts A and B and ensure consistent tab styling:

```css
/* Add to src/index.css */

/* Module page tabs — horizontal tab bar */
.module-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.module-tabs__tab {
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}

.module-tabs__tab:hover {
  color: var(--content);
}

.module-tabs__tab--active {
  color: rgb(var(--brand-primary));
  border-bottom-color: rgb(var(--brand-primary));
}

.module-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.4rem;
  margin-left: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(var(--brand-primary), 0.1);
  color: rgb(var(--brand-primary));
}
```

### 2. Stat Cards for Hub/Overview Pages

Ensure warehouse hub and finance overview use consistent stat card design:

```css
/* Enhanced stat cards */
.stat-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
}

.stat-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--content);
  line-height: 1.2;
}

.stat-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-card__trend--up { color: var(--success); }
.stat-card__trend--down { color: var(--danger); }
```

### 3. Urgent Tasks List (Warehouse Hub)

```css
.urgent-tasks {
  display: grid;
  gap: 0.75rem;
}

.urgent-task {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background: var(--surface);
  transition: box-shadow 0.15s;
}

.urgent-task:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.urgent-task__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.urgent-task__indicator--critical { background: var(--danger); }
.urgent-task__indicator--warning { background: var(--warning); }
.urgent-task__indicator--info { background: var(--info); }

.urgent-task__count {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--content);
}
```

### 4. Barcode Search Bar (Warehouse Hub)

```css
.barcode-search {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border);
  background: var(--surface);
  transition: border-color 0.2s;
}

.barcode-search:focus-within {
  border-color: rgb(var(--brand-primary));
  box-shadow: 0 0 0 3px rgba(var(--brand-primary), 0.1);
}

.barcode-search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1.05rem;
  background: transparent;
  color: var(--content);
}

.barcode-search__btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  background: rgb(var(--brand-primary));
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```

### 5. Collapsible Report Sections (Finance)

```css
.report-section {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 1rem;
}

.report-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  background: rgba(var(--brand-primary), 0.02);
  transition: background 0.15s;
}

.report-section__header:hover {
  background: rgba(var(--brand-primary), 0.04);
}

.report-section__title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.report-section__chevron {
  transition: transform 0.2s;
}

.report-section__chevron--open {
  transform: rotate(180deg);
}

.report-section__content {
  padding: 1.25rem;
  border-top: 1px solid var(--border);
}
```

## STEPS

1. Add all the above CSS to `src/index.css`
2. Update the warehouse hub page (WarehouseKpisPage) to use `stat-card-grid`, `barcode-search`, and `urgent-tasks` classes
3. Update the finance overview page (FinanceReportsPage) to use `report-section` collapsible pattern
4. Update all new tabbed pages to use `module-tabs` classes for consistent tab styling
5. Verify all pages render correctly
6. Run: npm run build — verify no errors

## CRITICAL RULES
- These are CSS and minor component updates only
- DO NOT change any API calls
- DO NOT break existing functionality
- Use brand CSS variables (rgb(var(--brand-primary))) for all accent colors
```

---

## Execution Order

| # | Prompt | Dependencies | Est. Time |
|---|--------|-------------|-----------|
| A | Warehouse Restructuring | Card CSS done ✅ | 3-4 hours |
| B | Finance Restructuring | Card CSS done ✅ | 2-3 hours |
| C | Design Polish | A + B complete | 1-2 hours |

> A and B can run in parallel. C must run after both are complete.
