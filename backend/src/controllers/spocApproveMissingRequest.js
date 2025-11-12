// const prisma = require('../config/prisma');

// // Get all employees under this SPOC
// const getEmployees = async (req, res) => {
//     try {
//         const spocEmail = req.user.email; // From JWT middleware
        
//         // Find all employees where this user is their SPOC
//         const employees = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail
//             },
//             select: {
//                 id: true,
//                 name: true,
//                 email: true
//             },
//             orderBy: {
//                 name: 'asc'
//             }
//         });

//         res.status(200).json({
//             success: true,
//             employees: employees
//         });
//     } catch (error) {
//         console.error('Error fetching employees:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch employees',
//             error: error.message
//         });
//     }
// };

// // Get worklogs with filters - focusing on audit_status
// const getWorklogs = async (req, res) => {
//     try {
//         const spocEmail = req.user.email; // From JWT middleware
//         const {
//             // startDate,
//             // endDate,
//             employees,      // Array of employee names
//             auditStatus,    // Array of audit statuses
//             workModes       // Array of work modes
//         } = req.body;

//         // First, get all employees under this SPOC to ensure we only fetch their worklogs
//         const employeesUnderSpoc = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail
//             },
//             select: {
//                 email: true,
//                 name: true
//             }
//         });

//         // Extract employee emails for filtering
//         const employeeEmails = employeesUnderSpoc.map(emp => emp.email);
//         const employeeNames = employeesUnderSpoc.map(emp => emp.name);

//         // If no employees found under this SPOC, return empty result
//         if (employeeEmails.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 worklogsByDate: {}
//             });
//         }

//         // Build where clause
//         const whereClause = {
//             // Filter by employees under SPOC supervision
//             name: { in: employeeNames },
//             // Specific status filters as requested
//             request_status: 'Pending',
//             is_entry_request: true
//         };

//         // Date range filter
//         // if (startDate && endDate) {
//         //     whereClause.date = {
//         //         gte: new Date(startDate),
//         //         lte: new Date(endDate)
//         //     };
//         // } else if (startDate) {
//         //     whereClause.date = { gte: new Date(startDate) };
//         // } else if (endDate) {
//         //     whereClause.date = { lte: new Date(endDate) };
//         // }

//         // Employee name filter (if provided)
//         if (employees && employees.length > 0) {
//             whereClause.name = { in: employees };
//         }

//         // Audit Status filter (additional to the fixed 'Pending' requirement)
//         if (auditStatus && auditStatus.length > 0) {
//             whereClause.audit_status = { in: auditStatus };
//         }

//         // Work Mode filter
//         if (workModes && workModes.length > 0) {
//             whereClause.work_mode = { in: workModes };
//         }

//         // Fetch worklogs with the specified filters
//         const worklogs = await prisma.todaysWorklog.findMany({
//             where: whereClause,
//             orderBy: [
//                 { date: 'desc' },
//                 { created_at: 'desc' }
//             ],
//             select: {
//                 id: true,
//                 date: true,
//                 work_mode: true,
//                 project_name: true,
//                 task_name: true,
//                 book_element: true,
//                 chapter_number: true,
//                 hours_spent: true,
//                 number_of_units: true,
//                 unit_type: true,
//                 status: true,
//                 due_on: true,
//                 details: true,
//                 late_reason: true,
//                 audit_status: true,
//                 request_status: true,
//                 is_entry_request: true,
//                 name: true,
//                 team: true,
//                 created_at: true
//             }
//         });

//         // Group by date
//         const worklogsByDate = {};
//         worklogs.forEach(log => {
//             const dateKey = log.date.toISOString().split('T')[0];
//             if (!worklogsByDate[dateKey]) {
//                 worklogsByDate[dateKey] = [];
//             }
//             worklogsByDate[dateKey].push({
//                 _id: log.id.toString(),
//                 workMode: log.work_mode,
//                 projectName: log.project_name,
//                 task: log.task_name,
//                 bookElement: log.book_element,
//                 chapterNo: log.chapter_number,
//                 hoursSpent: log.hours_spent,
//                 noOfUnits: log.number_of_units,
//                 unitType: log.unit_type,
//                 status: log.status,
//                 dueOn: log.due_on,
//                 details: log.details,
//                 reasonForLateEntry: log.late_reason,
//                 auditStatus: log.audit_status,
//                 requestStatus: log.request_status,
//                 isEntryRequest: log.is_entry_request,
//                 employeeName: log.name,
//                 team: log.team,
//                 createdAt: log.created_at
//             });
//         });

