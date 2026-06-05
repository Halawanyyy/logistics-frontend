# Frontend Full API + Flow Implementation Checklist

## Latest Backend Sync Pass
- [x] Latest backend docs reviewed
- [x] Current frontend checklist reviewed
- [x] Current frontend audit reviewed
- [x] Warehouse Phase 2 gaps identified
- [x] Label printing gaps identified
- [x] Localization gaps identified
- [x] Orders/Shipments final filter and lifecycle changes reviewed
- [x] Merchant Portal backend scope reviewed
- [x] Admin-only vs merchant-portal frontend decision documented
- [x] API clients updated
- [x] TypeScript types updated
- [x] UI pages/actions updated
- [x] Sidebar updated only for implemented pages
- [x] Audit updated
- [x] Manual build command provided

Latest backend sync module status:
- [x] Warehouse Receipts list/create/edit/detail/confirm/cancel implemented
- [x] Warehouse Transfers list/create/edit/detail/confirm/dispatch/receive/cancel implemented
- [x] Warehouse order workflow actions and shipment-creation gate implemented
- [x] Warehouse returns staged lifecycle actions implemented
- [~] Low-stock and warehouse filter expansion implemented without separate KPI/quick-card treatment
- [~] Label printing implemented across product/shipment/order/bin/admin surfaces, with manifest formatted print and bulk flows; dedicated bin details page still does not exist
- [~] Localization preference/header support implemented and key `*_label` fields are used on updated surfaces, but not every legacy screen is fully label-first yet
- [x] Orders and shipments final filters/lifecycle updates implemented
- [-] Merchant Portal UI routes not required now because this project remains admin-only and has no `/merchant` app namespace
- [x] Admin-side merchant portal users management implemented inside merchant details
- [x] Merchant inbound stock request admin review page implemented
- [x] Seed/demo-data note updated for API-driven selectors and non-hardcoded ids
- [x] Security/download alignment preserved for download endpoints, redacted tracking expectations, and token visibility rules

Manual validation notes:
- [x] `npm run build` passed after implementation
- [ ] Manual smoke tests not run yet

## Optional UX Polish Pass
- [x] Optional UX polish scope reviewed from latest follow-up note
- [x] Low-stock quick cards / summary widgets added using real backend low-stock endpoints
- [x] Dedicated warehouse bin details page added with view, print label, copy barcode, edit, and delete flows
- [~] Broader localization adoption extended across more legacy screens, but app-wide label-first rendering is still not complete everywhere
- [~] Safe RTL support added for Arabic with logical CSS properties and targeted layout reversals, while full legacy-screen RTL audit remains incomplete
- [x] Dashboard charts/summary polish improved using only documented summary/report fields
- [x] Dashboard grid composition tightened to remove dead space and improve panel balance without changing backend data contracts
- [x] Finance Snapshot widget upgraded to a clearer real-data summary with COD gap, net profit, and payout context
- [x] Topbar hamburger now cleanly toggles desktop sidebar collapse and mobile drawer visibility without layout overlap
- [x] Topbar global search now queries existing APIs/routes and opens grouped results
- [~] Searchable dropdown coverage expanded across remaining high-traffic warehouse and finance flows, while smaller enums and some legacy selects remain native
- [x] Role permissions editor replaced with a searchable grouped multi-select while preserving backend permission ids/slugs
- [x] `react-i18next` frontend UI localization configured and connected to the existing locale preference/header flow
- [x] Status badge tone mapping corrected so `inactive` and similar states no longer collide with positive/active styling
- [x] Company Settings helper notes and branding layout refined without changing settings API behavior
- [x] Topbar global search respects module view permissions before querying or showing results
- [x] Checklist updated honestly for the polish pass
- [x] Audit updated honestly for the polish pass
- [x] `npm run build` passed after the polish pass
- [ ] Manual smoke tests not run yet

