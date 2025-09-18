// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const { OAuth2Client } = require('google-auth-library');
// const { PrismaClient } = require('@prisma/client');

// const prisma = new PrismaClient();
// const app = express();
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// app.use(cors());
// app.use(express.json());

// app.post('/api/auth/google', async (req, res) => {
//   const { idToken } = req.body;
//   if (!idToken) return res.status(400).json({ success: false, message: 'Missing idToken' });

//   try {
//     // Verify token with Google
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();
//     const email = payload.email;
//     const name = payload.name || payload.email.split('@')[0];
//     const picture = payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

//     // Look for user in our predefined table
//     const userRow = await prisma.user.findUnique({ where: { email } });

//     // Determine role
//     const role = userRow ? userRow.role : 'EMPLOYEE';

//     // Optionally: you can return additional data or create a session record. We won't create employee in DB per spec.

//     // Create a JWT for the frontend to use
//     const token = jwt.sign(
//       { email, name, role, picture },
//       process.env.JWT_SECRET,
//       { expiresIn: '8h' }
//     );

//     return res.json({
//       success: true,
//       token,
//       user: { email, name, role, picture }
//     });
//   } catch (err) {
//     console.error('Auth error', err);
//     return res.status(401).json({ success: false, message: 'Invalid ID token' });
//   }
// });

// // Middleware to verify JWT token
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ success: false, message: 'Access token required' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ success: false, message: 'Invalid token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Protected route example - Get user profile
// app.get('/api/user/profile', authenticateToken, (req, res) => {
//   res.json({
//     success: true,
//     user: {
//       email: req.user.email,
//       name: req.user.name,
//       role: req.user.role,
//       picture: req.user.picture
//     }
//   });
// });

// // Health check endpoint
// app.get('/health', (req, res) => res.json({ status: 'ok' }));

// const port = process.env.PORT || 5000;
// app.listen(port, () => console.log(`Server listening on ${port}`));



// require("dotenv").config();
// const app = require("./src/app");

// const port = process.env.PORT || 5000;
// app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

require("dotenv").config();
const app = require("./src/app");
const prisma = require("./src/config/prisma");  // ⬅️ import here

const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

// Graceful shutdown (close DB too)
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