//         res.status(200).json({
//             success: true,
//             worklogsByDate,
//             totalEmployees: employeeEmails.length,
//             totalWorklogs: worklogs.length
//         });
//     } catch (error) {
//         console.error('Error fetching worklogs:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch worklogs',
//             error: error.message
//         });
//     }
// };

// // Update single worklog audit status
// const updateWorklogStatus = async (req, res) => {
//     try {
//         const spocEmail = req.user.email;
//         const spocName = req.user.name;
//         const { worklogId, auditStatus } = req.body;

//         // Validate audit status
//         if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid audit status'
//             });
//         }

//         // Convert worklogId to integer if it's a string
//         const id = parseInt(worklogId);

//         // First, get all employees under this SPOC
//         const employeesUnderSpoc = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail,
//                 spoc_name: spocName
//             },
//             select: {
//                 email: true,
//                 name: true
//             }
//         });

//         // Extract employee names for filtering
//         const employeeNames = employeesUnderSpoc.map(emp => emp.name);

//         // If no employees found under this SPOC, return error
//         if (employeeNames.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No employees found under your supervision'
//             });
//         }

//         // First check if the worklog exists and belongs to an employee under this SPOC
//         const existingWorklog = await prisma.todaysWorklog.findFirst({
//             where: {
//                 id: id,
//                 name: { in: employeeNames } // Check if the worklog belongs to one of SPOC's employees
//             }
//         });

//         if (!existingWorklog) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Worklog not found or unauthorized'
//             });
//         }

//         // Update the worklog
//         const worklog = await prisma.todaysWorklog.update({
//             where: {
//                 id: id
//             },
//             data: {
//                 audit_status: auditStatus,
//                 reviewed_at: new Date(),
//                 reviewed_by: spocName
//             },
//             select: {
//                 id: true,
//                 audit_status: true,
//                 name: true,
//                 date: true
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: `Worklog ${auditStatus.toLowerCase()} successfully`,
//             worklog: {
//                 _id: worklog.id.toString(),
//                 auditStatus: worklog.audit_status,
//                 employeeName: worklog.name,
//                 date: worklog.date
//             }
//         });
//     } catch (error) {
//         console.error('Error updating worklog status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to update worklog status',
//             error: error.message
//         });
//     }
// };

// // Bulk update worklog audit status
// const bulkUpdateWorklogStatus = async (req, res) => {
//     try {
//         const spocEmail = req.user.email;
//         const spocName = req.user.name;
//         const { worklogIds, auditStatus } = req.body;

//         // Validate
//         if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'worklogIds must be a non-empty array'
//             });
//         }

//         if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid audit status'
//             });
//         }

//         // Convert worklogIds to integers
//         const ids = worklogIds.map(id => parseInt(id));

//         // First, get all employees under this SPOC
//         const employeesUnderSpoc = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail
//             },
//             select: {
//                 email: true,
//                 name: true
//             }
//         });

//         // Extract employee names for filtering
//         const employeeNames = employeesUnderSpoc.map(emp => emp.name);

//         // If no employees found under this SPOC, return error
//         if (employeeNames.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No employees found under your supervision'
//             });
//         }

//         // First check which worklogs exist and belong to employees under this SPOC
//         const existingWorklogs = await prisma.todaysWorklog.findMany({
//             where: {
//                 id: { in: ids },
//                 name: { in: employeeNames } // Check if worklogs belong to SPOC's employees
//             },
//             select: {
//                 id: true
//             }
//         });

//         const validWorklogIds = existingWorklogs.map(log => log.id);

//         if (validWorklogIds.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No valid worklogs found or unauthorized access'
//             });
//         }

