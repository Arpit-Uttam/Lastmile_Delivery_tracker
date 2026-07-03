import React, { useEffect, useState } from "react";
import api from "../../services/api";

const STATUS_COLORS = { AVAILABLE: "text-green-600", BUSY: "text-yellow-600", OFFLINE: "text-gray-400" };

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", zoneIds: [] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: a }, { data: z }] = await Promise.all([api.get("/agents"), api.get("/zones")]);
    setAgents(a);
    setZones(z);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  function toggleZone(zoneId) {
    setForm((f) => ({
      ...f,
      zoneIds: f.zoneIds.includes(zoneId) ? f.zoneIds.filter((z) => z !== zoneId) : [...f.zoneIds, zoneId],
    }));
  }

  async function createAgent(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/agents", form);
      setForm({ name: "", email: "", phone: "", password: "", zoneIds: [] });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  async function updateZones(agentId, zoneIds) {
    try {
      await api.post(`/agents/${agentId}/zones`, { zoneIds });
      await load();
    } catch (err) {
      alert("Failed to update zones");
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Delivery Agents</h2>

      <div className="card">
        <h3 className="font-semibold mb-4">Add Agent</h3>
        <form onSubmit={createAgent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Assign Zones</label>
            <div className="flex flex-wrap gap-2">
              {zones.map((z) => (
                <label key={z.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.zoneIds.includes(z.id)} onChange={() => toggleZone(z.id)} />
                  <span className="text-sm">{z.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Agent"}</button>
        </form>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{agent.user?.name}</p>
                <p className="text-sm text-gray-500">{agent.user?.email}</p>
                <p className={`text-sm font-medium mt-1 ${STATUS_COLORS[agent.status]}`}>{agent.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Zones:</p>
                <div className="flex flex-wrap gap-1 mt-1 justify-end">
                  {agent.agentZones.map((az) => (
                    <span key={az.zone.id} className="badge bg-blue-50 text-blue-700">{az.zone.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
