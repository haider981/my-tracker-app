// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // GET /api/projects?search=query
// const getProjects = async (req, res) => {
//   try {
//     const search = req.query.q || "";      // text to search
//     const by = req.query.by || "name";     // default search by name

//     let where = {};

//     if (search.trim() === "") {
//       // If no search term, return all projects
//       where = {};
//     } else if (by === "id") {
//       where = {
//         projectid: {
//           contains: search.trim(),
//           mode: "insensitive",
//         },
//       };
//     } else if (by === "all") {
//       // Search in both projectid and project_name
//       const cleanedSearch = search.trim().replace(/_/g, " "); // handle underscores
//       const searchTerms = cleanedSearch.split(/\s+/);

//       if (searchTerms.length === 1) {
//         where = {
//           OR: [
//             {
//               projectid: {
//                 contains: search.trim(),
//                 mode: "insensitive",
//               },
//             },
//             {
//               project_name: {
//                 contains: cleanedSearch,
//                 mode: "insensitive",
//               },
//             },
//           ],
//         };
//       } else {
//         // Multiple terms - all must be present in project_name
//         where = {
//           OR: [
//             {
//               projectid: {
//                 contains: search.trim(),
//                 mode: "insensitive",
//               },
//             },
//             {
//               AND: searchTerms.map(term => ({
//                 project_name: {
//                   contains: term,
//                   mode: "insensitive",
//                 },
//               })),
//             },
//           ],
//         };
//       }
//     } else {
//       // Enhanced search for project name
//       const cleanedSearch = search.trim().replace(/_/g, " "); // handle underscores
//       const searchTerms = cleanedSearch.split(/\s+/);

//       if (searchTerms.length === 1) {
//         // Single term search
//         where = {
//           project_name: {
//             contains: cleanedSearch,
//             mode: "insensitive",
//           },
//         };
//       } else {
//         // Multiple terms - all must be present (AND logic)
//         where = {
//           AND: searchTerms.map(term => ({
//             project_name: {
//               contains: term,
//               mode: "insensitive",
//             },
//           })),
//         };
//       }
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

// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

const prisma = require("../config/prisma");

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
      // First check for exact match (direct project name)
      where = {
        project_name: {
          equals: search.trim(),
          mode: "insensitive",
        },
      };

      // If not exact match, fallback to partial contains logic
      const searchTerms = search.trim().split(/\s+/);

      if (searchTerms.length === 1) {
        where = {
          OR: [
            { project_name: { equals: search.trim(), mode: "insensitive" } },
            { project_name: { contains: search.trim(), mode: "insensitive" } },
          ],
        };
      } else {
        where = {
          OR: [
            {
              project_name: {
                equals: search.trim(),
                mode: "insensitive",
              },
            },
            {
              AND: searchTerms.map(term => ({
                project_name: {
                  contains: term,
                  mode: "insensitive",
                },
              })),
            },
          ],
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
    
    res.json({ success: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getProjects };
