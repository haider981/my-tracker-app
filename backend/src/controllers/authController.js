// const { OAuth2Client } = require("google-auth-library");
// const jwt = require("jsonwebtoken");
// const prisma = require("../config/prisma");

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// exports.googleAuth = async (req, res) => {
//   const { idToken } = req.body;
//   if (!idToken) return res.status(400).json({ success: false, message: "Missing idToken" });

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();

//     const email = payload.email;
//     const name = payload.name || email.split("@")[0];
//     const picture =
//       payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

//     // Lookup predefined role in DB
//     const userRow = await prisma.users.findUnique({ where: { email } });
//     const role = userRow ? userRow.role : "EMPLOYEE";
//     const team = userRow ? userRow.team : null;

//     // Sign JWT with 15-hour expiration
//     const token = jwt.sign(
//       { email, name, role, team, picture }, 
//       process.env.JWT_SECRET, 
//       { expiresIn: "12h" } // Changed from "8h" to "12h"
//     );

//     return res.json({
//       success: true,
//       token,
//       user: { email, name, role, team, picture },
//     });
//   } catch (err) {
//     console.error("Auth error", err);
//     return res.status(401).json({ success: false, message: "Invalid ID token" });
//   }
// };


const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: "Missing idToken" });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture =
      payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

    // Lookup predefined role in DB
    const userRow = await prisma.users.findUnique({ where: { email } });
    // const role = userRow ? userRow.role : "EMPLOYEE";
    const role = userRow ? userRow.role : "Employee";
    const team = userRow ? userRow.team : null;
    const sub_team = userRow ? userRow.sub_team : null;

    // Sign JWT with 15-hour expiration
    const token = jwt.sign(
      { email, name, role, team,sub_team,picture }, 
      process.env.JWT_SECRET, 
      { expiresIn: "12h" } // Changed from "8h" to "12h"
    );

    return res.json({
      success: true,
      token,
      user: { email, name, role, team,sub_team,picture },
    });
  } catch (err) {
    console.error("Auth error", err);
    return res.status(401).json({ success: false, message: "Invalid ID token" });
  }
};
