import { lazy, Suspense, type ReactNode } from "react";

import { MerchantIntegrationsPage } from "../features/merchant-portal/integrations/pages/MerchantIntegrationsPage";
import { MerchantExportsPage } from "../features/merchant-portal/exports/pages/MerchantExportsPage";
import { MerchantExportCreatePage } from "../features/merchant-portal/exports/pages/MerchantExportCreatePage";
import { MerchantExportDetailsPage } from "../features/merchant-portal/exports/pages/MerchantExportDetailsPage";
import { MerchantStorePage } from "../features/merchant-portal/store/pages/MerchantStorePage";
import { Navigate, createBrowserRouter, useLocation } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { UsersListPage } from "../features/users/pages/UsersListPage";
import { CreateUserPage } from "../features/users/pages/CreateUserPage";
import { EditUserPage } from "../features/users/pages/EditUserPage";
import { UserDetailsPage } from "../features/users/pages/UserDetailsPage";
import { MerchantsListPage } from "../features/merchants/pages/MerchantsListPage";
import { MerchantDetailsPage } from "../features/merchants/pages/MerchantDetailsPage";
import { GovernoratesPage } from "../features/location-pricing/pages/GovernoratesPage";
import { AreasPage } from "../features/location-pricing/pages/AreasPage";
import { ShippingRatesPage } from "../features/location-pricing/pages/ShippingRatesPage";
import { GovernorateFormPage } from "../features/location-pricing/pages/GovernorateFormPage";
import { AreaFormPage } from "../features/location-pricing/pages/AreaFormPage";
import { ShippingRateFormPage } from "../features/location-pricing/pages/ShippingRateFormPage";
import { ShippingRateCalculatorPage } from "../features/location-pricing/pages/ShippingRateCalculatorPage";
import {
  AreaDetailsPage,
  GovernorateDetailsPage,
  ShippingRateDetailsPage,
} from "../features/location-pricing/pages/LocationPricingDetailsPage";
import { OrdersListPage } from "../features/orders/pages/OrdersListPage";
import { OrderDetailsPage } from "../features/orders/pages/OrderDetailsPage";
import { CreateOrderPage } from "../features/orders/pages/CreateOrderPage";
import { EditOrderPage } from "../features/orders/pages/EditOrderPage";
import { ShipmentsListPage } from "../features/shipments/pages/ShipmentsListPage";
import { ShipmentDetailsPage } from "../features/shipments/pages/ShipmentDetailsPage";
import { CreateMerchantPage } from "../features/merchants/pages/CreateMerchantPage";
import { EditMerchantPage } from "../features/merchants/pages/EditMerchantPage";
import { DriversListPage } from "../features/drivers/pages/DriversListPage";
import { DriverDetailsPage } from "../features/drivers/pages/DriverDetailsPage";
import { DriverFormPage } from "../features/drivers/pages/DriverFormPage";
import { PublicTrackingPage } from "../features/public-tracking/pages/PublicTrackingPage";
import { ForbiddenPage } from "../features/errors/ForbiddenPage";
import { NotFoundPage } from "../features/errors/NotFoundPage";
import { ProtectedRoute } from "../shared/components/layout/ProtectedRoute";
import { PublicRoute } from "../shared/components/layout/PublicRoute";
import { PERMISSIONS, type Permission } from "../shared/auth/permission-keys";
import { RequirePermission } from "../shared/auth/RequirePermission";
import { RolesListPage } from "../features/roles/pages/RolesListPage";
import { RoleFormPage } from "../features/roles/pages/RoleFormPage";
import { RoleDetailsPage } from "../features/roles/pages/RoleDetailsPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { PricingPlanFormPage } from "../features/location-pricing/pages/PricingPlanFormPage";
import {
  PricingPlanRatesPage,
  PricingPlansPage,
} from "../features/location-pricing/pages/PricingPlansPage";
import {
  PricingPlanDetailsPage,
  PricingPlanRateDetailsPage,
} from "../features/location-pricing/pages/LocationPricingDetailsPage";
import { adminPath } from "../shared/routing/paths";
import { DriverManifestsPage } from "../features/driver-manifests/pages/DriverManifestsPage";
import { DriverManifestDetailsPage } from "../features/driver-manifests/pages/DriverManifestDetailsPage";
import { TreasuryAccountsPage } from "../features/finance/pages/TreasuryAccountsPage";
import { TreasuryAccountFormPage } from "../features/finance/pages/TreasuryAccountFormPage";
import { TreasuryAccountDetailsPage } from "../features/finance/pages/TreasuryAccountDetailsPage";
import { TreasuryTransactionsPage } from "../features/finance/pages/TreasuryTransactionsPage";
import { WarehouseLocationsPage } from "../features/warehouse/pages/WarehouseLocationsPage";
import { WarehouseReceiptDetailsPage } from "../features/warehouse/pages/WarehouseReceiptDetailsPage";
import { WarehouseReceiptsPage } from "../features/warehouse/pages/WarehouseReceiptsPage";
import { PickingListsPage } from "../features/warehouse/pages/PickingListsPage";
import { PickingListDetailsPage } from "../features/warehouse/pages/PickingListDetailsPage";
import { PackingTasksPage } from "../features/warehouse/pages/PackingTasksPage";
import { PackingTaskDetailsPage } from "../features/warehouse/pages/PackingTaskDetailsPage";
import { StorageFeeRulesPage } from "../features/warehouse/pages/StorageFeeRulesPage";
import { PickPackFeeRulesPage } from "../features/warehouse/pages/PickPackFeeRulesPage";
import { WarehouseKpisPage } from "../features/warehouse/pages/WarehouseKpisPage";
import { WarehouseTransferDetailsPage } from "../features/warehouse/pages/WarehouseTransferDetailsPage";
import { WarehouseTransfersPage } from "../features/warehouse/pages/WarehouseTransfersPage";
import { MerchantInboundStockRequestsPage } from "../features/warehouse/pages/MerchantInboundStockRequestsPage";
import { WarehouseInboundPage } from "../features/warehouse/pages/WarehouseInboundPage";
import { WarehouseInventoryPage } from "../features/warehouse/pages/WarehouseInventoryPage";
import { WarehouseFulfillmentPage } from "../features/warehouse/pages/WarehouseFulfillmentPage";
import { WarehouseConfigPage } from "../features/warehouse/pages/WarehouseConfigPage";
import { WarehouseBinDetailsPage } from "../features/warehouse/pages/WarehouseBinDetailsPage";
import { BarcodeOperationsPage } from "../features/barcodes/pages/BarcodeOperationsPage";
import { AuditLogsPage } from "../features/audit/pages/AuditLogsPage";
import { ExportsPage } from "../features/exports/pages/ExportsPage";
import { ExportLogDetailsPage } from "../features/exports/pages/ExportLogDetailsPage";

