# Database Seeding Audit

## Scope

- Source docs reviewed:
  - `docs/api-documentation.md`
  - `docs/admin_frontend_flows_documentation.md`
- Backend schema reviewed from:
  - `database/migrations`
  - `app/Models`
  - `app/Modules/**/Models`
  - `app/Modules/**/Enums`
  - existing `database/seeders`
  - existing `database/factories`
- Important backend note:
  - unresolved merge conflict markers currently exist in `app/Models/Merchant.php`, `app/Modules/Order/Models/Order.php`, `app/Modules/Shipment/Models/Shipment.php`, and `app/Modules/Driver/Models/Driver.php`
  - seeding validation will require resolving these backend conflicts because Artisan bootstrap will fail while they remain

## Existing Coverage Summary

- Existing factories:
  - `UserFactory`
  - `MerchantFactory`
  - `DriverFactory`
  - `OrderFactory`
  - `ShipmentFactory`
  - `WarehouseProductFactory`
- Existing seeders:
  - `SystemSettingSeeder`
  - `RolePermissionSeeder`
  - `DemoDataSeeder`
  - `DatabaseSeeder`
- Existing useful backend generation/default logic:
  - `SystemSettingService::seedDefaults()`
  - `RolePermissionDefaults`
  - `GenerateOrderNumberAction`
  - `GenerateShipmentNumberAction`
  - `GenerateMerchantInvoiceNumberAction`
  - `BarcodeService`

## Recommended Seeder Dependency Order

1. `RolesAndPermissionsSeeder`
2. `UsersSeeder`
3. `SettingsSeeder`
4. `LocationPricingSeeder`
5. `MerchantsSeeder`
6. `DriversSeeder`
7. `WarehousesSeeder`
8. `OrdersSeeder`
9. `ShipmentsSeeder`
10. `DriverManifestsSeeder`
11. `FinanceSeeder`
12. `WarehouseOperationsSeeder`
13. `AuditLogsSeeder`
14. `ExportsAndAttachmentsSeeder`

## Module Audit

### Auth / Users

- Tables involved:
  - `users`
  - `personal_access_tokens`
- Required relations:
  - `users.role_id -> roles.id`
- Required enum/status values:
  - user role string values used across app: `super_admin`, `admin`, `staff`, `warehouse`, `finance`, `driver`
- Existing factories:
  - `UserFactory`
- Missing factories:
  - none strictly required, but `UserFactory` needs production-like role-aware states
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `UsersSeeder`
- Seeder order/dependencies:
  - after `RolesAndPermissionsSeeder`
- Notes:
  - fixed login accounts are required by frontend flows
  - `role` and `role_id` both matter in current backend

### Roles & Permissions

- Tables involved:
  - `roles`
  - `permissions`
  - `permission_role`
- Required relations:
  - many-to-many `roles <-> permissions`
  - `users.role_id -> roles.id`
- Required enum/status values:
  - role statuses: `active`, `inactive` pattern in schema/docs
  - system roles from `RolePermissionDefaults`: `super_admin`, `admin`, `staff`, `warehouse`, `finance`, `driver`
  - permission slugs from `RolePermissionDefaults`
- Existing factories:
  - none
- Missing factories:
  - `RoleFactory`
  - `PermissionFactory`
- Existing seeders:
  - `RolePermissionSeeder`
- Missing seeders:
  - replace or supersede with `RolesAndPermissionsSeeder`
- Seeder order/dependencies:
  - first
- Notes:
  - defaults already exist in `RolePermissionDefaults`; use them as source for idempotent seeding

### Settings

- Tables involved:
  - `system_settings`
- Required relations:
  - `updated_by -> users.id`
- Required enum/status values:
  - groups:
    - `company`
    - `finance`
    - `shipping`
    - `warehouse`
    - `barcode`
    - `notifications`
    - `system`
    - `security`
    - `integrations`
  - typed values via `type`: `string`, `text`, `integer`, `decimal`, `boolean`, `json`, `date`, `time`, `file`, `image`, `encrypted`
- Existing factories:
  - none
