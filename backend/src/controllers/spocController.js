
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SpocController {
    
    // Get pending worklogs for approval
    static async getPendingWorklogs(req, res) {
        try {
            const spocEmail = req.user.email;
            console.log('SPOC Email:', spocEmail); // Debug log
            
            // Calculate date range for past 7 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0); // Start of day
            endDate.setHours(23, 59, 59, 999); // End of day
            
            console.log('Date range:', { startDate, endDate }); // Debug log
            
            // First, get all employees under this SPOC
            let employeesUnderSpoc;
            
            try {
                employeesUnderSpoc = await prisma.users.findMany({
                    where: {
                        spoc_email: spocEmail,
                        role: 'EMPLOYEE' // or enum value
                    },
                    select: { name: true, email: true, team: true }
                });
            } catch (enumError) {
                try {
                    employeesUnderSpoc = await prisma.users.findMany({
                        where: {
                            spoc_email: spocEmail,
                            role: 'employee' // lowercase
                        },
                        select: { name: true, email: true, team: true }
                    });
                } catch (caseError) {
                    employeesUnderSpoc = await prisma.$queryRaw`
                        SELECT name, email, team 
                        FROM "Users" 
                        WHERE spoc_email = ${spocEmail} 
                        AND role::text = 'Employee'
                    `;
                }
            }

            console.log('Employees found:', employeesUnderSpoc.length); // Debug log

            if (employeesUnderSpoc.length === 0) {
                return res.json({
                    success: true,
                    worklogsByDate: {},
                    totalCount: 0,
                    message: 'No employees found under this SPOC'
                });
            }

            const employeeNames = employeesUnderSpoc.map(emp => emp.name);
            console.log('Employee names:', employeeNames); // Debug log

            // Fetch worklogs for these employees with pending status
            const worklogs = await prisma.masterDatabase.findMany({
                where: {
                    name: { in: employeeNames },
                    date: { gte: startDate, lte: endDate },
                    audit_status: 'Pending'
                }
            });

            console.log('Worklogs found:', worklogs.length); // Debug log

            // Group worklogs by date and add employee info
            const worklogsByDate = {};
            worklogs.forEach(log => {
                const employeeInfo = employeesUnderSpoc.find(emp => emp.name === log.name);
                
                const formattedLog = {
                    _id: log.id,
                    employeeName: log.name,
                    employeeEmail: employeeInfo?.email || '',
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
                    details: log.details || '',
                    auditStatus: log.audit_status,
                    team: log.team,
                    date: log.date
                };

                const dateKey = log.date ? log.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
                if (!worklogsByDate[dateKey]) {
                    worklogsByDate[dateKey] = [];
                }
                worklogsByDate[dateKey].push(formattedLog);
            });

            // ✅ Sort worklogs by date (latest first)
            const sortedWorklogsByDate = {};
            Object.keys(worklogsByDate)
                .sort((a, b) => new Date(b) - new Date(a)) // Desc order
                .forEach(key => {
                    sortedWorklogsByDate[key] = worklogsByDate[key];
                });

            res.json({
                success: true,
                worklogsByDate: sortedWorklogsByDate,
                totalCount: worklogs.length,
                employeeCount: employeesUnderSpoc.length
            });

        } catch (error) {
            console.error('Error fetching pending worklogs:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    // Update worklog audit status
    static async updateWorklogStatus(req, res) {
        try {
            const { worklogId, auditStatus } = req.body;
            const spocEmail = req.user.email;

            console.log('Update request:', { worklogId, auditStatus, spocEmail });

            if (!worklogId || !auditStatus) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'worklogId and auditStatus are required'
                });
            }

            if (!['Approved', 'Rejected'].includes(auditStatus)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid audit status',
                    message: 'auditStatus must be either "Approved" or "Rejected"'
                });
            }

            const worklog = await prisma.masterDatabase.findUnique({
                where: { id: parseInt(worklogId) }
            });

            if (!worklog) {
                return res.status(404).json({
                    success: false,
                    error: 'Worklog not found',
                    message: 'The specified worklog does not exist'
                });
            }

            let employee;
            try {
                employee = await prisma.users.findFirst({
                    where: {
                        name: worklog.name,
                        spoc_email: spocEmail,
                        role: 'EMPLOYEE'
                    }
                });
            } catch (enumError) {
                try {
                    employee = await prisma.users.findFirst({
                        where: {
                            name: worklog.name,
                            spoc_email: spocEmail,
                            role: 'employee'
                        }
                    });
                } catch (caseError) {
                    const result = await prisma.$queryRaw`
                        SELECT id, name, email, team, spoc_name 
                        FROM "Users" 
                        WHERE name = ${worklog.name} 
                        AND spoc_email = ${spocEmail} 
                        AND role::text = 'Employee'
                        LIMIT 1
                    `;
                    employee = result[0] || null;
                }
            }

            if (!employee) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You are not authorized to approve/reject this worklog'
                });
            }

            const updatedWorklog = await prisma.masterDatabase.update({
                where: { id: parseInt(worklogId) },
                data: { audit_status: auditStatus }
            });

            res.json({
                success: true,
                message: `Worklog ${auditStatus.toLowerCase()} successfully`,
                worklog: {
                    id: updatedWorklog.id,
                    employeeName: updatedWorklog.name,
                    projectName: updatedWorklog.project_name,
                    auditStatus: updatedWorklog.audit_status,
                    updatedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Error updating worklog status:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    // Get worklog summary
    static async getWorklogSummary(req, res) {
        try {
            const spocEmail = req.user.email;
            
            let employeesUnderSpoc;
            try {
                employeesUnderSpoc = await prisma.users.findMany({
                    where: { spoc_email: spocEmail, role: 'EMPLOYEE' },
                    select: { name: true }
                });
            } catch (enumError) {
                try {
                    employeesUnderSpoc = await prisma.users.findMany({
                        where: { spoc_email: spocEmail, role: 'employee' },
                        select: { name: true }
                    });
                } catch (caseError) {
                    employeesUnderSpoc = await prisma.$queryRaw`
                        SELECT name 
                        FROM "Users" 
                        WHERE spoc_email = ${spocEmail} 
                        AND role::text = 'Employee'
                    `;
                }
            }

            if (employeesUnderSpoc.length === 0) {
                return res.json({
                    success: true,
                    summary: {
                        totalEmployees: 0,
                        pendingApprovals: 0,
                        approvedWorklogs: 0,
                        rejectedWorklogs: 0,
                        totalWorklogs: 0
                    }
                });
            }

            const employeeNames = employeesUnderSpoc.map(emp => emp.name);

            const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
                prisma.masterDatabase.count({ where: { name: { in: employeeNames }, audit_status: 'Pending' } }),
                prisma.masterDatabase.count({ where: { name: { in: employeeNames }, audit_status: 'Approved' } }),
                prisma.masterDatabase.count({ where: { name: { in: employeeNames }, audit_status: 'Rejected' } })
            ]);

            res.json({
                success: true,
                summary: {
                    totalEmployees: employeesUnderSpoc.length,
                    pendingApprovals: pendingCount,
                    approvedWorklogs: approvedCount,
                    rejectedWorklogs: rejectedCount,
                    totalWorklogs: pendingCount + approvedCount + rejectedCount
                }
            });

        } catch (error) {
            console.error('Error fetching worklog summary:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    // Get all employees under SPOC
    static async getEmployeesUnderSpoc(req, res) {
        try {
            const spocEmail = req.user.email;
            
            let employees;
            const possibleRoleValues = ['Employee', 'Spoc', 'ADMIN'];
            
            for (const roleValue of possibleRoleValues) {
                try {
                    employees = await prisma.users.findMany({
                        where: { spoc_email: spocEmail, role: roleValue },
                        select: { id: true, name: true, email: true, team: true, spoc_name: true },
                        orderBy: { name: 'asc' }
                    });
                    if (employees.length > 0) break;
                } catch (error) {
                    console.log(`Failed to get employees with role ${roleValue}:`, error.message);
                    continue;
                }
            }
            
            if (!employees) employees = [];

            res.json({
                success: true,
                employees,
                count: employees.length
            });

        } catch (error) {
            console.error('Error fetching employees under SPOC:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }
}

module.exports = SpocController;
