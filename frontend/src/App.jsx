import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TrackPage from "./pages/TrackPage";

// Customer pages
import CustomerDashboard from "./pages/customer/Dashboard";
import PlaceOrder from "./pages/customer/PlaceOrder";
import OrderDetail from "./pages/customer/OrderDetail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminZones from "./pages/admin/Zones";
import AdminRateCards from "./pages/admin/RateCards";
import AdminAgents from "./pages/admin/Agents";
import AdminOrderDetail from "./pages/admin/OrderDetail";

// Agent pages
import AgentDashboard from "./pages/agent/Dashboard";
import AgentOrderDetail from "./pages/agent/OrderDetail";

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "AGENT") return <Navigate to="/agent" replace />;
  return <Navigate to="/customer" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/track/:trackingNumber" element={<TrackPage />} />
          <Route path="/track" element={<TrackPage />} />

          {/* Customer routes */}
          <Route path="/customer" element={<PrivateRoute roles={["CUSTOMER"]}><Layout /></PrivateRoute>}>
            <Route index element={<CustomerDashboard />} />
            <Route path="place-order" element={<PlaceOrder />} />
            <Route path="orders/:id" element={<OrderDetail />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute roles={["ADMIN"]}><Layout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="zones" element={<AdminZones />} />
            <Route path="rate-cards" element={<AdminRateCards />} />
            <Route path="agents" element={<AdminAgents />} />
          </Route>

          {/* Agent routes */}
          <Route path="/agent" element={<PrivateRoute roles={["AGENT"]}><Layout /></PrivateRoute>}>
            <Route index element={<AgentDashboard />} />
            <Route path="orders/:id" element={<AgentOrderDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
