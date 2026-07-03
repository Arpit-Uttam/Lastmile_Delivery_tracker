# System Design Write-Up — Last-Mile Delivery Tracker

## Overview

The platform is a three-role delivery management system (Admin, Customer, Delivery Agent) built on a REST API backend with a React SPA frontend. The core design challenges are: a correct and configurable rate engine, intelligent agent assignment, an immutable audit trail, and a reliable failed-delivery recovery flow.

---

## Rate Calculation Engine

The engine is a pure function (`calculateCharge`) that takes package and address inputs and returns a full charge breakdown. Every value it uses comes from the database — nothing is hardcoded.

**Zone Detection** is the first step. Each `Area` record maps a pincode to a `Zone`. The engine queries the `Area` table for both pickup and drop pincodes. If either pincode has no zone, the engine throws an error immediately rather than silently applying wrong rates. This makes misconfiguration visible.

**Intra vs Inter-Zone** is determined by comparing the two zone IDs. Same ID = intra, different = inter.

**Volumetric Weight** uses the courier industry standard: `(L × B × H) ÷ 5000`. The chargeable weight is `max(actual, volumetric)`, ensuring the carrier is compensated for bulky light packages.

**Rate Card Lookup** queries the `RateCard` table filtered by `orderType` (B2B or B2C) and `isIntraZone`. This gives four possible cards: B2B Intra, B2B Inter, B2C Intra, B2C Inter — all admin-managed. The base charge is `max(chargeableWeight × ratePerKg, minimumCharge)` to enforce a floor price.

**COD Surcharge** is stored as a percentage on the rate card and applied only if `paymentType = COD`. Using a percentage (rather than flat fee) keeps it proportional to shipment value.

The charge preview (`/api/orders/quote`) runs the same engine before order creation, so customers see the exact amount before confirming.

---

## Zone Detection Approach

Zones are structured as named containers (`Zone`) with multiple pincode-mapped entries (`Area`). This is a flat, lookup-table approach that trades geographic precision for simplicity and admin control. Admins add or remove pincodes from zones via the admin panel without touching code.

A pincode-based model suits Indian logistics, where pincodes are the standard routing unit. For future enhancement, polygon-based detection (using PostGIS or a geospatial index) could replace pincode lookup for more accurate zone boundaries, but the interface of the calculator would stay the same.

---

## Auto-Assignment Logic

The assignment service (`autoAssignAgent`) follows a tiered strategy:

1. Find agents with `status = AVAILABLE` who are assigned to the pickup zone (via the `AgentZone` join table).
2. If none are available in that zone, widen to all available agents platform-wide.
3. Among candidates, select the one with the fewest active orders (orders in ASSIGNED / PICKED_UP / IN_TRANSIT / OUT_FOR_DELIVERY state). This balances load rather than always picking the same agent.
4. When agents have GPS coordinates stored, the Haversine distance formula ranks candidates by physical proximity to the pickup zone.

Once selected, the order status moves to `ASSIGNED`, the agent status flips to `BUSY`, and a `TrackingEvent` is written — all in a single Prisma transaction to prevent partial state. Manual assignment by admin follows the same transaction pattern.

Agent availability is modeled as a simple enum (`AVAILABLE / BUSY / OFFLINE`) updated on assignment and release. An agent returns to `AVAILABLE` when their order reaches `DELIVERED`, keeping the pool accurate automatically.

---

## Order Status Lifecycle & Immutable Tracking History

The status machine is: `CREATED → CONFIRMED → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED | FAILED → RESCHEDULED`.

Every status transition writes a `TrackingEvent` row. This table is append-only by design — there are no update or delete operations on it in any code path. Each event captures the `status`, optional `note`, `actorId`, `actorRole`, and `createdAt` timestamp. This creates a full, tamper-evident audit trail.

Agents are restricted to forward transitions only (via the `AGENT_STATUS_FLOW` map on the frontend and role checks on the backend). Admins can override to any status, which also writes a tracking event with `actorRole = ADMIN` for accountability.

---

## Failed Delivery Handling

When an agent marks an order `FAILED`, they must supply a failure reason. The system:

1. Sets `order.status = FAILED` and stores `failureReason`.
2. Writes a `TrackingEvent` with the failure note.
3. Sends an email (and SMS if configured) to the customer with the failure reason and a prompt to reschedule.

The customer (or admin) can then call the reschedule endpoint, which:

1. Validates the order is in `FAILED` state.
2. Sets `status = RESCHEDULED`, stores `rescheduleDate`, clears `agentId`, and frees the previous agent back to `AVAILABLE`.
3. Writes a `RESCHEDULED` tracking event.

On the rescheduled date, admin triggers a fresh agent assignment (auto or manual). This decouples the scheduling from the assignment, avoiding premature agent locking.

---

## Database Design Decisions

The `TrackingEvent` table is separate from `Order` specifically to preserve history. If tracking data were stored as a status column on the order, history would be lost on each update. The separate table with `orderId` FK makes querying the full journey trivial and ensures the audit log is immutable.

`AgentZone` is a many-to-many join that lets agents serve multiple zones and zones have multiple agents. This is critical for auto-assignment coverage in overlapping service areas.

`RateCard` has no FK to zones — it applies globally by type. Zone-specific pricing (if needed later) would require adding a `zoneId` column without breaking the existing engine interface.