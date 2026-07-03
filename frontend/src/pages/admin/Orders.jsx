import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

const STATUSES = ["", "CREATED", "CONFIRMED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: "", page: 1 });
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/zones").then(({ data }) => setZones(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.status) params.status = filters.status;
    if (selectedZone) params.zoneId = selectedZone;
    api.get("/orders", { params })
      .then(({ data }) => { setOrders(data.orders); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [filters, selectedZone]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">All Orders ({total})</h2>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
        </select>
        <select className="input w-auto" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link key={order.id} to={`/admin/orders/${order.id}`} className="card block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-semibold text-primary">{order.trackingNumber}</p>
                  <p className="text-sm text-gray-600">{order.customer?.name} · {order.pickupZone?.name} → {order.dropZone?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()} · {order.orderType} · {order.paymentType}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-semibold mt-1">₹{order.totalCharge}</p>
                  {order.agent && <p className="text-xs text-gray-400">{order.agent.user?.name}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-6">
        <button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn-secondary">Prev</button>
        <span className="text-sm text-gray-500 flex items-center">Page {filters.page}</span>
        <button disabled={orders.length < 20} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn-secondary">Next</button>
      </div>
    </div>
  );
}
