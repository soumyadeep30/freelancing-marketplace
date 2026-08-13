const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const gigsRoutes = require("./routes/gigs.routes");
const freelancersRoutes = require("./routes/freelancers.routes");
const proposalsRoutes = require("./routes/proposals.routes");
const messagesRoutes = require("./routes/messages.routes");
const categoriesRoutes = require("./routes/categories.routes");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigsRoutes);
app.use("/api/freelancers", freelancersRoutes);
app.use("/api/proposals", proposalsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/categories", categoriesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
