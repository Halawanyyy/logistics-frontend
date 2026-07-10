# Merchant Portal Capability Matrix

This document defines the list of capabilities that can be returned in the `capabilities` array from the `GET /api/merchant-portal/me` endpoint.

These capabilities are used to dynamically show/hide routes, sidebar navigation items, tabs, and action buttons in the Merchant Portal.

## Capabilities List

| Capability | Description | UI Action / Scope Impacted | Status |
| --- | --- | --- | --- |
| **`dashboard.view`** | Access to dashboard analytics. | Sidebar Dashboard item, `/merchant/dashboard` route. | **Implemented** |
| **`profile.view`** | View company profile details. | Profile page layout / view-only inputs. | **Implemented** |
| **`profile.update`** | Edit company profile details. | Save profile button and editable input elements. | **Implemented** |
| **`settings.view`** | View portal configuration. | Settings page layout / view-only preferences. | **Implemented** |
| **`settings.update`** | Modify portal configuration. | Save settings button and form components. | **Implemented** |
| **`orders.view`** | View the order list and details. | Sidebar Orders, `/merchant/orders` and `/merchant/orders/:orderId`. | **Needs Browser QA** |
| **`orders.create`** | Place manual fulfillment orders. | Create Order button, `/merchant/orders/create` route. | **Needs Browser QA** |
| **`orders.update`** | Modify draft/unconfirmed orders. | Edit Order button, `/merchant/orders/:orderId/edit` route. | **Needs Browser QA** |
| **`orders.confirm`** | Confirm draft orders for processing. | "Confirm Order" button inside Order details. | **Needs Browser QA** |
| **`orders.cancel`** | Cancel orders. | "Cancel Order" button inside Order list / details. | **Needs Browser QA** |
| **`shipments.view`** | Track deliveries and review status. | Sidebar Shipments, `/merchant/shipments` and `/merchant/shipments/:shipmentId`. | **Implemented** |
| **`labels.print`** | Access PDF print utilities. | Merchant order label print action and other label buttons. | **Needs Browser QA** |
| **`warehouse.view`** | View products inventory and log. | Sidebar Warehouse (Products, Inventory, Stock Movements, Charges). | **Implemented** |
| **`warehouse.inbound_requests.view`**| View sent inbound inventory items. | Sidebar Inbound Requests, `/merchant/warehouse/inbound-requests`. | **Implemented** |
| **`warehouse.inbound_requests.create`**| Create a stock dispatch notification. | Create Inbound Request button, `/merchant/warehouse/inbound-requests/create`. | **Implemented** |
| **`warehouse.inbound_requests.cancel`**| Cancel an inbound request. | Cancel button inside inbound request details. | **Implemented** |
| **`finance.view`** | Access financial stats summary. | Sidebar Finance, `/merchant/finance` route. | **Implemented** |
| **`wallet.view`** | Review wallet balance and logs. | Wallet card and transaction logs. | **Implemented** |
| **`invoices.view`** | View monthly invoices. | Finance / Invoices list. | **Implemented** |
| **`invoices.download`** | Download PDF invoice files. | Invoice list/details "Download Invoice" buttons. | **Implemented** |
| **`payouts.view`** | View withdrawal transactions. | Finance / Payouts list. | **Implemented** |
| **`payouts.request`** | Request a new withdrawal. | "Request Payout" button, request modal. | **Implemented** |

| Capability | Description | UI Action / Scope Impacted | Status |
| --- | --- | --- | --- |
| **`integrations.view`** | View integration documents & tokens. | Sidebar Integrations, `/merchant/integrations`. | **Implemented** |
| **`integrations.manage`** | Generate, edit, and revoke tokens.| Token management form, revoke buttons. | **Implemented** |
| **`exports.view`** | View generated data exports list. | Sidebar Exports, `/merchant/exports` route. | **Implemented** |
| **`exports.create`** | Request new report exports. | "Export" action button inside orders/shipments. | **Implemented** |
| **`exports.download`** | Download generated CSV/Excel files. | Download actions list. | **Implemented** |
| **`attachments.view`** | View uploaded contract/identity files.| Sidebar Attachments, `/merchant/attachments` route. | **Implemented** |
| **`attachments.upload`** | Upload contract/identity files. | File drag-and-drop / upload input box. | **Implemented** |
| **`attachments.download`** | Download uploaded merchant files. | Click-to-download links inside files table. | **Implemented** |
| **`attachments.delete`** | Remove uploaded merchant files. | Trash/delete action inside files table. | **Implemented** |
| **`notifications.view`** | Read system messages / changes. | Sidebar Notifications, `/merchant/notifications` and topbar badge. | **Implemented** |
| **`store.view`** | Optional preview for merchant shop. | Sidebar Shop Preview, `/merchant/shop`. | **Implemented** |

## Implementation Rules
1. **Never Fall Back to Admin Roles**: If a user is missing `capabilities` but has an admin role, do not default to giving access. The merchant portal enforces capabilities, not admin permissions.
2. **Dynamic UI Rendering**: Utilize the capability checks wrapper (e.g. `<CanMerchant capability="..." />`) to dynamically hide restricted controls.
3. **Seeding & Synchronization**: Use the idempotent command `php artisan merchant-portal:sync-capabilities` to synchronize user accounts and portal roles.

## UI/UX Polish Pass - Admin Portal Visual Alignment

- **Implemented - Needs Browser QA**: The polish pass did not introduce any admin permission fallback. Merchant layout navigation, dashboard actions, profile/settings editors, and order actions remain gated by merchant capabilities only.
- **Needs Browser QA**: `orders.view`, `orders.create`, `orders.update`, `orders.confirm`, `orders.cancel`, and `labels.print` should be verified in the browser after the visual parity changes to confirm each gated action still appears only when its merchant capability is present.
- **Not Required Now**: No new capability slugs were introduced for UI polish. The pass reused the existing merchant capability matrix and kept non-implemented modules as Coming Soon.
