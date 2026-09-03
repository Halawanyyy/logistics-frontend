# Codex Prompts — UI/UX Improvement Execution

> Each prompt is designed to be self-contained and executable by Codex independently.
> Execute them in order: Phase 1 → Phase 2 → Phase 3 → Phase 4.

---

## Phase 1 Prompt: Dynamic Brand Identity System

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

Read the full improvement plan at: docs/UI_UX_IMPROVEMENT_PLAN.md (Phase 1 section)

TASK: Implement a dynamic brand theming system that replaces the hardcoded purple (#6D4AFF) color with CSS custom properties, allowing each company to use their own brand colors.

CURRENT STATE:
- tailwind.config.js has hardcoded colors: brand=#6D4AFF, brand-50=#EEE9FF, brand-500=#6D4AFF, brand-600=#4F2FD8, primary=#6D4AFF, primary-dark=#4F2FD8, primary-light=#EEE9FF
- There is an existing file: src/shared/branding/useBranding.ts
- There is an existing file: src/shared/theme/ThemeProvider.tsx
- Global CSS is at: src/index.css

STEPS:

1. In src/index.css, add CSS custom properties at the top in :root:
   --brand-primary: 109 74 255;       (RGB for #6D4AFF — default fallback)
   --brand-primary-dark: 79 47 216;   (RGB for #4F2FD8)
   --brand-primary-light: 238 233 255; (RGB for #EEE9FF)

2. In tailwind.config.js, update ONLY the brand/primary colors to reference CSS variables using the rgb() with alpha pattern:
   brand: 'rgb(var(--brand-primary) / <alpha-value>)'
   'brand-50': 'rgb(var(--brand-primary-light) / <alpha-value>)'
   'brand-500': 'rgb(var(--brand-primary) / <alpha-value>)'
   'brand-600': 'rgb(var(--brand-primary-dark) / <alpha-value>)'
   primary: 'rgb(var(--brand-primary) / <alpha-value>)'
   'primary-dark': 'rgb(var(--brand-primary-dark) / <alpha-value>)'
   'primary-light': 'rgb(var(--brand-primary-light) / <alpha-value>)'

   DO NOT change: surface, surface-dark, surface-elevated, background, background-dark, content, muted, border, success, warning, danger, info, boxShadow, borderRadius, fontFamily

3. Update or create src/shared/branding/BrandProvider.tsx:
   - Create a BrandConfig interface: { companyName: string, logoUrl: string|null, primaryColor: string, secondaryColor?: string }
   - Create a generatePalette(hexColor: string) function that:
     a. Converts hex to HSL
     b. Generates shades: 50 (L=95%), 100 (L=90%), 200 (L=80%), 300 (L=70%), 400 (L=60%), 500 (L=base), 600 (L=base-10%), 700 (L=base-20%), 800 (L=base-30%), 900 (L=base-40%)
     c. Returns RGB values for each shade
   - Create applyBrandColors(primaryHex: string) that sets CSS variables on document.documentElement:
     --brand-primary, --brand-primary-dark (shade 600), --brand-primary-light (shade 50)
   - Create a React context BrandContext with provider that:
     a. Stores brand config in state
     b. Calls applyBrandColors when config changes
     c. Provides { brandConfig, updateBrandConfig, isLoading }
   - Export useBrand() hook

4. Update the existing useBranding.ts to re-export from the new BrandProvider if needed, maintaining backward compatibility.

5. Wrap the app with BrandProvider in src/App.tsx or src/main.tsx (wherever the providers are).

CRITICAL RULES:
- DO NOT break any existing functionality
- DO NOT modify functional colors (success, warning, danger, info)
- DO NOT change any component files — the CSS variable approach means all components automatically pick up the new colors
- Ensure the default values in :root match the current purple so nothing changes visually until a brand config is applied
- Run: npm run build — to verify no build errors
```

---

## Phase 2 Prompt: Sidebar Restructuring

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

Read the full improvement plan at: docs/UI_UX_IMPROVEMENT_PLAN.md (Phase 2 section)

TASK: Restructure the admin and merchant sidebars from flat lists (40+ and 16+ items) into collapsible groups (8 and 6 groups respectively).

KEY FILES:
- src/layouts/DashboardLayout.tsx — Admin sidebar menu items
- src/layouts/MerchantLayout.tsx — Merchant sidebar menu items
- src/shared/components/layout/AppShell.tsx — Sidebar rendering component

STEPS:

1. Update AppShell.tsx to support collapsible nav groups:
   - Add two types: NavGroup (with children array, icon, label, defaultOpen) and NavItem (with path, icon, label, permission)
   - type SidebarItem = NavGroup | NavItem
   - Render groups with a clickable header that toggles open/close
   - Add a chevron icon that rotates on open/close (use CSS transform rotate)
   - Auto-expand the group containing the currently active route (use useLocation from react-router-dom)
   - Save open/closed state per group in localStorage key "sidebar-groups-state"
   - Add smooth height animation for open/close (use CSS transition on max-height or use a simple state + overflow hidden approach)
   - Indented children: add left padding (pl-8 or similar) to child items

2. Update DashboardLayout.tsx — Reorganize nav items into these groups:

   📊 Dashboard                       → standalone link to /admin/dashboard
   
   📋 Operations                      → collapsible group (defaultOpen: true)
      ├── Orders                      → /admin/orders
      ├── Shipments                   → /admin/shipments
      └── Driver Manifests            → /admin/driver-manifests
   
   🏪 Merchants                       → standalone link to /admin/merchants
   
   🚗 Drivers                         → standalone link to /admin/drivers
   
   💲 Pricing                         → collapsible group
      ├── Governorates                → /admin/governorates
      ├── Areas                       → /admin/areas
      ├── Shipping Rates              → /admin/shipping-rates
      └── Pricing Plans               → /admin/pricing-plans
   
   📦 Warehouse                       → collapsible group
      ├── Warehouses                  → /admin/warehouses
      ├── Products                    → /admin/warehouse/products
      ├── Company Catalog             → /admin/company-catalog
      ├── Inventory                   → /admin/warehouse/inventory-stocks
      ├── Warehouse Receipts          → /admin/warehouse/receipts
      ├── Inbound Requests            → /admin/warehouse/inbound-requests
      ├── Picking Lists               → /admin/warehouse/picking-lists
      ├── Packing Tasks               → /admin/warehouse/packing-tasks
      ├── Returns                     → /admin/warehouse/returns
      └── Barcode Lookup              → /admin/warehouse/barcode-lookup
   
   💰 Finance                         → collapsible group
      ├── Overview                    → /admin/finance
      ├── Payouts                     → /admin/finance/payouts
      ├── Invoices                    → /admin/finance/invoices
      ├── Expenses                    → /admin/finance/expenses
      ├── Treasury Accounts           → /admin/finance/treasury-accounts
      └── Treasury Transactions       → /admin/finance/treasury-transactions
   
   ⚙️ Settings                        → collapsible group
      ├── Users                       → /admin/users
      ├── Roles                       → /admin/roles
      ├── Audit Logs                  → /admin/audit-logs
      ├── Exports                     → /admin/exports
      └── Settings                    → /admin/settings

   IMPORTANT: Keep ALL existing paths/routes unchanged. Only reorganize visual grouping.
   IMPORTANT: Keep all existing permission checks on nav items.
   IMPORTANT: Verify exact paths by reading the current DashboardLayout.tsx before making changes.

3. Update MerchantLayout.tsx — Reorganize nav items into these groups:

   📊 Dashboard                       → standalone link
   
   📋 Orders & Shipments              → collapsible group (defaultOpen: true)
      ├── Orders
      └── Shipments
   
   📦 Warehouse                       → collapsible group
      ├── Products
      └── Inbound Requests
   
   💰 Finance                         → collapsible group
      ├── Wallet / Overview
      ├── Invoices
      └── Payouts
   
   🔗 Integrations                    → standalone link
   
   ⚙️ Settings                        → collapsible group
      ├── Profile
      ├── Portal Users
      ├── Notifications
      └── Attachments

   IMPORTANT: Verify exact paths by reading the current MerchantLayout.tsx before making changes.

CRITICAL RULES:
- Read the current DashboardLayout.tsx and MerchantLayout.tsx FIRST to get the exact nav items and their paths
- DO NOT change any routes in router.tsx
- DO NOT remove any nav items — only reorganize them visually
- Keep all existing permission/capability checks
- The sidebar should look clean with proper icons and indentation
- Run: npm run build — to verify no build errors
```

---

## Phase 3 Prompt: Pages & Tabs Simplification

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

Read the full improvement plan at: docs/UI_UX_IMPROVEMENT_PLAN.md (Phase 3 section)

TASK: Simplify complex pages by reducing tabs, converting the order form to a wizard, and adding context-aware actions to shipment details.

KEY FILES:
- src/features/merchants/pages/MerchantDetailsPage.tsx — 10 tabs → 4 tabs
- src/features/merchant-portal/integrations/pages/MerchantIntegrationsPage.tsx — 3 tabs → 1 page
- src/features/orders/components/OrderForm.tsx — single form → 3-step wizard
- src/features/shipments/pages/ShipmentDetailsPage.tsx — 4 simultaneous forms → context-aware
- src/app/router.tsx — update routes if needed

STEPS:

### Step 1: Create a reusable StepWizard component

Create src/shared/components/ui/StepWizard.tsx:
- Props: steps: { title: string, icon?: ReactNode, component: ReactNode }[], onComplete: (data) => void
- Renders a step indicator at the top (circles connected by lines, filled=completed, outlined=current, gray=future)
- Shows current step's component
- "Back" and "Next" buttons at bottom
- "Next" triggers step validation before proceeding
- Final step shows "Review & Submit" button instead of "Next"
- Clean, modern design using brand colors (bg-brand, text-brand, etc.)
- Responsive: works on both desktop and mobile

### Step 2: Convert OrderForm to Wizard

Refactor src/features/orders/components/OrderForm.tsx:
- Read the current form carefully to understand ALL fields and validations
- Split into 3 step components (these can be in the same file or separate files in the same folder):

  Step1BasicInfo: merchant_id, order_type, fulfillment_type, priority, notes
  Step2CustomerInfo: customer_name, customer_phone, customer_email, governorate_id, area_id, delivery_address, secondary_phone
  Step3ItemsPayment: items[] (manual items), warehouse_items[] (inventory items), packaging_items[], payment_type, cod_amount

- Add a Review step that displays all entered data in read-only format with "Edit" links that jump to the relevant step
- Keep the SAME zod schema and react-hook-form setup — just split the validation per step
- Each step validates its own fields before allowing "Next"
- The final submit sends the SAME API payload as before
- DO NOT change the API contract or data structure

Also apply the same wizard pattern to:
  src/features/merchant-portal/orders/components/MerchantOrderForm.tsx

### Step 3: MerchantDetailsPage — Reduce tabs from 10 to 4

Read the current MerchantDetailsPage.tsx to understand the exact tab structure.
Consolidate into 4 tabs:

Tab "Overview":
  - Merchant basic info (from old Overview tab)
  - Quick stats cards
  - Shop Preview section (from old Shop Preview tab)

Tab "Operations":
  - Sub-section or sub-tabs: Orders | Shipments | Warehouse
  - Each sub-section shows the same content as the old individual tabs

Tab "Finance":
  - Wallet info (from old Wallet tab)
  - Invoices table (from old Invoices tab)
  - Related attachments

Tab "Settings":
  - Portal Users management (from old Portal Users tab)
  - Integration Tokens (from old Integration Tokens tab)
  - General Attachments (from old Attachments tab)

Update router.tsx nested routes if needed.

### Step 4: MerchantIntegrationsPage — Remove tabs

Convert src/features/merchant-portal/integrations/pages/MerchantIntegrationsPage.tsx from tabbed layout to a single scrollable page with 3 sections:
  Section 1: "API Tokens" — token management with card UI
  Section 2: "API Documentation" — embedded docs
  Section 3: "Test Integration" — test tool
Add section headers with dividers between them.

### Step 5: ShipmentDetailsPage — Context-Aware Actions

Refactor src/features/shipments/pages/ShipmentDetailsPage.tsx:
- Keep the shipment info/details section at the top (always visible)
- Replace the 4 simultaneous action forms with a single "Actions" panel
- The Actions panel renders ONLY the relevant form based on shipment.status:
  - pending/pending_pickup → AssignDriverForm
  - assigned/picked_up → UpdateStatusForm
  - in_transit/out_for_delivery → DeliveryAttemptForm
  - delivery_attempted → CompleteDeliveryForm
  - delivered/returned/cancelled → No form, just a "Completed" summary card
- Add a header to the action panel like "Next Action" or "Available Action"
- Keep all existing form components — just conditionally render them

CRITICAL RULES:
- Read each file CAREFULLY before modifying
- DO NOT change any API calls or data contracts
- DO NOT remove any functionality — only reorganize the UI
- Keep all existing permission checks
- Run: npm run build — to verify no build errors after each step
```

---

## Phase 4 Prompt: UX Enhancements

```
You are working on a React 19 + Vite + TypeScript + Tailwind CSS logistics frontend at: e:\logistics\logistics-frontend

Read the full improvement plan at: docs/UI_UX_IMPROVEMENT_PLAN.md (Phase 4 section)

TASK: Add UX enhancements: Quick Actions bar, Command Palette, Smart Defaults, and Bulk Operations.

KEY FILES:
- src/layouts/DashboardLayout.tsx — Add Quick Actions bar
- src/shared/components/layout/AppShell.tsx — Add Command Palette
- src/features/orders/components/OrderForm.tsx — Add smart defaults
- src/features/shipments/pages/ShipmentsListPage.tsx — Add bulk operations
- src/features/orders/pages/OrdersListPage.tsx — Add bulk operations

STEPS:

### Step 1: Quick Actions Bar

Create src/shared/components/layout/QuickActionsBar.tsx:
- A horizontal bar with 4 action buttons: New Order, Receive Goods, Track Shipment, Record Payment
- Each button has an icon and label
- Clicking opens the relevant page or a modal
- Only visible in Admin portal (DashboardLayout)
- Buttons are permission-controlled (wrap with RequirePermission)
- Style: subtle background (bg-brand-50 or surface), rounded buttons with hover effects
- Place it below the top header bar, above the page content

Add it to DashboardLayout.tsx.

### Step 2: Command Palette (Ctrl+K)

Create src/shared/components/ui/CommandPalette.tsx:
- Modal overlay triggered by Ctrl+K (or Cmd+K on Mac)
- Search input at top with auto-focus
- Results grouped by type: Pages, Orders, Shipments, Merchants
- Static results: all page links (Dashboard, Orders, Shipments, etc.)
- Dynamic results: search orders/shipments/merchants by typing (debounced API call)
- Keyboard navigation: arrow keys to navigate, Enter to select, Esc to close
- Clean modern design with backdrop blur

Register the keyboard shortcut globally in AppShell.tsx or DashboardLayout.tsx.

### Step 3: Smart Defaults for OrderForm

In the order form (wizard from Phase 3):
- If only one pricing plan exists for the selected merchant → auto-select it
- When governorate_id changes → filter area options to only show areas in that governorate (verify if already implemented; if so, skip)
- When order_type = "return" → auto-set fulfillment_type to "pickup_from_customer"
- When order_type = "exchange" → show both pickup and delivery sections

### Step 4: Bulk Operations for List Pages

Create src/shared/components/ui/BulkActionBar.tsx:
- A sticky bar that appears at bottom when rows are selected
- Shows: "{N} items selected" + action buttons
- Animations: slide up when items selected, slide down when deselected

For ShipmentsListPage:
- Add checkbox column to the table
- Bulk actions: Assign Driver, Print Labels, Update Status
- "Assign Driver" opens a driver selection modal that applies to all selected shipments

For OrdersListPage:
- Add checkbox column
- Bulk actions: Confirm Orders, Print Labels, Delete Draft Orders

CRITICAL RULES:
- Read each file CAREFULLY before modifying
- DO NOT change any API calls or data contracts
- Keep all existing functionality
- Use brand colors for all new UI elements
- Run: npm run build — to verify no build errors
```

---

## Execution Order

| # | Phase | Prompt | Estimated Time |
|---|-------|--------|---------------|
| 1 | Brand Identity | Phase 1 Prompt | 1-2 hours |
| 2 | Sidebar | Phase 2 Prompt | 1-2 hours |
| 3 | Pages & Tabs | Phase 3 Prompt | 3-4 hours |
| 4 | UX Enhancements | Phase 4 Prompt | 2-3 hours |

> **Important**: Execute Phase 1 first — all other phases depend on the brand color system being in place. Phase 2 and 3 can be run in parallel after Phase 1 is complete. Phase 4 depends on Phase 3 (especially Smart Defaults depends on the Wizard from Phase 3).
