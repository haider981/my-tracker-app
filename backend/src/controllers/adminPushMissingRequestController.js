const prisma = require('../config/prisma');

// Get all pending entry requests that are SPOC approved
// Only shows entries where is_entry_request = true AND audit_status = 'Approved'
const getPendingEntryRequests = async (req, res) => {
    try {
        const {
            // startDate,
            // endDate,
            employees,      // Array of employee names
            workModes,      // Array of work modes
            teams           // Array of teams
        } = req.body;

        // Build where clause - Admin sees only SPOC approved entry requests
        const whereClause = {
            is_entry_request: true,
            audit_status: 'Approved',
            request_status: 'Pending'  // Still pending admin approval
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

        // Work Mode filter
        if (workModes && workModes.length > 0) {
            whereClause.work_mode = { in: workModes };
        }

        // Team filter
        if (teams && teams.length > 0) {
            whereClause.team = { in: teams };
        }

        // Fetch pending entry requests
        const entryRequests = await prisma.todaysWorklog.findMany({
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
                reviewed_by: true,
                reviewed_at: true,
                created_at: true
            }
        });

        // Group by date
        const requestsByDate = {};
        entryRequests.forEach(log => {
            const dateKey = log.date.toISOString().split('T')[0];
            if (!requestsByDate[dateKey]) {
                requestsByDate[dateKey] = [];
            }
            requestsByDate[dateKey].push({
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
                reviewedBy: log.reviewed_by,
                reviewedAt: log.reviewed_at,
                createdAt: log.created_at
            });
        });

        res.status(200).json({
            success: true,
            requestsByDate,
            totalRequests: entryRequests.length
        });
    } catch (error) {
        console.error('Error fetching pending entry requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending entry requests',
            error: error.message
        });
    }
};

