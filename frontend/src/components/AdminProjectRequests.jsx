// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";

// import {
//   Check,
//   X,
//   AlertCircle,
//   Clock,
//   CheckCircle,
//   XCircle,
//   ChevronLeft,
//   ChevronRight,
//   Calendar as CalendarIcon,
//   Users as UsersIcon,
//   Filter as FilterIcon,
//   Pencil,
//   ChevronDown,
//   FileText,
//   Eye,
// } from "lucide-react";

// /* =================== CONFIG =================== */
// const API_BASE_URL = import.meta.env?.VITE_API_BASE;

// /* =================== MAIN PAGE =================== */
// export default function AdminProjectRequests() {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [user, setUser] = useState(null);
//   const [modify, setModify] = useState(null);

//  const [pendingProjectCount, setPendingProjectCount] = useState(0);

//   /* ===== Auth ===== */
//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       navigate("/");
//       return;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       setUser({
//         name: decoded.name,
//         email: decoded.email,
//         role: decoded.role,
//         picture:
//           decoded.picture ||
//           `https://ui-avatars.com/api/?name=${encodeURIComponent(
//             decoded.name
//           )}&background=random&color=fff`,
//       });
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
//     } catch (e) {
//       console.error("Invalid token:", e);
//       localStorage.removeItem("authToken");
//       navigate("/");
//     }
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     delete axios.defaults.headers.common.Authorization;
//     navigate("/");
//   };

//   /* ===== Project Requests STATE/LOGIC ===== */

//   // Data
//   const [projectsByDate, setProjectsByDate] = useState({});
//   const [spocs, setSpocs] = useState([]);

//   // Status
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [updating, setUpdating] = useState({});
//   const [bulkUpdating, setBulkUpdating] = useState({});

//   // Filters: SPOC users
//   const [selectedSpocs, setSelectedSpocs] = useState([]);
//   const [showSpocDropdown, setShowSpocDropdown] = useState(false);
//   const spocRef = useOutclick(() => setShowSpocDropdown(false));

//   // Filters: dates
//   const todayISO = stripToISO(new Date());
//   const [datePopoverOpen, setDatePopoverOpen] = useState(false);
//   const [rangeMode, setRangeMode] = useState(true);
//   const [tempStart, setTempStart] = useState(isoNDaysAgo(30));
//   const [tempEnd, setTempEnd] = useState(todayISO);
//   const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
//   const [startISO, setStartISO] = useState(isoNDaysAgo(30));
//   const [endISO, setEndISO] = useState(todayISO);
//   const popRef = useOutclick(() => setDatePopoverOpen(false));

//   // Filters: audit statuses
//   const ALL_STATUSES = [
//     "In Review",
//     "Approved",
//     "Rejected",
//   ];
//   const [showStatusDropdown, setShowStatusDropdown] = useState(false);
//   const statusRef = useOutclick(() => setShowStatusDropdown(false));
//   const [selectedAuditStatuses, setSelectedAuditStatuses] = useState([...ALL_STATUSES]);

//   // Edit mode for "Change to …" actions
//   const [modifying, setModifying] = useState(null);

//   /* --- Fetch SPOCs --- */
//   useEffect(() => {
//     if (!user) return;
//     const token = localStorage.getItem("authToken");
//     fetch(`${API_BASE_URL}/admin-projects/spocs`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
//       .then((data) => setSpocs(data.spocs || []))
//       .catch((err) => console.error("Failed to fetch SPOCs:", err.message));
//   }, [user]);

//   /* --- Fetch projects (on filter change) --- */
//   useEffect(() => {
//     if (!user) return;
//     fetchProjects();
//     fetchPendingProjectCount();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, startISO, endISO, selectedSpocs, selectedAuditStatuses]);

//   const fetchProjects = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = localStorage.getItem("authToken");

//       const res = await fetch(`${API_BASE_URL}/admin-projects/requests`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           startDate: startISO,
//           endDate: endISO,
//           spocs: selectedSpocs.length > 0 ? selectedSpocs : undefined,
//           auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());
//       const data = await res.json();
//       setProjectsByDate(data.projectsByDate || {});
//     } catch (err) {
//       console.error(err);
//       setError(`Failed to fetch projects: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPendingProjectCount = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(`${API_BASE_URL}/admin-projects/pending-count`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error(await res.text());
//       const data = await res.json();
//       setPendingProjectCount(data.count || 0);
//     } catch (err) {
//       console.error("Failed to fetch pending project count:", err);
//     }
//   };


//   /* --- Derived helpers --- */
//   const sortedDateKeys = useMemo(
//     () => Object.keys(projectsByDate).sort((a, b) => new Date(b) - new Date(a)),
//     [projectsByDate]
//   );


//   const groupBySpoc = (items) => {
//     const bySpoc = {};
//     for (const row of items) {
//       if (!bySpoc[row.spocName]) bySpoc[row.spocName] = [];
//       bySpoc[row.spocName].push(row);
//     }
//     return Object.fromEntries(
//       Object.keys(bySpoc)
//         .sort((a, b) => a.localeCompare(b))
//         .map((k) => [k, bySpoc[k]])
//     );
//   };

//   const { inReviewCount, approvedCount, rejectedCount } = useMemo(() => {
//     let inReview = 0;
//     let approved = 0;
//     let rejected = 0;
//     for (const dateKey of Object.keys(projectsByDate)) {
//       for (const row of projectsByDate[dateKey] || []) {
//         if (row.auditStatus === "In Review") inReview++;
//         if (row.auditStatus === "Approved") approved++;
//         if (row.auditStatus === "Rejected") rejected++;
//       }
//     }
//     return { inReviewCount: inReview, approvedCount: approved, rejectedCount: rejected };
//   }, [projectsByDate]);

//   const rowClassForAudit = (status) => {
//     if (status === "Approved") return "bg-emerald-50/70";
//     if (status === "Rejected") return "bg-rose-50/70";
//     if (status === "In Review") return "bg-yellow-50";
//     return "";
//   };

//   const AuditBadge = ({ status }) => {
//     if (status === "Approved")
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
//           <CheckCircle className="w-4 h-4" /> Approved
//         </span>
//       );
//     if (status === "Rejected")
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-medium">
//           <XCircle className="w-4 h-4" /> Rejected
//         </span>
//       );
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
//         <Clock className="w-4 h-4" /> In Review
//       </span>
//     );
//   };

//   /* --- Updates (single/bulk) --- */
//   const mutateLocalRow = (dateKey, projectId, auditStatus) => {
//     setProjectsByDate((prev) => {
//       const next = { ...prev };
//       if (!next[dateKey]) return next;
//       next[dateKey] = next[dateKey].map((r) =>
//         r.project_id === projectId ? { ...r, auditStatus } : r
//       );
//       return next;
//     });
//   };


//   // const updateProjectStatus = async (projectId, status, dateKey, adminComments = "") => {
//   //   try {
//   //     setUpdating((p) => ({ ...p, [projectId]: true }));
//   //     const token = localStorage.getItem("authToken");

//   //     const res = await fetch(`${API_BASE_URL}/admin-projects/update-status`, {
//   //       method: "PUT",
//   //       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         projectId,
//   //         auditStatus: status,
//   //         adminComments: adminComments || undefined
//   //       }),
//   //     });

//   //     if (!res.ok) throw new Error(await res.text());
//   //     await res.json();
//   //     mutateLocalRow(dateKey, projectId, status);
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert(`Failed to ${status.toLowerCase()} project. Please try again.`);
//   //   } finally {
//   //     setUpdating((p) => ({ ...p, [projectId]: false }));
//   //   }
//   // };

//   const updateProjectStatus = async (projectId, status, dateKey, adminComments = "") => {
//   try {
//     setUpdating((p) => ({ ...p, [projectId]: true }));
//     const token = localStorage.getItem("authToken");

