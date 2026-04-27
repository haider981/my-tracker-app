import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import {
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Filter as FilterIcon,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  X as XIcon,
  Loader2,
  Search as SearchIcon,
} from "lucide-react";

/* =================== CONFIG =================== */
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

/* =================== CONSTANTS =================== */
const WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night", "Leave"];
const STATUS = ["In Progress", "Delayed", "Completed", "Not approved"];
const HOURS = [
  "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8",
];
const TASKS = ["Analysis", "Book keeping", "Briefing", "Campaign", "CMPL", "CMPL-MS", "Code", "COM", "Coord", "CR1", "CR1 ", "CR2", "CR2 ", "CR3", "CR4", "CR5", "Creative update", "Customer support", "Design", "DRF", "FER", "FINAL", "Final Colour", "Flat colour", "Flat Colouring", "FR", "Generation", "GLANCE", "Interview", "ISBN", "JCR", "KT", "Listing", "Meet", "MEET", "Misc", "MKT Content", "Order generation", "PLAN", "Practice", "Presentation", "QR Gen", "QRY", "R1", "R1 ", "R2", "R2 ", "R3", "R4", "R5", "Rα","Rβ","REC", "Report generation", "Research", "REV", "SCAN", "SET", "Sketch", "Sol", "Stakeholder management", "Stock updation", "TAL", "TAL ", "Task allocation", "Testing", "Training", "Update", "UPL", "Visit","Visual Instructions","VRF-MS", "Webinar", "Website design/check"];
const BASE_BOOK_ELEMENTS = ["Animation", "Audio", "AVLR", "AVLR-Ideation", "AVLR-VO","Activities","Backend", "Banner", "Book title", "Booklet", "Booth design", "Boxes", "Brand signages", "C-STEM", "Chapter", "Collaterals", "Content", "Content creation", "Contents", "Cover", "Creatives", "DB", "Design", "Development", "Diagram", "Digital Marketing", "DLR", "E-com creatives", "E-com sales", "Event", "Exercise", "Flipbook", "Frames", "Frontend","Full book", "Full Video", "Illustration", "Interactive DLR", "Interview", "Layout", "Lesson Plan", "Logos", "Marketing", "Mind Map", "Miscellaneous", "Modules", "OST", "Pamphlet", "Papers", "Photoshoot", "Posters", "Presentation", "Print Media", "Product catalogue", "Product development", "Projects", "Recruitment", "References", "References + Frames", "Research", "Sheets", "Social media creatives", "Solution", "Syllabus", "Test Generator", "TG-QS", "Theory", "Title", "Vehicle Branding", "Video", "Video shoot", "Visual Instructions", "Webpackage", "Webpage"];
const BASE_CHAPTER_NUMBERS = ["Animation", "Appendix", "Approach 1", "Approach 2", "Approach 3", "Audio Editing", "Audio Recording", "Author", "Backend", "Booklet", "Content", "Customer services", "DB", "Drama", "DTP", "Editorial", "Frontend", "Full book", "Full Video", "General", "Grammar", "Misc", "Miscellaneous", "Online Portals", "Papers", "Poetry", "Projects", "Prose", "Reading", "Sales", "Sheets", "Snapshots", "Stakeholder", "Supplementary", "Syllabus", "Teachers", "Title", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6", "Unit 7", "Unit 8", "Unit 9", "Unit 10", "Unit 11", "Unit 12", "Unit 13", "Unit 14", "Unit 15", "Vistas", "Writing",
  ...Array.from({ length: 75 }, (_, i) => String(i + 1))
];
const UNITS = [
  { label: "pages", value: "pages" },
  { label: "frames", value: "frames" },
  { label: "seconds", value: "seconds" },
  { label: "general", value: "general" },
  { label: "count", value: "count" },
  { label: "rows", value: "rows" },
  { label: "correction(s)", value: "corrections" }
];
const AUDIT_STATUSES = ["Pending", "Re-Pending", "Approved", "Rejected", "Re-Approved", "Re-Rejected"];

const HOUR_BUCKETS = [
  { id: "ALL", label: "All", test: () => true },
  { id: "LE6", label: "Sum ≤ 6", test: (h) => h <= 6 },
  { id: "LE65", label: "Sum ≤ 6.5", test: (h) => h <= 6.5 },
  { id: "LE7", label: "Sum ≤ 7", test: (h) => h <= 7 },
  { id: "LE75", label: "Sum ≤ 7.5", test: (h) => h <= 7.5 },
  { id: "GT75", label: "Sum > 7.5", test: (h) => h > 7.5 },
];

// Team colors mapping (same as AdminApproveWorklog)
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