// Get all employees for filter dropdown
const getAllEmployees = async (req, res) => {
    try {
        const employees = await prisma.users.findMany({
            where: {
                role: {
                    in: ['Employee', 'Spoc']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                team: true
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

const handleLeaveAutomation = async (worklog, adminName) => {
    try {
        const entryDate = worklog.date;
        const employeeName = worklog.name;
        const employeeTeam = worklog.team;
        const workMode = worklog.work_mode;

        // Normalize the date to start of day for consistent comparison
        const normalizedDate = new Date(entryDate);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Check if there are any existing entries for this employee on this date in MasterDatabase
        const existingEntries = await prisma.masterDatabase.findMany({
            where: {
                name: employeeName,
                date: normalizedDate
            },
            orderBy: {
                id: 'asc'
            }
        });

        console.log(`Found ${existingEntries.length} existing entries for ${employeeName} on ${normalizedDate.toISOString().split('T')[0]}`);

        // CASE 1: Only leave is present (single entry with task_name = 'Leave')
        const hasOnlyLeave = existingEntries.length === 1 && 
                            existingEntries[0].work_mode === 'Leave';

        if (hasOnlyLeave) {
            const leaveEntry = existingEntries[0];
            const leaveHours = parseFloat(leaveEntry.hours_spent) || 0;

            console.log(`Case 1: Only leave present (${leaveHours} hours)`);

            if (workMode === 'In Office') {
                // Remove the full day leave
                await prisma.masterDatabase.delete({
                    where: { id: leaveEntry.id }
                });
                console.log(`Removed full day leave (${leaveHours} hours) for ${employeeName}`);
                
                return {
                    action: 'removed_full_leave',
                    removedLeaveHours: leaveHours,
                    message: `Removed existing full day leave of ${leaveHours} hours`
                };
            } else if (workMode === 'Half Day') {
                // Remove full day leave and we'll add half day leave later
                await prisma.masterDatabase.delete({
                    where: { id: leaveEntry.id }
                });
                console.log(`Removed full day leave for Half Day work mode for ${employeeName}`);
                
                // Create half day leave entry
                const halfDayLeaveData = {
                    date: normalizedDate,
                    work_mode: 'Leave',
                    project_name: '',
                    task_name: '',
                    book_element: '',
                    chapter_number: '',
                    hours_spent: 3.75,
                    number_of_units: 0,
                    unit_type: 'general',
                    status: '',
                    due_on: normalizedDate,
                    details: 'Auto-assigned partial leave for Half Day',
                    audit_status: 'Approved',
                    name: employeeName,
                    team: employeeTeam,
                    added_by_admin: true,
                    edited_by_admin: false,
                    admin_action_by: adminName,
                    admin_action_date: new Date(),
                    is_entry_request: false
                };

                const halfDayLeave = await prisma.masterDatabase.create({
                    data: halfDayLeaveData
                });
                
                console.log(`Added half day leave (3.75 hours) for ${employeeName}`);

                return {
                    action: 'replaced_with_half_leave',
                    removedLeaveHours: leaveHours,
                    addedLeaveHours: 3.75,
                    halfDayLeaveId: halfDayLeave.id,
                    message: `Replaced full day leave with half day leave (3.75 hours)`
                };
            }
        }

        // CASE 2: Entries are already present (no leave OR leave + other entries)
        const hasExistingWorkEntries = existingEntries.length > 0 && 
                                       existingEntries.some(entry => entry.work_mode !== 'Leave');

        if (hasExistingWorkEntries || existingEntries.length > 1) {
            console.log(`Case 2: Existing work entries present (${existingEntries.length} entries)`);

            if (workMode === 'Half Day') {
                // Check if half day leave already exists
                const existingHalfDayLeave = existingEntries.find(
                    entry => entry.work_mode === 'Leave' && 
                            parseFloat(entry.hours_spent) === 3.75
                );

                if (!existingHalfDayLeave) {
                    // Add half day leave
                    const halfDayLeaveData = {
                        date: normalizedDate,
                        work_mode: 'Leave',
                        project_name: '',
                        task_name: '',
                        book_element: '',
                        chapter_number: '',
                        hours_spent: 3.75,
                        number_of_units: 0,
                        unit_type: 'general',
                        status: '',
                        due_on: normalizedDate,
                        details: 'Auto-assigned partial leave for Half Day',
                        audit_status: 'Approved',
                        name: employeeName,
                        team: employeeTeam,
                        added_by_admin: true,
                        edited_by_admin: false,
                        admin_action_by: adminName,
                        admin_action_date: new Date(),
                        is_entry_request: false
                    };

                    const halfDayLeave = await prisma.masterDatabase.create({
                        data: halfDayLeaveData
                    });
                    
                    console.log(`Added half day leave (3.75 hours) for ${employeeName}`);

                    return {
                        action: 'added_half_leave',
                        addedLeaveHours: 3.75,
                        halfDayLeaveId: halfDayLeave.id,
                        message: `Added half day leave (3.75 hours) as work mode is Half Day`
                    };
                } else {
                    console.log(`Half day leave already exists for ${employeeName}`);
                    return {
                        action: 'no_action_needed',
                        message: 'Half day leave already exists'
                    };
                }
            } else if (workMode === 'In Office') {
                // No additional leave needed for full day work
                console.log(`Work mode is In Office, no leave adjustment needed for ${employeeName}`);
                return {
                    action: 'no_action_needed',
                    message: 'No leave adjustment needed for In Office work mode'
                };
            }
        }

        // CASE 3: No existing entries at all (shouldn't happen with trigger, but handle it)
        // if (existingEntries.length === 0) {
        //     console.log(`Case 3: No existing entries for ${employeeName} on ${normalizedDate.toISOString().split('T')[0]}`);
            
        //     if (workMode === 'Half Day') {
        //         // Add half day leave
        //         const halfDayLeaveData = {
        //             date: normalizedDate,
        //             work_mode: 'Half Day',
        //             project_name: 'Leave',
        //             task_name: 'Leave',
        //             book_element: '-',
        //             chapter_number: '-',
        //             hours_spent: 3.75,
        //             number_of_units: 0,
        //             unit_type: '-',
        //             status: 'Leave',
        //             due_on: normalizedDate,
        //             details: 'Half day leave (auto-generated)',
        //             audit_status: 'Approved',
        //             name: employeeName,
        //             team: employeeTeam,
        //             added_by_admin: true,
        //             edited_by_admin: false,
        //             admin_action_by: adminName,
        //             admin_action_date: new Date(),
        //             is_entry_request: false
        //         };

        //         const halfDayLeave = await prisma.masterDatabase.create({
        //             data: halfDayLeaveData
        //         });
                
        //         console.log(`Added half day leave (3.75 hours) for ${employeeName}`);

        //         return {
        //             action: 'added_half_leave',
        //             addedLeaveHours: 3.75,
        //             halfDayLeaveId: halfDayLeave.id,
        //             message: `Added half day leave (3.75 hours)`
        //         };
        //     }
        // }

        // // Default: No action needed
        // return {
        //     action: 'no_action_needed',
        //     message: 'No leave automation needed'
        // };

    } catch (error) {
        console.error('Error in handleLeaveAutomation:', error);
        throw error;
    }
};


// Approve entry request - Push to database (Tick option)
// const approveEntryRequest = async (req, res) => {
//     try {
//         const adminEmail = req.user.email;
//         const adminName = req.user.name;
//         const { worklogId } = req.body;

//         if (!worklogId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Worklog ID is required'
//             });
//         }

//         // Convert worklogId to integer
//         const id = parseInt(worklogId);

//         // Check if the entry request exists and is eligible for admin approval
//         const existingWorklog = await prisma.todaysWorklog.findFirst({
//             where: {
//                 id: id,
//                 is_entry_request: true,
//                 audit_status: 'Approved',  // Must be SPOC approved
//                 request_status: 'Pending'   // Must be pending admin action
//             }
//         });

//         if (!existingWorklog) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Entry request not found or not eligible for approval'
//             });
//         }

//         // Prepare data for MasterDatabase
//         const masterData = {
//             date: existingWorklog.date,
//             work_mode: existingWorklog.work_mode,
//             project_name: existingWorklog.project_name,
//             task_name: existingWorklog.task_name,
//             book_element: existingWorklog.book_element,
//             chapter_number: existingWorklog.chapter_number,
//             hours_spent: existingWorklog.hours_spent,
//             number_of_units: existingWorklog.number_of_units,
//             unit_type: existingWorklog.unit_type,
//             status: existingWorklog.status,
//             due_on: existingWorklog.due_on,
//             details: existingWorklog.details,
//             audit_status: existingWorklog.audit_status,
//             name: existingWorklog.name,
//             team: existingWorklog.team,
//             added_by_admin: true,
//             edited_by_admin: false,
//             admin_action_by: adminName,
//             admin_action_date: new Date(),
//             is_entry_request: existingWorklog.is_entry_request
//         };

//         // 1. Create entry in MasterDatabase first
//         const masterEntry = await prisma.masterDatabase.create({
//             data: masterData,
//             select: {
//                 id: true,
//                 name: true,
//                 date: true,
//             }
//         });

//         await prisma.todaysWorklog.update({
//             where: {
//                 id: id
//             },
//             data: {
//                 request_status: 'Approved',
//                 added_by_admin: true,
//                 admin_action_by: adminName,
//                 admin_action_date: new Date()
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Entry request approved and moved to master database successfully',
//             worklog: {
//                 _id: masterEntry.id.toString(),
//                 employeeName: masterEntry.name, // Fixed: using 'name' instead of 'employee_name'
//                 date: masterEntry.date,
//                 projectName: masterEntry.project_name,
//                 taskName: masterEntry.task_name,
//                 hoursSpent: masterEntry.hours_spent
//             }
//         });
//     } catch (error) {
//         console.error('Error approving entry request:', error);

//         // Provide more specific error messages
//         let errorMessage = 'Failed to approve entry request';
//         if (error.code === 'P2025') {
//             errorMessage = 'Worklog not found for deletion';
//         } else if (error.code === 'P2002') {
//             errorMessage = 'Duplicate entry in master database';
//         } else if (error.code === 'P2003') {
//             errorMessage = 'Foreign key constraint failed';
//         }

//         res.status(500).json({
//             success: false,
//             message: errorMessage,
//             error: error.message
//         });
//     }
// };


const approveEntryRequest = async (req, res) => {
    try {
        const adminEmail = req.user.email;
        const adminName = req.user.name;
        const { worklogId } = req.body;

        if (!worklogId) {
            return res.status(400).json({
                success: false,
                message: 'Worklog ID is required'
            });
        }

        // Convert worklogId to integer
        const id = parseInt(worklogId);

        // Check if the entry request exists and is eligible for admin approval
        const existingWorklog = await prisma.todaysWorklog.findFirst({
            where: {
                id: id,
                is_entry_request: true,
                audit_status: 'Approved',  // Must be SPOC approved
                request_status: 'Pending'   // Must be pending admin action
            }
        });

        if (!existingWorklog) {
            return res.status(404).json({
                success: false,
                message: 'Entry request not found or not eligible for approval'
            });
        }

        // Handle leave automation BEFORE creating the master entry
        const automationResult = await handleLeaveAutomation(existingWorklog, adminName);
        console.log('Automation result:', automationResult);

        // Prepare data for MasterDatabase
        const masterData = {
            date: existingWorklog.date,
            work_mode: existingWorklog.work_mode,
            project_name: existingWorklog.project_name,
            task_name: existingWorklog.task_name,
            book_element: existingWorklog.book_element,
            chapter_number: existingWorklog.chapter_number,
            hours_spent: existingWorklog.hours_spent,
            number_of_units: existingWorklog.number_of_units,
            unit_type: existingWorklog.unit_type,
            status: existingWorklog.status,
            due_on: existingWorklog.due_on,
            details: existingWorklog.details,
            audit_status: existingWorklog.audit_status,
            name: existingWorklog.name,
            team: existingWorklog.team,
            added_by_admin: true,
            edited_by_admin: false,
            admin_action_by: adminName,
            admin_action_date: new Date(),
            is_entry_request: existingWorklog.is_entry_request
        };

        // Create entry in MasterDatabase
        const masterEntry = await prisma.masterDatabase.create({
            data: masterData,
            select: {
                id: true,
                name: true,
                date: true,
                project_name: true,
                task_name: true,
                hours_spent: true
            }
        });

        // Update TodaysWorklog to mark as approved
        await prisma.todaysWorklog.update({
            where: {
                id: id
            },
            data: {
                request_status: 'Approved',
                added_by_admin: true,
                admin_action_by: adminName,
                admin_action_date: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: 'Entry request approved and moved to master database successfully',
            worklog: {
                _id: masterEntry.id.toString(),
                employeeName: masterEntry.name,
                date: masterEntry.date,
                projectName: masterEntry.project_name,
                taskName: masterEntry.task_name,
                hoursSpent: masterEntry.hours_spent
            },
            automation: automationResult
        });
    } catch (error) {
        console.error('Error approving entry request:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to approve entry request';
        if (error.code === 'P2025') {
            errorMessage = 'Worklog not found for deletion';
        } else if (error.code === 'P2002') {
            errorMessage = 'Duplicate entry in master database';
        } else if (error.code === 'P2003') {
            errorMessage = 'Foreign key constraint failed';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};


// Reject entry request (Cross option)
const rejectEntryRequest = async (req, res) => {
    try {
        const adminEmail = req.user.email;
        const adminName = req.user.name;
        const { worklogId, rejectionReason } = req.body;

        if (!worklogId) {
            return res.status(400).json({
                success: false,
                message: 'Worklog ID is required'
            });
        }

        // Convert worklogId to integer
        const id = parseInt(worklogId);

        // Check if the entry request exists and is eligible for admin rejection
        const existingWorklog = await prisma.todaysWorklog.findFirst({
            where: {
                id: id,
                is_entry_request: true,
                audit_status: 'Approved',  // Must be SPOC approved
                request_status: 'Pending'   // Must be pending admin action
            }
        });

        if (!existingWorklog) {
            return res.status(404).json({
                success: false,
                message: 'Entry request not found or not eligible for rejection'
            });
        }

        // Update the worklog - Mark as rejected by admin
        const updatedWorklog = await prisma.todaysWorklog.update({
            where: {
                id: id
            },
            data: {
                request_status: 'Rejected',
                admin_action_by: adminName,
                admin_action_date: new Date(),
            },
            select: {
                id: true,
                name: true,
                date: true,
                request_status: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Entry request rejected successfully',
            worklog: {
                _id: updatedWorklog.id.toString(),
                employeeName: updatedWorklog.name,
                date: updatedWorklog.date,
                requestStatus: updatedWorklog.request_status
            }
        });
    } catch (error) {
        console.error('Error rejecting entry request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject entry request',
            error: error.message
        });
    }
};

// Bulk approve entry requests
// const bulkApproveEntryRequests = async (req, res) => {
//     try {
//         const adminEmail = req.user.email;
//         const adminName = req.user.name;
//         const { worklogIds } = req.body;

//         // Validate
//         if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'worklogIds must be a non-empty array'
//             });
//         }

//         // Convert worklogIds to integers
//         const ids = worklogIds.map(id => parseInt(id));

//         // First, get all eligible entry requests that can be approved
//         const eligibleWorklogs = await prisma.todaysWorklog.findMany({
//             where: {
//                 id: { in: ids },
//                 is_entry_request: true,
//                 audit_status: 'Approved',  // Must be SPOC approved
//                 request_status: 'Pending'   // Must be pending admin action
//             }
//         });

//         if (eligibleWorklogs.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No eligible entry requests found for approval'
//             });
//         }

//         const eligibleIds = eligibleWorklogs.map(log => log.id);

//         // Process each worklog individually to create entries in MasterDatabase
//         const approvedEntries = [];
//         const failedEntries = [];

//         for (const worklog of eligibleWorklogs) {
//             try {
//                 // Prepare data for MasterDatabase
//                 const masterData = {
//                     date: worklog.date,
//                     work_mode: worklog.work_mode,
//                     project_name: worklog.project_name,
//                     task_name: worklog.task_name,
//                     book_element: worklog.book_element,
//                     chapter_number: worklog.chapter_number,
//                     hours_spent: worklog.hours_spent,
//                     number_of_units: worklog.number_of_units,
//                     unit_type: worklog.unit_type,
//                     status: worklog.status,
//                     due_on: worklog.due_on,
//                     details: worklog.details,
//                     audit_status: worklog.audit_status,
//                     name: worklog.name,
//                     team: worklog.team,
//                     added_by_admin: true,
//                     edited_by_admin: false,
//                     admin_action_by: adminName,
//                     admin_action_date: new Date(),
//                     is_entry_request: worklog.is_entry_request
//                 };

//                 // 1. Create entry in MasterDatabase
//                 const masterEntry = await prisma.masterDatabase.create({
//                     data: masterData,
//                     select: {
//                         id: true,
//                         name: true,
//                         date: true,
//                         project_name: true,
//                         task_name: true,
//                         hours_spent: true
//                     }
//                 });

//                 // 2. Update TodaysWorklog to mark as approved
//                 await prisma.todaysWorklog.update({
//                     where: {
//                         id: worklog.id
//                     },
//                     data: {
//                         request_status: 'Approved',
//                         added_by_admin: true,
//                         admin_action_by: adminName,
//                         admin_action_date: new Date()
//                     }
//                 });

//                 approvedEntries.push({
//                     _id: masterEntry.id.toString(),
//                     employeeName: masterEntry.name,
//                     date: masterEntry.date,
//                     projectName: masterEntry.project_name,
//                     taskName: masterEntry.task_name,
//                     hoursSpent: masterEntry.hours_spent
//                 });
//             } catch (error) {
//                 console.error(`Error processing worklog ${worklog.id}:`, error);
//                 failedEntries.push({
//                     worklogId: worklog.id,
//                     employeeName: worklog.name,
//                     error: error.message
//                 });
//             }
//         }

//         res.status(200).json({
//             success: true,
//             message: `Successfully processed ${approvedEntries.length} entry requests`,
//             approvedEntries: approvedEntries,
//             failedEntries: failedEntries,
//             summary: {
//                 totalRequested: worklogIds.length,
//                 eligibleFound: eligibleWorklogs.length,
//                 successfullyApproved: approvedEntries.length,
//                 failed: failedEntries.length
//             }
//         });
//     } catch (error) {
//         console.error('Error bulk approving entry requests:', error);
        
//         // Provide more specific error messages
//         let errorMessage = 'Failed to bulk approve entry requests';
//         if (error.code === 'P2025') {
//             errorMessage = 'Worklog not found for update';
//         } else if (error.code === 'P2002') {
//             errorMessage = 'Duplicate entry in master database';
//         } else if (error.code === 'P2003') {
//             errorMessage = 'Foreign key constraint failed';
//         }

//         res.status(500).json({
//             success: false,
//             message: errorMessage,
//             error: error.message
//         });
//     }
// };


const bulkApproveEntryRequests = async (req, res) => {
    try {
        const adminEmail = req.user.email;
        const adminName = req.user.name;
        const { worklogIds } = req.body;

        // Validate
        if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'worklogIds must be a non-empty array'
            });
        }

        // Convert worklogIds to integers
        const ids = worklogIds.map(id => parseInt(id));

        // First, get all eligible entry requests that can be approved
        const eligibleWorklogs = await prisma.todaysWorklog.findMany({
            where: {
                id: { in: ids },
                is_entry_request: true,
                audit_status: 'Approved',  // Must be SPOC approved
                request_status: 'Pending'   // Must be pending admin action
            }
        });

        if (eligibleWorklogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No eligible entry requests found for approval'
            });
        }

        const eligibleIds = eligibleWorklogs.map(log => log.id);

        // Group worklogs by employee and date for efficient leave automation
        // We only need to run automation once per employee-date combination
        const employeeDateMap = new Map();
        eligibleWorklogs.forEach(worklog => {
            const key = `${worklog.name}_${worklog.date.toISOString().split('T')[0]}`;
            if (!employeeDateMap.has(key)) {
                employeeDateMap.set(key, worklog);
            }
        });

        // Run leave automation for each unique employee-date combination
        const automationResults = [];
        for (const [key, worklog] of employeeDateMap.entries()) {
            try {
                const result = await handleLeaveAutomation(worklog, adminName);
                automationResults.push({
                    employee: worklog.name,
                    date: worklog.date.toISOString().split('T')[0],
                    ...result
                });
                console.log(`Automation completed for ${key}:`, result);
            } catch (error) {
                console.error(`Automation failed for ${key}:`, error);
                automationResults.push({
                    employee: worklog.name,
                    date: worklog.date.toISOString().split('T')[0],
                    action: 'failed',
                    error: error.message
                });
            }
        }

        // Process each worklog individually to create entries in MasterDatabase
        const approvedEntries = [];
        const failedEntries = [];

        for (const worklog of eligibleWorklogs) {
            try {
                // Prepare data for MasterDatabase
                const masterData = {
                    date: worklog.date,
                    work_mode: worklog.work_mode,
                    project_name: worklog.project_name,
                    task_name: worklog.task_name,
                    book_element: worklog.book_element,
                    chapter_number: worklog.chapter_number,
                    hours_spent: worklog.hours_spent,
                    number_of_units: worklog.number_of_units,
                    unit_type: worklog.unit_type,
                    status: worklog.status,
                    due_on: worklog.due_on,
                    details: worklog.details,
                    audit_status: worklog.audit_status,
                    name: worklog.name,
                    team: worklog.team,
                    added_by_admin: true,
                    edited_by_admin: false,
                    admin_action_by: adminName,
                    admin_action_date: new Date(),
                    is_entry_request: worklog.is_entry_request
                };

                // Create entry in MasterDatabase
                const masterEntry = await prisma.masterDatabase.create({
                    data: masterData,
                    select: {
                        id: true,
                        name: true,
                        date: true,
                        project_name: true,
                        task_name: true,
                        hours_spent: true
                    }
                });

                // Update TodaysWorklog to mark as approved
                await prisma.todaysWorklog.update({
                    where: {
                        id: worklog.id
                    },
                    data: {
                        request_status: 'Approved',
                        added_by_admin: true,
                        admin_action_by: adminName,
                        admin_action_date: new Date()
                    }
                });

                approvedEntries.push({
                    _id: masterEntry.id.toString(),
                    employeeName: masterEntry.name,
                    date: masterEntry.date,
                    projectName: masterEntry.project_name,
                    taskName: masterEntry.task_name,
                    hoursSpent: masterEntry.hours_spent
                });
            } catch (error) {
                console.error(`Error processing worklog ${worklog.id}:`, error);
                failedEntries.push({
                    worklogId: worklog.id,
                    employeeName: worklog.name,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully processed ${approvedEntries.length} entry requests`,
            approvedEntries: approvedEntries,
            failedEntries: failedEntries,
            automationResults: automationResults,
            summary: {
                totalRequested: worklogIds.length,
                eligibleFound: eligibleWorklogs.length,
                successfullyApproved: approvedEntries.length,
                failed: failedEntries.length,
                automationRuns: automationResults.length
            }
        });
    } catch (error) {
        console.error('Error bulk approving entry requests:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to bulk approve entry requests';
        if (error.code === 'P2025') {
            errorMessage = 'Worklog not found for update';
        } else if (error.code === 'P2002') {
            errorMessage = 'Duplicate entry in master database';
        } else if (error.code === 'P2003') {
            errorMessage = 'Foreign key constraint failed';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};


module.exports = {
    getPendingEntryRequests,
    getAllEmployees,
    approveEntryRequest,
    rejectEntryRequest,
    bulkApproveEntryRequests
};