Optional UX polish status:
- [x] Warehouse KPIs page now shows low-stock quick cards with direct links to low-stock inventory/products
- [x] Warehouse products page now shows low-stock quick summary and one-click filter/access actions
- [x] Inventory stocks page now shows low-stock quick summary and one-click filter/access actions
- [x] Warehouse bins list now links to a dedicated details page
- [x] Warehouse bin details page supports label printing and barcode copy
- [x] Dashboard layout composition now uses a tighter grid that removes the visible empty-gap issue between primary panels
- [x] Dashboard finance snapshot now presents real backend money states in a clearer summary widget instead of the older generic chart treatment
- [~] Dashboard localization improved for recent status displays, settings/dashboard shell copy, and finance formatting, and additional auth/orders/shipments/finance/location/driver screens now use translated static UI, but broader legacy adoption remains incremental
- [~] Safe Arabic RTL support now flips shared shell/layout primitives and dropdown alignment without changing backend locale behavior; remaining older page layouts still need visual audit
- [x] Dashboard shipment progress / assignment polish added without inventing metrics
- [x] Topbar hamburger/sidebar interaction now uses separate desktop-collapse and mobile-drawer states for cleaner responsive behavior
- [x] Topbar search now uses existing Orders, Shipments, Merchants, Drivers, and Warehouse Products list flows with grouped clickable results
- [~] Searchable selectors expanded for merchant, driver/assignee, warehouse, treasury account, governorate, area, pricing plan, warehouse product, warehouse shared record forms, finance shared record forms, and other long-list admin forms; some smaller enums and legacy list filters remain native
- [x] Role permission selection now uses a searchable grouped multi-select instead of a long checkbox checklist
- [x] `react-i18next` is now implemented for static shared UI plus major admin pages while preserving backend locale headers and backend `*_label` business/status rendering
- [x] Shared status badges now distinguish inactive/draft/disabled states from active/success states with explicit tone mapping
- [x] Company Settings informational notes now render as neutral helper text instead of error-red messaging, and the branding/settings cards are visually cleaner
- [x] Enter from topbar search now routes into an existing permitted list page using URL search params, and touched list screens honor that initial query

## Focused Frontend Polish Pass
- [x] Dashboard shipment-status donut tooltip now shows label, count, and percentage with dark/light-safe styling
- [x] Shared status badge mappings expanded so operational, finance, and warehouse states no longer collapse into gray by default
- [x] Sidebar groups now behave like dropdown menus with chevrons, active-parent auto-open, and low-risk open-state persistence
- [x] Localization extended further across Finance Reports, Merchant Details, Merchant Profile panels, and Order Details
- [x] Checklist updated honestly for this focused polish pass
- [x] Audit updated honestly for this focused polish pass
- [x] `npm run build` passed after this focused polish pass
- [ ] Manual smoke tests not run yet

Focused polish status:
- [x] Donut/pie tooltip content is now readable and more descriptive without changing backend data contracts
- [x] Status badges now distinguish active/inactive, staged shipment states, wallet directions, and warehouse flow states more clearly
- [x] Every implemented sidebar group with children now supports expand/collapse behavior while preserving permission filtering
- [~] Localization coverage is materially improved on the targeted older pages, but some untouched legacy warehouse/finance/admin dialogs still remain English

## Global Foundation Fix Pass
- [x] 422 field-level validation helper implemented
- [x] 404 NotFound page implemented
- [x] API error normalizer implemented
- [x] API client global error handling reviewed
- [x] Form error display pattern implemented
- [x] PermissionGate implemented
- [x] Can/permission helper reviewed
- [x] Sidebar permission gating completed
- [x] LoadingState component implemented
- [x] ErrorState component implemented
- [x] EmptyState component implemented
- [x] MoneyDisplay component implemented
- [x] DateRangeFilter component implemented
- [x] MerchantSelector component implemented
- [x] DriverSelector component implemented
- [x] GovernorateAreaSelector component implemented
- [x] ConfirmActionModal component implemented
- [x] ApprovalActionButtons component implemented
- [x] PrintView component implemented
- [x] BarcodeScannerInput component implemented
- [x] Timeline shell implemented
- [x] Attachments shell implemented
- [x] ExportButton implemented
- [~] Existing pages migrated where safe
- [x] npm run build passed

