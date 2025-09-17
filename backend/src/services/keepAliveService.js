// src/services/keepAliveService.js
const axios = require('axios');

class KeepAliveService {
  constructor(appUrl) {
    this.appUrl = appUrl;
    this.intervalId = null;
  }

  start() {
    // Ping every 14 minutes (Render free tier sleeps after 15 minutes of inactivity)
    this.intervalId = setInterval(() => {
      this.pingServer();
    }, 14 * 60 * 1000); // 14 minutes

    console.log('Keep-alive service started - pinging every 14 minutes');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Keep-alive service stopped');
    }
  }

  async pingServer() {
    try {
      const response = await axios.get(`${this.appUrl}/health`, {
        timeout: 10000 // 10 second timeout
      });
      console.log(`Keep-alive ping successful at ${new Date().toISOString()}: ${response.status}`);
    } catch (error) {
      console.error(`Keep-alive ping failed at ${new Date().toISOString()}:`, error.message);
    }
  }
}

// Create instance with environment variable or fallback
const keepAliveService = new KeepAliveService(
  process.env.RENDER_EXTERNAL_URL
);

module.exports = { KeepAliveService, keepAliveService };
