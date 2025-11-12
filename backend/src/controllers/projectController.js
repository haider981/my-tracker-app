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
//       // Search specifically in ID fields only
//       where = {
//         OR: [
//           {
//             project_id: {
//               contains: search.trim(),
//               mode: "insensitive",
//             },
//           },
//           {
//             project_id: {
//               contains: search.trim(),
//               mode: "insensitive",
//             },
//           },
//         ],
//       };
//     } else {
//       // Combined search logic for both project IDs and names
//       const searchTerm = search.trim();
//       const searchTerms = searchTerm.split(/\s+/);
      
//       // Build comprehensive search conditions
//       const searchConditions = [];
      
//       // 1. Search in project ID fields (for codes like FK_1st_CBSE_SST_FKSST_(Eng)_26-27)
//       searchConditions.push(
//         {
//           project_id: {
//             contains: searchTerm,
//             mode: "insensitive",
//           },
//         },
//         {
//           project_id: {
//             contains: searchTerm,
//             mode: "insensitive",
//           },
//         }
//       );
      
//       // 2. Exact match in project_name (highest priority for names)
//       searchConditions.push({
//         project_name: {
//           equals: searchTerm,
//           mode: "insensitive",
//         },
//       });
      
//       // 3. Contains search in project_name
//       searchConditions.push({
//         project_name: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       });
      
//       // 4. Multi-term search logic
//       if (searchTerms.length === 1) {
//         // Single term - already covered above
//       } else {
//         // Multiple terms - all terms must be present in project_name (AND logic)
//         searchConditions.push({
//           AND: searchTerms.map(term => ({
//             project_name: {
//               contains: term,
//               mode: "insensitive",
//             },
//           })),
//         });
        
//         // Also search for each term individually in project IDs
//         searchTerms.forEach(term => {
//           if (term.length >= 2) { // Only search terms with 2+ characters
//             searchConditions.push(
//               {
//                 project_id: {
//                   contains: term,
//                   mode: "insensitive",
//                 },
//               },
//               {
//                 project_id: {
//                   contains: term,
//                   mode: "insensitive",
//                 },
//               }
//             );
//           }
//         });
//       }
      
//       // Combine all conditions with OR
//       where = {
//         OR: searchConditions,
//       };
//     }

//     console.log("Search query:", search);
//     console.log("Where clause:", JSON.stringify(where, null, 2));

//     const projects = await prisma.ProjectRecords.findMany({
//       where,
//       orderBy: { project_name: "asc" },
//       take: 50, // limit results
//     });
    
//     console.log(`Found ${projects.length} projects matching "${search}"`);
    
//     // Enhanced sorting for relevance
//     const sortedProjects = projects.sort((a, b) => {
//       const searchLower = search.toLowerCase();
//       const aName = (a.project_name || "").toLowerCase();
//       const bName = (b.project_name || "").toLowerCase();
//       const aId = (a.project_id || a.project_id || "").toLowerCase();
//       const bId = (b.project_id || b.project_id || "").toLowerCase();
      
//       // 1. Exact match in project_name gets highest priority
//       if (aName === searchLower && bName !== searchLower) return -1;
//       if (bName === searchLower && aName !== searchLower) return 1;
      
//       // 2. Exact match in project_id gets second priority
//       if (aId === searchLower && bId !== searchLower) return -1;
//       if (bId === searchLower && aId !== searchLower) return 1;
      
//       // 3. Contains in project_id gets third priority (for SST, CBSE, etc.)
//       if (aId.includes(searchLower) && !bId.includes(searchLower)) return -1;
//       if (bId.includes(searchLower) && !aId.includes(searchLower)) return 1;
      
//       // 4. Project_name starts with search term
//       if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
//       if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1;
      
//       // 5. Contains in project_name
//       if (aName.includes(searchLower) && !bName.includes(searchLower)) return -1;
//       if (bName.includes(searchLower) && !aName.includes(searchLower)) return 1;
      
//       // 6. Default alphabetical sort
//       return aName.localeCompare(bName);
//     });
    