## Merchant Profile Completion Pass
- [x] Merchant profile current code audited
- [x] Merchant profile tabs structure reviewed
- [x] Orders tab implemented
- [x] Shipments tab implemented
- [x] Wallet summary client implemented
- [x] Wallet transactions client implemented
- [x] Wallet tab implemented
- [x] Invoices tab implemented
- [x] Integration tokens clients implemented
- [x] Integration tokens tab implemented
- [x] Create token modal implemented
- [x] plain_token shown once only after creation
- [x] Copy token button implemented
- [x] Revoke token action implemented
- [x] Delete token action implemented
- [x] Attachments tab implemented or reusable component connected
- [x] Activity timeline tab implemented or reusable component connected
- [x] Permissions applied to every tab/action
- [x] Loading/error/empty states added
- [x] 422 errors shown where forms exist
- [x] Audit file updated
- [x] Manual build command provided to user

## Orders + Shipments Completion Pass
- [x] Current Orders code audited
- [x] Current Shipments code audited
- [x] Orders filters aligned with API docs
- [x] Orders filters do not reload page
- [x] Orders governorate/area filters fixed
- [x] Orders text search behavior reviewed against docs
- [x] Orders create payment_type rules fixed
- [x] Orders create fulfillment_type rules fixed
- [x] Warehouse products load when fulfillment_type=from_warehouse
- [x] Manual items required only when pickup_from_merchant
- [x] Order shipment creation flow fixed
- [x] Edit/delete hidden after shipment creation where rules/settings require
- [x] Stock reservation section shown only for from_warehouse
- [x] Order activity timeline tab implemented if Timeline API exists
- [x] Shipments filters aligned visually with Orders
- [x] Shipments filters do not reload page
- [x] Shipments governorate/area filters fixed
- [x] Assign driver modal confirmed working
- [x] Update status modal confirmed working
- [x] Complete delivery API client implemented
- [x] Complete delivery item-level UI implemented
- [x] Delivery attempts list API client implemented
- [x] Delivery attempt create API client implemented
- [x] Delivery attempts UI implemented
- [~] Shipment print flow fixed/polished
- [x] Shipment activity timeline tab implemented if Timeline API exists
- [x] Permissions applied to every action
- [x] Loading/error/empty states added
- [x] 422 field errors shown where forms exist
- [x] Audit file updated
- [x] Manual build command provided to user

## Remaining Modules Completion Pass
- [x] Current Driver Manifests code audited
- [x] Current Finance advanced code audited
- [x] Current Warehouse advanced code audited
- [x] Current Barcode code audited
- [x] Current Audit Logs code audited
- [x] Current Attachments code audited
- [x] Current Exports code audited

Driver Manifests:
- [x] Driver manifests API clients implemented
- [x] Driver manifests types implemented
- [x] Driver manifests list page implemented
- [x] Generate manifest flow implemented
- [x] Manifest details page implemented
- [x] Close manifest flow implemented
- [x] Manifest print flow implemented
- [x] Manifest permissions applied

Finance:
- [x] Merchant wallet transaction details implemented
- [x] Wallet approve/reject implemented
- [x] Payout approve/reject/complete implemented
- [x] Expense approve/reject/mark-paid implemented
- [x] Treasury accounts CRUD implemented
- [x] Treasury transactions list implemented
- [x] Reconciliation summary implemented
- [x] Company profit summary implemented
- [x] Daily cash report implemented
- [x] Merchant ledger report implemented
- [x] Driver discrepancies report implemented
- [x] Warehouse revenue report implemented
- [x] Profit/loss report implemented
- [x] Finance permissions applied

