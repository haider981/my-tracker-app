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
const adminRoutes = require('./routes/adminRoutes');
const adminEditWorklogRoutes = require('./routes/adminEditWorklogRoutes');
const adminHandleEmployeeRoutes = require('./routes/adminHandleEmployeeRoutes');
const adminProjectRequestRoutes = require('./routes/adminProjectRequestRoutes');
const adminAddProjectRoutes = require('./routes/adminAddProjectRoutes');
const abbreviationsRoutes = require('./routes/abbreviationsRoutes');
const adminAddAbbreviationRoutes = require('./routes/adminAddAbbreviationRoutes');
const teamWiseDropdownRoutes = require('./routes/teamWiseDropdownRoutes');

const addEntryRequestRoutes = require('./routes/addEntryRequestRoutes');
const addEntryRequestSpocRoutes = require('./routes/addEntryRequestSpocRoutes');
const spocApproveMissingRequestRoutes = require('./routes/spocApproveMissingRequestRoutes');
const adminPushMissingRequestRoutes = require('./routes/adminPushMissingRequestRoutes');
const adminAddUnitTypeRoutes = require('./routes/adminAddUnitTypeRoutes');
const adminMarkExtraShiftRoutes = require('./routes/adminMarkExtraShiftRoutes');

const { createCronEndpoint } = require('./services/externalCroneService');
const { keepAliveService } = require('./services/keepAliveService');


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use('/api/spoc', spocRoutes);
app.use('/api/spoc/abbreviations', abbreviationsRoutes);
app.use("/api/worklogs", worklogRoutes);
app.use("/api/spoc/projects",spocAddProjectRoutes);
app.use("/api/shifts", markShiftRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminEditWorklogRoutes);
app.use('/api/admin', adminHandleEmployeeRoutes);
app.use('/api/admin', scheduledRoutes);
app.use('/api/admin', adminAddProjectRoutes);
app.use('/api/admin-projects', adminProjectRequestRoutes);
app.use('/api/admin/abbreviations', abbreviationsRoutes);
app.use('/api/abbreviations', adminAddAbbreviationRoutes);
app.use('/api/teamwise-dropdowns', teamWiseDropdownRoutes);

app.use('/api/entry-requests', addEntryRequestRoutes);
app.use('/api/spoc/entry-requests', addEntryRequestSpocRoutes);
app.use('/api/spoc/request', spocApproveMissingRequestRoutes);
app.use('/api/admin/request', adminPushMissingRequestRoutes);
app.use('/api/admin/request', adminPushMissingRequestRoutes);
app.use('/api/admin/unit', adminAddUnitTypeRoutes);
app.use('/api/admin/shifts', adminMarkExtraShiftRoutes);

// Create external cron endpoint (KEEP THIS - This is your only cron now)
createCronEndpoint(app);

// Health check (Enhanced)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});


// Start keep-alive service only in production
if (process.env.NODE_ENV === 'production') {
  keepAliveService.start();
  console.log('🔄 Keep-alive service started for production environment');
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  if (process.env.NODE_ENV === 'production') {
    keepAliveService.stop();
  }
  // stopAllScheduledJobs(); // COMMENTED OUT
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  if (process.env.NODE_ENV === 'production') {
    keepAliveService.stop();
  }
  // stopAllScheduledJobs(); // COMMENTED OUT
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    keepAliveService.stop();
  }
  // stopAllScheduledJobs(); // COMMENTED OUT
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;



// const express = require("express");
// const cors = require("cors");
// const path = require('path');

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const projectRoutes = require("./routes/projectRoutes");
// const worklogRoutes = require("./routes/worklogRoutes");
// const spocRoutes = require('./routes/spocRoutes');
// const spocAddProjectRoutes = require('./routes/spocAddProjectRoutes');
// const markShiftRoutes = require("./routes/markShiftRoutes");
// const scheduledRoutes = require('./routes/scheduledJobRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminEditWorklogRoutes = require('./routes/adminEditWorklogRoutes');
// const adminHandleEmployeeRoutes = require('./routes/adminHandleEmployeeRoutes');
// const adminProjectRequestRoutes = require('./routes/adminProjectRequestRoutes');
// const adminAddProjectRoutes = require('./routes/adminAddProjectRoutes');
// const abbreviationsRoutes = require('./routes/abbreviationsRoutes');
// const adminAddAbbreviationRoutes = require('./routes/adminAddAbbreviationRoutes');
// const teamWiseDropdownRoutes = require('./routes/teamWiseDropdownRoutes');

