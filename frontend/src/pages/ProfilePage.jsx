import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/* ── helpers ───────────────────────────────────────────────────── */
function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const ROLE_STYLE = {
  ADMIN:    { bg: "bg-purple-100", text: "text-purple-700", ring: "focus:ring-purple-500", btn: "bg-purple-600 hover:bg-purple-700" },
  AGENT:    { bg: "bg-green-100",  text: "text-green-700",  ring: "focus:ring-green-500",  btn: "bg-green-600 hover:bg-green-700"   },
  CUSTOMER: { bg: "bg-blue-100",   text: "text-blue-700",   ring: "focus:ring-blue-500",   btn: "bg-blue-600 hover:bg-blue-700"     },
};

const AGENT_STATUS_OPTS = ["AVAILABLE", "BUSY", "OFFLINE"];
const STATUS_BADGE = {
  AVAILABLE: "bg-green-100 text-green-700",
  BUSY:      "bg-yellow-100 text-yellow-700",
  OFFLINE:   "bg-gray-100 text-gray-600",
};

/* ── Input field ───────────────────────────────────────────────── */
function InputField({ label, name, value, onChange, type = "text", placeholder, error, hint, readOnly, ring }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition
          focus:outline-none focus:ring-2 focus:border-transparent
          ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white border-gray-300"}
          ${error ? "border-red-400 bg-red-50" : ""}
          ${ring || "focus:ring-blue-500"}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/* ── Section wrapper ───────────────────────────────────────────── */
function Section({ title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Alert ─────────────────────────────────────────────────────── */
function Alert({ type, msg }) {
  if (!msg) return null;
  const styles = type === "success"
    ? "bg-green-50 border-green-100 text-green-700"
    : "bg-red-50 border-red-100 text-red-700";
  const icon = type === "success"
    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />;
  return (
    <div className={`flex items-center gap-2.5 p-3.5 border rounded-xl text-sm ${styles}`}>
      <svg className="w-4 h-4 shrink-0" fill={type === "error" ? "currentColor" : "none"} stroke={type === "success" ? "currentColor" : "none"} viewBox="0 0 24 24">
        {icon}
      </svg>
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const style = ROLE_STYLE[user?.role] || ROLE_STYLE.CUSTOMER;

  /* profile form */
  const [profile, setProfile]     = useState({ name: "", phone: "" });
  const [profileErr, setProfileErr] = useState({});
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  /* password form */
  const [pwd, setPwd]         = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdErr, setPwdErr]   = useState({});
  const [pwdMsg, setPwdMsg]   = useState({ type: "", text: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  /* agent-specific */
  const [agentData, setAgentData]       = useState(null);
  const [agentStatus, setAgentStatus]   = useState("AVAILABLE");
  const [agentMsg, setAgentMsg]         = useState({ type: "", text: "" });
  const [savingAgent, setSavingAgent]   = useState(false);

  /* stats */
  const [stats, setStats] = useState(null);

  /* ── load profile ── */
  useEffect(() => {
    api.get("/auth/me").then(({ data }) => {
      setProfile({ name: data.name || "", phone: data.phone || "" });
    });

    if (user?.role === "AGENT") {
      api.get("/agents/me").then(({ data }) => {
        setAgentData(data);
        setAgentStatus(data.status);
        // compute stats
        const orders = data.orders || [];
        setStats({
          total:     orders.length,
          delivered: orders.filter((o) => o.status === "DELIVERED").length,
          failed:    orders.filter((o) => o.status === "FAILED").length,
          active:    orders.filter((o) => !["DELIVERED","FAILED","RESCHEDULED"].includes(o.status)).length,
        });
      }).catch(() => {});
    }

    if (user?.role === "ADMIN") {
      api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    }

    if (user?.role === "CUSTOMER") {
      api.get("/orders").then(({ data }) => {
        const orders = Array.isArray(data) ? data : (data.orders || []);
        setStats({
          total:     orders.length,
          delivered: orders.filter((o) => o.status === "DELIVERED").length,
          active:    orders.filter((o) => !["DELIVERED","FAILED","RESCHEDULED"].includes(o.status)).length,
          failed:    orders.filter((o) => o.status === "FAILED").length,
        });
      }).catch(() => {});
    }
  }, [user?.role]);

  /* ── profile submit ── */
  async function handleProfileSave(e) {
    e.preventDefault();
    const errs = {};
    if (!profile.name.trim())        errs.name = "Name is required";
    else if (profile.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\D/g, "")))
      errs.phone = "Enter a valid 10-digit number";
    if (Object.keys(errs).length) { setProfileErr(errs); return; }

    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const { data } = await api.patch("/auth/me", {
        name: profile.name.trim(),
        phone: profile.phone.trim() || null,
      });
      updateUser({ name: data.user.name, phone: data.user.phone });
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.error || "Update failed." });
    } finally {
      setSavingProfile(false);
    }
  }

  /* ── password submit ── */
  async function handlePwdSave(e) {
    e.preventDefault();
    const errs = {};
    if (!pwd.current)              errs.current = "Current password is required";
    if (!pwd.next)                 errs.next = "New password is required";
    else if (pwd.next.length < 6)  errs.next = "Must be at least 6 characters";
    if (!pwd.confirm)              errs.confirm = "Please confirm your new password";
    else if (pwd.next !== pwd.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setPwdErr(errs); return; }

    setSavingPwd(true);
    setPwdMsg({ type: "", text: "" });
    try {
      await api.patch("/auth/me", { currentPassword: pwd.current, newPassword: pwd.next });
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMsg({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setPwdMsg({ type: "error", text: err.response?.data?.error || "Password change failed." });
    } finally {
      setSavingPwd(false);
    }
  }

  /* ── agent status submit ── */
  async function handleAgentStatusSave(e) {
    e.preventDefault();
    if (!agentData) return;
    setSavingAgent(true);
    setAgentMsg({ type: "", text: "" });
    try {
      await api.patch(`/agents/${agentData.id}`, { status: agentStatus });
      setAgentData((prev) => ({ ...prev, status: agentStatus }));
      setAgentMsg({ type: "success", text: "Status updated." });
    } catch (err) {
      setAgentMsg({ type: "error", text: err.response?.data?.error || "Update failed." });
    } finally {
      setSavingAgent(false);
    }
  }

  /* ── stat cards ── */
  function StatCards() {
    if (!stats) return null;
    const cards = user?.role === "ADMIN"
      ? [
          { label: "Total Orders",    value: stats.totalOrders ?? 0,    icon: "📦" },
          { label: "Delivered",       value: stats.deliveredOrders ?? 0, icon: "✅" },
          { label: "Active Agents",   value: stats.activeAgents ?? 0,   icon: "🚚" },
          { label: "Total Customers", value: stats.totalCustomers ?? 0, icon: "👥" },
        ]
      : [
          { label: "Total Orders", value: stats.total ?? 0,     icon: "📦" },
          { label: "Delivered",    value: stats.delivered ?? 0, icon: "✅" },
          { label: "Active",       value: stats.active ?? 0,    icon: "🔄" },
          { label: "Failed",       value: stats.failed ?? 0,    icon: "❌" },
        ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{c.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
    );
  }

  /* ── render ── */
  const roleLabel = user?.role?.charAt(0) + (user?.role?.slice(1)?.toLowerCase() ?? "");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl ${style.bg} flex items-center justify-center text-2xl font-bold ${style.text}`}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h1>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                {roleLabel}
              </span>
              {user?.role === "AGENT" && agentData && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[agentData.status]}`}>
                  {agentData.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick info row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: "Phone", value: user?.phone || "—" },
            { label: "Member since", value: fmt(agentData?.user?.createdAt) },
            ...(user?.role === "AGENT" && agentData?.agentZones?.length
              ? [{ label: "Zones", value: agentData.agentZones.map((az) => az.zone.name).join(", ") }]
              : []),
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatCards />

      {/* Agent-specific: zone coverage */}
      {user?.role === "AGENT" && agentData?.agentZones?.length > 0 && (
        <Section title="Assigned Zones" desc="Delivery zones you are responsible for">
          <div className="flex flex-wrap gap-2">
            {agentData.agentZones.map((az) => (
              <span key={az.zone.id} className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                {az.zone.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Agent status update */}
      {user?.role === "AGENT" && agentData && (
        <Section title="Availability Status" desc="Update your current working status">
          <form onSubmit={handleAgentStatusSave} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {AGENT_STATUS_OPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAgentStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    agentStatus === s
                      ? `border-green-500 ${STATUS_BADGE[s]}`
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {s === "AVAILABLE" ? "🟢" : s === "BUSY" ? "🟡" : "⚫"} {s}
                </button>
              ))}
            </div>
            <Alert type={agentMsg.type} msg={agentMsg.text} />
            <button
              type="submit"
              disabled={savingAgent || agentStatus === agentData.status}
              className={`${style.btn} text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {savingAgent ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
              ) : "Update Status"}
            </button>
          </form>
        </Section>
      )}

      {/* Edit profile info */}
      <Section title="Personal Information" desc="Update your name and phone number">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <InputField
            label="Full Name" name="name" value={profile.name}
            onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileErr((p) => ({ ...p, name: "" })); }}
            placeholder="Your full name" error={profileErr.name} ring={style.ring}
          />
          <InputField
            label="Email address" name="email" value={user?.email || ""}
            readOnly hint="Email cannot be changed" ring={style.ring}
          />
          <InputField
            label={<>Phone <span className="text-gray-400 font-normal text-xs">(optional)</span></>}
            name="phone" value={profile.phone}
            onChange={(e) => { setProfile((p) => ({ ...p, phone: e.target.value })); setProfileErr((p) => ({ ...p, phone: "" })); }}
            placeholder="9999999999" error={profileErr.phone} ring={style.ring}
          />
          <Alert type={profileMsg.type} msg={profileMsg.text} />
          <button
            type="submit"
            disabled={savingProfile}
            className={`${style.btn} text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {savingProfile ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
            ) : "Save Changes"}
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password" desc="Choose a strong password to keep your account secure">
        <form onSubmit={handlePwdSave} className="space-y-4">
          {[
            { label: "Current password",     key: "current", ac: "current-password" },
            { label: "New password",          key: "next",    ac: "new-password", hint: "Minimum 6 characters" },
            { label: "Confirm new password",  key: "confirm", ac: "new-password" },
          ].map(({ label, key, ac, hint }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPwd[key] ? "text" : "password"}
                  autoComplete={ac}
                  value={pwd[key]}
                  onChange={(e) => { setPwd((p) => ({ ...p, [key]: e.target.value })); setPwdErr((p) => ({ ...p, [key]: "" })); }}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${style.ring} focus:border-transparent transition ${pwdErr[key] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <button type="button" onClick={() => setShowPwd((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPwd[key]
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {pwdErr[key] && <p className="mt-1 text-xs text-red-600">{pwdErr[key]}</p>}
              {hint && !pwdErr[key] && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
            </div>
          ))}
          <Alert type={pwdMsg.type} msg={pwdMsg.text} />
          <button
            type="submit"
            disabled={savingPwd}
            className={`${style.btn} text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {savingPwd ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Changing…</>
            ) : "Change Password"}
          </button>
        </form>
      </Section>

      {/* Account info — read only */}
      <Section title="Account Details" desc="Read-only information about your account">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "User ID",       value: user?.id },
            { label: "Role",          value: roleLabel },
            { label: "Email",         value: user?.email },
            { label: "Member since",  value: fmt(agentData?.user?.createdAt || user?.createdAt) },
          ].map((row) => (
            <div key={row.label} className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
              <p className="text-sm font-medium text-gray-800 break-all">{row.value || "—"}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
