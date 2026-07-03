import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = {
  CUSTOMER: [
    { to: "/customer", label: "Dashboard", exact: true },
    { to: "/customer/place-order", label: "New Order" },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/zones", label: "Zones" },
    { to: "/admin/rate-cards", label: "Rate Cards" },
    { to: "/admin/agents", label: "Agents" },
  ],
  AGENT: [
    { to: "/agent", label: "My Deliveries", exact: true },
  ],
};

const ROLE_COLORS = {
  ADMIN: "bg-purple-100 text-purple-700",
  AGENT: "bg-green-100 text-green-700",
  CUSTOMER: "bg-blue-100 text-blue-700",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = NAV_LINKS[user?.role] || [];

  function isActive(link) {
    return link.exact
      ? location.pathname === link.to
      : location.pathname.startsWith(link.to);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                📦
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight hidden sm:block">
                DeliveryTracker
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(l)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${ROLE_COLORS[user?.role]}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${ROLE_COLORS[user?.role]}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
