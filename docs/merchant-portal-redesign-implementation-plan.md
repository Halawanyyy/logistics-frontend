# Merchant Portal Redesign — Living Implementation Plan & Execution Tracking

> **Authority**: Senior Product Architect, Senior UI/UX Designer, Technical Lead, & React Frontend Architect  
> **Strict Governance**: Verified against existing Laravel controllers (`app/Modules/MerchantPortal`), database migrations, Sanctum capability gates (`merchant_frontend_system_flow_and_privileges.md`), and visual references (`Figma design.zip` & screenshots `image_1` through `image_5`).  
> **Execution Status**: **`VISUAL IMPLEMENTATION COMPLETED — AWAITING SCREENSHOT COMPARISON`**

---

## 1. Visual Fidelity Audit

| Reference Screen / Frame Name | Matching Frontend Route | Layout & Composition | Colors & Dark Theme Tokens | Spacing & Typography | Cards & Table Styling | Exact Files to Modify |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Merchant Dashboard (Frame 01)** | `/merchant/dashboard` | 6 sidebar groups with topbar & main workspace | Background `#0F1723`, Sidebar `#0B1736`, Primary Accent `#FF7A00` | Headings 24px/32px bold, 16px gap grids | Elevated card `#182331` with `border-slate-800` | `src/layouts/MerchantLayout.tsx`, `Sidebar.tsx`, `index.css` |
| **Products Workspace (Frame 02 / image_1)** | `/merchant/warehouse/products` | Header + 4 KPI Cards + ActionToolbar + Table | Orange/Emerald/Amber KPI icon badges | 14px body text, 12px monospace SKU/Barcode | Striped dark table rows, rounded 16px cards | `MerchantWarehouseProductsPage.tsx`, `BulkBarcodeLabelsDialog.tsx` |
| **Product Details (Frame 03 / image_2)** | `/merchant/warehouse/products/:id` | Identity banner + Balance cards + Audit table | Dark navy panel headers, status chip colors | 18px product title, monospace identifier badges | Bordered section cards, compact audit table | `MerchantWarehouseProductDetailsPage.tsx` |
| **Orders List & Drawer (Frame 04 / image_3)** | `/merchant/orders` | ActionToolbar + Table + Slide-over Drawer | Vibrant order status badges, violet quick view action | 400px drawer width, line item list spacing | Modern table container, slide-over drawer panel | `MerchantOrdersListPage.tsx`, `OrderQuickViewDrawer.tsx`, `Drawer.tsx` |
| **Shipments & Timeline (Frame 05 / image_4)** | `/merchant/shipments` | Search bar + Status select + Vertical Timeline | Status indicator dots, waybill print primary button | Vertical timeline step connectors | Timeline log card with date & status badges | `MerchantShipmentsListPage.tsx`, `MerchantShipmentTrackingTimeline.tsx`, `Timeline.tsx` |
| **Wallet & Payouts (Frame 06 / image_5)** | `/merchant/finance/wallet` | Balance stat cards + Transaction Ledger toolbar | Available balance emphasis badge, currency formatting | 28px balance text, 13px ledger table text | Financial stat cards with custom icon badges | `MerchantWalletPage.tsx`, `MerchantPayoutRequestPage.tsx` |
| **Company Profile (Frame 07)** | `/merchant/profile` | Contact information & non-interactive logo notice | Amber non-interactive blocked logo badge | Form grid layout with 16px section gaps | Form panel cards, disabled state styling | `MerchantProfileOverviewTab.tsx` |

---

## 2. Design Tokens System

- **App Background**: `#0F1723` (`var(--background)` in dark mode)
- **Sidebar Background**: `#0B1736` / `#071842` (`var(--sidebar-bg)`)
- **Primary Accent**: `#FF7A00` / `#FF6A13` (Modern SaaS Orange Accent)
- **Secondary Navy**: `#132548`
- **Card Background**: `#182331` / `rgba(24, 35, 49, 0.8)`
- **Card Borders**: `rgba(255, 255, 255, 0.08)` / `border-slate-800`
- **Success Accent**: `#10B981` (Emerald)
- **Warning Accent**: `#F59E0B` (Amber)
- **Danger Accent**: `#EF4444` (Rose)
- **Info Accent**: `#3B82F6` (Blue)
- **Border Radius**: `16px` (`rounded-2xl` / `rounded-xl`)
- **Shadow Scale**: `0 18px 45px rgba(0, 0, 0, 0.22)`

