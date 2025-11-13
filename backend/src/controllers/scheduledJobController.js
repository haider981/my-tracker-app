const prisma = require("../config/prisma");

function getUTCDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

exports.autoSubmitWorklogsAndAssignLeave = async () => {
  try {
    console.log("Starting auto-submit worklogs and leave assignment job...");

    // Get today's date (no time portion)
    const today = getUTCDateOnly();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Get all users from the database
    const allUsers = await prisma.users.findMany({
      where: {
        team: {
            in: ["Editorial_Maths", "Editorial_Science", "Editorial_SST","Editorial_English","DTP_Raj","CSMA_Maths","CSMA_Science","CSMA_Intern"]
          }
      },
      select: {
        email: true,
        name: true,
        team: true,
        role: true
      }
    });

    if (allUsers.length === 0) {
      console.log("No users found in database");
      return { success: true, message: "No users found", processed: 0, submitted: 0, leaveAssigned: 0 };
    }

    console.log(`Found ${allUsers.length} users in database`);

    // Get all employees who already have entries in MasterDatabase for today
    const usersWithMasterEntriesToday = await prisma.masterDatabase.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        name: true
      },
      distinct: ['name']
    });

    const usersWithMasterEntriesSet = new Set(
      usersWithMasterEntriesToday.map(entry => entry.name.toLowerCase())
    );

    console.log(`Found ${usersWithMasterEntriesSet.size} users who already have entries in MasterDatabase for today`);

    // Get all entries from TODAY'S WORKLOG table
    const todaysWorklogEntries = await prisma.todaysWorklog.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    console.log(`Found ${todaysWorklogEntries.length} entries in today's worklog table`);

    // Create a map of users with today's worklog entries
    const usersWithTodaysWorklog = new Map();
    todaysWorklogEntries.forEach(entry => {
      const userName = entry.name.toLowerCase();
      if (!usersWithTodaysWorklog.has(userName)) {
        usersWithTodaysWorklog.set(userName, []);
      }
      usersWithTodaysWorklog.get(userName).push(entry);
    });

    let totalSubmitted = 0;
    let totalLeaveAssigned = 0;
    const processedUsers = [];

    // Process each user
    for (const user of allUsers) {
      const userNameLower = user.name.toLowerCase();
      
      const userTodaysEntries = usersWithTodaysWorklog.get(userNameLower) || [];
      const hasAlreadySubmittedToday = usersWithMasterEntriesSet.has(userNameLower);

      if (userTodaysEntries.length === 0) {
        // No pending entries in TodaysWorklog
        if (hasAlreadySubmittedToday) {
          // User already has entries in MasterDatabase and no pending entries
          console.log(`${user.name} - already has entries in MasterDatabase and no pending entries in TodaysWorklog`);
          continue;
        } else {
          // No data found anywhere - push leave of 7.5 hours
          console.log(`No worklog entries found for ${user.name} - assigning full day leave`);
          
          const leaveEntry = {
            date: today,
            work_mode: "Leave",
            project_name: "",
            task_name: "",
            book_element: "",
            chapter_number: "",
            hours_spent: 7.5,
            number_of_units: 0,
            unit_type: "general",
            status: "",
            due_on: today,
            details: "Auto-assigned leave - no worklog submitted",
            audit_status: "Pending",
            name: user.name,
            team: user.team || "",
            created_at: new Date(),
            submitted_at: new Date()
          };

          await prisma.masterDatabase.create({ data: leaveEntry });
          totalLeaveAssigned++;
          processedUsers.push({ name: user.name, action: "leave_assigned", hours: 7.5 });
        }
      } else {
        // Found pending entries in TodaysWorklog - auto submit that data
        if (hasAlreadySubmittedToday) {
          console.log(`Found ${userTodaysEntries.length} additional worklog entries for ${user.name} - auto submitting (user already has some entries in MasterDatabase)`);
        } else {
          console.log(`Found ${userTodaysEntries.length} worklog entries for ${user.name} - auto submitting`);
        }

        const entriesToSubmit = [];
        let hasHalfDay = false;

        // Process each entry for this user
        for (const entry of userTodaysEntries) {
          const masterEntry = {
            date: today,
            work_mode: entry.work_mode,
            project_name: entry.project_name || "",
            task_name: entry.task_name || "",
            book_element: entry.book_element || "",
            chapter_number: entry.chapter_number || "",
            hours_spent: Number(entry.hours_spent) || 0,
            number_of_units: Number(entry.number_of_units) || 0,
            unit_type: entry.unit_type || "general",
            status: entry.status || "",
            due_on: entry.due_on ? new Date(entry.due_on) : today,
            details: entry.details || "",
            audit_status: "Pending",
            name: user.name,
            team: user.team || "",
            created_at: entry.created_at || new Date(), 
            submitted_at: new Date()
          };

          entriesToSubmit.push(masterEntry);

          // Check if any entry has Half Day work mode
          if (entry.work_mode === "Half Day") {
            hasHalfDay = true;
          }
        }

        // If Half Day found, add additional 3.75hrs leave entry
        if (hasHalfDay) {
          console.log(`Half Day entry found for ${user.name} - adding 3.75hrs leave entry`);
          const additionalLeaveEntry = {
            date: today,
            work_mode: "Leave",
            project_name: "",
            task_name: "",
            book_element: "",
            chapter_number: "",
            hours_spent: 3.75,
            number_of_units: 0,
            unit_type: "general",
            status: "",
            due_on: today,
            details: "Auto-assigned partial leave for Half Day",
            audit_status: "Pending",
            name: user.name,
            team: user.team || "",
            created_at: new Date(),     
            submitted_at: new Date()     
          };
          entriesToSubmit.push(additionalLeaveEntry);
        }

        // Submit all entries for this user
        try {
          await prisma.masterDatabase.createMany({
            data: entriesToSubmit,
            skipDuplicates: true
          });
          
          // Clear today's worklog entries after successful submission
          await prisma.todaysWorklog.deleteMany({
            where: {
              name: { equals: user.name, mode: "insensitive" },
              date: today,
            }
          });
          
          totalSubmitted += entriesToSubmit.length;
          processedUsers.push({ 
            name: user.name, 
            action: hasAlreadySubmittedToday ? "additional_entries_submitted" : (hasHalfDay ? "submitted_with_partial_leave" : "submitted"), 
            entriesCount: entriesToSubmit.length 
          });

        } catch (createError) {
          console.error(`Failed to submit entries for ${user.name}:`, createError);
          
          // Fallback: try individual creates
          let individualSubmitted = 0;
          for (const entry of entriesToSubmit) {
            try {
              await prisma.masterDatabase.create({ data: entry });
              individualSubmitted++;
            } catch (individualError) {
              console.error(`Individual create failed for ${user.name}:`, individualError.message);
            }
          }
          
          if (individualSubmitted > 0) {
            // Clear today's worklog entries after successful individual submissions
            await prisma.todaysWorklog.deleteMany({
              where: {
                name: { equals: user.name, mode: "insensitive" },
                date: today,
              }
            });
            
            totalSubmitted += individualSubmitted;
            processedUsers.push({ 
              name: user.name, 
              action: hasAlreadySubmittedToday ? "additional_entries_submitted" : (hasHalfDay ? "submitted_with_partial_leave" : "submitted"), 
              entriesCount: individualSubmitted 
            });
          }
        }
      }
    }

    console.log(`Auto-submit and leave assignment completed:`);
    console.log(`- Total entries submitted: ${totalSubmitted}`);
    console.log(`- Total leave entries assigned: ${totalLeaveAssigned}`);

    return {
      success: true,
      message: `Processed ${allUsers.length} employees: ${totalSubmitted} entries submitted, ${totalLeaveAssigned} leave entries assigned`,
      processed: allUsers.length,
      submitted: totalSubmitted,
      leaveAssigned: totalLeaveAssigned,
      processedUsers
    };

  } catch (error) {
    console.error("Auto-submit worklogs and leave assignment job failed:", error);
    return {
      success: false,
      message: "Auto-submit and leave assignment failed",
      error: error.message
    };
  }
};