// const addEntryRequestRoutes = require('./routes/addEntryRequestRoutes');
// const addEntryRequestSpocRoutes = require('./routes/addEntryRequestSpocRoutes');
// const spocApproveMissingRequestRoutes = require('./routes/spocApproveMissingRequestRoutes');
// const adminPushMissingRequestRoutes = require('./routes/adminPushMissingRequestRoutes');
// const adminAddUnitTypeRoutes = require('./routes/adminAddUnitTypeRoutes');

// const { initializeScheduledJobs, stopAllScheduledJobs } = require('./services/schedulerService');
// const { createCronEndpoint } = require('./services/externalCroneService');
// const { keepAliveService } = require('./services/keepAliveService');


// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/projects", projectRoutes);
// app.use('/api/spoc', spocRoutes);
// app.use('/api/spoc/abbreviations', abbreviationsRoutes);
// app.use("/api/worklogs", worklogRoutes);
// app.use("/api/spoc/projects",spocAddProjectRoutes);
// app.use("/api/shifts", markShiftRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/admin', adminEditWorklogRoutes);
// app.use('/api/admin', adminHandleEmployeeRoutes);
// app.use('/api/admin', scheduledRoutes);
// app.use('/api/admin', adminAddProjectRoutes);
// app.use('/api/admin/projects', adminProjectRequestRoutes);
// app.use('/api/admin/abbreviations', abbreviationsRoutes);
// app.use('/api/abbreviations', adminAddAbbreviationRoutes);
// app.use('/api/teamwise-dropdowns', teamWiseDropdownRoutes);

// app.use('/api/entry-requests', addEntryRequestRoutes);
// app.use('/api/spoc/entry-requests', addEntryRequestSpocRoutes);
// app.use('/api/spoc/request', spocApproveMissingRequestRoutes);
// app.use('/api/admin/request', adminPushMissingRequestRoutes);
// app.use('/api/admin/request', adminPushMissingRequestRoutes);
// app.use('/api/admin/unit', adminAddUnitTypeRoutes);

// // Create external cron endpoint (NEW)
// createCronEndpoint(app);

// // Health check (Enhanced)
// app.get("/health", (req, res) => {
//   res.json({ 
//     status: "ok", 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     memory: process.memoryUsage(),
//     env: process.env.NODE_ENV || 'development'
//   });
// });

// // Initialize scheduled jobs
// const scheduledJobs = initializeScheduledJobs();

// // Start keep-alive service only in production (NEW)
// if (process.env.NODE_ENV === 'production') {
//   keepAliveService.start();
//   console.log('🔄 Keep-alive service started for production environment');
// }

// // Graceful shutdown handling (Enhanced)
// process.on('SIGINT', () => {
//   console.log('\nReceived SIGINT. Graceful shutdown...');
//   if (process.env.NODE_ENV === 'production') {
//     keepAliveService.stop();
//   }
//   stopAllScheduledJobs();
//   process.exit(0);
// });

// process.on('SIGTERM', () => {
//   console.log('\nReceived SIGTERM. Graceful shutdown...');
//   if (process.env.NODE_ENV === 'production') {
//     keepAliveService.stop();
//   }
//   stopAllScheduledJobs();
//   process.exit(0);
// });

// // Handle uncaught exceptions (NEW)
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   if (process.env.NODE_ENV === 'production') {
//     keepAliveService.stop();
//   }
//   stopAllScheduledJobs();
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// module.exports = app;
