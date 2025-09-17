// src/services/externalCronService.js
const { autoSubmitWorklogsAndAssignLeave } = require('../controllers/scheduledJobController');

// Create a secure endpoint for external cron services
exports.createCronEndpoint = (app) => {
  // Add a secret token for security
  const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-token-here';
  
  app.post('/api/cron/auto-submit-worklogs', async (req, res) => {
    try {
      // Verify the secret token
      const token = req.headers.authorization || req.query.token;
      const providedToken = token ? token.replace('Bearer ', '') : '';
      
      if (providedToken !== CRON_SECRET) {
        console.log('Unauthorized cron request attempt');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('External cron job triggered at:', new Date().toISOString());
      
      const result = await autoSubmitWorklogsAndAssignLeave();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        result
      });
    } catch (error) {
      console.error('External cron job failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Health check endpoint with more details
  app.get('/api/cron/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'cron-endpoint',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });
};