// Keep the old function for backward compatibility (but mark as deprecated)
exports.autoAssignLeaveForAllEmployees = async () => {
  console.warn("⚠️  autoAssignLeaveForAllEmployees is deprecated. Use autoSubmitWorklogsAndAssignLeave instead.");
  return exports.autoSubmitWorklogsAndAssignLeave();
};


exports.manualTriggerAutoSubmitAndLeave = async (req, res) => {
  try {
    // Optional: Add admin role check here
    // if (req.user?.role?.toLowerCase() !== 'admin') {
    //   return res.status(403).json({ success: false, message: "Admin access required" });
    // }

    const result = await exports.autoSubmitWorklogsAndAssignLeave();
    
    return res.json(result);
  } catch (error) {
    console.error("Manual auto-submit and leave trigger failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to trigger auto-submit worklogs and leave assignment",
      error: error.message
    });
  }
};

// Keep the old manual trigger for backward compatibility
exports.manualTriggerAutoLeave = async (req, res) => {
  console.warn("⚠️  manualTriggerAutoLeave is deprecated. Use manualTriggerAutoSubmitAndLeave instead.");
  return exports.manualTriggerAutoSubmitAndLeave(req, res);
};

// const prisma = require("../config/prisma");

// function getUTCDateOnly() {
//   const now = new Date();
//   return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
// }

// exports.autoSubmitWorklogsAndAssignLeave = async () => {
//   try {
//     console.log("Starting auto-submit worklogs and leave assignment job...");

