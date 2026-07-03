import React from "react";

const ICONS = {
  CREATED: "📝",
  CONFIRMED: "✅",
  ASSIGNED: "👤",
  PICKED_UP: "📦",
  IN_TRANSIT: "🚚",
  OUT_FOR_DELIVERY: "🏃",
  DELIVERED: "🎉",
  FAILED: "❌",
  RESCHEDULED: "📅",
};

export default function TrackingTimeline({ events }) {
  if (!events?.length) return <p className="text-gray-500 text-sm">No tracking history yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-4">
      {events.map((event, i) => (
        <li key={event.id} className="mb-6 ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full ring-4 ring-white text-sm">
            {ICONS[event.status] || "•"}
          </span>
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm text-gray-900">{event.status.replace(/_/g, " ")}</p>
              <time className="text-xs text-gray-400">
                {new Date(event.createdAt).toLocaleString()}
              </time>
            </div>
            {event.note && <p className="text-xs text-gray-500 mt-1">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