//     const res = await fetch(`${API_BASE_URL}/admin-projects/update-status`, {
//       method: "PUT",
//       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//       body: JSON.stringify({
//         projectId,
//         auditStatus: status,
//         adminComments: adminComments || undefined
//       }),
//     });

//     if (!res.ok) throw new Error(await res.text());
//     await res.json();
//     mutateLocalRow(dateKey, projectId, status);
    
//     // ✅ Decrease pending count when project is approved or rejected
//     if (status === "Approved" || status === "Rejected") {
//       setPendingProjectCount(prev => Math.max(0, prev - 1));
//     }
    
//   } catch (err) {
//     console.error(err);
//     alert(`Failed to ${status.toLowerCase()} project. Please try again.`);
//   } finally {
//     setUpdating((p) => ({ ...p, [projectId]: false }));
//   }
// };

//   const handleReject = (id, dateKey) => {
//     const confirmed = window.confirm("Are you sure you want to reject this request?");
//     if (confirmed) {
//       updateProjectStatus(id, "Rejected", dateKey);
//     }
//   };

//   const handleApprove = (id, dateKey) => {
//     updateProjectStatus(id, "Approved", dateKey);
//   };


//   // const handleApproveAll = async (dateKey, spocName) => {
//   //   const key = `${dateKey}|${spocName}`;
//   //   try {
//   //     setBulkUpdating((p) => ({ ...p, [key]: true }));
//   //     const token = localStorage.getItem("authToken");
//   //     const rows = (projectsByDate[dateKey] || []).filter(
//   //       (r) => r.spocName === spocName && r.auditStatus === "In Review"
//   //     );
//   //     const ids = rows.map((r) => r.project_id);
//   //     if (ids.length === 0) return;

//   //     const res = await fetch(`${API_BASE_URL}/admin-projects/bulk-update-status`, {
//   //       method: "PUT",
//   //       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         projectIds: ids,
//   //         auditStatus: "Approved",
//   //         adminComments: `Bulk approved by admin on ${new Date().toISOString().split('T')[0]}`
//   //       }),
//   //     });

//   //     if (!res.ok) throw new Error(await res.text());
//   //     await res.json();

//   //     setProjectsByDate((prev) => {
//   //       const next = { ...prev };
//   //       next[dateKey] = next[dateKey].map((row) =>
//   //         row.spocName === spocName && row.auditStatus === "In Review"
//   //           ? { ...row, auditStatus: "Approved" }
//   //           : row
//   //       );
//   //       return next;
//   //     });
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert("Approve All failed. Please try again.");
//   //   } finally {
//   //     setBulkUpdating((p) => ({ ...p, [key]: false }));
//   //   }
//   // };

//   const handleApproveAll = async (dateKey, spocName) => {
//   const key = `${dateKey}|${spocName}`;
//   try {
//     setBulkUpdating((p) => ({ ...p, [key]: true }));
//     const token = localStorage.getItem("authToken");
//     const rows = (projectsByDate[dateKey] || []).filter(
//       (r) => r.spocName === spocName && r.auditStatus === "In Review"
//     );
//     const ids = rows.map((r) => r.project_id);
//     if (ids.length === 0) return;

//     const res = await fetch(`${API_BASE_URL}/admin-projects/bulk-update-status`, {
//       method: "PUT",
//       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//       body: JSON.stringify({
//         projectIds: ids,
//         auditStatus: "Approved",
//         adminComments: `Bulk approved by admin on ${new Date().toISOString().split('T')[0]}`
//       }),
//     });

//     if (!res.ok) throw new Error(await res.text());
//     await res.json();

//     setProjectsByDate((prev) => {
//       const next = { ...prev };
//       next[dateKey] = next[dateKey].map((row) =>
//         row.spocName === spocName && row.auditStatus === "In Review"
//           ? { ...row, auditStatus: "Approved" }
//           : row
//       );
//       return next;
//     });
    
//     // ✅ Decrease pending count by number of approved projects
//     setPendingProjectCount(prev => Math.max(0, prev - ids.length));
    
//   } catch (err) {
//     console.error(err);
//     alert("Approve All failed. Please try again.");
//   } finally {
//     setBulkUpdating((p) => ({ ...p, [key]: false }));
//   }
// };

  

//   /* --- Date filter helpers --- */
//   const applyTempDate = () => {
//     if (rangeMode) {
//       const s = tempStart <= tempEnd ? tempStart : tempEnd;
//       const e = tempEnd >= tempStart ? tempEnd : tempStart;
//       setStartISO(s);
//       setEndISO(e);
//     } else {
//       setStartISO(tempEnd);
//       setEndISO(tempEnd);
//     }
//     setDatePopoverOpen(false);
//   };

//   const quickApply = (days) => {
//     setRangeMode(true);
//     const s = isoNDaysAgo(days - 1);
//     setTempStart(s);
//     setTempEnd(todayISO);
//     setActiveMonth(toMonthKey(new Date(todayISO)));
//     setStartISO(s);
//     setEndISO(todayISO);
//   };

//   const labelForFilter = () =>
//     startISO === endISO ? formatISOToHuman(startISO) : `${formatISOToHuman(startISO)} – ${formatISOToHuman(endISO)}`;

//   /* --- Render guards --- */
//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-100">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-100">
//       {/* Navbar */}
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//         <div className="max-w-full mx-auto px-4 sm:px-6">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 lg:hidden"
//               >
//                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               </button>
//               <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
//                 Admin Dashboard <span className="hidden sm:inline">- Project Requests</span>
//               </h1>
//             </div>

//             <div className="hidden md:flex items-center space-x-4">
//               <div className="flex items-center space-x-3">
//                 <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-slate-600" />
//                 <div className="text-right">
//                   <div className="text-sm font-medium">{user.name}</div>
//                   <div className="text-xs text-slate-300">{user.email}</div>
//                 </div>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
//               >
//                 Logout
//               </button>
//             </div>

//             <div className="md:hidden">
//               <button
//                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                 className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
//               >
//                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>
//       {/* Mobile Menu Dropdown - ADD THIS SECTION */}
//       {mobileMenuOpen && (
//         <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-800 text-white shadow-xl">
//           <div className="px-4 py-4 space-y-3">
//             <div className="flex items-center space-x-3 pb-3 border-b border-slate-600">
//               <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-slate-600" />
//               <div>
//                 <div className="text-sm font-medium">{user.name}</div>
//                 <div className="text-xs text-slate-300">{user.email}</div>
//               </div>
//             </div>
//             <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
//               Logout
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Sidebar */}
//       {sidebarOpen && (
//   <div className="fixed inset-0 z-40 lg:hidden">
//     <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//     <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
//       <SidebarLinks navigate={navigate} setSidebarOpen={setSidebarOpen} pendingProjectCount={pendingProjectCount} />
//     </aside>
//   </div>
// )}
// <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//   <SidebarLinks navigate={navigate} pendingProjectCount={pendingProjectCount} />
// </aside>

//       {/* Main Content */}
//       <main className="lg:ml-72 pt-20 p-6">
//         <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-full overflow-hidden">

//           {/* Filters */}
//           <div className="rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
//             <div className="flex items-center gap-2 mb-3 lg:mb-4">
//               <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
//               <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters</h3>
//             </div>

//             <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">

//               {/* Date Picker */}
//               <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date(s)</label>
//                 <button
//                   onClick={() => setDatePopoverOpen(!datePopoverOpen)}
//                   className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex items-center gap-2 min-w-0 flex-1">
//                     <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
//                     <span className="text-xs lg:text-sm font-medium truncate">{labelForFilter()}</span>
//                   </span>
//                   <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{rangeMode ? "Range" : "Single"}</span>
//                 </button>