//     const today = getUTCDateOnly();
//     const tomorrow = new Date(today);
//     tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

//     const allUsers = await prisma.users.findMany({
//       where: {
//         team: {
//           in: ["Editorial_Maths", "Editorial_Science", "Editorial_SST","Editorial_English","DTP_Raj","CSMA_Maths","CSMA_Science","CSMA_Intern"]
//         }
//       },
//       select: {
//         email: true,
//         name: true,
//         team: true,
//         role: true
//       }
//     });

//     if (allUsers.length === 0) {
//       console.log("No users found in database");
//       return { success: true, message: "No users found", processed: 0, submitted: 0, leaveAssigned: 0 };
//     }

//     console.log(`Found ${allUsers.length} users in database`);

//     // CRITICAL FIX: Fetch MasterDatabase entries FRESH at the start
//     // This ensures we always have the most up-to-date state
//     const usersWithMasterEntriesToday = await prisma.masterDatabase.findMany({
//       where: {
//         date: {
//           gte: today,
//           lt: tomorrow
//         }
//       },
//       select: {
//         name: true
//       },
//       distinct: ['name']
//     });

//     const usersWithMasterEntriesSet = new Set(
//       usersWithMasterEntriesToday.map(entry => entry.name.toLowerCase())
//     );

//     console.log(`Found ${usersWithMasterEntriesSet.size} users who already have entries in MasterDatabase for today`);

//     // CRITICAL FIX: Fetch TodaysWorklog entries FRESH
//     const todaysWorklogEntries = await prisma.todaysWorklog.findMany({
//       where: {
//         date: {
//           gte: today,
//           lt: tomorrow
//         }
//       }
//     });

//     console.log(`Found ${todaysWorklogEntries.length} entries in today's worklog table`);

//     const usersWithTodaysWorklog = new Map();
//     todaysWorklogEntries.forEach(entry => {
//       const userName = entry.name.toLowerCase();
//       if (!usersWithTodaysWorklog.has(userName)) {
//         usersWithTodaysWorklog.set(userName, []);
//       }
//       usersWithTodaysWorklog.get(userName).push(entry);
//     });

//     let totalSubmitted = 0;
//     let totalLeaveAssigned = 0;
//     const processedUsers = [];

//     for (const user of allUsers) {
//       const userNameLower = user.name.toLowerCase();
      
//       const userTodaysEntries = usersWithTodaysWorklog.get(userNameLower) || [];
//       const hasAlreadySubmittedToday = usersWithMasterEntriesSet.has(userNameLower);

//       // CRITICAL FIX: Skip if user has NO pending entries AND already has MasterDatabase entries
//       if (userTodaysEntries.length === 0 && hasAlreadySubmittedToday) {
//         console.log(`${user.name} - already has entries in MasterDatabase and no pending entries in TodaysWorklog`);
//         continue;
//       }

//       // If no entries anywhere, assign leave
//       if (userTodaysEntries.length === 0 && !hasAlreadySubmittedToday) {
//         console.log(`No worklog entries found for ${user.name} - assigning full day leave`);
        
//         const leaveEntry = {
//           date: today,
//           work_mode: "Leave",
//           project_name: "",
//           task_name: "",
//           book_element: "",
//           chapter_number: "",
//           hours_spent: 7.5,
//           number_of_units: 0,
//           unit_type: "general",
//           status: "",
//           due_on: today,
//           details: "Auto-assigned leave - no worklog submitted",
//           audit_status: "Pending",
//           name: user.name,
//           team: user.team || "",
//           created_at: new Date(),
//           submitted_at: new Date()
//         };

//         await prisma.masterDatabase.create({ data: leaveEntry });
//         totalLeaveAssigned++;
//         processedUsers.push({ name: user.name, action: "leave_assigned", hours: 7.5 });
//         continue;
//       }

//       // If we reach here, we have pending entries to submit
//       if (hasAlreadySubmittedToday) {
//         console.log(`Found ${userTodaysEntries.length} additional worklog entries for ${user.name} - auto submitting (user already has some entries in MasterDatabase)`);
//       } else {
//         console.log(`Found ${userTodaysEntries.length} worklog entries for ${user.name} - auto submitting`);
//       }

//       const entriesToSubmit = [];
//       let hasHalfDay = false;

//       for (const entry of userTodaysEntries) {
//         const masterEntry = {
//           date: today,
//           work_mode: entry.work_mode,
//           project_name: entry.project_name || "",
//           task_name: entry.task_name || "",
//           book_element: entry.book_element || "",
//           chapter_number: entry.chapter_number || "",
//           hours_spent: Number(entry.hours_spent) || 0,
//           number_of_units: Number(entry.number_of_units) || 0,
//           unit_type: entry.unit_type || "general",
//           status: entry.status || "",
//           due_on: entry.due_on ? new Date(entry.due_on) : today,
//           details: entry.details || "",
//           audit_status: "Pending",
//           name: user.name,
//           team: user.team || "",
//           created_at: entry.created_at || new Date(),
//           submitted_at: new Date()
//         };

