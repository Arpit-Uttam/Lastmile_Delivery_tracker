import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import TrackingTimeline from "../components/TrackingTimeline";

export default function TrackPage() {
  const { trackingNumber: paramTN } = useParams();
  const [trackingNumber, setTrackingNumber] = useState(paramTN || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramTN) fetchOrder(paramTN);
  }, [paramTN]);

  async function fetchOrder(tn) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/tracking/${tn}`);
      setOrder(data);
    } catch {
      setError("Order not found. Check the tracking number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (trackingNumber.trim()) fetchOrder(trackingNumber.trim());
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📦 Track Your Package</h1>
          <p className="text-gray-500 mt-2">Enter your tracking number below</p>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              className="input flex-1"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DTLX3K9ABC"
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "..." : "Track"}
            </button>
          </form>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">{error}</div>}

        {order && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-lg">{order.trackingNumber}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">{order.pickupAddress}</p>
                  <p className="text-xs text-gray-400">{order.pickupZone?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{order.dropAddress}</p>
                  <p className="text-xs text-gray-400">{order.dropZone?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Order Type</p>
                  <p className="font-medium">{order.orderType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium">{order.paymentType}</p>
                </div>
                {order.agent && (
                  <div>
                    <p className="text-gray-500">Delivery Agent</p>
                    <p className="font-medium">{order.agent.user?.name}</p>
                  </div>
                )}
                {order.rescheduleDate && (
                  <div>
                    <p className="text-gray-500">Rescheduled For</p>
                    <p className="font-medium">{new Date(order.rescheduleDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              {order.failureReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">Failure reason: {order.failureReason}</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Tracking History</h3>
              <TrackingTimeline events={order.trackingHistory} />
            </div>
          </div>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to manage your orders
        </p>
      </div>
    </div>
  );
}