//         // Bulk update only the valid worklogs
//         const result = await prisma.todaysWorklog.updateMany({
//             where: {
//                 id: { in: validWorklogIds },
//                 name: { in: employeeNames } // Double security check
//             },
//             data: {
//                 audit_status: auditStatus,
//                 reviewed_at: new Date(),
//                 reviewed_by: spocName
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: `${result.count} worklogs ${auditStatus.toLowerCase()} successfully`,
//             modifiedCount: result.count,
//             totalRequested: worklogIds.length,
//             validWorklogsUpdated: result.count
//         });
//     } catch (error) {
//         console.error('Error bulk updating worklog status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to bulk update worklog status',
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     getEmployees,
//     getWorklogs,
//     updateWorklogStatus,
//     bulkUpdateWorklogStatus
// };

const prisma = require('../config/prisma');

// Get all employees under this SPOC
const getEmployees = async (req, res) => {
    try {
        const spocEmail = req.user.email; // From JWT middleware
        
        // Find all employees where this user is their SPOC
        const employees = await prisma.users.findMany({
            where: {
                spoc_email: spocEmail
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json({
            success: true,
            employees: employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employees',
            error: error.message
        });
    }
};

// Get worklogs with filters - focusing on audit_status
const getWorklogs = async (req, res) => {
    try {
        const spocEmail = req.user.email; // From JWT middleware
        const {
            // startDate,
            // endDate,
            employees,      // Array of employee names
            auditStatus,    // Array of audit statuses
            workModes       // Array of work modes
        } = req.body;

        // First, get all employees under this SPOC to ensure we only fetch their worklogs
        const employeesUnderSpoc = await prisma.users.findMany({
            where: {
                spoc_email: spocEmail
            },
            select: {
                email: true,
                name: true
            }
        });

        // Extract employee emails for filtering
        const employeeEmails = employeesUnderSpoc.map(emp => emp.email);
        const employeeNames = employeesUnderSpoc.map(emp => emp.name);

        // If no employees found under this SPOC, return empty result
        if (employeeEmails.length === 0) {
            return res.status(200).json({
                success: true,
                worklogsByDate: {}
            });
        }

        // Build where clause
        const whereClause = {
            // Filter by employees under SPOC supervision
            name: { in: employeeNames },
            // Specific status filters as requested
            request_status: 'Pending',
            is_entry_request: true
        };

        // Date range filter
        // if (startDate && endDate) {
        //     whereClause.date = {
        //         gte: new Date(startDate),
        //         lte: new Date(endDate)
        //     };
        // } else if (startDate) {
        //     whereClause.date = { gte: new Date(startDate) };
        // } else if (endDate) {
        //     whereClause.date = { lte: new Date(endDate) };
        // }

        // Employee name filter (if provided)
        if (employees && employees.length > 0) {
            whereClause.name = { in: employees };
        }

        // Audit Status filter (additional to the fixed 'Pending' requirement)
        if (auditStatus && auditStatus.length > 0) {
            whereClause.audit_status = { in: auditStatus };
        }

        // Work Mode filter
        if (workModes && workModes.length > 0) {
            whereClause.work_mode = { in: workModes };
        }

        // Fetch worklogs with the specified filters
        const worklogs = await prisma.todaysWorklog.findMany({
            where: whereClause,
            orderBy: [
                { date: 'desc' },
                { created_at: 'desc' }
            ],
            select: {
                id: true,
                date: true,
                work_mode: true,
                project_name: true,
                task_name: true,
                book_element: true,
                chapter_number: true,
                hours_spent: true,
                number_of_units: true,
                unit_type: true,
                status: true,
                due_on: true,
                details: true,
                late_reason: true,
                audit_status: true,
                request_status: true,
                is_entry_request: true,
                name: true,
                team: true,
                created_at: true
            }
        });

        // Group by date
        const worklogsByDate = {};
        worklogs.forEach(log => {
            const dateKey = log.date.toISOString().split('T')[0];
            if (!worklogsByDate[dateKey]) {
                worklogsByDate[dateKey] = [];
            }
            worklogsByDate[dateKey].push({
                _id: log.id.toString(),
                workMode: log.work_mode,
                projectName: log.project_name,
                task: log.task_name,
                bookElement: log.book_element,
                chapterNo: log.chapter_number,
                hoursSpent: log.hours_spent,
                noOfUnits: log.number_of_units,
                unitType: log.unit_type,
                status: log.status,
                dueOn: log.due_on,
                details: log.details,
                reasonForLateEntry: log.late_reason,
                auditStatus: log.audit_status,
                requestStatus: log.request_status,
                isEntryRequest: log.is_entry_request,
                employeeName: log.name,
                team: log.team,
                createdAt: log.created_at
            });
        });

        res.status(200).json({
            success: true,
            worklogsByDate,
            totalEmployees: employeeEmails.length,
            totalWorklogs: worklogs.length
        });
    } catch (error) {
        console.error('Error fetching worklogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch worklogs',
            error: error.message
        });
    }
};

// Update single worklog audit status
// const updateWorklogStatus = async (req, res) => {
//     try {
//         const spocEmail = req.user.email;
//         const spocName = req.user.name;
//         const { worklogId, auditStatus } = req.body;

//         // Validate audit status
//         if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid audit status'
//             });
//         }

//         // Convert worklogId to integer if it's a string
//         const id = parseInt(worklogId);

//         // First, get all employees under this SPOC
//         const employeesUnderSpoc = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail,
//                 spoc_name: spocName
//             },
//             select: {
//                 email: true,
//                 name: true
//             }
//         });

//         // Extract employee names for filtering
//         const employeeNames = employeesUnderSpoc.map(emp => emp.name);

//         // If no employees found under this SPOC, return error
//         if (employeeNames.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No employees found under your supervision'
//             });
//         }

//         // First check if the worklog exists and belongs to an employee under this SPOC
//         const existingWorklog = await prisma.todaysWorklog.findFirst({
//             where: {
//                 id: id,
//                 name: { in: employeeNames } // Check if the worklog belongs to one of SPOC's employees
//             }
//         });

//         if (!existingWorklog) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Worklog not found or unauthorized'
//             });
//         }

//         // Update the worklog
//         const worklog = await prisma.todaysWorklog.update({
//             where: {
//                 id: id
//             },
//             data: {
//                 audit_status: auditStatus,
//                 reviewed_at: new Date(),
//                 reviewed_by: spocName
//             },
//             select: {
//                 id: true,
//                 audit_status: true,
//                 name: true,
//                 date: true
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: `Worklog ${auditStatus.toLowerCase()} successfully`,
//             worklog: {
//                 _id: worklog.id.toString(),
//                 auditStatus: worklog.audit_status,
//                 employeeName: worklog.name,
//                 date: worklog.date
//             }
//         });
//     } catch (error) {
//         console.error('Error updating worklog status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to update worklog status',
//             error: error.message
//         });
//     }
// };

// // Bulk update worklog audit status
// const bulkUpdateWorklogStatus = async (req, res) => {
//     try {
//         const spocEmail = req.user.email;
//         const spocName = req.user.name;
//         const { worklogIds, auditStatus } = req.body;

//         // Validate
//         if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'worklogIds must be a non-empty array'
//             });
//         }

//         if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid audit status'
//             });
//         }

//         // Convert worklogIds to integers
//         const ids = worklogIds.map(id => parseInt(id));

//         // First, get all employees under this SPOC
//         const employeesUnderSpoc = await prisma.users.findMany({
//             where: {
//                 spoc_email: spocEmail
//             },
//             select: {
//                 email: true,
//                 name: true
//             }
//         });

//         // Extract employee names for filtering
//         const employeeNames = employeesUnderSpoc.map(emp => emp.name);

//         // If no employees found under this SPOC, return error
//         if (employeeNames.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No employees found under your supervision'
//             });
//         }

//         // First check which worklogs exist and belong to employees under this SPOC
//         const existingWorklogs = await prisma.todaysWorklog.findMany({
//             where: {
//                 id: { in: ids },
//                 name: { in: employeeNames } // Check if worklogs belong to SPOC's employees
//             },
//             select: {
//                 id: true
//             }
//         });

//         const validWorklogIds = existingWorklogs.map(log => log.id);

//         if (validWorklogIds.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No valid worklogs found or unauthorized access'
//             });
//         }

//         // Bulk update only the valid worklogs
//         const result = await prisma.todaysWorklog.updateMany({
//             where: {
//                 id: { in: validWorklogIds },
//                 name: { in: employeeNames } // Double security check
//             },
//             data: {
//                 audit_status: auditStatus,
//                 reviewed_at: new Date(),
//                 reviewed_by: spocName
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: `${result.count} worklogs ${auditStatus.toLowerCase()} successfully`,
//             modifiedCount: result.count,
//             totalRequested: worklogIds.length,
//             validWorklogsUpdated: result.count
//         });
//     } catch (error) {
//         console.error('Error bulk updating worklog status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to bulk update worklog status',
//             error: error.message
//         });
//     }
// };

// Update single worklog audit status
const updateWorklogStatus = async (req, res) => {
    try {
        const spocEmail = req.user.email;
        const spocName = req.user.name;
        const { worklogId, auditStatus } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid audit status'
            });
        }

        const id = parseInt(worklogId);

        const employeesUnderSpoc = await prisma.users.findMany({
            where: {
                spoc_email: spocEmail,
                spoc_name: spocName
            },
            select: { name: true }
        });

        const employeeNames = employeesUnderSpoc.map(emp => emp.name);

        if (employeeNames.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No employees found under your supervision'
            });
        }

        const existingWorklog = await prisma.todaysWorklog.findFirst({
            where: {
                id,
                name: { in: employeeNames }
            }
        });

        if (!existingWorklog) {
            return res.status(404).json({
                success: false,
                message: 'Worklog not found or unauthorized'
            });
        }

        // 🟢 Automation: if rejected, set both audit_status and request_status = 'Rejected'
        const updateData = {
            audit_status: auditStatus,
            reviewed_at: new Date(),
            reviewed_by: spocName
        };

        if (auditStatus === 'Rejected') {
            updateData.request_status = 'Rejected';
        }

        const worklog = await prisma.todaysWorklog.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                audit_status: true,
                request_status: true,
                name: true,
                date: true
            }
        });

        res.status(200).json({
            success: true,
            message: `Worklog ${auditStatus.toLowerCase()} successfully`,
            worklog: {
                _id: worklog.id.toString(),
                auditStatus: worklog.audit_status,
                requestStatus: worklog.request_status,
                employeeName: worklog.name,
                date: worklog.date
            }
        });
    } catch (error) {
        console.error('Error updating worklog status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update worklog status',
            error: error.message
        });
    }
};