Warehouse Advanced:
- [x] Warehouse zones list/create implemented
- [x] Warehouse shelves list/create implemented
- [x] Warehouse bins list/create implemented
- [x] Picking lists list implemented
- [x] Picking list generate implemented
- [x] Picking list scan-pick implemented
- [x] Picking list cancel implemented
- [x] Packing tasks list implemented
- [x] Packing task generate implemented
- [x] Packing task complete implemented
- [x] Storage fee rules list/create implemented
- [x] Storage fees generate implemented
- [x] Pick & pack fee rules list/create implemented
- [x] Pick & pack fees generate implemented
- [x] Warehouse KPIs implemented
- [x] Warehouse advanced permissions applied

Barcode:
- [x] Barcode lookup API/client/page implemented
- [x] Shipment status scan API/client/page implemented
- [x] Product barcode lookup API/client/page implemented
- [x] Focused scanner input used
- [x] Enter key submits scan
- [x] Barcode permissions applied

Audit Logs:
- [x] Audit logs API clients implemented
- [x] Global audit logs page implemented
- [x] Audit logs filters implemented
- [~] Reusable Timeline connected to API
- [x] Timeline added to order details if not already
- [x] Timeline added to shipment details if not already
- [x] Timeline added to merchant details if not already
- [x] Timeline added to finance details where applicable
- [x] Timeline added to warehouse product details where applicable
- [x] Sensitive fields hidden
- [x] Audit permissions applied

Attachments:
- [x] Attachments API clients implemented
- [x] Reusable Attachments component fully implemented
- [x] Upload attachment modal implemented
- [x] Attachment list implemented
- [x] Attachment download implemented
- [x] Attachment delete implemented
- [x] Attachments used in merchant details
- [x] Attachments used in order details
- [x] Attachments used in shipment details
- [x] Attachments used in expenses/invoices/warehouse returns where applicable
- [x] Attachment permissions applied

Exports:
- [x] Export API clients implemented
- [x] Export history page implemented
- [x] Generate export modal implemented
- [x] Download export action implemented
- [x] Supported export types represented
- [x] Async-ready UI implemented
- [x] Export permissions applied

Global:
- [x] Sidebar updated for remaining modules
- [x] All sidebar items permission-gated
- [x] Loading/error/empty states added
- [x] 422 errors shown where forms exist
- [x] Audit file updated
- [x] Checklist updated
- [x] Manual build command provided to user

## Final Partial Closure Pass
- [x] Updated API documentation reviewed
- [x] Flow documentation purpose understood
- [x] Warehouse zone form aligned with API docs
- [x] Warehouse shelf form aligned with API docs
- [x] Warehouse bin form aligned with API docs
- [x] Bin barcode is optional in frontend
- [x] Zone/shelf/bin dependent selectors fixed
- [x] Picking list details endpoint implemented
- [x] Packing task details endpoint implemented
- [x] Storage fee rule form aligned with API docs
- [x] Pick & pack fee rule form aligned with API docs
- [x] Old inferred payload notes removed where code now matches docs
- [x] Shipment print-list flow reviewed
- [x] Finance reports rendering reviewed
- [x] Finance timeline auditable types reviewed
- [x] Sidebar links verified
- [x] Audit file updated
- [x] Checklist contradictions cleaned
- [x] Manual build command provided to user

## Source of Truth
- [x] Read docs/api-documentation.md fully
- [x] Read docs/admin_frontend_flows_documentation.md fully
- [x] Confirm old API docs are ignored
- [x] Confirm backend code was not changed

## Global Foundation
- [x] API client uses correct base URL
- [x] Bearer token is sent on protected requests
- [x] 401 redirects to login
- [x] 403 redirects/shows Forbidden page
- [x] 422 shows field-level validation errors
- [x] 404 shows not found state
- [x] RBAC uses backend permissions when available
- [x] Role fallback exists only if permissions are missing
- [x] Sidebar is permission-gated
- [x] Actions are permission-gated
- [~] Loading/error/empty states are consistent
- [x] Dark mode/design system preserved

