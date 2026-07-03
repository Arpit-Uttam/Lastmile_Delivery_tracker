import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    key: "CUSTOMER",
    label: "Customer",
    icon: "🛍️",
    color: "blue",
    desc: "Track and manage your deliveries",
    panelTitle: "Track every package,\nevery mile.",
    panelDesc: "Real-time last-mile delivery tracking for customers. Place orders, track shipments, and stay updated at every step.",
    features: [
      { icon: "📦", title: "Place Orders", desc: "Book deliveries in minutes" },
      { icon: "📍", title: "Live Tracking", desc: "Know exactly where your parcel is" },
      { icon: "🔔", title: "Instant Updates", desc: "Get notified on every status change" },
    ],
    placeholder: "customer@example.com",
  },
  {
    key: "AGENT",
    label: "Agent",
    icon: "🚚",
    color: "green",
    desc: "Manage your delivery assignments",
    panelTitle: "Deliver smarter,\nnot harder.",
    panelDesc: "Access your assigned deliveries, update status on the go, and manage your daily routes efficiently.",
    features: [
      { icon: "📋", title: "My Assignments", desc: "View all orders assigned to you" },
      { icon: "✅", title: "Status Updates", desc: "Mark pickups and deliveries in real time" },
      { icon: "🗺️", title: "Zone Coverage", desc: "Deliveries matched to your zones" },
    ],
    placeholder: "agent@delivery.com",
  },
  {
    key: "ADMIN",
    label: "Admin",
    icon: "⚙️",
    color: "purple",
    desc: "Manage the entire delivery platform",
    panelTitle: "Full control,\nzero blind spots.",
    panelDesc: "Oversee all orders, agents, zones, and rate cards from one powerful dashboard.",
    features: [
      { icon: "📊", title: "Dashboard Stats", desc: "Live overview of all deliveries" },
      { icon: "👥", title: "Agent Management", desc: "Create and assign delivery agents" },
      { icon: "⚡", title: "Auto-Assignment", desc: "Smart agent routing by zone & proximity" },
    ],
    placeholder: "admin@delivery.com",
  },
];

const COLOR_MAP = {
  blue: {
    tab: "bg-blue-600 text-white",
    tabInactive: "text-blue-600 hover:bg-blue-50",
    ring: "focus:ring-blue-500",
    btn: "bg-blue-600 hover:bg-blue-700",
    panel: "from-blue-600 to-indigo-700",
    badge: "bg-blue-100 text-blue-700",
  },
  green: {
    tab: "bg-green-600 text-white",
    tabInactive: "text-green-700 hover:bg-green-50",
    ring: "focus:ring-green-500",
    btn: "bg-green-600 hover:bg-green-700",
    panel: "from-green-600 to-teal-700",
    badge: "bg-green-100 text-green-700",
  },
  purple: {
    tab: "bg-purple-600 text-white",
    tabInactive: "text-purple-700 hover:bg-purple-50",
    ring: "focus:ring-purple-500",
    btn: "bg-purple-600 hover:bg-purple-700",
    panel: "from-purple-600 to-indigo-800",
    badge: "bg-purple-100 text-purple-700",
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("CUSTOMER");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const role = ROLES.find((r) => r.key === activeRole);
  const colors = COLOR_MAP[role.color];

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleRoleSwitch(key) {
    setActiveRole(key);
    setError("");
    setForm({ email: "", password: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.password) { setError("Password is required"); return; }
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      // Validate the logged-in user matches the selected role tab
      if (user.role !== activeRole) {
        setError(`This account is registered as ${user.role.charAt(0) + user.role.slice(1).toLowerCase()}, not ${role.label}. Please select the correct role tab.`);
        setLoading(false);
        return;
      }
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "AGENT") navigate("/agent");
      else navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dynamic per role */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${colors.panel} flex-col justify-between p-12 text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">
            📦
          </div>
          <span className="text-xl font-bold tracking-tight">DeliveryTracker</span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-6">
            <span className="text-base">{role.icon}</span>
            <span className="text-sm font-semibold">{role.label} Portal</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 whitespace-pre-line">
            {role.panelTitle}
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            {role.panelDesc}
          </p>

          <div className="mt-10 space-y-4">
            {role.features.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-sm">© {new Date().getFullYear()} DeliveryTracker. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold text-gray-900">DeliveryTracker</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Select your role and sign in</p>
          </div>

          {/* Role tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRoleSwitch(r.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === r.key
                    ? `${COLOR_MAP[r.color].tab} shadow-sm`
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Role context hint */}
            <div className={`mb-5 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${colors.badge}`}>
              <span>{role.icon}</span>
              <span>{role.desc}</span>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  className={`w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent transition`}
                  value={form.email}
                  onChange={handleChange}
                  placeholder={role.placeholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    className={`w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent transition`}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${colors.btn} text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  `Sign in as ${role.label}`
                )}
              </button>
            </form>

            {/* Register link — only for CUSTOMER */}
            {activeRole === "CUSTOMER" && (
              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Create one free
                </Link>
              </p>
            )}

            {activeRole === "AGENT" && (
              <p className="mt-6 text-center text-xs text-gray-400">
                Agent accounts are created by your admin.{" "}
                <span className="text-gray-500 font-medium">Contact your administrator</span> if you don't have access.
              </p>
            )}

            {activeRole === "ADMIN" && (
              <p className="mt-6 text-center text-xs text-gray-400">
                Admin access is provisioned at deployment.{" "}
                <span className="text-gray-500 font-medium">Contact your system administrator</span> for credentials.
              </p>
            )}
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            <Link to="/track" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
              Track a package without signing in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