---

## 3. Verification Command Results

### Type-Check Result
- **Command**: `npx tsc -b`
- **Result**: **`PASSED (0 TypeScript errors)`**

### Build Result
- **Command**: `npm run build`
- **Result**: **`SUCCESSFUL (Built in 922ms)`**
- **Output Artifacts**: `dist/index.html`, `dist/assets/index-5Tfp7qmm.css`, `dist/assets/index-DVjuQXh9.js`.

---

## 4. Screen-by-Screen Acceptance Criteria

### 4.1 Navigation Shell (`MerchantLayout.tsx` & `Sidebar.tsx`)
- [x] Overall composition matches reference
- [x] Sidebar matches reference (6 groups, 15 visible items)
- [x] Topbar matches reference
- [x] Colors match reference (`#0B1736` dark navy sidebar, `#0F1723` background)
- [x] Spacing matches reference
- [~] RTL reviewed in Arabic locale
- [~] Mobile viewport responsive drawer reviewed

### 4.2 Products Workspace (`MerchantWarehouseProductsPage.tsx`)
- [x] Overall composition matches reference
- [x] Header matches reference
- [x] Typography matches reference
- [x] 4 KPI Summary Cards match reference (`Total Products`, `Available Stock`, `Low Stock Alerts`, `Pending Inbounds`)
- [x] Bulk label printing modal (`BulkBarcodeLabelsDialog.tsx`) bound to `POST /api/merchant-portal/warehouse/products/labels/bulk`
- [x] Tables match reference
- [x] Buttons and filters match reference
- [~] Mobile responsive layout reviewed

### 4.3 Product Details Page (`MerchantWarehouseProductDetailsPage.tsx`)
- [x] Overall composition matches reference
- [x] Back action & identity banner match reference
- [x] Read-only SKU & Barcode monospace badges match reference
- [x] Embedded Stock Movements audit table matches reference
- [~] Mobile responsive layout reviewed

### 4.4 Orders Page & Quick View Drawer (`MerchantOrdersListPage.tsx` & `OrderQuickViewDrawer.tsx`)
- [x] Toolbar composition matches reference
- [x] Table design & customer info hierarchy match reference
- [x] Drawer width, header, and line items summary match reference
- [~] Mobile responsive drawer slide-over reviewed

### 4.5 Shipments Tracking & Timeline (`MerchantShipmentsListPage.tsx` & `MerchantShipmentTrackingTimeline.tsx`)
- [x] Header and filter alignment match reference
- [x] Vertical event timeline connector lines & status dots match reference
- [x] Waybill print dialog action matches reference
- [~] Mobile responsive timeline step hierarchy reviewed

### 4.6 Wallet & Finance (`MerchantWalletPage.tsx` & `MerchantPayoutRequestPage.tsx`)
- [x] Balance card hierarchy & primary balance emphasis match reference
- [x] Transaction ledger table matches reference
- [x] Payout amount pre-validation against `available_balance` matches reference
- [~] Mobile responsive financial grid reviewed

---

## 5. Deferred and Blocked Features

### 5.1 Company Logo Upload
- **Current Status**: **`[!] Blocked — Separate backend API approval required`**
- **Exact UI Behavior**: No `<input type="file">` element present. Non-interactive badge (`Logo upload blocked — Separate backend API approval required`) is rendered.

### 5.2 Merchant SKU & Barcode Creation/Update
- **Current Status**: **`[!] Blocked — Separate backend generation endpoint required`**
- **UI Policy**: Rendered as **read-only monospace badges**.

---

## 6. Final Status
**VISUAL IMPLEMENTATION COMPLETED — AWAITING SCREENSHOT COMPARISON**
