import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import TrackingTimeline from "../../components/TrackingTimeline";

const ALL_STATUSES = ["CREATED", "CONFIRMED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED"];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: o }, { data: a }] = await Promise.all([
      api.get(`/orders/${id}`),
      api.get("/agents"),
    ]);
    setOrder(o);
    setAgents(a);
    setOverrideStatus(o.status);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  async function saveStatus() {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: overrideStatus, note: overrideNote });
      await load();
      setOverrideNote("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  async function autoAssign() {
    setSaving(true);
    try {
      await api.post(`/admin/orders/${id}/auto-assign`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "No agents available");
    } finally { setSaving(false); }
  }

  async function manualAssign() {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      await api.post(`/admin/orders/${id}/assign/${selectedAgent}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!order) return <div className="text-center py-12">Order not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/admin/orders" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Orders</Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono font-bold text-xl text-primary">{order.trackingNumber}</p>
            <p className="text-sm text-gray-500 mt-1">Customer: {order.customer?.name} ({order.customer?.email})</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">From</p>
            <p className="font-medium">{order.pickupAddress}</p>
            <p className="text-xs text-gray-400">{order.pickupPincode} · {order.pickupZone?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">To</p>
            <p className="font-medium">{order.dropAddress}</p>
            <p className="text-xs text-gray-400">{order.dropPincode} · {order.dropZone?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Package</p>
            <p className="font-medium">{order.length}×{order.breadth}×{order.height} cm · {order.actualWeight}kg</p>
            <p className="text-xs text-gray-400">Vol: {order.volumetricWeight}kg · Chargeable: {order.chargeableWeight}kg</p>
          </div>
          <div>
            <p className="text-gray-500">Charges</p>
            <p className="font-bold text-primary">₹{order.totalCharge}</p>
            <p className="text-xs text-gray-400">Base: ₹{order.baseCharge} · COD: ₹{order.codSurcharge}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium">{order.orderType} · {order.paymentType}</p>
          </div>
          {order.agent && (
            <div>
              <p className="text-gray-500">Agent</p>
              <p className="font-medium">{order.agent.user?.name}</p>
              <p className="text-xs text-gray-400">{order.agent.user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Assignment */}
      <div className="card">
        <h3 className="font-semibold mb-4">Agent Assignment</h3>
        <div className="flex gap-3 mb-3">
          <button onClick={autoAssign} disabled={saving || !!order.agentId} className="btn-primary">
            Auto-Assign
          </button>
        </div>
        <div className="flex gap-3">
          <select className="input flex-1" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="">Select agent manually</option>
            {agents.filter((a) => a.status === "AVAILABLE").map((a) => (
              <option key={a.id} value={a.id}>{a.user?.name} ({a.status})</option>
            ))}
          </select>
          <button onClick={manualAssign} disabled={!selectedAgent || saving} className="btn-primary">
            Assign
          </button>
        </div>
      </div>

      {/* Status Override */}
      <div className="card">
        <h3 className="font-semibold mb-4">Override Status</h3>
        <div className="space-y-3">
          <select className="input" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <input className="input" placeholder="Note (optional)" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} />
          <button onClick={saveStatus} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Tracking History</h3>
        <TrackingTimeline events={order.trackingHistory} />
      </div>
    </div>
  );
}
