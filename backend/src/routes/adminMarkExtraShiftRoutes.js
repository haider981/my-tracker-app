
const prisma = require('../config/prisma');

// Get all employees (Admin only)
const getAllEmployees = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Admin email is required'
            });
        }

        // Verify that the requesting user is an Admin
        const adminUser = await prisma.users.findUnique({
            where: {
                email: email
            },
            select: {
                role: true,
                name: true
            }
        });

        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (adminUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        // Fetch all employees and SPOCs (Admin can mark shifts for anyone)
        const employees = await prisma.users.findMany({
            where: {
                role: {
                    in: ['Employee', 'Spoc']
                }
            },
            select: {
                name: true,
                email: true,
                team: true,
                role: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log(`Admin ${adminUser.name} fetched ${employees.length} employees`);

        res.status(200).json(employees);

    } catch (error) {
        console.error('Error fetching all employees:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching employees',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get active/upcoming shifts for all employees (Admin view)
const getActiveShifts = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Admin email is required'
            });
        }

        // Verify admin role
        const adminUser = await prisma.users.findUnique({
            where: { email: email },
            select: { role: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all shifts from today onwards (Admin can see all shifts)
        const shifts = await prisma.markShift.findMany({
            where: {
                shift_date: {
                    gte: today
                }
            },
            orderBy: {
                shift_date: 'asc'
            }
        });

        console.log(`Admin fetched ${shifts.length} active shifts`);

        res.status(200).json(shifts);

    } catch (error) {
        console.error('Error fetching active shifts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching active shifts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get historical shifts (Admin view)
const getHistoricalShifts = async (req, res) => {
    try {
        const { email, type } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Admin email is required'
            });
        }

        // Verify admin role
        const adminUser = await prisma.users.findUnique({
            where: { email: email },
            select: { role: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        if (!type || !['night', 'sunday'].includes(type.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Valid shift type (night or sunday) is required'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const shiftType = type.toUpperCase() === 'NIGHT' ? 'NIGHT' : 'SUNDAY';

        // Get all past shifts (Admin can see all historical shifts)
        const shifts = await prisma.markShift.findMany({
            where: {
                shift_type: shiftType,
                shift_date: {
                    lt: today
                }
            },
            orderBy: {
                shift_date: 'desc'
            }
        });

        console.log(`Admin fetched ${shifts.length} historical ${type} shifts`);

        // Add canDelete flag (Admin can delete historical shifts if needed)
        const shiftsWithDeleteFlag = shifts.map(shift => ({
            ...shift,
            canDelete: true
        }));

        res.status(200).json(shiftsWithDeleteFlag);

    } catch (error) {
        console.error('Error fetching historical shifts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching historical shifts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Mark shifts for employees (Admin only)
const markShifts = async (req, res) => {
    try {
        const { admin_name, admin_email, nightShiftDate, sundayShiftDate, nightEmployees, sundayEmployees } = req.body;

        // Validation
        if (!admin_name || !admin_email) {
            return res.status(400).json({
                success: false,
                error: 'Admin name and email are required'
            });
        }

        // Verify admin role
        const adminUser = await prisma.users.findUnique({
            where: { email: admin_email },
            select: { role: true, name: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }

        if ((!nightEmployees || nightEmployees.length === 0) && 
            (!sundayEmployees || sundayEmployees.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'At least one employee must be selected for night or Sunday shift'
            });
        }

        const currentDate = new Date();
        const shiftsToCreate = [];
        const conflicts = [];

        // Process night shift employees
        if (nightEmployees && nightEmployees.length > 0) {
            if (!nightShiftDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Night shift date is required'
                });
            }

            const nightShiftDateObj = new Date(nightShiftDate);

            for (const employee of nightEmployees) {
                // Check if shift already exists
                const existingShift = await prisma.markShift.findFirst({
                    where: {
                        email: employee.email,
                        shift_date: nightShiftDateObj,
                        shift_type: 'NIGHT'
                    }
                });

                if (existingShift) {
                    conflicts.push({
                        name: employee.name,
                        type: 'NIGHT',
                        date: nightShiftDate
                    });
                } else {
                    shiftsToCreate.push({
                        date: currentDate,
                        name: employee.name,
                        email: employee.email,
                        spoc_name: admin_name,
                        spoc_email: admin_email,
                        shift_date: nightShiftDateObj,
                        shift_type: 'NIGHT',
                        team: employee.team || 'N/A',
                        role: employee.role || 'Employee'
                    });
                }
            }
        }

        // Process Sunday shift employees
        if (sundayEmployees && sundayEmployees.length > 0) {
            if (!sundayShiftDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Sunday shift date is required'
                });
            }

            const sundayShiftDateObj = new Date(sundayShiftDate);

            for (const employee of sundayEmployees) {
                // Check if shift already exists
                const existingShift = await prisma.markShift.findFirst({
                    where: {
                        email: employee.email,
                        shift_date: sundayShiftDateObj,
                        shift_type: 'SUNDAY'
                    }
                });

                if (existingShift) {
                    conflicts.push({
                        name: employee.name,
                        type: 'SUNDAY',
                        date: sundayShiftDate
                    });
                } else {
                    shiftsToCreate.push({
                        date: currentDate,
                        name: employee.name,
                        email: employee.email,
                        spoc_name: admin_name,
                        spoc_email: admin_email,
                        shift_date: sundayShiftDateObj,
                        shift_type: 'SUNDAY',
                        team: employee.team || 'N/A',
                        role: employee.role || 'Employee'
                    });
                }
            }
        }

        // If there are conflicts, return 409
        if (conflicts.length > 0 && shiftsToCreate.length === 0) {
            return res.status(409).json({
                success: false,
                message: 'All selected shifts already exist',
                conflicts: conflicts
            });
        }

        // Create shifts in database
        if (shiftsToCreate.length > 0) {
            await prisma.markShift.createMany({
                data: shiftsToCreate
            });

            console.log(`Admin created ${shiftsToCreate.length} shift entries`);
        }

        // Return response with any conflicts
        if (conflicts.length > 0) {
            return res.status(209).json({
                success: true,
                message: `Created ${shiftsToCreate.length} shifts. ${conflicts.length} shifts already existed.`,
                created: shiftsToCreate.length,
                conflicts: conflicts
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully marked ${shiftsToCreate.length} shifts`,
            created: shiftsToCreate.length
        });

    } catch (error) {
        console.error('Error marking shifts:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while marking shifts',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete a shift entry (Admin only)
const deleteShift = async (req, res) => {
    try {
        const { email, shift_date, shift_type, admin_email } = req.query;

        // Validation
        if (!email || !shift_date || !shift_type || !admin_email) {
            return res.status(400).json({
                success: false,
                error: 'Email, shift date, shift type, and admin email are required'
            });
        }

        // Verify admin role
        const adminUser = await prisma.users.findUnique({
            where: { email: admin_email },
            select: { role: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }

        const shiftDateObj = new Date(shift_date);

        // Find the shift
        const shift = await prisma.markShift.findFirst({
            where: {
                email: email,
                shift_date: shiftDateObj,
                shift_type: shift_type
            }
        });

        if (!shift) {
            return res.status(404).json({
                success: false,
                error: 'Shift entry not found'
            });
        }

        // Delete the shift using the id field
        await prisma.markShift.delete({
            where: {
                id: shift.id
            }
        });

        console.log(`Admin deleted shift for ${email} on ${shift_date}`);

        res.status(200).json({
            success: true,
            message: 'Shift entry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while deleting shift',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getAllEmployees,
    getActiveShifts,
    getHistoricalShifts,
    markShifts,
    deleteShift
};