## Auth
- [x] POST /api/auth/login client
- [x] GET /api/auth/me client
- [x] POST /api/auth/logout client
- [x] GET /api/auth/ping client or intentionally diagnostic
- [x] Login page
- [x] Logout action
- [x] Session bootstrap
- [x] Protected routes

## Dashboard
- [x] GET /api/dashboard/summary client
- [x] Dashboard cards
- [x] Dashboard charts
- [x] date_from/date_to filters
- [x] merchant_id filter
- [x] assigned_driver_id filter
- [x] No frontend financial calculations

## Users
- [x] GET /api/users
- [x] POST /api/users
- [x] GET /api/users/{user}
- [x] PUT /api/users/{user}
- [x] DELETE /api/users/{user}
- [x] POST /api/users/{user}/assign-role
- [x] Users list page
- [x] Create user page
- [x] Edit user page
- [x] User details page
- [x] Role selector
- [x] Permissions preview
- [x] Delete confirmation

## Roles & Permissions
- [x] GET /api/roles
- [x] POST /api/roles
- [x] GET /api/roles/{role}
- [x] PUT /api/roles/{role}
- [x] DELETE /api/roles/{role}
- [x] POST /api/roles/{role}/permissions
- [x] GET /api/permissions
- [x] GET /api/permissions/grouped
- [x] Roles list page
- [x] Create role page/modal
- [x] Edit role page/modal
- [x] Role details page
- [x] Grouped permissions checkboxes
- [x] System roles locked
- [x] Super Admin protected

## Settings
- [x] GET /api/settings
- [x] GET /api/settings/groups
- [x] GET /api/settings/group/{group}
- [ ] GET /api/settings/{setting}
- [ ] PUT /api/settings/{setting}
- [x] PUT /api/settings/bulk-update
- [x] GET /api/public/settings
- [x] Settings groups page
- [x] Dynamic settings form
- [x] Encrypted settings masked
- [x] Non-editable settings disabled
- [x] Bulk update flow

## Merchants
- [x] GET /api/merchants
- [x] POST /api/merchants
- [x] GET /api/merchants/{merchant}
- [x] PUT /api/merchants/{merchant}
- [x] DELETE /api/merchants/{merchant}
- [x] GET /api/merchants/{merchant}/dashboard/summary
- [x] GET /api/merchants/{merchant}/finance/summary
- [x] GET /api/merchants/{merchant}/wallet/summary
- [x] GET /api/merchants/{merchant}/wallet/transactions
- [x] GET /api/merchants/{merchant}/warehouse/inventory
- [x] GET /api/merchants/{merchant}/warehouse/movements
- [x] GET /api/merchants/{merchant}/warehouse/charges
- [x] Merchants list page
- [x] Create merchant page
- [x] Edit merchant page
- [x] Merchant profile page
- [x] Overview tab
- [x] Orders tab
- [x] Shipments tab
- [x] Wallet tab
- [x] Invoices tab
- [x] Warehouse tab
- [x] Integration Tokens tab
- [x] Attachments tab
- [x] Activity Timeline tab
- [x] pricing_plan_id supported

## Merchant Integration Tokens
- [x] GET /api/merchants/{merchant}/integration-tokens
- [x] POST /api/merchants/{merchant}/integration-tokens
- [x] GET /api/merchant-integration-tokens/{token}
- [x] POST /api/merchant-integration-tokens/{token}/revoke
- [x] DELETE /api/merchant-integration-tokens/{token}
- [x] Integration tokens tab
- [x] Create token modal
- [x] Show plain_token once only
- [x] Copy token button
- [x] Revoke action
- [x] Delete action
- [-] GET /api/integrations/me marked Not Required Now for admin UI
- [-] POST /api/integrations/orders marked Not Required Now for admin UI

