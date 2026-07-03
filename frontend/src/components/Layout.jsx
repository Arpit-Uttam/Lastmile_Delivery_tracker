import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = {
  CUSTOMER: [
    { to: "/customer", label: "Dashboard" },
    { to: "/customer/place-order", label: "New Order" },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/zones", label: "Zones" },
    { to: "/admin/rate-cards", label: "Rate Cards" },
    { to: "/admin/agents", label: "Agents" },
  ],
  AGENT: [
    { to: "/agent", label: "My Deliveries" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = NAV_LINKS[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="font-bold text-primary text-lg tracking-tight">
            📦 DeliveryTracker
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? "bg-blue-50 text-primary"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500">
              {user?.name} <span className="text-xs bg-gray-100 rounded px-1">{user?.role}</span>
            </span>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
