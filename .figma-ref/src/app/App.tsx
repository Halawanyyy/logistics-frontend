import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { LoginPage } from "./pages/login";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { AppLayout } from "./components/app-layout";
import { DashboardPage } from "./pages/dashboard";
import { ShipmentsPage } from "./pages/shipments";
import { ShipmentDetailPage } from "./pages/shipment-detail";
import { CreateShipmentPage } from "./pages/create-shipment";
import { WarehousePage } from "./pages/warehouse";
import { StockInPage } from "./pages/stock-in";
import { FinancialPage } from "./pages/financial";
import { MerchantsPage } from "./pages/merchants";
import { CouriersPage } from "./pages/couriers";
import { SettingsPage } from "./pages/settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/shipments/create" element={<CreateShipmentPage />} />
          <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/warehouse/stock-in" element={<StockInPage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/merchants" element={<MerchantsPage />} />
          <Route path="/couriers" element={<CouriersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