function Label({ children, className = "" }) {
  return (
    <label className={`block text-xs lg:text-sm font-medium text-slate-700 mb-1 ${className}`}>
      {children}
    </label>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-3 py-2 text-left font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 border-t border-slate-200 ${className}`}>
      {children}
    </td>
  );
}

function ErrorText({ text }) {
  if (!text) return null;
  return <div className="text-xs text-rose-600 mt-1">{text}</div>;
}

/* =================== MAIN PAGE =================== */
export default function AdminEditWorklogEntries() {
  const navigate = useNavigate();
  const location = useLocation();
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
        team: decoded.team,
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

  /* ===== Edit Worklogs STATE/LOGIC ===== */

  // Data
  const [worklogsByDate, setWorklogsByDate] = useState({});
  const [employees, setEmployees] = useState([]);

  // Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters: employees
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empRef = useOutclick(() => setShowEmpDropdown(false));

  // Filters: dates
  const todayISO = stripToISO(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [rangeMode, setRangeMode] = useState(true);
  const [tempStart, setTempStart] = useState(isoNDaysAgo(2));
  const [tempEnd, setTempEnd] = useState(todayISO);
  const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
  const [startISO, setStartISO] = useState(isoNDaysAgo(2));
  const [endISO, setEndISO] = useState(todayISO);
  const popRef = useOutclick(() => setDatePopoverOpen(false));

  // Filters: audit statuses (kept for filtering only)
  const ALL_STATUSES = AUDIT_STATUSES;
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useOutclick(() => setShowStatusDropdown(false));
  const [selectedAuditStatuses, setSelectedAuditStatuses] = useState([...ALL_STATUSES]);

  // NEW FILTERS: Work Mode and Teams
  const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);
  const workModeRef = useOutclick(() => setShowWorkModeDropdown(false));
  const [selectedWorkModes, setSelectedWorkModes] = useState([]);

  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const teamRef = useOutclick(() => setShowTeamDropdown(false));
  const [selectedTeams, setSelectedTeams] = useState([]);

  // Filters: hour bucket
  const [selectedHourBucket, setSelectedHourBucket] = useState("ALL");

  // NEW FILTER: Global search
  const [globalSearch, setGlobalSearch] = useState("");

  // Edit / Add modals
  const [globalAddOpen, setGlobalAddOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  const [editForm, setEditForm] = useState(initialFormState());
  const [addForm, setAddForm] = useState(initialFormState());
  const [formErrors, setFormErrors] = useState({});

  // Context for add
  const [addContext, setAddContext] = useState({ dateKey: null, employeeName: null });

  // Project search
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchBy, setSearchBy] = useState("name");
  const suggestRef = useRef(null);

  /* --- Fetch employees --- */
  useEffect(() => {
    if (!user) return;
    fetchEmployees();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setEmployees(data.users || []);

    } catch (err) {
      console.error("Failed to fetch employees:", err.response?.data?.message || err.message);
    }
  };

  /* --- Fetch worklogs (on filter change) --- */
  useEffect(() => {
    if (!user) return;
    fetchWorklogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startISO, endISO, selectedEmployees, selectedAuditStatuses, selectedWorkModes, selectedTeams, selectedHourBucket]);

  const fetchWorklogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${API_BASE_URL}/admin/worklogs`, {
        startDate: startISO,
        endDate: endISO,
        employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
        workModes: selectedWorkModes.length > 0 ? selectedWorkModes : undefined,
        teams: selectedTeams.length > 0 ? selectedTeams : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setWorklogsByDate(response.data.worklogsByDate || {});
      } else {
        throw new Error(response.data.message || "Failed to fetch worklogs");
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch worklogs: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* --- Derived helpers --- */
  const sortedDateKeys = useMemo(
    () => Object.keys(worklogsByDate).sort((a, b) => new Date(b) - new Date(a)),
    [worklogsByDate]
  );

  // Group by team first, then by employee (same as AdminApproveWorklog)
  const groupByTeamAndEmployee = (items) => {
    const byTeam = {};
    for (const row of items) {
      const team = row.team || "Unknown";
      if (!byTeam[team]) byTeam[team] = {};
      const empName = row.employeeName || row.name || "Unknown";
      if (!byTeam[team][empName]) byTeam[team][empName] = [];
      byTeam[team][empName].push(row);
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
    return rows.reduce((total, row) => total + (parseFloat(row.hoursSpent || row.hours_spent) || 0), 0);
  };

  // Get background color based on total hours (same as AdminApproveWorklog)
  const getHoursBgColor = (totalHours) => {
    if (totalHours >= 6.5 && totalHours <= 7.5) return "bg-emerald-100";
    if (totalHours < 6.5) return "bg-red-100";
    if (totalHours > 7.5) return "bg-blue-100";
    return "";
  };

  // Get team color class (same as AdminApproveWorklog)
  const getTeamColorClass = (team) => {
    return TEAM_COLORS[team] || "bg-gray-100 border-gray-300 text-gray-800";
  };

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
          Approved
        </span>
      );
    if (status === "Rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-medium">
          Rejected
        </span>
      );
    if (status === "Re-Pending")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-xs font-medium">
          Re-Pending
        </span>
      );
    if (status === "Re-Approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 text-emerald-800 px-2 py-0.5 text-xs font-medium">
          Re-Approved
        </span>
      );
    if (status === "Re-Rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-200 text-rose-800 px-2 py-0.5 text-xs font-medium">
          Re-Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
        Pending
      </span>
    );
  };

  // Global search highlighting function
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 px-0.5 rounded font-medium">
          {part}
        </span>
      ) : part
    );
  };

  // Filter entries by global search
  const filterByGlobalSearch = (entries) => {
    if (!globalSearch.trim()) return entries;

    const searchTerm = globalSearch.toLowerCase();
    return entries.filter(entry => {
      const searchableFields = [
        entry.employeeName || entry.employee_name,
        entry.workMode || entry.work_mode,
        entry.projectName || entry.project_name,
        entry.task || entry.task_name,
        entry.bookElement || entry.book_element,
        entry.chapterNo || entry.chapter_number,
        entry.status,
        entry.details,
        entry.auditStatus || entry.audit_status,
        entry.team,
        String(entry.hoursSpent || entry.hours_spent),
        String(entry.noOfUnits || entry.number_of_units),
        entry.unitType || entry.unit_type,
      ].filter(Boolean);

      return searchableFields.some(field =>
        String(field).toLowerCase().includes(searchTerm)
      );
    });
  };

  /* =================== HELPER FUNCTION FOR PROPERTY ACCESS =================== */
  const getProperty = (obj, ...keys) => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return "";
  };

  /* =================== CRUD: Edit / Delete / Add =================== */
  const handleOpenEdit = (log, dateKey) => {
    // FIX: Handle multiple possible property name formats
    setEditForm({
      _id: log._id || log.id,
      employeeName: getProperty(log, 'employeeName', 'employee_name', 'name'),
      workMode: getProperty(log, 'workMode', 'work_mode'),
      projectName: getProperty(log, 'projectName', 'project_name'),
      task: getProperty(log, 'task', 'task_name'),
      bookElement: getProperty(log, 'bookElement', 'book_element'),
      chapterNumbers: log.chapterNo
        ? [String(log.chapterNo)]
        : (log.chapter_number
          ? log.chapter_number.split(", ").filter(Boolean)
          : []),
      hoursSpent: getProperty(log, 'hoursSpent', 'hours_spent'),
      noOfUnits: getProperty(log, 'noOfUnits', 'number_of_units'),
      unitType: getProperty(log, 'unitType', 'unit_type') || "pages",
      status: log.status || "",
      dueOn: toISODateOnly(getProperty(log, 'dueOn', 'due_on')) || dateKey,
      details: log.details || "",
      auditStatus: getProperty(log, 'auditStatus', 'audit_status') || "Pending",
      dateKey, // for local state writeback
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const { invalid, canSubmit, projectValid } = validateAdminEntry(editForm, suggestions);
    const errs = {}; Object.entries(invalid).forEach(([k, v]) => v && (errs[k] = "Required"));
    if (!projectValid) errs.projectValid = "Please choose a valid project.";
    setFormErrors(errs);
    if (!canSubmit || !projectValid) return;

    try {
      setSavingEdit(true);
      const response = await axios.put(`${API_BASE_URL}/admin/worklogs/${editForm._id}`, {
        employeeName: editForm.employeeName,
        workMode: editForm.workMode,
        projectName: editForm.projectName,
        task: editForm.task,
        bookElement: editForm.bookElement,
        chapterNumbers: editForm.chapterNumbers.join(", "),
        hoursSpent: Number(editForm.hoursSpent) || 0,
        noOfUnits: Number(editForm.noOfUnits) || 0,
        unitType: editForm.unitType,
        status: editForm.status,
        details: editForm.details,
        auditStatus: editForm.auditStatus,
      });

      if (response.data.success) {
        // Optimistic update locally
        setWorklogsByDate((prev) => {
          const next = { ...prev };
          const dk = editForm.dateKey;
          if (!next[dk]) return next;
          next[dk] = next[dk].map((r) =>
            (r._id || r.id) === editForm._id
              ? {
                ...r,
                employeeName: editForm.employeeName,
                workMode: editForm.workMode,
                projectName: editForm.projectName,
                task: editForm.task,
                bookElement: editForm.bookElement,
                chapterNumbers: editForm.chapterNumbers.join(", "),
                chapterNo: editForm.chapterNumbers.join(", "),
                hoursSpent: Number(editForm.hoursSpent) || 0,
                noOfUnits: Number(editForm.noOfUnits) || 0,
                unitType: editForm.unitType,
                status: editForm.status,
                details: editForm.details,
                auditStatus: editForm.auditStatus,
              }
              : r
          );
          return next;
        });

        setEditModalOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to save changes");
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to save changes: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (log) => {
    // FIX: Pass the entire log object and extract ID properly
    const worklogId = log._id || log.id;

    if (!worklogId) {
      alert("Error: Could not identify the worklog entry to delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/worklogs/${worklogId}`);

      if (response.data.success) {
        // Remove locally
        setWorklogsByDate((prev) => {
          const next = { ...prev };
          for (const dateKey of Object.keys(next)) {
            next[dateKey] = next[dateKey].filter((r) => (r._id || r.id) !== worklogId);
          }
          return next;
        });
      } else {
        throw new Error(response.data.message || "Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to delete entry: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenAdd = (employeeName, dateKey) => {
    setAddContext({ dateKey, employeeName });
    setAddForm({
      _id: undefined,
      employeeName: employeeName || "",
      date: dateKey,
      workMode: "",
      projectName: "",
      task: "",
      bookElement: "",
      chapterNumbers: [],
      hoursSpent: "",
      noOfUnits: "",
      unitType: "pages",
      status: "",
      dueOn: dateKey,
      details: "",
      team: user.team,
      auditStatus: "Pending",
    });
    setFormErrors({});
    setAddModalOpen(true);
  };

  const handleOpenGlobalAdd = () => {
    const todayDate = toISODateOnly(new Date());
    setAddForm({
      _id: undefined,
      employeeName: "",
      date: todayDate,
      workMode: "",
      projectName: "",
      task: "",
      bookElement: "",
      chapterNumbers: [],
      hoursSpent: "",
      noOfUnits: "",
      unitType: "pages",
      status: "",
      dueOn: todayDate,
      details: "",
      team: user.team,
      auditStatus: "Pending",
    });
    setFormErrors({});
    setGlobalAddOpen(true);
  };

  const handleSaveAdd = async (mode = "inline") => {
    const form = addForm;
    const { invalid, canSubmit, projectValid } = validateAdminEntry(form, suggestions);
    const errs = {};
    Object.entries(invalid).forEach(([k, v]) => v && (errs[k] = "Required"));
    if (!projectValid) errs.projectValid = "Please choose a valid project.";
    setFormErrors(errs);
    if (!canSubmit || !projectValid) return;

    try {
      setSavingAdd(true);
      const response = await axios.post(`${API_BASE_URL}/admin/worklogs/create`, {
        employeeName: form.employeeName,
        date: mode === "inline" ? addContext.dateKey : form.dueOn,
        workMode: form.workMode,
        projectName: form.projectName,
        task: form.task,
        bookElement: form.bookElement,
        chapterNumbers: form.chapterNumbers.join(", "),
        hoursSpent: Number(form.hoursSpent) || 0,
        noOfUnits: Number(form.noOfUnits) || 0,
        unitType: form.unitType,
        status: form.status,
        dueOn: form.dueOn,
        details: form.details,
        auditStatus: form.auditStatus,
        team: user.team,
      });

      if (response.data.success) {
        // Inject into local state under the proper dateKey
        const dk = mode === "global" ? toISODateOnly(form.dueOn) : addContext.dateKey;
        setWorklogsByDate((prev) => {
          const next = { ...prev };
          const createdRow = response.data.worklog || {};

          // FIX: Ensure the created row has consistent property names
          const normalizedRow = {
            _id: createdRow._id || createdRow.id,
            employeeName: createdRow.employeeName || createdRow.employee_name || form.employeeName,
            workMode: createdRow.workMode || createdRow.work_mode || form.workMode,
            projectName: createdRow.projectName || createdRow.project_name || form.projectName,
            task: createdRow.task || form.task,
            bookElement: createdRow.bookElement || createdRow.book_element || form.bookElement,
            chapterNo: createdRow.chapterNo || createdRow.chapter_number || form.chapterNumbers.join(", "),
            hoursSpent: createdRow.hoursSpent || createdRow.hours_spent || form.hoursSpent,
            noOfUnits: createdRow.noOfUnits || createdRow.number_of_units || form.noOfUnits,
            unitType: createdRow.unitType || createdRow.unit_type || form.unitType,
            status: createdRow.status || form.status,
            dueOn: createdRow.dueOn || createdRow.due_on || form.dueOn,
            details: createdRow.details || form.details,
            auditStatus: createdRow.auditStatus || createdRow.audit_status || form.auditStatus,
            team: createdRow.team || user.team,
          };

          if (!next[dk]) next[dk] = [];
          next[dk] = [...next[dk], normalizedRow];
          return next;
        });

        if (mode === "inline") setAddModalOpen(false);
        else setGlobalAddOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to add entry");
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to add entry: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingAdd(false);
    }
  };

  /* --- Project search --- */
  useEffect(() => {
    let active = true;
    const form = editModalOpen ? editForm : (addModalOpen || globalAddOpen) ? addForm : null;
    if (!form) return;
    const q = (form.projectName || "").trim();
    if (!q) { setSuggestions([]); setShowSuggest(false); return; }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.get(`${API_BASE_URL}/projects`, {
          params: { q, by: searchBy },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        const transformed = (data.projects || []).map((p) => ({
          id: p.project_id || p.id || p.code || p.name,
          name: p.project_name || p.name || p.title,
          dueOn: p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : null,
        }));
        setSuggestions(transformed);
        setShowSuggest(transformed.length > 0);
      } catch {
        setSuggestions([]); setShowSuggest(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(t); setLoadingSuggestions(false); };
  }, [editForm.projectName, addForm.projectName, editModalOpen, addModalOpen, globalAddOpen, searchBy]);

  const selectProjectIntoForm = (p, which = "edit") => {
    const setter = which === "edit" ? setEditForm : setAddForm;
    setter((f) => ({
      ...f,
      projectName: p.id, // CHANGED: Fill project ID instead of project name
      dueOn: f.dueOn || p.dueOn || "",
    }));
    setShowSuggest(false);
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
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  /* =================== LAYOUT (Navbar + Sidebar) =================== */
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
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
                Admin Dashboard <span className="hidden sm:inline">- Edit Worklogs</span>
              </h1>
            </div>

            {/* Right side */}
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

            {/* Mobile menu button */}
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


      {/* =================== MAIN CONTENT =================== */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-full overflow-hidden">
          {/* ===== Filters ===== */}
          <div className="rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
              <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters</h3>
            </div>

            {/* Filters Row */}
            <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">
              {/* Global Search */}
              <div className="w-full lg:min-w-[280px] lg:w-auto">
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Search Entries</label>
                <div className="relative">
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search across all fields..."
                    className="w-full border rounded-lg px-3 py-2 pl-10 text-xs lg:text-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                  />
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {globalSearch && (
                    <button
                      onClick={() => setGlobalSearch("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Date Picker */}
              <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date(s)</label>
                <button
                  onClick={() => setDatePopoverOpen((o) => !o)}
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
                      <button onClick={() => quickApply(3)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Past 3 Days</button>
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

              {/* Employees multi-select */}
              <div ref={empRef} className="relative w-full lg:min-w-[280px] lg:w-auto">
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
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center gap-2 sticky top-0">
                      <UsersIcon className="w-3.5 h-3.5" />
                      Select employees
                    </div>
                    <div className="p-2 border-b bg-white sticky top-[28px]">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            placeholder="Search employee…"
                            className="w-full h-8 rounded-lg border px-8 text-xs"
                          />
                          <SearchIcon className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
                        </div>
                        <button
                          className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                          onClick={() => setSelectedEmployees(employees.map((e) => e.name))}
                        >
                          Select All
                        </button>
                        <button
                          className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                          onClick={() => setSelectedEmployees([])}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {employees
                      .filter((emp) => employeeSearch ? emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) : true)
                      .map((emp) => (
                        <label key={emp._id || emp.name} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
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
                          <span className="truncate">{emp.name}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Work Mode multi-select (NEW) */}
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
                        <button onClick={() => setSelectedWorkModes([...WORK_MODES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
                        <button onClick={() => setSelectedWorkModes([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
                      </div>
                    </div>
                    {WORK_MODES.map((mode) => (
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

              {/* Teams multi-select (NEW) */}
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
                        <span key={s} className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-medium">
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

              {/* Hours bucket */}
              <div className="w-full lg:w-auto">
                <Label>Hours Sum</Label>
                <select
                  className="w-full h-9 rounded-lg border px-3 text-sm bg-white"
                  value={selectedHourBucket}
                  onChange={(e) => setSelectedHourBucket(e.target.value)}
                >
                  {HOUR_BUCKETS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </div>

              {/* Summary info */}
              <div className="w-full lg:w-auto flex flex-wrap items-center gap-3 lg:ml-auto">
                <div className="text-xs text-slate-700">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-sky-100 text-sky-800">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">Edit & manage entries directly</span>
                  </div>
                </div>
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                  onClick={handleOpenGlobalAdd}
                >
                  <Plus className="w-4 h-4" /> Global Add Entry
                </button>
              </div>
            </div>
          </div>

          {/* ===== States ===== */}
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

          {/* ===== By Date - Grouped by Team then Employee (UPDATED) ===== */}
          {!loading &&
            !error &&
            sortedDateKeys.map((dateKey) => {
              const allRows = worklogsByDate[dateKey] || [];

              // Filter by audit status, work mode, team
              let filteredRows = allRows.filter((r) =>
                selectedAuditStatuses.includes(r.auditStatus || r.audit_status || "Pending")
              );

              if (selectedWorkModes.length > 0) {
                filteredRows = filteredRows.filter((r) =>
                  selectedWorkModes.includes(r.workMode || r.work_mode)
                );
              }

              if (selectedTeams.length > 0) {
                filteredRows = filteredRows.filter((r) =>
                  selectedTeams.includes(r.team)
                );
              }

              // Apply global search filter
              filteredRows = filterByGlobalSearch(filteredRows);

              // Group by team and employee
              const groupedByTeam = groupByTeamAndEmployee(filteredRows);

              // Filter by hour bucket at the team-employee level
              const processedGrouped = {};
              Object.keys(groupedByTeam).forEach(team => {
                processedGrouped[team] = {};
                Object.keys(groupedByTeam[team]).forEach(emp => {
                  const logs = groupedByTeam[team][emp];
                  const total = calculateTotalHours(logs);
                  const bucket = HOUR_BUCKETS.find((b) => b.id === selectedHourBucket);
                  if ((bucket?.test ?? (() => true))(total)) {
                    processedGrouped[team][emp] = logs;
                  }
                });
                // Remove empty teams
                if (Object.keys(processedGrouped[team]).length === 0) {
                  delete processedGrouped[team];
                }
              });

              if (Object.keys(processedGrouped).length === 0) return null;

              const totalEntries = Object.values(processedGrouped).reduce((acc, teamData) =>
                acc + Object.values(teamData).reduce((empAcc, logs) => empAcc + logs.length, 0), 0
              );

              return (
                <section key={dateKey} className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                      {formatISOToHuman(dateKey)}
                      <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
                        {totalEntries} entries
                      </span>
                    </h2>
                  </div>

                  {/* Desktop grouped tables by Team > Employee */}
                  <div className="hidden lg:block">
                    {Object.keys(processedGrouped).map((team) => (
                      <div key={team} className="border-b last:border-b-0">
                        {/* Team Header */}
                        <div className={`px-4 py-3 ${getTeamColorClass(team)}`}>
                          <h3 className="text-sm font-semibold">{team}</h3>
                        </div>

                        {/* Employees in this team */}
                        {Object.keys(processedGrouped[team]).map((emp) => {
                          const logs = processedGrouped[team][emp];
                          const totalHours = calculateTotalHours(logs);
                          const hoursBgColor = getHoursBgColor(totalHours);

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
                                      {logs.length} {logs.length === 1 ? "entry" : "entries"}
                                    </div>
                                  </div>
                                  <div className={`ml-4 px-3 py-1 rounded-full ${hoursBgColor} text-xs font-medium`}>
                                    Total Hours: {totalHours.toFixed(1)}
                                  </div>
                                </div>

                                <button
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                                  onClick={() => handleOpenAdd(emp, dateKey)}
                                >
                                  <Plus className="w-4 h-4" /> Add Entry
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
                                      <Th>Chapters</Th>
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
                                    {logs.map((log) => (
                                      <tr key={log._id} className={`${rowClassForAudit(log.auditStatus || log.audit_status)} border-t`}>
                                        <Td>{highlightText(log.workMode || log.work_mode, globalSearch)}</Td>
                                        <Td className="max-w-[260px] truncate" title={log.projectName || log.project_name}>
                                          {highlightText(log.projectName || log.project_name, globalSearch)}
                                        </Td>
                                        <Td>{highlightText(log.task || log.task_name, globalSearch)}</Td>
                                        <Td>{highlightText(log.bookElement || log.book_element, globalSearch)}</Td>
                                        <Td>{highlightText(log.chapterNo || log.chapter_number, globalSearch)}</Td>
                                        <Td>{highlightText(log.hoursSpent || log.hours_spent, globalSearch)}</Td>
                                        <Td>{highlightText(log.noOfUnits || log.number_of_units, globalSearch)}</Td>
                                        <Td>{highlightText(log.unitType || log.unit_type, globalSearch)}</Td>
                                        <Td>{highlightText(log.status, globalSearch)}</Td>
                                        <Td>{formatISOToHuman(log.dueOn || log.due_on)}</Td>
                                        <Td className="max-w-[220px] whitespace-normal break-words">
                                          {highlightText(log.details || "-", globalSearch)}
                                        </Td>
                                        <Td>
                                          <AuditBadge status={log.auditStatus || log.audit_status} />
                                        </Td>
                                        <Td>
                                          <div className="flex gap-2">
                                            <button
                                              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md"
                                              onClick={() => handleOpenEdit(log, dateKey)}
                                              title="Edit"
                                            >
                                              <Pencil size={16} />
                                            </button>
                                            <button
                                              className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md"
                                              onClick={() => handleDelete(log)}
                                              title="Delete"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </Td>
                                      </tr>
                                    ))}
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
                    {Object.keys(processedGrouped).map((team) => (
                      <div key={team} className="rounded-lg border border-slate-200 overflow-hidden">
                        {/* Team Header */}
                        <div className={`px-3 sm:px-4 py-2 ${getTeamColorClass(team)}`}>
                          <h3 className="text-sm font-semibold">{team}</h3>
                        </div>

                        {/* Employees in this team */}
                        {Object.keys(processedGrouped[team]).map((emp) => {
                          const logs = processedGrouped[team][emp];
                          const totalHours = calculateTotalHours(logs);
                          const hoursBgColor = getHoursBgColor(totalHours);

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
                                      {logs.length} {logs.length === 1 ? "entry" : "entries"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hoursBgColor}`}>
                                    {totalHours.toFixed(1)}h
                                  </span>
                                  <button
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                                    onClick={() => handleOpenAdd(emp, dateKey)}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add
                                  </button>
                                </div>
                              </div>

                              <div className="divide-y">
                                {logs.map((log) => (
                                  <article key={log._id} className={`p-3 sm:p-4 ${rowClassForAudit(log.auditStatus || log.audit_status)}`}>
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="min-w-0 flex-1 pr-3">
                                        <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate" title={log.projectName || log.project_name}>
                                          {highlightText(log.projectName || log.project_name, globalSearch)}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          {highlightText(log.task || log.task_name, globalSearch)} · {highlightText(log.bookElement || log.book_element, globalSearch)} · {highlightText(log.chapterNo || log.chapter_number, globalSearch)}
                                        </p>
                                      </div>
                                      <AuditBadge status={log.auditStatus || log.audit_status} />
                                    </div>

                                    <dl className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-[13px] mb-4">
                                      <Info label="Work Mode" value={highlightText(log.workMode || log.work_mode, globalSearch)} />
                                      <Info label="Hours" value={highlightText(log.hoursSpent || log.hours_spent, globalSearch)} />
                                      <Info label="Units" value={highlightText(`${log.noOfUnits || log.number_of_units} ${log.unitType || log.unit_type || ""}`, globalSearch)} />
                                      <Info label="Status" value={highlightText(log.status, globalSearch)} />
                                      <Info label="Due On" value={formatISOToHuman(log.dueOn || log.due_on)} />
                                      {log.details && (
                                        <div className="col-span-2">
                                          <dt className="text-slate-500">Details</dt>
                                          <dd className="text-slate-800 break-words">{highlightText(log.details, globalSearch)}</dd>
                                        </div>
                                      )}
                                    </dl>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex-1 min-w-0"
                                        onClick={() => handleOpenEdit(log, dateKey)}
                                      >
                                        <Pencil size={16} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm flex-1 min-w-0"
                                        onClick={() => handleDelete(log)}
                                      >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </article>
                                ))}
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

      {/* ======= EDIT MODAL ======= */}
      {editModalOpen && (
        <Modal onClose={() => setEditModalOpen(false)} title="Edit Worklog Entry">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee">
                <input type="text" className="w-full h-9 rounded-lg border px-3 text-sm bg-slate-100" value={editForm.employeeName} disabled />
              </Field>
              <Field label="Date">
                <input type="date" className="w-full h-9 rounded-lg border px-3 text-sm" value={editForm.dateKey} onChange={(e) => setEditForm((f) => ({ ...f, dateKey: e.target.value }))} />
              </Field>
            </div>

            <Field label="Work Mode">
              <Select value={editForm.workMode} onChange={(v) => setEditForm((f) => ({ ...f, workMode: v }))} options={["", ...WORK_MODES]} isInvalid={!!formErrors.workMode} />
              <ErrorText text={formErrors.workMode} />
            </Field>

            <Field label="Project ID *">
              <div className="relative" ref={suggestRef}>
                <input
                  type="text"
                  className={`w-full h-9 rounded-lg border px-3 text-sm ${formErrors.projectValid ? "border-rose-500" : ""}`}
                  value={editForm.projectName}
                  onChange={(e) => setEditForm((f) => ({ ...f, projectName: e.target.value }))}
                  placeholder="Type project ID…"
                />
                {loadingSuggestions && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
                {showSuggest && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                    {suggestions.map((s) => (
                      <li key={s.id} onClick={() => selectProjectIntoForm(s, "edit")} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                        <div className="font-medium">{s.id}</div>
                        <div className="text-xs text-slate-500">{s.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ErrorText text={formErrors.projectValid} />
            </Field>

            <Field label="Task">
              <Select value={editForm.task} onChange={(v) => setEditForm((f) => ({ ...f, task: v }))} options={["", ...TASKS]} isInvalid={!!formErrors.task} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Book Element">
                <Select value={editForm.bookElement} onChange={(v) => setEditForm((f) => ({ ...f, bookElement: v }))} options={["", ...BASE_BOOK_ELEMENTS]} isInvalid={!!formErrors.bookElement} />
              </Field>
              <Field label="Chapters">
                <MultiSelectChips value={editForm.chapterNumbers} onChange={(vals) => setEditForm((f) => ({ ...f, chapterNumbers: vals }))} options={BASE_CHAPTER_NUMBERS} isInvalid={!!formErrors.chapterNumbers} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours Spent">
                <Select value={editForm.hoursSpent} onChange={(v) => setEditForm((f) => ({ ...f, hoursSpent: v }))} options={["", ...HOURS]} isInvalid={!!formErrors.hoursSpent} />
              </Field>
              <Field label="Units">
                <div className="flex gap-2">
                  <input type="number" className={`w-20 h-9 rounded-lg border px-2 text-sm ${formErrors.noOfUnits ? "border-rose-500" : ""}`} value={editForm.noOfUnits} onChange={(e) => setEditForm((f) => ({ ...f, noOfUnits: e.target.value }))} />
                  <Select value={editForm.unitType} onChange={(v) => setEditForm((f) => ({ ...f, unitType: v }))} options={UNITS} />
                </div>
              </Field>
            </div>

            <Field label="Status">
              <Select value={editForm.status} onChange={(v) => setEditForm((f) => ({ ...f, status: v }))} options={["", ...STATUS]} isInvalid={!!formErrors.status} />
            </Field>

            <Field label="Details / Remarks">
              <textarea className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm" value={editForm.details} onChange={(e) => setEditForm((f) => ({ ...f, details: e.target.value }))} />
            </Field>

            <Field label="Audit Status">
              <Select value={editForm.auditStatus} onChange={(v) => setEditForm((f) => ({ ...f, auditStatus: v }))} options={AUDIT_STATUSES} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm hover:bg-slate-300">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======= ADD MODAL ======= */}
      {addModalOpen && (
        <Modal onClose={() => setAddModalOpen(false)} title={`Add Entry for ${addContext.employeeName || ""} (${formatISOToHuman(addContext.dateKey || "")})`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee">
                <input type="text" className="w-full h-9 rounded-lg border px-3 text-sm bg-slate-100" value={addForm.employeeName} disabled />
              </Field>
              <Field label="Date">
                <input type="date" className="w-full h-9 rounded-lg border px-3 text-sm" value={addForm.dueOn} onChange={(e) => setAddForm((f) => ({ ...f, dueOn: e.target.value }))} />
              </Field>
            </div>

            <Field label="Work Mode">
              <Select value={addForm.workMode} onChange={(v) => setAddForm((f) => ({ ...f, workMode: v }))} options={["", ...WORK_MODES]} isInvalid={!!formErrors.workMode} />
              <ErrorText text={formErrors.workMode} />
            </Field>

            <Field label="Project ID *">
              <div className="relative" ref={suggestRef}>
                <input
                  type="text"
                  className={`w-full h-9 rounded-lg border px-3 text-sm ${formErrors.projectValid ? "border-rose-500" : ""}`}
                  value={addForm.projectName}
                  onChange={(e) => setAddForm((f) => ({ ...f, projectName: e.target.value }))}
                  placeholder="Type project ID…"
                />
                {showSuggest && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                    {suggestions.map((s) => (
                      <li key={s.id} onClick={() => selectProjectIntoForm(s, "add")} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                        <div className="font-medium">{s.id}</div>
                        <div className="text-xs text-slate-500">{s.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ErrorText text={formErrors.projectValid} />
            </Field>

            <Field label="Task">
              <Select value={addForm.task} onChange={(v) => setAddForm((f) => ({ ...f, task: v }))} options={["", ...TASKS]} isInvalid={!!formErrors.task} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Book Element">
                <Select value={addForm.bookElement} onChange={(v) => setAddForm((f) => ({ ...f, bookElement: v }))} options={["", ...BASE_BOOK_ELEMENTS]} />
              </Field>
              <Field label="Chapters">
                <MultiSelectChips value={addForm.chapterNumbers} onChange={(vals) => setAddForm((f) => ({ ...f, chapterNumbers: vals }))} options={BASE_CHAPTER_NUMBERS} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours Spent">
                <Select value={addForm.hoursSpent} onChange={(v) => setAddForm((f) => ({ ...f, hoursSpent: v }))} options={["", ...HOURS]} />
              </Field>
              <Field label="Units">
                <div className="flex gap-2">
                  <input type="number" className="w-20 h-9 rounded-lg border px-2 text-sm" value={addForm.noOfUnits} onChange={(e) => setAddForm((f) => ({ ...f, noOfUnits: e.target.value }))} />
                  <Select value={addForm.unitType} onChange={(v) => setAddForm((f) => ({ ...f, unitType: v }))} options={UNITS} />
                </div>
              </Field>
            </div>

            <Field label="Status">
              <Select value={addForm.status} onChange={(v) => setAddForm((f) => ({ ...f, status: v }))} options={["", ...STATUS]} />
            </Field>

            <Field label="Details / Remarks">
              <textarea className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm" value={addForm.details} onChange={(e) => setAddForm((f) => ({ ...f, details: e.target.value }))} />
            </Field>

            <Field label="Audit Status">
              <Select value={addForm.auditStatus} onChange={(v) => setAddForm((f) => ({ ...f, auditStatus: v }))} options={AUDIT_STATUSES} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setAddModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm hover:bg-slate-300">Cancel</button>
              <button onClick={() => handleSaveAdd("inline")} disabled={savingAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
                {savingAdd ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======= GLOBAL ADD MODAL ======= */}
      {globalAddOpen && (
        <Modal onClose={() => setGlobalAddOpen(false)} title="Global Add Entry">
          <div className="space-y-4">
            <Field label="Employee">
              <select className="w-full h-9 rounded-lg border px-3 text-sm" value={addForm.employeeName} onChange={(e) => setAddForm((f) => ({ ...f, employeeName: e.target.value }))}>
                <option value="">Select Employee</option>
                {employees.map((emp) => <option key={emp._id || emp.name} value={emp.name}>{emp.name}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className="w-full h-9 rounded-lg border px-3 text-sm" value={addForm.dueOn} onChange={(e) => setAddForm((f) => ({ ...f, dueOn: e.target.value }))} />
            </Field>
            <Field label="Work Mode">
              <Select value={addForm.workMode} onChange={(v) => setAddForm((f) => ({ ...f, workMode: v }))} options={["", ...WORK_MODES]} />
            </Field>

            <Field label="Project ID *">
              <div className="relative" ref={suggestRef}>
                <input
                  type="text"
                  className="w-full h-9 rounded-lg border px-3 text-sm"
                  value={addForm.projectName}
                  onChange={(e) => setAddForm((f) => ({ ...f, projectName: e.target.value }))}
                  placeholder="Type project ID…"
                />
                {showSuggest && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                    {suggestions.map((s) => (
                      <li key={s.id} onClick={() => selectProjectIntoForm(s, "add")} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                        <div className="font-medium">{s.id}</div>
                        <div className="text-xs text-slate-500">{s.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>

            <Field label="Task">
              <Select value={addForm.task} onChange={(v) => setAddForm((f) => ({ ...f, task: v }))} options={["", ...TASKS]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Book Element">
                <Select value={addForm.bookElement} onChange={(v) => setAddForm((f) => ({ ...f, bookElement: v }))} options={["", ...BASE_BOOK_ELEMENTS]} />
              </Field>
              <Field label="Chapters">
                <MultiSelectChips value={addForm.chapterNumbers} onChange={(vals) => setAddForm((f) => ({ ...f, chapterNumbers: vals }))} options={BASE_CHAPTER_NUMBERS} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours Spent">
                <Select value={addForm.hoursSpent} onChange={(v) => setAddForm((f) => ({ ...f, hoursSpent: v }))} options={["", ...HOURS]} />
              </Field>
              <Field label="Units">
                <div className="flex gap-2">
                  <input type="number" className="w-20 h-9 rounded-lg border px-2 text-sm" value={addForm.noOfUnits} onChange={(e) => setAddForm((f) => ({ ...f, noOfUnits: e.target.value }))} />
                  <Select value={addForm.unitType} onChange={(v) => setAddForm((f) => ({ ...f, unitType: v }))} options={UNITS} />
                </div>
              </Field>
            </div>

            <Field label="Status">
              <Select value={addForm.status} onChange={(v) => setAddForm((f) => ({ ...f, status: v }))} options={["", ...STATUS]} />
            </Field>

            <Field label="Details / Remarks">
              <textarea className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm" value={addForm.details} onChange={(e) => setAddForm((f) => ({ ...f, details: e.target.value }))} />
            </Field>

            <Field label="Audit Status">
              <Select value={addForm.auditStatus} onChange={(v) => setAddForm((f) => ({ ...f, auditStatus: v }))} options={AUDIT_STATUSES} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setGlobalAddOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm hover:bg-slate-300">Cancel</button>
              <button onClick={() => handleSaveAdd("global")} disabled={savingAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
                {savingAdd ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </div>
        </Modal>
      )}
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

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
      {children}
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </label>
  );
}

function Select({ value, onChange, options, isInvalid, className = "", ...rest }) {
  return (
    <select
      className={`w-full h-9 text-sm px-2 rounded-2xl border-2 ${isInvalid ? "border-rose-500" : "border-slate-300"} focus:border-indigo-600 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((o, idx) => (
        <option key={idx} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : (o.label ?? o.value)}
        </option>
      ))}
    </select>
  );
}

/* =================== MultiSelectChips =================== */
function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select…", isInvalid = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const lastTs = useRef(0);

  useEffect(() => {
    const fn = (e) => { if (shellRef.current && !shellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const guard = () => { const n = Date.now(); if (n - lastTs.current < 120) return false; lastTs.current = n; return true; };
  const add = (item) => { if (!guard()) return; if (!value.includes(item)) onChange([...value, item]); setQuery(""); setOpen(true); inputRef.current?.focus(); };
  const removeAt = (i) => { if (!guard()) return; const next = value.slice(); next.splice(i, 1); onChange(next); setOpen(true); inputRef.current?.focus(); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !value.includes(o)).filter((o) => q ? o.toLowerCase().includes(q) : true);
  }, [options, value, query]);

  return (
    <div className="relative" ref={shellRef}>
      <div
        className={`min-h-[44px] w-full rounded-2xl border-2 bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${isInvalid ? "border-rose-500" : "border-slate-300"} focus-within:border-indigo-600`}
        onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); setOpen(true); inputRef.current?.focus(); }}
        role="combobox" aria-expanded={open}
      >
        {value.map((v, idx) => (
          <span key={`${v}-${idx}`} className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-[2px] text-xs">
            {v}
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeAt(idx); }} className="ml-1 rounded-full hover:bg-indigo-100 p-[2px] leading-none" aria-label={`Remove ${v}`}>✕</button>
          </span>
        ))}
        <input
          ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Backspace" && query === "" && value.length) removeAt(value.length - 1); }}
          className="flex-1 min-w-[80px] outline-none text-sm px-1 py-1 bg-transparent"
          placeholder={value.length ? "" : placeholder}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl border bg-white shadow-2xl" role="listbox" onMouseDown={(e) => e.preventDefault()}>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          ) : filtered.map((opt) => (
            <div key={opt} role="option" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); add(opt); }} className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer">
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =================== Calendar Grid =================== */
function CalendarGrid({ monthKey, rangeMode, tempStart, tempEnd, onPick }) {
  const monthDate = parseMonthKey(monthKey);
  const today = stripToISO(new Date());

  const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
  const startWeekday = firstDay.getUTCDay(); // 0..6
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

/* =================== Date helpers =================== */
function stripToISO(d) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt.toISOString().split("T")[0];
}
function toISODateOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    // if value is already yyyy-mm-dd
    return String(value);
  }
  return stripToISO(d);
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

/* =================== Validation helpers =================== */
function initialFormState() {
  return {
    _id: undefined,
    employeeName: "",
    date: "",
    workMode: "",
    projectName: "",
    task: "",
    bookElement: "",
    chapterNumbers: [],
    hoursSpent: "",
    noOfUnits: "",
    unitType: "pages",
    status: "",
    dueOn: "",
    details: "",
    auditStatus: "Pending",
  };
}

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : v == null || String(v).trim() === "");
function validateAdminEntry(form, suggestions) {
  const projectValid = (!!form.projectName && String(form.projectName).trim() !== "");
  const required = {
    employeeName: form.employeeName,
    dueOn: form.dueOn,
    workMode: form.workMode,
    projectValid: projectValid ? "ok" : "",
    task: form.task,
    bookElement: form.bookElement,
    chapterNumbers: form.chapterNumbers,
    hoursSpent: form.hoursSpent,
    noOfUnits: form.noOfUnits,
    unitType: form.unitType,
    status: form.status,
    auditStatus: form.auditStatus,
  };
  const invalid = Object.fromEntries(Object.entries(required).map(([k, v]) => [k, isEmpty(v)]));
  return { invalid, canSubmit: Object.values(required).every((v) => !isEmpty(v)), projectValid };
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

/* =================== Modal wrapper =================== */
function Modal({ children, title, onClose, widthClass = "max-w-4xl" }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white w-full ${widthClass} mx-4 rounded-2xl shadow-2xl border border-slate-200`}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}


// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";

// import {
//   AlertCircle,
//   Clock,
//   ChevronLeft,
//   ChevronRight,
//   Calendar as CalendarIcon,
//   Users as UsersIcon,
//   Filter as FilterIcon,
//   Pencil,
//   Trash2,
//   Plus,
//   ChevronDown,
//   X,
//   Loader2,
//   Search as SearchIcon,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";

// /* =================== CONFIG =================== */
// const API_BASE_URL = import.meta.env?.VITE_API_BASE;

// /* =================== CONSTANTS =================== */
// const WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night", "Leave"];
// const STATUS = ["In Progress", "Delayed", "Completed", "Not approved"];
// const HOURS = [
//   "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8",
// ];
// const TASKS = ["CMPL-MS", "VRF-MS", "DRF", "TAL", "R1", "R2", "R3", "R4", "CR", "FER", "SET", "FINAL", "MEET", "QRY", "Coord", "GLANCE", "Research", "Analysis", "KT", "Interview", "PLAN", "UPL", "Generation", "COM", "CR1", "CR2", "CR3", "CR4", "CR5", "Code"];
// const BASE_BOOK_ELEMENTS = ["Theory", "Exercise", "Chapter", "Full book", "Mind Map", "Diagram", "Solution", "Booklet", "Full Video", "AVLR-VO", "DLR", "Lesson Plan", "Miscellaneous", "AVLR-Ideation", "Marketing", "Development", "Recruitment", "References", "Frames", "Papers", "Projects", "Lesson Plan", "Shooting", "Frontend", "Backend", "DB", "OST", "Visual Instructions", "Animation", "Sheets"];
// const BASE_CHAPTER_NUMBERS = ["Title", "Syllabus", "Content", "Projects", "Papers", "Miscellaneous", "Appendix", "Full Book", "Full Book", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5",
//   ...Array.from({ length: 40 }, (_, i) => String(i + 1))
// ];
// const UNITS = [
//   { label: "pages", value: "pages" },
//   { label: "frames", value: "frames" },
//   { label: "seconds", value: "seconds" },
//   { label: "general", value: "general" },
// ];
// const AUDIT_STATUSES = ["Pending", "Re-Pending", "Approved", "Rejected", "Re-Approved", "Re-Rejected"];

// const HOUR_BUCKETS = [
//   { id: "ALL", label: "All", test: () => true },
//   { id: "LE6", label: "Sum ≤ 6", test: (h) => h <= 6 },
//   { id: "LE65", label: "Sum ≤ 6.5", test: (h) => h <= 6.5 },
//   { id: "LE7", label: "Sum ≤ 7", test: (h) => h <= 7 },
//   { id: "LE75", label: "Sum ≤ 7.5", test: (h) => h <= 7.5 },
//   { id: "GT75", label: "Sum > 7.5", test: (h) => h > 7.5 },
// ];

// // Team colors mapping
// const TEAM_COLORS = {
//   Editorial_Maths: "bg-blue-100 border-blue-300 text-blue-800",
//   Editorial_Science: "bg-green-100 border-green-300 text-green-800",
//   Editorial_University: "bg-purple-100 border-purple-300 text-purple-800",
//   Editorial_English: "bg-red-100 border-red-300 text-red-800",
//   Editorial_SST: "bg-orange-100 border-orange-300 text-orange-800",
//   "Editorial_Eco&Com": "bg-teal-100 border-teal-300 text-teal-800",
//   DTP_Raj: "bg-pink-100 border-pink-300 text-pink-800",
//   DTP_Naveen: "bg-indigo-100 border-indigo-300 text-indigo-800",
//   DTP_Rimpi: "bg-cyan-100 border-cyan-300 text-cyan-800",
//   DTP_Suman: "bg-amber-100 border-amber-300 text-amber-800",
//   Digital_Marketing: "bg-lime-100 border-lime-300 text-lime-800",
//   CSMA_Maths: "bg-emerald-100 border-emerald-300 text-emerald-800",
//   CSMA_Science: "bg-violet-100 border-violet-300 text-violet-800",
//   CSMA_Technology: "bg-yellow-100 border-yellow-300 text-yellow-800",
//   CSMA_Intern: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
//   Animation_Maths: "bg-rose-100 border-rose-300 text-rose-800",
//   InternScience: "bg-sky-100 border-sky-300 text-sky-800",
//   "University&_Titles": "bg-stone-100 border-stone-300 text-stone-800",
// };

// const ALL_TEAMS = Object.keys(TEAM_COLORS);

// function Label({ children, className = "" }) {
//   return (
//     <label className={`block text-xs lg:text-sm font-medium text-slate-700 mb-1 ${className}`}>
//       {children}
//     </label>
//   );
// }

// function Th({ children, className = "" }) {
//   return (
//     <th className={`px-3 py-2 text-left font-medium ${className}`}>
//       {children}
//     </th>
//   );
// }

// function Td({ children, className = "" }) {
//   return (
//     <td className={`px-3 py-2 border-t border-slate-200 ${className}`}>
//       {children}
//     </td>
//   );
// }

// function ErrorText({ text }) {
//   if (!text) return null;
//   return <div className="text-xs text-rose-600 mt-1">{text}</div>;
// }

// /* =================== MAIN PAGE =================== */
// export default function AdminEditWorklogEntries() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [user, setUser] = useState(null);

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
//         team: decoded.team,
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

//   /* ===== Edit Worklogs STATE/LOGIC ===== */

//   // Data
//   const [worklogsByDate, setWorklogsByDate] = useState({});
//   const [employees, setEmployees] = useState([]);

//   // Status
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Filters: employees
//   const [employeeSearch, setEmployeeSearch] = useState("");
//   const [selectedEmployees, setSelectedEmployees] = useState([]);
//   const [showEmpDropdown, setShowEmpDropdown] = useState(false);
//   const empRef = useOutclick(() => setShowEmpDropdown(false));

//   // Filters: dates (UPDATED - using SPOC calendar like AdminApproveWorklogs)
//   const todayISO = stripToISO(new Date());
//   const [datePopoverOpen, setDatePopoverOpen] = useState(false);
//   const [tempStart, setTempStart] = useState(isoNDaysAgo(2));
//   const [tempEnd, setTempEnd] = useState(todayISO);
//   const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(tempEnd)));
//   const [startISO, setStartISO] = useState(isoNDaysAgo(2));
//   const [endISO, setEndISO] = useState(todayISO);
//   const [isSelectingRange, setIsSelectingRange] = useState(false);
//   const popRef = useOutclick(() => setDatePopoverOpen(false));

//   // Filters: audit statuses
//   const ALL_STATUSES = AUDIT_STATUSES;
//   const [showStatusDropdown, setShowStatusDropdown] = useState(false);
//   const statusRef = useOutclick(() => setShowStatusDropdown(false));
//   const [selectedAuditStatuses, setSelectedAuditStatuses] = useState([...ALL_STATUSES]);

//   // Filters: Work Mode and Teams
//   const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);
//   const workModeRef = useOutclick(() => setShowWorkModeDropdown(false));
//   const [selectedWorkModes, setSelectedWorkModes] = useState([]);

//   const [showTeamDropdown, setShowTeamDropdown] = useState(false);
//   const teamRef = useOutclick(() => setShowTeamDropdown(false));
//   const [selectedTeams, setSelectedTeams] = useState([]);

//   // Filters: hour bucket
//   const [selectedHourBucket, setSelectedHourBucket] = useState("ALL");

//   // Filter: Global search
//   const [globalSearch, setGlobalSearch] = useState("");

//   // Edit / Add modals
//   const [globalAddOpen, setGlobalAddOpen] = useState(false);
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [addModalOpen, setAddModalOpen] = useState(false);
//   const [savingEdit, setSavingEdit] = useState(false);
//   const [savingAdd, setSavingAdd] = useState(false);

//   const [editForm, setEditForm] = useState(initialFormState());
//   const [addForm, setAddForm] = useState(initialFormState());
//   const [formErrors, setFormErrors] = useState({});

//   // Context for add
//   const [addContext, setAddContext] = useState({ dateKey: null, employeeName: null });

//   // Project search
//   const [suggestions, setSuggestions] = useState([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const [showSuggest, setShowSuggest] = useState(false);
//   const [searchBy, setSearchBy] = useState("name");
//   const suggestRef = useRef(null);

//   /* --- Fetch employees --- */
//   useEffect(() => {
//     if (!user) return;
//     fetchEmployees();
//   }, [user]);

//   const fetchEmployees = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       const response = await fetch(`${API_BASE_URL}/admin/users`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(await response.text());
//       }

//       const data = await response.json();
//       setEmployees(data.users || []);

//     } catch (err) {
//       console.error("Failed to fetch employees:", err.response?.data?.message || err.message);
//     }
//   };

//   /* --- Fetch worklogs --- */
//   useEffect(() => {
//     if (!user) return;
//     fetchWorklogs();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, startISO, endISO, selectedEmployees, selectedAuditStatuses, selectedWorkModes, selectedTeams, selectedHourBucket]);

//   const fetchWorklogs = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = localStorage.getItem("authToken");
//       const response = await axios.post(`${API_BASE_URL}/admin/worklogs`, {
//         startDate: startISO,
//         endDate: endISO,
//         employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
//         auditStatus: selectedAuditStatuses.length === ALL_STATUSES.length ? undefined : selectedAuditStatuses,
//         workModes: selectedWorkModes.length > 0 ? selectedWorkModes : undefined,
//         teams: selectedTeams.length > 0 ? selectedTeams : undefined,
//       }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (response.data.success) {
//         setWorklogsByDate(response.data.worklogsByDate || {});
//       } else {
//         throw new Error(response.data.message || "Failed to fetch worklogs");
//       }
//     } catch (err) {
//       console.error(err);
//       setError(`Failed to fetch worklogs: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* --- Derived helpers --- */
//   const sortedDateKeys = useMemo(
//     () => Object.keys(worklogsByDate).sort((a, b) => new Date(b) - new Date(a)),
//     [worklogsByDate]
//   );

//   // Group by team first, then by employee
//   const groupByTeamAndEmployee = (items) => {
//     const byTeam = {};
//     for (const row of items) {
//       const team = row.team || "Unknown";
//       if (!byTeam[team]) byTeam[team] = {};
//       const empName = row.employeeName || row.name || "Unknown";
//       if (!byTeam[team][empName]) byTeam[team][empName] = [];
//       byTeam[team][empName].push(row);
//     }

//     const sortedTeams = {};
//     Object.keys(byTeam).sort().forEach(team => {
//       sortedTeams[team] = Object.fromEntries(
//         Object.keys(byTeam[team])
//           .sort((a, b) => a.localeCompare(b))
//           .map(emp => [emp, byTeam[team][emp]])
//       );
//     });

//     return sortedTeams;
//   };

//   // Calculate total hours
//   const calculateTotalHours = (rows) => {
//     return rows.reduce((total, row) => total + (parseFloat(row.hoursSpent || row.hours_spent) || 0), 0);
//   };

//   // Get background color based on total hours
//   const getHoursBgColor = (totalHours) => {
//     if (totalHours >= 6.5 && totalHours <= 7.5) return "bg-emerald-100";
//     if (totalHours < 6.5) return "bg-red-100";
//     if (totalHours > 7.5) return "bg-blue-100";
//     return "";
//   };

//   // Get team color class
//   const getTeamColorClass = (team) => {
//     return TEAM_COLORS[team] || "bg-gray-100 border-gray-300 text-gray-800";
//   };

//   const rowClassForAudit = (status) => {
//     if (status === "Approved" || status === "Re-Approved") return "bg-emerald-50/70";
//     if (status === "Rejected" || status === "Re-Rejected") return "bg-rose-50/70";
//     if (status === "Re-Pending") return "bg-amber-50";
//     if (status === "Pending") return "bg-yellow-50";
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
//     if (status === "Re-Pending")
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-xs font-medium">
//           <Clock className="w-4 h-4" /> Re-Pending
//         </span>
//       );
//     if (status === "Re-Approved")
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 text-emerald-800 px-2 py-0.5 text-xs font-medium">
//           <CheckCircle className="w-4 h-4" /> Re-Approved
//         </span>
//       );
//     if (status === "Re-Rejected")
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-rose-200 text-rose-800 px-2 py-0.5 text-xs font-medium">
//           <XCircle className="w-4 h-4" /> Re-Rejected
//         </span>
//       );
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 text-yellow-800 px-2 py-0.5 text-xs font-medium">
//         <Clock className="w-4 h-4" /> Pending
//       </span>
//     );
//   };

//   // Global search highlighting
//   const highlightText = (text, searchTerm) => {
//     if (!searchTerm || !text) return text;
//     const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
//     const parts = String(text).split(regex);
//     return parts.map((part, index) =>
//       regex.test(part) ? (
//         <span key={index} className="bg-yellow-200 px-0.5 rounded font-medium">
//           {part}
//         </span>
//       ) : part
//     );
//   };

//   // Filter entries by global search
//   const filterByGlobalSearch = (entries) => {
//     if (!globalSearch.trim()) return entries;
//     const searchTerm = globalSearch.toLowerCase();
//     return entries.filter(entry => {
//       const searchableFields = [
//         entry.employeeName || entry.employee_name,
//         entry.workMode || entry.work_mode,
//         entry.projectName || entry.project_name,
//         entry.task || entry.task_name,
//         entry.bookElement || entry.book_element,
//         entry.chapterNo || entry.chapter_number,
//         entry.status,
//         entry.details,
//         entry.auditStatus || entry.audit_status,
//         entry.team,
//         String(entry.hoursSpent || entry.hours_spent),
//         String(entry.noOfUnits || entry.number_of_units),
//         entry.unitType || entry.unit_type,
//       ].filter(Boolean);
//       return searchableFields.some(field =>
//         String(field).toLowerCase().includes(searchTerm)
//       );
//     });
//   };

//   /* --- Helper for property access --- */
//   const getProperty = (obj, ...keys) => {
//     for (const key of keys) {
//       if (obj[key] !== undefined && obj[key] !== null) return obj[key];
//     }
//     return "";
//   };

//   /* --- CRUD: Edit / Delete / Add --- */
//   const handleOpenEdit = (log, dateKey) => {
//     setEditForm({
//       _id: log._id || log.id,
//       employeeName: getProperty(log, 'employeeName', 'employee_name', 'name'),
//       workMode: getProperty(log, 'workMode', 'work_mode'),
//       projectName: getProperty(log, 'projectName', 'project_name'),
//       task: getProperty(log, 'task', 'task_name'),
//       bookElement: getProperty(log, 'bookElement', 'book_element'),
//       chapterNumbers: log.chapterNo
//         ? [String(log.chapterNo)]
//         : (log.chapter_number
//           ? log.chapter_number.split(", ").filter(Boolean)
//           : []),
//       hoursSpent: getProperty(log, 'hoursSpent', 'hours_spent'),
//       noOfUnits: getProperty(log, 'noOfUnits', 'number_of_units'),
//       unitType: getProperty(log, 'unitType', 'unit_type') || "pages",
//       status: log.status || "",
//       dueOn: toISODateOnly(getProperty(log, 'dueOn', 'due_on')) || dateKey,
//       details: log.details || "",
//       auditStatus: getProperty(log, 'auditStatus', 'audit_status') || "Pending",
//       dateKey,
//     });
//     setFormErrors({});
//     setEditModalOpen(true);
//   };

//   const handleSaveEdit = async () => {
//     const { invalid, canSubmit, projectValid } = validateAdminEntry(editForm, suggestions);
//     const errs = {}; Object.entries(invalid).forEach(([k, v]) => v && (errs[k] = "Required"));
//     if (!projectValid) errs.projectValid = "Please choose a valid project.";
//     setFormErrors(errs);
//     if (!canSubmit || !projectValid) return;

//     try {
//       setSavingEdit(true);
//       const response = await axios.put(`${API_BASE_URL}/admin/worklogs/${editForm._id}`, {
//         employeeName: editForm.employeeName,
//         workMode: editForm.workMode,
//         projectName: editForm.projectName,
//         task: editForm.task,
//         bookElement: editForm.bookElement,
//         chapterNumbers: editForm.chapterNumbers.join(", "),
//         hoursSpent: Number(editForm.hoursSpent) || 0,
//         noOfUnits: Number(editForm.noOfUnits) || 0,
//         unitType: editForm.unitType,
//         status: editForm.status,
//         details: editForm.details,
//         auditStatus: editForm.auditStatus,
//       });

//       if (response.data.success) {
//         setWorklogsByDate((prev) => {
//           const next = { ...prev };
//           const dk = editForm.dateKey;
//           if (!next[dk]) return next;
//           next[dk] = next[dk].map((r) =>
//             (r._id || r.id) === editForm._id
//               ? {
//                 ...r,
//                 employeeName: editForm.employeeName,
//                 workMode: editForm.workMode,
//                 projectName: editForm.projectName,
//                 task: editForm.task,
//                 bookElement: editForm.bookElement,
//                 chapterNumbers: editForm.chapterNumbers.join(", "),
//                 chapterNo: editForm.chapterNumbers.join(", "),
//                 hoursSpent: Number(editForm.hoursSpent) || 0,
//                 noOfUnits: Number(editForm.noOfUnits) || 0,
//                 unitType: editForm.unitType,
//                 status: editForm.status,
//                 details: editForm.details,
//                 auditStatus: editForm.auditStatus,
//               }
//               : r
//           );
//           return next;
//         });

//         setEditModalOpen(false);
//       } else {
//         throw new Error(response.data.message || "Failed to save changes");
//       }
//     } catch (err) {
//       console.error(err);
//       alert(`Failed to save changes: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setSavingEdit(false);
//     }
//   };

//   const handleDelete = async (log) => {
//     const worklogId = log._id || log.id;
//     if (!worklogId) {
//       alert("Error: Could not identify the worklog entry to delete.");
//       return;
//     }
//     if (!window.confirm("Are you sure you want to delete this entry?")) return;

//     try {
//       const response = await axios.delete(`${API_BASE_URL}/admin/worklogs/${worklogId}`);
//       if (response.data.success) {
//         setWorklogsByDate((prev) => {
//           const next = { ...prev };
//           for (const dateKey of Object.keys(next)) {
//             next[dateKey] = next[dateKey].filter((r) => (r._id || r.id) !== worklogId);
//           }
//           return next;
//         });
//       } else {
//         throw new Error(response.data.message || "Failed to delete entry");
//       }
//     } catch (err) {
//       console.error(err);
//       alert(`Failed to delete entry: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   const handleOpenAdd = (employeeName, dateKey) => {
//     setAddContext({ dateKey, employeeName });
//     setAddForm({
//       _id: undefined,
//       employeeName: employeeName || "",
//       date: dateKey,
//       workMode: "",
//       projectName: "",
//       task: "",
//       bookElement: "",
//       chapterNumbers: [],
//       hoursSpent: "",
//       noOfUnits: "",
//       unitType: "pages",
//       status: "",
//       dueOn: dateKey,
//       details: "",
//       team: user.team,
//       auditStatus: "Pending",
//     });
//     setFormErrors({});
//     setAddModalOpen(true);
//   };

//   const handleOpenGlobalAdd = () => {
//     const todayDate = toISODateOnly(new Date());
//     setAddForm({
//       _id: undefined,
//       employeeName: "",
//       date: todayDate,
//       workMode: "",
//       projectName: "",
//       task: "",
//       bookElement: "",
//       chapterNumbers: [],
//       hoursSpent: "",
//       noOfUnits: "",
//       unitType: "pages",
//       status: "",
//       dueOn: todayDate,
//       details: "",
//       team: user.team,
//       auditStatus: "Pending",
//     });
//     setFormErrors({});
//     setGlobalAddOpen(true);
//   };

//   const handleSaveAdd = async (mode = "inline") => {
//     const form = addForm;
//     const { invalid, canSubmit, projectValid } = validateAdminEntry(form, suggestions);
//     const errs = {};
//     Object.entries(invalid).forEach(([k, v]) => v && (errs[k] = "Required"));
//     if (!projectValid) errs.projectValid = "Please choose a valid project.";
//     setFormErrors(errs);
//     if (!canSubmit || !projectValid) return;

//     try {
//       setSavingAdd(true);
//       const response = await axios.post(`${API_BASE_URL}/admin/worklogs/create`, {
//         employeeName: form.employeeName,
//         date: mode === "inline" ? addContext.dateKey : form.dueOn,
//         workMode: form.workMode,
//         projectName: form.projectName,
//         task: form.task,
//         bookElement: form.bookElement,
//         chapterNumbers: form.chapterNumbers.join(", "),
//         hoursSpent: Number(form.hoursSpent) || 0,
//         noOfUnits: Number(form.noOfUnits) || 0,
//         unitType: form.unitType,
//         status: form.status,
//         dueOn: form.dueOn,
//         details: form.details,
//         auditStatus: form.auditStatus,
//         team: user.team,
//       });

//       if (response.data.success) {
//         const dk = mode === "global" ? toISODateOnly(form.dueOn) : addContext.dateKey;
//         setWorklogsByDate((prev) => {
//           const next = { ...prev };
//           const createdRow = response.data.worklog || {};
//           const normalizedRow = {
//             _id: createdRow._id || createdRow.id,
//             employeeName: createdRow.employeeName || createdRow.employee_name || form.employeeName,
//             workMode: createdRow.workMode || createdRow.work_mode || form.workMode,
//             projectName: createdRow.projectName || createdRow.project_name || form.projectName,
//             task: createdRow.task || form.task,
//             bookElement: createdRow.bookElement || createdRow.book_element || form.bookElement,
//             chapterNo: createdRow.chapterNo || createdRow.chapter_number || form.chapterNumbers.join(", "),
//             hoursSpent: createdRow.hoursSpent || createdRow.hours_spent || form.hoursSpent,
//             noOfUnits: createdRow.noOfUnits || createdRow.number_of_units || form.noOfUnits,
//             unitType: createdRow.unitType || createdRow.unit_type || form.unitType,
//             status: createdRow.status || form.status,
//             dueOn: createdRow.dueOn || createdRow.due_on || form.dueOn,
//             details: createdRow.details || form.details,
//             auditStatus: createdRow.auditStatus || createdRow.audit_status || form.auditStatus,
//             team: createdRow.team || user.team,
//           };
//           if (!next[dk]) next[dk] = [];
//           next[dk] = [...next[dk], normalizedRow];
//           return next;
//         });

//         if (mode === "inline") setAddModalOpen(false);
//         else setGlobalAddOpen(false);
//       } else {
//         throw new Error(response.data.message || "Failed to add entry");
//       }
//     } catch (err) {
//       console.error(err);
//       alert(`Failed to add entry: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setSavingAdd(false);
//     }
//   };

//   /* --- Project search --- */
//   useEffect(() => {
//     let active = true;
//     const form = editModalOpen ? editForm : (addModalOpen || globalAddOpen) ? addForm : null;
//     if (!form) return;
//     const q = (form.projectName || "").trim();
//     if (!q) { setSuggestions([]); setShowSuggest(false); return; }
//     setLoadingSuggestions(true);
//     const t = setTimeout(async () => {
//       try {
//         const token = localStorage.getItem("authToken");
//         const { data } = await axios.get(`${API_BASE_URL}/projects`, {
//           params: { q, by: searchBy },
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!active) return;
//         const transformed = (data.projects || []).map((p) => ({
//           id: p.project_id || p.id || p.code || p.name,
//           name: p.project_name || p.name || p.title,
//           dueOn: p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : null,
//         }));
//         setSuggestions(transformed);
//         setShowSuggest(transformed.length > 0);
//       } catch {
//         setSuggestions([]); setShowSuggest(false);
//       } finally {
//         setLoadingSuggestions(false);
//       }
//     }, 300);
//     return () => { active = false; clearTimeout(t); setLoadingSuggestions(false); };
//   }, [editForm.projectName, addForm.projectName, editModalOpen, addModalOpen, globalAddOpen, searchBy]);

//   const selectProjectIntoForm = (p, which = "edit") => {
//     const setter = which === "edit" ? setEditForm : setAddForm;
//     setter((f) => ({
//       ...f,
//       projectName: p.id,
//       dueOn: f.dueOn || p.dueOn || "",
//     }));
//     setShowSuggest(false);
//   };

//   /* --- Date filter helpers (SPOC style - same as AdminApproveWorklogs) --- */
//   const handleCalendarDateSelect = (iso) => {
//     if (iso > todayISO) return;

//     if (!tempStart || (tempStart && tempEnd && !isSelectingRange)) {
//       // Start new selection
//       setTempStart(iso);
//       setTempEnd(null);
//       setIsSelectingRange(true);
//     } else if (tempStart && !tempEnd && isSelectingRange) {
//       // Complete the range and auto-apply
//       let finalStart = tempStart;
//       let finalEnd = iso;

//       if (iso >= tempStart) {
//         finalEnd = iso;
//       } else {
//         finalEnd = tempStart;
//         finalStart = iso;
//       }

//       setTempStart(finalStart);
//       setTempEnd(finalEnd);
//       setIsSelectingRange(false);

//       // Auto-apply the selection
//       setStartISO(finalStart);
//       setEndISO(finalEnd);
//       setDatePopoverOpen(false);
//     } else {
//       // Start new selection
//       setTempStart(iso);
//       setTempEnd(null);
//       setIsSelectingRange(true);
//     }
//   };

//   const handleQuickDateSelect = (days) => {
//     const endDate = todayISO;
//     const startDate = days === 1 ? todayISO : isoNDaysAgo(days - 1);

//     // Auto-apply for quick selections
//     setStartISO(startDate);
//     setEndISO(endDate);
//     setTempStart(startDate);
//     setTempEnd(endDate);
//     setIsSelectingRange(false);
//     setDatePopoverOpen(false);
//   };

//   const labelForFilter = () =>
//     startISO === endISO ? formatISOToHuman(startISO) : `${formatISOToHuman(startISO)} – ${formatISOToHuman(endISO)}`;

//   /* --- Render guards --- */
//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-100">
//         <div className="flex items-center gap-3">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
//           <p>Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   /* =================== LAYOUT =================== */
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
//                 Admin Dashboard <span className="hidden sm:inline">- Edit Worklogs</span>
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
//                 {!mobileMenuOpen ? (
//                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                   </svg>
//                 ) : (
//                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Mobile Menu Dropdown */}
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
//         <div className="fixed inset-0 z-40 lg:hidden">
//           <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//           <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
//             <SidebarLinks navigate={navigate} location={useLocation()} close={() => setSidebarOpen(false)} />
//           </aside>
//         </div>
//       )}
//       <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//         <SidebarLinks navigate={navigate} location={location} />
//       </aside>

//       {/* =================== MAIN CONTENT =================== */}
//       <main className="lg:ml-72 pt-20 p-6">
//         <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-full overflow-hidden">
//           {/* ===== Filters ===== */}
//           <div className="rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
//             <div className="flex items-center gap-2 mb-3 lg:mb-4">
//               <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
//               <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters</h3>
//             </div>

//             {/* Filters Row */}
//             <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">
//               {/* Global Search */}
//               <div className="w-full lg:min-w-[280px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Search Entries</label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={globalSearch}
//                     onChange={(e) => setGlobalSearch(e.target.value)}
//                     placeholder="Search across all fields..."
//                     className="w-full border rounded-lg px-3 py-2 pl-10 text-xs lg:text-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                   />
//                   <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
//                   {globalSearch && (
//                     <button
//                       onClick={() => setGlobalSearch("")}
//                       className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Date Picker (SPOC style - same as AdminApproveWorklogs) */}
//               <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Date Range</label>
//                 <button
//                   onClick={() => setDatePopoverOpen((o) => !o)}
//                   className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex items-center gap-2 min-w-0 flex-1">
//                     <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
//                     <span className="text-xs lg:text-sm font-medium truncate">{labelForFilter()}</span>
//                   </span>
//                   <span className="text-xs text-slate-500 ml-2 flex-shrink-0">Range</span>
//                 </button>

//                 {datePopoverOpen && (
//                   <div className="absolute z-50 mt-1 left-0 top-full bg-white border rounded-xl shadow-2xl w-full max-w-xs">
//                     <div className="px-3 py-2 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
//                       <div className="text-sm font-semibold text-slate-800">Select Date Range</div>
//                       <button
//                         onClick={() => setDatePopoverOpen(false)}
//                         className="p-1 hover:bg-slate-200 rounded-md transition-colors"
//                         aria-label="Close calendar"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>

//                     {/* Quick Select Buttons */}
//                     <div className="px-2 py-1 bg-blue-50 border-b">
//                       <div className="text-xs font-medium text-slate-700 mb-1">Quick Select:</div>
//                       <div className="grid grid-cols-2 gap-1">
//                         <button
//                           onClick={() => handleQuickDateSelect(1)}
//                           className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
//                         >
//                           Today
//                         </button>
//                         <button
//                           onClick={() => handleQuickDateSelect(3)}
//                           className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
//                         >
//                           Past 3 Days
//                         </button>
//                         <button
//                           onClick={() => handleQuickDateSelect(7)}
//                           className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
//                         >
//                           Past 1 Week
//                         </button>
//                         <button
//                           onClick={() => handleQuickDateSelect(30)}
//                           className="text-xs px-1 py-0.5 rounded border hover:bg-slate-50 transition-colors font-medium text-center"
//                         >
//                           Past 1 Month
//                         </button>
//                       </div>
//                     </div>

//                     <div className="p-2">
//                       <div className="mb-1 text-xs text-slate-600 bg-amber-50 p-1 rounded border border-amber-200">
//                         <strong>How to select:</strong> Click start date, then end date.
//                         {isSelectingRange && tempStart && (
//                           <div className="mt-0.5 font-medium text-amber-700">
//                             Starting from {formatISOToHuman(tempStart)}
//                           </div>
//                         )}
//                         {tempStart && tempEnd && !isSelectingRange && (
//                           <div className="mt-0.5 font-medium text-green-700">
//                             Selected: {formatISOToHuman(tempStart)} to {formatISOToHuman(tempEnd)}
//                           </div>
//                         )}
//                       </div>

//                       {/* Month navigation */}
//                       <div className="flex items-center justify-between mb-1">
//                         <button
//                           onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), -1)))}
//                           className="p-0.5 hover:bg-slate-200 rounded transition-colors"
//                           aria-label="Previous month"
//                         >
//                           <ChevronLeft className="w-3 h-3" />
//                         </button>
//                         <div className="text-xs font-medium min-w-[100px] text-center">{formatMonthKey(activeMonth)}</div>
//                         <button
//                           onClick={() => {
//                             const nextM = addMonths(parseMonthKey(activeMonth), 1);
//                             if (isMonthFullyInFuture(nextM)) return;
//                             setActiveMonth(toMonthKey(nextM));
//                           }}
//                           className="p-0.5 hover:bg-slate-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                           aria-label="Next month"
//                           disabled={isMonthFullyInFuture(addMonths(parseMonthKey(activeMonth), 1))}
//                         >
//                           <ChevronRight className="w-3 h-3" />
//                         </button>
//                       </div>

//                       {/* Calendar grid */}
//                       <CalendarGrid
//                         monthKey={activeMonth}
//                         tempStart={tempStart}
//                         tempEnd={tempEnd}
//                         onPick={handleCalendarDateSelect}
//                         isSelectingRange={isSelectingRange}
//                       />
//                     </div>

//                     <div className="px-2 py-1 border-t bg-slate-50 rounded-b-xl">
//                       <div className="text-xs text-slate-600">
//                         {tempStart && tempEnd ? (
//                           <span>Selected: <span className="font-medium">{tempStart === tempEnd ? formatISOToHuman(tempStart) : `${formatISOToHuman(tempStart)} – ${formatISOToHuman(tempEnd)}`}</span></span>
//                         ) : tempStart ? (
//                           <span>Start: <span className="font-medium">{formatISOToHuman(tempStart)}</span></span>
//                         ) : (
//                           <span>Click a date to start</span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Employees multi-select */}
//               <div ref={empRef} className="relative w-full lg:min-w-[280px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Employees</label>
//                 <button
//                   onClick={() => setShowEmpDropdown((o) => !o)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedEmployees.length === 0 ? (
//                       <span className="text-slate-600">All employees</span>
//                     ) : (
//                       selectedEmployees.slice(0, 3).map((name) => (
//                         <span key={name} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                           {name}
//                         </span>
//                       ))
//                     )}
//                     {selectedEmployees.length > 3 && (
//                       <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                         +{selectedEmployees.length - 3} more
//                       </span>
//                     )}
//                   </span>
//                   <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showEmpDropdown ? "rotate-180" : "rotate-0"}`} />
//                 </button>

//                 {showEmpDropdown && (
//                   <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
//                     <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center gap-2 sticky top-0">
//                       <UsersIcon className="w-3.5 h-3.5" />
//                       Select employees
//                     </div>
//                     <div className="p-2 border-b bg-white sticky top-[28px]">
//                       <div className="flex items-center gap-2">
//                         <div className="relative flex-1">
//                           <input
//                             value={employeeSearch}
//                             onChange={(e) => setEmployeeSearch(e.target.value)}
//                             placeholder="Search employee…"
//                             className="w-full h-8 rounded-lg border px-8 text-xs"
//                           />
//                           <SearchIcon className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
//                         </div>
//                         <button
//                           className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
//                           onClick={() => setSelectedEmployees(employees.map((e) => e.name))}
//                         >
//                           Select All
//                         </button>
//                         <button
//                           className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
//                           onClick={() => setSelectedEmployees([])}
//                         >
//                           Clear
//                         </button>
//                       </div>
//                     </div>
//                     {employees
//                       .filter((emp) => employeeSearch ? emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) : true)
//                       .map((emp) => (
//                         <label key={emp._id || emp.name} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                           <input
//                             type="checkbox"
//                             value={emp.name}
//                             checked={selectedEmployees.includes(emp.name)}
//                             onChange={(e) => {
//                               if (e.target.checked) setSelectedEmployees((p) => [...p, emp.name]);
//                               else setSelectedEmployees((p) => p.filter((n) => n !== emp.name));
//                             }}
//                             className="mr-2"
//                           />
//                           <span className="truncate">{emp.name}</span>
//                         </label>
//                       ))}
//                   </div>
//                 )}
//               </div>

//               {/* Work Mode multi-select */}
//               <div ref={workModeRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Work Mode</label>
//                 <button
//                   onClick={() => setShowWorkModeDropdown((o) => !o)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedWorkModes.length === 0 ? (
//                       <span className="text-slate-600">All work modes</span>
//                     ) : (
//                       selectedWorkModes.map((mode) => (
//                         <span key={mode} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                           {mode}
//                         </span>
//                       ))
//                     )}
//                   </span>
//                   <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showWorkModeDropdown ? "rotate-180" : "rotate-0"}`} />
//                 </button>

//                 {showWorkModeDropdown && (
//                   <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                     <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
//                       <span className="flex items-center gap-2">
//                         <UsersIcon className="w-3.5 h-3.5" />
//                         Select work modes
//                       </span>
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => setSelectedWorkModes([...WORK_MODES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
//                         <button onClick={() => setSelectedWorkModes([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
//                       </div>
//                     </div>
//                     {WORK_MODES.map((mode) => (
//                       <label key={mode} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                         <input
//                           type="checkbox"
//                           value={mode}
//                           checked={selectedWorkModes.includes(mode)}
//                           onChange={() =>
//                             setSelectedWorkModes((prev) =>
//                               prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
//                             )
//                           }
//                           className="mr-2"
//                         />
//                         {mode}
//                       </label>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Teams multi-select */}
//               <div ref={teamRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Teams</label>
//                 <button
//                   onClick={() => setShowTeamDropdown((o) => !o)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedTeams.length === 0 ? (
//                       <span className="text-slate-600">All teams</span>
//                     ) : (
//                       selectedTeams.map((team) => (
//                         <span key={team} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColorClass(team)}`}>
//                           {team}
//                         </span>
//                       ))
//                     )}
//                   </span>
//                   <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showTeamDropdown ? "rotate-180" : "rotate-0"}`} />
//                 </button>

//                 {showTeamDropdown && (
//                   <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                     <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
//                       <span className="flex items-center gap-2">
//                         <UsersIcon className="w-3.5 h-3.5" />
//                         Select teams
//                       </span>
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => setSelectedTeams([...ALL_TEAMS])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
//                         <button onClick={() => setSelectedTeams([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
//                       </div>
//                     </div>
//                     {ALL_TEAMS.map((team) => (
//                       <label key={team} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                         <input
//                           type="checkbox"
//                           value={team}
//                           checked={selectedTeams.includes(team)}
//                           onChange={() =>
//                             setSelectedTeams((prev) =>
//                               prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
//                             )
//                           }
//                           className="mr-2"
//                         />
//                         <span className={`inline-block w-3 h-3 rounded-full mr-2 ${TEAM_COLORS[team]?.split(' ')[0]}`}></span>
//                         {team}
//                       </label>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Audit Status multi-select */}
//               <div ref={statusRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Audit Status</label>
//                 <button
//                   onClick={() => setShowStatusDropdown((o) => !o)}
//                   className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                 >
//                   <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                     {selectedAuditStatuses.length === ALL_STATUSES.length ? (
//                       <span className="text-slate-600">All statuses</span>
//                     ) : selectedAuditStatuses.length === 0 ? (
//                       <span className="text-slate-600">None selected</span>
//                     ) : (
//                       selectedAuditStatuses.map((s) => (
//                         <span key={s} className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-medium">
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

//               {/* Hours bucket */}
//               <div className="w-full lg:w-auto">
//                 <Label>Hours Sum</Label>
//                 <select
//                   className="w-full h-9 rounded-lg border px-3 text-sm bg-white"
//                   value={selectedHourBucket}
//                   onChange={(e) => setSelectedHourBucket(e.target.value)}
//                 >
//                   {HOUR_BUCKETS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
//                 </select>
//               </div>

//               {/* Summary info */}
//               <div className="w-full lg:w-auto flex flex-wrap items-center gap-3 lg:ml-auto">
//                 <div className="text-xs text-slate-700">
//                   <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-sky-100 text-sky-800">
//                     <Clock className="w-3.5 h-3.5 flex-shrink-0" />
//                     <span className="font-medium">Edit & manage entries directly</span>
//                   </div>
//                 </div>
//                 <button
//                   className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
//                   onClick={handleOpenGlobalAdd}
//                 >
//                   <Plus className="w-4 h-4" /> Global Add Entry
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* ===== States ===== */}
//           {loading && (
//             <div className="flex items-center gap-3 py-6">
//               <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-slate-900" />
//               <span className="text-sm lg:text-base text-slate-800">Loading worklogs…</span>
//             </div>
//           )}

//           {error && (
//             <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
//               <div className="flex items-center">
//                 <AlertCircle className="w-5 h-5 text-rose-500 mr-3" />
//                 <span className="text-rose-700">{error}</span>
//               </div>
//               <button onClick={fetchWorklogs} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-sm self-start sm:ml-auto">
//                 Retry
//               </button>
//             </div>
//           )}

//           {!loading && !error && sortedDateKeys.length === 0 && (
//             <div className="text-center py-8 lg:py-12">
//               <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No Worklogs Found</h3>
//               <p className="text-sm lg:text-base text-slate-600">Try changing the date range, employees, or status filters above.</p>
//             </div>
//           )}

//           {/* ===== By Date - Grouped by Team then Employee ===== */}
//           {!loading &&
//             !error &&
//             sortedDateKeys.map((dateKey) => {
//               const allRows = worklogsByDate[dateKey] || [];

//               // Filter by audit status, work mode, team
//               let filteredRows = allRows.filter((r) =>
//                 selectedAuditStatuses.includes(r.auditStatus || r.audit_status || "Pending")
//               );

//               if (selectedWorkModes.length > 0) {
//                 filteredRows = filteredRows.filter((r) =>
//                   selectedWorkModes.includes(r.workMode || r.work_mode)
//                 );
//               }

//               if (selectedTeams.length > 0) {
//                 filteredRows = filteredRows.filter((r) =>
//                   selectedTeams.includes(r.team)
//                 );
//               }

//               // Apply global search filter
//               filteredRows = filterByGlobalSearch(filteredRows);

//               // Group by team and employee
//               const groupedByTeam = groupByTeamAndEmployee(filteredRows);

//               // Filter by hour bucket at the team-employee level
//               const processedGrouped = {};
//               Object.keys(groupedByTeam).forEach(team => {
//                 processedGrouped[team] = {};
//                 Object.keys(groupedByTeam[team]).forEach(emp => {
//                   const logs = groupedByTeam[team][emp];
//                   const total = calculateTotalHours(logs);
//                   const bucket = HOUR_BUCKETS.find((b) => b.id === selectedHourBucket);
//                   if ((bucket?.test ?? (() => true))(total)) {
//                     processedGrouped[team][emp] = logs;
//                   }
//                 });
//                 // Remove empty teams
//                 if (Object.keys(processedGrouped[team]).length === 0) {
//                   delete processedGrouped[team];
//                 }
//               });

//               if (Object.keys(processedGrouped).length === 0) return null;

//               const totalEntries = Object.values(processedGrouped).reduce((acc, teamData) =>
//                 acc + Object.values(teamData).reduce((empAcc, logs) => empAcc + logs.length, 0), 0
//               );

//               return (
//                 <section key={dateKey} className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
//                   <div className="px-4 lg:px-5 py-3 lg:py-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                     <h2 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2">
//                       <CalendarIcon className="w-4 h-4 text-indigo-600" />
//                       {formatISOToHuman(dateKey)}
//                       <span className="ml-2 rounded-full bg-indigo-100 text-indigo-700 text-[11px] px-2 py-0.5 font-medium">
//                         {totalEntries} entries
//                       </span>
//                     </h2>
//                   </div>

//                   {/* Desktop grouped tables by Team > Employee */}
//                   <div className="hidden lg:block">
//                     {Object.keys(processedGrouped).map((team) => (
//                       <div key={team} className="border-b last:border-b-0">
//                         {/* Team Header */}
//                         <div className={`px-4 py-3 ${getTeamColorClass(team)}`}>
//                           <h3 className="text-sm font-semibold">{team}</h3>
//                         </div>

//                         {/* Employees in this team */}
//                         {Object.keys(processedGrouped[team]).map((emp) => {
//                           const logs = processedGrouped[team][emp];
//                           const totalHours = calculateTotalHours(logs);
//                           const hoursBgColor = getHoursBgColor(totalHours);

//                           return (
//                             <div key={emp} className="p-4">
//                               <div className="flex items-center justify-between mb-3">
//                                 <div className="flex items-center gap-3">
//                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
//                                     {emp.split(" ").map((x) => x[0] || "").join("").slice(0, 2).toUpperCase()}
//                                   </div>
//                                   <div>
//                                     <div className="text-sm font-semibold text-slate-900">{emp}</div>
//                                     <div className="text-xs text-slate-500">
//                                       {logs.length} {logs.length === 1 ? "entry" : "entries"}
//                                     </div>
//                                   </div>
//                                   <div className={`ml-4 px-3 py-1 rounded-full ${hoursBgColor} text-xs font-medium`}>
//                                     Total Hours: {totalHours.toFixed(1)}
//                                   </div>
//                                 </div>

//                                 <button
//                                   className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
//                                   onClick={() => handleOpenAdd(emp, dateKey)}
//                                 >
//                                   <Plus className="w-4 h-4" /> Add Entry
//                                 </button>
//                               </div>

//                               <div className="overflow-x-auto rounded-xl border border-slate-200">
//                                 <table className="w-full text-sm border-collapse">
//                                   <thead>
//                                     <tr className="bg-slate-100 text-slate-700">
//                                       <Th>Work Mode</Th>
//                                       <Th>Project</Th>
//                                       <Th>Task</Th>
//                                       <Th>Book Element</Th>
//                                       <Th>Chapters</Th>
//                                       <Th>Hours Spent</Th>
//                                       <Th>No. of Units</Th>
//                                       <Th>Unit Type</Th>
//                                       <Th>Status</Th>
//                                       <Th>Due On</Th>
//                                       <Th>Details</Th>
//                                       <Th>Audit Status</Th>
//                                       <Th>Action</Th>
//                                     </tr>
//                                   </thead>
//                                   <tbody>
//                                     {logs.map((log) => (
//                                       <tr key={log._id} className={`${rowClassForAudit(log.auditStatus || log.audit_status)} border-t`}>
//                                         <Td>{highlightText(log.workMode || log.work_mode, globalSearch)}</Td>
//                                         <Td className="max-w-[260px] truncate" title={log.projectName || log.project_name}>
//                                           {highlightText(log.projectName || log.project_name, globalSearch)}
//                                         </Td>
//                                         <Td>{highlightText(log.task || log.task_name, globalSearch)}</Td>
//                                         <Td>{highlightText(log.bookElement || log.book_element, globalSearch)}</Td>
//                                         <Td>{highlightText(log.chapterNo || log.chapter_number, globalSearch)}</Td>
//                                         <Td>{highlightText(log.hoursSpent || log.hours_spent, globalSearch)}</Td>
//                                         <Td>{highlightText(log.noOfUnits || log.number_of_units, globalSearch)}</Td>
//                                         <Td>{highlightText(log.unitType || log.unit_type, globalSearch)}</Td>
//                                         <Td>{highlightText(log.status, globalSearch)}</Td>
//                                         <Td>{formatISOToHuman(log.dueOn || log.due_on)}</Td>
//                                         <Td className="max-w-[220px] whitespace-normal break-words">
//                                           {highlightText(log.details || "-", globalSearch)}
//                                         </Td>
//                                         <Td>
//                                           <AuditBadge status={log.auditStatus || log.audit_status} />
//                                         </Td>
//                                         <Td>
//                                           <div className="flex gap-2">
//                                             <button
//                                               className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md"
//                                               onClick={() => handleOpenEdit(log, dateKey)}
//                                               title="Edit"
//                                             >
//                                               <Pencil size={16} />
//                                             </button>
//                                             <button
//                                               className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-md"
//                                               onClick={() => handleDelete(log)}
//                                               title="Delete"
//                                             >
//                                               <Trash2 size={16} />
//                                             </button>
//                                           </div>
//                                         </Td>
//                                       </tr>
//                                     ))}
//                                   </tbody>
//                                 </table>
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ))}
//                   </div>

//                   {/* Mobile grouped cards by Team > Employee */}
//                   <div className="lg:hidden p-3 sm:p-4 space-y-4 sm:space-y-6">
//                     {Object.keys(processedGrouped).map((team) => (
//                       <div key={team} className="rounded-lg border border-slate-200 overflow-hidden">
//                         {/* Team Header */}
//                         <div className={`px-3 sm:px-4 py-2 ${getTeamColorClass(team)}`}>
//                           <h3 className="text-sm font-semibold">{team}</h3>
//                         </div>

//                         {/* Employees in this team */}
//                         {Object.keys(processedGrouped[team]).map((emp) => {
//                           const logs = processedGrouped[team][emp];
//                           const totalHours = calculateTotalHours(logs);
//                           const hoursBgColor = getHoursBgColor(totalHours);

//                           return (
//                             <div key={emp} className="border-t first:border-t-0">
//                               <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-50/70">
//                                 <div className="flex items-center gap-3 min-w-0 flex-1">
//                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
//                                     {emp.split(" ").map((x) => x[0] || "").join("").slice(0, 2).toUpperCase()}
//                                   </div>
//                                   <div className="min-w-0 flex-1">
//                                     <div className="text-sm font-semibold text-slate-900 truncate">{emp}</div>
//                                     <div className="text-xs text-slate-500">
//                                       {logs.length} {logs.length === 1 ? "entry" : "entries"}
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                   <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hoursBgColor}`}>
//                                     {totalHours.toFixed(1)}h
//                                   </span>
//                                   <button
//                                     className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
//                                     onClick={() => handleOpenAdd(emp, dateKey)}
//                                   >
//                                     <Plus className="w-4 h-4" />
//                                     Add
//                                   </button>
//                                 </div>
//                               </div>

//                               <div className="divide-y">
//                                 {logs.map((log) => (
//                                   <article key={log._id} className={`p-3 sm:p-4 ${rowClassForAudit(log.auditStatus || log.audit_status)}`}>
//                                     <div className="flex items-start justify-between mb-3">
//                                       <div className="min-w-0 flex-1 pr-3">
//                                         <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate" title={log.projectName || log.project_name}>
//                                           {highlightText(log.projectName || log.project_name, globalSearch)}
//                                         </h3>
//                                         <p className="text-xs text-slate-500 mt-0.5">
//                                           {highlightText(log.task || log.task_name, globalSearch)} · {highlightText(log.bookElement || log.book_element, globalSearch)} · {highlightText(log.chapterNo || log.chapter_number, globalSearch)}
//                                         </p>
//                                       </div>
//                                       <AuditBadge status={log.auditStatus || log.audit_status} />
//                                     </div>

//                                     <dl className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-[13px] mb-4">
//                                       <Info label="Work Mode" value={highlightText(log.workMode || log.work_mode, globalSearch)} />
//                                       <Info label="Hours" value={highlightText(log.hoursSpent || log.hours_spent, globalSearch)} />
//                                       <Info label="Units" value={highlightText(`${log.noOfUnits || log.number_of_units} ${log.unitType || log.unit_type || ""}`, globalSearch)} />
//                                       <Info label="Status" value={highlightText(log.status, globalSearch)} />
//                                       <Info label="Due On" value={formatISOToHuman(log.dueOn || log.due_on)} />
//                                       {log.details && (
//                                         <div className="col-span-2">
//                                           <dt className="text-slate-500">Details</dt>
//                                           <dd className="text-slate-800 break-words">{highlightText(log.details, globalSearch)}</dd>
//                                         </div>
//                                       )}
//                                     </dl>

//                                     <div className="flex flex-wrap gap-2">
//                                       <button
//                                         className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex-1 min-w-0"
//                                         onClick={() => handleOpenEdit(log, dateKey)}
//                                       >
//                                         <Pencil size={16} />
//                                         <span>Edit</span>
//                                       </button>
//                                       <button
//                                         className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm flex-1 min-w-0"
//                                         onClick={() => handleDelete(log)}
//                                       >
//                                         <Trash2 size={16} />
//                                         <span>Delete</span>
//                                       </button>
//                                     </div>
//                                   </article>
//                                 ))}
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ))}
//                   </div>
//                 </section>
//               );
//             })}
//         </div>
//       </main>

//       {/* MODALS - Edit, Add, Global Add */}
//       {editModalOpen && <EditModal />}
//       {addModalOpen && <AddModal />}
//       {globalAddOpen && <GlobalAddModal />}
//     </div>
//   );

//   // Modal Components
//   function EditModal() {
//     return (
//       <Modal onClose={() => setEditModalOpen(false)} title="Edit Worklog Entry">
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Employee">
//               <input type="text" className="w-full h-9 rounded-lg border px-3 text-sm bg-slate-100" value={editForm.employeeName} disabled />
//             </Field>
//             <Field label="Date">
//               <input type="date" className="w-full h-9 rounded-lg border px-3 text-sm" value={editForm.dateKey} onChange={(e) => setEditForm((f) => ({ ...f, dateKey: e.target.value }))} />
//             </Field>
//           </div>

//           <Field label="Work Mode">
//             <Select value={editForm.workMode} onChange={(v) => setEditForm((f) => ({ ...f, workMode: v }))} options={["", ...WORK_MODES]} isInvalid={!!formErrors.workMode} />
//             <ErrorText text={formErrors.workMode} />
//           </Field>

//           <Field label="Project ID *">
//             <div className="relative" ref={suggestRef}>
//               <input
//                 type="text"
//                 className={`w-full h-9 rounded-lg border px-3 text-sm ${formErrors.projectValid ? "border-rose-500" : ""}`}
//                 value={editForm.projectName}
//                 onChange={(e) => setEditForm((f) => ({ ...f, projectName: e.target.value }))}
//                 placeholder="Type project ID…"
//               />
//               {loadingSuggestions && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
//               {showSuggest && suggestions.length > 0 && (
//                 <ul className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
//                   {suggestions.map((s) => (
//                     <li key={s.id} onClick={() => selectProjectIntoForm(s, "edit")} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
//                       <div className="font-medium">{s.id}</div>
//                       <div className="text-xs text-slate-500">{s.name}</div>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//               <ErrorText text={formErrors.projectValid} />
//             </div>
//           </Field>

//           <Field label="Task">
//             <Select value={addForm.task} onChange={(v) => setAddForm((f) => ({ ...f, task: v }))} options={["", ...TASKS]} isInvalid={!!formErrors.task} />
//           </Field>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Book Element">
//               <Select value={addForm.bookElement} onChange={(v) => setAddForm((f) => ({ ...f, bookElement: v }))} options={["", ...BASE_BOOK_ELEMENTS]} />
//             </Field>
//             <Field label="Chapters">
//               <MultiSelectChips value={addForm.chapterNumbers} onChange={(vals) => setAddForm((f) => ({ ...f, chapterNumbers: vals }))} options={BASE_CHAPTER_NUMBERS} />
//             </Field>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Hours Spent">
//               <Select value={addForm.hoursSpent} onChange={(v) => setAddForm((f) => ({ ...f, hoursSpent: v }))} options={["", ...HOURS]} />
//             </Field>
//             <Field label="Units">
//               <div className="flex gap-2">
//                 <input type="number" className="w-20 h-9 rounded-lg border px-2 text-sm" value={addForm.noOfUnits} onChange={(e) => setAddForm((f) => ({ ...f, noOfUnits: e.target.value }))} />
//                 <Select value={addForm.unitType} onChange={(v) => setAddForm((f) => ({ ...f, unitType: v }))} options={UNITS} />
//               </div>
//             </Field>
//           </div>

//           <Field label="Status">
//             <Select value={addForm.status} onChange={(v) => setAddForm((f) => ({ ...f, status: v }))} options={["", ...STATUS]} />
//           </Field>

//           <Field label="Details / Remarks">
//             <textarea className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm" value={addForm.details} onChange={(e) => setAddForm((f) => ({ ...f, details: e.target.value }))} />
//           </Field>

//           <Field label="Audit Status">
//             <Select value={addForm.auditStatus} onChange={(v) => setAddForm((f) => ({ ...f, auditStatus: v }))} options={AUDIT_STATUSES} />
//           </Field>

//           <div className="flex justify-end gap-3 pt-2">
//             <button onClick={() => setAddModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm hover:bg-slate-300">Cancel</button>
//             <button onClick={() => handleSaveAdd("inline")} disabled={savingAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
//               {savingAdd ? "Saving..." : "Add Entry"}
//             </button>
//           </div>
//         </div>
//       </Modal>
//     );
//   }

//   function GlobalAddModal() {
//     return (
//       <Modal onClose={() => setGlobalAddOpen(false)} title="Global Add Entry">
//         <div className="space-y-4">
//           <Field label="Employee">
//             <select className="w-full h-9 rounded-lg border px-3 text-sm" value={addForm.employeeName} onChange={(e) => setAddForm((f) => ({ ...f, employeeName: e.target.value }))}>
//               <option value="">Select Employee</option>
//               {employees.map((emp) => <option key={emp._id || emp.name} value={emp.name}>{emp.name}</option>)}
//             </select>
//           </Field>
//           <Field label="Date">
//             <input type="date" className="w-full h-9 rounded-lg border px-3 text-sm" value={addForm.dueOn} onChange={(e) => setAddForm((f) => ({ ...f, dueOn: e.target.value }))} />
//           </Field>
//           <Field label="Work Mode">
//             <Select value={addForm.workMode} onChange={(v) => setAddForm((f) => ({ ...f, workMode: v }))} options={["", ...WORK_MODES]} />
//           </Field>

//           <Field label="Project ID *">
//             <div className="relative" ref={suggestRef}>
//               <input
//                 type="text"
//                 className="w-full h-9 rounded-lg border px-3 text-sm"
//                 value={addForm.projectName}
//                 onChange={(e) => setAddForm((f) => ({ ...f, projectName: e.target.value }))}
//                 placeholder="Type project ID…"
//               />
//               {showSuggest && suggestions.length > 0 && (
//                 <ul className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
//                   {suggestions.map((s) => (
//                     <li key={s.id} onClick={() => selectProjectIntoForm(s, "add")} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
//                       <div className="font-medium">{s.id}</div>
//                       <div className="text-xs text-slate-500">{s.name}</div>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </Field>  {/* ✅ This closing tag was missing */}

//           <Field label="Task">
//             <Select value={addForm.task} onChange={(v) => setAddForm((f) => ({ ...f, task: v }))} options={["", ...TASKS]} />
//           </Field>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Book Element">
//               <Select value={addForm.bookElement} onChange={(v) => setAddForm((f) => ({ ...f, bookElement: v }))} options={["", ...BASE_BOOK_ELEMENTS]} />
//             </Field>
//             <Field label="Chapters">
//               <MultiSelectChips value={addForm.chapterNumbers} onChange={(vals) => setAddForm((f) => ({ ...f, chapterNumbers: vals }))} options={BASE_CHAPTER_NUMBERS} />
//             </Field>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Hours Spent">
//               <Select value={addForm.hoursSpent} onChange={(v) => setAddForm((f) => ({ ...f, hoursSpent: v }))} options={["", ...HOURS]} />
//             </Field>
//             <Field label="Units">
//               <div className="flex gap-2">
//                 <input type="number" className="w-20 h-9 rounded-lg border px-2 text-sm" value={addForm.noOfUnits} onChange={(e) => setAddForm((f) => ({ ...f, noOfUnits: e.target.value }))} />
//                 <Select value={addForm.unitType} onChange={(v) => setAddForm((f) => ({ ...f, unitType: v }))} options={UNITS} />
//               </div>
//             </Field>
//           </div>

//           <Field label="Status">
//             <Select value={addForm.status} onChange={(v) => setAddForm((f) => ({ ...f, status: v }))} options={["", ...STATUS]} />
//           </Field>

//           <Field label="Details / Remarks">
//             <textarea className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm" value={addForm.details} onChange={(e) => setAddForm((f) => ({ ...f, details: e.target.value }))} />
//           </Field>

//           <Field label="Audit Status">
//             <Select value={addForm.auditStatus} onChange={(v) => setAddForm((f) => ({ ...f, auditStatus: v }))} options={AUDIT_STATUSES} />
//           </Field>

//           <div className="flex justify-end gap-3 pt-2">
//             <button onClick={() => setGlobalAddOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm hover:bg-slate-300">Cancel</button>
//             <button onClick={() => handleSaveAdd("global")} disabled={savingAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
//               {savingAdd ? "Saving..." : "Add Entry"}
//             </button>
//           </div>
//         </div>
//       </Modal>
//     );
//   }
// }

// /* =============== SidebarLinks =============== */
// function SidebarLinks({ navigate, location, close }) {
//   const [openWorklogs, setOpenWorklogs] = useState(false);
//   const [openProjects, setOpenProjects] = useState(false);

//   useEffect(() => {
//     if (location.pathname.includes("worklog")) setOpenWorklogs(true);
//     if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
//       setOpenProjects(true);
//   }, [location]);

//   const handleNavigation = (path) => {
//     navigate(path);
//     if (close) close();
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//       <nav className="flex flex-col space-y-2">
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin-dashboard")}
//         >
//           Home
//         </button>
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin/add-unit-type" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/add-unit-type")}
//         >
//           Add Unit Type
//         </button>

//         {/* Worklogs */}
//         <div>
//           <button
//             className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
//             onClick={() => setOpenWorklogs(!openWorklogs)}
//           >
//             <span>Worklogs</span>
//             <span className="transition-transform duration-200">
//               {openWorklogs ? "▾" : "▸"}
//             </span>
//           </button>
//           {openWorklogs && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""}`}
//                 onClick={() => handleNavigation("/admin/approve-worklogs")}
//               >
//                 Approve Worklogs
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""}`}
//                 onClick={() => handleNavigation("/admin/edit-worklog-entries")}
//               >
//                 Edit Worklogs
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Employees */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/handle-employees")}
//         >
//           Manage Employees
//         </button>
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/push-missing-request")}
//         >
//           Push Missing Requests
//         </button>
//         {/* Teams */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("team-wise-dropdowns") ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/team-wise-dropdowns")}
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
//             <span className="transition-transform duration-200">
//               {openProjects ? "▾" : "▸"}
//             </span>
//           </button>
//           {openProjects && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""}`}
//                 onClick={() => handleNavigation("/admin/add-abbreviations")}
//               >
//                 Add Abbreviations
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""}`}
//                 onClick={() => handleNavigation("/admin/add-project")}
//               >
//                 Add Project
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("project-requests") ? "bg-gray-700" : ""}`}
//                 onClick={() => handleNavigation("/admin/project-requests")}
//               >
//                 Project Requests
//               </button>
//             </div>
//           )}
//         </div>
//       </nav>
//     </div>
//   );
// }

// /* =================== Small components =================== */
// function Info({ label, value }) {
//   return (
//     <div className="min-w-0">
//       <dt className="text-slate-500 truncate">{label}</dt>
//       <dd className="text-slate-800 break-words">{value ?? "-"}</dd>
//     </div>
//   );
// }

// function Field({ label, hint, children }) {
//   return (
//     <label className="block">
//       <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
//       {children}
//       {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
//     </label>
//   );
// }

// function Select({ value, onChange, options, isInvalid, className = "", ...rest }) {
//   return (
//     <select
//       className={`w-full h-9 text-sm px-2 rounded-lg border ${isInvalid ? "border-rose-500" : "border-slate-300"} focus:border-indigo-600 ${className}`}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       {...rest}
//     >
//       {options.map((o, idx) => (
//         <option key={idx} value={typeof o === "string" ? o : o.value}>
//           {typeof o === "string" ? o : (o.label ?? o.value)}
//         </option>
//       ))}
//     </select>
//   );
// }

// /* =================== MultiSelectChips =================== */
// function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select…", isInvalid = false }) {
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const shellRef = useRef(null);
//   const inputRef = useRef(null);
//   const lastTs = useRef(0);

//   useEffect(() => {
//     const fn = (e) => { if (shellRef.current && !shellRef.current.contains(e.target)) setOpen(false); };
//     document.addEventListener("mousedown", fn);
//     return () => document.removeEventListener("mousedown", fn);
//   }, []);

//   const guard = () => { const n = Date.now(); if (n - lastTs.current < 120) return false; lastTs.current = n; return true; };
//   const add = (item) => { if (!guard()) return; if (!value.includes(item)) onChange([...value, item]); setQuery(""); setOpen(true); inputRef.current?.focus(); };
//   const removeAt = (i) => { if (!guard()) return; const next = value.slice(); next.splice(i, 1); onChange(next); setOpen(true); inputRef.current?.focus(); };

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return options.filter((o) => !value.includes(o)).filter((o) => q ? o.toLowerCase().includes(q) : true);
//   }, [options, value, query]);

//   return (
//     <div className="relative" ref={shellRef}>
//       <div
//         className={`min-h-[44px] w-full rounded-lg border bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${isInvalid ? "border-rose-500" : "border-slate-300"} focus-within:border-indigo-600`}
//         onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); setOpen(true); inputRef.current?.focus(); }}
//         role="combobox" aria-expanded={open}
//       >
//         {value.map((v, idx) => (
//           <span key={`${v}-${idx}`} className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-[2px] text-xs">
//             {v}
//             <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeAt(idx); }} className="ml-1 rounded-full hover:bg-indigo-100 p-[2px] leading-none" aria-label={`Remove ${v}`}>✕</button>
//           </span>
//         ))}
//         <input
//           ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
//           onFocus={() => setOpen(true)}
//           onKeyDown={(e) => { if (e.key === "Backspace" && query === "" && value.length) removeAt(value.length - 1); }}
//           className="flex-1 min-w-[80px] outline-none text-sm px-1 py-1 bg-transparent"
//           placeholder={value.length ? "" : placeholder}
//         />
//       </div>
//       {open && (
//         <div className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-lg border bg-white shadow-2xl" role="listbox" onMouseDown={(e) => e.preventDefault()}>
//           {filtered.length === 0 ? (
//             <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
//           ) : filtered.map((opt) => (
//             <div key={opt} role="option" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); add(opt); }} className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer">
//               {opt}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /* =================== Calendar Grid (SPOC style) =================== */
// function CalendarGrid({ monthKey, tempStart, tempEnd, onPick, isSelectingRange }) {
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
//     if (!iso || !tempStart) return false;
//     if (!tempEnd) return iso === tempStart;
//     const start = tempStart <= tempEnd ? tempStart : tempEnd;
//     const end = tempEnd >= tempStart ? tempEnd : tempStart;
//     return iso >= start && iso <= end;
//   };

//   const isSelectionStart = (iso) => {
//     if (!tempStart) return false;
//     if (!tempEnd) return iso === tempStart;
//     const start = tempStart <= tempEnd ? tempStart : tempEnd;
//     return iso === start;
//   };

//   const isSelectionEnd = (iso) => {
//     if (!tempStart || !tempEnd || tempStart === tempEnd) return false;
//     const end = tempEnd >= tempStart ? tempEnd : tempStart;
//     return iso === end;
//   };

//   return (
//     <div className="min-h-[160px]">
//       <div className="grid grid-cols-7 text-[10px] text-slate-500 mb-0.5 font-medium">
//         {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
//           <div key={d} className="text-center py-0.5">{d}</div>
//         ))}
//       </div>
//       <div className="grid grid-cols-7 gap-0.5">
//         {cells.map((iso, idx) => {
//           if (!iso) return <div key={idx} className="h-5" />;

//           const disabled = iso > today;
//           const selected = isInSelection(iso);
//           const isStart = isSelectionStart(iso);
//           const isEnd = isSelectionEnd(iso);
//           const isToday = iso === today;

//           return (
//             <button
//               key={idx}
//               disabled={disabled}
//               onClick={() => onPick(iso)}
//               className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] transition-all duration-200 relative font-medium
//                 ${disabled ? "opacity-30 cursor-not-allowed text-slate-400" : "hover:bg-indigo-50 cursor-pointer text-slate-700"}
//                 ${selected && !isStart && !isEnd ? "bg-indigo-100 text-indigo-700" : ""}
//                 ${isStart || isEnd ? "bg-indigo-600 text-white shadow" : ""}
//                 ${isToday && !selected ? "ring-1 ring-indigo-300" : ""}
//                 ${isSelectingRange && tempStart && !disabled ? "hover:bg-indigo-200" : ""}
//               `}
//               title={`${formatISOToHuman(iso)}${isToday ? ' (Today)' : ''}${disabled ? ' (Future date)' : ''}`}
//             >
//               {new Date(iso).getUTCDate()}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// /* =================== Date helpers =================== */
// function stripToISO(d) {
//   const dt = new Date(d);
//   dt.setUTCHours(0, 0, 0, 0);
//   return dt.toISOString().split("T")[0];
// }
// function toISODateOnly(value) {
//   if (!value) return "";
//   const d = new Date(value);
//   if (isNaN(d.getTime())) {
//     return String(value);
//   }
//   return stripToISO(d);
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

// /* =================== Validation helpers =================== */
// function initialFormState() {
//   return {
//     _id: undefined,
//     employeeName: "",
//     date: "",
//     workMode: "",
//     projectName: "",
//     task: "",
//     bookElement: "",
//     chapterNumbers: [],
//     hoursSpent: "",
//     noOfUnits: "",
//     unitType: "pages",
//     status: "",
//     dueOn: "",
//     details: "",
//     auditStatus: "Pending",
//   };
// }

// const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : v == null || String(v).trim() === "");
// function validateAdminEntry(form, suggestions) {
//   const projectValid = (!!form.projectName && String(form.projectName).trim() !== "");
//   const required = {
//     employeeName: form.employeeName,
//     dueOn: form.dueOn,
//     workMode: form.workMode,
//     projectValid: projectValid ? "ok" : "",
//     task: form.task,
//     bookElement: form.bookElement,
//     chapterNumbers: form.chapterNumbers,
//     hoursSpent: form.hoursSpent,
//     noOfUnits: form.noOfUnits,
//     unitType: form.unitType,
//     status: form.status,
//     auditStatus: form.auditStatus,
//   };
//   const invalid = Object.fromEntries(Object.entries(required).map(([k, v]) => [k, isEmpty(v)]));
//   return { invalid, canSubmit: Object.values(required).every((v) => !isEmpty(v)), projectValid };
// }

// /* =================== Outclick hook =================== */
// function useOutclick(onOut) {
//   const ref = useRef(null);
//   useEffect(() => {
//     function onDoc(e) {
//       if (!ref.current) return;
//       if (!ref.current.contains(e.target)) {
//         setTimeout(() => {
//           onOut?.();
//         }, 10);
//       }
//     }
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, [onOut]);
//   return ref;
// }

// /* =================== Modal wrapper =================== */
// function Modal({ children, title, onClose, widthClass = "max-w-4xl" }) {
//   useEffect(() => {
//     const onEsc = (e) => e.key === "Escape" && onClose?.();
//     document.addEventListener("keydown", onEsc);
//     return () => document.removeEventListener("keydown", onEsc);
//   }, [onClose]);

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/40" onClick={onClose} />
//       <div className={`relative bg-white w-full ${widthClass} mx-4 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto`}>
//         <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
//           <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
//           <button
//             className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
//             onClick={onClose}
//             aria-label="Close"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }
