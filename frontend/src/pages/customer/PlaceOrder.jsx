import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const INITIAL_FORM = {
  pickupAddress: "", pickupPincode: "",
  dropAddress: "", dropPincode: "",
  length: "", breadth: "", height: "",
  actualWeight: "",
  orderType: "B2C",
  paymentType: "PREPAID",
};

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function getQuote(e) {
    e.preventDefault();
    setQuoteError("");
    setLoading(true);
    try {
      const { data } = await api.post("/orders/quote", {
        ...form,
        length: parseFloat(form.length),
        breadth: parseFloat(form.breadth),
        height: parseFloat(form.height),
        actualWeight: parseFloat(form.actualWeight),
      });
      setQuote(data);
    } catch (err) {
      setQuoteError(err.response?.data?.error || "Could not calculate quote");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder() {
    setConfirming(true);
    try {
      const { data } = await api.post("/orders", {
        ...form,
        length: parseFloat(form.length),
        breadth: parseFloat(form.breadth),
        height: parseFloat(form.height),
        actualWeight: parseFloat(form.actualWeight),
      });
      navigate(`/customer/orders/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Order creation failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Place New Order</h2>

      <form onSubmit={getQuote} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">Pickup Details</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pickup Address</label>
            <input className="input" value={form.pickupAddress} onChange={set("pickupAddress")} required placeholder="123 Main St, City" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pickup Pincode</label>
            <input className="input" value={form.pickupPincode} onChange={set("pickupPincode")} required placeholder="110001" />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">Drop Details</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Drop Address</label>
            <input className="input" value={form.dropAddress} onChange={set("dropAddress")} required placeholder="456 Market Rd, City" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Drop Pincode</label>
            <input className="input" value={form.dropPincode} onChange={set("dropPincode")} required placeholder="110003" />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">Package Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Length (cm)</label>
              <input type="number" className="input" value={form.length} onChange={set("length")} required min="1" step="0.1" placeholder="20" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Breadth (cm)</label>
              <input type="number" className="input" value={form.breadth} onChange={set("breadth")} required min="1" step="0.1" placeholder="15" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
              <input type="number" className="input" value={form.height} onChange={set("height")} required min="1" step="0.1" placeholder="10" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Actual Weight (kg)</label>
            <input type="number" className="input" value={form.actualWeight} onChange={set("actualWeight")} required min="0.1" step="0.1" placeholder="2.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Order Type</label>
              <select className="input" value={form.orderType} onChange={set("orderType")}>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Payment Type</label>
              <select className="input" value={form.paymentType} onChange={set("paymentType")}>
                <option value="PREPAID">Prepaid</option>
                <option value="COD">COD</option>
              </select>
            </div>
          </div>
        </div>

        {quoteError && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{quoteError}</div>}

        {!quote && (
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Calculating..." : "Get Quote"}
          </button>
        )}
      </form>

      {quote && (
        <div className="card mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Charge Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pickup Zone</span>
              <span className="font-medium">{quote.pickupZone?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Drop Zone</span>
              <span className="font-medium">{quote.dropZone?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Zone Type</span>
              <span className="font-medium">{quote.isIntraZone ? "Intra-Zone" : "Inter-Zone"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volumetric Weight</span>
              <span className="font-medium">{quote.volumetricWeight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chargeable Weight</span>
              <span className="font-medium">{quote.chargeableWeight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate</span>
              <span className="font-medium">₹{quote.ratePerKg}/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Charge</span>
              <span className="font-medium">₹{quote.baseCharge}</span>
            </div>
            {quote.codSurcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">COD Surcharge</span>
                <span className="font-medium">₹{quote.codSurcharge}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-bold text-base">
              <span>Total</span>
              <span className="text-primary">₹{quote.totalCharge}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setQuote(null)} className="btn-secondary flex-1">Edit</button>
            <button onClick={confirmOrder} disabled={confirming} className="btn-primary flex-1">
              {confirming ? "Placing..." : "Confirm Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
