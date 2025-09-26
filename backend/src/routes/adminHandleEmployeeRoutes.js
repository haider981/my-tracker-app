const express = require("express");
const { getUsers, addUser, updateUser, deleteUser } = require("../controllers/adminHandleEmployeeController");

const router = express.Router();

// All routes should start with "/users" to match frontend expectations
router.get("/user", getUsers);         // GET /api/admin/users
router.post("/users", addUser);         // POST /api/admin/users  
router.put("/users/:id", updateUser);   // PUT /api/admin/users/:id
router.delete("/users/:id", deleteUser); // DELETE /api/admin/users/:id

module.exports = router;