import { MerchantPortalProvider } from "../features/merchant-portal/context/merchantPortal.context";
import { MerchantLayout } from "../layouts/MerchantLayout";
import { MerchantDashboardPage } from "../features/merchant-portal/pages/MerchantDashboardPage";
import { MerchantOrdersListPage } from "../features/merchant-portal/orders/pages/MerchantOrdersListPage";
import { MerchantOrderCreatePage } from "../features/merchant-portal/orders/pages/MerchantOrderCreatePage";
import { MerchantOrderDetailsPage } from "../features/merchant-portal/orders/pages/MerchantOrderDetailsPage";
import { MerchantOrderEditPage } from "../features/merchant-portal/orders/pages/MerchantOrderEditPage";
import { MerchantShipmentsListPage } from "../features/merchant-portal/shipments/pages/MerchantShipmentsListPage";
import { MerchantShipmentDetailsPage } from "../features/merchant-portal/shipments/pages/MerchantShipmentDetailsPage";
import { MerchantWarehouseProductsPage } from "../features/merchant-portal/warehouse/pages/MerchantWarehouseProductsPage";
import { MerchantWarehouseProductDetailsPage } from "../features/merchant-portal/warehouse/pages/MerchantWarehouseProductDetailsPage";
import { MerchantInventoryStocksPage } from "../features/merchant-portal/warehouse/pages/MerchantInventoryStocksPage";
import { MerchantInventoryStockDetailsPage } from "../features/merchant-portal/warehouse/pages/MerchantInventoryStockDetailsPage";
import { MerchantLowStockPage } from "../features/merchant-portal/warehouse/pages/MerchantLowStockPage";
import { MerchantStockMovementsPage } from "../features/merchant-portal/warehouse/pages/MerchantStockMovementsPage";
import { MerchantWarehouseChargesPage } from "../features/merchant-portal/warehouse/pages/MerchantWarehouseChargesPage";
import { MerchantInboundRequestsPage } from "../features/merchant-portal/warehouse/pages/MerchantInboundRequestsPage";
import { MerchantInboundRequestCreatePage } from "../features/merchant-portal/warehouse/pages/MerchantInboundRequestCreatePage";
import { MerchantInboundRequestDetailsPage } from "../features/merchant-portal/warehouse/pages/MerchantInboundRequestDetailsPage";
import { MerchantFinanceOverviewPage } from "../features/merchant-portal/finance/pages/MerchantFinanceOverviewPage";
import { MerchantWalletPage } from "../features/merchant-portal/finance/pages/MerchantWalletPage";
import { MerchantWalletTransactionsPage } from "../features/merchant-portal/finance/pages/MerchantWalletTransactionsPage";
import { MerchantWalletTransactionDetailsPage } from "../features/merchant-portal/finance/pages/MerchantWalletTransactionDetailsPage";
import { MerchantInvoiceDetailsPage } from "../features/merchant-portal/finance/pages/MerchantInvoiceDetailsPage";
import { MerchantPayoutRequestPage } from "../features/merchant-portal/finance/pages/MerchantPayoutRequestPage";
import { MerchantPayoutDetailsPage } from "../features/merchant-portal/finance/pages/MerchantPayoutDetailsPage";
import { MerchantProfilePage } from "../features/merchant-portal/pages/MerchantProfilePage";
import { MerchantUsersPage } from "../features/merchant-portal/users/pages/MerchantUsersPage";
import { MerchantSettingsPage } from "../features/merchant-portal/pages/MerchantSettingsPage";
import { MerchantForbiddenPage } from "../features/merchant-portal/pages/MerchantForbiddenPage";
import { MerchantNotFoundPage } from "../features/merchant-portal/pages/MerchantNotFoundPage";
import { merchantPath } from "../shared/routing/paths";

