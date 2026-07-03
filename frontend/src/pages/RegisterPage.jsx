import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ─── Role selector config ──────────────────────────────────────── */
const ROLES = [
  { key: "CUSTOMER", label: "Customer", icon: "🛍️" },
  { key: "AGENT",    label: "Agent",    icon: "🚚" },
  { key: "ADMIN",    label: "Admin",    icon: "⚙️"  },
];

const STEPS = ["Role", "Profile", "Contact", "Password"];

/* ─── Password strength helper ──────────────────────────────────── */
function passwordStrength(p) {
  if (!p) return null;
  let score = 0;
  if (p.length >= 8)         score++;
  if (/[A-Z]/.test(p))       score++;
  if (/[0-9]/.test(p))       score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { label: "Weak",   bar: "bg-red-400",   w: "w-1/4" };
  if (score === 2) return { label: "Fair",   bar: "bg-yellow-400", w: "w-2/4" };
  if (score === 3) return { label: "Good",   bar: "bg-blue-400",  w: "w-3/4" };
  return              { label: "Strong", bar: "bg-green-500", w: "w-full" };
}

/* ─── Eye icon ───────────────────────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

/* ─── Field component ────────────────────────────────────────────── */
function Field({ label, error, hint, children }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step,        setStep]        = useState(0);
  const [role,        setRole]        = useState("CUSTOMER");
  const [form,        setForm]        = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showCfm,     setShowCfm]     = useState(false);

  /* Active steps depend on role (AGENT/ADMIN skip the form) */
  const isCustomer = role === "CUSTOMER";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setServerError("");
  }

  function validate(s) {
    const e = {};
    if (s === 1) {
      if (!form.name.trim())           e.name = "Full name is required";
      else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    }
    if (s === 2) {
      if (!form.email.trim())                                 e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
      if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, "")))
        e.phone = "Enter a valid 10-digit phone number";
    }
    if (s === 3) {
      if (!form.password)               e.password = "Password is required";
      else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
      if (!form.confirm)                 e.confirm = "Please confirm your password";
      else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    }
    return e;
  }

  function next() {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
    setErrors({});
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate(3);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError("");
    try {
      await register(form.name.trim(), form.email.trim(), form.phone.trim(), form.password);
      navigate("/customer");
    } catch (err) {
      setServerError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength(form.password);

  /* ── Left panel content ── */
  const panels = {
    CUSTOMER: {
      gradient: "from-blue-600 to-indigo-700",
      title: "Start delivering\nsmarter today.",
      desc: "Join thousands of customers managing their deliveries with ease and confidence.",
      badge: "🛍️  Customer Portal",
      items: [
        { icon: "✅", t: "Free to get started",  d: "No credit card required" },
        { icon: "🔒", t: "Secure & private",      d: "Your data is encrypted and safe" },
        { icon: "📱", t: "Works everywhere",       d: "Desktop, tablet, and mobile ready" },
      ],
    },
    AGENT: {
      gradient: "from-green-600 to-teal-700",
      title: "Deliver smarter,\nnot harder.",
      desc: "Agent accounts are created and managed by your delivery platform administrator.",
      badge: "🚚  Agent Portal",
      items: [
        { icon: "📋", t: "Assigned by Admin",      d: "Your admin sets up your account" },
        { icon: "🗺️", t: "Zone-based routing",     d: "Orders matched to your coverage area" },
        { icon: "✅", t: "Real-time updates",       d: "Update delivery status on the go" },
      ],
    },
    ADMIN: {
      gradient: "from-purple-600 to-indigo-800",
      title: "Full control,\nzero blind spots.",
      desc: "Admin accounts are provisioned at deployment. Contact your system administrator.",
      badge: "⚙️  Admin Portal",
      items: [
        { icon: "🔐", t: "Restricted access",      d: "Admin credentials set at deployment" },
        { icon: "📊", t: "Platform oversight",     d: "Manage all orders, agents, and zones" },
        { icon: "⚡", t: "Auto-assignment",         d: "Smart routing by zone and proximity" },
      ],
    },
  };

  const panel = panels[role];

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${panel.gradient} flex-col justify-between p-12 text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">📦</div>
          <span className="text-xl font-bold tracking-tight">DeliveryTracker</span>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            {panel.badge}
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 whitespace-pre-line">{panel.title}</h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">{panel.desc}</p>
          <div className="mt-10 space-y-4">
            {panel.items.map((f) => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{f.t}</p>
                  <p className="text-white/60 text-xs mt-0.5">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-sm">© {new Date().getFullYear()} DeliveryTracker. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold text-gray-900">DeliveryTracker</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
            <p className="text-gray-500 mt-1 text-sm">Choose your role to get started</p>
          </div>

          {/* Role tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
            {ROLES.map((r) => {
              const active = role === r.key;
              const cls = active
                ? r.key === "CUSTOMER" ? "bg-blue-600 text-white shadow-sm"
                : r.key === "AGENT"    ? "bg-green-600 text-white shadow-sm"
                :                        "bg-purple-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700";
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setRole(r.key); setStep(0); setErrors({}); setServerError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${cls}`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── AGENT: restricted ── */}
          {role === "AGENT" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🚚</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Agent accounts are invite-only</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Delivery agent accounts are created and managed by platform administrators.
                If you've been hired as an agent, ask your admin to set up your account.
              </p>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-semibold text-green-800 mb-1">Already have agent credentials?</p>
                <p className="text-xs text-green-700">
                  Head to the login page, select the <strong>Agent</strong> tab, and sign in with the credentials your admin provided.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
              >
                Go to Agent Login
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="mt-4 text-xs text-gray-400">
                Not an agent?{" "}
                <button onClick={() => setRole("CUSTOMER")} className="text-blue-600 font-medium hover:underline">Register as customer</button>
              </p>
            </div>
          )}

          {/* ── ADMIN: locked ── */}
          {role === "ADMIN" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Admin registration is restricted</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Admin accounts are provisioned during platform deployment and cannot be self-registered for security reasons.
              </p>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-semibold text-purple-800 mb-1">Are you an admin?</p>
                <p className="text-xs text-purple-700">
                  Use the credentials set during deployment to sign in. Select the <strong>Admin</strong> tab on the login page.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
              >
                Go to Admin Login
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="mt-4 text-xs text-gray-400">
                Not an admin?{" "}
                <button onClick={() => setRole("CUSTOMER")} className="text-blue-600 font-medium hover:underline">Register as customer</button>
              </p>
            </div>
          )}

          {/* ── CUSTOMER: multi-step wizard ── */}
          {role === "CUSTOMER" && (
            <>
              {/* Step indicator (steps 1-3, step 0 is role already selected) */}
              <div className="flex items-center mb-6">
                {["Profile", "Contact", "Password"].map((label, i) => {
                  const si = i + 1; // actual step index
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          si < step  ? "bg-blue-600 text-white"
                          : si === step ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-gray-200 text-gray-500"
                        }`}>
                          {si < step ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : si}
                        </div>
                        <span className={`text-xs mt-1 font-medium ${si === step ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                      </div>
                      {i < 2 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${si < step ? "bg-blue-600" : "bg-gray-200"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                {serverError && (
                  <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {serverError}
                  </div>
                )}

                <form
                  onSubmit={step === 3 ? submit : (e) => { e.preventDefault(); next(); }}
                  className="space-y-5"
                >
                  {/* Step 1 — Name */}
                  {step === 1 && (
                    <Field label="Full Name" error={errors.name}>
                      <input
                        type="text" name="name" autoComplete="name" autoFocus
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                        value={form.name} onChange={handleChange} placeholder="John Doe"
                      />
                    </Field>
                  )}

                  {/* Step 2 — Contact */}
                  {step === 2 && (
                    <>
                      <Field label="Email address" error={errors.email}>
                        <input
                          type="email" name="email" autoComplete="email" autoFocus
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                          value={form.email} onChange={handleChange} placeholder="you@example.com"
                        />
                      </Field>
                      <Field label={<>Phone number <span className="text-gray-400 font-normal text-xs">(optional)</span></>} error={errors.phone}>
                        <input
                          type="tel" name="phone" autoComplete="tel"
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                          value={form.phone} onChange={handleChange} placeholder="9999999999"
                        />
                      </Field>
                    </>
                  )}

                  {/* Step 3 — Password */}
                  {step === 3 && (
                    <>
                      <Field label="Password" error={errors.password}>
                        <div className="relative">
                          <input
                            type={showPwd ? "text" : "password"} name="password"
                            autoComplete="new-password" autoFocus
                            className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                            value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
                          />
                          <button type="button" onClick={() => setShowPwd((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            <EyeIcon open={showPwd} />
                          </button>
                        </div>
                        {strength && !errors.password && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${strength.bar} ${strength.w}`} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Strength: <span className="font-medium">{strength.label}</span>
                            </p>
                          </div>
                        )}
                      </Field>

                      <Field label="Confirm password" error={errors.confirm}>
                        <div className="relative">
                          <input
                            type={showCfm ? "text" : "password"} name="confirm"
                            autoComplete="new-password"
                            className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.confirm ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                            value={form.confirm} onChange={handleChange} placeholder="Re-enter your password"
                          />
                          <button type="button" onClick={() => setShowCfm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            <EyeIcon open={showCfm} />
                          </button>
                        </div>
                        {form.confirm && form.password === form.confirm && !errors.confirm && (
                          <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Passwords match
                          </p>
                        )}
                      </Field>
                    </>
                  )}

                  {/* Step 0 — role already chosen, start */}
                  {step === 0 && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🛍️</div>
                      <h3 className="font-bold text-gray-900 mb-1">Customer Registration</h3>
                      <p className="text-sm text-gray-500">
                        Create a free account to place orders and track your deliveries in real time.
                      </p>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-3 pt-1">
                    {step > 0 && (
                      <button type="button" onClick={back}
                        className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating account…
                        </>
                      ) : step < 3 ? (
                        <>
                          {step === 0 ? "Get started" : "Continue"}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : "Create account"}
                    </button>
                  </div>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
