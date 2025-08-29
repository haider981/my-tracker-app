// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // GET /api/projects?search=query
// const getProjects = async (req, res) => {
//   try {
//     const search = req.query.q || "";      // text to search
//     const by = req.query.by || "name";     // default search by name

//     let where = {};

//     if (by === "id") {
//       where = {
//         projectid: {
//           contains: search,
//           mode: "insensitive",
//         },
//       };
//     } else {
//       where = {
//         project_name: {
//           contains: search,
//           mode: "insensitive",
//         },
//       };
//     }

//     const projects = await prisma.ProjectRecords.findMany({
//       where,
//       orderBy: { project_name: "asc" },
//       take: 50, // limit results
//     });

//     res.json({ success: true, projects });
//   } catch (err) {
//     console.error("Error fetching projects:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// module.exports = { getProjects };


const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/projects?search=query
const getProjects = async (req, res) => {
  try {
    const search = req.query.q || "";      // text to search
    const by = req.query.by || "name";     // default search by name

    let where = {};

    if (search.trim() === "") {
      // If no search term, return all projects
      where = {};
    } else if (by === "id") {
      where = {
        projectid: {
          contains: search.trim(),
          mode: "insensitive",
        },
      };
    } else {
      // Enhanced search for project name
      const searchTerms = search.trim().split(/\s+/); // Split by whitespace
      
      if (searchTerms.length === 1) {
        // Single term search
        where = {
          project_name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        };
      } else {
        // Multiple terms - all must be present (AND logic)
        where = {
          AND: searchTerms.map(term => ({
            project_name: {
              contains: term,
              mode: "insensitive",
            },
          })),
        };
      }
    }

    console.log("Search query:", search);
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const projects = await prisma.ProjectRecords.findMany({
      where,
      orderBy: { project_name: "asc" },
      take: 50, // limit results
    });

    console.log(`Found ${projects.length} projects`);
    
    res.json({ success: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getProjects };