const DashboardPage = lazy(() =>
  import("../features/dashboard/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const FinanceReportsPage = lazy(() =>
  import("../features/finance/pages/FinanceReportsPage").then((module) => ({
    default: module.FinanceReportsPage,
  })),
);
const FinanceOperationsPage = lazy(() =>
  import("../features/finance/pages/FinanceOperationsPage").then((module) => ({
    default: module.FinanceOperationsPage,
  })),
);
const FinanceTreasuryPage = lazy(() =>
  import("../features/finance/pages/FinanceTreasuryPage").then((module) => ({
    default: module.FinanceTreasuryPage,
  })),
);
const MerchantPayoutsPage = lazy(() =>
  import("../features/finance/pages/MerchantPayoutsPage").then((module) => ({
    default: module.MerchantPayoutsPage,
  })),
);
const DriverCashClosuresPage = lazy(() =>
  import("../features/finance/pages/DriverCashClosuresPage").then((module) => ({
    default: module.DriverCashClosuresPage,
  })),
);
const ExpensesPage = lazy(() =>
  import("../features/finance/pages/ExpensesPage").then((module) => ({
    default: module.ExpensesPage,
  })),
);
const MerchantInvoicesPage = lazy(() =>
  import("../features/finance/pages/MerchantInvoicesPage").then((module) => ({
    default: module.MerchantInvoicesPage,
  })),
);
const FinancePayoutCreatePage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => (
      <module.FinanceRecordFormPage kind="payouts" mode="create" />
    ),
  })),
);
const FinancePayoutEditPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => <module.FinanceRecordFormPage kind="payouts" mode="edit" />,
  })),
);
const FinancePayoutDetailsPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordDetailsPage").then(
    (module) => ({
      default: () => <module.FinanceRecordDetailsPage kind="payouts" />,
    }),
  ),
);
const FinanceCashClosureCreatePage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => (
      <module.FinanceRecordFormPage kind="cash-closures" mode="create" />
    ),
  })),
);
const FinanceCashClosureEditPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => (
      <module.FinanceRecordFormPage kind="cash-closures" mode="edit" />
    ),
  })),
);
const FinanceCashClosureDetailsPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordDetailsPage").then(
    (module) => ({
      default: () => <module.FinanceRecordDetailsPage kind="cash-closures" />,
    }),
  ),
);
const FinanceExpenseCreatePage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => (
      <module.FinanceRecordFormPage kind="expenses" mode="create" />
    ),
  })),
);
const FinanceExpenseEditPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => <module.FinanceRecordFormPage kind="expenses" mode="edit" />,
  })),
);
const FinanceExpenseDetailsPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordDetailsPage").then(
    (module) => ({
      default: () => <module.FinanceRecordDetailsPage kind="expenses" />,
    }),
  ),
);
const FinanceInvoiceCreatePage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => (
      <module.FinanceRecordFormPage kind="invoices" mode="create" />
    ),
  })),
);
const FinanceInvoiceEditPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordFormPage").then((module) => ({
    default: () => <module.FinanceRecordFormPage kind="invoices" mode="edit" />,
  })),
);
const FinanceInvoiceDetailsPage = lazy(() =>
  import("../features/finance/pages/FinanceRecordDetailsPage").then(
    (module) => ({
      default: () => <module.FinanceRecordDetailsPage kind="invoices" />,
    }),
  ),
);
const WarehousesPage = lazy(() =>
  import("../features/warehouse/pages/WarehousesPage").then((module) => ({
    default: module.WarehousesPage,
  })),
);
const WarehouseProductsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseProductsPage").then(
    (module) => ({ default: module.WarehouseProductsPage }),
  ),
);
const InventoryStocksPage = lazy(() =>
  import("../features/warehouse/pages/InventoryStocksPage").then((module) => ({
    default: module.InventoryStocksPage,
  })),
);
const StockMovementsPage = lazy(() =>
  import("../features/warehouse/pages/StockMovementsPage").then((module) => ({
    default: module.StockMovementsPage,
  })),
);
const WarehouseReturnsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseReturnsPage").then((module) => ({
    default: module.WarehouseReturnsPage,
  })),
);
const WarehouseChargesPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseChargesPage").then((module) => ({
    default: module.WarehouseChargesPage,
  })),
);
const StockReservationsPage = lazy(() =>
  import("../features/warehouse/pages/StockReservationsPage").then(
    (module) => ({ default: module.StockReservationsPage }),
  ),
);
const CompanyCatalogListPage = lazy(() =>
  import("../features/company-catalog/pages/CompanyCatalogListPage").then(
    (module) => ({ default: module.CompanyCatalogListPage }),
  ),
);
const CompanyCatalogCreatePage = lazy(() =>
  import("../features/company-catalog/pages/CompanyCatalogFormPage").then(
    (module) => ({ default: () => <module.CompanyCatalogFormPage mode="create" /> }),
  ),
);
const CompanyCatalogEditPage = lazy(() =>
  import("../features/company-catalog/pages/CompanyCatalogFormPage").then(
    (module) => ({ default: () => <module.CompanyCatalogFormPage mode="edit" /> }),
  ),
);
const WarehouseCreatePage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordFormPage kind="warehouse" />,
    }),
  ),
);
const WarehouseEditPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => (
        <module.WarehouseRecordFormPage kind="warehouse" mode="edit" />
      ),
    }),
  ),
);
const WarehouseProductCreatePage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordFormPage kind="product" />,
    }),
  ),
);
const WarehouseProductEditPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => (
        <module.WarehouseRecordFormPage kind="product" mode="edit" />
      ),
    }),
  ),
);
const WarehouseAdjustStockPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordFormPage kind="adjust" />,
    }),
  ),
);
const WarehouseReturnCreatePage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordFormPage kind="return" />,
    }),
  ),
);
const WarehouseChargeCreatePage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordFormPage kind="charge" />,
    }),
  ),
);
const WarehouseChargeEditPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordFormPage").then(
    (module) => ({
      default: () => (
        <module.WarehouseRecordFormPage kind="charge" mode="edit" />
      ),
    }),
  ),
);
const WarehouseReturnDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordDetailsPage kind="return" />,
    }),
  ),
);
const WarehouseChargeDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordDetailsPage kind="charge" />,
    }),
  ),
);
const WarehouseDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordDetailsPage kind="warehouse" />,
    }),
  ),
);
const WarehouseProductDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => <module.WarehouseRecordDetailsPage kind="product" />,
    }),
  ),
);
const InventoryStockDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => (
        <module.WarehouseRecordDetailsPage kind="inventory-stock" />
      ),
    }),
  ),
);
const StockMovementDetailsPage = lazy(() =>
  import("../features/warehouse/pages/WarehouseRecordDetailsPage").then(
    (module) => ({
      default: () => (
        <module.WarehouseRecordDetailsPage kind="stock-movement" />
      ),
    }),
  ),
);

function lazyElement(node: ReactNode) {
  return <Suspense fallback={null}>{node}</Suspense>;
}

import { RequireMerchantCapability, RequireMerchantRole } from "../features/merchant-portal/components/RequireMerchantCapability";

function requireRole(node: ReactNode, role: string) {
  return (
    <RequireMerchantRole role={role}>
      {node}
    </RequireMerchantRole>
  );
}

function requireCapability(node: ReactNode, capability: string) {
  return (
    <RequireMerchantCapability capability={capability}>
      {node}
    </RequireMerchantCapability>
  );
}

function requirePermission(node: ReactNode, permission: Permission) {
  return <RequirePermission permission={permission}>{node}</RequirePermission>;
}

