require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const zoneRoutes = require("./routes/zones");
const rateCardRoutes = require("./routes/rateCards");
const agentRoutes = require("./routes/agents");
const adminRoutes = require("./routes/admin");
const trackingRoutes = require("./routes/tracking");

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) or explicitly listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/rate-cards", rateCardRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tracking", trackingRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
