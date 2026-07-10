# Frontend Creation Forms UI Checklist

| Form | Route/path | Component file | Standalone / Embedded / Modal / Inline | Uses approved form shell | Has clean header card | Has section icon | Has localized title | Has localized description | Has balanced field grid | Has action footer | Submit button has icon | Matches reference alignment | Matches reference typography | FORM_LAYOUT_V2 visible | Mobile layout checked | RTL checked | Browser QA status | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Merchants** | | | | | | | | | | | | | | | | | | | |
| Create Merchant | `/admin/merchants/create` | `CreateMerchantPage.tsx`, `MerchantForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Edit Merchant | `/admin/merchants/:id/edit` | `MerchantForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Orders** | | | | | | | | | | | | | | | | | | | |
| Create Order | `/admin/orders/create` | `CreateOrderPage.tsx`, `OrderForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Edit Order | `/admin/orders/:id/edit` | `EditOrderPage.tsx`, `OrderForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Users & Roles** | | | | | | | | | | | | | | | | | | | |
| Create User | `/admin/users/create` | `UserForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Edit User | `/admin/users/:id/edit` | `UserForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Create Role | `/admin/roles/create` | `RoleFormPage.tsx`, `RoleForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Edit Role | `/admin/roles/:id/edit` | `RoleFormPage.tsx`, `RoleForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Drivers** | | | | | | | | | | | | | | | | | | | |
| Create Driver | `/admin/drivers/create` | `DriverFormPage.tsx`, `DriverForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Edit Driver | `/admin/drivers/:id/edit` | `DriverFormPage.tsx`, `DriverForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Location & Pricing** | | | | | | | | | | | | | | | | | | | |
| Governorate create/edit | `/admin/governorates/create` | `GovernorateFormPage.tsx`, `GovernorateForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Area create/edit | `/admin/areas/create` | `AreaFormPage.tsx`, `AreaForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Shipping Rate create/edit | `/admin/shipping-rates/create` | `ShippingRateFormPage.tsx`, `ShippingRateForm.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Pricing Plan create/edit | `/admin/pricing-plans/create` | `PricingPlanFormPage.tsx`, `PricingPlanForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Warehouse** | | | | | | | | | | | | | | | | | | | |
| Warehouse create/edit | `/admin/warehouses/create` | `WarehouseRecordFormPage.tsx`, `WarehouseForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Warehouse Product create/edit | `/admin/warehouse-products/create` | `WarehouseRecordFormPage.tsx`, `WarehouseForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Stock Adjustment form | `/admin/inventory-stocks/adjust` | `WarehouseRecordFormPage.tsx`, `WarehouseForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Warehouse Charge form | `/admin/warehouse-charges/create` | `WarehouseRecordFormPage.tsx`, `WarehouseForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Warehouse Return form | `/admin/warehouse-returns/create` | `WarehouseRecordFormPage.tsx`, `WarehouseForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| **Finance** | | | | | | | | | | | | | | | | | | | |
| Expenses create/edit | `/admin/expenses/create` | `FinanceRecordFormPage.tsx`, `FinanceForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Payouts create/edit | `/admin/merchant-payouts/create` | `FinanceRecordFormPage.tsx`, `FinanceForms.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |
| Treasury Account create/edit | `/admin/treasury-accounts/create` | `TreasuryAccountFormPage.tsx` | Standalone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Pending | Pending | |

## P0 Company Catalog + Order Packaging Sync Notes

- Order create/edit continues to use the shared standalone form shell, and the new packaging subsection was added inside `OrderForm.tsx` without changing the surrounding approved create/edit layout system.
- The packaging subsection is now a distinct panel with localized title/description, `requires_packaging` toggle, notes field, repeatable packaging-item rows, and responsive add/remove controls.
- Browser visual QA for desktop/mobile/RTL packaging layout is still pending.
