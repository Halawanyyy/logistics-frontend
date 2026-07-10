# Frontend Localization Page Checklist

## Latest Pass Note

- Shared create/edit form headers and section descriptions were refreshed in the touched admin forms.
- `OrderForm` and shipment completion/dialog surfaces received additional static-text localization cleanup.
- Dropdown action behavior was stabilized on several list pages, but this checklist still does not claim untouched legacy screens are fully localized.

Status legend:
- `OK`: route/page and its immediate user-visible static UI are localized in code
- `Partial`: some user-visible strings are localized, but obvious English remains
- `Missing`: route/page still contains clear hardcoded English UI
- `Not Applicable`: no meaningful static UI on that row

## Auth

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Auth | `/admin/login` Login | `src/features/auth/pages/LoginPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Main login surface uses `react-i18next`. |
| Auth | Auth layout | `src/layouts/AuthLayout.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | OK | Shared auth chrome is localized. |

## Dashboard

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | `/admin/dashboard` Main dashboard | `src/features/dashboard/pages/DashboardPage.tsx`, dashboard widgets/components | OK | Partial | OK | Not Applicable | OK | Partial | Yes | OK | Major shell and several widgets are localized; some deeper operational cards/tables still need cleanup. |

## Users & Roles

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Users & Roles | `/admin/users` Users list | `src/features/users/pages/UsersListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Users & Roles | `/admin/users/create` Create user | `src/features/users/pages/CreateUserPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Users & Roles | `/admin/users/:userId/edit` Edit user | `src/features/users/pages/EditUserPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Users & Roles | `/admin/users/:userId` User details | `src/features/users/pages/UserDetailsPage.tsx` | Yes | Not Applicable | OK | Partial | OK | Yes | Yes | OK | |
| Users & Roles | `/admin/roles` Roles list | `src/features/roles/pages/RolesListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Users & Roles | `/admin/roles/create` Create role | `src/features/roles/pages/RoleFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Users & Roles | `/admin/roles/:roleId/edit` Edit role | `src/features/roles/pages/RoleFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Users & Roles | `/admin/roles/:roleId` Role details | `src/features/roles/pages/RoleDetailsPage.tsx` | Yes | Not Applicable | OK | Partial | OK | Yes | Yes | OK | |
| Users & Roles | Permission multi-select | `src/shared/components/ui/SearchableSelect.tsx`, role form components | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Shared searchable permission picker strings are localized. |

## Merchants

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Merchants | `/admin/merchants` Merchants list | `src/features/merchants/pages/MerchantsListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Merchants | `/admin/merchants/create` Create merchant | `src/features/merchants/pages/CreateMerchantPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Merchants | `/admin/merchants/:id/edit` Edit merchant | `src/features/merchants/pages/EditMerchantPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Merchants | `/admin/merchants/:merchantId` Merchant details | `src/features/merchants/pages/MerchantDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Merchants | Merchant profile tabs | `src/features/merchants/pages/MerchantDetailsPage.tsx`, `src/features/merchants/components/MerchantProfilePanels.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Merchants | Wallet tab | `src/features/merchants/components/MerchantProfilePanels.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | |
| Merchants | Invoices tab | `src/features/merchants/components/MerchantProfilePanels.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | |
| Merchants | Integration tokens tab | `src/features/merchants/components/MerchantProfilePanels.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | |
| Merchants | Warehouse tab | `src/features/merchants/components/MerchantProfilePanels.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | |
| Merchants | Attachments tab | `src/features/merchants/components/MerchantProfilePanels.tsx`, `src/shared/components/attachments/Attachments.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Merchants | Activity timeline tab | `src/features/merchants/components/MerchantProfilePanels.tsx`, `src/shared/components/timeline/Timeline.tsx` | Yes | Not Applicable | Yes | Not Applicable | Not Applicable | Yes | Yes | OK | |