//                 {datePopoverOpen && (
//                   <div className="absolute z-50 mt-2 w-[340px] right-0 lg:right-auto lg:left-0 rounded-xl border bg-white shadow-xl">
//                     <div className="px-3 py-2 border-b flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => setRangeMode(false)}
//                           className={`text-xs px-2 py-1 rounded ${!rangeMode ? "bg-slate-900 text-white" : "bg-slate-100"}`}
//                         >
//                           Single Day
//                         </button>
//                         <button
//                           onClick={() => setRangeMode(true)}
//                           className={`text-xs px-2 py-1 rounded ${rangeMode ? "bg-slate-900 text-white" : "bg-slate-100"}`}
//                         >
//                           Range
//                         </button>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <button
//                           onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), -1)))}
//                           className="p-1 hover:bg-slate-100 rounded"
//                           aria-label="Prev month"
//                         >
//                           <ChevronLeft className="w-4 h-4" />
//                         </button>
//                         <div className="text-xs font-medium w-[130px] text-center">{formatMonthKey(activeMonth)}</div>
//                         <button
//                           onClick={() => {
//                             const nextM = addMonths(parseMonthKey(activeMonth), 1);
//                             if (isMonthFullyInFuture(nextM)) return;
//                             setActiveMonth(toMonthKey(nextM));
//                           }}
//                           className="p-1 hover:bg-slate-100 rounded disabled:opacity-40"
//                           aria-label="Next month"
//                           disabled={isMonthFullyInFuture(addMonths(parseMonthKey(activeMonth), 1))}
//                         >
//                           <ChevronRight className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </div>

//                     <CalendarGrid
//                       monthKey={activeMonth}
//                       rangeMode={rangeMode}
//                       tempStart={tempStart}
//                       tempEnd={tempEnd}
//                       onPick={(iso) => {
//                         if (!rangeMode) {
//                           if (iso > todayISO) return;
//                           setTempEnd(iso);
//                           return;
//                         }
//                         if (iso > todayISO) return;
//                         if (!tempStart || (tempStart && tempEnd && tempStart <= tempEnd)) {
//                           setTempStart(iso);
//                           setTempEnd(iso);
//                         } else {
//                           if (iso < tempStart) setTempStart(iso);
//                           else setTempEnd(iso);
//                         }
//                       }}
//                     />

//                     <div className="px-3 py-2 border-t flex flex-wrap items-center gap-2">
//                       <button onClick={() => quickApply(7)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 7 Days</button>
//                       <button onClick={() => quickApply(15)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 15 Days</button>
//                       <button onClick={() => quickApply(30)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 30 Days</button>
//                       <button
//                         onClick={() => {
//                           setRangeMode(false);
//                           setTempEnd(todayISO);
//                           setActiveMonth(toMonthKey(new Date(todayISO)));
//                           setStartISO(todayISO);
//                           setEndISO(todayISO);
//                           setDatePopoverOpen(false);
//                         }}
//                         className="text-xs px-2 py-1 rounded bg-slate-900 text-white ml-auto"
//                       >
//                         Today
//                       </button>
//                       <button onClick={applyTempDate} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white">Apply</button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* SPOCs multi-select */}
//               <div ref={spocRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">SPOCs</label>
//                 <button
//                   onClick={() => setShowSpocDropdown(!showSpocDropdown)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedSpocs.length === 0 ? (
//                       <span className="text-slate-600">All SPOCs</span>
//                     ) : (
//                       selectedSpocs.map((name) => (
//                         <span key={name} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                           {name}
//                         </span>
//                       ))
//                     )}
//                   </span>
//                   <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showSpocDropdown ? "rotate-180" : "rotate-0"}`} />
//                 </button>

//                 {showSpocDropdown && (
//                   <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                     <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center gap-2">
//                       <UsersIcon className="w-3.5 h-3.5" />
//                       Select SPOCs
//                     </div>
//                     {spocs.map((spoc) => (
//                       <label key={spoc._id || spoc.name} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                         <input
//                           type="checkbox"
//                           value={spoc.name}
//                           checked={selectedSpocs.includes(spoc.name)}
//                           onChange={(e) => {
//                             if (e.target.checked) setSelectedSpocs((p) => [...p, spoc.name]);
//                             else setSelectedSpocs((p) => p.filter((n) => n !== spoc.name));
//                           }}
//                           className="mr-2"
//                         />
//                         {spoc.name}
//                       </label>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Audit Status multi-select */}
//               <div ref={statusRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Audit Status</label>
//                 <button
//                   onClick={() => setShowStatusDropdown(!showStatusDropdown)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedAuditStatuses.length === ALL_STATUSES.length ? (
//                       <span className="text-slate-600">All statuses</span>
//                     ) : selectedAuditStatuses.length === 0 ? (
//                       <span className="text-slate-600">None selected</span>
//                     ) : (
//                       selectedAuditStatuses.map((s) => (
//                         <span key={s} className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                           {s}
//                         </span>
//                       ))
//                     )}
//                   </span>
//                   <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showStatusDropdown ? "rotate-180" : "rotate-0"}`} />
//                 </button>

