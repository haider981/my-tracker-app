const prisma = require("../config/prisma");

const createProject = async (req, res) => {
    try {
        const { project_id, project_name, due_date } = req.body;

        // Extract user details from auth (middleware should set req.user)
        const { name, email } = req.user || {};
        if (!name || !email) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user details missing'
            });
        }

        // Validate required fields
        if (!project_id || !project_name || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: project_id, project_name, and due_date are required'
            });
        }

        // Check if project already exists
        const existingProject = await prisma.projectRecords.findUnique({
            where: { project_id }
        });

        if (existingProject) {
            return res.status(409).json({
                success: false,
                message: 'Project with this ID already exists'
            });
        }

        // Create new project with start_date = current date
        const newProject = await prisma.projectRecords.create({
            data: {
                project_id,
                project_name,
                due_date: due_date ? new Date(due_date) : null,
                audit_status: 'Added by Admin',
                start_date: new Date(), // current date
                name,
                email
            }
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                projectId: newProject.project_id,
                projectName: newProject.project_name,
                dueDate: newProject.due_date ? newProject.due_date.toISOString().split('T')[0] : null,
                status: newProject.audit_status,
                startDate: newProject.start_date ? newProject.start_date.toISOString().split('T')[0] : null,
                name: newProject.name,
                email: newProject.email
            }
        });

    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all projects for the logged-in user
const getAllProjects = async (req, res) => {
    try {
        const { email } = req.user || {};
        if (!email) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user details missing'
            });
        }

        const projects = await prisma.projectRecords.findMany({
            where: { email },
            orderBy: {
                start_date: 'desc'
            }
        });

        const transformedProjects = projects.map(project => ({
            projectId: project.project_id,
            projectName: project.project_name,
            startDate: project.start_date ? project.start_date.toISOString().split('T')[0] : null,
            dueDate: project.due_date ? project.due_date.toISOString().split('T')[0] : null,
            status: project.audit_status
        }));

        res.status(200).json({
            success: true,
            data: transformedProjects
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get a specific project by ID (but only if it belongs to logged-in user)
const getProjectById = async (req, res) => {
    try {
        const { project_id } = req.params;
        const { email } = req.user || {};

        if (!email) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user details missing'
            });
        }

        const project = await prisma.projectRecords.findFirst({
            where: {
                project_id,
                email
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                projectId: project.project_id,
                projectName: project.project_name,
                dueDate: project.due_date ? project.due_date.toISOString().split('T')[0] : null,
                status: project.audit_status,
                startDate: project.start_date ? project.start_date.toISOString().split('T')[0] : null,
                name: project.name,
                email: project.email
            }
        });

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update project status (for admin use)
const updateProjectStatus = async (req, res) => {
    try {
        const { project_id } = req.params;
        const { audit_status } = req.body;

        const validStatuses = ['In Review', 'Approved', 'Rejected'];
        if (!validStatuses.includes(audit_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: In Review, Approved, Rejected'
            });
        }

        const updatedProject = await prisma.projectRecords.update({
            where: { project_id },
            data: { audit_status }
        });

        res.status(200).json({
            success: true,
            message: 'Project status updated successfully',
            data: {
                projectId: updatedProject.project_id,
                projectName: updatedProject.project_name,
                dueDate: updatedProject.due_date ? updatedProject.due_date.toISOString().split('T')[0] : null,
                status: updatedProject.audit_status,
                startDate: updatedProject.start_date ? updatedProject.start_date.toISOString().split('T')[0] : null,
                name: updatedProject.name,
                email: updatedProject.email
            }
        });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        console.error('Error updating project status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProjectStatus
};