## Locations & Pricing

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Locations & Pricing | `/admin/governorates` Governorates list | `src/features/location-pricing/pages/GovernoratesPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Locations & Pricing | `/admin/governorates/create` Create governorate | `src/features/location-pricing/pages/GovernorateFormPage.tsx`, `components/GovernorateForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/governorates/:governorateId/edit` Edit governorate | `src/features/location-pricing/pages/GovernorateFormPage.tsx`, `components/GovernorateForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/governorates/:governorateId` Governorate details | `src/features/location-pricing/pages/LocationPricingDetailsPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | |
| Locations & Pricing | `/admin/areas` Areas list | `src/features/location-pricing/pages/AreasPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/areas/create` Create area | `src/features/location-pricing/pages/AreaFormPage.tsx`, `components/AreaForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/areas/:areaId/edit` Edit area | `src/features/location-pricing/pages/AreaFormPage.tsx`, `components/AreaForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/areas/:areaId` Area details | `src/features/location-pricing/pages/LocationPricingDetailsPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/shipping-rates` Shipping rates list | `src/features/location-pricing/pages/ShippingRatesPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/shipping-rates/create` Create shipping rate | `src/features/location-pricing/pages/ShippingRateFormPage.tsx`, `components/ShippingRateForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/shipping-rates/:shippingRateId/edit` Edit shipping rate | `src/features/location-pricing/pages/ShippingRateFormPage.tsx`, `components/ShippingRateForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/shipping-rates/:shippingRateId` Shipping rate details | `src/features/location-pricing/pages/LocationPricingDetailsPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/shipping-rates/calculator` Shipping calculator | `src/features/location-pricing/pages/ShippingRateCalculatorPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | OK | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plans` Pricing plans list | `src/features/location-pricing/pages/PricingPlansPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plans/create` Create pricing plan | `src/features/location-pricing/pages/PricingPlanFormPage.tsx`, `components/PricingPlanForms.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plans/:pricingPlanId/edit` Edit pricing plan | `src/features/location-pricing/pages/PricingPlanFormPage.tsx`, `components/PricingPlanForms.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plans/:pricingPlanId` Pricing plan details | `src/features/location-pricing/pages/LocationPricingDetailsPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plan-rates` Pricing plan rates list | `src/features/location-pricing/pages/PricingPlansPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plan-rates/create` Create pricing plan rate | `src/features/location-pricing/pages/PricingPlanFormPage.tsx`, `components/PricingPlanForms.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plan-rates/:pricingPlanRateId/edit` Edit pricing plan rate | `src/features/location-pricing/pages/PricingPlanFormPage.tsx`, `components/PricingPlanForms.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Locations & Pricing | `/admin/pricing-plan-rates/:pricingPlanRateId` Pricing plan rate details | `src/features/location-pricing/pages/LocationPricingDetailsPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | Fully localized. |

## Orders & Shipments

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Orders & Shipments | `/admin/orders` Orders list | `src/features/orders/pages/OrdersListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Main list table is narrower after removing Customer, COD, and Shipping Fee from the visible columns for better responsive/RTL behavior. |
| Orders & Shipments | `/admin/orders/create` Create order | `src/features/orders/pages/CreateOrderPage.tsx`, `components/OrderForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Orders & Shipments | `/admin/orders/:orderId/edit` Edit order | `src/features/orders/pages/EditOrderPage.tsx`, `components/OrderForm.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | Fully localized. |
| Orders & Shipments | `/admin/orders/:orderId` Order details | `src/features/orders/pages/OrderDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Orders & Shipments | `/admin/stock-reservations` Stock reservations | `src/features/warehouse/pages/StockReservationsPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Orders & Shipments | Shipment creation flow | `src/features/orders/pages/OrderDetailsPage.tsx`, `components/OrderForm.tsx` | Yes | Yes | Not Applicable | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Orders & Shipments | `/admin/shipments` Shipments list | `src/features/shipments/pages/ShipmentsListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | Main list table is narrower after removing Order Number, Customer, COD, and Shipping Fee from the visible columns for better responsive/RTL behavior. |
| Orders & Shipments | `/admin/shipments/:shipmentId` Shipment details | `src/features/shipments/pages/ShipmentDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Orders & Shipments | Assign driver / status update / complete delivery / delivery attempts / print | `src/features/shipments/pages/ShipmentDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |

## Drivers & Manifests

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Drivers & Manifests | `/admin/drivers` Drivers list | `src/features/drivers/pages/DriversListPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Drivers & Manifests | `/admin/drivers/create` Create driver | `src/features/drivers/pages/DriverFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Drivers & Manifests | `/admin/drivers/:driverId/edit` Edit driver | `src/features/drivers/pages/DriverFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Drivers & Manifests | `/admin/drivers/:driverId` Driver details | `src/features/drivers/pages/DriverDetailsPage.tsx` | Yes | OK | Partial | OK | Partial | Yes | Yes | OK | |
| Drivers & Manifests | `/admin/driver-manifests` Driver manifests list | `src/features/driver-manifests/pages/DriverManifestsPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | Main list, generate, close, and print list surfaces are improved. Print now opens a dedicated frontend-owned manifest document instead of printing the page UI, but the broader list surface still has residual English. |
| Drivers & Manifests | `/admin/driver-manifests/:manifestId` Manifest details | `src/features/driver-manifests/pages/DriverManifestDetailsPage.tsx` | Yes | Not Applicable | Yes | OK | Yes | Yes | Yes | OK | Main detail, dedicated manifest print dialog, timeline, and close-manifest UI are localized; some validation/helper text still needs a final cleanup pass. |

## Warehouse

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Warehouse | `/admin/warehouses` Warehouses list | `src/features/warehouse/pages/WarehousesPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Warehouse | `/admin/warehouses/create` Create warehouse | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form page is partly localized but still needs a dedicated warehouse-string sweep. |
| Warehouse | `/admin/warehouses/:recordId/edit` Edit warehouse | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Warehouse | `/admin/warehouses/:recordId` Warehouse details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Wrapper, confirm flows, timeline states, and return lifecycle UI are localized; a shared field-label map now covers common backend keys, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/warehouse-products` Warehouse products | `src/features/warehouse/pages/WarehouseProductsPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | Yes | OK | Filters, low-stock helper/actions, and label flows are localized. |
| Warehouse | `/admin/warehouse-products/create` Create warehouse product | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/warehouse-products/:recordId/edit` Edit warehouse product | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/warehouse-products/:recordId` Warehouse product details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Shared details wrapper is improved; common backend field labels now map through translations, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/inventory-stocks` Inventory stocks | `src/features/warehouse/pages/InventoryStocksPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Warehouse | `/admin/inventory-stocks/adjust` Stock adjustment | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/inventory-stocks/:recordId` Inventory stock details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Shared details wrapper is improved; common backend field labels now map through translations, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/stock-movements` Stock movements | `src/features/warehouse/pages/StockMovementsPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Not Applicable | Yes | Yes | OK | Filters and movement table headers are localized. |
| Warehouse | `/admin/stock-movements/:recordId` Stock movement details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Shared details wrapper is improved; common backend field labels now map through translations, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/stock-reservations` Stock reservations | `src/features/warehouse/pages/StockReservationsPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Warehouse | `/admin/warehouse-returns` Warehouse returns | `src/features/warehouse/pages/WarehouseReturnsPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Not Applicable | Yes | Yes | OK | Filters and return list headers are localized. |
| Warehouse | `/admin/warehouse-returns/create` Create warehouse return | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/warehouse-returns/:recordId` Warehouse return details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Shared details wrapper is improved; common backend field labels now map through translations, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/warehouse-charges` Warehouse charges | `src/features/warehouse/pages/WarehouseChargesPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Not Applicable | Yes | Yes | OK | Filters and charge list headers/actions are localized. |
| Warehouse | `/admin/warehouse-charges/create` Create warehouse charge | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/warehouse-charges/:recordId/edit` Edit warehouse charge | `src/features/warehouse/pages/WarehouseRecordFormPage.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | Shared form route. |
| Warehouse | `/admin/warehouse-charges/:recordId` Warehouse charge details | `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | Yes | Yes | Yes | OK | Shared details wrapper is improved; common backend field labels now map through translations, but rarer unmapped fields can still fall back to English. |
| Warehouse | `/admin/warehouse/locations` Warehouse locations / zones / shelves / bins | `src/features/warehouse/pages/WarehouseLocationsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Warehouse | `/admin/warehouse/bins/:warehouseBinId` Bin details | `src/features/warehouse/pages/WarehouseBinDetailsPage.tsx` | Yes | Yes | Not Applicable | Yes | Yes | Yes | Yes | OK | Detail labels, edit dialog, delete confirmation, barcode copy, and label-print actions are localized. |
| Warehouse | `/admin/warehouse/receipts` Warehouse receipts | `src/features/warehouse/pages/WarehouseReceiptsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | List surface plus create/edit dialog, item rows, helper text, filters, and confirm/cancel flows are localized. |
| Warehouse | `/admin/warehouse/receipts/:receiptId` Warehouse receipt details | `src/features/warehouse/pages/WarehouseReceiptDetailsPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | Yes | OK | Header, overview card, item table, confirmation modal, and empty/loading/not-found states are localized. |
| Warehouse | `/admin/warehouse/transfers` Warehouse transfers | `src/features/warehouse/pages/WarehouseTransfersPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | List surface plus create/edit dialog, source/destination filters, helper text, and lifecycle action confirmations are localized. |
| Warehouse | `/admin/warehouse/transfers/:transferId` Warehouse transfer details | `src/features/warehouse/pages/WarehouseTransferDetailsPage.tsx` | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | Yes | OK | Header, lifecycle actions, overview card, item table, confirmation modal, and empty/loading/not-found states are localized. |
| Warehouse | `/admin/warehouse/picking-lists` Picking lists | `src/features/warehouse/pages/PickingListsPage.tsx` | Yes | Yes | Yes | OK | Partial | Yes | Yes | OK | |
| Warehouse | `/admin/warehouse/picking-lists/:pickingListId` Picking list details | `src/features/warehouse/pages/PickingListDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Warehouse | `/admin/warehouse/packing-tasks` Packing tasks | `src/features/warehouse/pages/PackingTasksPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Warehouse | `/admin/warehouse/packing-tasks/:packingTaskId` Packing task details | `src/features/warehouse/pages/PackingTaskDetailsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |
| Warehouse | `/admin/warehouse/storage-fee-rules` Storage fees | `src/features/warehouse/pages/StorageFeeRulesPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | List surface plus create/generate dialogs, filters, helper text, and table labels are localized. |
| Warehouse | `/admin/warehouse/pick-pack-fee-rules` Pick & pack fees | `src/features/warehouse/pages/PickPackFeeRulesPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | List surface plus create/generate dialogs, fee-field labels, helper text, and table headers are localized. |
| Warehouse | `/admin/warehouse/kpis` Warehouse KPIs | `src/features/warehouse/pages/WarehouseKpisPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | KPI section titles, low-stock helper cards, card labels, and loading/error states are localized. |
| Warehouse | `/admin/warehouse/inbound-requests` Inbound requests | `src/features/warehouse/pages/MerchantInboundStockRequestsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Fully localized. |