## Locations & Pricing
- [x] Governorates CRUD clients/pages
- [x] Areas CRUD clients/pages
- [x] Shipping rates CRUD clients/pages
- [x] POST /api/shipping-rates/calculate
- [x] Pricing plans CRUD clients/pages
- [x] Pricing plan rates CRUD clients/pages
- [x] Area dropdown depends on governorate
- [x] Pricing plan rate filters
- [x] Merchant pricing plan selection
- [x] Shipping calculator supports merchant_id/order_type when documented

## Orders
- [x] GET /api/orders
- [x] POST /api/orders
- [x] GET /api/orders/{order}
- [x] PUT /api/orders/{order}
- [x] DELETE /api/orders/{order}
- [x] POST /api/orders/{order}/confirm
- [x] POST /api/orders/{order}/shipments
- [x] POST /api/orders/{order}/reserve-stock
- [x] POST /api/orders/{order}/release-stock
- [x] POST /api/orders/{order}/fulfill-from-warehouse
- [x] GET /api/orders/{order}/stock-reservations
- [x] Orders list page
- [x] Create order page
- [x] Edit order page
- [x] Order details page
- [x] Filters: status
- [x] Filters: order_type
- [x] Filters: fulfillment_type
- [x] Filters: payment_type
- [x] Filters: delivery_status
- [x] Filters: partially_delivered
- [x] Filters: merchant_id
- [x] Filters: date_from/date_to
- [x] Filters: search
- [x] COD disabled when payment_type=prepaid
- [x] Manual items required only for pickup_from_merchant
- [x] Warehouse products loaded when fulfillment_type=from_warehouse
- [x] Swap fields: original_order_id, swap_notes
- [x] Return flow uses pickup_from_customer
- [x] Confirm action
- [x] Create shipment action
- [x] Hide/disable edit/delete when shipment exists if settings disallow
- [x] Stock reservation section/tab for from_warehouse only
- [x] Activity timeline tab

## Shipments
- [x] GET /api/shipments
- [x] GET /api/shipments/{shipment}
- [x] PATCH /api/shipments/{shipment}/status
- [x] POST /api/shipments/{shipment}/assign-driver
- [x] POST /api/shipments/{shipment}/complete-delivery
- [x] GET /api/delivery-attempts
- [x] POST /api/shipments/{shipment}/delivery-attempt
- [x] GET /api/track/{shipment_number}
- [x] Shipments list page
- [x] Shipment details page
- [x] Assign driver modal
- [x] Update status modal
- [x] Complete delivery item-level UI
- [x] Delivery attempt UI
- [x] Public tracking preview/link
- [x] Activity timeline tab
- [x] Printable shipment/manifest flow
- [x] Shipment filters implemented

## Drivers & Daily Manifests
- [x] Drivers CRUD clients/pages
- [x] GET /api/drivers/{driver}/shipments
- [x] GET /api/drivers/{driver}/manifest
- [x] GET /api/drivers/{driver}/cash-expected
- [x] POST /api/driver-manifests/generate
- [x] GET /api/driver-manifests
- [x] GET /api/driver-manifests/{manifest}
- [x] POST /api/driver-manifests/{manifest}/close
- [x] GET /api/driver-manifests/{manifest}/print
- [x] Driver details
- [~] Driver shipments
- [x] Manifest list
- [x] Generate manifest
- [x] Manifest details
- [x] Close manifest
- [x] Print manifest

## Warehouse & Fulfillment
- [x] Warehouses CRUD
- [x] Warehouse products CRUD
- [x] Inventory stocks list/details
- [x] Stock adjustment
- [x] Stock movements list/details
- [x] Stock reservations list
- [x] Warehouse returns list/create/details
- [x] Warehouse charges CRUD
- [x] Warehouse zones list/create
- [x] Warehouse shelves list/create
- [x] Warehouse bins list/create
- [x] Picking lists list/generate/scan/cancel
- [x] Packing tasks list/generate/complete
- [x] Storage fee rules list/create
- [x] Storage fees generate
- [x] Pick & pack fee rules list/create
- [x] Pick & pack fees generate
- [x] Warehouse KPIs
- [x] Barcode scan input used for picking/product lookup where needed