function requireAnyPermission(node: ReactNode, permissions: Permission[]) {
  return <RequirePermission anyOf={permissions}>{node}</RequirePermission>;
}

const legacyPrefixes = [
  "/dashboard",
  "/orders",
  "/shipments",
  "/merchants",
  "/users",
  "/roles",
  "/settings",
  "/governorates",
  "/areas",
  "/shipping-rates",
  "/pricing-plans",
  "/pricing-plan-rates",
  "/drivers",
  "/driver-manifests",
  "/finance",
  "/warehouses",
  "/warehouse-products",
  "/inventory-stocks",
  "/stock-movements",
  "/warehouse-returns",
  "/warehouse-charges",
  "/stock-reservations",
  "/audit-logs",
  "/exports",
  "/operations",
  "/403",
];

function LegacyRouteHandler() {
  const location = useLocation();
  const isLegacy = legacyPrefixes.some(
    (prefix) =>
      location.pathname === prefix ||
      location.pathname.startsWith(`${prefix}/`),
  );

  if (location.pathname === "/login") {
    return <Navigate to={adminPath("/login")} replace />;
  }

  if (location.pathname === "/") {
    return <Navigate to={adminPath("/dashboard")} replace />;
  }

  if (isLegacy) {
    return <Navigate to={adminPath(location.pathname)} replace />;
  }

  return <Navigate to={adminPath("/404")} replace />;
}

