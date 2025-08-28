import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE;
// const API_BASE = "http://localhost:5000/api";

// Cache configuration
const CACHE_DURATION = 13.5 * 60 * 60 * 1000; // 13.5 hours
const AUTO_SUBMIT_TIME = "22:30"; // 10:30 PM
const CACHE_KEY = "worklog_cache_v1"; // bump if shape changes
const AUTO_SUBMIT_KEY = "lastAutoSubmitDate";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cache/auto-submit UI state
  const [cacheInfo, setCacheInfo] = useState({ count: 0, expiresAt: null, timeLeft: "" });
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState("");
  const autoSubmitIntervalRef = useRef(null);
  const cacheIntervalRef = useRef(null);

  // --- Static options ---
  const WORK_MODES = ["Leave", "In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night"];
  const STATUS = ["In Progress", "Delayed", "Completed", "Not approved"];
  const HOURS = ["0.5","1","1.5","2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8"];
  const TASKS = ["COM","CR1","CR2","CR3","CR4","SET","FER","FINAL","Coord","Meet"];
  const BASE_BOOK_ELEMENTS = ["Chapter","Mind Map","Title","Diagram","Solution","Illustration","Papers","Lesson Plan","Miscellaneous","Projects","Booklet"];
  const BASE_CHAPTER_NUMBERS = [
    "Papers","Full Book","Miscellaneous","Projects","Unit 1","Unit 2","Unit 3","Unit 4","Unit 5",
    ...Array.from({length:40},(_,i)=>String(i+1))
  ];
  const UNITS = [
    { label: "pages", value: "pages" },
    { label: "frames", value: "frames" },
    { label: "seconds", value: "seconds" },
    { label: "general", value: "general" },
  ];

  // --- Form state ---
  const [workMode, setWorkMode] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [task, setTask] = useState("");
  const [bookElement, setBookElement] = useState("");
  const [chapterNumber, setChapterNumber] = useState([]); // string[]
  const [hoursSpent, setHoursSpent] = useState("");
  const [status, setStatus] = useState("");
  const [unitsCount, setUnitsCount] = useState("");
  const [unitsType, setUnitsType] = useState("pages");
  const [dueOn, setDueOn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchBy, setSearchBy] = useState("name");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestRef = useRef(null);

  const [todayRows, setTodayRows] = useState([]);
  const [pastRows, setPastRows] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [pastError, setPastError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  // edit via form (not inline)
  const [editSourceIndex, setEditSourceIndex] = useState(-1);

  /* ==============================
     1) Define updateCacheInfo FIRST
     ============================== */
  const updateCacheInfo = useCallback(() => {
    let cached = null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      cached = raw ? JSON.parse(raw) : null;
    } catch {}

    if (!cached || !cached.entries) {
      setCacheInfo({ count: 0, expiresAt: null, timeLeft: "" });
      return;
    }

    const now = Date.now();
    const timeLeft = cached.expiresAt - now;
    if (timeLeft <= 0) {
      setCacheInfo({ count: 0, expiresAt: null, timeLeft: "" });
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    setCacheInfo({
      count: cached.entries.length,
      expiresAt: cached.expiresAt,
      timeLeft: `${hours}h ${minutes}m`,
    });
  }, []);

  /* ==============================
     2) Data loader BEFORE users
     ============================== */
  const fetchPastWorklogs = useCallback(async () => {
    setLoadingPast(true);
    setPastError(null);
    try {
      const { data } = await axios.get("/worklogs/recent", { params: { days: 7 } });
      if (data?.success && Array.isArray(data.rows)) {
        const mapped = data.rows.map((r) => ({
          id: r.id,
          date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
          workMode: r.work_mode,
          projectId: r.project_id || "",
          projectName: r.project_name,
          task: r.task_name,
          bookElement: r.book_element,
          chapterNo: r.chapter_number,
          hoursSpent: r.hours_spent,
          noOfUnits: r.number_of_units,
          unitsType: r.unit_type,
          status: r.status,
          dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : "",
          remarks: r.details || "",
          auditStatus: r.audit_status || "Pending",
        }));
        setPastRows(mapped);
        if (mapped.length === 0) setPastError("No recent worklogs found.");
      } else {
        setPastRows([]);
        setPastError("No recent worklogs found.");
      }
    } catch (err) {
      setPastError(`Failed to load recent worklogs: ${err?.response?.data?.message || err.message}`);
      setPastRows([]);
    } finally {
      setLoadingPast(false);
    }
  }, []);

  /* ==============================
     3) Cache helpers AFTER updateCacheInfo
     ============================== */
  const saveTodayRowsToCache = useCallback((rows) => {
    const cacheData = {
      entries: rows,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
      userName: user?.name || "unknown",
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn("Failed to write cache:", e);
    }
    updateCacheInfo();
  }, [user, updateCacheInfo]);

  const loadTodayRowsFromCache = useCallback(() => {
    let cached = null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      cached = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Failed to read cache:", e);
    }

    if (!cached || !cached.entries) return [];

    const now = Date.now();
    const isExpired = now > cached.expiresAt;
    const isDifferentUser = cached.userName !== (user?.name || "unknown");

    if (isExpired || isDifferentUser) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }

    return cached.entries;
  }, [user]);

  /* ==============================
     4) Auto-submit helpers
     ============================== */
  const getNextAutoSubmitTime = () => {
    const now = new Date();
    const target = new Date(now);
    const [h, m] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
    target.setHours(h, m, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
    return target;
  };

  const updateAutoSubmitCountdown = useCallback(() => {
    const nextSubmit = getNextAutoSubmitTime();
    const now = new Date();
    const diff = nextSubmit - now;

    if (diff <= 0) {
      setAutoSubmitCountdown("Auto-submit time reached!");
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setAutoSubmitCountdown(`${hours}h ${minutes}m ${seconds}s`);
  }, []);

  const performAutoSubmit = useCallback(async () => {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    } catch {}

    if (!cached || !cached.entries || cached.entries.length === 0) return;

    try {
      const payload = {
        entries: cached.entries.map((r) => ({
          workMode: r.workMode,
          projectId: r.projectId,
          projectName: r.projectName,
          task: r.task,
          bookElement: r.bookElement,
          chapterNo: String(r.chapterNo || ""),
          hoursSpent: Number(r.hoursSpent) || 0,
          noOfUnits: Number(r.noOfUnits) || 0,
          unitsType: r.unitsType,
          status: r.status,
          dueOn: r.dueOn || null,
          remarks: r.remarks || null,
        })),
      };

      const { data } = await axios.post("/worklogs", payload);
      localStorage.removeItem(CACHE_KEY);
      setTodayRows([]);
      updateCacheInfo();
      setSubmitMsg(`Auto-submitted ${data.inserted} entry(s) at ${AUTO_SUBMIT_TIME}!`);
      await fetchPastWorklogs();
    } catch (error) {
      setSubmitMsg(`Auto-submit failed: ${error?.response?.data?.message || error.message}`);
    }
  }, [updateCacheInfo, fetchPastWorklogs]);

  const checkAutoSubmit = useCallback(() => {
    const now = new Date();
    const [targetHours, targetMinutes] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (currentHours === targetHours && currentMinutes >= targetMinutes && currentMinutes < targetMinutes + 1) {
      const last = localStorage.getItem(AUTO_SUBMIT_KEY);
      const today = now.toDateString();
      if (last !== today) {
        localStorage.setItem(AUTO_SUBMIT_KEY, today);
        performAutoSubmit();
      }
    }
  }, [performAutoSubmit]);

  /* ==============================
     Effects: auth, initial load, timers
     ============================== */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const u = {
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
      };
      setUser(u);
      axios.defaults.baseURL = API_BASE;
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchPastWorklogs();
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate, fetchPastWorklogs]);

  useEffect(() => {
    if (user) {
      const cachedRows = loadTodayRowsFromCache();
      setTodayRows(cachedRows);
      updateCacheInfo();
    }
  }, [user, loadTodayRowsFromCache, updateCacheInfo]);

  useEffect(() => {
    if (user && todayRows.length >= 0) {
      saveTodayRowsToCache(todayRows);
    }
  }, [todayRows, saveTodayRowsToCache, user]);

  useEffect(() => {
    cacheIntervalRef.current = setInterval(updateCacheInfo, 60_000);
    autoSubmitIntervalRef.current = setInterval(() => {
      updateAutoSubmitCountdown();
      checkAutoSubmit();
    }, 1_000);

    updateCacheInfo();
    updateAutoSubmitCountdown();

    return () => {
      if (cacheIntervalRef.current) clearInterval(cacheIntervalRef.current);
      if (autoSubmitIntervalRef.current) clearInterval(autoSubmitIntervalRef.current);
    };
  }, [updateCacheInfo, updateAutoSubmitCountdown, checkAutoSubmit]);

  /* ==============================
     Actions
     ============================== */
  const handleLogout = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(AUTO_SUBMIT_KEY);
    localStorage.removeItem("authToken");
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    navigate("/");
  };

  const showFullBook = useMemo(() => ["FER","FINAL","COM"].includes(task), [task]);
  const bookElements = useMemo(() => (showFullBook ? ["Full Book", ...BASE_BOOK_ELEMENTS] : BASE_BOOK_ELEMENTS), [showFullBook]);
  const chapterNumbers = useMemo(
    () => (showFullBook ? BASE_CHAPTER_NUMBERS : BASE_CHAPTER_NUMBERS.filter((v) => v !== "Full Book")),
    [showFullBook]
  );

  useEffect(() => {
    let active = true;
    const q = projectQuery.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }

    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get("/projects", { params: { q, by: searchBy } });
        if (!active) return;
        const transformed = (data.projects || []).map((p) => ({
          id: p.project_id,
          name: p.project_name,
          dueOn: p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : null,
        }));
        setSuggestions(transformed);
        setShowSuggest(transformed.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggest(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(t);
      setLoadingSuggestions(false);
    };
  }, [projectQuery, searchBy]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!suggestRef.current) return;
      if (!suggestRef.current.contains(e.target)) setShowSuggest(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectProject = (p) => {
    setProjectId(p.id);
    setProjectName(p.name);
    setProjectQuery(p.id);
    if (p.dueOn) setDueOn(p.dueOn);
    setShowSuggest(false);
  };

  const isEmpty = (v) => Array.isArray(v) ? v.length === 0 : (v === null || v === undefined || String(v).trim() === "");
  const required = { workMode, projectId, task, bookElement, chapterNumber, hoursSpent, status, unitsCount, unitsType };
  const invalid = Object.fromEntries(Object.entries(required).map(([k, v]) => [k, isEmpty(v)]));
  const canSubmitRow = Object.values(required).every((v) => !isEmpty(v));

  const clearForm = () => {
    setWorkMode("");
    setProjectQuery("");
    setProjectId("");
    setProjectName("");
    setTask("");
    setBookElement("");
    setChapterNumber([]);
    setHoursSpent("");
    setStatus("");
    setUnitsCount("");
    setUnitsType("pages");
    setDueOn("");
    setRemarks("");
    setSubmitMsg(null);
    setEditSourceIndex(-1);
  };

  // SUBMIT: append if new; replace if editing
  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmitRow) return;

    const newRow = {
      workMode,
      projectId,
      projectName: projectName || projectQuery,
      task,
      bookElement,
      chapterNo: chapterNumber.join(", "),
      hoursSpent,
      noOfUnits: Number(unitsCount),
      unitsType,
      status,
      dueOn,
      remarks,
    };

    if (editSourceIndex !== -1) {
      // REPLACE the row at editSourceIndex
      setTodayRows((prev) => prev.map((r, i) => (i === editSourceIndex ? newRow : r)));
    } else {
      // Add new
      setTodayRows((prev) => [...prev, newRow]);
    }
    clearForm();
  };

  // copy & delete handlers
  const copyRowToForm = (row) => {
    setWorkMode(row.workMode || "");
    setProjectId(row.projectId || "");
    setProjectQuery(row.projectId || row.projectName || "");
    setProjectName(row.projectName || "");
    setTask(row.task || "");
    setBookElement(row.bookElement || "");
    setChapterNumber(
      typeof row.chapterNo === "string"
        ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
        : Array.isArray(row.chapterNo)
        ? row.chapterNo
        : []
    );
    setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
    setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
    setUnitsType(row.unitsType || "pages");
    setStatus(row.status || "");
    setDueOn(row.dueOn || "");
    setRemarks(row.remarks || "");
    // not in edit mode when only copying
    setEditSourceIndex(-1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // EDIT: copy into form and set edit mode (button shows "Update Entry")
  const startEditViaForm = (idx, row) => {
    copyRowToForm(row);
    setEditSourceIndex(idx); // indicates we came from edit
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRowAt = (idx) => {
    setTodayRows((prev) => prev.filter((_, i) => i !== idx));
    if (editSourceIndex === idx) setEditSourceIndex(-1);
  };

  async function submitTodaysWorklog() {
    if (todayRows.length === 0) return;
    setSubmitting(true);
    setSubmitMsg(null);

    try {
      const payload = {
        entries: todayRows.map((r) => ({
          workMode: r.workMode,
          projectId: r.projectId,
          projectName: r.projectName,
          task: r.task,
          bookElement: r.bookElement,
          chapterNo: String(r.chapterNo || ""),
          hoursSpent: Number(r.hoursSpent) || 0,
          noOfUnits: Number(r.noOfUnits) || 0,
          unitsType: r.unitsType,
          status: r.status,
          dueOn: r.dueOn || null,
          remarks: r.remarks || null,
        })),
      };

      const { data } = await axios.post("/worklogs", payload);
      setSubmitMsg(`Successfully submitted ${data.inserted} entry(s) to database!`);
      setTodayRows([]);
      localStorage.removeItem(CACHE_KEY);
      updateCacheInfo();
      await fetchPastWorklogs();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to submit. Please try again.";
      setSubmitMsg(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  /* ==============================
     Render
     ============================== */
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 text-sm">
      {/* Enhanced Responsive Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main navbar content */}
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo/Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                  <span className="block sm:inline">Employee Dashboard</span>
                  <span className="hidden sm:inline"> - Work Log</span>
                </h1>
              </div>
            </div>

            {/* Desktop menu - visible on md+ screens */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-slate-600"
                />
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-slate-300">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu - visible when open on small screens */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* User info */}
                <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-slate-600"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-slate-300">{user.email}</div>
                  </div>
                </div>

                {/* Logout button */}
                <div className="px-3">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* New Entry */}
          <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                {editSourceIndex !== -1 ? "Edit Entry" : "New Entry"}
              </h2>
              <div className="text-right">
                <span className="text-xs text-red-600">* required fields</span>
                {cacheInfo.count > 0 && (
                  <div className="text-xs text-blue-600 mt-1 md:hidden">
                    {cacheInfo.count} entries cached (auto-saves)
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Work Mode *">
                <Select
                  value={workMode}
                  onChange={setWorkMode}
                  options={["", ...WORK_MODES]}
                  labels={{ "": "— Select —" }}
                  isInvalid={invalid.workMode}
                />
              </Field>

              <Field label="Project Search *">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1" ref={suggestRef}>
                    <input
                      type="text"
                      placeholder="Start typing project name or ID…"
                      className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${
                        invalid.projectId ? "border-red-500" : "border-slate-300"
                      } focus:border-indigo-600`}
                      value={projectQuery}
                      onChange={(e) => {
                        setProjectQuery(e.target.value);
                        setProjectId("");
                        setProjectName("");
                        if (!e.target.value.trim()) setDueOn("");
                      }}
                    />
                    {loadingSuggestions && (
                      <div className="absolute right-3 top-2">
                        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {showSuggest && suggestions.length > 0 && (
                      <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border bg-white shadow-2xl">
                        {suggestions.map((s) => (
                          <li
                            key={s.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectProject(s);
                            }}
                            className="px-4 py-3 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-medium text-slate-900">{s.id}</div>
                            <div className="text-xs text-slate-600 mt-1">{s.name}</div>
                            {s.dueOn && <div className="text-xs text-orange-600 mt-1">Due: {s.dueOn}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {showSuggest && suggestions.length === 0 && !loadingSuggestions && projectQuery.trim() && (
                      <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-white shadow-2xl px-4 py-3 text-sm text-slate-500">
                        No projects found for "{projectQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </Field>

              <Field label="Task *">
                <Select
                  value={task}
                  onChange={setTask}
                  options={["", ...TASKS]}
                  labels={{ "": "— Select —" }}
                  isInvalid={invalid.task}
                />
              </Field>

              <Field label="Book Element *">
                <Select
                  value={bookElement}
                  onChange={setBookElement}
                  options={["", ...bookElements]}
                  labels={{ "": "— Select —" }}
                  isInvalid={invalid.bookElement}
                />
              </Field>

              <Field label="Chapter No. *">
                <MultiSelectChips
                  value={chapterNumber}
                  onChange={setChapterNumber}
                  options={chapterNumbers}
                  placeholder="Select chapter(s)…"
                  isInvalid={invalid.chapterNumber}
                />
              </Field>

              <Field label="Hours Spent *">
                <Select
                  value={hoursSpent}
                  onChange={setHoursSpent}
                  options={["", ...HOURS]}
                  labels={{ "": "— Select —" }}
                  isInvalid={invalid.hoursSpent}
                />
              </Field>

              <Field label="No. of Units *">
                <div className="flex gap-2 items-start">
                  <input
                    type="number"
                    className={`flex-1 h-9 text-sm px-3 rounded-2xl border-2 ${
                      invalid.unitsCount ? "border-red-500" : "border-slate-300"
                    } focus:border-indigo-600`}
                    placeholder="e.g., 10"
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(e.target.value)}
                  />
                  <div className="w-28">
                    <Select
                      value={unitsType}
                      onChange={setUnitsType}
                      options={UNITS.map((u) => u.value)}
                      labels={UNITS.reduce((m, u) => {
                        m[u.value] = u.label;
                        return m;
                      }, {})}
                      isInvalid={invalid.unitsType}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Status *">
                <Select
                  value={status}
                  onChange={setStatus}
                  options={["", ...STATUS]}
                  labels={{ "": "— Select —" }}
                  isInvalid={invalid.status}
                />
              </Field>

              <Field label="Due On">
                <input
                  type="date"
                  className="w-full h-9 text-sm px-3 rounded-2xl border-2 border-slate-300 focus:border-indigo-600"
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                />
                {dueOn && <div className="mt-1 text-xs text-slate-600">Due: {new Date(dueOn).toLocaleDateString()}</div>}
              </Field>

              <Field label="Details">
                <textarea
                  className="w-full min-h-[140px] text-sm px-3 py-2 rounded-2xl border-2 border-slate-300 focus:border-indigo-600"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={clearForm}
                className="w-full sm:w-auto px-4 py-1.5 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!canSubmitRow || !projectId}
                className={`w-full sm:w-auto px-5 py-1.5 rounded-2xl text-white transition-colors ${
                  canSubmitRow && projectId
                    ? "bg-indigo-700 hover:bg-indigo-800"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                {editSourceIndex !== -1 ? "Update Entry" : "Add to Today's Worklog"}
              </button>
            </div>
          </form>

          {/* Today's Worklog */}
          <section className="mt-8 space-y-6">
            {todayRows.length > 0 ? (
              <>
                <EditableBlock
                  title="Today's Worklog"
                  rows={todayRows}
                  onCopyRow={copyRowToForm}
                  onStartEdit={startEditViaForm}
                  onDeleteRow={deleteRowAt}
                  lists={{ WORK_MODES, TASKS, STATUS, HOURS, UNITS }}
                />
                <div className="text-xs text-slate-600 text-center bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2">
                  Your entries will auto-submit at 10:30 PM (in {autoSubmitCountdown})
                </div>
              </>
            ) : (
              <Feedback message={submitMsg || "No entries for today yet."} />
            )}

            <div className="flex items-center justify-center">
              <button
                onClick={submitTodaysWorklog}
                disabled={submitting || todayRows.length === 0}
                className="px-5 py-1.5 rounded-2xl text-white bg-emerald-700 disabled:opacity-60 hover:bg-emerald-800 transition-colors"
              >
                {submitting ? "Submitting…" : "Submit Today's Worklog"}
              </button>
            </div>

            {submitMsg && <Feedback message={submitMsg} />}
            {pastError && <Feedback message={pastError} />}
            {loadingPast && <Feedback message="Loading past 7 days worklog..." />}
            {!pastError && !loadingPast && pastRows.length === 0 && <Feedback message="No entries in the last 7 days." />}
            {pastRows.length > 0 && (
              <DataBlock
                title={`Past 7 Days Worklog (${pastRows.length} entries)`}
                rows={pastRows}
                subtle
                hideEdit
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ==============================
   UI Helpers
   ============================== */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, labels, isInvalid }) {
  const safeOptions = Array.isArray(options) ? options : [];
  const labelFor = (o) =>
    labels && typeof labels === "object" && Object.prototype.hasOwnProperty.call(labels, o) ? labels[o] : o;

  return (
    <select
      className={`w-full h-9 text-sm px-2 rounded-2xl border-2 ${
        isInvalid ? "border-red-500" : "border-slate-300"
      } focus:border-indigo-600`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {safeOptions.map((o, idx) => (
        <option key={idx} value={o}>
          {labelFor(o)}
        </option>
      ))}
    </select>
  );
}

function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select one or more…", isInvalid = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const lastActionTs = useRef(0);

  useEffect(() => {
    const handleDown = (e) => {
      if (!shellRef.current) return;
      if (!shellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  const deduped = useMemo(() => Array.from(new Set(options.map((o) => String(o)))), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deduped.filter((o) => !value.includes(o)).filter((o) => (q ? o.toLowerCase().includes(q) : true));
  }, [deduped, value, query]);

  const guardOnce = () => {
    const now = Date.now();
    if (now - lastActionTs.current < 120) return false;
    lastActionTs.current = now;
    return true;
  };

  const addItem = (item) => {
    if (!guardOnce()) return;
    if (!value.includes(item)) onChange([...value, item]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const removeAt = (idx) => {
    if (!guardOnce()) return;
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={shellRef}>
      <div
        className={`min-h-[44px] w-full rounded-2xl border-2 bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${
          isInvalid ? "border-red-500" : "border-slate-300"
        } focus-within:border-indigo-600`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
          setOpen(true);
          inputRef.current?.focus();
        }}
        role="combobox"
        aria-expanded={open}
      >
        {value.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-[2px] text-xs"
          >
            {v}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeAt(idx);
              }}
              className="ml-1 rounded-full hover:bg-indigo-100 p-[2px] leading-none"
              aria-label={`Remove ${v}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length) {
              removeAt(value.length - 1);
            }
          }}
          className="flex-1 min-w-[80px] outline-none text-sm px-1 py-1 bg-transparent"
          placeholder={value.length ? "" : placeholder}
        />
      </div>
      {open && (
        <div
          className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl border bg-white shadow-2xl"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                role="option"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addItem(opt);
                }}
                className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ==============================
   Tables & Blocks
   ============================== */
function DataBlock({ title, rows, subtle = false, hideEdit = false, onStartEdit }) {
  return (
    <div className={`rounded-2xl border ${subtle ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"} shadow-sm`}>
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-900">
            <tr>
              {PAST_HEADERS.map((h) => (
                <th key={h} className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">
                  {h}
                </th>
              ))}
              {!hideEdit && <th className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">Edit</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.workMode}</td>
                <td className="px-3 py-2 min-w-[14rem]">{r.projectId || r.projectName}</td>
                <td className="px-3 py-2">{r.task}</td>
                <td className="px-3 py-2">{r.bookElement}</td>
                <td className="px-3 py-2">{r.chapterNo}</td>
                <td className="px-3 py-2">{r.hoursSpent}</td>
                <td className="px-3 py-2">{r.noOfUnits}</td>
                <td className="px-3 py-2">{r.unitsType}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.dueOn}</td>
                <td className="px-3 py-2">{r.remarks}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    r.auditStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                    r.auditStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {r.auditStatus}
                  </span>
                </td>
                {!hideEdit && (
                  <td className="px-3 py-2">
                    <button
                      className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      onClick={() => onStartEdit(idx)}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableBlock({ title, rows, onStartEdit, onDeleteRow, onCopyRow, lists }) {
  const { } = lists; // kept for future use

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50 shadow-sm">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-900">
            <tr>
              {TODAY_HEADERS.map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
              {/* Actions on extreme right (sticky) */}
              <th className="px-3 py-2 font-semibold sticky right-0 bg-slate-100 z-10 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 whitespace-nowrap">{r.workMode}</td>
                <td className="px-3 py-2 min-w-[14rem]">{r.projectId || r.projectName}</td>
                <td className="px-3 py-2">{r.task}</td>
                <td className="px-3 py-2">{r.bookElement}</td>
                <td className="px-3 py-2">{r.chapterNo}</td>
                <td className="px-3 py-2">{r.hoursSpent}</td>
                <td className="px-3 py-2">{r.noOfUnits}</td>
                <td className="px-3 py-2">{r.unitsType}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.dueOn}</td>
                <td className="px-3 py-2">{r.remarks}</td>
                {/* Sticky right actions cell */}
                <td className="px-3 py-2 sticky right-0 bg-inherit z-10">
                  <div className="flex gap-1 justify-end">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-xl text-xs bg-sky-600 text-white hover:bg-sky-700"
                      onClick={() => onCopyRow?.(r)}
                      title="Copy this row into the form"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => onStartEdit?.(idx, r)}
                      title="Edit this row in the form"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-xl text-xs bg-rose-600 text-white hover:bg-rose-700"
                      onClick={() => onDeleteRow?.(idx)}
                      title="Delete this row"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniSelect({ value, onChange, options }) {
  return (
    <select
      className="h-8 px-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-600"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      {options.map((o, i) => (
        <option key={i} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Feedback({ message }) {
  const isError = message && (message.includes("Error") || message.includes("Failed"));
  const isSuccess = message && (message.includes("Successfully") || message.includes("submitted"));

  let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
  if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
  if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

  return <div className={`rounded-2xl border px-3 py-2 text-xs ${bgColor}`}>{message}</div>;
}

/* ==============================
   Data
   ============================== */
const TODAY_HEADERS = [
  "Work Mode",
  "Project Name",
  "Task",
  "Book Element",
  "Chapter No.",
  "Hours Spent",
  "No. of Units",
  "Unit Type",
  "Status",
  "Due On",
  "Details",
];

const PAST_HEADERS = [
  "Date",
  "Work Mode",
  "Project Name",
  "Task",
  "Book Element",
  "Chapter No.",
  "Hours Spent",
  "No. of Units",
  "Unit Type",
  "Status",
  "Due On",
  "Details",
  "Audit Status",
];