## Barcode Operations
- [x] POST /api/barcodes/lookup
- [x] POST /api/barcodes/scan/shipment-status
- [x] POST /api/barcodes/scan/product-lookup
- [x] Barcode lookup page
- [x] Shipment scan status update
- [x] Product scan lookup
- [x] Focused scanner input
- [x] Enter key submits scan

## Finance
- [x] Merchant wallet summary
- [x] Merchant wallet transactions
- [x] Manual deposit
- [x] Manual withdraw
- [x] Wallet transaction details
- [x] Approve wallet transaction
- [x] Reject wallet transaction
- [x] Merchant payouts CRUD
- [x] Payout approve
- [x] Payout reject
- [x] Payout complete
- [x] Expenses CRUD
- [x] Expense approve
- [x] Expense reject
- [x] Expense mark paid
- [x] Merchant invoices CRUD
- [x] Treasury accounts CRUD
- [x] Treasury transactions list
- [x] Finance reconciliation summary
- [x] Company profit summary
- [x] Daily cash report
- [x] Merchant ledger report
- [x] Driver discrepancies report
- [x] Warehouse revenue report
- [x] Profit/loss report
- [x] No frontend balance calculations

## Audit Logs & Timeline
- [x] GET /api/audit-logs
- [x] GET /api/audit-logs/timeline
- [x] Audit logs page
- [x] Timeline reusable component
- [x] Timeline added to order details
- [x] Timeline added to shipment details
- [x] Timeline added to merchant details
- [x] Timeline added to finance details
- [x] Timeline added to warehouse product details
- [x] Sensitive fields hidden

## Attachments
- [x] POST /api/attachments
- [x] GET /api/attachments
- [x] GET /api/attachments/{attachment}
- [x] GET /api/attachments/{attachment}/download
- [x] DELETE /api/attachments/{attachment}
- [x] Reusable Attachments component
- [x] Upload modal
- [x] Download action
- [x] Delete action
- [x] Used in merchant details
- [x] Used in order details
- [x] Used in shipment details
- [x] Used in expenses/invoices/warehouse returns when applicable

## Export System
- [x] POST /api/exports/{type}
- [x] GET /api/exports
- [x] GET /api/exports/{exportLog}
- [x] GET /api/exports/{exportLog}/download
- [x] Export history page
- [x] Export details page
- [x] Generate export modal
- [x] Download export action
- [x] View details action from export history
- [x] Supported export types represented
- [x] Async-ready UI

## Sidebar
- [x] Dashboard
- [x] Users & Roles group
- [x] Merchants group
- [x] Locations & Pricing group
- [x] Orders
- [x] Shipments
- [x] Drivers group
- [x] Warehouse group
- [x] Finance group
- [x] Operations group
- [x] System group
- [x] All sidebar items permission-gated

## Reusable Components
- [~] DataTable with filters
- [x] PermissionGate
- [x] StatusBadge
- [x] MoneyDisplay
- [x] DateRangeFilter
- [x] MerchantSelector
- [x] DriverSelector
- [x] GovernorateAreaSelector
- [x] Timeline
- [x] Attachments
- [x] ExportButton
- [x] BarcodeScannerInput
- [x] ConfirmActionModal
- [x] ApprovalActionButtons
- [x] PrintView

## UI Polish Pass
- [x] Responsive filter layout unified across shared filter cards and filter bars
- [x] Destructive action styling updated for shared buttons and dropdown actions
- [x] Shared modal behavior updated for viewport-safe sizing and internal scrolling
- [~] Searchable dropdowns implemented for shared entity selectors and more high-traffic admin forms/modals, with smaller enum selects intentionally left native
- [x] Public settings now clearly explains where company name, logo, and support details are edited

