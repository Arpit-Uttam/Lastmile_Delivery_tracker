import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import TrackingTimeline from "../../components/TrackingTimeline";

const AGENT_STATUS_FLOW = {
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
};

export default function AgentOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");

  async function load() {
    const { data } = await api.get(`/orders/${id}`);
    setOrder(data);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  async function updateStatus(status) {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status, note, failureReason: status === "FAILED" ? failureReason : undefined });
      setNote("");
      setFailureReason("");
      setPendingStatus("");
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    } finally { setUpdating(false); }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!order) return <div className="text-center py-12">Order not found.</div>;

  const nextStatuses = AGENT_STATUS_FLOW[order.status] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/agent" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono font-bold text-xl text-primary">{order.trackingNumber}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-6 text-center">📍</span>
            <div>
              <p className="font-medium">Pickup: {order.pickupAddress}</p>
              <p className="text-gray-400">{order.pickupPincode}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="w-6 text-center">🏁</span>
            <div>
              <p className="font-medium">Drop: {order.dropAddress}</p>
              <p className="text-gray-400">{order.dropPincode}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="w-6 text-center">📦</span>
            <p>{order.length}×{order.breadth}×{order.height} cm · {order.chargeableWeight}kg · {order.orderType} · {order.paymentType}</p>
          </div>
          {order.paymentType === "COD" && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 font-medium">Collect ₹{order.totalCharge} on delivery</p>
            </div>
          )}
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Update Status</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {(pendingStatus === "FAILED" || nextStatuses.includes("FAILED")) && pendingStatus === "FAILED" && (
              <input className="input" placeholder="Failure reason (required)" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} />
            )}
            <div className="flex gap-3 flex-wrap">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (status === "FAILED") {
                      setPendingStatus("FAILED");
                    } else {
                      updateStatus(status);
                    }
                  }}
                  disabled={updating}
                  className={status === "FAILED" ? "bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors" : "btn-primary"}
                >
                  Mark {status.replace(/_/g, " ")}
                </button>
              ))}
              {pendingStatus === "FAILED" && (
                <button
                  onClick={() => updateStatus("FAILED")}
                  disabled={updating || !failureReason}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Confirm Failed"}
                </button>
              )}
            </div>
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
