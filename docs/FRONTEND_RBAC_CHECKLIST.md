# Frontend RBAC Checklist

This checklist tracks frontend-only role-based access control implementation.

## 1. Permission Map
- [x] Create permission constants in `src/shared/auth/permission-keys.ts`
- [x] Create `ROLE_PERMISSIONS` in `src/shared/auth/permissions.ts`
- [x] Add `can(role, permission)` helper
- [x] Add `canAny(role, permissions[])` helper
- [x] Add role-based default route helper
- [x] Unknown or missing roles deny access

## 2. Permission Helper
- [x] Create `Can` component
- [x] Create `RequirePermission` component
- [x] Use `auth.store` `user.role`
- [x] Admin can access everything through `*`

## 3. Route Protection
- [x] Add `/403` route
- [x] Wrap protected routes with required permissions
- [x] Add fallback behavior when authenticated user has no allowed dashboard route

### Route Permission Matrix
- [x] `/dashboard` => `dashboard.view`
- [x] `/orders` => `orders.view`
- [x] `/orders/create` => `orders.create`
- [x] `/orders/:orderId` => `orders.view`
- [x] `/orders/:orderId/edit` => `orders.update`
- [x] `/shipments` => `shipments.view`
- [x] `/shipments/:shipmentId` => `shipments.view`
- [x] `/merchants` => `merchants.view`
- [x] `/merchants/create` => `merchants.create`
- [x] `/merchants/:id/edit` => `merchants.update`
- [x] `/users` => `users.view`
- [x] `/users/create` => `users.create`
- [x] `/users/:userId` => `users.view`
- [x] `/users/:userId/edit` => `users.update`
- [x] `/governorates` => `location_pricing.view`
- [x] `/governorates/create` => `location_pricing.create`
- [x] `/governorates/:governorateId/edit` => `location_pricing.update`
- [x] `/areas` => `location_pricing.view`
- [x] `/areas/create` => `location_pricing.create`
- [x] `/areas/:areaId/edit` => `location_pricing.update`
- [x] `/shipping-rates` => `location_pricing.view`
- [x] `/shipping-rates/create` => `location_pricing.create`
- [x] `/shipping-rates/calculator` => `location_pricing.view`
- [x] `/shipping-rates/:shippingRateId/edit` => `location_pricing.update`
- [x] `/drivers` => `drivers.view`
- [x] `/drivers/create` => `drivers.create`
- [x] `/drivers/:driverId` => `drivers.view`
- [x] `/drivers/:driverId/edit` => `drivers.update`
- [x] `/finance` => `reports.view`
- [x] `/finance/merchant-payouts` => `payouts.view`
- [x] `/finance/merchant-payouts/create` => `payouts.create`
- [x] `/finance/merchant-payouts/:recordId` => `payouts.view`
- [x] `/finance/merchant-payouts/:recordId/edit` => `payouts.update`
- [x] `/finance/driver-cash-closures` => `cash_closures.view`
- [x] `/finance/driver-cash-closures/create` => `cash_closures.create`
- [x] `/finance/driver-cash-closures/:recordId` => `cash_closures.view`
- [x] `/finance/driver-cash-closures/:recordId/edit` => `cash_closures.update`
- [x] `/finance/expenses` => `expenses.view`
- [x] `/finance/expenses/create` => `expenses.create`
- [x] `/finance/expenses/:recordId` => `expenses.view`
- [x] `/finance/expenses/:recordId/edit` => `expenses.update`
- [x] `/finance/merchant-invoices` => `invoices.view`
- [x] `/finance/merchant-invoices/create` => `invoices.create`
- [x] `/finance/merchant-invoices/:recordId` => `invoices.view`
- [x] `/finance/merchant-invoices/:recordId/edit` => `invoices.update`
- [x] `/warehouses` => `warehouse.view`
- [x] `/warehouses/create` => `warehouse.create`
- [x] `/warehouse-products` => `inventory.view`
- [x] `/warehouse-products/create` => `inventory.create`
- [x] `/inventory-stocks` => `inventory.view`
- [x] `/inventory-stocks/adjust` => `stock.adjust`
- [x] `/stock-movements` => `stock.movements.view`
- [x] `/warehouse-returns` => `warehouse.returns.view`
- [x] `/warehouse-returns/create` => `warehouse.returns.create`
- [x] `/warehouse-returns/:recordId` => `warehouse.returns.view`
- [x] `/warehouse-charges` => `warehouse.charges.view`
- [x] `/warehouse-charges/create` => `warehouse.charges.create`
- [x] `/warehouse-charges/:recordId` => `warehouse.charges.view`
- [x] `/warehouse-charges/:recordId/edit` => `warehouse.charges.update`
- [x] `/stock-reservations` => `inventory.view`
- [x] `/track` => public, no permission required
- [x] `/403` => authenticated users only, no module permission required