## Logistics Redesign Pass
- [x] Shared design tokens updated for navy logistics shell, blue primary actions, orange accents, rounded cards, and softer shadows
- [x] Sidebar visually redesigned to match the logistics reference direction
- [x] Topbar visually redesigned with menu toggle, search, notifications, locale/theme actions, and company display
- [x] Dashboard visually redesigned around real dashboard, finance, orders, and shipments data
- [x] Shared cards, tables, badges, inputs, and buttons updated to the new design language
- [x] Warehouse sidebar keeps `Warehouses` as the first Warehouse child item and still links to `/admin/warehouses`
- [x] Company branding now refreshes globally across shell/auth/public brand surfaces after settings save
- [x] Company logo configuration is implemented honestly as URL/path string input with preview based on the documented settings contract
- [x] Documented backend support verified: no documented binary settings upload flow for `company_logo`; generic attachments API was not repurposed without backend contract
- [x] npm run build passed after redesign changes

## Build & Verification
- [x] npm run build passed
- [ ] Login/logout smoke tested
- [ ] Dashboard smoke tested
- [ ] Main CRUD pages smoke tested
- [ ] Order flow smoke tested
- [ ] Shipment flow smoke tested
- [ ] Warehouse flow smoke tested
- [ ] Finance flow smoke tested

## Summary
### Completed Modules
- Auth foundation
- Global foundation fix pass
- Roles & Permissions
- Settings
- Pricing Plans
- Pricing Plan Rates
- Orders
- Merchant Profile
- Driver Manifests
- Warehouse & Fulfillment
- Barcode Operations
- Exports

### Partial Modules
- Dashboard
- Users
- Merchants
- Locations & Pricing
- Reusable Components

### Missing Endpoints
- Settings single-setting detail/update endpoints are still not used directly in the UI

### Missing UI Flows
- No additional admin UI gaps remain in the documented shipment print-list, finance report, or supported finance timeline flows
- Create Warehouse action is now discoverable from the Warehouses list page and warehouse view/edit/delete route visibility has been verified against permissions
- Warehouses sidebar discoverability is now fixed in the grouped admin navigation: `Warehouses` appears again under the Warehouse section and links to the existing warehouse CRUD flow
- Shared warehouse create/edit forms now show `422` field errors via the existing `FieldError` / `useFormApiErrors` pattern
- Static localization coverage was extended again across admin error pages, shared resource-list empty/search states, drivers, treasury accounts, shipping rates, users, merchants, and the shell user fallback; broader legacy-screen translation remains partial
- Arabic `???` resource corruption in `src/shared/i18n/translations.ts` was repaired, and a safe Arabic-capable font fallback was added in global CSS without package changes
- Sidebar child labels now translate at render time and include more implemented warehouse/finance destinations when permissions allow
- Dashboard now uses a redesigned logistics-style layout with real-data KPI cards, live orders, recent shipments, finance snapshot, and live shipment tracking states
- Company branding now updates globally from shared public settings state, while `company_logo` remains URL/path-based because the documented backend settings APIs do not expose a binary logo upload contract

### Not Required Now
- GET /api/integrations/me: future plugin-facing endpoint only
- POST /api/integrations/orders: future plugin-facing endpoint only

### Build Result
- Manual build passed. Vite chunk-size warning remains as performance optimization, not a blocker.

### Next Steps
- Smoke test the dashboard, users, pricing, shipment print-list, finance reports, finance timelines, Warehouse group sidebar visibility, and Arabic/RTL rendering on older admin pages.

### Localization QA
- [x] Arabic question-mark resource corruption checked and repaired in frontend translation resources
- [x] Sidebar Arabic labels checked in code for translated render path and implemented item coverage
- [x] Backend `*_label` display preservation kept where those additive fields are already used
- [~] Major page static labels improved across more admin screens, but finance reports, merchant profile panels, and order details still need deeper translation coverage
- [ ] RTL visual smoke test performed manually