//                 {showStatusDropdown && (
//                   <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
//                     <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
//                       <span className="flex items-center gap-2">
//                         <UsersIcon className="w-3.5 h-3.5" />
//                         Select statuses
//                       </span>
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => setSelectedAuditStatuses([...ALL_STATUSES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
//                         <button onClick={() => setSelectedAuditStatuses([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
//                       </div>
//                     </div>
//                     {ALL_STATUSES.map((status) => (
//                       <label key={status} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                         <input
//                           type="checkbox"
//                           value={status}
//                           checked={selectedAuditStatuses.includes(status)}
//                           onChange={() =>
//                             setSelectedAuditStatuses((prev) =>
//                               prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//                             )
//                           }
//                           className="mr-2"
//                         />
//                         {status}
//                       </label>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Summary info */}
//               <div className="w-full lg:w-auto text-xs text-slate-700 lg:ml-auto">
//                 <div className="flex flex-col space-y-2 lg:space-y-1 lg:items-end">
//                   <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-100 text-emerald-800">
//                     <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
//                     <span className="font-medium">{approvedCount} Approved</span>
//                     <span className="opacity-80 hidden lg:inline">Already accepted</span>
//                   </div>
//                   <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-rose-100 text-rose-800">
//                     <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
//                     <span className="font-medium">{rejectedCount} Rejected</span>
//                     <span className="opacity-80 hidden lg:inline">Declined projects</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* ===== States ===== */}
//           {loading && (
//             <div className="flex items-center gap-3 py-6">
//               <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-slate-900" />
//               <span className="text-sm lg:text-base text-slate-800">Loading projects…</span>
//             </div>
//           )}
//           {error && (
//             <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
//               <div className="flex items-center">
//                 <AlertCircle className="w-5 h-5 text-rose-500 mr-3" />
//                 <span className="text-rose-700">{error}</span>
//               </div>
//               <button
//                 onClick={fetchProjects}
//                 className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-sm self-start sm:ml-auto"
//               >
//                 Retry
//               </button>
//             </div>
//           )}
//           {!loading && !error && sortedDateKeys.length === 0 && (
//             <div className="text-center py-8 lg:py-12">
//               <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No Projects Found</h3>
//               <p className="text-sm lg:text-base text-slate-600">
//                 Try changing the date range, SPOCs, or status filters above.
//               </p>
//             </div>
//           )}

//           {/* ===== Projects grouped by Date ===== */}
//           {!loading &&
//             !error &&
//             sortedDateKeys.map((dateKey) => {
//               const allRows = projectsByDate[dateKey] || [];
//               const filteredRows =
//                 selectedAuditStatuses.length === 0
//                   ? []
//                   : allRows.filter((r) => selectedAuditStatuses.includes(r.auditStatus));

//               if (filteredRows.length === 0) return null;
//               const grouped = groupBySpoc(filteredRows);

//               return (
//                 <section
//                   key={dateKey}
//                   className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
//                 >
//                   <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                     <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
//                       <CalendarIcon className="w-4 h-4 text-indigo-600" />
//                       {formatISOToHuman(dateKey)}
//                       <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
//                         {filteredRows.length} entries
//                       </span>
//                     </h2>
//                   </div>

//                   {/* Group by SPOC */}
//                   {Object.keys(grouped).map((spoc) => {
//                     const rows = grouped[spoc];
//                     const inReview = rows.filter((r) => r.auditStatus === "In Review").length;
//                     const key = `${dateKey}|${spoc}`;
//                     const canApproveAll = inReview > 0;

//                     return (
//                       <div key={spoc} className="p-4 space-y-3">
//                         <div className="flex items-center justify-between mb-2">
//                           <div className="flex items-center gap-3">
//                             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
//                               {spoc
//                                 .split(" ")
//                                 .map((x) => x[0] || "")
//                                 .join("")
//                                 .slice(0, 2)
//                                 .toUpperCase()}
//                             </div>
//                             <div>
//                               <div className="text-sm font-semibold text-slate-900">{spoc}</div>
//                               <div className="text-xs text-slate-500">{inReview} In Review</div>
//                             </div>
//                           </div>
//                           <button
//                             disabled={!canApproveAll || !!bulkUpdating[key]}
//                             onClick={() => handleApproveAll(dateKey, spoc)}
//                             className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${canApproveAll
//                               ? "bg-emerald-600 text-white hover:bg-emerald-700"
//                               : "bg-slate-200 text-slate-500 cursor-not-allowed"
//                               }`}
//                           >
//                             {bulkUpdating[key] ? (
//                               <span className="flex items-center gap-2">
//                                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
//                                 Approving…
//                               </span>
//                             ) : (
//                               <>
//                                 <Check className="w-4 h-4" /> Approve All
//                               </>
//                             )}
//                           </button>
//                         </div>

//                         {/* Table of projects */}
//                         <div className="overflow-x-auto rounded-xl border border-slate-200">
//                           <table className="w-full text-sm border-collapse">
//                             <thead>
//                               <tr className="bg-slate-100 text-slate-700">
//                                 <th className="p-2 text-left">Project ID</th>
//                                 <th className="p-2 text-left">Project Name</th>
//                                 <th className="p-2 text-left">Start Date</th>
//                                 <th className="p-2 text-left">Due Date</th>
//                                 <th className="p-2 text-left">Spoc Name</th>
//                                 <th className="p-2 text-left">Spoc Email</th>
//                                 <th className="p-2 text-left">Status</th>
//                                 <th className="p-2 text-left">Actions</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {rows.map((proj) => (
//                                 <tr
//                                   key={proj.project_id}
//                                   className={`${rowClassForAudit(proj.auditStatus)} border-t`}
//                                 >
//                                   <td className="p-2">{proj.project_id}</td>
//                                   <td className="p-2">{proj.project_name}</td>
//                                   <td className="p-2">{formatISOToHuman(proj.start_date)}</td>
//                                   <td className="p-2">{formatISOToHuman(proj.due_date)}</td>
//                                   <td className="p-2">{proj.spocName}</td>
//                                   <td className="p-2">{proj.email}</td>
//                                   <td className="p-2">
//                                     <AuditBadge status={proj.auditStatus} />
//                                   </td>
//                                   <td className="p-2 flex gap-2">
//                                     {proj.auditStatus === "In Review" ? (
//                                       <>
//                                         {/* Approve button */}
//                                         <button
//                                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
//                                           disabled={!!updating[proj.project_id]}
//                                           onClick={async () => {
//                                             await handleApprove(proj.project_id, dateKey); // wait until API + state update finishes
//                                             setModify(null);
//                                           }}
//                                         >
//                                           {updating[proj.project_id] ? (
//                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                                           ) : (
//                                             <Check size={16} />
//                                           )}
//                                         </button>

//                                         {/* Reject button */}
//                                         <button
//                                           className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
//                                           disabled={!!updating[proj.project_id]}
//                                           onClick={async () => {
//                                             await handleReject(proj.project_id, dateKey);
//                                             setModify(null);
//                                           }}
//                                         >
//                                           {updating[proj.project_id] ? (
//                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                                           ) : (
//                                             <X size={16} />
//                                           )}
//                                         </button>
//                                       </>
//                                     ) : modify === proj.project_id ? (
//                                       // When Modify clicked → show Approve/Reject again
//                                       <>
//                                         {/* Approve inside Modify */}
//                                         <button
//                                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
//                                           disabled={!!updating[proj.project_id]}
//                                           onClick={async () => {
//                                             await handleApprove(proj.project_id, dateKey);
//                                             setModify(null);
//                                           }}
//                                         >
//                                           {updating[proj.project_id] ? (
//                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                                           ) : (
//                                             <Check size={16} />
//                                           )}
//                                         </button>

//                                         {/* Reject inside Modify */}
//                                         <button
//                                           className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
//                                           disabled={!!updating[proj.project_id]}
//                                           onClick={async () => {
//                                             await handleReject(proj.project_id, dateKey);
//                                             setModify(null);
//                                           }}
//                                         >
//                                           {updating[proj.project_id] ? (
//                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                                           ) : (
//                                             <X size={16} />
//                                           )}
//                                         </button>

//                                         {/* Cancel button */}
//                                         <button
//                                           className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2.5 py-1.5 rounded-md"
//                                           onClick={() => setModify(null)}
//                                         >
//                                           Cancel
//                                         </button>
//                                       </>
//                                     ) : (
//                                       // Default → show Modify button
//                                       <button
//                                         className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm"
//                                         onClick={() => setModify(proj.project_id)}
//                                       >
//                                         <Pencil className="w-4 h-4" />
//                                         Modify
//                                       </button>

//                                     )}
//                                   </td>

//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </section>
//               );
//             })}
//         </div>
//       </main>
//     </div>
//   );
// }

// /* =============== SidebarLinks (same as in AdminDashboard) =============== */
// function SidebarLinks({ navigate, setSidebarOpen, pendingProjectCount = 0 }) {
//   const close = () => setSidebarOpen && setSidebarOpen(false);
//   const location = useLocation();
//   const [openWorklogs, setOpenWorklogs] = useState(false);
//   const [openProjects, setOpenProjects] = useState(false);

//   useEffect(() => {
//     if (location.pathname.includes("worklog")) setOpenWorklogs(true);
//     if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
//       setOpenProjects(true);
//   }, [location]);

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//       <nav className="flex flex-col space-y-2">

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin-dashboard"); close(); }}
//         >
//           Home
//         </button>

//         {/* Worklogs */}
//         <div>
//           <button
//             className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
//             onClick={() => setOpenWorklogs(!openWorklogs)}
//           >
//             <span>Worklogs</span>
//             <span>{openWorklogs ? "▾" : "▸"}</span>
//           </button>
//           {openWorklogs && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => { navigate("/admin/approve-worklogs"); close(); }}
//               >
//                 Approve Worklogs
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => { navigate("/admin/edit-worklog-entries"); close(); }}
//               >
//                 Edit Worklogs
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Employees */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/handle-employees"); close(); }}
//         >
//           Manage Employees
//         </button>
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/push-missing-request"); close(); }}
//         >
//           Push Missing Requests
//         </button>
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/team-wise-dropdowns"); close(); }}
//         >
//           Team-wise Dropdowns
//         </button>
//         {/* Projects */}
//         <div>
//           <button
//             className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
//             onClick={() => setOpenProjects(!openProjects)}
//           >
//             <span>Projects</span>
//             <span>{openProjects ? "▾" : "▸"}</span>
//           </button>
//           {openProjects && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => { navigate("/admin/add-abbreviations"); close(); }}
//               >
//                 Add Abbreviations
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => { navigate("/admin/add-project"); close(); }}
//               >
//                 Add Project
//               </button>
//               {/* ✅ Project Requests with Count Badge */}
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors flex items-center justify-between ${
//                   location.pathname.includes("project-requests") ? "bg-gray-700" : ""
//                 }`}
//                 onClick={() => { navigate("/admin/project-requests"); close(); }}
//               >
//                 <span>Project Requests</span>
//                 {pendingProjectCount > 0 && (
//                   <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
//                     {pendingProjectCount > 9 ? "9+" : pendingProjectCount}
//                   </span>
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
//          <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("add-unit-type") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/add-unit-type"); close(); }}
//         >
//           Add Unit Type
//         </button>
//           <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("mark-shift") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/mark-shift"); close(); }}
//         >
//           Mark Extra Shift
//         </button>
//       </nav>
//     </div>
//   );
// }


// /* =================== Calendar + Helpers (reuse from your snippet) =================== */
// function stripToISO(d) {
//   const dt = new Date(d);
//   dt.setUTCHours(0, 0, 0, 0);
//   return dt.toISOString().split("T")[0];
// }
// function isoNDaysAgo(n) {
//   const d = new Date();
//   d.setUTCDate(d.getUTCDate() - n);
//   return stripToISO(d);
// }
// function formatISOToHuman(value) {
//   if (!value) return "-";
//   const d = new Date(value);
//   if (isNaN(d.getTime())) return "-";
//   return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
// }
// function toMonthKey(d) {
//   return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
// }
// function parseMonthKey(key) {
//   const [y, m] = key.split("-").map((v) => parseInt(v, 10));
//   return new Date(Date.UTC(y, m - 1, 1));
// }
// function formatMonthKey(key) {
//   const d = parseMonthKey(key);
//   return d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
// }
// function addMonths(date, delta) {
//   return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
// }
// function isMonthFullyInFuture(d) {
//   const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);
//   const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
//   return monthStart > today && lastDay > today;
// }
// function useOutclick(onOut) {
//   const ref = useRef(null);
//   useEffect(() => {
//     function onDoc(e) {
//       if (!ref.current) return;
//       if (!ref.current.contains(e.target)) onOut?.();
//     }
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, [onOut]);
//   return ref;
// }
// function CalendarGrid({ monthKey, rangeMode, tempStart, tempEnd, onPick }) {
//   const monthDate = parseMonthKey(monthKey);
//   const today = stripToISO(new Date());
//   const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
//   const startWeekday = firstDay.getUTCDay();
//   const daysInMonth = new Date(
//     Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)
//   ).getUTCDate();
//   const cells = [];
//   for (let i = 0; i < startWeekday; i++) cells.push(null);
//   for (let d = 1; d <= daysInMonth; d++) {
//     const iso = stripToISO(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), d)));
//     cells.push(iso);
//   }
//   while (cells.length % 7 !== 0) cells.push(null);

//   const isInSelection = (iso) => {
//     if (!iso) return false;
//     if (!rangeMode) return iso === tempEnd;
//     const s = tempStart <= tempEnd ? tempStart : tempEnd;
//     const e = tempEnd >= tempStart ? tempEnd : tempStart;
//     return iso >= s && iso <= e;
//   };

//   return (
//     <div className="px-3 py-2">
//       <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
//         {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
//           <div key={d} className="text-center py-1">
//             {d}
//           </div>
//         ))}
//       </div>
//       <div className="grid grid-cols-7 gap-2 px-1 pb-2">
//         {cells.map((iso, idx) => {
//           if (!iso) return <div key={idx} className="h-9" />;
//           const disabled = iso > today;
//           const selected = isInSelection(iso);
//           const isToday = iso === today;
//           return (
//             <button
//               key={idx}
//               disabled={disabled}
//               onClick={() => onPick(iso)}
//               className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition
//                 ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50"}
//                 ${selected ? "bg-indigo-600 text-white font-semibold" : "bg-white"}
//                 ${isToday ? "ring-1 ring-indigo-400" : ""}`}
//               title={formatISOToHuman(iso)}
//             >
//               {new Date(iso).getUTCDate()}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import {
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Filter as FilterIcon,
  Pencil,
  ChevronDown,
  FileText,
  Eye,
} from "lucide-react";

/* =================== CONFIG =================== */
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

