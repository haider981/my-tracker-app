import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import {
  Check,
  X, // This is imported as X
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
} from "lucide-react";

/* =================== CONFIG =================== */
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

// Team colors mapping
const TEAM_COLORS = {
  Editorial_Maths: "bg-blue-100 border-blue-300 text-blue-800",
  Editorial_Science: "bg-green-100 border-green-300 text-green-800",
  Editorial_University: "bg-purple-100 border-purple-300 text-purple-800",
  Editorial_English: "bg-red-100 border-red-300 text-red-800",
  Editorial_SST: "bg-orange-100 border-orange-300 text-orange-800",
  "Editorial_Eco&Com": "bg-teal-100 border-teal-300 text-teal-800",
  DTP_Raj: "bg-pink-100 border-pink-300 text-pink-800",
  DTP_Naveen: "bg-indigo-100 border-indigo-300 text-indigo-800",
  DTP_Rimpi: "bg-cyan-100 border-cyan-300 text-cyan-800",
  DTP_Suman: "bg-amber-100 border-amber-300 text-amber-800",
  Digital_Marketing: "bg-lime-100 border-lime-300 text-lime-800",
  CSMA_Maths: "bg-emerald-100 border-emerald-300 text-emerald-800",
  Animation_Maths: "bg-rose-100 border-rose-300 text-rose-800",
  CSMA_Science: "bg-violet-100 border-violet-300 text-violet-800",
  CSMA_Technology: "bg-yellow-100 border-yellow-300 text-yellow-800",
  CSMA_English: "bg-slate-100 border-slate-300 text-slate-800",
  CSMA_Intern: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
  InternScience: "bg-sky-100 border-sky-300 text-sky-800",
  "University_&_Titles": "bg-stone-100 border-stone-300 text-stone-800",
};

// All available teams
const ALL_TEAMS = Object.keys(TEAM_COLORS);

/* =================== MAIN PAGE =================== */
export default function AdminApproveWorklogs() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

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

  // Data
  const [worklogsByDate, setWorklogsByDate] = useState({});
  const [employees, setEmployees] = useState([]);

  // Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [bulkUpdating, setBulkUpdating] = useState({});

  // Filters: employees
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empRef = useOutclick(() => setShowEmpDropdown(false));

  // Filters: dates (using SPOC calendar)
  const todayISO = stripToISO(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [tempStart, setTempStart] = useState(isoNDaysAgo(2));
  const [tempEnd, setTempEnd] = useState(todayISO);
  const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
  const [startISO, setStartISO] = useState(isoNDaysAgo(2));
  const [endISO, setEndISO] = useState(todayISO);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const popRef = useOutclick(() => setDatePopoverOpen(false));

  // Filters: audit statuses
  const ALL_STATUSES = [
    "Pending",
    "Re-Pending",
    "Approved",
    "Rejected",
    "Re-Approved",
    "Re-Rejected",
  ];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useOutclick(() => setShowStatusDropdown(false));
  const [selectedAuditStatuses, setSelectedAuditStatuses] = useState([...ALL_STATUSES]);

  // Filters: work modes (new)
  const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);
  const workModeRef = useOutclick(() => setShowWorkModeDropdown(false));
  const [selectedWorkModes, setSelectedWorkModes] = useState([]);
  const ALL_WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night", "Leave"];

  // Filters: teams (new)
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const teamRef = useOutclick(() => setShowTeamDropdown(false));
  const [selectedTeams, setSelectedTeams] = useState([]);

  // Replace your current employee search state with this:
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Edit mode
  const [modifying, setModifying] = useState(null);

  // Fix the employees fetching - remove the problematic useEffect and replace with this:
  useEffect(() => {
    if (!user) return;

    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employees: ${response.status}`);
        }

        const data = await response.json();
        const employeesList = data.users || data || [];

        if (Array.isArray(employeesList)) {
          setEmployees(employeesList);
          setFilteredEmployees(employeesList);
        } else {
          console.error("Invalid employees data format");
          setEmployees([]);
          setFilteredEmployees([]);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
        setFilteredEmployees([]);
      }
    };

    fetchEmployees();
  }, [user]); // Only depend on user

  // Remove the problematic useEffect that was causing infinite re-renders
  // and replace with this simple filter function called on search change:
  const handleEmployeeSearch = (searchTerm) => {
    setEmployeeSearchTerm(searchTerm);

    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp => {
        const nameMatch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const teamMatch = emp.team?.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || emailMatch || teamMatch;
      });
      setFilteredEmployees(filtered);
    }
  };
  /* --- Fetch worklogs --- */
  useEffect(() => {
    if (!user) return;
    fetchWorklogs();
  }, [user, startISO, endISO, selectedEmployees, selectedAuditStatuses, selectedWorkModes, selectedTeams]);

  const fetchWorklogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${API_BASE_URL}/admin/worklogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startISO,
          endDate: endISO,
          employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
          auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
          workModes: selectedWorkModes.length > 0 ? selectedWorkModes : undefined,
          teams: selectedTeams.length > 0 ? selectedTeams : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWorklogsByDate(data.worklogsByDate || {});
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch worklogs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* --- Derived helpers --- */
  const sortedDateKeys = useMemo(
    () => Object.keys(worklogsByDate).sort((a, b) => new Date(b) - new Date(a)),
    [worklogsByDate]
  );

  const withinDplus3 = (dateKey) => {
    if (!dateKey) return false;
    const D = new Date(dateKey);
    const deadline = new Date(D);
    deadline.setUTCDate(D.getUTCDate() + 3);
    deadline.setUTCHours(23, 59, 59, 999);
    return new Date() <= deadline;
  };

  const withinDplus5 = (dateKey) => {
    if (!dateKey) return false;
    const D = new Date(dateKey);
    const deadline = new Date(D);
    deadline.setUTCDate(D.getUTCDate() + 5);
    deadline.setUTCHours(23, 59, 59, 999);
    return new Date() <= deadline;
  };

  // Group by team first, then by employee
  const groupByTeamAndEmployee = (items) => {
    const byTeam = {};
    for (const row of items) {
      const team = row.team || "Unknown";
      if (!byTeam[team]) byTeam[team] = {};
      if (!byTeam[team][row.employeeName]) byTeam[team][row.employeeName] = [];
      byTeam[team][row.employeeName].push(row);
    }

    // Sort teams and employees
    const sortedTeams = {};
    Object.keys(byTeam).sort().forEach(team => {
      sortedTeams[team] = Object.fromEntries(
        Object.keys(byTeam[team])
          .sort((a, b) => a.localeCompare(b))
          .map(emp => [emp, byTeam[team][emp]])
      );
    });

    return sortedTeams;
  };

  // Calculate total hours for an employee on a specific date
  const calculateTotalHours = (rows) => {
    return rows.reduce((total, row) => total + (parseFloat(row.hoursSpent) || 0), 0);
  };

  // Get background color based on total hours
  const getHoursBgColor = (totalHours) => {
    if (totalHours >= 6.5 && totalHours <= 7.5) return "bg-emerald-100";
    if (totalHours < 6.5) return "bg-red-100";
    if (totalHours > 7.5) return "bg-blue-100";
    return "";
  };

  const { actionablePendingCount, actionableRePendingCount } = useMemo(() => {
    let pending = 0;
    let repending = 0;
    for (const dateKey of Object.keys(worklogsByDate)) {
      for (const row of worklogsByDate[dateKey] || []) {
        if (row.auditStatus === "Pending" && withinDplus3(dateKey)) pending++;
        if (row.auditStatus === "Re-Pending" && withinDplus5(dateKey)) repending++;
      }
    }
    return { actionablePendingCount: pending, actionableRePendingCount: repending };
  }, [worklogsByDate]);

  const rowClassForAudit = (status) => {
    if (status === "Approved" || status === "Re-Approved") return "bg-emerald-50/70";
    if (status === "Rejected" || status === "Re-Rejected") return "bg-rose-50/70";
    if (status === "Re-Pending") return "bg-amber-50";
    if (status === "Pending") return "bg-yellow-50";
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
    if (status === "Re-Pending")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-xs font-medium">
          <Clock className="w-4 h-4" /> Re-Pending
        </span>
      );
    if (status === "Re-Approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 text-emerald-800 px-2 py-0.5 text-xs font-medium">
          <CheckCircle className="w-4 h-4" /> Re-Approved
        </span>
      );
    if (status === "Re-Rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-200 text-rose-800 px-2 py-0.5 text-xs font-medium">
          <XCircle className="w-4 h-4" /> Re-Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
        <Clock className="w-4 h-4" /> Pending
      </span>
    );
  };

  // Get team color class
  const getTeamColorClass = (team) => {
    return TEAM_COLORS[team] || "bg-gray-100 border-gray-300 text-gray-800";
  };

  /* --- Updates --- */
  const mutateLocalRow = (dateKey, id, auditStatus) => {
    setWorklogsByDate((prev) => {
      const next = { ...prev };
      if (!next[dateKey]) return next;
      next[dateKey] = next[dateKey].map((r) => (r._id === id ? { ...r, auditStatus } : r));
      return next;
    });
  };

  const updateWorklogStatus = async (worklogId, status, dateKey, adminComments = "") => {
    try {
      setUpdating((p) => ({ ...p, [worklogId]: true }));
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${API_BASE_URL}/admin/worklogs/update-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          worklogId,
          auditStatus: status,
          adminComments: adminComments || undefined
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      mutateLocalRow(dateKey, worklogId, status);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${status.toLowerCase()} worklog. Please try again.`);
    } finally {
      setUpdating((p) => ({ ...p, [worklogId]: false }));
    }
  };

  const handleApprove = (id, dateKey) => updateWorklogStatus(id, "Approved", dateKey);
  const handleReject = (id, dateKey) => {
    if (!window.confirm("Are you sure you want to reject this entry?")) return;
    updateWorklogStatus(id, "Rejected", dateKey);
  };
  const handleReApprove = (id, dateKey) => updateWorklogStatus(id, "Re-Approved", dateKey);
  const handleReReject = (id, dateKey) => {
    if (!window.confirm("Are you sure you want to re-reject this entry?")) return;
    updateWorklogStatus(id, "Re-Rejected", dateKey);
  };

  // New handlers for change to approve/reject
  const handleChangeToApprove = (id, dateKey, currentStatus) => {
    const newStatus = currentStatus === "Rejected" ? "Approved" : "Re-Approved";
    updateWorklogStatus(id, newStatus, dateKey);
  };

  const handleChangeToReject = (id, dateKey, currentStatus) => {
    if (!window.confirm("Are you sure you want to reject this entry?")) return;
    const newStatus = currentStatus === "Approved" ? "Rejected" : "Re-Rejected";
    updateWorklogStatus(id, newStatus, dateKey);
  };

  const handleApproveAll = async (dateKey, employeeName) => {
    const key = `${dateKey}|${employeeName}`;
    try {
      setBulkUpdating((p) => ({ ...p, [key]: true }));
      const token = localStorage.getItem("authToken");
      const rows = (worklogsByDate[dateKey] || []).filter(
        (r) => r.employeeName === employeeName && r.auditStatus === "Pending" && withinDplus3(dateKey)
      );
      const ids = rows.map((r) => r._id);
      if (ids.length === 0) return;

      const res = await fetch(`${API_BASE_URL}/admin/worklogs/bulk-update-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          worklogIds: ids,
          auditStatus: "Approved",
          adminComments: `Bulk approved by admin on ${new Date().toISOString().split('T')[0]}`
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();

      setWorklogsByDate((prev) => {
        const next = { ...prev };
        next[dateKey] = next[dateKey].map((row) =>
          row.employeeName === employeeName && row.auditStatus === "Pending" && withinDplus3(dateKey)
            ? { ...row, auditStatus: "Approved" }
            : row
        );
        return next;
      });
    } catch (err) {
      console.error(err);
      alert("Approve All failed. Please try again.");
    } finally {
      setBulkUpdating((p) => ({ ...p, [key]: false }));
    }
  };

  /* --- Date filter helpers (SPOC style) --- */
  const handleCalendarDateSelect = (iso) => {
    if (iso > todayISO) return;

    if (!tempStart || (tempStart && tempEnd && !isSelectingRange)) {
      // Start new selection
      setTempStart(iso);
      setTempEnd(null);
      setIsSelectingRange(true);
    } else if (tempStart && !tempEnd && isSelectingRange) {
      // Complete the range and auto-apply
      let finalStart = tempStart;
      let finalEnd = iso;

      if (iso >= tempStart) {
        finalEnd = iso;
      } else {
        finalEnd = tempStart;
        finalStart = iso;
      }

      setTempStart(finalStart);
      setTempEnd(finalEnd);
      setIsSelectingRange(false);

      // Auto-apply the selection
      setStartISO(finalStart);
      setEndISO(finalEnd);
      setDatePopoverOpen(false);
    } else {
      // Start new selection
      setTempStart(iso);
      setTempEnd(null);
      setIsSelectingRange(true);
    }
  };

  const handleQuickDateSelect = (days) => {
    const endDate = todayISO;
    const startDate = days === 1 ? todayISO : isoNDaysAgo(days - 1);

    // Auto-apply for quick selections
    setStartISO(startDate);
    setEndISO(endDate);
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsSelectingRange(false);
    setDatePopoverOpen(false);
  };

  const labelForFilter = () =>
    startISO === endISO ? formatISOToHuman(startISO) : `${formatISOToHuman(startISO)} – ${formatISOToHuman(endISO)}`;

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
                Admin Dashboard <span className="hidden sm:inline">- Work Log</span>
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
                {!mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
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
              {/* Date Picker (SPOC style) */}
              <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date Range</label>
                <button
                  onClick={() => setDatePopoverOpen((o) => !o)}
                  className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs lg:text-sm font-medium truncate">{labelForFilter()}</span>
                  </span>
                  <span className="text-xs text-slate-500 ml-2 flex-shrink-0">Range</span>
                </button>

                {datePopoverOpen && (
                  <div className="absolute z-50 mt-1 left-0 top-full bg-white border rounded-xl shadow-2xl w-full max-w-xs">
                    <div className="px-3 py-2 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
                      <div className="text-sm font-semibold text-slate-800">Select Date Range</div>
                      <button
                        onClick={() => setDatePopoverOpen(false)}
                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                        aria-label="Close calendar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="px-2 py-1 bg-blue-50 border-b">
                      <div className="text-xs font-medium text-slate-700 mb-1">Quick Select:</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => handleQuickDateSelect(1)}
                          className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect(3)}
                          className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
                        >
                          Past 3 Days
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect(7)}
                          className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
                        >
                          Past 1 Week
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect(30)}
                          className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
                        >
                          Past 1 Month
                        </button>
                      </div>
                    </div>

                    <div className="p-2">
                      <div className="mb-1 text-xs text-slate-600 bg-amber-50 p-1 rounded border border-amber-200">
                        <strong>How to select:</strong> Click start date, then end date.
                        {isSelectingRange && tempStart && (
                          <div className="mt-0.5 font-medium text-amber-700">
                            Starting from {formatISOToHuman(tempStart)}
                          </div>
                        )}
                        {tempStart && tempEnd && !isSelectingRange && (
                          <div className="mt-0.5 font-medium text-green-700">
                            Selected: {formatISOToHuman(tempStart)} to {formatISOToHuman(tempEnd)}
                          </div>
                        )}
                      </div>

                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), -1)))}
                          className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <div className="text-xs font-medium min-w-[100px] text-center">{formatMonthKey(activeMonth)}</div>
                        <button
                          onClick={() => {
                            const nextM = addMonths(parseMonthKey(activeMonth), 1);
                            if (isMonthFullyInFuture(nextM)) return;
                            setActiveMonth(toMonthKey(nextM));
                          }}
                          className="p-0.5 hover:bg-slate-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Next month"
                          disabled={isMonthFullyInFuture(addMonths(parseMonthKey(activeMonth), 1))}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Calendar grid */}
                      <CalendarGrid
                        monthKey={activeMonth}
                        tempStart={tempStart}
                        tempEnd={tempEnd}
                        onPick={handleCalendarDateSelect}
                        isSelectingRange={isSelectingRange}
                      />
                    </div>

                    <div className="px-2 py-1 border-t bg-slate-50 rounded-b-xl">
                      <div className="text-xs text-slate-600">
                        {tempStart && tempEnd ? (
                          <span>Selected: <span className="font-medium">{tempStart === tempEnd ? formatISOToHuman(tempStart) : `${formatISOToHuman(tempStart)} – ${formatISOToHuman(tempEnd)}`}</span></span>
                        ) : tempStart ? (
                          <span>Start: <span className="font-medium">{formatISOToHuman(tempStart)}</span></span>
                        ) : (
                          <span>Click a date to start</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Employees multi-select with Search - COMPLETELY FIXED VERSION */}
              <div className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Employees</label>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEmpDropdown((o) => !o);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                    {selectedEmployees.length === 0 ? (
                      <span className="text-slate-600">All employees</span>
                    ) : (
                      selectedEmployees.slice(0, 3).map((name) => (
                        <span key={name} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {name}
                        </span>
                      ))
                    )}
                    {selectedEmployees.length > 3 && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        +{selectedEmployees.length - 3} more
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showEmpDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showEmpDropdown && (
                  <div
                    className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2">
                          <UsersIcon className="w-3.5 h-3.5" />
                          Select employees
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedEmployees(employees.map(emp => emp.name || emp.email));
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            Select All
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedEmployees([]);
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Search Input - SIMPLIFIED */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={employeeSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEmployeeSearchTerm(value);

                            if (!value.trim()) {
                              setFilteredEmployees(employees);
                            } else {
                              const term = value.toLowerCase();
                              const filtered = employees.filter(emp => {
                                const nameMatch = (emp.name || '').toLowerCase().includes(term);
                                const emailMatch = (emp.email || '').toLowerCase().includes(term);
                                const teamMatch = (emp.team || '').toLowerCase().includes(term);
                                return nameMatch || emailMatch || teamMatch;
                              });
                              setFilteredEmployees(filtered);
                            }
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                        {employeeSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEmployeeSearchTerm("");
                              setFilteredEmployees(employees);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" /> {/* Fixed: Use X instead of XIcon */}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                      {filteredEmployees.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">
                          {employeeSearchTerm ? "No employees found" : "No employees available"}
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const employeeName = emp.name || emp.email || "Unknown";
                          return (
                            <div
                              key={emp._id || employeeName}
                              className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm border-b last:border-b-0"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedEmployees(prev => {
                                  if (prev.includes(employeeName)) {
                                    return prev.filter(n => n !== employeeName);
                                  } else {
                                    return [...prev, employeeName];
                                  }
                                });
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(employeeName)}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (e.target.checked) {
                                    setSelectedEmployees((p) => [...p, employeeName]);
                                  } else {
                                    setSelectedEmployees((p) => p.filter((n) => n !== employeeName));
                                  }
                                }}
                                className="mr-2"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium truncate">{employeeName}</span>
                                {emp.team && (
                                  <span className="text-xs text-slate-500 truncate">{emp.team}</span>
                                )}
                                {emp.email && emp.name && (
                                  <span className="text-xs text-slate-400 truncate">{emp.email}</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selection summary */}
                    <div className="px-3 py-2 text-xs text-slate-500 border-t bg-slate-50">
                      {selectedEmployees.length === 0 ? (
                        "No employees selected"
                      ) : (
                        `${selectedEmployees.length} employee${selectedEmployees.length !== 1 ? 's' : ''} selected`
                      )}
                      {employeeSearchTerm && filteredEmployees.length > 0 && (
                        <span className="ml-2">
                          ({filteredEmployees.length} found)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Status multi-select */}
              <div ref={statusRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Audit Status</label>
                <button
                  onClick={() => setShowStatusDropdown((o) => !o)}
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

              {/* Work Mode multi-select (new) */}
              <div ref={workModeRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Work Mode</label>
                <button
                  onClick={() => setShowWorkModeDropdown((o) => !o)}
                  className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                    {selectedWorkModes.length === 0 ? (
                      <span className="text-slate-600">All work modes</span>
                    ) : (
                      selectedWorkModes.map((mode) => (
                        <span key={mode} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {mode}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showWorkModeDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showWorkModeDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5" />
                        Select work modes
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedWorkModes([...ALL_WORK_MODES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
                        <button onClick={() => setSelectedWorkModes([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
                      </div>
                    </div>
                    {ALL_WORK_MODES.map((mode) => (
                      <label key={mode} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                        <input
                          type="checkbox"
                          value={mode}
                          checked={selectedWorkModes.includes(mode)}
                          onChange={() =>
                            setSelectedWorkModes((prev) =>
                              prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
                            )
                          }
                          className="mr-2"
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Teams multi-select (new) */}
              <div ref={teamRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Teams</label>
                <button
                  onClick={() => setShowTeamDropdown((o) => !o)}
                  className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                >
                  <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                    {selectedTeams.length === 0 ? (
                      <span className="text-slate-600">All teams</span>
                    ) : (
                      selectedTeams.map((team) => (
                        <span key={team} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColorClass(team)}`}>
                          {team}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showTeamDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showTeamDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5" />
                        Select teams
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedTeams([...ALL_TEAMS])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
                        <button onClick={() => setSelectedTeams([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
                      </div>
                    </div>
                    {ALL_TEAMS.map((team) => (
                      <label key={team} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                        <input
                          type="checkbox"
                          value={team}
                          checked={selectedTeams.includes(team)}
                          onChange={() =>
                            setSelectedTeams((prev) =>
                              prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
                            )
                          }
                          className="mr-2"
                        />
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${TEAM_COLORS[team]?.split(' ')[0]}`}></span>
                        {team}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary info */}
              <div className="w-full lg:w-auto text-xs text-slate-700 lg:ml-auto">
                <div className="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:gap-4">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-amber-100 text-amber-800">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{actionableRePendingCount} Re-Pending entries</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{actionablePendingCount} Pending entries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div className="flex items-center gap-3 py-6">
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-slate-900" />
              <span className="text-sm lg:text-base text-slate-800">Loading worklogs…</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-rose-500 mr-3" />
                <span className="text-rose-700">{error}</span>
              </div>
              <button onClick={fetchWorklogs} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-sm self-start sm:ml-auto">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && sortedDateKeys.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No Worklogs Found</h3>
              <p className="text-sm lg:text-base text-slate-600">Try changing the date range, employees, or status filters above.</p>
            </div>
          )}

          {/* By Date - Grouped by Team then Employee */}
          {!loading &&
            !error &&
            sortedDateKeys.map((dateKey) => {
              const allRows = worklogsByDate[dateKey] || [];
              const filteredRows =
                selectedAuditStatuses.length === 0 && selectedWorkModes.length === 0 && selectedTeams.length === 0
                  ? allRows
                  : allRows.filter((r) =>
                    (selectedAuditStatuses.length === 0 || selectedAuditStatuses.includes(r.auditStatus)) &&
                    (selectedWorkModes.length === 0 || selectedWorkModes.includes(r.workMode)) &&
                    (selectedTeams.length === 0 || selectedTeams.includes(r.team))
                  );
              if (filteredRows.length === 0) return null;

              const groupedByTeam = groupByTeamAndEmployee(filteredRows);

              return (
                <section key={dateKey} className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                      {formatISOToHuman(dateKey)}
                      <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
                        {filteredRows.length} entries
                      </span>
                    </h2>
                  </div>

                  {/* Desktop grouped tables by Team > Employee */}
                  <div className="hidden lg:block">
                    {Object.keys(groupedByTeam).map((team) => (
                      <div key={team} className="border-b last:border-b-0">
                        {/* Team Header */}
                        <div className={`px-4 py-3 ${getTeamColorClass(team)}`}>
                          <h3 className="text-sm font-semibold">{team}</h3>
                        </div>

                        {/* Employees in this team */}
                        {Object.keys(groupedByTeam[team]).map((emp) => {
                          const rows = groupedByTeam[team][emp];
                          const pendingCount = rows.filter((r) => r.auditStatus === "Pending").length;
                          const rePendingCount = rows.filter((r) => r.auditStatus === "Re-Pending").length;
                          const totalHours = calculateTotalHours(rows);
                          const hoursBgColor = getHoursBgColor(totalHours);
                          const key = `${dateKey}|${emp}`;
                          const canApproveAll = pendingCount > 0;

                          return (
                            <div key={emp} className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                                    {emp.split(" ").map((x) => x[0] || "").join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{emp}</div>
                                    <div className="text-xs text-slate-500">
                                      {pendingCount} Pending , {rePendingCount} Re-Pending
                                    </div>
                                  </div>
                                  <div className={`ml-4 px-3 py-1 rounded-full ${hoursBgColor} text-xs font-medium`}>
                                    Total Hours: {totalHours.toFixed(1)}
                                  </div>
                                </div>

                                <button
                                  disabled={!canApproveAll || !!bulkUpdating[key]}
                                  onClick={() => handleApproveAll(dateKey, emp)}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${canApproveAll ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    }`}
                                >
                                  {bulkUpdating[key] ? (
                                    <span className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                      Approving…
                                    </span>
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Approve All (Pending)
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                      <Th>Work Mode</Th>
                                      <Th>Project</Th>
                                      <Th>Task</Th>
                                      <Th>Book Element</Th>
                                      <Th>Chapter No</Th>
                                      <Th>Hours Spent</Th>
                                      <Th>No. of Units</Th>
                                      <Th>Unit Type</Th>
                                      <Th>Status</Th>
                                      <Th>Due On</Th>
                                      <Th>Details</Th>
                                      <Th>Audit Status</Th>
                                      <Th>Action</Th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((log) => {
                                      const isPending = log.auditStatus === "Pending";
                                      const isRePending = log.auditStatus === "Re-Pending";
                                      const isApproved = log.auditStatus === "Approved";
                                      const isRejected = log.auditStatus === "Rejected";
                                      const isReApproved = log.auditStatus === "Re-Approved";
                                      const isReRejected = log.auditStatus === "Re-Rejected";

                                      return (
                                        <tr key={log._id} className={`${rowClassForAudit(log.auditStatus)} border-t`}>
                                          <Td>{log.workMode}</Td>
                                          <Td className="max-w-[260px] truncate" title={log.projectName}>
                                            {log.projectName}
                                          </Td>
                                          <Td>{log.task}</Td>
                                          <Td>{log.bookElement}</Td>
                                          <Td>{log.chapterNo}</Td>
                                          <Td>{log.hoursSpent}</Td>
                                          <Td>{log.noOfUnits}</Td>
                                          <Td>{log.unitType}</Td>
                                          <Td>{log.status}</Td>
                                          <Td>{formatISOToHuman(log.dueOn)}</Td>
                                          <Td className="max-w-[220px] whitespace-normal break-words">
                                            {log.details || "-"}
                                          </Td>
                                          <Td>
                                            <AuditBadge status={log.auditStatus} />
                                          </Td>
                                          <Td>
                                            {isPending ? (
                                              <div className="flex gap-2">
                                                <button
                                                  className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                                  onClick={() => handleApprove(log._id, dateKey)}
                                                  disabled={!!updating[log._id]}
                                                >
                                                  {updating[log._id] ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                  ) : (
                                                    <Check size={16} />
                                                  )}
                                                </button>
                                                <button
                                                  className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                                  onClick={() => handleReject(log._id, dateKey)}
                                                  disabled={!!updating[log._id]}
                                                >
                                                  {updating[log._id] ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                  ) : (
                                                    <X size={16} />
                                                  )}
                                                </button>
                                              </div>
                                            ) : isRePending ? (
                                              <div className="flex gap-2">
                                                <button
                                                  className="inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                                  onClick={() => handleReApprove(log._id, dateKey)}
                                                  disabled={!!updating[log._id]}
                                                >
                                                  {updating[log._id] ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                  ) : (
                                                    <Check size={16} />
                                                  )}
                                                </button>
                                                <button
                                                  className="inline-flex items-center justify-center bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
                                                  onClick={() => handleReReject(log._id, dateKey)}
                                                  disabled={!!updating[log._id]}
                                                >
                                                  {updating[log._id] ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                  ) : (
                                                    <X size={16} />
                                                  )}
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                {modifying?.id === log._id ? (
                                                  <div className="flex gap-2">
                                                    {(isApproved || isReApproved) && (
                                                      <button
                                                        onClick={() => handleChangeToReject(log._id, dateKey, log.auditStatus)}
                                                        className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1.5 rounded text-xs font-medium"
                                                        disabled={!!updating[log._id]}
                                                      >
                                                        {isReApproved ? "Change to Re-Reject" : "Change to Reject"}
                                                      </button>
                                                    )}
                                                    {(isRejected || isReRejected) && (
                                                      <button
                                                        onClick={() => handleChangeToApprove(log._id, dateKey, log.auditStatus)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded text-xs font-medium"
                                                        disabled={!!updating[log._id]}
                                                      >
                                                        {isReRejected ? "Change to Re-Approve" : "Change to Approve"}
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => setModifying(null)}
                                                      className="bg-gray-200 hover:bg-gray-300 text-slate-700 px-2 py-1.5 rounded text-xs font-medium"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1.5 rounded text-xs font-medium"
                                                    onClick={() => setModifying({ id: log._id, dateKey })}
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </Td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Mobile grouped cards by Team > Employee */}
                  <div className="lg:hidden p-3 sm:p-4 space-y-4 sm:space-y-6">
                    {Object.keys(groupedByTeam).map((team) => (
                      <div key={team} className="rounded-lg border border-slate-200 overflow-hidden">
                        {/* Team Header */}
                        <div className={`px-3 sm:px-4 py-2 ${getTeamColorClass(team)}`}>
                          <h3 className="text-sm font-semibold">{team}</h3>
                        </div>

                        {/* Employees in this team */}
                        {Object.keys(groupedByTeam[team]).map((emp) => {
                          const rows = groupedByTeam[team][emp];
                          const pendingCount = rows.filter((r) => r.auditStatus === "Pending").length;
                          const rePendingCount = rows.filter((r) => r.auditStatus === "Re-Pending").length;
                          const totalHours = calculateTotalHours(rows);
                          const hoursBgColor = getHoursBgColor(totalHours);
                          const key = `${dateKey}|${emp}`;
                          const canApproveAll = pendingCount > 0;

                          return (
                            <div key={emp} className="border-t first:border-t-0">
                              <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-50/70">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                    {emp.split(" ").map((x) => x[0] || "").join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{emp}</div>
                                    <div className="text-xs text-slate-500">
                                      {pendingCount} pending, {rePendingCount} re-pending
                                    </div>
                                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full ${hoursBgColor} text-xs font-medium`}>
                                      Total Hours: {totalHours.toFixed(1)}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  disabled={!canApproveAll || !!bulkUpdating[key]}
                                  onClick={() => handleApproveAll(dateKey, emp)}
                                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium flex-shrink-0 ${canApproveAll ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    }`}
                                >
                                  {bulkUpdating[key] ? (
                                    <span className="flex items-center gap-1">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                      <span className="hidden sm:inline">Approving…</span>
                                    </span>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="hidden sm:inline">Approve All</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="divide-y">
                                {rows.map((log) => {
                                  const isPending = log.auditStatus === "Pending";
                                  const isRePending = log.auditStatus === "Re-Pending";
                                  const isApproved = log.auditStatus === "Approved";
                                  const isRejected = log.auditStatus === "Rejected";
                                  const isReApproved = log.auditStatus === "Re-Approved";
                                  const isReRejected = log.auditStatus === "Re-Rejected";

                                  return (
                                    <article key={log._id} className={`p-3 sm:p-4 ${rowClassForAudit(log.auditStatus)}`}>
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="min-w-0 flex-1 pr-3">
                                          <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate" title={log.projectName}>
                                            {log.projectName}
                                          </h3>
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {log.task} · {log.bookElement} · Ch {log.chapterNo}
                                          </p>
                                        </div>
                                        <AuditBadge status={log.auditStatus} />
                                      </div>

                                      <dl className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-[13px] mb-4">
                                        <Info label="Work Mode" value={log.workMode} />
                                        <Info label="Hours" value={log.hoursSpent} />
                                        <Info label="Units" value={`${log.noOfUnits} ${log.unitType || ""}`} />
                                        <Info label="Status" value={log.status} />
                                        <Info label="Due On" value={formatISOToHuman(log.dueOn)} />
                                        {log.details && (
                                          <div className="col-span-2">
                                            <dt className="text-slate-500">Details</dt>
                                            <dd className="text-slate-800 break-words">{log.details}</dd>
                                          </div>
                                        )}
                                      </dl>

                                      <div className="flex flex-wrap gap-2">
                                        {isPending ? (
                                          <>
                                            <button
                                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex-1 min-w-0"
                                              onClick={() => handleApprove(log._id, dateKey)}
                                              disabled={!!updating[log._id]}
                                            >
                                              {updating[log._id] ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                              ) : (
                                                <>
                                                  <Check size={16} />
                                                  <span>Approve</span>
                                                </>
                                              )}
                                            </button>
                                            <button
                                              className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex-1 min-w-0"
                                              onClick={() => handleReject(log._id, dateKey)}
                                              disabled={!!updating[log._id]}
                                            >
                                              {updating[log._id] ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                              ) : (
                                                <>
                                                  <X size={16} />
                                                  <span>Reject</span>
                                                </>
                                              )}
                                            </button>
                                          </>
                                        ) : isRePending ? (
                                          <>
                                            <button
                                              className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex-1 min-w-0"
                                              onClick={() => handleReApprove(log._id, dateKey)}
                                              disabled={!!updating[log._id]}
                                            >
                                              {updating[log._id] ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                              ) : (
                                                <>
                                                  <Check size={16} />
                                                  <span>Re-Approve</span>
                                                </>
                                              )}
                                            </button>
                                            <button
                                              className="inline-flex items-center gap-1 bg-rose-700 hover:bg-rose-800 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex-1 min-w-0"
                                              onClick={() => handleReReject(log._id, dateKey)}
                                              disabled={!!updating[log._id]}
                                            >
                                              {updating[log._id] ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                              ) : (
                                                <>
                                                  <X size={16} />
                                                  <span>Re-Reject</span>
                                                </>
                                              )}
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {modifying?.id === log._id ? (
                                              <div className="flex gap-2">
                                                {(isApproved || isReApproved) && (
                                                  <button
                                                    onClick={() => handleChangeToReject(log._id, dateKey, log.auditStatus)}
                                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1.5 rounded text-xs font-medium"
                                                    disabled={!!updating[log._id]}
                                                  >
                                                    {isReApproved ? "Change to Re-Reject" : "Change to Reject"}
                                                  </button>
                                                )}
                                                {(isRejected || isReRejected) && (
                                                  <button
                                                    onClick={() => handleChangeToApprove(log._id, dateKey, log.auditStatus)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded text-xs font-medium"
                                                    disabled={!!updating[log._id]}
                                                  >
                                                    {isReRejected ? "Change to Re-Approve" : "Change to Approve"}
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => setModifying(null)}
                                                  className="bg-gray-200 hover:bg-gray-300 text-slate-700 px-2 py-1.5 rounded text-xs font-medium"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1.5 rounded text-xs font-medium"
                                                onClick={() => setModifying({ id: log._id, dateKey })}
                                              >
                                                <Pencil className="w-3 h-3" />
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      </main>
    </div>
  );
}

/* =============== SidebarLinks =============== */
function SidebarLinks({ navigate, location, close, pendingCount = 0, projectPendingCount = 0 }) {
  const [openWorklogs, setOpenWorklogs] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);

  // Keep sections open if child page active
  useEffect(() => {
    if (location.pathname.includes("worklog")) setOpenWorklogs(true);
    if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
      setOpenProjects(true);
  }, [location]);

  const handleNavigation = (path) => {
    navigate(path);
    if (close) close();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin-dashboard")}
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
            <span className="transition-transform duration-200">
              {openWorklogs ? "▾" : "▸"}
            </span>
          </button>
          {openWorklogs && (
            <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""}`}
                onClick={() => handleNavigation("/admin/approve-worklogs")}
              >
                Approve Worklogs
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""}`}
                onClick={() => handleNavigation("/admin/edit-worklog-entries")}
              >
                Edit Worklogs
              </button>
            </div>
          )}
        </div>

        {/* Employees */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/handle-employees")}
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
         {/* Teams */}
         <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/team-wise-dropdowns")}
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
            <span className="transition-transform duration-200">
              {openProjects ? "▾" : "▸"}
            </span>
          </button>
          {openProjects && (
            <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""}`}
                onClick={() => handleNavigation("/admin/add-abbreviations")}
              >
                Add Abbreviations
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""}`}
                onClick={() => handleNavigation("/admin/add-project")}
              >
                Add Project
              </button>
              {/* <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("project-requests") ? "bg-gray-700" : ""}`}
                onClick={() => handleNavigation("/admin/project-requests")}
              >
                Project Requests
              </button> */}
            </div>
          )}
        </div>
        {/* ✅ Project Requests with Count Badge */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${location.pathname.includes("project-requests") ? "bg-gray-700" : ""
            }`}
          onClick={() => { navigate("/admin/project-requests"); close && close(); }}
        >
          <span>Project Requests</span>
          {projectPendingCount  > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
              {projectPendingCount > 9 ? "9+" : projectPendingCount}
            </span>
          )}
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "add-unit-type" ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/add-unit-type")}
        >
          Add Unit Type
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "mark-shift" ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/mark-shift")}
        >
          Mark Extra Shift
        </button>
      </nav>
    </div>
  );
}

/* =================== Small components =================== */
function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-500 truncate">{label}</dt>
      <dd className="text-slate-800 break-words">{value ?? "-"}</dd>
    </div>
  );
}
function Th({ children }) {
  return <th className="p-2 text-left border-b border-slate-300 first:pl-3">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`p-2 border-t border-slate-200 align-top ${className}`}>{children}</td>;
}

/* =================== Calendar Grid =================== */
function CalendarGrid({ monthKey, tempStart, tempEnd, onPick, isSelectingRange }) {
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
    if (!iso || !tempStart) return false;
    if (!tempEnd) return iso === tempStart;
    const start = tempStart <= tempEnd ? tempStart : tempEnd;
    const end = tempEnd >= tempStart ? tempEnd : tempStart;
    return iso >= start && iso <= end;
  };

  const isSelectionStart = (iso) => {
    if (!tempStart) return false;
    if (!tempEnd) return iso === tempStart;
    const start = tempStart <= tempEnd ? tempStart : tempEnd;
    return iso === start;
  };

  const isSelectionEnd = (iso) => {
    if (!tempStart || !tempEnd || tempStart === tempEnd) return false;
    const end = tempEnd >= tempStart ? tempEnd : tempStart;
    return iso === end;
  };

  return (
    <div className="min-h-[160px]">
      <div className="grid grid-cols-7 text-[10px] text-slate-500 mb-0.5 font-medium">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} className="text-center py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((iso, idx) => {
          if (!iso) return <div key={idx} className="h-5" />;

          const disabled = iso > today;
          const selected = isInSelection(iso);
          const isStart = isSelectionStart(iso);
          const isEnd = isSelectionEnd(iso);
          const isToday = iso === today;

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] transition-all duration-200 relative font-medium
                                ${disabled ? "opacity-30 cursor-not-allowed text-slate-400" : "hover:bg-indigo-50 cursor-pointer text-slate-700"}
                                ${selected && !isStart && !isEnd ? "bg-indigo-100 text-indigo-700" : ""}
                                ${isStart || isEnd ? "bg-indigo-600 text-white shadow" : ""}
                                ${isToday && !selected ? "ring-1 ring-indigo-300" : ""}
                                ${isSelectingRange && tempStart && !disabled ? "hover:bg-indigo-200" : ""}
                            `}
              title={`${formatISOToHuman(iso)}${isToday ? ' (Today)' : ''}${disabled ? ' (Future date)' : ''}`}
            >
              {new Date(iso).getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
/* =================== Date helpers =================== */
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

/* =================== Improved Outclick hook =================== */
function useOutclick(onOut) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        // Add a small delay to allow click events to complete
        setTimeout(() => {
          onOut?.();
        }, 10);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onOut]);
  return ref;
}
