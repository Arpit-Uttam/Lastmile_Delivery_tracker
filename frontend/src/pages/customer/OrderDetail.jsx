import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import TrackingTimeline from "../../components/TrackingTimeline";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  }, [id]);

  async function handleReschedule() {
    if (!rescheduleDate) return;
    setRescheduling(true);
    try {
      await api.patch(`/orders/${id}/reschedule`, { rescheduleDate });
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      alert(err.response?.data?.error || "Reschedule failed");
    } finally {
      setRescheduling(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/customer" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500">Tracking Number</p>
            <p className="font-mono font-bold text-lg text-primary">{order.trackingNumber}</p>
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
            <p className="font-medium">{order.length}×{order.breadth}×{order.height} cm</p>
            <p className="text-xs text-gray-400">Actual: {order.actualWeight}kg · Vol: {order.volumetricWeight}kg</p>
          </div>
          <div>
            <p className="text-gray-500">Charge</p>
            <p className="font-bold text-primary">₹{order.totalCharge}</p>
            <p className="text-xs text-gray-400">{order.paymentType}</p>
          </div>
          {order.agent && (
            <div>
              <p className="text-gray-500">Agent</p>
              <p className="font-medium">{order.agent.user?.name}</p>
              <p className="text-xs text-gray-400">{order.agent.user?.phone}</p>
            </div>
          )}
        </div>
        {order.failureReason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">Failure: {order.failureReason}</p>
          </div>
        )}
      </div>

      {order.status === "FAILED" && (
        <div className="card">
          <h3 className="font-semibold mb-3">Reschedule Delivery</h3>
          <div className="flex gap-3">
            <input
              type="date"
              className="input flex-1"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <button onClick={handleReschedule} disabled={rescheduling || !rescheduleDate} className="btn-primary">
              {rescheduling ? "..." : "Reschedule"}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-4">Tracking History</h3>
        <TrackingTimeline events={order.trackingHistory} />
      </div>
    </div>
  );
}