/* =================== MAIN PAGE =================== */
export default function AdminProjectRequests() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [modify, setModify] = useState(null);

 // ✅ Add Missing entry count state
  const [pendingCount, setPendingCount] = useState(0);
  
  // ✅ Add project pending count state
  const [projectPendingCount, setProjectPendingCount] = useState(0);

   // ✅ Add fetchPendingCount function
  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/request/count`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPendingCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch pending count:", err);
    }
  };

  // ✅ Add fetchProjectPendingCount function
  const fetchProjectPendingCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin-projects/pending-count`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProjectPendingCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch project pending count:", err);
    }
  };


  /* ===== Auth ===== */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser({
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        picture:
          decoded.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            decoded.name
          )}&background=random&color=fff`,
      });
       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchPendingCount();
      fetchProjectPendingCount();
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common.Authorization;
    navigate("/");
  };

  /* ===== Project Requests STATE/LOGIC ===== */

  // Data
  const [projectsByDate, setProjectsByDate] = useState({});
  const [spocs, setSpocs] = useState([]);

  // Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [bulkUpdating, setBulkUpdating] = useState({});

  // Filters: SPOC users
  const [selectedSpocs, setSelectedSpocs] = useState([]);
  const [showSpocDropdown, setShowSpocDropdown] = useState(false);
  const spocRef = useOutclick(() => setShowSpocDropdown(false));

  // Filters: dates
  const todayISO = stripToISO(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [rangeMode, setRangeMode] = useState(true);
  const [tempStart, setTempStart] = useState(isoNDaysAgo(30));
  const [tempEnd, setTempEnd] = useState(todayISO);
  const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
  const [startISO, setStartISO] = useState(isoNDaysAgo(30));
  const [endISO, setEndISO] = useState(todayISO);
  const popRef = useOutclick(() => setDatePopoverOpen(false));

  // Filters: audit statuses
  const ALL_STATUSES = [
    "In Review",
    "Approved",
    "Rejected",
  ];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useOutclick(() => setShowStatusDropdown(false));
  const [selectedAuditStatuses, setSelectedAuditStatuses] = useState([...ALL_STATUSES]);

  // Edit mode for "Change to …" actions
  const [modifying, setModifying] = useState(null);

  /* --- Fetch SPOCs --- */
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/admin-projects/spocs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((data) => setSpocs(data.spocs || []))
      .catch((err) => console.error("Failed to fetch SPOCs:", err.message));
  }, [user]);

  /* --- Fetch projects (on filter change) --- */
  useEffect(() => {
    if (!user) return;
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startISO, endISO, selectedSpocs, selectedAuditStatuses]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${API_BASE_URL}/admin-projects/requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startISO,
          endDate: endISO,
          spocs: selectedSpocs.length > 0 ? selectedSpocs : undefined,
          auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProjectsByDate(data.projectsByDate || {});
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch projects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProjectCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin-projects/pending-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPendingProjectCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch pending project count:", err);
    }
  };


  /* --- Derived helpers --- */
  const sortedDateKeys = useMemo(
    () => Object.keys(projectsByDate).sort((a, b) => new Date(b) - new Date(a)),
    [projectsByDate]
  );


  const groupBySpoc = (items) => {
    const bySpoc = {};
    for (const row of items) {
      if (!bySpoc[row.spocName]) bySpoc[row.spocName] = [];
      bySpoc[row.spocName].push(row);
    }
    return Object.fromEntries(
      Object.keys(bySpoc)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, bySpoc[k]])
    );
  };

  const { inReviewCount, approvedCount, rejectedCount } = useMemo(() => {
    let inReview = 0;
    let approved = 0;
    let rejected = 0;
    for (const dateKey of Object.keys(projectsByDate)) {
      for (const row of projectsByDate[dateKey] || []) {
        if (row.auditStatus === "In Review") inReview++;
        if (row.auditStatus === "Approved") approved++;
        if (row.auditStatus === "Rejected") rejected++;
      }
    }
    return { inReviewCount: inReview, approvedCount: approved, rejectedCount: rejected };
  }, [projectsByDate]);

  const rowClassForAudit = (status) => {
    if (status === "Approved") return "bg-emerald-50/70";
    if (status === "Rejected") return "bg-rose-50/70";
    if (status === "In Review") return "bg-yellow-50";
    return "";
  };

  const AuditBadge = ({ status }) => {
    if (status === "Approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
          <CheckCircle className="w-4 h-4" /> Approved
        </span>
      );
    if (status === "Rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-medium">
          <XCircle className="w-4 h-4" /> Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
        <Clock className="w-4 h-4" /> In Review
      </span>
    );
  };

  /* --- Updates (single/bulk) --- */
  const mutateLocalRow = (dateKey, projectId, auditStatus) => {
    setProjectsByDate((prev) => {
      const next = { ...prev };
      if (!next[dateKey]) return next;
      next[dateKey] = next[dateKey].map((r) =>
        r.project_id === projectId ? { ...r, auditStatus } : r
      );
      return next;
    });
  };


  // const updateProjectStatus = async (projectId, status, dateKey, adminComments = "") => {
  //   try {
  //     setUpdating((p) => ({ ...p, [projectId]: true }));
  //     const token = localStorage.getItem("authToken");

  //     const res = await fetch(`${API_BASE_URL}/admin-projects/update-status`, {
  //       method: "PUT",
  //       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         projectId,
  //         auditStatus: status,
  //         adminComments: adminComments || undefined
  //       }),
  //     });

  //     if (!res.ok) throw new Error(await res.text());
  //     await res.json();
  //     mutateLocalRow(dateKey, projectId, status);
  //   } catch (err) {
  //     console.error(err);
  //     alert(`Failed to ${status.toLowerCase()} project. Please try again.`);
  //   } finally {
  //     setUpdating((p) => ({ ...p, [projectId]: false }));
  //   }
  // };

  const updateProjectStatus = async (projectId, status, dateKey, adminComments = "") => {
  try {
    setUpdating((p) => ({ ...p, [projectId]: true }));
    const token = localStorage.getItem("authToken");

    const res = await fetch(`${API_BASE_URL}/admin-projects/update-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        auditStatus: status,
        adminComments: adminComments || undefined
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    await res.json();
    mutateLocalRow(dateKey, projectId, status);
    
    // ✅ Decrease pending count when project is approved or rejected
    if (status === "Approved" || status === "Rejected") {
      setProjectPendingCount(prev => Math.max(0, prev - 1));
    }
    
  } catch (err) {
    console.error(err);
    alert(`Failed to ${status.toLowerCase()} project. Please try again.`);
  } finally {
    setUpdating((p) => ({ ...p, [projectId]: false }));
  }
};

  const handleReject = (id, dateKey) => {
    const confirmed = window.confirm("Are you sure you want to reject this request?");
    if (confirmed) {
      updateProjectStatus(id, "Rejected", dateKey);
    }
  };

  const handleApprove = (id, dateKey) => {
    updateProjectStatus(id, "Approved", dateKey);
  };


  // const handleApproveAll = async (dateKey, spocName) => {
  //   const key = `${dateKey}|${spocName}`;
  //   try {
  //     setBulkUpdating((p) => ({ ...p, [key]: true }));
  //     const token = localStorage.getItem("authToken");
  //     const rows = (projectsByDate[dateKey] || []).filter(
  //       (r) => r.spocName === spocName && r.auditStatus === "In Review"
  //     );
  //     const ids = rows.map((r) => r.project_id);
  //     if (ids.length === 0) return;

  //     const res = await fetch(`${API_BASE_URL}/admin-projects/bulk-update-status`, {
  //       method: "PUT",
  //       headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         projectIds: ids,
  //         auditStatus: "Approved",
  //         adminComments: `Bulk approved by admin on ${new Date().toISOString().split('T')[0]}`
  //       }),
  //     });

  //     if (!res.ok) throw new Error(await res.text());
  //     await res.json();

  //     setProjectsByDate((prev) => {
  //       const next = { ...prev };
  //       next[dateKey] = next[dateKey].map((row) =>
  //         row.spocName === spocName && row.auditStatus === "In Review"
  //           ? { ...row, auditStatus: "Approved" }
  //           : row
  //       );
  //       return next;
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     alert("Approve All failed. Please try again.");
  //   } finally {
  //     setBulkUpdating((p) => ({ ...p, [key]: false }));
  //   }
  // };

  const handleApproveAll = async (dateKey, spocName) => {
  const key = `${dateKey}|${spocName}`;
  try {
    setBulkUpdating((p) => ({ ...p, [key]: true }));
    const token = localStorage.getItem("authToken");
    const rows = (projectsByDate[dateKey] || []).filter(
      (r) => r.spocName === spocName && r.auditStatus === "In Review"
    );
    const ids = rows.map((r) => r.project_id);
    if (ids.length === 0) return;

    const res = await fetch(`${API_BASE_URL}/admin-projects/bulk-update-status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        projectIds: ids,
        auditStatus: "Approved",
        adminComments: `Bulk approved by admin on ${new Date().toISOString().split('T')[0]}`
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    await res.json();

    setProjectsByDate((prev) => {
      const next = { ...prev };
      next[dateKey] = next[dateKey].map((row) =>
        row.spocName === spocName && row.auditStatus === "In Review"
          ? { ...row, auditStatus: "Approved" }
          : row
      );
      return next;
    });
    
    // ✅ Decrease pending count by number of approved projects
    setProjectPendingCount(prev => Math.max(0, prev - ids.length));
    
  } catch (err) {
    console.error(err);
    alert("Approve All failed. Please try again.");
  } finally {
    setBulkUpdating((p) => ({ ...p, [key]: false }));
  }
};

  

  /* --- Date filter helpers --- */
  const applyTempDate = () => {
    if (rangeMode) {
      const s = tempStart <= tempEnd ? tempStart : tempEnd;
      const e = tempEnd >= tempStart ? tempEnd : tempStart;
      setStartISO(s);
      setEndISO(e);
    } else {
      setStartISO(tempEnd);
      setEndISO(tempEnd);
    }
    setDatePopoverOpen(false);
  };

  const quickApply = (days) => {
    setRangeMode(true);
    const s = isoNDaysAgo(days - 1);
    setTempStart(s);
    setTempEnd(todayISO);
    setActiveMonth(toMonthKey(new Date(todayISO)));
    setStartISO(s);
    setEndISO(todayISO);
  };

  const labelForFilter = () =>
    startISO === endISO ? formatISOToHuman(startISO) : `${formatISOToHuman(startISO)} – ${formatISOToHuman(endISO)}`;

  /* --- Render guards --- */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                Admin Dashboard <span className="hidden sm:inline">- Project Requests</span>
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-slate-600" />
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-slate-300">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Menu Dropdown - ADD THIS SECTION */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-800 text-white shadow-xl">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-600">
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-slate-600" />
              <div>
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-slate-300">{user.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
            <SidebarLinks 
              navigate={navigate} 
              location={useLocation()} 
              close={() => setSidebarOpen(false)} 
              pendingCount={pendingCount} 
              projectPendingCount={projectPendingCount} 
            />
          </aside>
        </div>
      )}
      <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
        <SidebarLinks 
          navigate={navigate} 
          location={useLocation()} 
          pendingCount={pendingCount} 
          projectPendingCount={projectPendingCount} 
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-full overflow-hidden">

          {/* Filters */}
          <div className="rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
              <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters</h3>
            </div>

            <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">

              {/* Date Picker */}
              <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date(s)</label>
                <button
                  onClick={() => setDatePopoverOpen(!datePopoverOpen)}
                  className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs lg:text-sm font-medium truncate">{labelForFilter()}</span>
                  </span>
                  <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{rangeMode ? "Range" : "Single"}</span>
                </button>

                {datePopoverOpen && (
                  <div className="absolute z-50 mt-2 w-[340px] right-0 lg:right-auto lg:left-0 rounded-xl border bg-white shadow-xl">
                    <div className="px-3 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRangeMode(false)}
                          className={`text-xs px-2 py-1 rounded ${!rangeMode ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                        >
                          Single Day
                        </button>
                        <button
                          onClick={() => setRangeMode(true)}
                          className={`text-xs px-2 py-1 rounded ${rangeMode ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                        >
                          Range
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), -1)))}
                          className="p-1 hover:bg-slate-100 rounded"
                          aria-label="Prev month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-medium w-[130px] text-center">{formatMonthKey(activeMonth)}</div>
                        <button
                          onClick={() => {
                            const nextM = addMonths(parseMonthKey(activeMonth), 1);
                            if (isMonthFullyInFuture(nextM)) return;
                            setActiveMonth(toMonthKey(nextM));
                          }}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-40"
                          aria-label="Next month"
                          disabled={isMonthFullyInFuture(addMonths(parseMonthKey(activeMonth), 1))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <CalendarGrid
                      monthKey={activeMonth}
                      rangeMode={rangeMode}
                      tempStart={tempStart}
                      tempEnd={tempEnd}
                      onPick={(iso) => {
                        if (!rangeMode) {
                          if (iso > todayISO) return;
                          setTempEnd(iso);
                          return;
                        }
                        if (iso > todayISO) return;
                        if (!tempStart || (tempStart && tempEnd && tempStart <= tempEnd)) {
                          setTempStart(iso);
                          setTempEnd(iso);
                        } else {
                          if (iso < tempStart) setTempStart(iso);
                          else setTempEnd(iso);
                        }
                      }}
                    />

                    <div className="px-3 py-2 border-t flex flex-wrap items-center gap-2">
                      <button onClick={() => quickApply(7)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 7 Days</button>
                      <button onClick={() => quickApply(15)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 15 Days</button>
                      <button onClick={() => quickApply(30)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 30 Days</button>
                      <button
                        onClick={() => {
                          setRangeMode(false);
                          setTempEnd(todayISO);
                          setActiveMonth(toMonthKey(new Date(todayISO)));
                          setStartISO(todayISO);
                          setEndISO(todayISO);
                          setDatePopoverOpen(false);
                        }}
                        className="text-xs px-2 py-1 rounded bg-slate-900 text-white ml-auto"
                      >
                        Today
                      </button>
                      <button onClick={applyTempDate} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* SPOCs multi-select */}
              <div ref={spocRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">SPOCs</label>
                <button
                  onClick={() => setShowSpocDropdown(!showSpocDropdown)}
                  className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                    {selectedSpocs.length === 0 ? (
                      <span className="text-slate-600">All SPOCs</span>
                    ) : (
                      selectedSpocs.map((name) => (
                        <span key={name} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {name}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showSpocDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showSpocDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center gap-2">
                      <UsersIcon className="w-3.5 h-3.5" />
                      Select SPOCs
                    </div>
                    {spocs.map((spoc) => (
                      <label key={spoc._id || spoc.name} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                        <input
                          type="checkbox"
                          value={spoc.name}
                          checked={selectedSpocs.includes(spoc.name)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSpocs((p) => [...p, spoc.name]);
                            else setSelectedSpocs((p) => p.filter((n) => n !== spoc.name));
                          }}
                          className="mr-2"
                        />
                        {spoc.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Status multi-select */}
              <div ref={statusRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Audit Status</label>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                    {selectedAuditStatuses.length === ALL_STATUSES.length ? (
                      <span className="text-slate-600">All statuses</span>
                    ) : selectedAuditStatuses.length === 0 ? (
                      <span className="text-slate-600">None selected</span>
                    ) : (
                      selectedAuditStatuses.map((s) => (
                        <span key={s} className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {s}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showStatusDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showStatusDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5" />
                        Select statuses
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedAuditStatuses([...ALL_STATUSES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
                        <button onClick={() => setSelectedAuditStatuses([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
                      </div>
                    </div>
                    {ALL_STATUSES.map((status) => (
                      <label key={status} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                        <input
                          type="checkbox"
                          value={status}
                          checked={selectedAuditStatuses.includes(status)}
                          onChange={() =>
                            setSelectedAuditStatuses((prev) =>
                              prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                            )
                          }
                          className="mr-2"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary info */}
              <div className="w-full lg:w-auto text-xs text-slate-700 lg:ml-auto">
                <div className="flex flex-col space-y-2 lg:space-y-1 lg:items-end">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{approvedCount} Approved</span>
                    <span className="opacity-80 hidden lg:inline">Already accepted</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-rose-100 text-rose-800">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{rejectedCount} Rejected</span>
                    <span className="opacity-80 hidden lg:inline">Declined projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== States ===== */}
          {loading && (
            <div className="flex items-center gap-3 py-6">
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-slate-900" />
              <span className="text-sm lg:text-base text-slate-800">Loading projects…</span>
            </div>
          )}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-rose-500 mr-3" />
                <span className="text-rose-700">{error}</span>
              </div>
              <button
                onClick={fetchProjects}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-sm self-start sm:ml-auto"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && sortedDateKeys.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No Projects Found</h3>
              <p className="text-sm lg:text-base text-slate-600">
                Try changing the date range, SPOCs, or status filters above.
              </p>
            </div>
          )}

          {/* ===== Projects grouped by Date ===== */}
          {!loading &&
            !error &&
            sortedDateKeys.map((dateKey) => {
              const allRows = projectsByDate[dateKey] || [];
              const filteredRows =
                selectedAuditStatuses.length === 0
                  ? []
                  : allRows.filter((r) => selectedAuditStatuses.includes(r.auditStatus));

              if (filteredRows.length === 0) return null;
              const grouped = groupBySpoc(filteredRows);

              return (
                <section
                  key={dateKey}
                  className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                      {formatISOToHuman(dateKey)}
                      <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
                        {filteredRows.length} entries
                      </span>
                    </h2>
                  </div>

                  {/* Group by SPOC */}
                  {Object.keys(grouped).map((spoc) => {
                    const rows = grouped[spoc];
                    const inReview = rows.filter((r) => r.auditStatus === "In Review").length;
                    const key = `${dateKey}|${spoc}`;
                    const canApproveAll = inReview > 0;

                    return (
                      <div key={spoc} className="p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                              {spoc
                                .split(" ")
                                .map((x) => x[0] || "")
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{spoc}</div>
                              <div className="text-xs text-slate-500">{inReview} In Review</div>
                            </div>
                          </div>
                          <button
                            disabled={!canApproveAll || !!bulkUpdating[key]}
                            onClick={() => handleApproveAll(dateKey, spoc)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${canApproveAll
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-200 text-slate-500 cursor-not-allowed"
                              }`}
                          >
                            {bulkUpdating[key] ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                Approving…
                              </span>
                            ) : (
                              <>
                                <Check className="w-4 h-4" /> Approve All
                              </>
                            )}
                          </button>
                        </div>

                        {/* Table of projects */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700">
                                <th className="p-2 text-left">Project ID</th>
                                <th className="p-2 text-left">Project Name</th>
                                <th className="p-2 text-left">Start Date</th>
                                <th className="p-2 text-left">Due Date</th>
                                <th className="p-2 text-left">Spoc Name</th>
                                <th className="p-2 text-left">Spoc Email</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((proj) => (
                                <tr
                                  key={proj.project_id}
                                  className={`${rowClassForAudit(proj.auditStatus)} border-t`}
                                >
                                  <td className="p-2">{proj.project_id}</td>
                                  <td className="p-2">{proj.project_name}</td>
                                  <td className="p-2">{formatISOToHuman(proj.start_date)}</td>
                                  <td className="p-2">{formatISOToHuman(proj.due_date)}</td>
                                  <td className="p-2">{proj.spocName}</td>
                                  <td className="p-2">{proj.email}</td>
                                  <td className="p-2">
                                    <AuditBadge status={proj.auditStatus} />
                                  </td>
                                  <td className="p-2 flex gap-2">
                                    {proj.auditStatus === "In Review" ? (
                                      <>
                                        {/* Approve button */}
                                        <button
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                          disabled={!!updating[proj.project_id]}
                                          onClick={async () => {
                                            await handleApprove(proj.project_id, dateKey); // wait until API + state update finishes
                                            setModify(null);
                                          }}
                                        >
                                          {updating[proj.project_id] ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                          ) : (
                                            <Check size={16} />
                                          )}
                                        </button>

                                        {/* Reject button */}
                                        <button
                                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                          disabled={!!updating[proj.project_id]}
                                          onClick={async () => {
                                            await handleReject(proj.project_id, dateKey);
                                            setModify(null);
                                          }}
                                        >
                                          {updating[proj.project_id] ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                          ) : (
                                            <X size={16} />
                                          )}
                                        </button>
                                      </>
                                    ) : modify === proj.project_id ? (
                                      // When Modify clicked → show Approve/Reject again
                                      <>
                                        {/* Approve inside Modify */}
                                        <button
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                          disabled={!!updating[proj.project_id]}
                                          onClick={async () => {
                                            await handleApprove(proj.project_id, dateKey);
                                            setModify(null);
                                          }}
                                        >
                                          {updating[proj.project_id] ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                          ) : (
                                            <Check size={16} />
                                          )}
                                        </button>

                                        {/* Reject inside Modify */}
                                        <button
                                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                          disabled={!!updating[proj.project_id]}
                                          onClick={async () => {
                                            await handleReject(proj.project_id, dateKey);
                                            setModify(null);
                                          }}
                                        >
                                          {updating[proj.project_id] ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                          ) : (
                                            <X size={16} />
                                          )}
                                        </button>

                                        {/* Cancel button */}
                                        <button
                                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2.5 py-1.5 rounded-md"
                                          onClick={() => setModify(null)}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      // Default → show Modify button
                                      <button
                                        className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm"
                                        onClick={() => setModify(proj.project_id)}
                                      >
                                        <Pencil className="w-4 h-4" />
                                        Modify
                                      </button>

                                    )}
                                  </td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </div>
      </main>
    </div>
  );
}

