import React, { useEffect, useState } from "react";
import api from "../../services/api";

const EMPTY_FORM = { name: "", orderType: "B2C", isIntraZone: true, ratePerKg: "", minimumCharge: "", codSurcharge: "" };

export default function AdminRateCards() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get("/rate-cards");
    setCards(data);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm({ ...form, [field]: val });
    };
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        isIntraZone: form.isIntraZone === true || form.isIntraZone === "true",
        ratePerKg: parseFloat(form.ratePerKg),
        minimumCharge: parseFloat(form.minimumCharge || 0),
        codSurcharge: parseFloat(form.codSurcharge || 0),
      };
      if (editId) {
        await api.put(`/rate-cards/${editId}`, payload);
      } else {
        await api.post("/rate-cards", payload);
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  }

  function startEdit(card) {
    setEditId(card.id);
    setForm({ name: card.name, orderType: card.orderType, isIntraZone: card.isIntraZone, ratePerKg: card.ratePerKg, minimumCharge: card.minimumCharge, codSurcharge: card.codSurcharge });
  }

  async function deleteCard(id) {
    if (!confirm("Delete this rate card?")) return;
    try {
      await api.delete(`/rate-cards/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Rate Cards</h2>

      <div className="card">
        <h3 className="font-semibold mb-4">{editId ? "Edit Rate Card" : "New Rate Card"}</h3>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input className="input" value={form.name} onChange={set("name")} required placeholder="B2C Intra-Zone" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Order Type</label>
              <select className="input" value={form.orderType} onChange={set("orderType")}>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Zone Type</label>
              <select className="input" value={String(form.isIntraZone)} onChange={set("isIntraZone")}>
                <option value="true">Intra-Zone</option>
                <option value="false">Inter-Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rate per kg (₹)</label>
              <input type="number" className="input" value={form.ratePerKg} onChange={set("ratePerKg")} required min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Minimum Charge (₹)</label>
              <input type="number" className="input" value={form.minimumCharge} onChange={set("minimumCharge")} min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">COD Surcharge (%)</label>
              <input type="number" className="input" value={form.codSurcharge} onChange={set("codSurcharge")} min="0" step="0.1" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : editId ? "Update" : "Create"}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY_FORM); }} className="btn-secondary">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {cards.map((card) => (
          <div key={card.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{card.name}</p>
              <p className="text-sm text-gray-500">{card.orderType} · {card.isIntraZone ? "Intra-Zone" : "Inter-Zone"}</p>
              <p className="text-sm text-gray-500">₹{card.ratePerKg}/kg · Min: ₹{card.minimumCharge} · COD: {card.codSurcharge}%</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(card)} className="btn-secondary text-xs py-1 px-2">Edit</button>
              <button onClick={() => deleteCard(card.id)} className="text-xs text-red-500 hover:text-red-700 px-2">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
