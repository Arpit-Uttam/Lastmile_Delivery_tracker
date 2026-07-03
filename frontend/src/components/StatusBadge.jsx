import React from "react";

const STATUS_COLORS = {
  CREATED: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  PICKED_UP: "bg-yellow-100 text-yellow-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-pink-100 text-pink-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