## 4. Sidebar Filtering
- [x] Add permission field to sidebar navigation items
- [x] Filter sidebar items by current user role
- [x] Hide modules users cannot access
- [x] Driver role only sees dashboard in current app navigation

## 5. Action Button Visibility
- [x] Add all action buttons to `Can` or permission checks

### Action Permission Matrix
- [x] Create Order button => `orders.create`
- [x] Edit Order button => `orders.update`
- [x] Confirm Order button => `orders.update`
- [x] Create Shipment button => `shipments.create`
- [x] Reserve Stock button => `orders.reserve_stock`
- [x] Release Stock button => `orders.release_stock`
- [x] Fulfill From Warehouse button => `orders.fulfill_warehouse`
- [x] Update Shipment Status button => `shipments.update_status`
- [x] Assign Driver button => `shipments.assign_driver`
- [x] Create Merchant button => `merchants.create`
- [x] Edit Merchant action => `merchants.update`
- [x] Delete Merchant action => `merchants.delete`
- [x] Create User button => `users.create`
- [x] Edit User action => `users.update`
- [x] Delete User action => `users.delete`
- [x] Create Location Pricing buttons => `location_pricing.create`
- [x] Edit Location Pricing actions => `location_pricing.update`
- [x] Delete Location Pricing actions => `location_pricing.delete`
- [x] Create Driver button => `drivers.create`
- [x] Edit Driver action => `drivers.update`
- [x] Delete Driver action => `drivers.delete`
- [x] Create Payout button => `payouts.create`
- [x] Edit Payout action => `payouts.update`
- [x] Delete Payout action => `payouts.delete`
- [x] Create Cash Closure button => `cash_closures.create`
- [x] Edit Cash Closure action => `cash_closures.update`
- [x] Delete Cash Closure action => `cash_closures.delete`
- [x] Create Expense button => `expenses.create`
- [x] Edit Expense action => `expenses.update`
- [x] Delete Expense action => `expenses.delete`
- [x] Create Invoice button => `invoices.create`
- [x] Edit Invoice action => `invoices.update`
- [x] Delete Invoice action => `invoices.delete`
- [x] Invoice Download button => `invoices.download`
- [x] Create Warehouse button => `warehouse.create`
- [x] Create Warehouse Product button => `inventory.create`
- [x] Adjust Stock button => `stock.adjust`
- [x] Create Warehouse Return button => `warehouse.returns.create`
- [x] Create Warehouse Charge button => `warehouse.charges.create`
- [x] Edit Warehouse Charge action => `warehouse.charges.update`
- [x] Delete Warehouse Charge action => `warehouse.charges.delete`

## 6. Forbidden Page
- [x] Create `src/features/errors/ForbiddenPage.tsx`
- [x] Add `/403` route
- [x] Message: `You do not have permission to access this page`
- [x] Button back to dashboard

## 7. Role Testing
- [x] admin sees all modules
- [x] staff sees dashboard, orders, shipments, merchants
- [x] warehouse sees dashboard, orders, warehouse/inventory modules
- [x] finance sees dashboard, finance, merchants
- [x] driver sees dashboard only in current navigation
- [x] Intentionally skip `/drivers/me`: backend does not document a current-driver endpoint

## 8. Build Status
- [x] Run `npm run build`
- [x] Fix TypeScript/build errors

## Summary

### Completed
- Permission constants, permission map, `can`, `canAny`, and default role redirect helper.
- Reusable `Can` and `RequirePermission` components.
- `/403` forbidden page and route.
- Sidebar filtering by `user.role`.
- Route permission wrapping for every existing app route.
- Action button visibility checks across users, merchants, location pricing, orders, shipments, drivers, finance, and warehouse pages.
- Role-based default redirect after login.
- Production build verification.

### Pending
- None.

### Issues
- Driver-specific pages such as `/drivers/me` were intentionally skipped because `api-documentation.md` does not document a current-driver endpoint.
- Driver users still have `dashboard.view`; they are not shown the all-drivers admin module.

### Next steps
- Validate each role against real backend accounts in a browser session.
