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
      const searchTerm = search.trim();
      const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);

      console.log("Search terms:", searchTerms);

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
    console.log("Where clause before status filter:", JSON.stringify(where, null, 2));

    // -------------------------------------------------------------
    // 🔥 ADD STATUS FILTER HERE
    // Only fetch these statuses
    // -------------------------------------------------------------
    where = {
      AND: [
        where,
        {
          audit_status: {
            in: ["Approved", "Added by Admin", "Hide-Request-rejected"],
          },
        },
      ],
    };

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

      const aScore = calculateMatchScore(aId, aName, searchTerms, searchLower);
      const bScore = calculateMatchScore(bId, bName, searchTerms, searchLower);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      return aName.localeCompare(bName);
    });

    // Return approved/admin-added projects from ProjectRecords for search.
    // Recent-project intersection is already handled in frontend using past entries.
    res.json({ success: true, projects: sortedProjects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function to calculate match relevance score
function calculateMatchScore(projectId, projectName, searchTerms, fullSearchTerm) {
  let score = 0;

  const idWithoutParens = projectId.replace(/[()]/g, '');
  const idParts = idWithoutParens.split('_');

  if (allTermsMatchInOrder(idParts, searchTerms)) {
    score += 1000;
  }

  const allTermsInId = searchTerms.every(term => projectId.includes(term));
  if (allTermsInId) {
    score += 800;
  }

  if (searchTerms.length > 0 && projectId.startsWith(searchTerms[0])) {
    score += 500;
  }

  const allTermsInName = searchTerms.every(term => projectName.includes(term));
  if (allTermsInName) {
    score += 300;
  }

  if (projectId.includes(fullSearchTerm)) {
    score += 200;
  }

  searchTerms.forEach(term => {
    if (projectId.includes(term)) score += 100;
    if (projectName.includes(term)) score += 50;
  });

  const matchedTerms = searchTerms.filter(term =>
    projectId.includes(term) || projectName.includes(term)
  ).length;
  score += (matchedTerms / searchTerms.length) * 150;

  return score;
}

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




// const prisma = require("../config/prisma");

// // GET /api/projects?search=query
// const getProjects = async (req, res) => {
//   try {
//     const search = req.query.q || "";
//     const by = req.query.by || "name";

//     let where = {};

//     if (search.trim() === "") {
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
//         ],
//       };
//     } else {
//       const searchTerm = search.trim();
//       const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);

//       console.log("Search terms:", searchTerms);

//       const searchConditions = [];

//       // 1. Each term must appear somewhere in project_id (order-independent)
//       if (searchTerms.length > 0) {
//         searchConditions.push({
//           AND: searchTerms.map(term => ({
//             project_id: {
//               contains: term,
//               mode: "insensitive",
//             },
//           })),
//         });
//       }

//       // 2. Each term must appear somewhere in project_name (order-independent)
//       if (searchTerms.length > 0) {
//         searchConditions.push({
//           AND: searchTerms.map(term => ({
//             project_name: {
//               contains: term,
//               mode: "insensitive",
//             },
//           })),
//         });
//       }

//       // 3. Full search term in project_id
//       searchConditions.push({
//         project_id: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       });

//       // 4. Full search term in project_name
//       searchConditions.push({
//         project_name: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       });

//       where = {
//         OR: searchConditions,
//       };
//     }

//     console.log("Search query:", search);
//     console.log("Where clause before status filter:", JSON.stringify(where, null, 2));

//     // -------------------------------------------------------------
//     // 🔥 ADD STATUS FILTER HERE
//     // Only fetch these statuses
//     // -------------------------------------------------------------
//     where = {
//       AND: [
//         where,
//         {
//           audit_status: {
//             in: ["Approved", "Added by Admin"],
//           },
//         },
//       ],
//     };

//     const projects = await prisma.ProjectRecords.findMany({
//       where,
//       orderBy: { project_name: "asc" },
//       take: 100,
//     });

//     console.log(`Found ${projects.length} projects matching "${search}"`);

//     // Enhanced relevance-based sorting
//     const searchLower = search.toLowerCase();
//     const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);

//     const sortedProjects = projects.sort((a, b) => {
//       const aId = (a.project_id || "").toLowerCase();
//       const bId = (b.project_id || "").toLowerCase();
//       const aName = (a.project_name || "").toLowerCase();
//       const bName = (b.project_name || "").toLowerCase();

//       const aScore = calculateMatchScore(aId, aName, searchTerms, searchLower);
//       const bScore = calculateMatchScore(bId, bName, searchTerms, searchLower);

//       if (aScore !== bScore) {
//         return bScore - aScore;
//       }

//       return aName.localeCompare(bName);
//     });

//     // Return approved/admin-added projects from ProjectRecords for search.
//     // Recent-project intersection is already handled in frontend using past entries.
//     res.json({ success: true, projects: sortedProjects });
//   } catch (err) {
//     console.error("Error fetching projects:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // Helper function to calculate match relevance score
// function calculateMatchScore(projectId, projectName, searchTerms, fullSearchTerm) {
//   let score = 0;

//   const idWithoutParens = projectId.replace(/[()]/g, '');
//   const idParts = idWithoutParens.split('_');

//   if (allTermsMatchInOrder(idParts, searchTerms)) {
//     score += 1000;
//   }

//   const allTermsInId = searchTerms.every(term => projectId.includes(term));
//   if (allTermsInId) {
//     score += 800;
//   }

//   if (searchTerms.length > 0 && projectId.startsWith(searchTerms[0])) {
//     score += 500;
//   }

//   const allTermsInName = searchTerms.every(term => projectName.includes(term));
//   if (allTermsInName) {
//     score += 300;
//   }

//   if (projectId.includes(fullSearchTerm)) {
//     score += 200;
//   }

//   searchTerms.forEach(term => {
//     if (projectId.includes(term)) score += 100;
//     if (projectName.includes(term)) score += 50;
//   });

//   const matchedTerms = searchTerms.filter(term =>
//     projectId.includes(term) || projectName.includes(term)
//   ).length;
//   score += (matchedTerms / searchTerms.length) * 150;

//   return score;
// }

// function allTermsMatchInOrder(idParts, searchTerms) {
//   let termIndex = 0;
//   for (let i = 0; i < idParts.length && termIndex < searchTerms.length; i++) {
//     if (idParts[i].includes(searchTerms[termIndex])) {
//       termIndex++;
//     }
//   }
//   return termIndex === searchTerms.length;
// }

// module.exports = { getProjects };
