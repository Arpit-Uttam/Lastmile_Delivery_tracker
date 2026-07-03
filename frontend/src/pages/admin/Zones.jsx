import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminZones() {
  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState("");
  const [newArea, setNewArea] = useState({ zoneId: "", name: "", pincode: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get("/zones");
    setZones(data);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function addZone(e) {
    e.preventDefault();
    if (!newZone.trim()) return;
    setSaving(true);
    try {
      await api.post("/zones", { name: newZone.trim() });
      setNewZone("");
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  async function deleteZone(id) {
    if (!confirm("Delete this zone?")) return;
    try {
      await api.delete(`/zones/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Cannot delete zone with active data");
    }
  }

  async function addArea(e) {
    e.preventDefault();
    if (!newArea.zoneId || !newArea.name || !newArea.pincode) return;
    setSaving(true);
    try {
      await api.post(`/zones/${newArea.zoneId}/areas`, { name: newArea.name, pincode: newArea.pincode });
      setNewArea({ zoneId: newArea.zoneId, name: "", pincode: "" });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  async function deleteArea(areaId) {
    try {
      await api.delete(`/zones/areas/${areaId}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Zones & Areas</h2>

      <div className="card">
        <h3 className="font-semibold mb-3">Add Zone</h3>
        <form onSubmit={addZone} className="flex gap-3">
          <input className="input flex-1" value={newZone} onChange={(e) => setNewZone(e.target.value)} placeholder="Zone name e.g. Zone D" />
          <button type="submit" disabled={saving} className="btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Add Area to Zone</h3>
        <form onSubmit={addArea} className="grid grid-cols-3 gap-3">
          <select className="input" value={newArea.zoneId} onChange={(e) => setNewArea({ ...newArea, zoneId: e.target.value })}>
            <option value="">Select zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <input className="input" placeholder="Area name" value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
          <input className="input" placeholder="Pincode" value={newArea.pincode} onChange={(e) => setNewArea({ ...newArea, pincode: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary col-span-3">Add Area</button>
        </form>
      </div>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{zone.name}</h3>
              <button onClick={() => deleteZone(zone.id)} className="text-xs text-red-500 hover:text-red-700">Delete Zone</button>
            </div>
            {zone.areas.length === 0 ? (
              <p className="text-sm text-gray-400">No areas assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {zone.areas.map((area) => (
                  <div key={area.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                    <span>{area.name} ({area.pincode})</span>
                    <button onClick={() => deleteArea(area.id)} className="ml-1 text-blue-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