- Missing factories:
  - `SystemSettingFactory`
- Existing seeders:
  - `SystemSettingSeeder`
- Missing seeders:
  - `SettingsSeeder` for production-like overrides and explicit required keys
- Seeder order/dependencies:
  - after users
- Notes:
  - `SystemSettingDefaults` already seeds most required keys and should be reused

### Merchants

- Tables involved:
  - `merchants`
- Required relations:
  - `merchants.pricing_plan_id -> pricing_plans.id`
  - downstream relations to orders, shipments, wallet, invoices, warehouse products, charges, integration tokens
- Required enum/status values:
  - merchant status currently used: `active`, `inactive`
- Existing factories:
  - `MerchantFactory`
- Missing factories:
  - expand `MerchantFactory` to handle `pricing_plan_id`
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `MerchantsSeeder`
- Seeder order/dependencies:
  - after pricing plans
- Notes:
  - realistic mix of active/inactive merchants needed for admin filters and finance screens

### Merchant Integration Tokens

- Tables involved:
  - `merchant_integration_tokens`
- Required relations:
  - `merchant_id -> merchants.id`
  - `created_by -> users.id`
  - `revoked_by -> users.id`
- Required enum/status values:
  - provider: `woocommerce`, `shopify`, `custom`
  - status: `active`, `revoked`, `expired`
  - permissions:
    - `orders.create`
    - `orders.view`
    - `shipments.view`
    - `tracking.view`
    - `products.view`
    - `inventory.view`
- Existing factories:
  - none
- Missing factories:
  - `MerchantIntegrationTokenFactory`
- Existing seeders:
  - none
- Missing seeders:
  - integrated in `MerchantsSeeder` or dedicated token seeding block
- Seeder order/dependencies:
  - after merchants and users
- Notes:
  - must generate unique `token_hash`
  - token plaintext is not stored, so metadata-only seed is acceptable

### Locations & Pricing

- Tables involved:
  - `governorates`
  - `areas`
  - `shipping_rates`
  - `pricing_plans`
  - `pricing_plan_rates`
- Required relations:
  - `areas.governorate_id -> governorates.id`
  - `shipping_rates.governorate_id -> governorates.id`
  - `shipping_rates.area_id -> areas.id` nullable
  - `pricing_plan_rates.pricing_plan_id -> pricing_plans.id`
  - `pricing_plan_rates.governorate_id -> governorates.id`
  - `pricing_plan_rates.area_id -> areas.id` nullable
  - `pricing_plans.created_by -> users.id`
- Required enum/status values:
  - pricing plan status: `active`, `inactive`
  - area/governorate/rate activity flags use booleans
- Existing factories:
  - none
- Missing factories:
  - `GovernorateFactory`
  - `AreaFactory`
  - `ShippingRateFactory`
  - `PricingPlanFactory`
  - `PricingPlanRateFactory`
- Existing seeders:
  - partial location data in `DemoDataSeeder`
- Missing seeders:
  - `LocationPricingSeeder`
- Seeder order/dependencies:
  - after settings and users
- Notes:
  - must provide both legacy shipping rates and pricing-plan-based rates
  - frontend flows explicitly need Cairo, Giza, Alexandria, Qalyubia, Sharqia

### Orders

- Tables involved:
  - `orders`
  - `order_items`
- Required relations:
  - `orders.merchant_id -> merchants.id`
  - delivery and pickup relations to `governorates` and `areas`
  - `orders.original_order_id -> orders.id` nullable
  - `orders.created_by -> users.id`
  - `order_items.order_id -> orders.id`
- Required enum/status values:
  - order status:
    - `draft`
    - `pending_review`
    - `confirmed`
    - `shipment_created`
    - `partially_delivered`
    - `delivered`
    - `failed`
    - `cancelled`
  - order type:
    - `delivery`
    - `swap`
    - `return`
  - payment type:
    - `cod`
    - `prepaid`
  - fulfillment type:
    - `pickup_from_merchant`
    - `from_warehouse`
    - `pickup_from_customer`
  - source:
    - `manual`
    - `integration`
  - order item delivery status:
    - `pending`
    - `reserved`
    - `fulfilled`
    - `partially_delivered`
    - `delivered`
    - `returned`
    - `damaged`
    - `cancelled`
