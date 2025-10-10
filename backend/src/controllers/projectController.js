// const prisma = require("../config/prisma");

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
//     } else {
//       // First check for exact match (direct project name)
//       where = {
//         project_name: {
//           equals: search.trim(),
//           mode: "insensitive",
//         },
//       };

//       // If not exact match, fallback to partial contains logic
//       const searchTerms = search.trim().split(/\s+/);

//       if (searchTerms.length === 1) {
//         where = {
//           OR: [
//             { project_name: { equals: search.trim(), mode: "insensitive" } },
//             { project_name: { contains: search.trim(), mode: "insensitive" } },
//           ],
//         };
//       } else {
//         where = {
//           OR: [
//             {
//               project_name: {
//                 equals: search.trim(),
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
//     }

//     console.log("Search query:", search);
//     console.log("Where clause:", JSON.stringify(where, null, 2));

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
      // Search specifically in ID fields only
      where = {
        OR: [
          {
            project_id: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
          {
            project_id: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        ],
      };
    } else {
      // Combined search logic for both project IDs and names
      const searchTerm = search.trim();
      const searchTerms = searchTerm.split(/\s+/);
      
      // Build comprehensive search conditions
      const searchConditions = [];
      
      // 1. Search in project ID fields (for codes like FK_1st_CBSE_SST_FKSST_(Eng)_26-27)
      searchConditions.push(
        {
          project_id: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          project_id: {
            contains: searchTerm,
            mode: "insensitive",
          },
        }
      );
      
      // 2. Exact match in project_name (highest priority for names)
      searchConditions.push({
        project_name: {
          equals: searchTerm,
          mode: "insensitive",
        },
      });
      
      // 3. Contains search in project_name
      searchConditions.push({
        project_name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      });
      
      // 4. Multi-term search logic
      if (searchTerms.length === 1) {
        // Single term - already covered above
      } else {
        // Multiple terms - all terms must be present in project_name (AND logic)
        searchConditions.push({
          AND: searchTerms.map(term => ({
            project_name: {
              contains: term,
              mode: "insensitive",
            },
          })),
        });
        
        // Also search for each term individually in project IDs
        searchTerms.forEach(term => {
          if (term.length >= 2) { // Only search terms with 2+ characters
            searchConditions.push(
              {
                project_id: {
                  contains: term,
                  mode: "insensitive",
                },
              },
              {
                project_id: {
                  contains: term,
                  mode: "insensitive",
                },
              }
            );
          }
        });
      }
      
      // Combine all conditions with OR
      where = {
        OR: searchConditions,
      };
    }

    console.log("Search query:", search);
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const projects = await prisma.ProjectRecords.findMany({
      where,
      orderBy: { project_name: "asc" },
      take: 50, // limit results
    });
    
    console.log(`Found ${projects.length} projects matching "${search}"`);
    
    // Enhanced sorting for relevance
    const sortedProjects = projects.sort((a, b) => {
      const searchLower = search.toLowerCase();
      const aName = (a.project_name || "").toLowerCase();
      const bName = (b.project_name || "").toLowerCase();
      const aId = (a.project_id || a.project_id || "").toLowerCase();
      const bId = (b.project_id || b.project_id || "").toLowerCase();
      
      // 1. Exact match in project_name gets highest priority
      if (aName === searchLower && bName !== searchLower) return -1;
      if (bName === searchLower && aName !== searchLower) return 1;
      
      // 2. Exact match in project_id gets second priority
      if (aId === searchLower && bId !== searchLower) return -1;
      if (bId === searchLower && aId !== searchLower) return 1;
      
      // 3. Contains in project_id gets third priority (for SST, CBSE, etc.)
      if (aId.includes(searchLower) && !bId.includes(searchLower)) return -1;
      if (bId.includes(searchLower) && !aId.includes(searchLower)) return 1;
      
      // 4. Project_name starts with search term
      if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
      if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1;
      
      // 5. Contains in project_name
      if (aName.includes(searchLower) && !bName.includes(searchLower)) return -1;
      if (bName.includes(searchLower) && !aName.includes(searchLower)) return 1;
      
      // 6. Default alphabetical sort
      return aName.localeCompare(bName);
    });
    
    res.json({ success: true, projects: sortedProjects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getProjects };
