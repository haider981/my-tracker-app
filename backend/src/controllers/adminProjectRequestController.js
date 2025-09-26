const prisma = require("../config/prisma");

/* =================== GET PROJECT REQUESTS =================== */
exports.getProjectRequests = async (req, res) => {
  try {
    const { startDate, endDate, spocs, auditStatus } = req.body; // frontend sends POST

    const filters = {};

    // Filter by project start_date
    if (startDate && endDate) {
      filters.start_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Filter by SPOCs
    if (spocs && spocs.length > 0) {
      filters.name = { in: spocs }; // make sure your DB has this field
    }

    // Filter by Audit Status
    if (auditStatus && auditStatus.length > 0) {
      filters.audit_status = { in: auditStatus };
    }

    const projects = await prisma.projectRecords.findMany({
      where: filters,
      orderBy: { start_date: "desc" },
    });

    // Group projects by start_date and transform field names to match frontend expectations
    const projectsByDate = {};
    projects.forEach((p) => {
      const key = p.start_date.toISOString().split("T")[0];
      if (!projectsByDate[key]) projectsByDate[key] = [];
      
      // Transform database fields to match frontend expectations
      const transformedProject = {
        _id: p.id, // Map id to _id
        project_id: p.project_id,
        project_name: p.project_name,
        start_date: p.start_date.toISOString().split("T")[0],
        due_date: p.due_date.toISOString().split("T")[0],
        spocName: p.name,
        email: p.email,
        auditStatus: p.audit_status, // Map audit_status to auditStatus
        adminComments: p.adminComments,
      };
      
      projectsByDate[key].push(transformedProject);
    });

    res.json({ projectsByDate });
  } catch (err) {
    console.error("Error fetching project requests:", err);
    res.status(500).json({ error: "Server error fetching projects" });
  }
};

/* =================== UPDATE SINGLE PROJECT =================== */
exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId, auditStatus } = req.body;

    if (!projectId || !auditStatus) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const project = await prisma.projectRecords.update({
      where: { project_id: projectId },   // ✅ use project_id
      data: {
        audit_status: auditStatus,        // ✅ removed adminComments
      },
    });

    res.json({ message: "Project updated", project });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Error updating project" });
  }
};


/* =================== BULK UPDATE PROJECTS =================== */
exports.bulkUpdateProjectStatus = async (req, res) => {
  try {
    const { projectIds, auditStatus} = req.body;

    if (!projectIds || !auditStatus) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await prisma.projectRecords.updateMany({
      where: { project_id: { in: projectIds } },
      data: {
        audit_status: auditStatus,
      },
    });

    res.json({ message: "Bulk update successful" });
  } catch (err) {
    console.error("Error in bulk update:", err);
    res.status(500).json({ error: "Error in bulk update" });
  }
};

/* =================== GET SPOCs =================== */
exports.getSpocs = async (req, res) => {
  let spocs = [];

  // Uppercase (enum style)
  try {
    const result = await prisma.users.findMany({
      where: { role: { in: ["SPOC"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    if (result.length) spocs = result;
  } catch {}

  // lowercase
  if (!spocs.length) {
    try {
      const result = await prisma.users.findMany({
        where: { role: { in: ["spoc"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      if (result.length) spocs = result;
    } catch {}
  }

  // Capitalized
  if (!spocs.length) {
    try {
      const result = await prisma.users.findMany({
        where: { role: { in: ["Spoc"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      if (result.length) spocs = result;
    } catch {}
  }

  // Raw SQL fallback
  if (!spocs.length) {
    try {
      const result = await prisma.$queryRaw`
        SELECT id, name, email
        FROM "Users"
        WHERE role::text IN ('SPOC','Spoc','spoc')
        ORDER BY name ASC
      `;
      spocs = result || [];
    } catch {
      spocs = [];
    }
  }

  return res.json({ spocs });
};