- Existing factories:
  - `OrderFactory`
- Missing factories:
  - `OrderItemFactory`
  - `OrderFactory` needs relation-aware states and should stop forcing numbers if using real creation path
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `OrdersSeeder`
- Seeder order/dependencies:
  - after merchants, locations, settings, warehouses baseline, users
- Notes:
  - `CreateOrderAction` enforces defaults and barcode generation
  - docs/frontend flows require realistic draft, review, confirmed, shipment-created, delivered, failed, cancelled, swap, and return scenarios

### Shipments

- Tables involved:
  - `shipments`
  - `shipment_status_histories`
  - `shipment_item_results`
  - `delivery_attempts`
- Required relations:
  - `shipments.order_id -> orders.id` unique
  - `shipments.merchant_id -> merchants.id`
  - `shipments.assigned_driver_id -> drivers.id` nullable
  - `shipments.created_by -> users.id`
  - location relations to governorates/areas
  - `shipment_status_histories.shipment_id -> shipments.id`
  - `shipment_status_histories.changed_by -> users.id`
  - `shipment_item_results.shipment_id -> shipments.id`
  - `shipment_item_results.order_item_id -> order_items.id`
  - `shipment_item_results.warehouse_product_id -> warehouse_products.id` nullable
  - `shipment_item_results.created_by -> users.id`
  - `delivery_attempts.shipment_id -> shipments.id`
  - `delivery_attempts.driver_id -> drivers.id` nullable
  - `delivery_attempts.created_by -> users.id`
- Required enum/status values:
  - shipment status:
    - `pending_pickup`
    - `driver_assigned`
    - `picked_up`
    - `arrived_at_hub`
    - `sorting`
    - `ready_for_dispatch`
    - `in_transit`
    - `out_for_delivery`
    - `delivery_attempted`
    - `rescheduled`
    - `delivered`
    - `partially_delivered`
    - `failed`
    - `returned`
    - `returned_to_hub`
    - `returned_to_warehouse`
    - `cancelled`
  - shipment item result status:
    - `delivered`
    - `returned`
    - `damaged`
    - `cancelled`
  - return condition:
    - `sellable`
    - `damaged`
    - `disposed`
  - delivery attempt result:
    - `failed`
    - `postponed`
    - `customer_unreachable`
    - `customer_refused`
    - `rescheduled`
  - delivery attempt reason:
    - `customer_not_answering`
    - `customer_refused`
    - `wrong_address`
    - `no_cash`
    - `postponed_by_customer`
    - `area_closed`
    - `damaged_package`
    - `customer_requested_reschedule`
- Existing factories:
  - `ShipmentFactory`
- Missing factories:
  - `ShipmentStatusHistoryFactory`
  - `ShipmentItemResultFactory`
  - `DeliveryAttemptFactory`
  - `ShipmentFactory` needs relation-aware states and should optionally avoid manual number forcing
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `ShipmentsSeeder`
- Seeder order/dependencies:
  - after orders and drivers
- Notes:
  - `CreateShipmentFromOrderAction` updates order status to `shipment_created`
  - shipment history timeline is required for admin timelines and tracking

### Drivers

- Tables involved:
  - `drivers`
- Required relations:
  - `drivers.user_id -> users.id` nullable
- Required enum/status values:
  - `active`
  - `inactive`
- Existing factories:
  - `DriverFactory`
- Missing factories:
  - improve `DriverFactory` with user linkage and realistic national IDs/vehicle data
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `DriversSeeder`
- Seeder order/dependencies:
  - after users
- Notes:
  - frontend requires 6-10 drivers with active/inactive mix

### Driver Manifests

- Tables involved:
  - `driver_manifests`
  - `driver_manifest_items`
  - `driver_cash_closures`
