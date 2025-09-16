// const express = require("express");
// const cors = require("cors");

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const projectRoutes = require("./routes/projectRoutes");
// const worklogRoutes = require("./routes/worklogRoutes");
// const spocRoutes = require('./routes/spocRoutes'); 

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/projects", projectRoutes);
// app.use('/api/spoc', spocRoutes);
// app.use("/api/worklogs", worklogRoutes);

// // Health check
// app.get("/health", (req, res) => res.json({ status: "ok" }));

// module.exports = app;


const express = require("express");
const cors = require("cors");
const path = require('path');

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const worklogRoutes = require("./routes/worklogRoutes");
const spocRoutes = require('./routes/spocRoutes');
const spocAddProjectRoutes = require('./routes/spocAddProjectRoutes');
const markShiftRoutes = require("./routes/markShiftRoutes");
const scheduledRoutes = require('./routes/scheduledJobRoutes');
// const worklogDraftRoutes = require('./routes/worklogRoutes');

const { initializeScheduledJobs, stopAllScheduledJobs } = require('./services/schedulerService');

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
app.use("/api/spoc/projects",spocAddProjectRoutes);
app.use("/api/shifts", markShiftRoutes);

app.use('/api/admin', scheduledRoutes);
// app.use('/', worklogDraftRoutes);


const scheduledJobs = initializeScheduledJobs();

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  stopAllScheduledJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  stopAllScheduledJobs();
  process.exit(0);
});
// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
