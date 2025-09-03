const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const worklogRoutes = require("./routes/worklogRoutes");
const spocRoutes = require('./routes/spocRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use('/api/spoc', spocRoutes);
app.use("/api/worklogs", worklogRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
