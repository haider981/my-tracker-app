const express = require('express');
const router = express.Router();
const {
    getAllUnitTypes,
    getBookElements,
    getTasks,
    getUnitTypeOptions,
    createUnitType,
    updateUnitType,
    deleteUnitType
} = require('../controllers/adminAddUnitTypeController');

const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET routes
router.get('/unit-types', getAllUnitTypes);
router.get('/book-elements', getBookElements);
router.get('/tasks', getTasks);
router.get('/unit-type-options', getUnitTypeOptions);

// POST route - Create new unit type
router.post('/unit-types', createUnitType);

// PUT route - Update existing unit type
router.put('/unit-types/:id', updateUnitType);

// DELETE route - Delete unit type
router.delete('/unit-types/:id', deleteUnitType);

module.exports = router;
