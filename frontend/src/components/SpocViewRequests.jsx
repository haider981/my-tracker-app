import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Filter,
  ChevronDown,
  Edit3,
  Pencil
} from "lucide-react";

// --- Mock JWT decode (no external deps) ---
const jwtDecode = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    throw new Error("Invalid token");
  }
};

// --- Config ---
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

export default function SpocViewRequests() {
  const navigate = useNavigate();
  const location = useLocation();

  // UI / Auth
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [approveMissingCount, setApproveMissingCount] = useState(0);

  // Data
  const [worklogsByDate, setWorklogsByDate] = useState({});
  const [employees, setEmployees] = useState([]);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [bulkUpdating, setBulkUpdating] = useState({});
  const [expandedAction, setExpandedAction] = useState(null);

  // Filters: employees
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empRef = useOutclick(() => setShowEmpDropdown(false));

  // Filters: dates
  const todayISO = stripToISO(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [tempStart, setTempStart] = useState(isoNDaysAgo(3));
  const [tempEnd, setTempEnd] = useState(todayISO);
  const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
  const [startISO, setStartISO] = useState(isoNDaysAgo(3));
  const [endISO, setEndISO] = useState(todayISO);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const popRef = useOutclick(() => setDatePopoverOpen(false));

  // Filters: audit statuses (Default to all statuses selected)
  const ALL_STATUSES = ["Pending", "Approved", "Rejected"];
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useOutclick(() => setShowStatusDropdown(false));
  const [selectedAuditStatuses, setSelectedAuditStatuses] = useState(["Pending", "Approved", "Rejected"]);

  // Filters: work modes
  const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);
  const workModeRef = useOutclick(() => setShowWorkModeDropdown(false));
  const [selectedWorkModes, setSelectedWorkModes] = useState([]);
  const ALL_WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night", "Leave"];

  // --- Auth check ---
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
          `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
      });
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/spoc/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setUnreadCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch SPOC notification count:", err);
    }
  };

  const fetchSpocCounts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const missingRes = await fetch(`${API_BASE_URL}/spoc/request/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

      if (missingRes.ok) {
        const missingData = await missingRes.json();
        setApproveMissingCount(Number(missingData?.count || 0));
      } else {
        setApproveMissingCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch SPOC sidebar counts:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    fetchSpocCounts();
    const intervalId = setInterval(() => {
      fetchUnreadCount();
      fetchSpocCounts();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  // --- Fetch employees ---
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/spoc/request/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((data) => setEmployees(data.employees || []))
      .catch((err) => console.error("Failed to fetch employees:", err.message));
  }, [user]);

  // --- Fetch worklogs (on filter change) ---
  useEffect(() => {
    if (!user) return;
    fetchWorklogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startISO, endISO, selectedEmployees, selectedAuditStatuses, selectedWorkModes]);

  const fetchWorklogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/spoc/request/worklogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // startDate: startISO,
          // endDate: endISO,
          employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
          auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
          workModes: selectedWorkModes.length > 0 ? selectedWorkModes : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWorklogsByDate(data.worklogsByDate || {});
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Derived helpers ---
  const sortedDateKeys = useMemo(
    () => Object.keys(worklogsByDate).sort((a, b) => new Date(b) - new Date(a)),
    [worklogsByDate]
  );

  const groupByEmployee = (items) => {
    const byEmp = {};
    for (const row of items) {
      if (!byEmp[row.employeeName]) byEmp[row.employeeName] = [];
      byEmp[row.employeeName].push(row);
    }
    return Object.fromEntries(Object.keys(byEmp).sort((a, b) => a.localeCompare(b)).map((k) => [k, byEmp[k]]));
  };

  const { actionablePendingCount } = useMemo(() => {
    let pending = 0;
    for (const dateKey of Object.keys(worklogsByDate)) {
      for (const row of worklogsByDate[dateKey] || []) {
        if (row.auditStatus === "Pending") pending++;
      }
    }
    return { actionablePendingCount: pending };
  }, [worklogsByDate]);

  const rowClassForAudit = (status) => {
    if (status === "Approved") return "bg-emerald-50/70";
    if (status === "Rejected") return "bg-rose-50/70";
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
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
        <Clock className="w-4 h-4" /> Pending
      </span>
    );
  };

  const mutateLocalRow = (dateKey, id, auditStatus) => {
    setWorklogsByDate((prev) => {
      const next = { ...prev };
      if (!next[dateKey]) return next;
      next[dateKey] = next[dateKey].map((r) => (r._id === id ? { ...r, auditStatus } : r));
      return next;
    });
  };

  const calculateTotalHours = (rows) => {
    return rows.reduce((total, row) => total + (parseFloat(row.hoursSpent) || 0), 0);
  };

  const getHoursBgColor = (totalHours) => {
    if (totalHours >= 6.5 && totalHours <= 7.5) return "bg-emerald-100";
    if (totalHours < 6.5) return "bg-red-100";
    if (totalHours > 7.5) return "bg-blue-100";
    return "";
  };

  const updateWorklogStatus = async (worklogId, status, dateKey) => {
    try {
      setUpdating((p) => ({ ...p, [worklogId]: true }));
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/spoc/request/worklogs/update-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worklogId, auditStatus: status }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      mutateLocalRow(dateKey, worklogId, status);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${status.toLowerCase()} request. Please try again.`);
    } finally {
      setUpdating((p) => ({ ...p, [worklogId]: false }));
    }
  };

  const handleApprove = (id, dateKey) => {
    setExpandedAction(null);
    updateWorklogStatus(id, "Approved", dateKey);
  };
  const handleReject = (id, dateKey) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    setExpandedAction(null);
    updateWorklogStatus(id, "Rejected", dateKey);
  };

  const handleApproveAll = async (dateKey, employeeName) => {
    const key = `${dateKey}|${employeeName}`;
    try {
      setBulkUpdating((p) => ({ ...p, [key]: true }));
      const token = localStorage.getItem("authToken");
      const rows = (worklogsByDate[dateKey] || []).filter(
        (r) => r.employeeName === employeeName && r.auditStatus === "Pending"
      );
      const ids = rows.map((r) => r._id);
      if (ids.length === 0) return;

      const res = await fetch(`${API_BASE_URL}/spoc/request/worklogs/bulk-update-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ worklogIds: ids, auditStatus: "Approved" }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();

      setWorklogsByDate((prev) => {
        const next = { ...prev };
        next[dateKey] = next[dateKey].map((row) =>
          row.employeeName === employeeName && row.auditStatus === "Pending"
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

  const labelForFilter = () => (startISO === endISO ? formatISOToHuman(startISO) : `${formatISOToHuman(startISO)} – ${formatISOToHuman(endISO)}`);

  const handleCalendarDateSelect = (iso) => {
    if (iso > todayISO) return;

    if (!tempStart || (tempStart && tempEnd && !isSelectingRange)) {
      setTempStart(iso);
      setTempEnd(null);
      setIsSelectingRange(true);
    } else if (tempStart && !tempEnd && isSelectingRange) {
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

      setStartISO(finalStart);
      setEndISO(finalEnd);
      setDatePopoverOpen(false);
    } else {
      setTempStart(iso);
      setTempEnd(null);
      setIsSelectingRange(true);
    }
  };

  const handleQuickDateSelect = (days) => {
    const endDate = todayISO;
    const startDate = days === 1 ? todayISO : isoNDaysAgo(days - 1);

    setStartISO(startDate);
    setEndISO(endDate);
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsSelectingRange(false);
    setDatePopoverOpen(false);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="mr-3 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none lg:hidden"
              >
                <span className="sr-only">Toggle sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                <span className="block sm:inline">SPOC Dashboard</span>
                <span className="hidden sm:inline"> — Approve Worklogs</span>
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
                onClick={() => {
                  localStorage.removeItem("authToken");
                  if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
                  navigate("/");
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen((m) => !m)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
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

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-600" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-slate-300">{user.email}</div>
                  </div>
                </div>
                <div className="px-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem("authToken");
                      if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Layout Container */}
      <div className="pt-16 flex w-full">
        {/* Mobile Sidebar Overlay and Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
          <SidebarLinks navigate={navigate} location={location} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
        </aside>

        {/* Main */}
        <div className="flex-1 w-full lg:ml-[288px] font-sans min-w-0">
          <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-full overflow-hidden">
            {/* Filters */}
            <div className="rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <Filter className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
                <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters</h3>
              </div>

              <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">
                {/* Date picker */}
                <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
                  <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date Range</label>
                  <button
                    onClick={() => setDatePopoverOpen((o) => !o)}
                    className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
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

                {/* Employees multi-select */}
                <div ref={empRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                  <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Employees</label>
                  <button
                    onClick={() => setShowEmpDropdown((o) => !o)}
                    className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                  >
                    <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                      {selectedEmployees.length === 0 ? (
                        <span className="text-slate-600">All employees</span>
                      ) : (
                        selectedEmployees.map((name) => (
                          <span key={name} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {name}
                          </span>
                        ))
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showEmpDropdown ? "rotate-180" : "rotate-0"}`} />
                  </button>

                  {showEmpDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Select employees
                      </div>
                      {employees.map((emp) => (
                        <label key={emp.id || emp.name} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                          <input
                            type="checkbox"
                            value={emp.name}
                            checked={selectedEmployees.includes(emp.name)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedEmployees((p) => [...p, emp.name]);
                              else setSelectedEmployees((p) => p.filter((n) => n !== emp.name));
                            }}
                            className="mr-2"
                          />
                          {emp.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {/* Audit Status multi-select */}
                <div ref={statusRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                  <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Status</label>
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
                          <Users className="w-3.5 h-3.5" />
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

                {/* Work Mode multi-select */}
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
                          <Users className="w-3.5 h-3.5" />
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

                {/* Summary info */}
                <div className="w-full lg:w-auto text-xs text-slate-700 lg:ml-auto">
                  <div className="flex flex-col space-y-2 lg:space-y-1 lg:items-end">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">{actionablePendingCount} Pending requests</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* States */}
            {loading && (
              <div className="flex items-center gap-3 py-6">
                <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-slate-900" />
                <span className="text-sm lg:text-base text-slate-800">Loading requests…</span>
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
                <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No Requests Found</h3>
                <p className="text-sm lg:text-base text-slate-600">Try changing the date range, employees, or status filters above.</p>
              </div>
            )}

            {/* By Date */}
            {!loading &&
              !error &&
              sortedDateKeys.map((dateKey) => {
                const allRows = worklogsByDate[dateKey] || [];
                const filteredRows =
                  selectedAuditStatuses.length === 0 && selectedWorkModes.length === 0
                    ? allRows
                    : allRows.filter((r) =>
                      (selectedAuditStatuses.length === 0 || selectedAuditStatuses.includes(r.auditStatus)) &&
                      (selectedWorkModes.length === 0 || selectedWorkModes.includes(r.workMode))
                    );
                if (filteredRows.length === 0) return null;

                const grouped = groupByEmployee(filteredRows);

                return (
                  <section key={dateKey} className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        {formatISOToHuman(dateKey)}
                        <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
                          {filteredRows.length} entries
                        </span>
                      </h2>
                    </div>

                    {/* Desktop grouped tables */}
                    <div className="hidden lg:block">
                      {Object.keys(grouped).map((emp) => {
                        const rows = grouped[emp];
                        const pendingCount = rows.filter((r) => r.auditStatus === "Pending").length;
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
                                    {pendingCount} Pending
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
                                    <Th>Reason for Late Entry</Th>
                                    <Th>Request Status</Th>
                                    <Th>Action</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((log) => {
                                    const isPending = log.auditStatus === "Pending";

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
                                        <Td className="max-w-[220px] whitespace-normal break-words">
                                          {log.reasonForLateEntry || "-"}
                                        </Td>
                                        <Td>
                                          <AuditBadge status={log.auditStatus} />
                                        </Td>
                                        <Td className="text-center align-middle">
                                          {isPending ? (
                                            <div className="flex items-center justify-center gap-2">
                                              <button
                                                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white"
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
                                          ) : expandedAction === log._id && !updating[log._id] ? (
                                            <div className="flex items-center justify-center gap-2">
                                              {log.auditStatus === "Approved" ? (
                                                <button
                                                  onClick={() => {
                                                    handleReject(log._id, dateKey);
                                                    setExpandedAction(null);
                                                  }}
                                                  className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md flex items-center gap-1 transition-all"
                                                >
                                                  <XCircle size={12} />
                                                  Change to Reject
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    handleApprove(log._id, dateKey);
                                                    setExpandedAction(null);
                                                  }}
                                                  className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1 transition-all"
                                                >
                                                  <CheckCircle size={12} />
                                                  Change to Approve
                                                </button>
                                              )}

                                              <button
                                                onClick={() => setExpandedAction(null)}
                                                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 transition-all"
                                              >
                                                <X size={12} />
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center">
                                              <button
                                                onClick={() => setExpandedAction(log._id)}
                                                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-slate-600 hover:bg-slate-700 text-white"
                                                disabled={!!updating[log._id]}
                                              >
                                                {updating[log._id] ? (
                                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                ) : (
                                                  <Edit3 size={16} />
                                                )}
                                              </button>
                                            </div>
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

                    {/* Mobile grouped cards */}
                    <div className="lg:hidden p-3 sm:p-4 space-y-4 sm:space-y-6">
                      {Object.keys(grouped).map((emp) => {
                        const rows = grouped[emp];
                        const pendingCount = rows.filter((r) => r.auditStatus === "Pending").length;
                        const totalHours = calculateTotalHours(rows);
                        const hoursBgColor = getHoursBgColor(totalHours);
                        const key = `${dateKey}|${emp}`;
                        const canApproveAll = pendingCount > 0;

                        return (
                          <div key={emp} className="rounded-lg border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-50/70">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                  {emp.split(" ").map((x) => x[0] || "").join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-slate-900 truncate">{emp}</div>
                                  <div className="text-xs text-slate-500">
                                    {pendingCount} pending
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
                                      {log.reasonForLateEntry && (
                                        <div className="col-span-2">
                                          <dt className="text-slate-500">Reason for Late Entry</dt>
                                          <dd className="text-slate-800 break-words">{log.reasonForLateEntry}</dd>
                                        </div>
                                      )}
                                    </dl>

                                    <div className="flex flex-wrap gap-2">
                                      {isPending ? (
                                        <>
                                          <button
                                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm flex-1 min-w-0 bg-rose-600 hover:bg-rose-700 text-white"
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
                                      ) : (
                                        <div className="relative w-full">
                                          <button
                                            onClick={() => setExpandedAction(expandedAction === log._id ? null : log._id)}
                                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-slate-600 hover:bg-slate-700 text-white w-full justify-center"
                                            disabled={!!updating[log._id]}
                                          >
                                            {updating[log._id] ? (
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            ) : (
                                              <>
                                                <Edit3 size={16} />
                                                <span>Edit Status</span>
                                              </>
                                            )}
                                          </button>

                                          {expandedAction === log._id && !updating[log._id] && (
                                            <div className="absolute left-0 top-full mt-1 z-10 bg-white border rounded-lg shadow-lg py-1 w-full">
                                              {log.auditStatus === "Approved" ? (
                                                <button
                                                  onClick={() => handleReject(log._id, dateKey)}
                                                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 text-sm flex items-center gap-2"
                                                >
                                                  <XCircle size={14} />
                                                  Change to Reject
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleApprove(log._id, dateKey)}
                                                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2"
                                                >
                                                  <CheckCircle size={14} />
                                                  Change to Approve
                                                </button>
                                              )}
                                              <button
                                                onClick={() => setExpandedAction(null)}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                                              >
                                                <X size={14} />
                                                Cancel
                                              </button>
                                            </div>
                                          )}
                                        </div>
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
                  </section>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Sidebar Links Component =================== */
function SidebarLinks({ navigate, location, close, unreadCount = 0, approveMissingCount = 0 }) {
  const handleNavigation = (path) => {
    navigate(path);
    if (close) close();
  };

  const isHomePage = location.pathname === "/spoc-dashboard";
  const isRequestMissingEntryPage = location.pathname.includes("missing-entry-request");
  const isApproveMissingEntryPage = location.pathname.includes("missing-entry-status") || location.pathname.includes("view-requests");
  const isApproveWorklogsPage = location.pathname.includes("approve-worklogs");
  const isNotificationsPage = location.pathname.includes("/spoc/notifications");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${isHomePage ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc-dashboard")}
        >
          Home
        </button>

        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${isApproveWorklogsPage ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc/approve-worklogs")}
        >
          <span>Approve Worklogs</span>
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${isRequestMissingEntryPage ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc/missing-entry-request")}
        >
          Request Missing Entry
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${isApproveMissingEntryPage ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc/missing-entry-status")}
        >
          <span>Approve Missing Entry</span>
          {approveMissingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
              {approveMissingCount > 99 ? "99+" : approveMissingCount}
            </span>
          )}
        </button>

         <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc/add-project")}
        >
          Add Project
        </button>

        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("mark-night-shift") || location.pathname.includes("mark-extra-shift")
            ? "bg-gray-700"
            : ""
            }`}
          onClick={() => handleNavigation("/spoc/mark-night-shift")}
        >
          Mark Extra Shift
        </button>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${isNotificationsPage ? "bg-gray-700" : ""
            }`}
          onClick={() => handleNavigation("/spoc/notifications")}
        >
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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

/* =================== Outclick hook =================== */
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