- Required relations:
  - `driver_manifests.driver_id -> drivers.id`
  - `driver_manifests.created_by -> users.id`
  - `driver_manifests.closed_by -> users.id`
  - `driver_manifest_items.driver_manifest_id -> driver_manifests.id`
  - `driver_manifest_items.shipment_id -> shipments.id`
  - `driver_cash_closures.driver_id -> drivers.id`
  - `driver_cash_closures.driver_manifest_id -> driver_manifests.id` unique nullable
  - `driver_cash_closures.treasury_account_id -> treasury_accounts.id` nullable
  - `driver_cash_closures.created_by -> users.id`
  - `driver_cash_closures.verified_by -> users.id`
- Required enum/status values:
  - manifest status:
    - `open`
    - `closed`
    - `cancelled`
  - cash closure status:
    - `pending`
    - `verified`
    - `cancelled`
- Existing factories:
  - none
- Missing factories:
  - `DriverManifestFactory`
  - `DriverManifestItemFactory`
  - `DriverCashClosureFactory`
- Existing seeders:
  - partial closure coverage in `DemoDataSeeder`
- Missing seeders:
  - `DriverManifestsSeeder`
- Seeder order/dependencies:
  - after shipments, drivers, users
- Notes:
  - one open manifest per driver/date should be preserved

### Warehouse

- Tables involved:
  - `warehouses`
  - `warehouse_products`
  - `inventory_stocks`
  - `stock_movements`
  - `order_stock_reservations`
  - `warehouse_returns`
  - `warehouse_charges`
  - `warehouse_zones`
  - `warehouse_shelves`
  - `warehouse_bins`
  - `picking_lists`
  - `picking_list_items`
  - `packing_tasks`
  - `storage_fee_rules`
  - `pick_pack_fee_rules`
- Required relations:
  - warehouse/location relations to governorates and areas
  - warehouse product to merchant
  - inventory to warehouse, warehouse product, and optional bin
  - stock movements to warehouse and warehouse product
  - reservations to order, order item, warehouse, warehouse product, created_by
  - returns to shipment/order/warehouse/warehouse_product/created_by
  - charges to merchant with optional warehouse/order/shipment/product/user links
  - zone/shelf/bin hierarchy under warehouse
  - picking list to warehouse and users
  - picking list item to picking list, order, order item, warehouse product, optional bin
  - packing task to picking list, order, shipment, packed_by
  - storage/pick-pack fee rules to merchant or pricing plan
- Required enum/status values:
  - warehouse status: `active`, `inactive`
  - warehouse product status: `active`, `inactive`
  - stock movement type: `in`, `out`, `reserved`, `released`, `damaged`, `adjustment`
  - order stock reservation status: `reserved`, `fulfilled`, `released`, `cancelled`
  - warehouse return condition: `sellable`, `damaged`, `disposed`
  - warehouse charge type: `storage`, `packaging`, `fulfillment`, `return_handling`, `adjustment`, `other`
  - warehouse charge status: `pending`, `invoiced`, `paid`, `cancelled`
  - picking list status: `pending`, `in_progress`, `completed`, `cancelled`
  - picking list item status: `pending`, `picked`, `partially_picked`, `missing`
  - packing task status: `pending`, `in_progress`, `packed`, `cancelled`
  - storage fee calculation type: `per_item_per_month`, `per_sku_per_month`
- Existing factories:
  - `WarehouseProductFactory`
- Missing factories:
  - `WarehouseFactory`
  - `InventoryStockFactory`
  - `StockMovementFactory`
  - `StockReservationFactory` for `OrderStockReservation`
  - `WarehouseReturnFactory`
  - `WarehouseChargeFactory`
  - `WarehouseZoneFactory`
  - `WarehouseShelfFactory`
  - `WarehouseBinFactory`
  - `PickingListFactory`
  - `PickingListItemFactory`
  - `PackingTaskFactory`
  - `StorageFeeRuleFactory`
  - `PickPackFeeRuleFactory`
  - `WarehouseProductFactory` needs merchant-aware barcodes and full dimensions
- Existing seeders:
  - partial coverage in `DemoDataSeeder`
- Missing seeders:
  - `WarehousesSeeder`
  - `WarehouseOperationsSeeder`