export const router = createBrowserRouter([
  {
    path: adminPath("/login"),
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: merchantPath("/login"),
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/track",
    element: <PublicTrackingPage />,
  },
  {
    path: adminPath("/403"),
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ForbiddenPage />,
      },
    ],
  },
  {
    path: adminPath(),
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={adminPath("/dashboard")} replace />,
      },
      {
        path: "dashboard",
        element: requirePermission(
          lazyElement(<DashboardPage />),
          PERMISSIONS.DASHBOARD_VIEW,
        ),
      },
      {
        path: "orders",
        element: requirePermission(<OrdersListPage />, PERMISSIONS.ORDERS_VIEW),
      },
      {
        path: "orders/create",
        element: requirePermission(
          <CreateOrderPage />,
          PERMISSIONS.ORDERS_CREATE,
        ),
      },
      {
        path: "orders/:orderId",
        element: requirePermission(
          <OrderDetailsPage />,
          PERMISSIONS.ORDERS_VIEW,
        ),
      },
      {
        path: "orders/:orderId/edit",
        element: requirePermission(
          <EditOrderPage />,
          PERMISSIONS.ORDERS_UPDATE,
        ),
      },
      {
        path: "shipments",
        element: requirePermission(
          <ShipmentsListPage />,
          PERMISSIONS.SHIPMENTS_VIEW,
        ),
      },
      {
        path: "shipments/:shipmentId",
        element: requirePermission(
          <ShipmentDetailsPage />,
          PERMISSIONS.SHIPMENTS_VIEW,
        ),
      },
      {
        path: "merchants",
        element: requirePermission(
          <MerchantsListPage />,
          PERMISSIONS.MERCHANTS_VIEW,
        ),
      },
      {
        path: "merchants/:merchantId",
        element: requirePermission(
          <MerchantDetailsPage />,
          PERMISSIONS.MERCHANTS_VIEW,
        ),
      },
      {
        path: "merchants/:merchantId/dashboard",
        element: requirePermission(
          <MerchantDetailsPage />,
          PERMISSIONS.MERCHANTS_VIEW,
        ),
      },
      {
        path: "merchants/:merchantId/finance",
        element: requirePermission(
          <MerchantDetailsPage />,
          PERMISSIONS.FINANCE_VIEW,
        ),
      },
      {
        path: "merchants/:merchantId/warehouse",
        element: requirePermission(
          <MerchantDetailsPage />,
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "merchants/create",
        element: requirePermission(
          <CreateMerchantPage />,
          PERMISSIONS.MERCHANTS_CREATE,
        ),
      },
      {
        path: "merchants/:id/edit",
        element: requirePermission(
          <EditMerchantPage />,
          PERMISSIONS.MERCHANTS_UPDATE,
        ),
      },
      {
        path: "users",
        element: requirePermission(<UsersListPage />, PERMISSIONS.USERS_VIEW),
      },
      {
        path: "roles",
        element: requirePermission(<RolesListPage />, PERMISSIONS.ROLES_VIEW),
      },
      {
        path: "roles/create",
        element: requirePermission(
          <RoleFormPage mode="create" />,
          PERMISSIONS.ROLES_CREATE,
        ),
      },
      {
        path: "roles/:roleId",
        element: requirePermission(<RoleDetailsPage />, PERMISSIONS.ROLES_VIEW),
      },
      {
        path: "roles/:roleId/edit",
        element: requirePermission(
          <RoleFormPage mode="edit" />,
          PERMISSIONS.ROLES_UPDATE,
        ),
      },
      {
        path: "settings",
        element: requirePermission(<SettingsPage />, PERMISSIONS.SETTINGS_VIEW),
      },
      {
        path: "users/create",
        element: requirePermission(
          <CreateUserPage />,
          PERMISSIONS.USERS_CREATE,
        ),
      },
      {
        path: "users/:userId",
        element: requirePermission(<UserDetailsPage />, PERMISSIONS.USERS_VIEW),
      },
      {
        path: "users/:userId/edit",
        element: requirePermission(<EditUserPage />, PERMISSIONS.USERS_UPDATE),
      },
      {
        path: "governorates",
        element: requirePermission(
          <GovernoratesPage />,
          PERMISSIONS.LOCATION_PRICING_VIEW,
        ),
      },
      {
        path: "governorates/create",
        element: requirePermission(
          <GovernorateFormPage mode="create" />,
          PERMISSIONS.LOCATION_PRICING_CREATE,
        ),
      },
      {
        path: "governorates/:governorateId",
        element: requirePermission(
          <GovernorateDetailsPage />,
          PERMISSIONS.LOCATION_PRICING_VIEW,
        ),
      },
      {
        path: "governorates/:governorateId/edit",
        element: requirePermission(
          <GovernorateFormPage mode="edit" />,
          PERMISSIONS.LOCATION_PRICING_UPDATE,
        ),
      },
      {
        path: "areas",
        element: requirePermission(
          <AreasPage />,
          PERMISSIONS.LOCATION_PRICING_VIEW,
        ),
      },
      {
        path: "areas/create",
        element: requirePermission(
          <AreaFormPage mode="create" />,
          PERMISSIONS.LOCATION_PRICING_CREATE,
        ),
      },
      {
        path: "areas/:areaId",
        element: requirePermission(
          <AreaDetailsPage />,
          PERMISSIONS.LOCATION_PRICING_VIEW,
        ),
      },
      {
        path: "areas/:areaId/edit",
        element: requirePermission(
          <AreaFormPage mode="edit" />,
          PERMISSIONS.LOCATION_PRICING_UPDATE,
        ),
      },
      {
        path: "shipping-rates",
        element: requirePermission(
          <ShippingRatesPage />,
          PERMISSIONS.SHIPPING_RATES_VIEW,
        ),
      },
      {
        path: "shipping-rates/create",
        element: requirePermission(
          <ShippingRateFormPage mode="create" />,
          PERMISSIONS.SHIPPING_RATES_CREATE,
        ),
      },
      {
        path: "shipping-rates/calculator",
        element: requirePermission(
          <ShippingRateCalculatorPage />,
          PERMISSIONS.SHIPPING_RATES_VIEW,
        ),
      },
      {
        path: "shipping-rates/:shippingRateId",
        element: requirePermission(
          <ShippingRateDetailsPage />,
          PERMISSIONS.SHIPPING_RATES_VIEW,
        ),
      },
      {
        path: "shipping-rates/:shippingRateId/edit",
        element: requirePermission(
          <ShippingRateFormPage mode="edit" />,
          PERMISSIONS.SHIPPING_RATES_UPDATE,
        ),
      },
      {
        path: "pricing-plans",
        element: requirePermission(
          <PricingPlansPage />,
          PERMISSIONS.PRICING_PLANS_VIEW,
        ),
      },
      {
        path: "pricing-plans/create",
        element: requirePermission(
          <PricingPlanFormPage kind="plan" mode="create" />,
          PERMISSIONS.PRICING_PLANS_CREATE,
        ),
      },
      {
        path: "pricing-plans/:pricingPlanId",
        element: requirePermission(
          <PricingPlanDetailsPage />,
          PERMISSIONS.PRICING_PLANS_VIEW,
        ),
      },
      {
        path: "pricing-plans/:pricingPlanId/edit",
        element: requirePermission(
          <PricingPlanFormPage kind="plan" mode="edit" />,
          PERMISSIONS.PRICING_PLANS_UPDATE,
        ),
      },
      {
        path: "pricing-plan-rates",
        element: requirePermission(
          <PricingPlanRatesPage />,
          PERMISSIONS.PRICING_PLAN_RATES_VIEW,
        ),
      },
      {
        path: "pricing-plan-rates/create",
        element: requirePermission(
          <PricingPlanFormPage kind="rate" mode="create" />,
          PERMISSIONS.PRICING_PLAN_RATES_CREATE,
        ),
      },
      {
        path: "pricing-plan-rates/:pricingPlanRateId",
        element: requirePermission(
          <PricingPlanRateDetailsPage />,
          PERMISSIONS.PRICING_PLAN_RATES_VIEW,
        ),
      },
      {
        path: "pricing-plan-rates/:pricingPlanRateId/edit",
        element: requirePermission(
          <PricingPlanFormPage kind="rate" mode="edit" />,
          PERMISSIONS.PRICING_PLAN_RATES_UPDATE,
        ),
      },
      {
        path: "drivers",
        element: requirePermission(
          <DriversListPage />,
          PERMISSIONS.DRIVERS_VIEW,
        ),
      },
      {
        path: "driver-manifests",
        element: requirePermission(
          <DriverManifestsPage />,
          PERMISSIONS.DRIVER_MANIFESTS_VIEW,
        ),
      },
      {
        path: "driver-manifests/:manifestId",
        element: requirePermission(
          <DriverManifestDetailsPage />,
          PERMISSIONS.DRIVER_MANIFESTS_VIEW,
        ),
      },
      {
        path: "drivers/create",
        element: requirePermission(
          <DriverFormPage mode="create" />,
          PERMISSIONS.DRIVERS_CREATE,
        ),
      },
      {
        path: "drivers/:driverId",
        element: requirePermission(
          <DriverDetailsPage />,
          PERMISSIONS.DRIVERS_VIEW,
        ),
      },
      {
        path: "drivers/:driverId/edit",
        element: requirePermission(
          <DriverFormPage mode="edit" />,
          PERMISSIONS.DRIVERS_UPDATE,
        ),
      },
      {
        path: "warehouse",
        element: <Navigate to={adminPath("/warehouses")} replace />,
      },
      {
        path: "finance",
        element: requireAnyPermission(lazyElement(<FinanceReportsPage />), [
          PERMISSIONS.FINANCE_VIEW,
          PERMISSIONS.FINANCE_RECONCILIATION_VIEW,
          PERMISSIONS.FINANCE_REPORTS_VIEW,
          PERMISSIONS.FINANCE_REPORTS_DAILY_CASH,
          PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER,
          PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES,
          PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE,
          PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS,
        ]),
      },
      {
        path: "finance/operations",
        element: requireAnyPermission(lazyElement(<FinanceOperationsPage />), [
          PERMISSIONS.PAYOUTS_VIEW,
          PERMISSIONS.FINANCE_INVOICES_VIEW,
          PERMISSIONS.EXPENSES_VIEW,
          PERMISSIONS.CASH_CLOSURES_VIEW,
        ]),
      },
      {
        path: "finance/treasury",
        element: requirePermission(
          lazyElement(<FinanceTreasuryPage />),
          PERMISSIONS.FINANCE_TREASURY_VIEW,
        ),
      },
      {
        path: "finance/merchant-payouts",
        element: requirePermission(
          lazyElement(<MerchantPayoutsPage />),
          PERMISSIONS.PAYOUTS_VIEW,
        ),
      },
      {
        path: "finance/merchant-payouts/create",
        element: requirePermission(
          lazyElement(<FinancePayoutCreatePage />),
          PERMISSIONS.PAYOUTS_CREATE,
        ),
      },
      {
        path: "finance/merchant-payouts/:recordId",
        element: requirePermission(
          lazyElement(<FinancePayoutDetailsPage />),
          PERMISSIONS.PAYOUTS_VIEW,
        ),
      },
      {
        path: "finance/merchant-payouts/:recordId/edit",
        element: requirePermission(
          lazyElement(<FinancePayoutEditPage />),
          PERMISSIONS.PAYOUTS_UPDATE,
        ),
      },
      {
        path: "finance/driver-cash-closures",
        element: requirePermission(
          lazyElement(<DriverCashClosuresPage />),
          PERMISSIONS.CASH_CLOSURES_VIEW,
        ),
      },
      {
        path: "finance/driver-cash-closures/create",
        element: requirePermission(
          lazyElement(<FinanceCashClosureCreatePage />),
          PERMISSIONS.CASH_CLOSURES_CREATE,
        ),
      },
      {
        path: "finance/driver-cash-closures/:recordId",
        element: requirePermission(
          lazyElement(<FinanceCashClosureDetailsPage />),
          PERMISSIONS.CASH_CLOSURES_VIEW,
        ),
      },
      {
        path: "finance/driver-cash-closures/:recordId/edit",
        element: requirePermission(
          lazyElement(<FinanceCashClosureEditPage />),
          PERMISSIONS.CASH_CLOSURES_UPDATE,
        ),
      },
      {
        path: "finance/expenses",
        element: requirePermission(
          lazyElement(<ExpensesPage />),
          PERMISSIONS.EXPENSES_VIEW,
        ),
      },
      {
        path: "finance/expenses/create",
        element: requirePermission(
          lazyElement(<FinanceExpenseCreatePage />),
          PERMISSIONS.EXPENSES_CREATE,
        ),
      },
      {
        path: "finance/expenses/:recordId",
        element: requirePermission(
          lazyElement(<FinanceExpenseDetailsPage />),
          PERMISSIONS.EXPENSES_VIEW,
        ),
      },
      {
        path: "finance/expenses/:recordId/edit",
        element: requirePermission(
          lazyElement(<FinanceExpenseEditPage />),
          PERMISSIONS.EXPENSES_UPDATE,
        ),
      },
      {
        path: "finance/merchant-invoices",
        element: requirePermission(
          lazyElement(<MerchantInvoicesPage />),
          PERMISSIONS.FINANCE_INVOICES_VIEW,
        ),
      },
      {
        path: "finance/merchant-invoices/create",
        element: requirePermission(
          lazyElement(<FinanceInvoiceCreatePage />),
          PERMISSIONS.FINANCE_INVOICES_CREATE,
        ),
      },
      {
        path: "finance/merchant-invoices/:recordId",
        element: requirePermission(
          lazyElement(<FinanceInvoiceDetailsPage />),
          PERMISSIONS.FINANCE_INVOICES_VIEW,
        ),
      },
      {
        path: "finance/merchant-invoices/:recordId/edit",
        element: requirePermission(
          lazyElement(<FinanceInvoiceEditPage />),
          PERMISSIONS.FINANCE_INVOICES_UPDATE,
        ),
      },
      {
        path: "finance/treasury/accounts",
        element: requirePermission(
          <TreasuryAccountsPage />,
          PERMISSIONS.FINANCE_TREASURY_VIEW,
        ),
      },
      {
        path: "finance/treasury/accounts/create",
        element: requirePermission(
          <TreasuryAccountFormPage mode="create" />,
          PERMISSIONS.FINANCE_TREASURY_CREATE,
        ),
      },
      {
        path: "finance/treasury/accounts/:accountId",
        element: requirePermission(
          <TreasuryAccountDetailsPage />,
          PERMISSIONS.FINANCE_TREASURY_VIEW,
        ),
      },
      {
        path: "finance/treasury/accounts/:accountId/edit",
        element: requirePermission(
          <TreasuryAccountFormPage mode="edit" />,
          PERMISSIONS.FINANCE_TREASURY_UPDATE,
        ),
      },
      {
        path: "finance/treasury/transactions",
        element: requirePermission(
          <TreasuryTransactionsPage />,
          PERMISSIONS.FINANCE_TREASURY_VIEW,
        ),
      },
      {
        path: "warehouse/inbound",
        element: requireAnyPermission(<WarehouseInboundPage />, [
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
          PERMISSIONS.INVENTORY_VIEW,
        ]),
      },
      {
        path: "warehouse/inventory",
        element: requireAnyPermission(<WarehouseInventoryPage />, [
          PERMISSIONS.INVENTORY_VIEW,
          PERMISSIONS.STOCK_MOVEMENTS_VIEW,
          PERMISSIONS.COMPANY_CATALOG_VIEW,
          PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
        ]),
      },
      {
        path: "warehouse/fulfillment",
        element: requireAnyPermission(<WarehouseFulfillmentPage />, [
          PERMISSIONS.PICKING_LISTS_VIEW,
          PERMISSIONS.PACKING_TASKS_VIEW,
        ]),
      },
      {
        path: "warehouse/config",
        element: requireAnyPermission(<WarehouseConfigPage />, [
          PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
          PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
          PERMISSIONS.STORAGE_FEE_RULES_VIEW,
          PERMISSIONS.PICK_PACK_FEE_RULES_VIEW,
        ]),
      },
      {
        path: "company-catalog",
        element: requirePermission(lazyElement(<CompanyCatalogListPage />), PERMISSIONS.COMPANY_CATALOG_VIEW),
      },
      {
        path: "company-catalog/create",
        element: requirePermission(lazyElement(<CompanyCatalogCreatePage />), PERMISSIONS.COMPANY_CATALOG_CREATE),
      },
      {
        path: "company-catalog/:companyCatalogItemId/edit",
        element: requirePermission(lazyElement(<CompanyCatalogEditPage />), PERMISSIONS.COMPANY_CATALOG_UPDATE),
      },
      {
        path: "warehouses",
        element: requirePermission(
          lazyElement(<WarehousesPage />),
          PERMISSIONS.WAREHOUSE_VIEW,
        ),
      },
      {
        path: "warehouses/create",
        element: requirePermission(
          lazyElement(<WarehouseCreatePage />),
          PERMISSIONS.WAREHOUSE_CREATE,
        ),
      },
      {
        path: "warehouses/:recordId",
        element: requirePermission(
          lazyElement(<WarehouseDetailsPage />),
          PERMISSIONS.WAREHOUSE_VIEW,
        ),
      },
      {
        path: "warehouses/:recordId/edit",
        element: requirePermission(
          lazyElement(<WarehouseEditPage />),
          PERMISSIONS.WAREHOUSE_UPDATE,
        ),
      },
      {
        path: "warehouse-products",
        element: requirePermission(
          lazyElement(<WarehouseProductsPage />),
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse-products/create",
        element: requirePermission(
          lazyElement(<WarehouseProductCreatePage />),
          PERMISSIONS.INVENTORY_CREATE,
        ),
      },
      {
        path: "warehouse-products/:recordId",
        element: requirePermission(
          lazyElement(<WarehouseProductDetailsPage />),
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse-products/:recordId/edit",
        element: requirePermission(
          lazyElement(<WarehouseProductEditPage />),
          PERMISSIONS.INVENTORY_UPDATE,
        ),
      },
      {
        path: "inventory-stocks",
        element: requirePermission(
          lazyElement(<InventoryStocksPage />),
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "inventory-stocks/adjust",
        element: requirePermission(
          lazyElement(<WarehouseAdjustStockPage />),
          PERMISSIONS.STOCK_ADJUST,
        ),
      },
      {
        path: "inventory-stocks/:recordId",
        element: requirePermission(
          lazyElement(<InventoryStockDetailsPage />),
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "stock-movements",
        element: requirePermission(
          lazyElement(<StockMovementsPage />),
          PERMISSIONS.STOCK_MOVEMENTS_VIEW,
        ),
      },
      {
        path: "stock-movements/:recordId",
        element: requirePermission(
          lazyElement(<StockMovementDetailsPage />),
          PERMISSIONS.STOCK_MOVEMENTS_VIEW,
        ),
      },
      {
        path: "warehouse-returns",
        element: requirePermission(
          lazyElement(<WarehouseReturnsPage />),
          PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
        ),
      },
      {
        path: "warehouse-returns/create",
        element: requirePermission(
          lazyElement(<WarehouseReturnCreatePage />),
          PERMISSIONS.WAREHOUSE_RETURNS_CREATE,
        ),
      },
      {
        path: "warehouse-returns/:recordId",
        element: requirePermission(
          lazyElement(<WarehouseReturnDetailsPage />),
          PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
        ),
      },
      {
        path: "warehouse-charges",
        element: requirePermission(
          lazyElement(<WarehouseChargesPage />),
          PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
        ),
      },
      {
        path: "warehouse-charges/create",
        element: requirePermission(
          lazyElement(<WarehouseChargeCreatePage />),
          PERMISSIONS.WAREHOUSE_CHARGES_CREATE,
        ),
      },
      {
        path: "warehouse-charges/:recordId",
        element: requirePermission(
          lazyElement(<WarehouseChargeDetailsPage />),
          PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
        ),
      },
      {
        path: "warehouse-charges/:recordId/edit",
        element: requirePermission(
          lazyElement(<WarehouseChargeEditPage />),
          PERMISSIONS.WAREHOUSE_CHARGES_UPDATE,
        ),
      },
      {
        path: "stock-reservations",
        element: requirePermission(
          lazyElement(<StockReservationsPage />),
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse/locations",
        element: requirePermission(
          <WarehouseLocationsPage />,
          PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
        ),
      },
      {
        path: "warehouse/bins/:warehouseBinId",
        element: requirePermission(
          <WarehouseBinDetailsPage />,
          PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
        ),
      },
      {
        path: "warehouse/receipts",
        element: requirePermission(
          <WarehouseReceiptsPage />,
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse/receipts/:receiptId",
        element: requirePermission(
          <WarehouseReceiptDetailsPage />,
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse/transfers",
        element: requirePermission(
          <WarehouseTransfersPage />,
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse/transfers/:transferId",
        element: requirePermission(
          <WarehouseTransferDetailsPage />,
          PERMISSIONS.INVENTORY_VIEW,
        ),
      },
      {
        path: "warehouse/picking-lists",
        element: requirePermission(
          <PickingListsPage />,
          PERMISSIONS.PICKING_LISTS_VIEW,
        ),
      },
      {
        path: "warehouse/picking-lists/:pickingListId",
        element: requirePermission(
          <PickingListDetailsPage />,
          PERMISSIONS.PICKING_LISTS_VIEW,
        ),
      },
      {
        path: "warehouse/packing-tasks",
        element: requirePermission(
          <PackingTasksPage />,
          PERMISSIONS.PACKING_TASKS_VIEW,
        ),
      },
      {
        path: "warehouse/packing-tasks/:packingTaskId",
        element: requirePermission(
          <PackingTaskDetailsPage />,
          PERMISSIONS.PACKING_TASKS_VIEW,
        ),
      },
      {
        path: "warehouse/storage-fee-rules",
        element: requirePermission(
          <StorageFeeRulesPage />,
          PERMISSIONS.STORAGE_FEE_RULES_VIEW,
        ),
      },
      {
        path: "warehouse/pick-pack-fee-rules",
        element: requirePermission(
          <PickPackFeeRulesPage />,
          PERMISSIONS.PICK_PACK_FEE_RULES_VIEW,
        ),
      },
      {
        path: "warehouse/kpis",
        element: requirePermission(
          <WarehouseKpisPage />,
          PERMISSIONS.WAREHOUSE_KPIS_VIEW,
        ),
      },
      {
        path: "warehouse/inbound-requests",
        element: requireAnyPermission(<MerchantInboundStockRequestsPage />, [
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
        ]),
      },
      {
        path: "operations/barcodes",
        element: requireAnyPermission(<BarcodeOperationsPage />, [
          PERMISSIONS.BARCODES_LOOKUP,
          PERMISSIONS.BARCODES_SCAN,
        ]),
      },
      {
        path: "exports",
        element: requirePermission(<ExportsPage />, PERMISSIONS.EXPORTS_VIEW),
      },
      {
        path: "exports/:exportLogId",
        element: requirePermission(
          <ExportLogDetailsPage />,
          PERMISSIONS.EXPORTS_VIEW,
        ),
      },
      {
        path: "audit-logs",
        element: requirePermission(
          <AuditLogsPage />,
          PERMISSIONS.AUDIT_LOGS_VIEW,
        ),
      },
      {
        path: "404",
        element: <NotFoundPage />,
      },
      {
        path: "*",
        element: <MerchantNotFoundPage />,
      },
    ],
  },

  {
    path: merchantPath(),
    element: (
      <ProtectedRoute>
        <MerchantPortalProvider>
          <MerchantLayout />
        </MerchantPortalProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={merchantPath("/dashboard")} replace />,
      },
      {
        path: "dashboard",
        element: requireCapability(<MerchantDashboardPage />, "dashboard.view"),
      },
      {
        path: "orders",
        element: requireCapability(<MerchantOrdersListPage />, "orders.view"),
      },
      {
        path: "orders/create",
        element: requireCapability(
          <MerchantOrderCreatePage />,
          "orders.create",
        ),
      },
      {
        path: "orders/:orderId",
        element: requireCapability(<MerchantOrderDetailsPage />, "orders.view"),
      },
      {
        path: "orders/:orderId/edit",
        element: requireCapability(<MerchantOrderEditPage />, "orders.update"),
      },
      {
        path: "shipments",
        element: requireCapability(
          <MerchantShipmentsListPage />,
          "shipments.view",
        ),
      },
      {
        path: "shipments/:shipmentId",
        element: requireCapability(
          <MerchantShipmentDetailsPage />,
          "shipments.view",
        ),
      },
      {
        path: "warehouse/products",
        element: requireCapability(
          <MerchantWarehouseProductsPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/products/:productId",
        element: requireCapability(
          <MerchantWarehouseProductDetailsPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/inventory",
        element: requireCapability(
          <MerchantInventoryStocksPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/inventory/:inventoryStockId",
        element: requireCapability(
          <MerchantInventoryStockDetailsPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/inventory/low-stock",
        element: requireCapability(<MerchantLowStockPage />, "warehouse.view"),
      },
      {
        path: "warehouse/movements",
        element: requireCapability(
          <MerchantStockMovementsPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/charges",
        element: requireCapability(
          <MerchantWarehouseChargesPage />,
          "warehouse.view",
        ),
      },
      {
        path: "warehouse/inbound-requests",
        element: requireCapability(
          <MerchantInboundRequestsPage />,
          "warehouse.inbound_requests.view",
        ),
      },
      {
        path: "warehouse/inbound-requests/create",
        element: requireCapability(
          <MerchantInboundRequestCreatePage />,
          "warehouse.inbound_requests.create",
        ),
      },
      {
        path: "warehouse/inbound-requests/:inboundRequestId",
        element: requireCapability(
          <MerchantInboundRequestDetailsPage />,
          "warehouse.inbound_requests.view",
        ),
      },
      {
        path: "finance",
        element: requireCapability(
          <MerchantFinanceOverviewPage />,
          "finance.view",
        ),
      },
      {
        path: "finance/wallet",
        element: requireCapability(<MerchantWalletPage />, "wallet.view"),
      },
      {
        path: "finance/wallet/transactions",
        element: requireCapability(
          <MerchantWalletTransactionsPage />,
          "wallet.view",
        ),
      },
      {
        path: "finance/wallet/transactions/:transactionId",
        element: requireCapability(
          <MerchantWalletTransactionDetailsPage />,
          "wallet.view",
        ),
      },
      {
        path: "finance/invoices",
        element: requireCapability(<MerchantInvoicesPage />, "invoices.view"),
      },
      {
        path: "finance/invoices/:invoiceId",
        element: requireCapability(
          <MerchantInvoiceDetailsPage />,
          "invoices.view",
        ),
      },
      {
        path: "finance/payouts",
        element: requireCapability(<MerchantPayoutsPage />, "payouts.view"),
      },
      {
        path: "finance/payouts/request",
        element: requireCapability(
          <MerchantPayoutRequestPage />,
          "payouts.request",
        ),
      },
      {
        path: "finance/payouts/:payoutId",
        element: requireCapability(
          <MerchantPayoutDetailsPage />,
          "payouts.view",
        ),
      },
      {
        path: "profile/*",
        element: requireRole(<MerchantProfilePage />, "owner"),
      },
      {
        path: "users",
        element: requireCapability(<MerchantUsersPage />, "users.view"),
      },
      {
        path: "settings",
        element: requireCapability(<MerchantSettingsPage />, "settings.view"),
      },
      {
        path: "integrations/*",
        element: requireCapability(
          <MerchantIntegrationsPage />,
          "integrations.view",
        ),
      },
      {
        path: "exports",
        children: [
          {
            index: true,
            element: requireCapability(<MerchantExportsPage />, "exports.view"),
          },
          {
            path: "create",
            element: requireCapability(
              <MerchantExportCreatePage />,
              "exports.create",
            ),
          },
          {
            path: ":exportId",
            element: requireCapability(
              <MerchantExportDetailsPage />,
              "exports.view",
            ),
          },
        ],
      },
      {
        path: "store",
        element: requireCapability(<MerchantStorePage />, "store.view"),
      },
      {
        path: "403",
        element: <MerchantForbiddenPage />,
      },
      {
        path: "404",
        element: <MerchantNotFoundPage />,
      },
      {
        path: "*",
        element: <MerchantNotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <LegacyRouteHandler />,
  },
]);
