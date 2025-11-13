const prisma = require("../config/prisma");

// Get all unit types
const getAllUnitTypes = async (req, res) => {
    try {
        const unitTypes = await prisma.unitType.findMany({
            orderBy: {
                created_at: 'desc'
            }
        });

        const transformedUnitTypes = unitTypes.map(ut => ({
            id: ut.id,
            bookElement: ut.book_element,
            task: ut.task_name,
            unitType: ut.unit_type,
            createdAt: ut.created_at
        }));

        res.status(200).json({
            success: true,
            unitTypes: transformedUnitTypes
        });

    } catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit types',
            error: error.message
        });
    }
};

// Get distinct book elements
const getBookElements = async (req, res) => {
    try {
        const bookElements = await prisma.unitType.findMany({
            select: {
                book_element: true
            },
            distinct: ['book_element']
        });

        const uniqueBookElements = bookElements
            .map(be => be.book_element)
            .filter(Boolean)
            .sort();

        res.status(200).json({
            success: true,
            bookElements: uniqueBookElements
        });

    } catch (error) {
        console.error('Error fetching book elements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch book elements',
            error: error.message
        });
    }
};

// Get distinct tasks
const getTasks = async (req, res) => {
    try {
        const tasks = await prisma.unitType.findMany({
            select: {
                task_name: true
            },
            distinct: ['task_name']
        });

        const uniqueTasks = tasks
            .map(t => t.task_name)
            .filter(Boolean)
            .sort();

        res.status(200).json({
            success: true,
            tasks: uniqueTasks
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: error.message
        });
    }
};

// Get distinct unit type options
const getUnitTypeOptions = async (req, res) => {
    try {
        const unitTypes = await prisma.unitType.findMany({
            select: {
                unit_type: true
            },
            distinct: ['unit_type']
        });

        const uniqueUnitTypes = unitTypes
            .map(ut => ut.unit_type)
            .filter(Boolean)
            .sort();

        res.status(200).json({
            success: true,
            unitTypes: uniqueUnitTypes
        });

    } catch (error) {
        console.error('Error fetching unit type options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit type options',
            error: error.message
        });
    }
};

// Create a new unit type
const createUnitType = async (req, res) => {
    try {
        const { bookElement, task, unitType } = req.body;

        // Extract user email from auth middleware
        const { email, name } = req.user || {};

        // Validate required fields
        if (!bookElement || !task || !unitType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bookElement, task, and unitType are required'
            });
        }

        // Check if exact combination already exists
        const existingUnitType = await prisma.unitType.findFirst({
            where: {
                book_element: bookElement,
                task_name: task,
                unit_type: unitType
            }
        });

        if (existingUnitType) {
            return res.status(409).json({
                success: false,
                message: 'This unit type combination already exists'
            });
        }

        // Create new unit type
        const newUnitType = await prisma.unitType.create({
            data: {
                book_element: bookElement,
                task_name: task,
                unit_type: unitType,
                created_at: new Date(),
                created_by: name || null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Unit type added successfully',
            unitType: {
                id: newUnitType.id,
                bookElement: newUnitType.book_element,
                task: newUnitType.task_name,
                unitType: newUnitType.unit_type,
                createdAt: newUnitType.created_at,
            }
        });

    } catch (error) {
        console.error('Error creating unit type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create unit type',
            error: error.message
        });
    }
};

// Update an existing unit type
const updateUnitType = async (req, res) => {
    try {
        const { id } = req.params;
        const { bookElement, task, unitType } = req.body;

        // Extract user email from auth middleware
        const { email, name} = req.user || {};

        // Validate required fields
        if (!bookElement || !task || !unitType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bookElement, task, and unitType are required'
            });
        }

        // Check if unit type exists
        const existingUnitType = await prisma.unitType.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingUnitType) {
            return res.status(404).json({
                success: false,
                message: 'Unit type not found'
            });
        }

        // Check if the new combination already exists (excluding current record)
        const duplicateCheck = await prisma.unitType.findFirst({
            where: {
                book_element: bookElement,
                task_name: task,
                unit_type: unitType,
                id: {
                    not: parseInt(id)
                }
            }
        });

        if (duplicateCheck) {
            return res.status(409).json({
                success: false,
                message: 'This unit type combination already exists'
            });
        }

        // Update unit type
        const updatedUnitType = await prisma.unitType.update({
            where: { id: parseInt(id) },
            data: {
                book_element: bookElement,
                task_name: task,
                unit_type: unitType,
                created_by: name || null
            }
        });

        res.status(200).json({
            success: true,
            message: 'Unit type updated successfully',
            unitType: {
                id: updatedUnitType.id,
                bookElement: updatedUnitType.book_element,
                task: updatedUnitType.task_name,
                unitType: updatedUnitType.unit_type,
                createdAt: updatedUnitType.created_at
            }
        });

    } catch (error) {
        console.error('Error updating unit type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update unit type',
            error: error.message
        });
    }
};

// Delete a unit type
const deleteUnitType = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if unit type exists
        const existingUnitType = await prisma.unitType.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingUnitType) {
            return res.status(404).json({
                success: false,
                message: 'Unit type not found'
            });
        }

        // Delete unit type
        await prisma.unitType.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: 'Unit type deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting unit type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete unit type',
            error: error.message
        });
    }
};

module.exports = {
    getAllUnitTypes,
    getBookElements,
    getTasks,
    getUnitTypeOptions,
    createUnitType,
    updateUnitType,
    deleteUnitType
};