- Seeder order/dependencies:
  - `WarehousesSeeder` after merchants, pricing, locations, users
  - `WarehouseOperationsSeeder` after orders and shipments
- Notes:
  - warehouse flows are central to `from_warehouse`, picking, packing, and return testing

### Barcode

- Tables involved:
  - barcode fields live on:
    - `orders.barcode`
    - `shipments.barcode`
    - `warehouse_products.barcode`
    - `warehouse_bins.barcode`
- Required relations:
  - no extra tables; depends on seeded orders, shipments, products, bins
- Required enum/status values:
  - configured prefixes from settings:
    - `order_barcode_prefix`
    - `shipment_barcode_prefix`
    - `warehouse_product_barcode_prefix`
    - `warehouse_bin_barcode_prefix`
- Existing factories:
  - none dedicated
- Missing factories:
  - covered by model factories above
- Existing seeders:
  - none dedicated
- Missing seeders:
  - covered by settings, warehouse, orders, shipments seeders
- Seeder order/dependencies:
  - depends on `SettingsSeeder`
- Notes:
  - prefer `BarcodeService` where using actions/services; otherwise ensure uniqueness

### Finance / Wallet / Payouts / Expenses / Invoices / Treasury

- Tables involved:
  - `merchant_wallet_transactions`
  - `merchant_payouts`
  - `expenses`
  - `merchant_invoices`
  - `merchant_invoice_items`
  - `treasury_accounts`
  - `treasury_transactions`
  - `driver_cash_closures`
- Required relations:
  - merchant and user links across finance models
  - treasury links on payouts, expenses, cash closures, treasury transactions
  - invoice items link to invoice
- Required enum/status values:
  - wallet direction: `credit`, `debit`
  - wallet status: `pending`, `approved`, `rejected`, `cancelled`
  - wallet transaction type:
    - `cod_collected`
    - `shipping_fee`
    - `return_fee`
    - `swap_fee`
    - `storage_fee`
    - `pick_fee`
    - `packing_fee`
    - `warehouse_charge`
    - `payout`
    - `manual_deposit`
    - `manual_withdraw`
    - `adjustment`
    - `refund`
    - `penalty`
  - payout status: `pending`, `approved`, `completed`, `rejected`, `cancelled`
  - expense category: `fuel`, `salaries`, `rent`, `packaging`, `maintenance`, `other`
  - expense status: `pending`, `approved`, `paid`, `rejected`, `cancelled`
  - payment method: `cash`, `bank_transfer`, `wallet`, `instapay`, `other`
  - invoice status: `draft`, `issued`, `paid`, `cancelled`
  - treasury account type: `cash`, `bank`, `wallet`, `other`
  - treasury account status: `active`, `inactive`
  - driver cash closure status: `pending`, `verified`, `cancelled`
- Existing factories:
  - none
- Missing factories:
  - `MerchantWalletTransactionFactory`
  - `MerchantPayoutFactory`
  - `ExpenseFactory`
  - `MerchantInvoiceFactory`
  - `MerchantInvoiceItemFactory`
  - `TreasuryAccountFactory`
  - `TreasuryTransactionFactory`
  - `DriverCashClosureFactory`
- Existing seeders:
  - partial finance coverage in `DemoDataSeeder`
- Missing seeders:
  - `FinanceSeeder`
- Seeder order/dependencies:
  - after shipments, merchants, drivers, users, manifests
- Notes:
  - finance seed must support dashboard, ledger, payout, treasury, reconciliation, and invoice screens
  - invoice numbers can use `GenerateMerchantInvoiceNumberAction` if created through service flow, otherwise must remain unique

### Audit Logs

- Tables involved:
  - `audit_logs`
- Required relations:
  - `user_id -> users.id` nullable
  - polymorphic-like stored fields `auditable_type` and `auditable_id`
- Required enum/status values:
  - event types from `AuditEventType` constants
- Existing factories:
  - none
- Missing factories:
  - `AuditLogFactory`
- Existing seeders:
  - none
- Missing seeders:
  - `AuditLogsSeeder`