/* =============== SidebarLinks (same as in AdminDashboard) =============== */
function SidebarLinks({ navigate, setSidebarOpen, projectPendingCount = 0, pendingCount = 0}) {
  const close = () => setSidebarOpen && setSidebarOpen(false);
  const location = useLocation();
  const [openWorklogs, setOpenWorklogs] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("worklog")) setOpenWorklogs(true);
    if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
      setOpenProjects(true);
  }, [location]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">

        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin-dashboard"); close(); }}
        >
          Home
        </button>

        {/* Worklogs */}
        <div>
          <button
            className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
            onClick={() => setOpenWorklogs(!openWorklogs)}
          >
            <span>Worklogs</span>
            <span>{openWorklogs ? "▾" : "▸"}</span>
          </button>
          {openWorklogs && (
            <div className="ml-4 mt-2 flex flex-col space-y-2">
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
                  }`}
                onClick={() => { navigate("/admin/approve-worklogs"); close(); }}
              >
                Approve Worklogs
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""
                  }`}
                onClick={() => { navigate("/admin/edit-worklog-entries"); close(); }}
              >
                Edit Worklogs
              </button>
            </div>
          )}
        </div>

        {/* Employees */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/handle-employees"); close(); }}
        >
          Manage Employees
        </button>
       {/* ✅ Push Missing Requests with Count Badge */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/push-missing-request"); close && close(); }}
        >
          <span>Push Missing Requests</span>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/team-wise-dropdowns"); close(); }}
        >
          Team-wise Dropdowns
        </button>
        {/* Projects */}
        <div>
          <button
            className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
            onClick={() => setOpenProjects(!openProjects)}
          >
            <span>Projects</span>
            <span>{openProjects ? "▾" : "▸"}</span>
          </button>
          {openProjects && (
            <div className="ml-4 mt-2 flex flex-col space-y-2">
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""
                  }`}
                onClick={() => { navigate("/admin/add-abbreviations"); close(); }}
              >
                Add Abbreviations
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""
                  }`}
                onClick={() => { navigate("/admin/add-project"); close(); }}
              >
                Add Project
              </button>
              {/* ✅ Project Requests with Count Badge */}
              {/* <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors flex items-center justify-between ${
                  location.pathname.includes("project-requests") ? "bg-gray-700" : ""
                }`}
                onClick={() => { navigate("/admin/project-requests"); close(); }}
              >
                <span>Project Requests</span>
                {pendingProjectCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
                    {pendingProjectCount > 9 ? "9+" : pendingProjectCount}
                  </span>
                )}
              </button> */}
            </div>
          )}
        </div>
        {/* ✅ Project Requests with Count Badge */}
