# UI/UX Improvement Plan — System Flow Simplification + Brand Identity

> **Status**: Pending Implementation
> **Created**: 2026-08-29
> **Scope**: Frontend (React 19 + Vite + TypeScript + Tailwind CSS)

---

## Table of Contents

1. [Current Problems](#current-problems)
2. [Phase 1: Dynamic Brand Identity](#phase-1-dynamic-brand-identity)
3. [Phase 2: Sidebar Restructuring](#phase-2-sidebar-restructuring)
4. [Phase 3: Pages & Tabs Simplification](#phase-3-pages--tabs-simplification)
5. [Phase 4: UX Enhancements](#phase-4-ux-enhancements)
6. [File Map](#file-map)

---

## Current Problems

### Navigation (Sidebar)
- **Admin Sidebar**: 40+ flat items with no logical grouping
- Related items scattered: Governorates, Areas, Shipping Rates, Pricing Plans, Pricing Plan Rates
- Warehouse alone has 15+ items in sidebar
- **Merchant Sidebar**: 16+ items — too many for a merchant user

### Tabs Overload
- `MerchantDetailsPage` has **10 tabs**: Overview, Orders, Shipments, Wallet, Invoices, Warehouse, Integration Tokens, Shop Preview, Portal Users, Attachments
- `MerchantIntegrationsPage` has 3 tabs for content that fits in one page
- `MerchantProfilePage` has 3 tabs

### Flow Complexity
- `OrderForm.tsx`: 800+ lines, 20+ fields in a single form
- `ShipmentDetailsPage.tsx`: 1200+ lines, 4 different forms displayed simultaneously
- Warehouse: 23 separate page components — confusing navigation

### Color/Identity
- Hardcoded purple `#6D4AFF` across the entire app
- No brand customization — every company sees the same look

---

## Phase 1: Dynamic Brand Identity

### Goal
Replace hardcoded purple (`#6D4AFF`) with a dynamic theming system that adapts to each company's brand colors.

### Current Color Configuration
**File**: `tailwind.config.js`
```js
colors: {
  brand: '#6D4AFF',
  'brand-50': '#EEE9FF',
  'brand-500': '#6D4AFF',
  'brand-600': '#4F2FD8',
  primary: '#6D4AFF',
  'primary-dark': '#4F2FD8',
  'primary-light': '#EEE9FF',
  // ... functional colors stay the same
}
```

### Implementation Steps

#### 1.1 — CSS Custom Properties
Replace hardcoded colors in `tailwind.config.js` with CSS custom properties:

**`src/index.css`** — Add at the top:
```css
:root {
  --brand-primary: 109 74 255;       /* #6D4AFF in RGB — default fallback */
  --brand-primary-dark: 79 47 216;   /* #4F2FD8 */
  --brand-primary-light: 238 233 255; /* #EEE9FF */
  --brand-secondary: 109 74 255;
  --brand-accent: 109 74 255;
}
```

**`tailwind.config.js`** — Update colors to use CSS vars:
```js
colors: {
  brand: 'rgb(var(--brand-primary) / <alpha-value>)',
  'brand-50': 'rgb(var(--brand-primary-light) / <alpha-value>)',
  'brand-500': 'rgb(var(--brand-primary) / <alpha-value>)',
  'brand-600': 'rgb(var(--brand-primary-dark) / <alpha-value>)',
  primary: 'rgb(var(--brand-primary) / <alpha-value>)',
  'primary-dark': 'rgb(var(--brand-primary-dark) / <alpha-value>)',
  'primary-light': 'rgb(var(--brand-primary-light) / <alpha-value>)',
  // ... keep functional colors (success, warning, danger, info) unchanged
}
```

#### 1.2 — Brand Configuration Provider
**File**: `src/shared/branding/BrandProvider.tsx` (new or update existing `useBranding.ts`)

Create a React context that:
1. Fetches brand settings from API (logo URL, primary color hex)
2. Converts hex to RGB
3. Generates full palette (50-900 shades) using HSL algorithm
4. Applies CSS custom properties to `document.documentElement`

```typescript
interface BrandConfig {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;      // hex e.g. "#1E40AF"
  secondaryColor?: string;   // hex, optional
}

// Palette generation: given a hex color, produce shades:
// 50 (very light) → 100 → 200 → 300 → 400 → 500 (base) → 600 → 700 → 800 → 900 (very dark)
// Use HSL: keep H constant, vary S and L
```

#### 1.3 — Update Login Page
- Show company logo instead of generic logo
- Use brand primary color for the login button and accents
- Fetch brand config from a public endpoint: `GET /api/brand-config`

#### 1.4 — Affected Elements
All elements using `brand`, `primary`, `brand-50`, `brand-500`, `brand-600`, `primary-dark`, `primary-light` classes — these will automatically update via CSS vars. No need to touch individual components.

Search for usage:
```bash
grep -rn "bg-brand\|text-brand\|border-brand\|bg-primary\|text-primary\|border-primary" src/
```

### Important Rules
- **DO NOT change** functional colors: `success` (#22C55E), `warning` (#f59e0b), `danger` (#ef4444), `info` (#3b82f6)
- **DO NOT change** surface, background, content, muted, border colors
- **ONLY change** brand/primary related colors to use CSS custom properties

---

## Phase 2: Sidebar Restructuring

### Goal
Reorganize flat sidebar items into collapsible groups.

### Admin Sidebar — From 40+ items → 8 groups

**File**: `src/layouts/DashboardLayout.tsx`

```
📊 Dashboard                          (standalone link)

📋 Operations                         (collapsible group)
   ├── Orders
   ├── Shipments
   └── Driver Manifests

🏪 Merchants                          (standalone link)

🚗 Drivers                            (standalone link)

💲 Pricing                            (collapsible group)
   ├── Locations (merge Governorates + Areas into one page)
   └── Pricing Plans (merge Plans + Plan Rates)

📦 Warehouse                          (collapsible group)
   ├── Overview (new hub dashboard)
   ├── Receiving (merge Receipts + Inbound Requests)
   ├── Inventory (merge Stocks + Movements + Reservations)
   ├── Fulfillment (merge Picking Lists + Packing Tasks)
   ├── Returns
   └── Products & Catalog (merge Products + Company Catalog)

💰 Finance                            (collapsible group)
   ├── Overview
   ├── Payouts (merge Wallets + Payouts)
   ├── Billing (merge Invoices + Expenses)
   └── Treasury (merge Accounts + Transactions)

⚙️ Settings                           (collapsible group)
   ├── Users & Roles (merge Users + Roles into one page)
   ├── Audit Logs
   ├── Exports
   └── General Settings
```

### Merchant Sidebar — From 16 items → 6 groups

**File**: `src/layouts/MerchantLayout.tsx`

```
📊 Dashboard                          (standalone link)

📋 Orders & Shipments                 (collapsible group)
   ├── Orders
   └── Shipments

📦 Warehouse                          (collapsible group)
   ├── Products
   └── Inbound Requests

💰 Finance                            (collapsible group)
   ├── Wallet
   ├── Invoices
   └── Payouts

🔗 Integrations                       (standalone link)

⚙️ Settings                           (collapsible group)
   ├── Profile
   ├── Portal Users
   └── Notifications
```

### Implementation: Collapsible Sidebar Groups

Update `AppShell.tsx` to support a new nav item type:
```typescript
interface NavGroup {
  type: 'group';
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
  defaultOpen?: boolean;
}

interface NavItem {
  type: 'link';
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

type SidebarItem = NavGroup | NavItem;
```

The collapsible group should:
- Show an expand/collapse chevron icon
- Remember open/closed state in localStorage
- Auto-expand when active route is within the group
- Animate open/close with smooth transition

---

## Phase 3: Pages & Tabs Simplification

### 3.1 — MerchantDetailsPage: 10 tabs → 4 tabs

**File**: `src/features/merchants/pages/MerchantDetailsPage.tsx`

| New Tab | Contains (from old tabs) |
|---------|--------------------------|
| **Overview** | Overview + Shop Preview + quick stats |
| **Operations** | Orders + Shipments + Warehouse (with internal sub-tabs or sections) |
| **Finance** | Wallet + Invoices + financial Attachments |
| **Settings** | Portal Users + Integration Tokens + general Attachments |

### 3.2 — MerchantIntegrationsPage: 3 tabs → 1 scrollable page

**File**: `src/features/merchant-portal/integrations/pages/MerchantIntegrationsPage.tsx`

Remove tabs. Instead, render 3 sections on one page:
1. **Section: API Tokens** — Token management (create, list, revoke)
2. **Section: API Documentation** — Embedded docs
3. **Section: Test Integration** — Quick test tool

### 3.3 — Order Creation: Single form → 3-step Wizard

**File**: `src/features/orders/components/OrderForm.tsx`

Create a `StepWizard` component and split the form:

| Step | Fields |
|------|--------|
| **Step 1: Basics** | merchant_id, order_type, fulfillment_type, notes (4-5 fields) |
| **Step 2: Customer** | customer_name, customer_phone, governorate_id, area_id, delivery_address (5-6 fields) |
| **Step 3: Items & Payment** | items/warehouse_items/packaging_items arrays + payment_type + cod_amount (dynamic) |
| **Review** | Read-only summary of all data before submission |

Requirements:
- Each step validates independently before allowing "Next"
- "Back" button preserves entered data
- Step indicator at top shows progress (Step 1 of 3)
- Final "Review" step shows all data in read-only format with "Edit" links per section
- Same Zod schema, just split validation per step

### 3.4 — ShipmentDetailsPage: Context-Aware Actions

**File**: `src/features/shipments/pages/ShipmentDetailsPage.tsx`

Instead of showing all 4 action forms simultaneously, show only the relevant one based on shipment status:

```typescript
function getAvailableAction(status: string) {
  switch (status) {
    case 'pending_pickup':
    case 'pending':
      return <AssignDriverForm />;
    case 'assigned':
    case 'picked_up':
      return <UpdateStatusForm />;
    case 'in_transit':
    case 'out_for_delivery':
      return <DeliveryAttemptForm />;
    case 'delivery_attempted':
      return <CompleteDeliveryForm />;
    case 'delivered':
    case 'returned':
    case 'cancelled':
      return null; // No actions — show summary only
    default:
      return <UpdateStatusForm />;
  }
}
```

Display the shipment info at top (always visible) and ONE action panel at bottom.

### 3.5 — Warehouse Hub Dashboard (New Page)

**File**: `src/features/warehouse/pages/WarehouseHubPage.tsx` (NEW)

Create a central warehouse dashboard with:
- 4 stat cards: Inbound (pending), Inventory (total units), Outbound (ready to pick), Returns (awaiting inspection)
- Barcode search bar (prominent, at the top)
- Urgent tasks list (pending receipts, overdue picks, returns awaiting inspection)
- Each card links to its detailed page

---

## Phase 4: UX Enhancements

### 4.1 — Quick Actions Bar
Add a horizontal bar below the header with common actions:
```
[➕ New Order] [📦 Receive Goods] [🔍 Track Shipment] [💰 Record Payment]
```
Visible only on Admin portal. Buttons are permission-controlled.

### 4.2 — Bulk Operations
Enhance data tables to support:
- Multi-row selection with checkboxes
- Bulk assign driver to multiple shipments
- Bulk confirm multiple orders
- Bulk print labels

### 4.3 — Smart Defaults
- If merchant has only one pricing plan → auto-select it
- If governorate selected → filter areas automatically (already may exist, verify)
- If order type = "return" → auto-set fulfillment to "pickup_from_customer"
- Suggest last assigned driver for same area

### 4.4 — Command Palette (Ctrl+K)
Global search overlay that allows:
- Search orders, shipments, merchants by ID or name
- Quick navigate to any page
- Execute common actions

---

## File Map

### Key Files to Modify

| File | Phase | Change |
|------|-------|--------|
| `tailwind.config.js` | 1 | Replace hardcoded colors with CSS var references |
| `src/index.css` | 1 | Add CSS custom property defaults |
| `src/shared/branding/useBranding.ts` | 1 | Update/create brand config provider |
| `src/layouts/DashboardLayout.tsx` | 2 | Restructure admin sidebar nav items into groups |
| `src/layouts/MerchantLayout.tsx` | 2 | Restructure merchant sidebar nav items into groups |
| `src/shared/components/layout/AppShell.tsx` | 2 | Add collapsible group support to sidebar |
| `src/features/merchants/pages/MerchantDetailsPage.tsx` | 3 | Reduce from 10 tabs to 4 |
| `src/features/merchant-portal/integrations/pages/MerchantIntegrationsPage.tsx` | 3 | Remove tabs, single scrollable page |
| `src/features/orders/components/OrderForm.tsx` | 3 | Convert to 3-step wizard |
| `src/features/shipments/pages/ShipmentDetailsPage.tsx` | 3 | Context-aware single action panel |
| `src/features/warehouse/pages/WarehouseHubPage.tsx` | 3 | NEW — warehouse hub dashboard |
| `src/app/router.tsx` | 2,3 | Update routes for merged pages + new hub |

### Key Files — DO NOT Modify (for reference only)
| File | Purpose |
|------|---------|
| `src/shared/components/ui/Tabs.tsx` | Shared Tabs component — keep as is |
| `src/shared/theme/ThemeProvider.tsx` | Theme provider — extend, don't replace |
| `src/features/merchant-portal/orders/components/MerchantOrderForm.tsx` | Merchant order form — apply same wizard pattern |