// Bulk update worklog audit status
const bulkUpdateWorklogStatus = async (req, res) => {
    try {
        const spocEmail = req.user.email;
        const spocName = req.user.name;
        const { worklogIds, auditStatus } = req.body;

        if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'worklogIds must be a non-empty array'
            });
        }

        if (!['Pending', 'Approved', 'Rejected'].includes(auditStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid audit status'
            });
        }

        const ids = worklogIds.map(id => parseInt(id));

        const employeesUnderSpoc = await prisma.users.findMany({
            where: { spoc_email: spocEmail },
            select: { name: true }
        });

        const employeeNames = employeesUnderSpoc.map(emp => emp.name);

        if (employeeNames.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No employees found under your supervision'
            });
        }

        const existingWorklogs = await prisma.todaysWorklog.findMany({
            where: {
                id: { in: ids },
                name: { in: employeeNames }
            },
            select: { id: true }
        });

        const validWorklogIds = existingWorklogs.map(log => log.id);

        if (validWorklogIds.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid worklogs found or unauthorized access'
            });
        }

        // 🟢 Automation: set both audit_status & request_status = 'Rejected' if rejected
        const updateData = {
            audit_status: auditStatus,
            reviewed_at: new Date(),
            reviewed_by: spocName
        };

        if (auditStatus === 'Rejected') {
            updateData.request_status = 'Rejected';
        }

        const result = await prisma.todaysWorklog.updateMany({
            where: {
                id: { in: validWorklogIds },
                name: { in: employeeNames }
            },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: `${result.count} worklogs ${auditStatus.toLowerCase()} successfully`,
            modifiedCount: result.count,
            totalRequested: worklogIds.length
        });
    } catch (error) {
        console.error('Error bulk updating worklog status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update worklog status',
            error: error.message
        });
    }
};



module.exports = {
    getEmployees,
    getWorklogs,
    updateWorklogStatus,
    bulkUpdateWorklogStatus
};
