// const express = require("express");
// const { getUsers, addUser, updateUser, deleteUser } = require("../controllers/adminHandleEmployeeController");

// const router = express.Router();

// // All routes should start with "/users" to match frontend expectations
// router.get("/user", getUsers);         // GET /api/admin/users
// router.post("/users", addUser);         // POST /api/admin/users  
// router.put("/users/:id", updateUser);   // PUT /api/admin/users/:id
// router.delete("/users/:id", deleteUser); // DELETE /api/admin/users/:id

// module.exports = router;

const express = require("express");
const { 
  getUsers, 
  addUser, 
  updateUser, 
  deleteUser,
  getTeams,
  getSubTeams,
  getSpocs
} = require("../controllers/adminHandleEmployeeController");

const router = express.Router();

// User CRUD routes
router.get("/user", getUsers);
router.post("/users", addUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Dropdown data routes
router.get("/teams", getTeams);
router.get("/sub-teams", getSubTeams);
router.get("/spocs", getSpocs);

module.exports = router;