//         entriesToSubmit.push(masterEntry);

//         if (entry.work_mode === "Half Day") {
//           hasHalfDay = true;
//         }
//       }

//       if (hasHalfDay) {
//         console.log(`Half Day entry found for ${user.name} - adding 3.75hrs leave entry`);
//         const additionalLeaveEntry = {
//           date: today,
//           work_mode: "Leave",
//           project_name: "",
//           task_name: "",
//           book_element: "",
//           chapter_number: "",
//           hours_spent: 3.75,
//           number_of_units: 0,
//           unit_type: "general",
//           status: "",
//           due_on: today,
//           details: "Auto-assigned partial leave for Half Day",
//           audit_status: "Pending",
//           name: user.name,
//           team: user.team || "",
//           created_at: new Date(),
//           submitted_at: new Date()
//         };
//         entriesToSubmit.push(additionalLeaveEntry);
//       }

//       let submittedCount = 0;
      
//       // CRITICAL FIX: Use a transaction to ensure atomicity
//       try {
//         await prisma.$transaction(async (tx) => {
//           // Try createMany first
//           try {
//             const result = await tx.masterDatabase.createMany({
//               data: entriesToSubmit,
//               skipDuplicates: true
//             });
//             submittedCount = result.count;
//           } catch (createManyError) {
//             console.log(`createMany failed for ${user.name}, trying individual creates:`, createManyError.message);
            
//             // Fallback to individual creates within the same transaction
//             for (const entry of entriesToSubmit) {
//               try {
//                 await tx.masterDatabase.create({ data: entry });
//                 submittedCount++;
//               } catch (individualError) {
//                 // Skip duplicate entries silently
//                 if (!individualError.message.includes('Unique constraint')) {
//                   console.error(`Individual create failed for ${user.name}:`, individualError.message);
//                 }
//               }
//             }
//           }

//           // CRITICAL: Clear TodaysWorklog within the same transaction
//           // This ensures atomicity - either both operations succeed or both fail
//           if (submittedCount > 0) {
//             await tx.todaysWorklog.deleteMany({
//               where: {
//                 name: { equals: user.name, mode: "insensitive" },
//                 date: today,
//               }
//             });
//           }
//         });

//         // Only update counters if transaction succeeded
//         if (submittedCount > 0) {
//           totalSubmitted += submittedCount;
//           processedUsers.push({ 
//             name: user.name, 
//             action: hasAlreadySubmittedToday ? "additional_entries_submitted" : "submitted", 
//             entriesCount: submittedCount
//           });
//         }

//       } catch (transactionError) {
//         console.error(`Transaction failed for ${user.name}:`, transactionError.message);
//         // Transaction will automatically rollback, so TodaysWorklog entries remain
//         // They will be retried in the next run
//       }
//     }

//     console.log(`Auto-submit and leave assignment completed:`);
//     console.log(`- Total entries submitted: ${totalSubmitted}`);
//     console.log(`- Total leave entries assigned: ${totalLeaveAssigned}`);

//     return {
//       success: true,
//       message: `Processed ${allUsers.length} employees: ${totalSubmitted} entries submitted, ${totalLeaveAssigned} leave entries assigned`,
//       processed: allUsers.length,
//       submitted: totalSubmitted,
//       leaveAssigned: totalLeaveAssigned,
//       processedUsers
//     };

//   } catch (error) {
//     console.error("Auto-submit worklogs and leave assignment job failed:", error);
//     return {
//       success: false,
//       message: "Auto-submit and leave assignment failed",
//       error: error.message
//     };
//   }
// };

// exports.autoAssignLeaveForAllEmployees = async () => {
//   console.warn("⚠️  autoAssignLeaveForAllEmployees is deprecated. Use autoSubmitWorklogsAndAssignLeave instead.");
//   return exports.autoSubmitWorklogsAndAssignLeave();
// };

// exports.manualTriggerAutoSubmitAndLeave = async (req, res) => {
//   try {
//     const result = await exports.autoSubmitWorklogsAndAssignLeave();
//     return res.json(result);
//   } catch (error) {
//     console.error("Manual auto-submit and leave trigger failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to trigger auto-submit worklogs and leave assignment",
//       error: error.message
//     });
//   }
// };

// exports.manualTriggerAutoLeave = async (req, res) => {
//   console.warn("⚠️  manualTriggerAutoLeave is deprecated. Use manualTriggerAutoSubmitAndLeave instead.");
//   return exports.manualTriggerAutoSubmitAndLeave(req, res);
// };

