# Merchant Profile Permission Matrix

This document outlines the role-based access control (RBAC) permissions required to view the various tabs and features within the **Merchant Profile** (`MerchantDetailsPage.tsx`).

The matrix ensures that only authorized personnel (such as Admins, Super Admins, and Operations Managers with specific permissions) can access sensitive financial, integration, or structural data of a merchant.

## Permission Configuration

The frontend dynamically hides or shows tabs based on the explicit permissions provided by the backend in the `user.permissions` array. If the backend doesn't provide an explicit list, the frontend falls back to role-based defaults.

| Tab / Section | Permission Key | Fallback Roles (If no explicit permissions) |
| --- | --- | --- |
| **Overview** | *Visible to all roles who can access the merchant profile.* | All |
| **Orders** | `ORDER_VIEW` | Super Admin, Admin, Operations |
| **Shipments** | `SHIPMENT_VIEW` | Super Admin, Admin, Operations |
| **Wallet** | `FINANCE_WALLETS_VIEW` | Super Admin, Admin, Finance |
| **Invoices** | `FINANCE_INVOICES_VIEW` | Super Admin, Admin, Finance |
| **Warehouse / Inventory** | `WAREHOUSE_PRODUCTS_VIEW` | Super Admin, Admin, Warehouse |
| **Integration Tokens** | `MERCHANT_MANAGE` | Super Admin, Admin |
| **Portal Users** | `USER_MANAGE` | Super Admin, Admin |
| **Attachments** | `MERCHANT_MANAGE` | Super Admin, Admin |
| **Activity Timeline** | `MERCHANT_MANAGE` | Super Admin, Admin |

## Additional Inline Permissions

Some components within pages also restrict features based on granular permissions:

| Component / Feature | Permission Key | Description |
| --- | --- | --- |
| **Order Form: Packaging** | `ORDER_PACKAGING_MANAGE` | Allows selecting company-owned packaging products separately from warehouse order items when fulfilling an order. |

## Notes for Future Expansion

* **Constants Maintenance**: Ensure that `src/shared/auth/permission-keys.ts` is updated if the backend introduces new permission slugs. 
* **Permission Gating**: Always use the `<Can permission={PERMISSIONS.KEY}>` component to wrap sensitive sections of the UI, to prevent unauthorized access even if routing is somehow bypassed.