//     res.json({ success: true, projects: sortedProjects });
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
    const search = req.query.q || "";
    const by = req.query.by || "name";

    let where = {};

    if (search.trim() === "") {
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
        ],
      };
    } else {
      // Split search into individual terms
      const searchTerm = search.trim();
      const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);
      
      console.log("Search terms:", searchTerms);
      
      // Build search conditions
      const searchConditions = [];
      
      // 1. Each term must appear somewhere in project_id (order-independent)
      if (searchTerms.length > 0) {
        searchConditions.push({
          AND: searchTerms.map(term => ({
            project_id: {
              contains: term,
              mode: "insensitive",
            },
          })),
        });
      }
      
      // 2. Each term must appear somewhere in project_name (order-independent)
      if (searchTerms.length > 0) {
        searchConditions.push({
          AND: searchTerms.map(term => ({
            project_name: {
              contains: term,
              mode: "insensitive",
            },
          })),
        });
      }
      
      // 3. Full search term in project_id
      searchConditions.push({
        project_id: {
          contains: searchTerm,
          mode: "insensitive",
        },
      });
      
      // 4. Full search term in project_name
      searchConditions.push({
        project_name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      });
      
      where = {
        OR: searchConditions,
      };
    }

    console.log("Search query:", search);
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const projects = await prisma.ProjectRecords.findMany({
      where,
      orderBy: { project_name: "asc" },
      take: 100,
    });
    
    console.log(`Found ${projects.length} projects matching "${search}"`);
    
    // Enhanced relevance-based sorting
    const searchLower = search.toLowerCase();
    const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
    
    const sortedProjects = projects.sort((a, b) => {
      const aId = (a.project_id || "").toLowerCase();
      const bId = (b.project_id || "").toLowerCase();
      const aName = (a.project_name || "").toLowerCase();
      const bName = (b.project_name || "").toLowerCase();
      
      // Calculate match scores for each project
      const aScore = calculateMatchScore(aId, aName, searchTerms, searchLower);
      const bScore = calculateMatchScore(bId, bName, searchTerms, searchLower);
      
      // Higher score = better match = comes first
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // If scores are equal, sort alphabetically
      return aName.localeCompare(bName);
    });
    
    res.json({ success: true, projects: sortedProjects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function to calculate match relevance score
function calculateMatchScore(projectId, projectName, searchTerms, fullSearchTerm) {
  let score = 0;
  
  // Score 1000: All search terms match in project_id in order
  const idWithoutParens = projectId.replace(/[()]/g, '');
  const idParts = idWithoutParens.split('_');
  if (allTermsMatchInOrder(idParts, searchTerms)) {
    score += 1000;
  }
  
  // Score 800: All search terms match in project_id (any order)
  const allTermsInId = searchTerms.every(term => projectId.includes(term));
  if (allTermsInId) {
    score += 800;
  }
  
  // Score 500: Project_id starts with first search term
  if (searchTerms.length > 0 && projectId.startsWith(searchTerms[0])) {
    score += 500;
  }
  
  // Score 300: All search terms appear in project_name
  const allTermsInName = searchTerms.every(term => projectName.includes(term));
  if (allTermsInName) {
    score += 300;
  }
  
  // Score 200: Exact match of full search term in project_id
  if (projectId.includes(fullSearchTerm)) {
    score += 200;
  }
  
  // Score 100: Each matching term adds points
  searchTerms.forEach(term => {
    if (projectId.includes(term)) {
      score += 100;
    }
    if (projectName.includes(term)) {
      score += 50;
    }
  });
  
  // Bonus: Match density (percentage of search terms matched)
  const matchedTerms = searchTerms.filter(term => 
    projectId.includes(term) || projectName.includes(term)
  ).length;
  score += (matchedTerms / searchTerms.length) * 150;
  
  return score;
}

// Helper function to check if all terms match in order within id parts
function allTermsMatchInOrder(idParts, searchTerms) {
  let termIndex = 0;
  for (let i = 0; i < idParts.length && termIndex < searchTerms.length; i++) {
    if (idParts[i].includes(searchTerms[termIndex])) {
      termIndex++;
    }
  }
  return termIndex === searchTerms.length;
}

module.exports = { getProjects };
