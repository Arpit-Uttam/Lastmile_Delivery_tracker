import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

function StatCard({ label, value, color }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={stats?.totalOrders} color="text-gray-900" />
        <StatCard label="Delivered" value={stats?.deliveredOrders} color="text-green-600" />
        <StatCard label="Failed" value={stats?.failedOrders} color="text-red-600" />
        <StatCard label="Available Agents" value={stats?.activeAgents} color="text-blue-600" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Orders</h3>
          <Link to="/admin/orders" className="text-primary text-sm hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {stats?.recentOrders?.map((order) => (
            <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-mono text-sm font-semibold text-primary">{order.trackingNumber}</p>
                <p className="text-xs text-gray-500">{order.customer?.name} · {order.pickupZone?.name} → {order.dropZone?.name}</p>
              </div>
              <StatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