## Finance

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Finance | `/admin/finance` Finance reports page | `src/features/finance/pages/FinanceReportsPage.tsx` | OK | Partial | OK | Not Applicable | Not Applicable | OK | Yes | OK | Report surface wrapper/localization improved, but many metric/report labels still remain English. |
| Finance | `/admin/finance/merchant-payouts` Merchant payouts | `src/features/finance/pages/MerchantPayoutsPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/merchant-payouts/create` Create merchant payout | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/merchant-payouts/:recordId/edit` Edit merchant payout | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/merchant-payouts/:recordId` Merchant payout details | `src/features/finance/pages/FinanceRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/driver-cash-closures` Driver cash closures | `src/features/finance/pages/DriverCashClosuresPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | Wrapper localized this pass; deeper form/record strings still need another sweep. |
| Finance | `/admin/finance/driver-cash-closures/create` Create driver cash closure | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/driver-cash-closures/:recordId/edit` Edit driver cash closure | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/driver-cash-closures/:recordId` Driver cash closure details | `src/features/finance/pages/FinanceRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/expenses` Expenses | `src/features/finance/pages/ExpensesPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/expenses/create` Create expense | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/expenses/:recordId/edit` Edit expense | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/expenses/:recordId` Expense details | `src/features/finance/pages/FinanceRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/merchant-invoices` Merchant invoices | `src/features/finance/pages/MerchantInvoicesPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/merchant-invoices/create` Create merchant invoice | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/merchant-invoices/:recordId/edit` Edit merchant invoice | `src/features/finance/pages/FinanceRecordFormPage.tsx`, `components/FinanceForms.tsx` | OK | Partial | Not Applicable | OK | Not Applicable | OK | Yes | OK | |
| Finance | `/admin/finance/merchant-invoices/:recordId` Merchant invoice details | `src/features/finance/pages/FinanceRecordDetailsPage.tsx` | OK | Not Applicable | OK | Not Applicable | OK | Partial | Yes | OK | |
| Finance | `/admin/finance/treasury/accounts` Treasury accounts | `src/features/finance/pages/TreasuryAccountsPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Finance | `/admin/finance/treasury/accounts/create` Create treasury account | `src/features/finance/pages/TreasuryAccountFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Finance | `/admin/finance/treasury/accounts/:accountId/edit` Edit treasury account | `src/features/finance/pages/TreasuryAccountFormPage.tsx` | Yes | Yes | Not Applicable | Yes | Not Applicable | Yes | Yes | OK | |
| Finance | `/admin/finance/treasury/accounts/:accountId` Treasury account details | `src/features/finance/pages/TreasuryAccountDetailsPage.tsx` | Yes | Not Applicable | OK | Partial | OK | Yes | Yes | OK | |
| Finance | `/admin/finance/treasury/transactions` Treasury transactions | `src/features/finance/pages/TreasuryTransactionsPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Finance | Report sections: reconciliation / company profit / daily cash / merchant ledger / driver discrepancies / warehouse revenue / profit-loss | `src/features/finance/pages/FinanceReportsPage.tsx` | Yes | Yes | Yes | Not Applicable | Not Applicable | Yes | Yes | OK | Fully localized. |

## Audit Logs

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Audit Logs | `/admin/audit-logs` Global audit logs | `src/features/audit/pages/AuditLogsPage.tsx` | Yes | Yes | Yes | Not Applicable | OK | Yes | Yes | OK | |
| Audit Logs | Reusable timeline/details dialog | `src/shared/components/timeline/Timeline.tsx`, audit details surfaces | OK | Not Applicable | OK | Not Applicable | OK | Partial | Yes | OK | Some entity-specific timeline titles/descriptions still vary by page. |

## Attachments

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Attachments | Shared attachment list/upload/download/delete UI | `src/shared/components/attachments/Attachments.tsx` | Yes | Yes | OK | Partial | OK | Yes | Yes | OK | Shared component is localized; host pages can still contribute untranslated surrounding copy. |

## Exports

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Exports | `/admin/exports` Export history | `src/features/exports/pages/ExportsPage.tsx` | Yes | Yes | Yes | OK | Partial | Yes | Yes | OK | Download loading is row-scoped; some raw export type labels remain backend values intentionally. |
| Exports | `/admin/exports/:exportLogId` Export details | `src/features/exports/pages/ExportLogDetailsPage.tsx` | Yes | Not Applicable | OK | Not Applicable | OK | Yes | Yes | OK | |

## Barcode Operations

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Barcode Operations | `/admin/operations/barcodes` Barcode lookup / scan | `src/features/barcodes/pages/BarcodeOperationsPage.tsx` | Yes | Yes | OK | Yes | Not Applicable | Yes | Yes | OK | |

## Settings

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Settings | `/admin/settings` Settings groups / company settings / public settings preview | `src/features/settings/pages/SettingsPage.tsx` | OK | Partial | OK | Partial | OK | Partial | Yes | OK | Touched branding/helper copy is localized, but some dynamic/older group text still depends on backend or remains English. |

## Error Pages

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Error Pages | `/admin/403` Forbidden | `src/features/errors/ForbiddenPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | |
| Error Pages | `/admin/404` Not found | `src/features/errors/NotFoundPage.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | |
| Error Pages | Generic shared error/not-found/loading/empty states | `src/shared/components/states/*.tsx`, `src/shared/components/feedback/*.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | Yes | OK | Shared primitives are localized. |

## Shared Components / Layout

| Module | Route/Page | File(s) | Static UI localized? | Placeholders localized? | Table headers localized? | Forms localized? | Modals/dialogs localized? | Empty/loading/error states localized? | RTL checked in code? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Shared Components / Layout | Sidebar | `src/shared/components/layout/Sidebar.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | OK | Orders + Shipments group is localized. |
| Shared Components / Layout | Topbar | `src/shared/components/layout/Topbar.tsx` | Yes | OK | Not Applicable | Not Applicable | OK | Partial | Yes | OK | |
| Shared Components / Layout | Search dropdown | `src/shared/components/layout/TopbarGlobalSearch.tsx` | Yes | Yes | Not Applicable | Not Applicable | OK | Yes | Yes | OK | |
| Shared Components / Layout | ConfirmActionModal | `src/shared/components/modals/ConfirmActionModal.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Yes | Not Applicable | Yes | OK | |
| Shared Components / Layout | ApprovalActionButtons | `src/shared/components/actions/ApprovalActionButtons.tsx` | Yes | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Not Applicable | Yes | OK | |
| Shared Components / Layout | ResourceListPage / ApiFilterBar | `src/shared/components/data/ResourceListPage.tsx`, `src/shared/components/data/ApiFilterBar.tsx` | Yes | Yes | Yes | OK | Not Applicable | Yes | Yes | OK | Host pages still control many labels/column names. |
| Shared Components / Layout | SearchableSelect / selectors | `src/shared/components/ui/SearchableSelect.tsx`, selectors | Yes | Yes | Not Applicable | OK | Not Applicable | Yes | Yes | OK | Shared selector chrome is localized; page-provided option labels may still be English. |
| Shared Components / Layout | PrintView / label dialog | `src/shared/components/print/PrintView.tsx`, `src/shared/components/labels/LabelDocumentDialog.tsx`, `src/shared/utils/entityLabel.ts`, `src/features/driver-manifests/components/DriverManifestPrintDialog.tsx`, `src/features/driver-manifests/utils/driverManifestPrint.ts` | Yes | OK | Partial | OK | Yes | OK | Yes | OK | Arabic-capable font stack is applied on print/report surfaces. Shipment, order, warehouse product, bulk product, and warehouse bin labels now share one wrapped frontend HTML label family for HTML plus browser print-to-PDF fallback, while Driver Manifest uses its own frontend-owned report document with the same UTF-8/RTL-safe wrapper and print-safe table styling. Shared page/card/grid/table/header CSS was also tightened again to improve responsive and RTL layout safety across admin surfaces. |
| Shared Components / Layout | Status badges | `src/shared/components/ui/StatusBadge.tsx`, shared badge consumers across admin pages | Yes | Not Applicable | Yes | Not Applicable | Not Applicable | Not Applicable | Yes | OK | Raw backend values now drive badge colors while localized `*_label` fields remain display-only text. Badge text wraps safely for Arabic/RTL, and more status-like categories such as payment type, fulfillment type, direction, transaction type, source type, provider, and condition now render through the same shared badge system on updated admin tables/details. |

## Remaining Untranslated Strings

- `src/features/driver-manifests/pages/DriverManifestDetailsPage.tsx`
  Remaining examples are narrower now and mostly around validation/helper copy rather than the main detail/print/timeline surface.
- `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx`
  Remaining gaps are now narrower: common backend field labels map through translations, but rarer unmapped field names can still surface English fallback labels.
- `src/features/warehouse/pages/WarehouseLocationsPage.tsx`
  Example strings remain across tabs/forms/tables for zones, shelves, and bins.
- `src/features/warehouse/pages/PickingListDetailsPage.tsx`
  Example strings remain in detail headers, action labels, and table labels.
- `src/features/warehouse/pages/PackingTasksPage.tsx`
  Example strings remain in list actions and empty/loading text.
- `src/features/warehouse/pages/PackingTaskDetailsPage.tsx`
  Example strings remain in detail headers, task summary, and action copy.
- `src/features/warehouse/pages/MerchantInboundStockRequestsPage.tsx`
  Example strings remain in admin review list/details/actions.
- `src/features/finance/pages/FinanceReportsPage.tsx`
  Remaining English still exists in some report/metric labels and helper text.
- `src/features/merchants/pages/MerchantDetailsPage.tsx`
  Remaining English still exists in some merchant detail and tab action copy.
- `src/features/merchants/components/MerchantProfilePanels.tsx`
  Remaining English still exists in wallet, invoice, integration, and warehouse tab surfaces.
- `src/features/orders/components/OrderForm.tsx`
  Remaining English still exists in some helper text, validation copy, and field descriptions.
- `src/features/shipments/pages/ShipmentDetailsPage.tsx`
  Shipment label print output now uses a safe Arabic/RTL-aware wrapper and structured label layout, but some less-traveled action/dialog states may still contain residual English.

## Localization QA Checklist

- [ ] Arabic language selected
- [ ] Sidebar labels Arabic
- [ ] Page titles Arabic
- [ ] Buttons Arabic
- [ ] Placeholders Arabic
- [ ] Table headers Arabic
- [ ] Forms Arabic
- [ ] Modals Arabic
- [ ] Empty/error/loading states Arabic
- [ ] No `???` corrupted Arabic
- [ ] RTL visually usable
- [x] Build passed

## Latest UI/RTL Notes

- Shared page headers now use a more intentional title/action split with better RTL stacking behavior on narrow widths.
- Arabic typography was tuned globally with slightly larger sizing, stronger heading/button weights, and looser line-height without resizing English screens excessively.
- Sidebar readability was improved with stronger inactive text contrast, clearer group labels, and more obvious active/hover states while preserving the existing brand palette and dark mode.
- Settings long-value handling and lower-section layout were also cleaned up, but the broader admin surface still needs manual Arabic desktop/mobile visual QA.
- Standalone create/edit form pages now share a centered header-and-card shell with split footer actions that stack safely on mobile. RTL handling for the form section header and cancel/save footer was also tightened so Arabic create/edit pages read more naturally.

## P0 Company Catalog + Order Packaging Localization

- `src/features/company-catalog/pages/CompanyCatalogListPage.tsx`
  Company Catalog page title, description, type chips, filters, table headings, and action copy were added to the shared translation map.
- `src/features/company-catalog/pages/CompanyCatalogFormPage.tsx`
  Create/edit page header and form-section copy were localized through the shared i18n system.
- `src/features/company-catalog/components/CompanyCatalogItemForm.tsx`
  Catalog form field labels and enum display labels now use shared translations.
- `src/features/orders/components/OrderForm.tsx`
  Packaging subsection labels, helper copy, loading/empty states, and add/remove controls were localized.
- `src/features/orders/pages/OrderDetailsPage.tsx`
  Packaging summary and packaging-items table labels were localized.
- Manual Arabic browser QA for the new Company Catalog and packaging surfaces is still pending.
