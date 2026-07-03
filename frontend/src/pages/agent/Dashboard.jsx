import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  }, []);

  const active = orders.filter((o) => !["DELIVERED", "FAILED"].includes(o.status));
  const completed = orders.filter((o) => ["DELIVERED", "FAILED"].includes(o.status));

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">My Deliveries</h2>

      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Active ({active.length})</h3>
          <div className="space-y-3">
            {active.map((order) => (
              <Link key={order.id} to={`/agent/orders/${order.id}`} className="card block hover:shadow-md transition-shadow border-l-4 border-primary">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-semibold text-primary">{order.trackingNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{order.pickupAddress}</p>
                    <p className="text-sm text-gray-500">→ {order.dropAddress}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Completed ({completed.length})</h3>
          <div className="space-y-2">
            {completed.map((order) => (
              <Link key={order.id} to={`/agent/orders/${order.id}`} className="card block hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-gray-600">{order.trackingNumber}</p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="card text-center py-12 text-gray-500">No orders assigned to you yet.</div>
      )}
    </div>
  );
}