<button
  className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${
    location.pathname.includes("project-requests") ? "bg-gray-700" : ""
  }`}
  onClick={() => { navigate("/admin/project-requests"); close(); }}
>
  <span>Project Requests</span>
  {projectPendingCount > 0 && (
    <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
      {projectPendingCount > 9 ? "9+" : projectPendingCount}
    </span>
  )}
</button>
         <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("add-unit-type") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/add-unit-type"); close(); }}
        >
          Add Unit Type
        </button>
          <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("mark-shift") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/mark-shift"); close(); }}
        >
          Mark Extra Shift
        </button>
      </nav>
    </div>
  );
}


/* =================== Calendar + Helpers (reuse from your snippet) =================== */
function stripToISO(d) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt.toISOString().split("T")[0];
}
function isoNDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return stripToISO(d);
}
function formatISOToHuman(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function toMonthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function parseMonthKey(key) {
  const [y, m] = key.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, 1));
}
function formatMonthKey(key) {
  const d = parseMonthKey(key);
  return d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
function addMonths(date, delta) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}
function isMonthFullyInFuture(d) {
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return monthStart > today && lastDay > today;
}
function useOutclick(onOut) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOut?.();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onOut]);
  return ref;
}
function CalendarGrid({ monthKey, rangeMode, tempStart, tempEnd, onPick }) {
  const monthDate = parseMonthKey(monthKey);
  const today = stripToISO(new Date());
  const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = stripToISO(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), d)));
    cells.push(iso);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const isInSelection = (iso) => {
    if (!iso) return false;
    if (!rangeMode) return iso === tempEnd;
    const s = tempStart <= tempEnd ? tempStart : tempEnd;
    const e = tempEnd >= tempStart ? tempEnd : tempStart;
    return iso >= s && iso <= e;
  };

  return (
    <div className="px-3 py-2">
      <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 px-1 pb-2">
        {cells.map((iso, idx) => {
          if (!iso) return <div key={idx} className="h-9" />;
          const disabled = iso > today;
          const selected = isInSelection(iso);
          const isToday = iso === today;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition
                ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50"}
                ${selected ? "bg-indigo-600 text-white font-semibold" : "bg-white"}
                ${isToday ? "ring-1 ring-indigo-400" : ""}`}
              title={formatISOToHuman(iso)}
            >
              {new Date(iso).getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