- Seeder order/dependencies:
  - after core domain data exists
- Notes:
  - many auditable models also use `Auditable` trait, but explicit seeding is still useful for timeline density

### Exports

- Tables involved:
  - `export_logs`
- Required relations:
  - `generated_by -> users.id`
- Required enum/status values:
  - export status is string-based in schema/app usage; seed realistic `completed` and `failed` style values consistent with current controller/service usage
- Existing factories:
  - none
- Missing factories:
  - `ExportLogFactory`
- Existing seeders:
  - none
- Missing seeders:
  - `ExportsAndAttachmentsSeeder`
- Seeder order/dependencies:
  - after users and reportable data exists
- Notes:
  - file paths can point to testing fixtures under storage

### Attachments

- Tables involved:
  - `attachments`
- Required relations:
  - morph columns `attachable_type`, `attachable_id`
  - `uploaded_by -> users.id`
- Required enum/status values:
  - category is string/free-form; use realistic categories like invoice, payout, order, shipment, merchant, expense
- Existing factories:
  - none
- Missing factories:
  - `AttachmentFactory`
- Existing seeders:
  - none
- Missing seeders:
  - `ExportsAndAttachmentsSeeder`
- Seeder order/dependencies:
  - after related models exist
- Notes:
  - real files are optional unless download/storage code requires existence; use small `storage/app/testing` fixtures if needed

## Factory Gap List

- `RoleFactory`
- `PermissionFactory`
- `SystemSettingFactory`
- `MerchantIntegrationTokenFactory`
- `GovernorateFactory`
- `AreaFactory`
- `ShippingRateFactory`
- `PricingPlanFactory`
- `PricingPlanRateFactory`
- `OrderItemFactory`
- `ShipmentStatusHistoryFactory`
- `ShipmentItemResultFactory`
- `DeliveryAttemptFactory`
- `DriverManifestFactory`
- `DriverManifestItemFactory`
- `DriverCashClosureFactory`
- `WarehouseFactory`
- `InventoryStockFactory`
- `StockMovementFactory`
- `OrderStockReservationFactory`
- `WarehouseReturnFactory`
- `WarehouseChargeFactory`
- `WarehouseZoneFactory`
- `WarehouseShelfFactory`
- `WarehouseBinFactory`
- `PickingListFactory`
- `PickingListItemFactory`
- `PackingTaskFactory`
- `StorageFeeRuleFactory`
- `PickPackFeeRuleFactory`
- `MerchantWalletTransactionFactory`
- `MerchantPayoutFactory`
- `ExpenseFactory`
- `MerchantInvoiceFactory`
- `MerchantInvoiceItemFactory`
- `TreasuryAccountFactory`
- `TreasuryTransactionFactory`
- `AuditLogFactory`
- `ExportLogFactory`
- `AttachmentFactory`

## Seeder Gap List

- `RolesAndPermissionsSeeder`
- `UsersSeeder`
- `SettingsSeeder`
- `LocationPricingSeeder`
- `MerchantsSeeder`
- `DriversSeeder`
- `WarehousesSeeder`
- `OrdersSeeder`
- `ShipmentsSeeder`
- `DriverManifestsSeeder`
- `FinanceSeeder`
- `WarehouseOperationsSeeder`
- `AuditLogsSeeder`
- `ExportsAndAttachmentsSeeder`

## Implementation Notes

- Prefer idempotent `updateOrCreate` for fixed records:
  - roles
  - permissions
  - settings
  - fixed login users
  - governorates
  - pricing plans
  - warehouses
- Prefer realistic factories for bulk records:
  - merchants
  - orders
  - shipments
  - inventory
  - finance transactions
  - audit logs
- Prefer service/action-backed creation when business logic matters:
  - orders
  - shipments
  - barcodes
  - invoice numbering if a service flow exists
- Current backend blockers to resolve before validation:
  - merge conflict markers in core model files
- Seeding fix log:
  - fixed warehouse bin barcode duplicate issue by generating globally unique bin barcodes from warehouse, zone, shelf, and bin identity
