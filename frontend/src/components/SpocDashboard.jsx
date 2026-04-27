// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
// import { useNavigate,useLocation } from "react-router-dom"
// import { jwtDecode } from "jwt-decode"
// import axios from "axios"

// const API_BASE = import.meta.env?.VITE_API_BASE;

// // Cache configuration
// const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
// const AUTO_SUBMIT_TIME = "03:00";
// const CACHE_KEY = "worklog_cache_v2";
// const AUTO_SUBMIT_KEY = "lastAutoSubmitDate";

// // Constants
// const WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night"];
// const STATUS = ["In Progress", "Delayed", "Completed", "Not approved"];
// const HOURS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8"];
// const UNITS = [
//   { label: "pages", value: "pages" },
//   { label: "frames", value: "frames" },
//   { label: "seconds", value: "seconds" },
//   { label: "general", value: "general" },
// ];

// // Default dropdown options
// const DEFAULT_TASKS = ["CMPL-MS", "VRF-MS", "DRF", "TAL", "R1", "R2", "R3", "R4", "CR", "FER", "SET", "FINAL", "MEET", "QRY", "Coord", "GLANCE", "Research", "Analysis", "KT", "Interview", "PLAN", "UPL", "Generation", "COM", "CR1", "CR2", "CR3", "CR4", "CR5", "Code"];
// const DEFAULT_BOOK_ELEMENTS = ["Theory", "Exercise", "Chapter", "Full book", "Mind Map", "Diagram", "Solution", "Booklet", "Full Video", "AVLR-VO", "DLR", "Lesson Plan", "Miscellaneous", "AVLR-Ideation", "Marketing", "Development", "Recruitment", "References", "Frames", "Papers", "Projects", "Lesson Plan", "Shooting", "Frontend", "Backend", "DB", "OST", "Visual Instructions", "Animation", "Sheets"];
// const DEFAULT_CHAPTER_NUMBERS = ["Title", "Syllabus", "Content", "Projects", "Papers", "Miscellaneous", "Appendix", "Full Book", "Full Book", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5",
//   ...Array.from({ length: 40 }, (_, i) => String(i + 1))
// ];

// export default function SpocDashboard() {
//   const navigate = useNavigate();
//   const location=useLocation();

//   const [user, setUser] = useState(null);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [tokenExpired, setTokenExpired] = useState(false);

//   // Team-wise dropdown state
//   const [teamDropdowns, setTeamDropdowns] = useState({
//     bookElements: [],
//     taskNames: [],
//     chapterNumbers: []
//   });
//   const [loadingDropdowns, setLoadingDropdowns] = useState(false);

//   // Cache/auto-submit UI state
//   const [cacheInfo, setCacheInfo] = useState({ count: 0, expiresAt: null, timeLeft: "" });
//   const [autoSubmitCountdown, setAutoSubmitCountdown] = useState("");

//   // Form state
//   const [workMode, setWorkMode] = useState("");
//   const [projectQuery, setProjectQuery] = useState("");
//   const [projectId, setProjectId] = useState("");
//   const [projectName, setProjectName] = useState("");
//   const [task, setTask] = useState("");
//   const [bookElement, setBookElement] = useState("");
//   const [chapterNumber, setChapterNumber] = useState([]);
//   const [hoursSpent, setHoursSpent] = useState("");
//   const [status, setStatus] = useState("");
//   const [unitsCount, setUnitsCount] = useState("");
//   const [unitsType, setUnitsType] = useState("pages");
//   const [dueOn, setDueOn] = useState("");
//   const [remarks, setRemarks] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggest, setShowSuggest] = useState(false);
//   const [searchBy, setSearchBy] = useState("name");
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const suggestRef = useRef(null);

//   const [todayRows, setTodayRows] = useState([]);
//   const [pastRows, setPastRows] = useState([]);
//   const [loadingPast, setLoadingPast] = useState(false);
//   const [loadingToday, setLoadingToday] = useState(false);
//   const [pastError, setPastError] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitMsg, setSubmitMsg] = useState(null);

//   const [editSourceIndex, setEditSourceIndex] = useState(-1);

//   /* TOKEN VALIDATION & AUTO-LOGOUT */
//   const checkTokenValidity = useCallback(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       setTokenExpired(true);
//       navigate("/");
//       return false;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       const currentTime = Date.now() / 1000;

//       if (decoded.exp < currentTime) {
//         setTokenExpired(true);
//         localStorage.removeItem("authToken");
//         localStorage.removeItem(CACHE_KEY);
//         localStorage.removeItem(AUTO_SUBMIT_KEY);
//         delete axios.defaults.headers.common.Authorization;
//         navigate("/");
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.error("Token validation error:", error);
//       setTokenExpired(true);
//       localStorage.removeItem("authToken");
//       localStorage.removeItem(CACHE_KEY);
//       localStorage.removeItem(AUTO_SUBMIT_KEY);
//       delete axios.defaults.headers.common.Authorization;
//       navigate("/");
//       return false;
//     }
//   }, [navigate]);

//   /* FETCH TEAM DROPDOWNS */
//   const fetchTeamWiseDropdowns = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     console.log("📡 Fetching team-wise dropdowns...");
//     setLoadingDropdowns(true);
//     try {
//       const { data } = await axios.get("/worklogs/team-dropdowns");
//       console.log("📥 Raw API Response:", JSON.stringify(data, null, 2));

//       if (data?.success && data?.dropdowns) {
//         console.log("✅ API Success! Dropdowns received:");
//         console.log("  - bookElements:", data.dropdowns.bookElements?.length || 0);
//         console.log("  - taskNames:", data.dropdowns.taskNames?.length || 0);
//         console.log("  - chapterNumbers:", data.dropdowns.chapterNumbers?.length || 0);

//         setTeamDropdowns({
//           bookElements: data.dropdowns.bookElements || [],
//           taskNames: data.dropdowns.taskNames || [],
//           chapterNumbers: data.dropdowns.chapterNumbers || []
//         });

//         console.log("✅ State updated successfully!");
//       } else {
//         console.log("⚠️ API returned success: false or no dropdowns");
//         setTeamDropdowns({
//           bookElements: [],
//           taskNames: [],
//           chapterNumbers: []
//         });
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       console.error("❌ Failed to load team dropdowns:", error);
//       setTeamDropdowns({
//         bookElements: [],
//         taskNames: [],
//         chapterNumbers: []
//       });
//     } finally {
//       setLoadingDropdowns(false);
//     }
//   }, [checkTokenValidity]);

//   // Memoized dropdown options based on team data
//   const TASKS = useMemo(() => {
//     if (teamDropdowns.taskNames && teamDropdowns.taskNames.length > 0) {
//       return teamDropdowns.taskNames;
//     }
//     return DEFAULT_TASKS;
//   }, [teamDropdowns.taskNames]);

//   const BASE_BOOK_ELEMENTS = useMemo(() => {
//     if (teamDropdowns.bookElements && teamDropdowns.bookElements.length > 0) {
//       return teamDropdowns.bookElements;
//     }
//     return DEFAULT_BOOK_ELEMENTS;
//   }, [teamDropdowns.bookElements]);

//   const BASE_CHAPTER_NUMBERS = useMemo(() => {
//     if (teamDropdowns.chapterNumbers && teamDropdowns.chapterNumbers.length > 0) {
//       return teamDropdowns.chapterNumbers;
//     }
//     return DEFAULT_CHAPTER_NUMBERS;
//   }, [teamDropdowns.chapterNumbers]);

//   /* DATABASE OPERATIONS */
//   const loadTodaysWorklogFromDB = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     setLoadingToday(true);
//     try {
//       const { data } = await axios.get("/worklogs/today");
//       if (data?.success && Array.isArray(data.entries)) {
//         const mapped = data.entries.map((entry) => ({
//           id: entry.id,
//           workMode: entry.work_mode,
//           projectId: entry.project_name,
//           projectName: entry.project_name,
//           task: entry.task_name,
//           bookElement: entry.book_element,
//           chapterNo: entry.chapter_number,
//           hoursSpent: String(entry.hours_spent || ""),
//           noOfUnits: Number(entry.number_of_units) || 0,
//           unitsType: entry.unit_type,
//           status: entry.status,
//           dueOn: entry.due_on ? new Date(entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: entry.details || "",
//         }));
//         setTodayRows(mapped);
//       } else {
//         setTodayRows([]);
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       console.error("Failed to load today's worklog from database:", error);
//       setTodayRows([]);
//     } finally {
//       setLoadingToday(false);
//     }
//   }, [checkTokenValidity]);

//   const saveTodaysEntryToDB = useCallback(async (entry) => {
//     if (!checkTokenValidity()) return null;

//     try {
//       const { data } = await axios.post("/worklogs/today", { entry });
//       if (data?.success) {
//         return {
//           id: data.entry.id,
//           workMode: data.entry.work_mode,
//           projectId: data.entry.project_name,
//           projectName: data.entry.project_name,
//           task: data.entry.task_name,
//           bookElement: data.entry.book_element,
//           chapterNo: data.entry.chapter_number,
//           hoursSpent: String(data.entry.hours_spent || ""),
//           noOfUnits: Number(data.entry.number_of_units) || 0,
//           unitsType: data.entry.unit_type,
//           status: data.entry.status,
//           dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: data.entry.details || "",
//         };
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return null;
//       }
//       console.error("Failed to save entry to database:", error);
//       throw error;
//     }
//     return null;
//   }, [checkTokenValidity]);

//   const updateTodaysEntryInDB = useCallback(async (id, entry) => {
//     if (!checkTokenValidity()) return null;

//     try {
//       const { data } = await axios.put(`/worklogs/today/${id}`, { entry });
//       if (data?.success) {
//         return {
//           id: data.entry.id,
//           workMode: data.entry.work_mode,
//           projectId: data.entry.project_name,
//           projectName: data.entry.project_name,
//           task: data.entry.task_name,
//           bookElement: data.entry.book_element,
//           chapterNo: data.entry.chapter_number,
//           hoursSpent: String(data.entry.hours_spent || ""),
//           noOfUnits: Number(data.entry.number_of_units) || 0,
//           unitsType: data.entry.unit_type,
//           status: data.entry.status,
//           dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: data.entry.details || "",
//         };
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return null;
//       }
//       console.error("Failed to update entry in database:", error);
//       throw error;
//     }
//     return null;
//   }, [checkTokenValidity]);

//   const deleteTodaysEntryFromDB = useCallback(async (id) => {
//     if (!checkTokenValidity()) return false;

//     try {
//       const { data } = await axios.delete(`/worklogs/today/${id}`);
//       return data?.success || false;
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return false;
//       }
//       console.error("Failed to delete entry from database:", error);
//       throw error;
//     }
//   }, [checkTokenValidity]);

//   const fetchPastWorklogs = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     setLoadingPast(true);
//     setPastError(null);
//     try {
//       const { data } = await axios.get("/worklogs/recent", { params: { days: 7 } });
//       if (data?.success && Array.isArray(data.rows)) {
//         const mapped = data.rows.map((r) => ({
//           id: r.id,
//           date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
//           workMode: r.work_mode,
//           projectId: r.project_id || "",
//           projectName: r.project_name,
//           task: r.task_name,
//           bookElement: r.book_element,
//           chapterNo: r.chapter_number,
//           hoursSpent: r.hours_spent,
//           noOfUnits: r.number_of_units,
//           unitsType: r.unit_type,
//           status: r.status,
//           dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : "",
//           remarks: r.details || "",
//           auditStatus: r.audit_status || "Pending",
//         }));
//         setPastRows(mapped);
//         if (mapped.length === 0) setPastError("No recent worklogs found.");
//       } else {
//         setPastRows([]);
//         setPastError("No recent worklogs found.");
//       }
//     } catch (err) {
//       if (err.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setPastError(`Failed to load recent worklogs: ${err?.response?.data?.message || err.message}`);
//       setPastRows([]);
//     } finally {
//       setLoadingPast(false);
//     }
//   }, [checkTokenValidity]);

//   /* AUTO-SUBMIT HELPERS */
//   const getNextAutoSubmitTime = () => {
//     const now = new Date();
//     const target = new Date(now);
//     const [h, m] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
//     target.setHours(h, m, 0, 0);
//     if (now >= target) target.setDate(target.getDate() + 1);
//     return target;
//   };

//   const updateAutoSubmitCountdown = useCallback(() => {
//     const nextSubmit = getNextAutoSubmitTime();
//     const now = new Date();
//     const diff = nextSubmit - now;

//     if (diff <= 0) {
//       setAutoSubmitCountdown("Auto-submit time reached!");
//       return;
//     }

//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((diff % (1000 * 60)) / 1000);
//     setAutoSubmitCountdown(`${hours}h ${minutes}m ${seconds}s`);
//   }, []);

//   const performAutoSubmit = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     try {
//       const { data } = await axios.get("/worklogs/today");
//       let entriesToSubmit = [];

//       if (data?.success && data.entries && data.entries.length > 0) {
//         entriesToSubmit = data.entries.map((r) => ({
//           workMode: r.work_mode,
//           projectId: r.project_name,
//           projectName: r.project_name,
//           task: r.task_name,
//           bookElement: r.book_element,
//           chapterNo: String(r.chapter_number || ""),
//           hoursSpent: Number(r.hours_spent) || 0,
//           noOfUnits: Number(r.number_of_units) || 0,
//           unitsType: r.unit_type,
//           status: r.status,
//           dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : null,
//           remarks: r.details || null,
//         }));
//       }

//       const payload = { entries: entriesToSubmit };
//       const response = await axios.post("/worklogs", payload);

//       if (response.data.success) {
//         setTodayRows([]);

//         if (entriesToSubmit.length > 0) {
//           setSubmitMsg(`Auto-submitted ${response.data.inserted} entry(s) at ${AUTO_SUBMIT_TIME}!`);
//         } else {
//           setSubmitMsg(`Auto-submitted default "Leave" entry at ${AUTO_SUBMIT_TIME}!`);
//         }

//         await fetchPastWorklogs();
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setSubmitMsg(`Auto-submit failed: ${error?.response?.data?.message || error.message}`);
//     }
//   }, [checkTokenValidity, fetchPastWorklogs]);

//   const checkAutoSubmit = useCallback(() => {
//     const now = new Date();
//     const [targetHours, targetMinutes] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));

//     const targetTime = new Date(now);
//     targetTime.setHours(targetHours, targetMinutes, 0, 0);

//     const timeDiff = Math.abs(now - targetTime);
//     const isWithinWindow = timeDiff <= 60000;

//     if (isWithinWindow) {
//       const today = now.toDateString();
//       const lastSubmitDate = localStorage.getItem(AUTO_SUBMIT_KEY);

//       if (lastSubmitDate !== today) {
//         localStorage.setItem(AUTO_SUBMIT_KEY, today);
//         performAutoSubmit();
//       }
//     }
//   }, [performAutoSubmit]);

//   /* EFFECTS */
//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       navigate("/");
//       return;
//     }

//     if (!checkTokenValidity()) {
//       return;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       const u = {
//         name: decoded.name,
//         email: decoded.email,
//         role: decoded.role,
//         team: decoded.team,
//         sub_team: decoded.sub_team,
//         picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
//       };
//       setUser(u);
//       axios.defaults.baseURL = API_BASE;
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
//       fetchPastWorklogs();
//       fetchTeamWiseDropdowns();
//     } catch (e) {
//       console.error("Invalid token:", e);
//       localStorage.removeItem("authToken");
//       navigate("/");
//     }
//   }, [navigate, fetchPastWorklogs, checkTokenValidity, fetchTeamWiseDropdowns]);

//   useEffect(() => {
//     if (user) {
//       loadTodaysWorklogFromDB();
//     }
//   }, [user, loadTodaysWorklogFromDB]);

//   useEffect(() => {
//     const updateCacheInfoLocal = () => {
//       setCacheInfo({
//         count: todayRows.length,
//         expiresAt: Date.now() + CACHE_DURATION,
//         timeLeft: todayRows.length > 0 ? "Stored in DB" : "",
//       });
//     };

//     const cacheInterval = setInterval(updateCacheInfoLocal, 60_000);
//     const autoSubmitInterval = setInterval(() => {
//       updateAutoSubmitCountdown();
//       checkAutoSubmit();
//     }, 1_000);
//     const tokenCheckInterval = setInterval(checkTokenValidity, 30_000);

//     updateCacheInfoLocal();
//     updateAutoSubmitCountdown();

//     return () => {
//       clearInterval(cacheInterval);
//       clearInterval(autoSubmitInterval);
//       clearInterval(tokenCheckInterval);
//     };
//   }, [todayRows.length, checkAutoSubmit, updateAutoSubmitCountdown, checkTokenValidity]);

//   /* FORM LOGIC */
//   const showFullBook = useMemo(() => ["FER", "FINAL", "COM"].includes(task), [task]);
//   const bookElements = useMemo(() => (showFullBook ? ["Full Book", ...BASE_BOOK_ELEMENTS] : BASE_BOOK_ELEMENTS), [showFullBook, BASE_BOOK_ELEMENTS]);
//   const chapterNumbers = useMemo(
//     () => (showFullBook ? BASE_CHAPTER_NUMBERS : BASE_CHAPTER_NUMBERS.filter((v) => v !== "Full Book")),
//     [showFullBook, BASE_CHAPTER_NUMBERS]
//   );

//   useEffect(() => {
//     let active = true;
//     const q = projectQuery.trim();
//     if (!q) {
//       setSuggestions([]);
//       setShowSuggest(false);
//       return;
//     }

//     if (!checkTokenValidity()) return;

//     setLoadingSuggestions(true);
//     const t = setTimeout(async () => {
//       try {
//         const { data } = await axios.get("/projects", { params: { q, by: searchBy } });
//         if (!active) return;
//         const transformed = (data.projects || []).map((p) => ({
//           id: p.project_id,
//           name: p.project_name,
//           dueOn: p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : null,
//         }));
//         setSuggestions(transformed);
//         setShowSuggest(transformed.length > 0);
//       } catch (err) {
//         if (err.response?.status === 401) {
//           checkTokenValidity();
//           return;
//         }
//         setSuggestions([]);
//         setShowSuggest(false);
//       } finally {
//         setLoadingSuggestions(false);
//       }
//     }, 300);

//     return () => {
//       active = false;
//       clearTimeout(t);
//       setLoadingSuggestions(false);
//     };
//   }, [projectQuery, searchBy, checkTokenValidity]);

//   useEffect(() => {
//     function onClickOutside(e) {
//       if (!suggestRef.current) return;
//       if (!suggestRef.current.contains(e.target)) setShowSuggest(false);
//     }
//     window.addEventListener("mousedown", onClickOutside);
//     return () => window.removeEventListener("mousedown", onClickOutside);
//   }, []);

//   const selectProject = (p) => {
//     setProjectId(p.id);
//     setProjectName(p.name);
//     setProjectQuery(p.id);
//     if (p.dueOn) setDueOn(p.dueOn);
//     setShowSuggest(false);
//   };

//   const isEmpty = (v) => Array.isArray(v) ? v.length === 0 : (v === null || v === undefined || String(v).trim() === "");

//   const projectValid =
//     (!!projectId && String(projectId).trim() !== "") ||
//     (!!projectName && String(projectName).trim() !== "") ||
//     (!!projectQuery.trim() && suggestions.some(s => s.id === projectQuery.trim()));

//   const required = { workMode, projectId: projectValid ? "ok" : "", task, bookElement, chapterNumber, hoursSpent, status, unitsCount, unitsType };

//   const invalid = Object.fromEntries(
//     Object.entries(required).map(([k, v]) => [k, isEmpty(v)])
//   );

//   const canSubmitRow = Object.values(required).every((v) => !isEmpty(v));

//   const clearForm = () => {
//     setWorkMode("");
//     setProjectQuery("");
//     setProjectId("");
//     setProjectName("");
//     setTask("");
//     setBookElement("");
//     setChapterNumber([]);
//     setHoursSpent("");
//     setStatus("");
//     setUnitsCount("");
//     setUnitsType("pages");
//     setDueOn("");
//     setRemarks("");
//     setSubmitMsg(null);
//     setEditSourceIndex(-1);
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!canSubmitRow || !projectValid) return;

//     const newEntry = {
//       workMode,
//       projectId: projectId || projectQuery.trim(),
//       projectName: projectName || projectQuery,
//       task,
//       bookElement,
//       chapterNo: chapterNumber.join(", "),
//       hoursSpent,
//       noOfUnits: Number(unitsCount),
//       unitsType,
//       status,
//       dueOn,
//       remarks,
//     };

//     try {
//       if (editSourceIndex !== -1) {
//         const currentRow = todayRows[editSourceIndex];
//         if (currentRow.id) {
//           const updatedEntry = await updateTodaysEntryInDB(currentRow.id, newEntry);
//           if (updatedEntry) {
//             setTodayRows((prev) => prev.map((r, i) => (i === editSourceIndex ? updatedEntry : r)));
//           }
//         }
//       } else {
//         const savedEntry = await saveTodaysEntryToDB(newEntry);
//         if (savedEntry) {
//           setTodayRows((prev) => [...prev, savedEntry]);
//         }
//       }
//       clearForm();
//     } catch (error) {
//       setSubmitMsg(`Failed to save entry: ${error?.response?.data?.message || error.message}`);
//     }
//   };

//   const copyRowToForm = (row) => {
//     setWorkMode(row.workMode || "");
//     setProjectId(row.projectId || "");
//     setProjectQuery(row.projectId || row.projectName || "");
//     setProjectName(row.projectName || "");
//     setTask(row.task || "");
//     setBookElement(row.bookElement || "");
//     setChapterNumber(
//       typeof row.chapterNo === "string"
//         ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
//         : Array.isArray(row.chapterNo)
//           ? row.chapterNo
//           : []
//     );
//     setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
//     setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
//     setUnitsType(row.unitsType || "pages");
//     setStatus(row.status || "");
//     setDueOn(row.dueOn || "");
//     setRemarks(row.remarks || "");
//     setEditSourceIndex(-1);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const startEditViaForm = (idx, row) => {
//     copyRowToForm(row);
//     setEditSourceIndex(idx);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const deleteRowAt = async (idx) => {
//     const row = todayRows[idx];

//     try {
//       if (row.id) {
//         const success = await deleteTodaysEntryFromDB(row.id);
//         if (success) {
//           setTodayRows((prev) => prev.filter((_, i) => i !== idx));
//           if (editSourceIndex === idx) setEditSourceIndex(-1);
//         } else {
//           setSubmitMsg("Failed to delete entry from database");
//         }
//       }
//     } catch (error) {
//       setSubmitMsg(`Failed to delete entry: ${error?.response?.data?.message || error.message}`);
//     }
//   };

//   async function submitTodaysWorklog() {
//     if (todayRows.length === 0) return;

//     if (!checkTokenValidity()) return;

//     setSubmitting(true);
//     setSubmitMsg(null);

//     try {
//       const payload = {
//         entries: todayRows.map((r) => ({
//           workMode: r.workMode,
//           projectId: r.projectId,
//           projectName: r.projectName,
//           task: r.task,
//           bookElement: r.bookElement,
//           chapterNo: String(r.chapterNo || ""),
//           hoursSpent: Number(r.hoursSpent) || 0,
//           noOfUnits: Number(r.noOfUnits) || 0,
//           unitsType: r.unitsType,
//           status: r.status,
//           dueOn: r.dueOn || null,
//           remarks: r.remarks || null,
//         })),
//       };

//       const { data } = await axios.post("/worklogs", payload);
//       setSubmitMsg(`Successfully submitted ${data.inserted} entry(s) to database!`);

//       setTodayRows([]);
//       await fetchPastWorklogs();
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setSubmitMsg(`Submit failed: ${error?.response?.data?.message || error.message}`);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     localStorage.removeItem(AUTO_SUBMIT_KEY);
//     localStorage.removeItem(CACHE_KEY);

//     if (window.google?.accounts?.id) {
//       window.google.accounts.id.disableAutoSelect();
//     }
//     delete axios.defaults.headers.common.Authorization;
//     navigate("/");
//   };
//     if (!user) {
//     return (
//       <div className="min-h-screen bg-slate-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-100">
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//         <div className="max-w-full mx-auto px-4 sm:px-6">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
//               >
//                 <span className="sr-only">Toggle sidebar</span>
//                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               </button>

//               <div className="flex-shrink-0">
//                 <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
//                   <span className="block sm:inline">SPOC Dashboard</span>
//                   <span className="hidden sm:inline"> - Work Log</span>
//                 </h1>
//               </div>
//             </div>

//             <div className="hidden md:flex items-center space-x-4">
//               <div className="flex items-center space-x-3">
//                 <img
//                   src={user.picture}
//                   alt={user.name}
//                   className="w-8 h-8 rounded-full border-2 border-slate-600"
//                 />
//                 <div className="text-right">
//                   <div className="text-sm font-medium">{user.name}</div>
//                   <div className="text-xs text-slate-300">{user.email}</div>
//                 </div>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//               >
//                 Logout
//               </button>
//             </div>

//             <div className="md:hidden">
//               <button
//                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                 className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
//               >
//                 <span className="sr-only">Open main menu</span>
//                 {!mobileMenuOpen ? (
//                   <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                   </svg>
//                 ) : (
//                   <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//           </div>

//           {mobileMenuOpen && (
//             <div className="md:hidden border-t border-slate-700">
//               <div className="px-2 pt-2 pb-3 space-y-1">
//                 <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
//                   <img
//                     src={user.picture}
//                     alt={user.name}
//                     className="w-10 h-10 rounded-full border-2 border-slate-600"
//                   />
//                   <div className="ml-3">
//                     <div className="text-sm font-medium text-white">{user.name}</div>
//                     <div className="text-xs text-slate-300">{user.email}</div>
//                   </div>
//                 </div>

//                 <div className="px-3">
//                   <button
//                     onClick={() => {
//                       handleLogout();
//                       setMobileMenuOpen(false);
//                     }}
//                     className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       <div className="pt-16 flex">
//          {/* Mobile Sidebar Overlay and Sidebar */}
//         {sidebarOpen && (
//           <div className="fixed inset-0 z-40 lg:hidden">
//             <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//             <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
//               <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} />
//             </aside>
//           </div>
//         )}

//         {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
//         <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//           <SidebarLinks navigate={navigate} location={location} />
//         </aside>
//         <main className="flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto">
//           <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
//             <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
//               <div className="flex items-start justify-between mb-3">
//                 <h2 className="text-base sm:text-lg font-semibold text-slate-800">
//                   {editSourceIndex !== -1 ? "Edit Entry" : "New Entry"}
//                 </h2>
//                 <div className="text-right">
//                   <span className="text-xs text-red-600">* required fields</span>
//                   {cacheInfo.count > 0 && (
//                     <div className="text-xs text-blue-600 mt-1 md:hidden">
//                       {cacheInfo.count} entries stored in database
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <Field label="Work Mode *">
//                   <Select
//                     value={workMode}
//                     onChange={setWorkMode}
//                     options={["", ...WORK_MODES]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.workMode}
//                   />
//                 </Field>

//                 <Field label="Project Search *">
//                   <div className="flex gap-2 items-center">
//                     <div className="relative flex-1" ref={suggestRef}>
//                       <input
//                         type="text"
//                         placeholder="Start typing project name or ID…"
//                         className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${invalid.projectId ? "border-red-500" : "border-slate-300"} focus:border-indigo-600`}
//                         value={projectQuery}
//                         onChange={(e) => {
//                           setProjectQuery(e.target.value);
//                           setProjectId("");
//                           setProjectName("");
//                           if (!e.target.value.trim()) setDueOn("");
//                         }}
//                         onBlur={() => {
//                           const exact = suggestions.find(s => s.id === projectQuery.trim());
//                           if (exact && !projectId) {
//                             selectProject(exact);
//                           }
//                         }}
//                       />
//                       {loadingSuggestions && (
//                         <div className="absolute right-3 top-2">
//                           <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
//                         </div>
//                       )}
//                       {showSuggest && suggestions.length > 0 && (
//                         <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border bg-white shadow-2xl">
//                           {suggestions.map((s) => (
//                             <li
//                               key={s.id}
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 selectProject(s);
//                               }}
//                               className="px-4 py-3 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
//                             >
//                               <div className="font-medium text-slate-900">{s.id}</div>
//                               <div className="text-xs text-slate-600 mt-1">{s.name}</div>
//                               {s.dueOn && <div className="text-xs text-orange-600 mt-1">Due: {s.dueOn}</div>}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                       {showSuggest && suggestions.length === 0 && !loadingSuggestions && projectQuery.trim() && (
//                         <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-white shadow-2xl px-4 py-3 text-sm text-slate-500">
//                           No projects found for "{projectQuery}"
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </Field>

//                 <Field label="Task *">
//                   <Select
//                     value={task}
//                     onChange={setTask}
//                     options={["", ...TASKS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.task}
//                   />
//                 </Field>

//                 <Field label="Book Element *">
//                   <Select
//                     value={bookElement}
//                     onChange={setBookElement}
//                     options={["", ...bookElements]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.bookElement}
//                   />
//                 </Field>

//                 <Field label="Chapter No. *">
//                   <MultiSelectChips
//                     value={chapterNumber}
//                     onChange={setChapterNumber}
//                     options={chapterNumbers}
//                     placeholder="Select chapter(s)…"
//                     isInvalid={invalid.chapterNumber}
//                   />
//                 </Field>

//                 <Field label="Hours Spent *">
//                   <Select
//                     value={hoursSpent}
//                     onChange={setHoursSpent}
//                     options={["", ...HOURS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.hoursSpent}
//                   />
//                 </Field>

//                 <Field label="No. of Units *">
//                   <div className="flex gap-2 items-start">
//                     <input
//                       type="number"
//                       className={`flex-1 h-9 text-sm px-3 rounded-2xl border-2 ${invalid.unitsCount ? "border-red-500" : "border-slate-300"} focus:border-indigo-600`}
//                       placeholder="e.g., 10"
//                       value={unitsCount}
//                       onChange={(e) => setUnitsCount(e.target.value)}
//                     />
//                     <div className="w-28">
//                       <Select
//                         value={unitsType}
//                         onChange={setUnitsType}
//                         options={UNITS.map((u) => u.value)}
//                         labels={UNITS.reduce((m, u) => {
//                           m[u.value] = u.label;
//                           return m;
//                         }, {})}
//                         isInvalid={invalid.unitsType}
//                       />
//                     </div>
//                   </div>
//                 </Field>

//                 <Field label="Status *">
//                   <Select
//                     value={status}
//                     onChange={setStatus}
//                     options={["", ...STATUS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.status}
//                   />
//                 </Field>

//                 <Field label="Due On">
//                   <input
//                     type="date"
//                     className="w-full h-9 text-sm px-3 rounded-2xl border-2 border-slate-300 focus:border-indigo-600"
//                     value={dueOn}
//                     onChange={(e) => setDueOn(e.target.value)}
//                   />
//                   {dueOn && <div className="mt-1 text-xs text-slate-600">Due: {new Date(dueOn).toLocaleDateString()}</div>}
//                 </Field>

//                 <Field label="Details">
//                   <textarea
//                     className="w-full min-h-[140px] text-sm px-3 py-2 rounded-2xl border-2 border-slate-300 focus:border-indigo-600"
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                     placeholder="Add any additional notes..."
//                   />
//                 </Field>
//               </div>

//               <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={clearForm}
//                   className="w-full sm:w-auto px-4 py-1.5 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
//                 >
//                   Clear
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={!canSubmitRow || !projectValid}
//                   className={`w-full sm:w-auto px-5 py-1.5 rounded-2xl text-white transition-colors ${canSubmitRow && projectValid ? "bg-indigo-700 hover:bg-indigo-800" : "bg-slate-400 cursor-not-allowed"}`}
//                 >
//                   {editSourceIndex !== -1 ? "Update Entry" : "Add to Today's Worklog"}
//                 </button>
//               </div>
//             </form>

//             <section className="mt-8 space-y-6">
//               {loadingToday ? (
//                 <Feedback message="Loading today's worklog..." />
//               ) : todayRows.length > 0 ? (
//                 <>
//                   <EditableBlock
//                     title="Today's Worklog"
//                     rows={todayRows}
//                     onCopyRow={copyRowToForm}
//                     onStartEdit={startEditViaForm}
//                     onDeleteRow={deleteRowAt}
//                     lists={{ WORK_MODES, TASKS, STATUS, HOURS, UNITS }}
//                   />
//                   <div className="text-xs text-slate-600 text-center bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2">
//                     Your entries are saved in database and will auto-submit at 03:00 AM (in {autoSubmitCountdown})
//                   </div>
//                 </>
//               ) : (
//                 <Feedback message={submitMsg || "No entries for today yet."} />
//               )}

//               <div className="flex items-center justify-center">
//                 <button
//                   onClick={submitTodaysWorklog}
//                   disabled={submitting || todayRows.length === 0}
//                   className="px-5 py-1.5 rounded-2xl text-white bg-emerald-700 disabled:opacity-60 hover:bg-emerald-800 transition-colors"
//                 >
//                   {submitting ? "Submitting…" : "Submit Today's Worklog"}
//                 </button>
//               </div>

//               {submitMsg && <Feedback message={submitMsg} />}
//               {pastError && <Feedback message={pastError} />}
//               {loadingPast && <Feedback message="Loading past 7 days worklog..." />}
//               {!pastError && !loadingPast && pastRows.length === 0 && <Feedback message="No entries in the last 7 days." />}

//               {pastRows.length > 0 && (
//                 <DataBlock
//                   title={`Past 7 Days Worklog (${pastRows.length} entries)`}
//                   rows={pastRows}
//                   subtle
//                   hideEdit
//                 />
//               )}
//             </section>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// // Helper components
// function Field({ label, children }) {
//   return (
//     <label className="block">
//       <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
//       {children}
//     </label>
//   );
// }

// function Select({ value, onChange, options, labels, isInvalid }) {
//   const safeOptions = Array.isArray(options) ? options : [];
//   const labelFor = (o) =>
//     labels && typeof labels === "object" && Object.prototype.hasOwnProperty.call(labels, o) ? labels[o] : o;

//   return (
//     <select
//       className={`w-full h-9 text-sm px-2 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"} focus:border-indigo-600`}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//     >
//       {safeOptions.map((o, idx) => (
//         <option key={idx} value={o}>
//           {labelFor(o)}
//         </option>
//       ))}
//     </select>
//   );
// }
// /* Sidebar Links Component for SPOC Dashboard */
// function SidebarLinks({ navigate, location, close }) {
//   const [openMissingEntry, setOpenMissingEntry] = useState(false);

//   // Keep sections open if child page active
//   useEffect(() => {
//     if (location.pathname.includes("missing-entry")) {
//       setOpenMissingEntry(true);
//     }
//   }, [location]);

//   const handleNavigation = (path, isChildOfMissingEntry = false) => {
//     navigate(path);
    
//     // Only close the dropdown if navigating away from missing entry section
//     if (!isChildOfMissingEntry && !path.includes("missing-entry")) {
//       setOpenMissingEntry(false);
//     }
    
//     if (close) close();
//   };

//   const toggleMissingEntry = () => {
//     setOpenMissingEntry(!openMissingEntry);
//   };

//   // Check if we're on home page and NOT on any missing entry page
//   const isHomePage = location.pathname === "/spoc-dashboard";
//   const isMissingEntryPage = location.pathname.includes("missing-entry");

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//       <nav className="flex flex-col space-y-2">
//         {/* Home */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             isHomePage && !isMissingEntryPage ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/spoc-dashboard")}
//         >
//           Home
//         </button>

//         {/* Approve Worklogs */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/spoc/approve-worklogs")}
//         >
//           Approve Worklogs
//         </button>

//         {/* Missing Entry - COLLAPSIBLE SECTION */}
//         <div>
//           <button
//             className={`w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//               isMissingEntryPage && !location.pathname.includes("missing-entry-request") && !location.pathname.includes("missing-entry-status")
//                 ? "bg-gray-700"
//                 : ""
//             }`}
//             onClick={toggleMissingEntry}
//           >
//             <span>Missing Entry</span>
//             <span className="transition-transform duration-200">
//               {openMissingEntry ? "▾" : "▸"}
//             </span>
//           </button>
//           {openMissingEntry && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("missing-entry-request") ? "bg-gray-700" : ""
//                 }`}
//                 onClick={() => handleNavigation("/spoc/missing-entry-request", true)}
//               >
//                 Request Missing Entry
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("missing-entry-status") ? "bg-gray-700" : ""
//                 }`}
//                 onClick={() => handleNavigation("/spoc/missing-entry-status", true)}
//               >
//                 Approve Missing Entry
//               </button>
//             </div>
//           )}
//         </div>
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/spoc/add-project")}
//         >
//           Add Project
//         </button>

//         {/* Mark Extra Shift */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname.includes("mark-night-shift") || location.pathname.includes("mark-extra-shift")
//               ? "bg-gray-700"
//               : ""
//           }`}
//           onClick={() => handleNavigation("/spoc/mark-night-shift")}
//         >
//           Mark Extra Shift
//         </button>
//       </nav>
//     </div>
//   );
// }

// function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select one or more…", isInvalid = false }) {
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const shellRef = useRef(null);
//   const inputRef = useRef(null);
//   const lastActionTs = useRef(0);

//   useEffect(() => {
//     const handleDown = (e) => {
//       if (!shellRef.current) return;
//       if (!shellRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handleDown);
//     return () => document.removeEventListener("mousedown", handleDown);
//   }, []);

//   const deduped = useMemo(() => Array.from(new Set(options.map((o) => String(o)))), [options]);
//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return deduped.filter((o) => !value.includes(o)).filter((o) => (q ? o.toLowerCase().includes(q) : true));
//   }, [deduped, value, query]);

//   const guardOnce = () => {
//     const now = Date.now();
//     if (now - lastActionTs.current < 120) return false;
//     lastActionTs.current = now;
//     return true;
//   };

//   const addItem = (item) => {
//     if (!guardOnce()) return;
//     if (!value.includes(item)) onChange([...value, item]);
//     setQuery("");
//     setOpen(true);
//     inputRef.current?.focus();
//   };

//   const removeAt = (idx) => {
//     if (!guardOnce()) return;
//     const next = value.slice();
//     next.splice(idx, 1);
//     onChange(next);
//     setOpen(true);
//     inputRef.current?.focus();
//   };

//   return (
//     <div className="relative" ref={shellRef}>
//       <div
//         className={`min-h-[44px] w-full rounded-2xl border-2 bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${isInvalid ? "border-red-500" : "border-slate-300"} focus-within:border-indigo-600`}
//         onMouseDown={(e) => {
//           if (e.target === e.currentTarget) e.preventDefault();
//           setOpen(true);
//           inputRef.current?.focus();
//         }}
//         role="combobox"
//         aria-expanded={open}
//       >
//         {value.map((v, idx) => (
//           <span
//             key={`${v}-${idx}`}
//             className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-[2px] text-xs"
//           >
//             {v}
//             <button
//               type="button"
//               onMouseDown={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 removeAt(idx);
//               }}
//               className="ml-1 rounded-full hover:bg-indigo-100 p-[2px] leading-none"
//               aria-label={`Remove ${v}`}
//             >
//               ✕
//             </button>
//           </span>
//         ))}
//         <input
//           ref={inputRef}
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           onFocus={() => setOpen(true)}
//           onKeyDown={(e) => {
//             if (e.key === "Backspace" && query === "" && value.length) {
//               removeAt(value.length - 1);
//             }
//           }}
//           className="flex-1 min-w-[80px] outline-none text-sm px-1 py-1 bg-transparent"
//           placeholder={value.length ? "" : placeholder}
//         />
//       </div>
//       {open && (
//         <div
//           className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl border bg-white shadow-2xl"
//           role="listbox"
//           onMouseDown={(e) => e.preventDefault()}
//         >
//           {filtered.length === 0 ? (
//             <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
//           ) : (
//             filtered.map((opt) => (
//               <div
//                 key={opt}
//                 role="option"
//                 onMouseDown={(e) => {
//                   e.preventDefault();
//                   e.stopPropagation();
//                   addItem(opt);
//                 }}
//                 className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
//               >
//                 {opt}
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// function DataBlock({ title, rows, subtle = false, hideEdit = false, onStartEdit }) {
//   return (
//     <div className={`rounded-2xl border ${subtle ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"} shadow-sm`}>
//       <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
//       </div>
//       <div className="overflow-auto">
//         <table className="min-w-full text-left text-xs">
//           <thead className="bg-slate-100 text-slate-900">
//             <tr>
//               {PAST_HEADERS.map((h) => (
//                 <th key={h} className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">
//                   {h}
//                 </th>
//               ))}
//               {!hideEdit && <th className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">Edit</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, idx) => (
//               <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
//                 <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
//                 <td className="px-3 py-2 whitespace-nowrap">{r.workMode}</td>
//                 <td className="px-3 py-2 min-w-[14rem]">{r.projectId || r.projectName}</td>
//                 <td className="px-3 py-2">{r.task}</td>
//                 <td className="px-3 py-2">{r.bookElement}</td>
//                 <td className="px-3 py-2">{r.chapterNo}</td>
//                 <td className="px-3 py-2">{r.hoursSpent}</td>
//                 <td className="px-3 py-2">{r.noOfUnits}</td>
//                 <td className="px-3 py-2">{r.unitsType}</td>
//                 <td className="px-3 py-2">{r.status}</td>
//                 <td className="px-3 py-2">{r.dueOn}</td>
//                 <td className="px-3 py-2">{r.remarks}</td>
//                 <td className="px-3 py-2">
//                   <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${r.auditStatus === 'Approved' ? 'bg-green-100 text-green-800' :
//                     r.auditStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
//                       'bg-yellow-100 text-yellow-800'
//                     }`}>
//                     {r.auditStatus}
//                   </span>
//                 </td>
//                 {!hideEdit && (
//                   <td className="px-3 py-2">
//                     <button
//                       className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
//                       onClick={() => onStartEdit(idx)}
//                     >
//                       Edit
//                     </button>
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function EditableBlock({ title, rows, onStartEdit, onDeleteRow, onCopyRow, lists }) {
//   return (
//     <div className="rounded-2xl border border-slate-300 bg-slate-50 shadow-sm">
//       <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
//       </div>
//       <div className="overflow-auto">
//         <table className="min-w-full text-left text-xs">
//           <thead className="bg-slate-100 text-slate-900">
//             <tr>
//               {TODAY_HEADERS.map((h) => (
//                 <th key={h} className="px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//               <th className="px-3 py-2 font-semibold sticky right-0 bg-slate-100 z-10 text-right">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, idx) => (
//               <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
//                 <td className="px-3 py-2 whitespace-nowrap">{r.workMode}</td>
//                 <td className="px-3 py-2 min-w-[14rem]">{r.projectId || r.projectName}</td>
//                 <td className="px-3 py-2">{r.task}</td>
//                 <td className="px-3 py-2">{r.bookElement}</td>
//                 <td className="px-3 py-2">{r.chapterNo}</td>
//                 <td className="px-3 py-2">{r.hoursSpent}</td>
//                 <td className="px-3 py-2">{r.noOfUnits}</td>
//                 <td className="px-3 py-2">{r.unitsType}</td>
//                 <td className="px-3 py-2">{r.status}</td>
//                 <td className="px-3 py-2">{r.dueOn}</td>
//                 <td className="px-3 py-2">{r.remarks}</td>
//                 <td className="px-3 py-2 sticky right-0 bg-inherit z-10">
//                   <div className="flex gap-1 justify-end">
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-sky-600 text-white hover:bg-sky-700"
//                       onClick={() => onCopyRow?.(r)}
//                       title="Copy this row into the form"
//                     >
//                       Copy
//                     </button>
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700"
//                       onClick={() => onStartEdit?.(idx, r)}
//                       title="Edit this row in the form"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-rose-600 text-white hover:bg-rose-700"
//                       onClick={() => onDeleteRow?.(idx)}
//                       title="Delete this row"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function Feedback({ message }) {
//   const isError = message && (message.includes("Error") || message.includes("Failed") || message.includes("failed"));
//   const isSuccess = message && (message.includes("Successfully") || message.includes("submitted"));

//   let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
//   if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
//   if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

//   return <div className={`rounded-2xl border px-3 py-2 text-xs ${bgColor}`}>{message}</div>;
// }

// const TODAY_HEADERS = [
//   "Work Mode",
//   "Project Name",
//   "Task",
//   "Book Element",
//   "Chapter No.",
//   "Hours Spent",
//   "No. of Units",
//   "Unit Type",
//   "Status",
//   "Due On",
//   "Details",
// ];

// const PAST_HEADERS = [
//   "Date",
//   "Work Mode",
//   "Project Name",
//   "Task",
//   "Book Element",
//   "Chapter No.",
//   "Hours Spent",
//   "No. of Units",
//   "Unit Type",
//   "Status",
//   "Due On",
//   "Details",
//   "Audit Status",
// ];

// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
// import { useNavigate, useLocation } from "react-router-dom"
// import { jwtDecode } from "jwt-decode"
// import axios from "axios"

// const API_BASE = import.meta.env?.VITE_API_BASE;

// // Cache configuration
// const CACHE_DURATION = 24 * 60 * 60 * 1000;
// const AUTO_SUBMIT_TIME = "03:00";
// const CACHE_KEY = "worklog_cache_v2";
// const AUTO_SUBMIT_KEY = "lastAutoSubmitDate";

// // Admin action badge helper
// const getAdminActionBadge = (row) => {
//   const adminAction = row.adminAction || 'none';
//   const actionBy = row.adminActionBy;

//   if (adminAction === 'edited') {
//     return (
//       <div className="mb-1">
//         <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-200">
//           <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
//             <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
//           </svg>
//           Edited by Admin
//           {actionBy && <span className="text-blue-600 text-[9px]">({actionBy})</span>}
//         </span>
//       </div>
//     );
//   }

//   if (adminAction === 'added') {
//     return (
//       <div className="mb-1">
//         <span className="inline-flex items-center gap-1 rounded-md bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-medium border border-green-200">
//           <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
//           </svg>
//           Added by Admin
//           {actionBy && <span className="text-green-600 text-[9px]">({actionBy})</span>}
//         </span>
//       </div>
//     );
//   }

//   return null;
// };

// const getAdminActionRowClass = (row) => {
//   const adminAction = row.adminAction || 'none';

//   if (adminAction === 'edited') {
//     return 'bg-blue-50/50 border-l-4 border-blue-300';
//   }

//   if (adminAction === 'added') {
//     return 'bg-green-50/50 border-l-4 border-green-300';
//   }

//   return '';
// };

// // Constants
// const WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night"];
// const STATUS = ["In Progress", "Delayed", "Completed"];
// const HOURS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8"];
// const UNITS = [
//   { label: "— Select —", value: "" },
//   { label: "pages", value: "pages" },
//   { label: "frames", value: "frames" },
//   { label: "seconds", value: "seconds" },
//   { label: "general", value: "general" },
//   { label: "count", value: "count" },
//   { label: "rows", value: "rows" },
//   { label: "correction(s)", value: "corrections" }
// ];

// const TODAY_HEADERS = [
//   "Work Mode",
//   "Project Name",
//   "Task",
//   "Element",
//   "Sub-Element(Chapter No.)",
//   "Hours Spent",
//   "No. of Units",
//   "Unit Type",
//   "Status",
//   "Due On",
//   "Details",
// ];

// const PAST_HEADERS = [
//   "Date",
//   "Work Mode",
//   "Project Name",
//   "Task",
//   "Element",
//   "Sub-Element(Chapter No.)",
//   "Hours Spent",
//   "No. of Units",
//   "Unit Type",
//   "Status",
//   "Due On",
//   "Details",
//   "Audit Status",
// ];

// export default function SpocDashboard() {
//   const navigate = useNavigate();
//   const location = useLocation()

//   const [user, setUser] = useState(null);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [tokenExpired, setTokenExpired] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Team-wise dropdown state
//   const [teamDropdowns, setTeamDropdowns] = useState({
//     bookElements: [],
//     taskNames: [],
//     chapterNumbers: []
//   });
//   const [loadingDropdowns, setLoadingDropdowns] = useState(false);

//   // Unit type lookup state
//   const [unitTypeDisabled, setUnitTypeDisabled] = useState(false);
//   const [unitTypeLookupLoading, setUnitTypeLookupLoading] = useState(false);
//   const [combinationBlocked, setCombinationBlocked] = useState(false);
//   const [blockedMessage, setBlockedMessage] = useState("");
//   const [skipUnitTypeLookup, setSkipUnitTypeLookup] = useState(false);

//   // Cache/auto-submit UI state
//   const [cacheInfo, setCacheInfo] = useState({ count: 0, expiresAt: null, timeLeft: "" });
//   const [autoSubmitCountdown, setAutoSubmitCountdown] = useState("");

//   // Form state
//   const [workMode, setWorkMode] = useState("");
//   const [projectQuery, setProjectQuery] = useState("");
//   const [projectId, setProjectId] = useState("");
//   const [projectName, setProjectName] = useState("");
//   const [task, setTask] = useState("");
//   const [bookElement, setBookElement] = useState("");
//   const [chapterNumber, setChapterNumber] = useState([]);
//   const [hoursSpent, setHoursSpent] = useState("");
//   const [status, setStatus] = useState("");
//   const [unitsCount, setUnitsCount] = useState("");
//   const [unitsType, setUnitsType] = useState("");
//   const [dueOn, setDueOn] = useState("");
//   const [remarks, setRemarks] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [recentProjects, setRecentProjects] = useState([]);
//   const [showSuggest, setShowSuggest] = useState(false);
//   const [searchBy, setSearchBy] = useState("name");
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const suggestRef = useRef(null);
//   const inputRef = useRef(null);

//   const [todayRows, setTodayRows] = useState([]);
//   const [pastRows, setPastRows] = useState([]);
//   const [loadingPast, setLoadingPast] = useState(false);
//   const [loadingToday, setLoadingToday] = useState(false);
//   const [pastError, setPastError] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitMsg, setSubmitMsg] = useState(null);
//   const [duplicateMsg, setDuplicateMsg] = useState(null);

//   const [editSourceIndex, setEditSourceIndex] = useState(-1);
//   const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

//   /* TOKEN VALIDATION & AUTO-LOGOUT */
//   const checkTokenValidity = useCallback(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       setTokenExpired(true);
//       navigate("/");
//       return false;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       const currentTime = Date.now() / 1000;

//       if (decoded.exp < currentTime) {
//         setTokenExpired(true);
//         localStorage.removeItem("authToken");
//         localStorage.removeItem(CACHE_KEY);
//         localStorage.removeItem(AUTO_SUBMIT_KEY);
//         delete axios.defaults.headers.common.Authorization;
//         navigate("/");
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.error("Token validation error:", error);
//       setTokenExpired(true);
//       localStorage.removeItem("authToken");
//       localStorage.removeItem(CACHE_KEY);
//       localStorage.removeItem(AUTO_SUBMIT_KEY);
//       delete axios.defaults.headers.common.Authorization;
//       navigate("/");
//       return false;
//     }
//   }, [navigate]);

//   /* FETCH TEAM DROPDOWNS */
//   const fetchTeamWiseDropdowns = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     setLoadingDropdowns(true);
//     try {
//       const { data } = await axios.get("/worklogs/team-dropdowns");

//       if (data?.success && data?.dropdowns) {
//         setTeamDropdowns({
//           bookElements: data.dropdowns.bookElements || [],
//           taskNames: data.dropdowns.taskNames || [],
//           chapterNumbers: data.dropdowns.chapterNumbers || []
//         });
//       } else {
//         setTeamDropdowns({
//           bookElements: [],
//           taskNames: [],
//           chapterNumbers: []
//         });
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       console.error("Failed to load team dropdowns:", error);
//       setTeamDropdowns({
//         bookElements: [],
//         taskNames: [],
//         chapterNumbers: []
//       });
//     } finally {
//       setLoadingDropdowns(false);
//     }
//   }, [checkTokenValidity]);

//   /* FETCH UNIT TYPE FOR COMBINATION */
//   const fetchUnitTypeForCombination = useCallback(async (selectedTask, selectedBookElement) => {
//     if (!selectedTask || !selectedBookElement) {
//       setUnitTypeDisabled(false);
//       setCombinationBlocked(false);
//       setBlockedMessage("");
//       if (!selectedTask && !selectedBookElement) {
//         setUnitsType("");
//       }
//       return;
//     }

//     if (skipUnitTypeLookup) {
//       return;
//     }

//     if (!checkTokenValidity()) return;

//     setUnitTypeLookupLoading(true);

//     try {
//       const { data } = await axios.get("/worklogs/unit-type-lookup", {
//         params: {
//           task: selectedTask,
//           bookElement: selectedBookElement
//         }
//       });

//       if (data.success && data.found) {
//         if (data.isNA) {
//           setCombinationBlocked(true);
//           setBlockedMessage(`The combination of "${selectedTask}" and "${selectedBookElement}" is not allowed. Please change either Task or Book Element.`);
//           setUnitsType("");
//           setUnitTypeDisabled(true);
//         } else {
//           const normalizedUnitType = data.unitType.toLowerCase();
//           setUnitsType(normalizedUnitType);
//           setUnitTypeDisabled(true);
//           setCombinationBlocked(false);
//           setBlockedMessage("");

//           if (normalizedUnitType === "general") {
//             setUnitsCount("1");
//           }
//         }
//       } else {
//         if (!skipUnitTypeLookup) {
//           setUnitsType("");
//         }
//         setUnitTypeDisabled(false);
//         setCombinationBlocked(false);
//         setBlockedMessage("");
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       console.error("Failed to lookup unit type:", error);
//       if (!skipUnitTypeLookup) {
//         setUnitsType("");
//       }
//       setUnitTypeDisabled(false);
//       setCombinationBlocked(false);
//       setBlockedMessage("");
//     } finally {
//       setUnitTypeLookupLoading(false);
//     }
//   }, [checkTokenValidity, skipUnitTypeLookup]);

//   useEffect(() => {
//     if (skipUnitTypeLookup) return;
//     fetchUnitTypeForCombination(task, bookElement);
//   }, [task, bookElement, fetchUnitTypeForCombination, skipUnitTypeLookup]);

//   useEffect(() => {
//     if (unitsType === "general") {
//       setUnitsCount("1");
//     }
//   }, [unitsType]);

//   // Memoized dropdown options
//   const TASKS = useMemo(() => {
//     if (teamDropdowns.taskNames && teamDropdowns.taskNames.length > 0) {
//       return teamDropdowns.taskNames;
//     }
//     return ["CMPL-MS", "VRF-MS", "DRF", "TAL", "R1", "R2", "R3", "R4", "CR", "FER", "SET", "FINAL", "MEET", "QRY", "Coord", "GLANCE", "Research", "Analysis", "KT", "Interview", "PLAN", "UPL", "Generation", "COM", "CR1", "CR2", "CR3", "CR4", "CR5", "Code"];
//   }, [teamDropdowns.taskNames]);

//   const BASE_BOOK_ELEMENTS = useMemo(() => {
//     if (teamDropdowns.bookElements && teamDropdowns.bookElements.length > 0) {
//       return teamDropdowns.bookElements;
//     }
//     return ["Theory", "Exercise", "Chapter", "Full book", "Mind Map", "Diagram", "Solution", "Booklet", "Full Video", "AVLR-VO", "DLR", "Lesson Plan", "Miscellaneous", "AVLR-Ideation", "Marketing", "Development", "Recruitment", "References", "Frames", "Papers", "Projects", "Shooting", "Frontend", "Backend", "DB", "OST", "Visual Instructions", "Animation", "Sheets"];
//   }, [teamDropdowns.bookElements]);

//   const BASE_CHAPTER_NUMBERS = useMemo(() => {
//     if (teamDropdowns.chapterNumbers && teamDropdowns.chapterNumbers.length > 0) {
//       return teamDropdowns.chapterNumbers;
//     }
//     return ["Title", "Syllabus", "Content", "Projects", "Papers", "Miscellaneous", "Appendix", "Full book", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5",
//       ...Array.from({ length: 40 }, (_, i) => String(i + 1))
//     ];
//   }, [teamDropdowns.chapterNumbers]);

//   /* DATABASE OPERATIONS */
//   const loadTodaysWorklogFromDB = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     setLoadingToday(true);
//     try {
//       const { data } = await axios.get("/worklogs/today");
//       if (data?.success && Array.isArray(data.entries)) {
//         const mapped = data.entries.map((entry) => ({
//           id: entry.id,
//           workMode: entry.work_mode,
//           projectId: entry.project_name,
//           projectName: entry.project_name,
//           task: entry.task_name,
//           bookElement: entry.book_element,
//           chapterNo: entry.chapter_number,
//           hoursSpent: String(entry.hours_spent || ""),
//           noOfUnits: Number(entry.number_of_units) || 0,
//           unitsType: entry.unit_type,
//           status: entry.status,
//           dueOn: entry.due_on ? new Date(entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: entry.details || "",
//           adminAction: entry.added_by_admin ? 'added' : (entry.edited_by_admin ? 'edited' : 'none'),
//           adminActionBy: entry.admin_action_by || null,
//           adminActionDate: entry.admin_action_date || null
//         }));
//         setTodayRows(mapped);
//       } else {
//         setTodayRows([]);
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       console.error("Failed to load today's worklog from database:", error);
//       setTodayRows([]);
//     } finally {
//       setLoadingToday(false);
//     }
//   }, [checkTokenValidity]);

//   const saveTodaysEntryToDB = useCallback(async (entry) => {
//     if (!checkTokenValidity()) return null;

//     try {
//       const { data } = await axios.post("/worklogs/today", { entry });
//       if (data?.success) {
//         return {
//           id: data.entry.id,
//           workMode: data.entry.work_mode,
//           projectId: data.entry.project_name,
//           projectName: data.entry.project_name,
//           task: data.entry.task_name,
//           bookElement: data.entry.book_element,
//           chapterNo: data.entry.chapter_number,
//           hoursSpent: String(data.entry.hours_spent || ""),
//           noOfUnits: Number(data.entry.number_of_units) || 0,
//           unitsType: data.entry.unit_type,
//           status: data.entry.status,
//           dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: data.entry.details || "",
//           adminAction: data.entry.added_by_admin ? 'added' : (data.entry.edited_by_admin ? 'edited' : 'none'),
//           adminActionBy: data.entry.admin_action_by || null,
//           adminActionDate: data.entry.admin_action_date || null
//         };
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return null;
//       }
//       console.error("Failed to save entry to database:", error);
//       throw error;
//     }
//     return null;
//   }, [checkTokenValidity]);

//   const updateTodaysEntryInDB = useCallback(async (id, entry) => {
//     if (!checkTokenValidity()) return null;

//     try {
//       const { data } = await axios.put(`/worklogs/today/${id}`, { entry });
//       if (data?.success) {
//         return {
//           id: data.entry.id,
//           workMode: data.entry.work_mode,
//           projectId: data.entry.project_name,
//           projectName: data.entry.project_name,
//           task: data.entry.task_name,
//           bookElement: data.entry.book_element,
//           chapterNo: data.entry.chapter_number,
//           hoursSpent: String(data.entry.hours_spent || ""),
//           noOfUnits: Number(data.entry.number_of_units) || 0,
//           unitsType: data.entry.unit_type,
//           status: data.entry.status,
//           dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
//           remarks: data.entry.details || "",
//           adminAction: data.entry.added_by_admin ? 'added' : (data.entry.edited_by_admin ? 'edited' : 'none'),
//           adminActionBy: data.entry.admin_action_by || null,
//           adminActionDate: data.entry.admin_action_date || null
//         };
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return null;
//       }
//       console.error("Failed to update entry in database:", error);
//       throw error;
//     }
//     return null;
//   }, [checkTokenValidity]);

//   const deleteTodaysEntryFromDB = useCallback(async (id) => {
//     if (!checkTokenValidity()) return false;

//     try {
//       const { data } = await axios.delete(`/worklogs/today/${id}`);
//       return data?.success || false;
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return false;
//       }
//       console.error("Failed to delete entry from database:", error);
//       throw error;
//     }
//   }, [checkTokenValidity]);

//   const fetchPastWorklogs = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     setLoadingPast(true);
//     setPastError(null);
//     try {
//       const { data } = await axios.get("/worklogs/recent", { params: { days: 7 } });
//       if (data?.success && Array.isArray(data.rows)) {
//         const mapped = data.rows.map((r) => ({
//           id: r.id,
//           date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
//           workMode: r.work_mode,
//           projectId: r.project_id || "",
//           projectName: r.project_name,
//           task: r.task_name,
//           bookElement: r.book_element,
//           chapterNo: r.chapter_number,
//           hoursSpent: r.hours_spent,
//           noOfUnits: r.number_of_units,
//           unitsType: r.unit_type,
//           status: r.status,
//           dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : "",
//           remarks: r.details || "",
//           auditStatus: r.audit_status || "Pending",
//           adminAction: r.added_by_admin ? 'added' : (r.edited_by_admin ? 'edited' : 'none'),
//           adminActionBy: r.admin_action_by || null,
//           adminActionDate: r.admin_action_date || null
//         }));
//         setPastRows(mapped);

//         // Extract recent projects for autocomplete
//         const projectMap = new Map();
//         mapped.forEach(row => {
//           if (row.projectId || row.projectName) {
//             const key = row.projectId || row.projectName;
//             if (!projectMap.has(key)) {
//               projectMap.set(key, {
//                 id: row.projectId || row.projectName,
//                 name: row.projectName || row.projectId,
//                 dueOn: row.dueOn || null
//               });
//             }
//           }
//         });
//         setRecentProjects(Array.from(projectMap.values()).slice(0, 10));

//         if (mapped.length === 0) setPastError("No recent worklogs found.");
//       } else {
//         setPastRows([]);
//         setRecentProjects([]);
//         setPastError("No recent worklogs found.");
//       }
//     } catch (err) {
//       if (err.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setPastError(`Failed to load recent worklogs: ${err?.response?.data?.message || err.message}`);
//       setPastRows([]);
//       setRecentProjects([]);
//     } finally {
//       setLoadingPast(false);
//     }
//   }, [checkTokenValidity]);

//   /* AUTO-SUBMIT HELPERS */
//   const getNextAutoSubmitTime = () => {
//     const now = new Date();
//     const target = new Date(now);
//     const [h, m] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
//     target.setHours(h, m, 0, 0);
//     if (now >= target) target.setDate(target.getDate() + 1);
//     return target;
//   };

//   const updateAutoSubmitCountdown = useCallback(() => {
//     const nextSubmit = getNextAutoSubmitTime();
//     const now = new Date();
//     const diff = nextSubmit - now;

//     if (diff <= 0) {
//       setAutoSubmitCountdown("Auto-submit time reached!");
//       return;
//     }

//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((diff % (1000 * 60)) / 1000);
//     setAutoSubmitCountdown(`${hours}h ${minutes}m ${seconds}s`);
//   }, []);

//   const performAutoSubmit = useCallback(async () => {
//     if (!checkTokenValidity()) return;

//     try {
//       const { data } = await axios.get("/worklogs/today");
//       let entriesToSubmit = [];

//       if (data?.success && data.entries && data.entries.length > 0) {
//         entriesToSubmit = data.entries.map((r) => ({
//           workMode: r.work_mode,
//           projectId: r.project_name,
//           projectName: r.project_name,
//           task: r.task_name,
//           bookElement: r.book_element,
//           chapterNo: String(r.chapter_number || ""),
//           hoursSpent: Number(r.hours_spent) || 0,
//           noOfUnits: Number(r.number_of_units) || 0,
//           unitsType: r.unit_type,
//           status: r.status,
//           dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : null,
//           remarks: r.details || null,
//         }));
//       }

//       const payload = { entries: entriesToSubmit };
//       const response = await axios.post("/worklogs", payload);

//       if (response.data.success) {
//         setTodayRows([]);
//         if (entriesToSubmit.length > 0) {
//           setSubmitMsg(`Auto-submitted ${response.data.inserted} entry(s) at ${AUTO_SUBMIT_TIME}!`);
//         } else {
//           setSubmitMsg(`Auto-submitted default "Leave" entry at ${AUTO_SUBMIT_TIME}!`);
//         }
//         await fetchPastWorklogs();
//       }
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setSubmitMsg(`Auto-submit failed: ${error?.response?.data?.message || error.message}`);
//     }
//   }, [checkTokenValidity, fetchPastWorklogs]);

//   const checkAutoSubmit = useCallback(() => {
//     const now = new Date();
//     const [targetHours, targetMinutes] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
//     const targetTime = new Date(now);
//     targetTime.setHours(targetHours, targetMinutes, 0, 0);
//     const timeDiff = Math.abs(now - targetTime);
//     const isWithinWindow = timeDiff <= 60000;

//     if (isWithinWindow) {
//       const today = now.toDateString();
//       const lastSubmitDate = localStorage.getItem(AUTO_SUBMIT_KEY);
//       if (lastSubmitDate !== today) {
//         localStorage.setItem(AUTO_SUBMIT_KEY, today);
//         performAutoSubmit();
//       }
//     }
//   }, [performAutoSubmit]);

//   /* EFFECTS */
//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       navigate("/");
//       return;
//     }

//     if (!checkTokenValidity()) {
//       return;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       const u = {
//         name: decoded.name,
//         email: decoded.email,
//         role: decoded.role,
//         team: decoded.team,
//         sub_team: decoded.sub_team,
//         picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
//       };
//       setUser(u);
//       axios.defaults.baseURL = API_BASE;
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
//       fetchPastWorklogs();
//       fetchTeamWiseDropdowns();
//     } catch (e) {
//       console.error("Invalid token:", e);
//       localStorage.removeItem("authToken");
//       navigate("/");
//     }
//   }, [navigate, fetchPastWorklogs, checkTokenValidity, fetchTeamWiseDropdowns]);

//   useEffect(() => {
//     if (user) {
//       loadTodaysWorklogFromDB();
//     }
//   }, [user, loadTodaysWorklogFromDB]);

//   useEffect(() => {
//     const updateCacheInfoLocal = () => {
//       setCacheInfo({
//         count: todayRows.length,
//         expiresAt: Date.now() + CACHE_DURATION,
//         timeLeft: todayRows.length > 0 ? "Stored in DB" : "",
//       });
//     };

//     const cacheInterval = setInterval(updateCacheInfoLocal, 60_000);
//     // const autoSubmitInterval = setInterval(() => {
//     //   updateAutoSubmitCountdown();           to stop auto submit
//     //   checkAutoSubmit();
//     // }, 1_000);
//     const tokenCheckInterval = setInterval(checkTokenValidity, 30_000);

//     updateCacheInfoLocal();
//     // updateAutoSubmitCountdown();  to stop auto submit

//     return () => {
//       clearInterval(cacheInterval);
//       // clearInterval(autoSubmitInterval);  to stop auto submit
//       clearInterval(tokenCheckInterval);
//     };
//   }, [todayRows.length, checkAutoSubmit, updateAutoSubmitCountdown, checkTokenValidity]);

//   /* FORM LOGIC */
//   const showFullBook = useMemo(() => [].includes(task), [task]);
//   const bookElements = useMemo(() => (showFullBook ? ["Full book", ...BASE_BOOK_ELEMENTS] : BASE_BOOK_ELEMENTS), [showFullBook, BASE_BOOK_ELEMENTS]);
//   const chapterNumbers = useMemo(
//     () => (showFullBook ? BASE_CHAPTER_NUMBERS : BASE_CHAPTER_NUMBERS.filter((v) => v !== "Full Book")),
//     [showFullBook, BASE_CHAPTER_NUMBERS]
//   );

//   const totalHours = useMemo(() => {
//     return todayRows.reduce((sum, row) => {
//       const hours = parseFloat(row.hoursSpent) || 0;
//       return sum + hours;
//     }, 0);
//   }, [todayRows]);

//   const showInOfficeWarning = useMemo(() => {
//     const hasInOffice = todayRows.some(row => row.workMode === "In Office");
//     return hasInOffice && totalHours < 5;
//   }, [todayRows, totalHours]);

//   const isDuplicateEntry = useCallback((newEntry, existingRows, excludeIndex = -1) => {
//     return existingRows.some((row, index) => {
//       if (index === excludeIndex) return false;

//       return (
//         row.workMode === newEntry.workMode &&
//         (row.projectId === newEntry.projectId || row.projectName === newEntry.projectName) &&
//         row.task === newEntry.task &&
//         row.bookElement === newEntry.bookElement &&
//         row.chapterNo === newEntry.chapterNo &&
//         String(row.hoursSpent) === String(newEntry.hoursSpent) &&
//         String(row.noOfUnits) === String(newEntry.noOfUnits) &&
//         row.unitsType === newEntry.unitsType &&
//         row.status === newEntry.status &&
//         row.dueOn === newEntry.dueOn &&
//         row.remarks === newEntry.remarks
//       );
//     });
//   }, []);

//   useEffect(() => {
//     let active = true;
//     const q = projectQuery.trim();

//     if (!q) {
//       if (recentProjects.length > 0) {
//         setSuggestions(recentProjects);
//         setShowSuggest(false);
//       } else {
//         setSuggestions([]);
//         setShowSuggest(false);
//       }
//       setSelectedSuggestionIndex(-1);
//       return;
//     }

//     if (projectId && projectId === q) {
//       setShowSuggest(false);
//       return;
//     }

//     if (!checkTokenValidity()) return;

//     setLoadingSuggestions(true);
//     const t = setTimeout(async () => {
//       try {
//         const { data } = await axios.get("/projects", { params: { q, by: searchBy } });
//         if (!active) return;
//         const transformed = (data.projects || []).map((p) => ({
//           id: p.project_id,
//           name: p.project_name,
//           dueOn: p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : null,
//         }));
//         setSuggestions(transformed);
//         setShowSuggest(transformed.length > 0);
//         setSelectedSuggestionIndex(-1);
//       } catch (err) {
//         if (err.response?.status === 401) {
//           checkTokenValidity();
//           return;
//         }
//         setSuggestions([]);
//         setShowSuggest(false);
//         setSelectedSuggestionIndex(-1);
//       } finally {
//         setLoadingSuggestions(false);
//       }
//     }, 300);

//     return () => {
//       active = false;
//       clearTimeout(t);
//       setLoadingSuggestions(false);
//     };
//   }, [projectQuery, searchBy, checkTokenValidity, recentProjects, projectId]);

//   useEffect(() => {
//     function onClickOutside(e) {
//       if (!suggestRef.current) return;
//       if (!suggestRef.current.contains(e.target)) {
//         setShowSuggest(false);
//         setSelectedSuggestionIndex(-1);
//       }
//     }
//     window.addEventListener("mousedown", onClickOutside);
//     return () => window.removeEventListener("mousedown", onClickOutside);
//   }, []);

//   const selectProject = (p) => {
//     setProjectId(p.id);
//     setProjectName(p.name);
//     setProjectQuery(p.id);
//     if (p.dueOn) {
//       setDueOn(p.dueOn);
//     }
//     setShowSuggest(false);
//     setSelectedSuggestionIndex(-1);
//   };

//   const isEmpty = (v) => Array.isArray(v) ? v.length === 0 : (v === null || v === undefined || String(v).trim() === "");

//   const projectValid =
//     (!!projectId && String(projectId).trim() !== "") ||
//     (!!projectName && String(projectName).trim() !== "") ||
//     (!!projectQuery.trim() && suggestions.some(s => s.id === projectQuery.trim()));

//   const required = { workMode, projectId: projectValid ? "ok" : "", task, bookElement, chapterNumber, hoursSpent, status, unitsCount, unitsType };

//   const invalid = Object.fromEntries(
//     Object.entries(required).map(([k, v]) => [k, isEmpty(v)])
//   );

//   const canSubmitRow = Object.values(required).every((v) => !isEmpty(v)) && !combinationBlocked;

//   const clearForm = () => {
//     setWorkMode("");
//     setProjectQuery("");
//     setProjectId("");
//     setProjectName("");
//     setTask("");
//     setBookElement("");
//     setChapterNumber([]);
//     setHoursSpent("");
//     setStatus("");
//     setUnitsCount("");
//     setUnitsType("");
//     setDueOn("");
//     setRemarks("");
//     setSubmitMsg(null);
//     setDuplicateMsg(null);
//     setEditSourceIndex(-1);
//     setUnitTypeDisabled(false);
//     setCombinationBlocked(false);
//     setBlockedMessage("");
//     setSkipUnitTypeLookup(false);
//     setIsSubmitting(false);
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     if (isSubmitting) {
//       return;
//     }

//     if (!canSubmitRow || !projectValid) return;

//     if (combinationBlocked) {
//       setDuplicateMsg(null);
//       setSubmitMsg(blockedMessage);
//       return;
//     }

//     const newEntry = {
//       workMode,
//       projectId: projectId || projectQuery.trim(),
//       projectName: projectName || projectQuery,
//       task,
//       bookElement,
//       chapterNo: chapterNumber.join(", "),
//       hoursSpent,
//       noOfUnits: Number(unitsCount),
//       unitsType,
//       status,
//       dueOn,
//       remarks,
//     };

//     if (isDuplicateEntry(newEntry, todayRows, editSourceIndex)) {
//       setDuplicateMsg("This entry already exists in today's worklog. Please modify the entry or remove the duplicate.");
//       setSubmitMsg(null);
//       window.scrollTo({ top: 0, behavior: "smooth" });
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       if (editSourceIndex !== -1) {
//         const currentRow = todayRows[editSourceIndex];
//         if (currentRow.id) {
//           const updatedEntry = await updateTodaysEntryInDB(currentRow.id, newEntry);
//           if (updatedEntry) {
//             setTodayRows((prev) => prev.map((r, i) => (i === editSourceIndex ? updatedEntry : r)));
//           }
//         }
//       } else {
//         const savedEntry = await saveTodaysEntryToDB(newEntry);
//         if (savedEntry) {
//           setTodayRows((prev) => [...prev, savedEntry]);
//         }
//       }
//       setDuplicateMsg(null);
//       clearForm();
//     } catch (error) {
//       setDuplicateMsg(null);
//       setSubmitMsg(`Failed to save entry: ${error?.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const copyRowToForm = (row) => {
//     setSkipUnitTypeLookup(true);

//     setWorkMode(row.workMode || "");
//     setProjectId(row.projectId || "");
//     setProjectQuery(row.projectId || row.projectName || "");
//     setProjectName(row.projectName || "");
//     setTask(row.task || "");
//     setBookElement(row.bookElement || "");
//     setUnitsType(row.unitsType || "");
//     setChapterNumber(
//       typeof row.chapterNo === "string"
//         ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
//         : Array.isArray(row.chapterNo)
//           ? row.chapterNo
//           : []
//     );
//     setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
//     setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
//     setStatus(row.status || "");
//     setDueOn(row.dueOn || "");
//     setRemarks(row.remarks || "");
//     setEditSourceIndex(-1);
//     setUnitTypeDisabled(false);
//     setCombinationBlocked(false);
//     setBlockedMessage("");

//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const startEditViaForm = (idx, row) => {
//     setSkipUnitTypeLookup(true);

//     setWorkMode(row.workMode || "");
//     setProjectId(row.projectId || "");
//     setProjectQuery(row.projectId || row.projectName || "");
//     setProjectName(row.projectName || "");
//     setTask(row.task || "");
//     setBookElement(row.bookElement || "");
//     setUnitsType(row.unitsType || "");
//     setChapterNumber(
//       typeof row.chapterNo === "string"
//         ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
//         : Array.isArray(row.chapterNo)
//           ? row.chapterNo
//           : []
//     );
//     setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
//     setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
//     setStatus(row.status || "");
//     setDueOn(row.dueOn || "");
//     setRemarks(row.remarks || "");
//     setEditSourceIndex(idx);
//     setUnitTypeDisabled(false);
//     setCombinationBlocked(false);
//     setBlockedMessage("");

//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const deleteRowAt = async (idx) => {
//     const row = todayRows[idx];

//     try {
//       if (row.id) {
//         const success = await deleteTodaysEntryFromDB(row.id);
//         if (success) {
//           setTodayRows((prev) => prev.filter((_, i) => i !== idx));
//           if (editSourceIndex === idx) setEditSourceIndex(-1);
//         } else {
//           setSubmitMsg("Failed to delete entry from database");
//         }
//       }
//     } catch (error) {
//       setSubmitMsg(`Failed to delete entry: ${error?.response?.data?.message || error.message}`);
//     }
//   };

//   async function submitTodaysWorklog() {
//     if (todayRows.length === 0) return;

//     if (!checkTokenValidity()) return;

//     setSubmitting(true);
//     setSubmitMsg(null);

//     try {
//       const payload = {
//         entries: todayRows.map((r) => ({
//           workMode: r.workMode,
//           projectId: r.projectId,
//           projectName: r.projectName,
//           task: r.task,
//           bookElement: r.bookElement,
//           chapterNo: String(r.chapterNo || ""),
//           hoursSpent: Number(r.hoursSpent) || 0,
//           noOfUnits: Number(r.noOfUnits) || 0,
//           unitsType: r.unitsType,
//           status: r.status,
//           dueOn: r.dueOn || null,
//           remarks: r.remarks || null,
//         })),
//       };

//       const { data } = await axios.post("/worklogs", payload);
//       setSubmitMsg(`Successfully submitted ${data.inserted} entry(s) to database!`);

//       setTodayRows([]);
//       await fetchPastWorklogs();
//     } catch (error) {
//       if (error.response?.status === 401) {
//         checkTokenValidity();
//         return;
//       }
//       setSubmitMsg(`Submit failed: ${error?.response?.data?.message || error.message}`);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     localStorage.removeItem(AUTO_SUBMIT_KEY);
//     localStorage.removeItem(CACHE_KEY);
//     if (window.google?.accounts?.id) {
//       window.google.accounts.id.disableAutoSelect();
//     }
//     delete axios.defaults.headers.common.Authorization;
//     navigate("/");
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-slate-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-100">
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//         <div className="max-w-full mx-auto px-4 sm:px-6">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
//               >
//                 <span className="sr-only">Toggle sidebar</span>
//                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               </button>

//               <div className="flex-shrink-0">
//                 <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
//                   <span className="block sm:inline">SPOC Dashboard</span>
//                   <span className="hidden sm:inline"> - Work Log</span>
//                 </h1>
//               </div>
//             </div>

//             <div className="hidden md:flex items-center space-x-4">
//               <div className="flex items-center space-x-3">
//                 <img
//                   src={user.picture}
//                   alt={user.name}
//                   className="w-8 h-8 rounded-full border-2 border-slate-600"
//                 />
//                 <div className="text-right">
//                   <div className="text-sm font-medium">{user.name}</div>
//                   <div className="text-xs text-slate-300">{user.email}</div>
//                 </div>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//               >
//                 Logout
//               </button>
//             </div>

//             <div className="md:hidden">
//               <button
//                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                 className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
//               >
//                 <span className="sr-only">Open main menu</span>
//                 {!mobileMenuOpen ? (
//                   <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                   </svg>
//                 ) : (
//                   <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//           </div>

//           {mobileMenuOpen && (
//             <div className="md:hidden border-t border-slate-700">
//               <div className="px-2 pt-2 pb-3 space-y-1">
//                 <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
//                   <img
//                     src={user.picture}
//                     alt={user.name}
//                     className="w-10 h-10 rounded-full border-2 border-slate-600"
//                   />
//                   <div className="ml-3">
//                     <div className="text-sm font-medium text-white">{user.name}</div>
//                     <div className="text-xs text-slate-300">{user.email}</div>
//                   </div>
//                 </div>

//                 <div className="px-3">
//                   <button
//                     onClick={() => {
//                       handleLogout();
//                       setMobileMenuOpen(false);
//                     }}
//                     className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       <div className="pt-16 flex">
//         {sidebarOpen && (
//           <div className="fixed inset-0 z-40 lg:hidden">
//             <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//             <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
//               <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} />
//             </aside>
//           </div>
//         )}

//         <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//           <SidebarLinks navigate={navigate} location={location} />
//         </aside>

//         <main className="flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto">
//           <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
//             <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
//               <div className="flex items-start justify-between mb-3">
//                 <h2 className="text-base sm:text-lg font-semibold text-slate-800">
//                   {editSourceIndex !== -1 ? "Edit Entry" : "New Entry"}
//                 </h2>
//                 <div className="text-right">
//                   <span className="text-xs text-red-600">* required fields</span>
//                   {cacheInfo.count > 0 && (
//                     <div className="text-xs text-blue-600 mt-1 md:hidden">
//                       {cacheInfo.count} entries stored in database
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {duplicateMsg && (
//                 <div className="mb-4 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900 flex items-start shadow-md">
//                   <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                   <div>
//                     <div className="font-semibold mb-1">Duplicate Entry Detected</div>
//                     <div>{duplicateMsg}</div>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => setDuplicateMsg(null)}
//                     className="ml-auto text-red-900 hover:text-red-700"
//                   >
//                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
//                     </svg>
//                   </button>
//                 </div>
//               )}
//               {combinationBlocked && (
//                 <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900 flex items-start">
//                   <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                   <span>{blockedMessage}</span>
//                 </div>
//               )}

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <Field label="Work Mode *">
//                   <Select
//                     value={workMode}
//                     onChange={setWorkMode}
//                     options={["", ...WORK_MODES]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.workMode}
//                   />
//                 </Field>

//                 <Field label="Project Search *">
//                   <div className="flex gap-2 items-center">
//                     <div className="relative flex-1" ref={suggestRef}>
//                       <input
//                         ref={inputRef}
//                         type="text"
//                         placeholder="Start typing project name or ID…"
//                         className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${invalid.projectId ? "border-red-500" : "border-slate-300"} focus:border-indigo-600`}
//                         value={projectQuery}
//                         onChange={(e) => {
//                           const newValue = e.target.value;
//                           setProjectQuery(newValue);
//                           if (newValue !== projectId) {
//                             setProjectId("");
//                             setProjectName("");
//                             if (projectId && !newValue.trim()) {
//                               setDueOn("");
//                             }
//                           }
//                           if (!newValue.trim()) setDueOn("");
//                         }}
//                         onFocus={() => {
//                           if (!projectQuery.trim() && !projectId && recentProjects.length > 0) {
//                             setSuggestions(recentProjects);
//                             setShowSuggest(true);
//                           }
//                         }}
//                         onBlur={() => {
//                           setTimeout(() => {
//                             setShowSuggest(false);
//                             setSelectedSuggestionIndex(-1);
//                           }, 200);
//                         }}
//                         onKeyDown={(e) => {
//                           if (!showSuggest || suggestions.length === 0) return;

//                           if (e.key === "ArrowDown") {
//                             e.preventDefault();
//                             setSelectedSuggestionIndex((prev) =>
//                               prev < suggestions.length - 1 ? prev + 1 : prev
//                             );
//                           } else if (e.key === "ArrowUp") {
//                             e.preventDefault();
//                             setSelectedSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1);
//                           } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
//                             e.preventDefault();
//                             selectProject(suggestions[selectedSuggestionIndex]);
//                           } else if (e.key === "Escape") {
//                             setShowSuggest(false);
//                             setSelectedSuggestionIndex(-1);
//                           }
//                         }}
//                       />
//                       {loadingSuggestions && (
//                         <div className="absolute right-3 top-2">
//                           <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
//                         </div>
//                       )}
//                       {showSuggest && suggestions.length > 0 && (
//                         <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border bg-white shadow-2xl">
//                           {!projectQuery.trim() && (
//                             <li className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b">
//                               Recently Used Projects
//                             </li>
//                           )}
//                           {suggestions.map((s, index) => (
//                             <li
//                               key={`${s.id}-${index}`}
//                               onMouseDown={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                               }}
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 selectProject(s);
//                               }}
//                               onMouseEnter={() => setSelectedSuggestionIndex(index)}
//                               className={`px-4 py-3 text-sm cursor-pointer border-b border-slate-100 last:border-b-0 ${index === selectedSuggestionIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50'
//                                 }`}
//                             >
//                               <div className="font-medium text-slate-900">{s.id}</div>
//                               <div className="text-xs text-slate-600 mt-1">{s.name}</div>
//                               {s.dueOn && <div className="text-xs text-orange-600 mt-1">Due: {s.dueOn}</div>}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                       {showSuggest && suggestions.length === 0 && !loadingSuggestions && projectQuery.trim() && (
//                         <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-white shadow-2xl px-4 py-3 text-sm text-slate-500">
//                           No projects found for "{projectQuery}"
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </Field>

//                 <Field label="Task *">
//                   <Select
//                     value={task}
//                     onChange={(newTask) => {
//                       setTask(newTask);
//                       if (skipUnitTypeLookup) {
//                         setSkipUnitTypeLookup(false);
//                       }
//                     }}
//                     options={["", ...TASKS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.task}
//                   />
//                 </Field>

//                 <Field label="Element *">
//                   <Select
//                     value={bookElement}
//                     onChange={(newBookElement) => {
//                       setBookElement(newBookElement);
//                       if (skipUnitTypeLookup) {
//                         setSkipUnitTypeLookup(false);
//                       }
//                     }}
//                     options={["", ...bookElements]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.bookElement}
//                   />
//                 </Field>

//                 <Field label="Sub-Element(Chapter No.) *">
//                   <MultiSelectChips
//                     value={chapterNumber}
//                     onChange={setChapterNumber}
//                     options={chapterNumbers}
//                     placeholder="Select Sub-Element…"
//                     isInvalid={invalid.chapterNumber}
//                     bookElement={bookElement}
//                   />
//                 </Field>

//                 <Field label="Hours Spent *">
//                   <Select
//                     value={hoursSpent}
//                     onChange={setHoursSpent}
//                     options={["", ...HOURS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.hoursSpent}
//                   />
//                 </Field>

//                 <Field label="No. of Units *">
//                   <div className="flex gap-2 items-start">
//                     <input
//                       type="number"
//                       className={`flex-1 h-9 text-sm px-3 rounded-2xl border-2 ${invalid.unitsCount ? "border-red-500" : "border-slate-300"
//                         } focus:border-indigo-600 ${unitsType === "general" ? "bg-slate-100 cursor-not-allowed" : ""}`}
//                       placeholder="e.g., 10"
//                       value={unitsType === "general" ? "1" : unitsCount}
//                       onChange={(e) => {
//                         if (unitsType === "general") return;

//                         const value = e.target.value;
//                         if (value === '' || (parseFloat(value) >= 0)) {
//                           setUnitsCount(value);
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (unitsType === "general") {
//                           e.preventDefault();
//                           return;
//                         }

//                         if (['-', 'e', 'E', '+'].includes(e.key)) {
//                           e.preventDefault();
//                         }
//                       }}
//                       disabled={unitsType === "general"}
//                     />
//                     <div className="w-28 relative">
//                       <Select
//                         value={unitsType}
//                         onChange={setUnitsType}
//                         options={UNITS.map((u) => u.value)}
//                         labels={UNITS.reduce((m, u) => {
//                           m[u.value] = u.label;
//                           return m;
//                         }, {})}
//                         isInvalid={invalid.unitsType}
//                         disabled={unitTypeDisabled}
//                       />
//                       {unitTypeLookupLoading && (
//                         <div className="absolute right-2 top-2">
//                           <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
//                         </div>
//                       )}
//                       {unitTypeDisabled && !unitTypeLookupLoading && !combinationBlocked && (
//                         <div className="mt-1 text-xs text-green-600">Auto-selected</div>
//                       )}
//                       {unitsType === "general" && (
//                         <div className="mt-1 text-xs text-blue-600"></div>
//                       )}
//                     </div>
//                   </div>
//                 </Field>

//                 <Field label="Status *">
//                   <Select
//                     value={status}
//                     onChange={setStatus}
//                     options={["", ...STATUS]}
//                     labels={{ "": "— Select —" }}
//                     isInvalid={invalid.status}
//                   />
//                 </Field>

//                 <Field label="Due On">
//                   <input
//                     type="date"
//                     className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${dueOn && projectId ? "bg-slate-100 cursor-not-allowed border-slate-300" : "border-slate-300 focus:border-indigo-600"
//                       }`}
//                     value={dueOn}
//                     onChange={(e) => {
//                       if (!projectId) {
//                         setDueOn(e.target.value);
//                       }
//                     }}
//                     disabled={!!(dueOn && projectId)}
//                   />
//                   {dueOn && (
//                     <div className="mt-1 text-xs text-slate-600">
//                       Due: {new Date(dueOn).toLocaleDateString()}
//                       {projectId && <span className="ml-2 text-blue-600"></span>}
//                     </div>
//                   )}
//                 </Field>

//                 <Field label="Details">
//                   <textarea
//                     className="w-full min-h-[140px] text-sm px-3 py-2 rounded-2xl border-2 border-slate-300 focus:border-indigo-600"
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                     placeholder="Add any additional notes..."
//                   />
//                 </Field>
//               </div>

//               <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={clearForm}
//                   className="w-full sm:w-auto px-4 py-1.5 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
//                 >
//                   Clear
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={!canSubmitRow || !projectValid || isSubmitting}
//                   className={`w-full sm:w-auto px-5 py-1.5 rounded-2xl text-white transition-colors ${canSubmitRow && projectValid && !isSubmitting
//                     ? "bg-indigo-700 hover:bg-indigo-800"
//                     : "bg-slate-400 cursor-not-allowed"
//                     }`}
//                 >
//                   {isSubmitting ? (
//                     <span className="flex items-center justify-center">
//                       <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
//                       {editSourceIndex !== -1 ? "Updating..." : "Adding..."}
//                     </span>
//                   ) : (
//                     editSourceIndex !== -1 ? "Update Entry" : "Add to Today's Worklog"
//                   )}
//                 </button>
//               </div>
//             </form>

//             <section className="mt-8 space-y-6">
//               {loadingToday ? (
//                 <Feedback message="Loading today's worklog..." />
//               ) : todayRows.length > 0 ? (
//                 <>
//                   <EditableBlock
//                     title={`Today's Worklog - Total Hours: ${totalHours.toFixed(1)}`}
//                     rows={todayRows}
//                     onCopyRow={copyRowToForm}
//                     onStartEdit={startEditViaForm}
//                     onDeleteRow={deleteRowAt}
//                     lists={{ WORK_MODES, TASKS, STATUS, HOURS, UNITS }}
//                     getAdminActionBadge={getAdminActionBadge}
//                     getAdminActionRowClass={getAdminActionRowClass}
//                   />
//                   <div className="text-xs text-slate-600 text-center bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2">
//                     Your entries are saved in database and will auto-submit at 03:00 AM
//                   </div>

//                   {showInOfficeWarning && (
//                     <div className="rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 flex items-start">
//                       <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                       </svg>
//                       <div>
//                         <div className="font-semibold mb-1">Hours Check</div>
//                         <div>Your total hours are less than 5 hours. Are you sure you were in office? If you were on half day, please select "Half Day" as your work mode instead of "In Office".</div>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <Feedback message={submitMsg || "No entries for today yet."} />
//               )}

//               <div className="flex items-center justify-center">
//                 <button
//                   onClick={submitTodaysWorklog}
//                   disabled={submitting || todayRows.length === 0}
//                   className="px-5 py-1.5 rounded-2xl text-white bg-emerald-700 disabled:opacity-60 hover:bg-emerald-800 transition-colors"
//                 >
//                   {submitting ? "Submitting…" : "Submit Today's Worklog"}
//                 </button>
//               </div>

//               {submitMsg && <Feedback message={submitMsg} />}
//               {pastError && <Feedback message={pastError} />}
//               {loadingPast && <Feedback message="Loading past 7 days worklog..." />}
//               {!pastError && !loadingPast && pastRows.length === 0 && <Feedback message="No entries in the last 7 days." />}

//               {pastRows.length > 0 && (
//                 <DataBlock
//                   title={`Past 7 Days Worklog (${pastRows.length} entries)`}
//                   rows={pastRows}
//                   subtle
//                   hideEdit
//                   getAdminActionBadge={getAdminActionBadge}
//                   getAdminActionRowClass={getAdminActionRowClass}
//                 />
//               )}
//             </section>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// /* Sidebar Links Component for SPOC Dashboard */
// function SidebarLinks({ navigate, location, close }) {
//   const [openMissingEntry, setOpenMissingEntry] = useState(false);

//   useEffect(() => {
//     if (location.pathname.includes("missing-entry")) {
//       setOpenMissingEntry(true);
//     }
//   }, [location]);

//   const handleNavigation = (path, isChildOfMissingEntry = false) => {
//     navigate(path);

//     if (!isChildOfMissingEntry && !path.includes("missing-entry")) {
//       setOpenMissingEntry(false);
//     }

//     if (close) close();
//   };

//   const toggleMissingEntry = () => {
//     setOpenMissingEntry(!openMissingEntry);
//   };

//   const isHomePage = location.pathname === "/spoc-dashboard";
//   const isMissingEntryPage = location.pathname.includes("missing-entry");

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//       <nav className="flex flex-col space-y-2">
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${isHomePage && !isMissingEntryPage ? "bg-gray-700" : ""
//             }`}
//           onClick={() => handleNavigation("/spoc-dashboard")}
//         >
//           Home
//         </button>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => handleNavigation("/spoc/approve-worklogs")}
//         >
//           Approve Worklogs
//         </button>

//         <div>
//           <button
//             className={`w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors ${isMissingEntryPage && !location.pathname.includes("missing-entry-request") && !location.pathname.includes("missing-entry-status")
//               ? "bg-gray-700"
//               : ""
//               }`}
//             onClick={toggleMissingEntry}
//           >
//             <span>Missing Entry</span>
//             <span className="transition-transform duration-200">
//               {openMissingEntry ? "▾" : "▸"}
//             </span>
//           </button>
//           {openMissingEntry && (
//             <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("missing-entry-request") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => handleNavigation("/spoc/missing-entry-request", true)}
//               >
//                 Request Missing Entry
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("missing-entry-status") ? "bg-gray-700" : ""
//                   }`}
//                 onClick={() => handleNavigation("/spoc/missing-entry-status", true)}
//               >
//                 Approve Missing Entry
//               </button>
//             </div>
//           )}
//         </div>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => handleNavigation("/spoc/add-project")}
//         >
//           Add Project
//         </button>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("mark-night-shift") || location.pathname.includes("mark-extra-shift")
//             ? "bg-gray-700"
//             : ""
//             }`}
//           onClick={() => handleNavigation("/spoc/mark-night-shift")}
//         >
//           Mark Extra Shift
//         </button>
//       </nav>
//     </div>
//   );
// }

// // Helper components
// function Field({ label, children }) {
//   return (
//     <label className="block">
//       <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
//       {children}
//     </label>
//   );
// }

// function Select({ value, onChange, options, labels, isInvalid, disabled }) {
//   const safeOptions = Array.isArray(options) ? options : [];
//   const labelFor = (o) =>
//     labels && typeof labels === "object" && Object.prototype.hasOwnProperty.call(labels, o) ? labels[o] : o;

//   return (
//     <select
//       className={`w-full h-9 text-sm px-2 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
//         } focus:border-indigo-600 ${disabled ? "bg-slate-100 cursor-not-allowed" : ""}`}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       disabled={disabled}
//     >
//       {safeOptions.map((o, idx) => (
//         <option key={idx} value={o}>
//           {labelFor(o)}
//         </option>
//       ))}
//     </select>
//   );
// }

// function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select one or more…", isInvalid = false, bookElement = "" }) {
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const shellRef = useRef(null);
//   const inputRef = useRef(null);
//   const lastActionTs = useRef(0);

//   useEffect(() => {
//     const handleDown = (e) => {
//       if (!shellRef.current) return;
//       if (!shellRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handleDown);
//     return () => document.removeEventListener("mousedown", handleDown);
//   }, []);

//   const deduped = useMemo(() => Array.from(new Set(options.map((o) => String(o)))), [options]);

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     let availableOptions = deduped.filter((o) => !value.includes(o));

//     if (bookElement === "Full book") {
//       availableOptions = availableOptions.filter(o => isNaN(Number(o)));
//     }

//     return availableOptions.filter((o) => (q ? o.toLowerCase().includes(q) : true));
//   }, [deduped, value, query, bookElement]);

//   const guardOnce = () => {
//     const now = Date.now();
//     if (now - lastActionTs.current < 120) return false;
//     lastActionTs.current = now;
//     return true;
//   };

//   const addItem = (item) => {
//     if (!guardOnce()) return;
//     if (!value.includes(item)) onChange([...value, item]);
//     setQuery("");
//     setOpen(true);
//     inputRef.current?.focus();
//   };

//   const removeAt = (idx) => {
//     if (!guardOnce()) return;
//     const next = value.slice();
//     next.splice(idx, 1);
//     onChange(next);
//     setOpen(true);
//     inputRef.current?.focus();
//   };

//   return (
//     <div className="relative" ref={shellRef}>
//       <div
//         className={`min-h-[44px] w-full rounded-2xl border-2 bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${isInvalid ? "border-red-500" : "border-slate-300"
//           } focus-within:border-indigo-600`}
//         onMouseDown={(e) => {
//           if (e.target === e.currentTarget) e.preventDefault();
//           setOpen(true);
//           inputRef.current?.focus();
//         }}
//         role="combobox"
//         aria-expanded={open}
//       >
//         {value.map((v, idx) => (
//           <span
//             key={`${v}-${idx}`}
//             className="flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-[2px] text-xs"
//           >
//             {v}
//             <button
//               type="button"
//               onMouseDown={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 removeAt(idx);
//               }}
//               className="ml-1 rounded-full hover:bg-indigo-100 p-[2px] leading-none"
//               aria-label={`Remove ${v}`}
//             >
//               ✕
//             </button>
//           </span>
//         ))}
//         <input
//           ref={inputRef}
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           onFocus={() => setOpen(true)}
//           onKeyDown={(e) => {
//             if (e.key === "Backspace" && query === "" && value.length) {
//               removeAt(value.length - 1);
//             } else if (e.key === "Enter" && query.trim()) {
//               e.preventDefault();
//               const exactMatch = filtered.find(opt => opt.toLowerCase() === query.trim().toLowerCase());
//               if (exactMatch) {
//                 addItem(exactMatch);
//               }
//             }
//           }}
//           className="flex-1 min-w-[80px] outline-none text-sm px-1 py-1 bg-transparent"
//           placeholder={value.length ? "" : placeholder}
//         />
//       </div>
//       {open && (
//         <div
//           className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl border bg-white shadow-2xl"
//           role="listbox"
//           onMouseDown={(e) => e.preventDefault()}
//         >
//           {filtered.length === 0 ? (
//             <div className="px-3 py-2 text-sm text-slate-500">
//               {bookElement === "Full book" ? "Only non-numeric chapters allowed for Full book" : "No matches"}
//             </div>
//           ) : (
//             filtered.map((opt) => (
//               <div
//                 key={opt}
//                 role="option"
//                 onMouseDown={(e) => {
//                   e.preventDefault();
//                   e.stopPropagation();
//                   addItem(opt);
//                 }}
//                 className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
//               >
//                 {opt}
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
// function DataBlock({ title, rows, subtle = false, hideEdit = false, onStartEdit, getAdminActionBadge, getAdminActionRowClass }) {
//   return (
//     <div className={`rounded-2xl border ${subtle ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"} shadow-sm`}>
//       <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
//       </div>
//       <div className="overflow-auto">
//         <table className="min-w-full text-left text-xs">
//           <thead className="bg-slate-100 text-slate-900">
//             <tr>
//               {PAST_HEADERS.map((h) => (
//                 <th key={h} className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">
//                   {h}
//                 </th>
//               ))}
//               {!hideEdit && <th className="px-3 py-2 font-semibold sticky top-0 bg-slate-100">Edit</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, idx) => (
//               <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${getAdminActionRowClass(r)}`}>
//                 <td className="px-3 py-2 whitespace-nowrap">
//                   <div>
//                     {r.date}
//                     {getAdminActionBadge(r)}
//                   </div>
//                 </td>
//                 <td className="px-3 py-2 whitespace-nowrap">{r.workMode}</td>
//                 <td className="px-3 py-2 min-w-[14rem]">{r.projectId || r.projectName}</td>
//                 <td className="px-3 py-2">{r.task}</td>
//                 <td className="px-3 py-2">{r.bookElement}</td>
//                 <td className="px-3 py-2">{r.chapterNo}</td>
//                 <td className="px-3 py-2">{r.hoursSpent}</td>
//                 <td className="px-3 py-2">{r.noOfUnits}</td>
//                 <td className="px-3 py-2">{r.unitsType}</td>
//                 <td className="px-3 py-2">{r.status}</td>
//                 <td className="px-3 py-2">{r.dueOn}</td>
//                 <td className="px-3 py-2">{r.remarks}</td>
//                 <td className="px-3 py-2">
//                   <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${r.auditStatus === 'Approved' ? 'bg-green-100 text-green-800' :
//                     r.auditStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
//                       r.auditStatus === 'Re-Pending' ? 'bg-yellow-100 text-yellow-800' :
//                         r.auditStatus === 'Re-Approved' ? 'bg-green-200 text-green-900' :
//                           r.auditStatus === 'Re-Rejected' ? 'bg-red-200 text-red-900' :
//                             'bg-gray-100 text-gray-800'
//                     }`}>
//                     {r.auditStatus}
//                   </span>
//                 </td>
//                 {!hideEdit && (
//                   <td className="px-3 py-2">
//                     <button
//                       className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
//                       onClick={() => onStartEdit(idx)}
//                     >
//                       Edit
//                     </button>
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function EditableBlock({ title, rows, onStartEdit, onDeleteRow, onCopyRow, lists, getAdminActionBadge, getAdminActionRowClass }) {
//   return (
//     <div className="rounded-2xl border border-slate-300 bg-slate-50 shadow-sm">
//       <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
//       </div>
//       <div className="overflow-auto">
//         <table className="min-w-full text-left text-xs">
//           <thead className="bg-slate-100 text-slate-900">
//             <tr>
//               {TODAY_HEADERS.map((h) => (
//                 <th key={h} className="px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//               <th className="px-3 py-2 font-semibold sticky right-0 bg-slate-100 z-10 text-right">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, idx) => (
//               <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${getAdminActionRowClass(r)}`}>
//                 <td className="px-3 py-2 whitespace-nowrap">
//                   <div>
//                     {r.workMode}
//                     {getAdminActionBadge(r)}
//                   </div>
//                 </td>
//                 <td className="px-3 py-2 min-w-[14rem]">
//                   <div>
//                     {r.projectId || r.projectName}
//                   </div>
//                 </td>
//                 <td className="px-3 py-2">{r.task}</td>
//                 <td className="px-3 py-2">{r.bookElement}</td>
//                 <td className="px-3 py-2">{r.chapterNo}</td>
//                 <td className="px-3 py-2">{r.hoursSpent}</td>
//                 <td className="px-3 py-2">{r.noOfUnits}</td>
//                 <td className="px-3 py-2">{r.unitsType}</td>
//                 <td className="px-3 py-2">{r.status}</td>
//                 <td className="px-3 py-2">{r.dueOn}</td>
//                 <td className="px-3 py-2">{r.remarks}</td>
//                 <td className="px-3 py-2 sticky right-0 bg-inherit z-10">
//                   <div className="flex gap-1 justify-end">
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-sky-600 text-white hover:bg-sky-700"
//                       onClick={() => onCopyRow?.(r)}
//                       title="Copy this row into the form"
//                     >
//                       Copy
//                     </button>
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-indigo-600 text-white hover:bg-indigo-700"
//                       onClick={() => onStartEdit?.(idx, r)}
//                       title="Edit this row in the form"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       type="button"
//                       className="px-2 py-1 rounded-xl text-xs bg-rose-600 text-white hover:bg-rose-700"
//                       onClick={() => onDeleteRow?.(idx)}
//                       title="Delete this row"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function Feedback({ message }) {
//   const isError = message && (message.includes("Error") || message.includes("Failed") || message.includes("failed") || message.includes("not allowed") || message.includes("already exists"));
//   const isSuccess = message && (message.includes("Successfully") || message.includes("submitted"));

//   let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
//   if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
//   if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

//   return <div className={`rounded-2xl border px-3 py-2 text-xs ${bgColor}`}>{message}</div>;
// }


import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import axios from "axios"

const API_BASE = import.meta.env?.VITE_API_BASE;

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const AUTO_SUBMIT_TIME = "03:00";
const CACHE_KEY = "worklog_cache_v2";
const AUTO_SUBMIT_KEY = "lastAutoSubmitDate";

// Admin action badge helper
const getAdminActionBadge = (row) => {
  const adminAction = row.adminAction || 'none';
  const actionBy = row.adminActionBy;

  if (adminAction === 'edited') {
    return (
      <div className="mb-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-200">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
          </svg>
          Edited by Admin
          {actionBy && <span className="text-blue-600 text-[9px]">({actionBy})</span>}
        </span>
      </div>
    );
  }

  if (adminAction === 'added') {
    return (
      <div className="mb-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-medium border border-green-200">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Added by Admin
          {actionBy && <span className="text-green-600 text-[9px]">({actionBy})</span>}
        </span>
      </div>
    );
  }

  return null;
};

const getAdminActionRowClass = (row) => {
  const adminAction = row.adminAction || 'none';

  if (adminAction === 'edited') {
    return 'bg-blue-50/50 border-l-4 border-blue-300';
  }

  if (adminAction === 'added') {
    return 'bg-green-50/50 border-l-4 border-green-300';
  }

  return '';
};

// Constants
const WORK_MODES = ["In Office", "WFH", "On Duty", "Half Day", "OT Home", "OT Office", "Night"];
const STATUS = ["In Progress", "Delayed", "Completed"];
// const HOURS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8"];
const HOURS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
const MINUTES = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const UNITS = [
  { label: "— Select —", value: "" },
  { label: "pages", value: "pages" },
  { label: "frames", value: "frames" },
  { label: "seconds", value: "seconds" },
  { label: "general", value: "general" },
  { label: "count", value: "count" },
  { label: "rows", value: "rows" },
  { label: "correction(s)", value: "corrections" }
];

const TODAY_HEADERS = [
  "Work Mode",
  "Project Name",
  "Task",
  "Element",
  "Sub-Element(Chapter No.)",
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
  "Element",
  "Sub-Element(Chapter No.)",
  "Hours Spent",
  "No. of Units",
  "Unit Type",
  "Status",
  "Due On",
  "Details",
  "Audit Status",
];

export default function SpocDashboard() {
  const navigate = useNavigate();
  const location = useLocation()

  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [approveMissingCount, setApproveMissingCount] = useState(0);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hoursValue, setHoursValue] = useState("0");
  const [minutesValue, setMinutesValue] = useState("0");

  // Team-wise dropdown state
  const [teamDropdowns, setTeamDropdowns] = useState({
    bookElements: [],
    taskNames: [],
    chapterNumbers: []
  });
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Unit type lookup state
  const [unitTypeDisabled, setUnitTypeDisabled] = useState(false);
  const [unitTypeLookupLoading, setUnitTypeLookupLoading] = useState(false);
  const [combinationBlocked, setCombinationBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [skipUnitTypeLookup, setSkipUnitTypeLookup] = useState(false);

  // Cache/auto-submit UI state
  const [cacheInfo, setCacheInfo] = useState({ count: 0, expiresAt: null, timeLeft: "" });
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState("");

  // Form state
  const [workMode, setWorkMode] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [task, setTask] = useState("");
  const [bookElement, setBookElement] = useState("");
  const [chapterNumber, setChapterNumber] = useState([]);
  const [hoursSpent, setHoursSpent] = useState("");
  const [status, setStatus] = useState("");
  const [unitsCount, setUnitsCount] = useState("");
  const [unitsType, setUnitsType] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchBy, setSearchBy] = useState("name");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestRef = useRef(null);
  const inputRef = useRef(null);

  const [todayRows, setTodayRows] = useState([]);
  const [pastRows, setPastRows] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [loadingToday, setLoadingToday] = useState(false);
  const [pastError, setPastError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [duplicateMsg, setDuplicateMsg] = useState(null);

  const [editSourceIndex, setEditSourceIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  /* TOKEN VALIDATION & AUTO-LOGOUT */
  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setTokenExpired(true);
      navigate("/");
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        setTokenExpired(true);
        localStorage.removeItem("authToken");
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(AUTO_SUBMIT_KEY);
        delete axios.defaults.headers.common.Authorization;
        navigate("/");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenExpired(true);
      localStorage.removeItem("authToken");
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(AUTO_SUBMIT_KEY);
      delete axios.defaults.headers.common.Authorization;
      navigate("/");
      return false;
    }
  }, [navigate]);

  /* FETCH TEAM DROPDOWNS */
  const fetchTeamWiseDropdowns = useCallback(async () => {
    if (!checkTokenValidity()) return;

    setLoadingDropdowns(true);
    try {
      const { data } = await axios.get("/worklogs/team-dropdowns");

      if (data?.success && data?.dropdowns) {
        setTeamDropdowns({
          bookElements: data.dropdowns.bookElements || [],
          taskNames: data.dropdowns.taskNames || [],
          chapterNumbers: data.dropdowns.chapterNumbers || []
        });
      } else {
        setTeamDropdowns({
          bookElements: [],
          taskNames: [],
          chapterNumbers: []
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      console.error("Failed to load team dropdowns:", error);
      setTeamDropdowns({
        bookElements: [],
        taskNames: [],
        chapterNumbers: []
      });
    } finally {
      setLoadingDropdowns(false);
    }
  }, [checkTokenValidity]);

  /* FETCH UNIT TYPE FOR COMBINATION */
  const fetchUnitTypeForCombination = useCallback(async (selectedTask, selectedBookElement) => {
    if (!selectedTask || !selectedBookElement) {
      setUnitTypeDisabled(false);
      setCombinationBlocked(false);
      setBlockedMessage("");
      if (!selectedTask && !selectedBookElement) {
        setUnitsType("");
      }
      return;
    }

    if (skipUnitTypeLookup) {
      return;
    }

    if (!checkTokenValidity()) return;

    setUnitTypeLookupLoading(true);

    try {
      const { data } = await axios.get("/worklogs/unit-type-lookup", {
        params: {
          task: selectedTask,
          bookElement: selectedBookElement
        }
      });

      if (data.success && data.found) {
        if (data.isNA) {
          setCombinationBlocked(true);
          setBlockedMessage(`The combination of "${selectedTask}" and "${selectedBookElement}" is not allowed. Please change either Task or Book Element.`);
          setUnitsType("");
          setUnitTypeDisabled(true);
        } else {
          const normalizedUnitType = data.unitType.toLowerCase();
          setUnitsType(normalizedUnitType);
          setUnitTypeDisabled(true);
          setCombinationBlocked(false);
          setBlockedMessage("");

          if (normalizedUnitType === "general") {
            setUnitsCount("1");
          }
        }
      } else {
        if (!skipUnitTypeLookup) {
          setUnitsType("");
        }
        setUnitTypeDisabled(false);
        setCombinationBlocked(false);
        setBlockedMessage("");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      console.error("Failed to lookup unit type:", error);
      if (!skipUnitTypeLookup) {
        setUnitsType("");
      }
      setUnitTypeDisabled(false);
      setCombinationBlocked(false);
      setBlockedMessage("");
    } finally {
      setUnitTypeLookupLoading(false);
    }
  }, [checkTokenValidity, skipUnitTypeLookup]);

  useEffect(() => {
    if (skipUnitTypeLookup) return;
    fetchUnitTypeForCombination(task, bookElement);
  }, [task, bookElement, fetchUnitTypeForCombination, skipUnitTypeLookup]);

  useEffect(() => {
    if (unitsType === "general") {
      setUnitsCount("1");
    }
  }, [unitsType]);

  // Memoized dropdown options
  const TASKS = useMemo(() => {
    if (teamDropdowns.taskNames && teamDropdowns.taskNames.length > 0) {
      return teamDropdowns.taskNames;
    }
    return ["CMPL-MS", "VRF-MS", "DRF", "TAL", "R1", "R2", "R3", "R4", "CR", "FER", "SET", "FINAL", "MEET", "QRY", "Coord", "GLANCE", "Research", "Analysis", "KT", "Interview", "PLAN", "UPL", "Generation", "COM", "CR1", "CR2", "CR3", "CR4", "CR5", "Code"];
  }, [teamDropdowns.taskNames]);

  const BASE_BOOK_ELEMENTS = useMemo(() => {
    if (teamDropdowns.bookElements && teamDropdowns.bookElements.length > 0) {
      return teamDropdowns.bookElements;
    }
    return ["Theory", "Exercise", "Chapter", "Full book", "Mind Map", "Diagram", "Solution", "Booklet", "Full Video", "AVLR-VO", "DLR", "Lesson Plan", "Miscellaneous", "AVLR-Ideation", "Marketing", "Development", "Recruitment", "References", "Frames", "Papers", "Projects", "Shooting", "Frontend", "Backend", "DB", "OST", "Visual Instructions", "Animation", "Sheets"];
  }, [teamDropdowns.bookElements]);

  const BASE_CHAPTER_NUMBERS = useMemo(() => {
    if (teamDropdowns.chapterNumbers && teamDropdowns.chapterNumbers.length > 0) {
      return teamDropdowns.chapterNumbers;
    }
    return ["Title", "Syllabus", "Content", "Projects", "Papers", "Miscellaneous", "Appendix", "Full book", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5",
      ...Array.from({ length: 40 }, (_, i) => String(i + 1))
    ];
  }, [teamDropdowns.chapterNumbers]);

  /* DATABASE OPERATIONS */
  const loadTodaysWorklogFromDB = useCallback(async () => {
    if (!checkTokenValidity()) return;

    setLoadingToday(true);
    try {
      const { data } = await axios.get("/worklogs/today");
      if (data?.success && Array.isArray(data.entries)) {
        const mapped = data.entries.map((entry) => ({
          id: entry.id,
          workMode: entry.work_mode,
          projectId: entry.project_name,
          projectName: entry.project_name,
          task: entry.task_name,
          bookElement: entry.book_element,
          chapterNo: entry.chapter_number,
          hoursSpent: String(entry.hours_spent || ""),
          noOfUnits: Number(entry.number_of_units) || 0,
          unitsType: entry.unit_type,
          status: entry.status,
          dueOn: entry.due_on ? new Date(entry.due_on).toISOString().slice(0, 10) : "",
          remarks: entry.details || "",
          adminAction: entry.added_by_admin ? 'added' : (entry.edited_by_admin ? 'edited' : 'none'),
          adminActionBy: entry.admin_action_by || null,
          adminActionDate: entry.admin_action_date || null
        }));
        setTodayRows(mapped);
      } else {
        setTodayRows([]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      console.error("Failed to load today's worklog from database:", error);
      setTodayRows([]);
    } finally {
      setLoadingToday(false);
    }
  }, [checkTokenValidity]);

  const saveTodaysEntryToDB = useCallback(async (entry) => {
    if (!checkTokenValidity()) return null;

    try {
      const { data } = await axios.post("/worklogs/today", { entry });
      if (data?.success) {
        return {
          id: data.entry.id,
          workMode: data.entry.work_mode,
          projectId: data.entry.project_name,
          projectName: data.entry.project_name,
          task: data.entry.task_name,
          bookElement: data.entry.book_element,
          chapterNo: data.entry.chapter_number,
          hoursSpent: String(data.entry.hours_spent || ""),
          noOfUnits: Number(data.entry.number_of_units) || 0,
          unitsType: data.entry.unit_type,
          status: data.entry.status,
          dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
          remarks: data.entry.details || "",
          adminAction: data.entry.added_by_admin ? 'added' : (data.entry.edited_by_admin ? 'edited' : 'none'),
          adminActionBy: data.entry.admin_action_by || null,
          adminActionDate: data.entry.admin_action_date || null
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return null;
      }
      console.error("Failed to save entry to database:", error);
      throw error;
    }
    return null;
  }, [checkTokenValidity]);

  const updateTodaysEntryInDB = useCallback(async (id, entry) => {
    if (!checkTokenValidity()) return null;

    try {
      const { data } = await axios.put(`/worklogs/today/${id}`, { entry });
      if (data?.success) {
        return {
          id: data.entry.id,
          workMode: data.entry.work_mode,
          projectId: data.entry.project_name,
          projectName: data.entry.project_name,
          task: data.entry.task_name,
          bookElement: data.entry.book_element,
          chapterNo: data.entry.chapter_number,
          hoursSpent: String(data.entry.hours_spent || ""),
          noOfUnits: Number(data.entry.number_of_units) || 0,
          unitsType: data.entry.unit_type,
          status: data.entry.status,
          dueOn: data.entry.due_on ? new Date(data.entry.due_on).toISOString().slice(0, 10) : "",
          remarks: data.entry.details || "",
          adminAction: data.entry.added_by_admin ? 'added' : (data.entry.edited_by_admin ? 'edited' : 'none'),
          adminActionBy: data.entry.admin_action_by || null,
          adminActionDate: data.entry.admin_action_date || null
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return null;
      }
      console.error("Failed to update entry in database:", error);
      throw error;
    }
    return null;
  }, [checkTokenValidity]);

  const deleteTodaysEntryFromDB = useCallback(async (id) => {
    if (!checkTokenValidity()) return false;

    try {
      const { data } = await axios.delete(`/worklogs/today/${id}`);
      return data?.success || false;
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return false;
      }
      console.error("Failed to delete entry from database:", error);
      throw error;
    }
  }, [checkTokenValidity]);

  const fetchPastWorklogs = useCallback(async () => {
    if (!checkTokenValidity()) return;

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
          adminAction: r.added_by_admin ? 'added' : (r.edited_by_admin ? 'edited' : 'none'),
          adminActionBy: r.admin_action_by || null,
          adminActionDate: r.admin_action_date || null
        }));
        setPastRows(mapped);

        // Extract recent projects for autocomplete
        const projectMap = new Map();
        mapped.forEach(row => {
          if (row.projectId || row.projectName) {
            const key = row.projectId || row.projectName;
            if (!projectMap.has(key)) {
              projectMap.set(key, {
                id: row.projectId || row.projectName,
                name: row.projectName || row.projectId,
                dueOn: row.dueOn || null
              });
            }
          }
        });
        const normalizeProjectKey = (value) =>
          (value || "")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "");

        const recentCandidates = Array.from(projectMap.values()).slice(0, 20);
        const resolvedRecentProjects = await Promise.all(
          recentCandidates.map(async (p) => {
            const keyId = normalizeProjectKey(p.id);
            const keyName = normalizeProjectKey(p.name);
            const searchTerm = (p.name || p.id || "").trim();
            if (!searchTerm) return null;

            try {
              const { data: projectData } = await axios.get("/projects", {
                params: { q: searchTerm, by: "id" },
              });
              const projectList = Array.isArray(projectData?.projects) ? projectData.projects : [];
              const matched = projectList.find((vp) => {
                const projectIdKey = normalizeProjectKey(vp.project_id);
                return projectIdKey === keyName || projectIdKey === keyId;
              });

              if (!matched) return null;
              return {
                ...p,
                id: (matched.project_id || p.id || "").trim(),
                name: (matched.project_name || p.name || "").trim(),
              };
            } catch (error) {
              return null;
            }
          })
        );

        const dedupedRecentProjects = Array.from(
          new Map(
            resolvedRecentProjects
              .filter(Boolean)
              .map((project) => [normalizeProjectKey(project.id), project])
          ).values()
        );

        setRecentProjects(dedupedRecentProjects.slice(0, 10));

        if (mapped.length === 0) setPastError("No recent worklogs found.");
      } else {
        setPastRows([]);
        setRecentProjects([]);
        setPastError("No recent worklogs found.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      setPastError(`Failed to load recent worklogs: ${err?.response?.data?.message || err.message}`);
      setPastRows([]);
      setRecentProjects([]);
    } finally {
      setLoadingPast(false);
    }
  }, [checkTokenValidity]);

  /* AUTO-SUBMIT HELPERS */
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
    if (!checkTokenValidity()) return;

    try {
      const { data } = await axios.get("/worklogs/today");
      let entriesToSubmit = [];

      if (data?.success && data.entries && data.entries.length > 0) {
        entriesToSubmit = data.entries.map((r) => ({
          workMode: r.work_mode,
          projectId: r.project_name,
          projectName: r.project_name,
          task: r.task_name,
          bookElement: r.book_element,
          chapterNo: String(r.chapter_number || ""),
          hoursSpent: Number(r.hours_spent) || 0,
          noOfUnits: Number(r.number_of_units) || 0,
          unitsType: r.unit_type,
          status: r.status,
          dueOn: r.due_on ? new Date(r.due_on).toISOString().slice(0, 10) : null,
          remarks: r.details || null,
        }));
      }

      const payload = { entries: entriesToSubmit };
      const response = await axios.post("/worklogs", payload);

      if (response.data.success) {
        setTodayRows([]);
        if (entriesToSubmit.length > 0) {
          setSubmitMsg(`Auto-submitted ${response.data.inserted} entry(s) at ${AUTO_SUBMIT_TIME}!`);
        } else {
          setSubmitMsg(`Auto-submitted default "Leave" entry at ${AUTO_SUBMIT_TIME}!`);
        }
        await fetchPastWorklogs();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      setSubmitMsg(`Auto-submit failed: ${error?.response?.data?.message || error.message}`);
    }
  }, [checkTokenValidity, fetchPastWorklogs]);

  const checkAutoSubmit = useCallback(() => {
    const now = new Date();
    const [targetHours, targetMinutes] = AUTO_SUBMIT_TIME.split(":").map((n) => parseInt(n, 10));
    const targetTime = new Date(now);
    targetTime.setHours(targetHours, targetMinutes, 0, 0);
    const timeDiff = Math.abs(now - targetTime);
    const isWithinWindow = timeDiff <= 60000;

    if (isWithinWindow) {
      const today = now.toDateString();
      const lastSubmitDate = localStorage.getItem(AUTO_SUBMIT_KEY);
      if (lastSubmitDate !== today) {
        localStorage.setItem(AUTO_SUBMIT_KEY, today);
        performAutoSubmit();
      }
    }
  }, [performAutoSubmit]);

  /* EFFECTS */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await axios.get(`${API_BASE}/spoc/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch SPOC notification count:", error);
    }
  }, []);

  const fetchSpocCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const missingRes = await fetch(`${API_BASE}/spoc/request/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

      if (missingRes.ok) {
        const missingData = await missingRes.json();
        setApproveMissingCount(Number(missingData?.count || 0));
      } else {
        setApproveMissingCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch SPOC sidebar counts:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
      return;
    }

    if (!checkTokenValidity()) {
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const u = {
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        team: decoded.team,
        sub_team: decoded.sub_team,
        picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
      };
      setUser(u);
      axios.defaults.baseURL = API_BASE;
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchPastWorklogs();
      fetchTeamWiseDropdowns();
      fetchUnreadCount();
      fetchSpocCounts();
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate, fetchPastWorklogs, checkTokenValidity, fetchTeamWiseDropdowns, fetchUnreadCount, fetchSpocCounts]);

  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => {
      fetchUnreadCount();
      fetchSpocCounts();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [user, fetchUnreadCount, fetchSpocCounts]);

  useEffect(() => {
    if (user) {
      loadTodaysWorklogFromDB();
    }
  }, [user, loadTodaysWorklogFromDB]);

  useEffect(() => {
    const updateCacheInfoLocal = () => {
      setCacheInfo({
        count: todayRows.length,
        expiresAt: Date.now() + CACHE_DURATION,
        timeLeft: todayRows.length > 0 ? "Stored in DB" : "",
      });
    };

    const cacheInterval = setInterval(updateCacheInfoLocal, 60_000);
    // const autoSubmitInterval = setInterval(() => {
    //   updateAutoSubmitCountdown();           to stop auto submit
    //   checkAutoSubmit();
    // }, 1_000);
    const tokenCheckInterval = setInterval(checkTokenValidity, 30_000);

    updateCacheInfoLocal();
    // updateAutoSubmitCountdown();  to stop auto submit

    return () => {
      clearInterval(cacheInterval);
      // clearInterval(autoSubmitInterval);  to stop auto submit
      clearInterval(tokenCheckInterval);
    };
  }, [todayRows.length, checkAutoSubmit, updateAutoSubmitCountdown, checkTokenValidity]);

  /* FORM LOGIC */
  const showFullBook = useMemo(() => [].includes(task), [task]);
  const bookElements = useMemo(() => (showFullBook ? ["Full book", ...BASE_BOOK_ELEMENTS] : BASE_BOOK_ELEMENTS), [showFullBook, BASE_BOOK_ELEMENTS]);
  const chapterNumbers = useMemo(
    () => (showFullBook ? BASE_CHAPTER_NUMBERS : BASE_CHAPTER_NUMBERS.filter((v) => v !== "Full Book")),
    [showFullBook, BASE_CHAPTER_NUMBERS]
  );

  const totalHours = useMemo(() => {
    return todayRows.reduce((sum, row) => {
      const hours = parseFloat(row.hoursSpent) || 0;
      return sum + hours;
    }, 0);
  }, [todayRows]);

  const showInOfficeWarning = useMemo(() => {
    const hasInOffice = todayRows.some(row => row.workMode === "In Office");
    return hasInOffice && totalHours < 5;
  }, [todayRows, totalHours]);

  const isDuplicateEntry = useCallback((newEntry, existingRows, excludeIndex = -1) => {
    return existingRows.some((row, index) => {
      if (index === excludeIndex) return false;

      return (
        row.workMode === newEntry.workMode &&
        (row.projectId === newEntry.projectId || row.projectName === newEntry.projectName) &&
        row.task === newEntry.task &&
        row.bookElement === newEntry.bookElement &&
        row.chapterNo === newEntry.chapterNo &&
        String(row.hoursSpent) === String(newEntry.hoursSpent) &&
        String(row.noOfUnits) === String(newEntry.noOfUnits) &&
        row.unitsType === newEntry.unitsType &&
        row.status === newEntry.status &&
        row.dueOn === newEntry.dueOn &&
        row.remarks === newEntry.remarks
      );
    });
  }, []);

  useEffect(() => {
    let active = true;
    const q = projectQuery.trim();

    if (!q) {
      if (recentProjects.length > 0) {
        setSuggestions(recentProjects);
        setShowSuggest(false);
      } else {
        setSuggestions([]);
        setShowSuggest(false);
      }
      setSelectedSuggestionIndex(-1);
      return;
    }

    if (projectId && projectId === q) {
      setShowSuggest(false);
      return;
    }

    if (!checkTokenValidity()) return;

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
        setSelectedSuggestionIndex(-1);
      } catch (err) {
        if (err.response?.status === 401) {
          checkTokenValidity();
          return;
        }
        setSuggestions([]);
        setShowSuggest(false);
        setSelectedSuggestionIndex(-1);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(t);
      setLoadingSuggestions(false);
    };
  }, [projectQuery, searchBy, checkTokenValidity, recentProjects, projectId]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!suggestRef.current) return;
      if (!suggestRef.current.contains(e.target)) {
        setShowSuggest(false);
        setSelectedSuggestionIndex(-1);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectProject = (p) => {
    setProjectId(p.id);
    setProjectName(p.name);
    setProjectQuery(p.id);
    if (p.dueOn) {
      setDueOn(p.dueOn);
    }
    setShowSuggest(false);
    setSelectedSuggestionIndex(-1);
  };

  const isEmpty = (v) => Array.isArray(v) ? v.length === 0 : (v === null || v === undefined || String(v).trim() === "");

  const projectValid =
    (!!projectId && String(projectId).trim() !== "") ||
    (!!projectName && String(projectName).trim() !== "") ||
    (!!projectQuery.trim() && suggestions.some(s => s.id === projectQuery.trim()));

  const required = { workMode, projectId: projectValid ? "ok" : "", task, bookElement, chapterNumber, hoursSpent, status, unitsCount, unitsType };

  const invalid = Object.fromEntries(
    Object.entries(required).map(([k, v]) => [k, isEmpty(v)])
  );

  const canSubmitRow = Object.values(required).every((v) => !isEmpty(v)) && !combinationBlocked;

  const clearForm = () => {
    setWorkMode("");
    setProjectQuery("");
    setProjectId("");
    setProjectName("");
    setTask("");
    setBookElement("");
    setChapterNumber([]);
    setHoursSpent("");
    setHoursValue("0");  
    setMinutesValue("0");
    setStatus("");
    setUnitsCount("");
    setUnitsType("");
    setDueOn("");
    setRemarks("");
    setSubmitMsg(null);
    setDuplicateMsg(null);
    setEditSourceIndex(-1);
    setUnitTypeDisabled(false);
    setCombinationBlocked(false);
    setBlockedMessage("");
    setSkipUnitTypeLookup(false);
    setIsSubmitting(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!canSubmitRow || !projectValid) return;

    if (combinationBlocked) {
      setDuplicateMsg(null);
      setSubmitMsg(blockedMessage);
      return;
    }

    const newEntry = {
      workMode,
      projectId: projectId || projectQuery.trim(),
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

    if (isDuplicateEntry(newEntry, todayRows, editSourceIndex)) {
      setDuplicateMsg("This entry already exists in today's worklog. Please modify the entry or remove the duplicate.");
      setSubmitMsg(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editSourceIndex !== -1) {
        const currentRow = todayRows[editSourceIndex];
        if (currentRow.id) {
          const updatedEntry = await updateTodaysEntryInDB(currentRow.id, newEntry);
          if (updatedEntry) {
            setTodayRows((prev) => prev.map((r, i) => (i === editSourceIndex ? updatedEntry : r)));
          }
        }
      } else {
        const savedEntry = await saveTodaysEntryToDB(newEntry);
        if (savedEntry) {
          setTodayRows((prev) => [...prev, savedEntry]);
        }
      }
      setDuplicateMsg(null);
      clearForm();
    } catch (error) {
      setDuplicateMsg(null);
      setSubmitMsg(`Failed to save entry: ${error?.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRowToForm = (row) => {
    setSkipUnitTypeLookup(true);

    setWorkMode(row.workMode || "");
    setProjectId(row.projectId || "");
    setProjectQuery(row.projectId || row.projectName || "");
    setProjectName(row.projectName || "");
    setTask(row.task || "");
    setBookElement(row.bookElement || "");
    setUnitsType(row.unitsType || "");
    setChapterNumber(
      typeof row.chapterNo === "string"
        ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
        : Array.isArray(row.chapterNo)
          ? row.chapterNo
          : []
    );
    setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
const totalHours = parseFloat(row.hoursSpent || 0);
const hours = Math.floor(totalHours);
const minutes = Math.round((totalHours - hours) * 60);
const roundedMinutes = Math.round(minutes / 5) * 5; // Round to nearest 5
setHoursValue(String(hours));
setMinutesValue(String(roundedMinutes));
    setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
    setStatus(row.status || "");
    setDueOn(row.dueOn || "");
    setRemarks(row.remarks || "");
    setEditSourceIndex(-1);
    setUnitTypeDisabled(false);
    setCombinationBlocked(false);
    setBlockedMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditViaForm = (idx, row) => {
    setSkipUnitTypeLookup(true);

    setWorkMode(row.workMode || "");
    setProjectId(row.projectId || "");
    setProjectQuery(row.projectId || row.projectName || "");
    setProjectName(row.projectName || "");
    setTask(row.task || "");
    setBookElement(row.bookElement || "");
    setUnitsType(row.unitsType || "");
    setChapterNumber(
      typeof row.chapterNo === "string"
        ? row.chapterNo.split(",").map((c) => c.trim()).filter(Boolean)
        : Array.isArray(row.chapterNo)
          ? row.chapterNo
          : []
    );
    setHoursSpent(row.hoursSpent !== undefined && row.hoursSpent !== null ? String(row.hoursSpent) : "");
const totalHours = parseFloat(row.hoursSpent || 0);
const hours = Math.floor(totalHours);
const minutes = Math.round((totalHours - hours) * 60);
const roundedMinutes = Math.round(minutes / 5) * 5; // Round to nearest 5
setHoursValue(String(hours));
setMinutesValue(String(roundedMinutes));
    setUnitsCount(row.noOfUnits !== undefined && row.noOfUnits !== null ? String(row.noOfUnits) : "");
    setStatus(row.status || "");
    setDueOn(row.dueOn || "");
    setRemarks(row.remarks || "");
    setEditSourceIndex(idx);
    setUnitTypeDisabled(false);
    setCombinationBlocked(false);
    setBlockedMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRowAt = async (idx) => {
    const row = todayRows[idx];

    try {
      if (row.id) {
        const success = await deleteTodaysEntryFromDB(row.id);
        if (success) {
          setTodayRows((prev) => prev.filter((_, i) => i !== idx));
          if (editSourceIndex === idx) setEditSourceIndex(-1);
        } else {
          setSubmitMsg("Failed to delete entry from database");
        }
      }
    } catch (error) {
      setSubmitMsg(`Failed to delete entry: ${error?.response?.data?.message || error.message}`);
    }
  };

  async function submitTodaysWorklog() {
    if (todayRows.length === 0) return;

    if (!checkTokenValidity()) return;

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
      await fetchPastWorklogs();
    } catch (error) {
      if (error.response?.status === 401) {
        checkTokenValidity();
        return;
      }
      setSubmitMsg(`Submit failed: ${error?.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem(AUTO_SUBMIT_KEY);
    localStorage.removeItem(CACHE_KEY);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    delete axios.defaults.headers.common.Authorization;
    navigate("/");
  };

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

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
              >
                <span className="sr-only">Toggle sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                  <span className="block sm:inline">SPOC Dashboard</span>
                  <span className="hidden sm:inline"> - Work Log</span>
                </h1>
              </div>
            </div>

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

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
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

      <div className="pt-16 flex">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
              <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
            </aside>
          </div>
        )}

        <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
          <SidebarLinks navigate={navigate} location={location} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
        </aside>

        <main className="flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto">
          <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  {editSourceIndex !== -1 ? "Edit Entry" : "New Entry"}
                </h2>
                <div className="text-right">
                  <span className="text-xs text-red-600">* required fields</span>
                  {cacheInfo.count > 0 && (
                    <div className="text-xs text-blue-600 mt-1 md:hidden">
                      {cacheInfo.count} entries stored in database
                    </div>
                  )}
                </div>
              </div>

              {duplicateMsg && (
                <div className="mb-4 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900 flex items-start shadow-md">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold mb-1">Duplicate Entry Detected</div>
                    <div>{duplicateMsg}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDuplicateMsg(null)}
                    className="ml-auto text-red-900 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              {combinationBlocked && (
                <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900 flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{blockedMessage}</span>
                </div>
              )}

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
                        ref={inputRef}
                        type="text"
                        placeholder="Start typing project name or ID…"
                        className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${invalid.projectId ? "border-red-500" : "border-slate-300"} focus:border-indigo-600`}
                        value={projectQuery}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setProjectQuery(newValue);
                          if (newValue !== projectId) {
                            setProjectId("");
                            setProjectName("");
                            if (projectId && !newValue.trim()) {
                              setDueOn("");
                            }
                          }
                          if (!newValue.trim()) setDueOn("");
                        }}
                        onFocus={() => {
                          if (!projectQuery.trim() && !projectId && recentProjects.length > 0) {
                            setSuggestions(recentProjects);
                            setShowSuggest(true);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowSuggest(false);
                            setSelectedSuggestionIndex(-1);
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (!showSuggest || suggestions.length === 0) return;

                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setSelectedSuggestionIndex((prev) =>
                              prev < suggestions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setSelectedSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
                            e.preventDefault();
                            selectProject(suggestions[selectedSuggestionIndex]);
                          } else if (e.key === "Escape") {
                            setShowSuggest(false);
                            setSelectedSuggestionIndex(-1);
                          }
                        }}
                      />
                      {loadingSuggestions && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {showSuggest && suggestions.length > 0 && (
                        <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border bg-white shadow-2xl">
                          {!projectQuery.trim() && (
                            <li className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b">
                              Recently Used Projects
                            </li>
                          )}
                          {suggestions.map((s, index) => (
                            <li
                              key={`${s.id}-${index}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectProject(s);
                              }}
                              onMouseEnter={() => setSelectedSuggestionIndex(index)}
                              className={`px-4 py-3 text-sm cursor-pointer border-b border-slate-100 last:border-b-0 ${index === selectedSuggestionIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50'
                                }`}
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
                    onChange={(newTask) => {
                      setTask(newTask);
                      if (skipUnitTypeLookup) {
                        setSkipUnitTypeLookup(false);
                      }
                    }}
                    options={["", ...TASKS]}
                    labels={{ "": "— Select —" }}
                    isInvalid={invalid.task}
                  />
                </Field>

                <Field label="Element *">
                  <Select
                    value={bookElement}
                    onChange={(newBookElement) => {
                      setBookElement(newBookElement);
                      if (skipUnitTypeLookup) {
                        setSkipUnitTypeLookup(false);
                      }
                    }}
                    options={["", ...bookElements]}
                    labels={{ "": "— Select —" }}
                    isInvalid={invalid.bookElement}
                  />
                </Field>

                <Field label="Sub-Element(Chapter No.) *">
                  <MultiSelectChips
                    value={chapterNumber}
                    onChange={setChapterNumber}
                    options={chapterNumbers}
                    placeholder="Select Sub-Element…"
                    isInvalid={invalid.chapterNumber}
                    bookElement={bookElement}
                  />
                </Field>

                {/* <Field label="Hours Spent *">
                  <Select
                    value={hoursSpent}
                    onChange={setHoursSpent}
                    options={["", ...HOURS]}
                    labels={{ "": "— Select —" }}
                    isInvalid={invalid.hoursSpent}
                  />
                </Field> */}
                  <Field label="Hours Spent *">
  <div className="flex gap-2">
    <div className="flex-1">
      <Select
        value={hoursValue}
        onChange={(val) => {
          setHoursValue(val);
          // Calculate total hours
          const totalHours = parseFloat(val) + (parseFloat(minutesValue) / 60);
          setHoursSpent(totalHours.toFixed(2));
        }}
        options={HOURS}
        labels={HOURS.reduce((acc, h) => {
          acc[h] = h === "0" ? "0 hrs" : `${h} hr${h === "1" ? "" : "s"}`;
          return acc;
        }, {})}
        isInvalid={invalid.hoursSpent}
      />
    </div>
    <div className="flex-1">
      <Select
        value={minutesValue}
        onChange={(val) => {
          setMinutesValue(val);
          // Calculate total hours
          const totalHours = parseFloat(hoursValue) + (parseFloat(val) / 60);
          setHoursSpent(totalHours.toFixed(2));
        }}
        options={MINUTES}
        labels={MINUTES.reduce((acc, m) => {
          acc[m] = m === "0" ? "0 min" : `${m} min`;
          return acc;
        }, {})}
        isInvalid={invalid.hoursSpent}
      />
    </div>
  </div>
  {hoursSpent && (
    <div className="mt-1 text-xs text-slate-600">
      {/* Total: {hoursSpent} hours */}
    </div>
  )}
</Field>

                <Field label="No. of Units *">
                  <div className="flex gap-2 items-start">
                    <input
                      type="number"
                      className={`flex-1 h-9 text-sm px-3 rounded-2xl border-2 ${invalid.unitsCount ? "border-red-500" : "border-slate-300"
                        } focus:border-indigo-600 ${unitsType === "general" ? "bg-slate-100 cursor-not-allowed" : ""}`}
                      placeholder="e.g., 10"
                      value={unitsType === "general" ? "1" : unitsCount}
                      onChange={(e) => {
                        if (unitsType === "general") return;

                        const value = e.target.value;
                        if (value === '' || (parseFloat(value) >= 0)) {
                          setUnitsCount(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (unitsType === "general") {
                          e.preventDefault();
                          return;
                        }

                        if (['-', 'e', 'E', '+'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      disabled={unitsType === "general"}
                    />
                    <div className="w-28 relative">
                      <Select
                        value={unitsType}
                        onChange={setUnitsType}
                        options={UNITS.map((u) => u.value)}
                        labels={UNITS.reduce((m, u) => {
                          m[u.value] = u.label;
                          return m;
                        }, {})}
                        isInvalid={invalid.unitsType}
                        disabled={unitTypeDisabled}
                      />
                      {unitTypeLookupLoading && (
                        <div className="absolute right-2 top-2">
                          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {unitTypeDisabled && !unitTypeLookupLoading && !combinationBlocked && (
                        <div className="mt-1 text-xs text-green-600">Auto-selected</div>
                      )}
                      {unitsType === "general" && (
                        <div className="mt-1 text-xs text-blue-600"></div>
                      )}
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
                    className={`w-full h-9 text-sm px-3 rounded-2xl border-2 ${dueOn && projectId ? "bg-slate-100 cursor-not-allowed border-slate-300" : "border-slate-300 focus:border-indigo-600"
                      }`}
                    value={dueOn}
                    onChange={(e) => {
                      if (!projectId) {
                        setDueOn(e.target.value);
                      }
                    }}
                    disabled={!!(dueOn && projectId)}
                  />
                  {dueOn && (
                    <div className="mt-1 text-xs text-slate-600">
                      Due: {new Date(dueOn).toLocaleDateString()}
                      {projectId && <span className="ml-2 text-blue-600"></span>}
                    </div>
                  )}
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
                  disabled={!canSubmitRow || !projectValid || isSubmitting}
                  className={`w-full sm:w-auto px-5 py-1.5 rounded-2xl text-white transition-colors ${canSubmitRow && projectValid && !isSubmitting
                    ? "bg-indigo-700 hover:bg-indigo-800"
                    : "bg-slate-400 cursor-not-allowed"
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      {editSourceIndex !== -1 ? "Updating..." : "Adding..."}
                    </span>
                  ) : (
                    editSourceIndex !== -1 ? "Update Entry" : "Add to Today's Worklog"
                  )}
                </button>
              </div>
            </form>

            <section className="mt-8 space-y-6">
              {loadingToday ? (
                <Feedback message="Loading today's worklog..." />
              ) : todayRows.length > 0 ? (
                <>
                  <EditableBlock
                    title={`Today's Worklog - Total Hours: ${totalHours.toFixed(1)}`}
                    rows={todayRows}
                    onCopyRow={copyRowToForm}
                    onStartEdit={startEditViaForm}
                    onDeleteRow={deleteRowAt}
                    lists={{ WORK_MODES, TASKS, STATUS, HOURS, UNITS }}
                    getAdminActionBadge={getAdminActionBadge}
                    getAdminActionRowClass={getAdminActionRowClass}
                  />
                  <div className="text-xs text-slate-600 text-center bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2">
                    Your entries are saved in database and will auto-submit at 03:00 AM
                  </div>

                  {showInOfficeWarning && (
                    <div className="rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-semibold mb-1">Hours Check</div>
                        <div>Your total hours are less than 5 hours. Are you sure you were in office? If you were on half day, please select "Half Day" as your work mode instead of "In Office".</div>
                      </div>
                    </div>
                  )}
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
                  getAdminActionBadge={getAdminActionBadge}
                  getAdminActionRowClass={getAdminActionRowClass}
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* Sidebar Links Component for SPOC Dashboard */
function SidebarLinks({
  navigate,
  location,
  close,
  unreadCount = 0,
  approveMissingCount = 0,
}) {
  const handleNavigation = (path) => {
    navigate(path);
    if (close) close();
  };

  const isHomePage = location.pathname === "/spoc-dashboard";
  const isRequestMissingEntryPage = location.pathname.includes("missing-entry-request");
  const isApproveMissingEntryPage = location.pathname.includes("missing-entry-status");
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

// Helper components
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-xs font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, labels, isInvalid, disabled }) {
  const safeOptions = Array.isArray(options) ? options : [];
  const labelFor = (o) =>
    labels && typeof labels === "object" && Object.prototype.hasOwnProperty.call(labels, o) ? labels[o] : o;

  return (
    <select
      className={`w-full h-9 text-sm px-2 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
        } focus:border-indigo-600 ${disabled ? "bg-slate-100 cursor-not-allowed" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {safeOptions.map((o, idx) => (
        <option key={idx} value={o}>
          {labelFor(o)}
        </option>
      ))}
    </select>
  );
}

function MultiSelectChips({ value = [], onChange, options = [], placeholder = "Select one or more…", isInvalid = false, bookElement = "" }) {
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
    let availableOptions = deduped.filter((o) => !value.includes(o));

    if (bookElement === "Full book") {
      availableOptions = availableOptions.filter(o => isNaN(Number(o)));
    }

    return availableOptions.filter((o) => (q ? o.toLowerCase().includes(q) : true));
  }, [deduped, value, query, bookElement]);

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
        className={`min-h-[44px] w-full rounded-2xl border-2 bg-white px-2 py-1 flex flex-wrap items-center gap-2 cursor-text ${isInvalid ? "border-red-500" : "border-slate-300"
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
            } else if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              const exactMatch = filtered.find(opt => opt.toLowerCase() === query.trim().toLowerCase());
              if (exactMatch) {
                addItem(exactMatch);
              }
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
            <div className="px-3 py-2 text-sm text-slate-500">
              {bookElement === "Full book" ? "Only non-numeric chapters allowed for Full book" : "No matches"}
            </div>
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
function DataBlock({ title, rows, subtle = false, hideEdit = false, onStartEdit, getAdminActionBadge, getAdminActionRowClass }) {
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
              <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${getAdminActionRowClass(r)}`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div>
                    {r.date}
                    {getAdminActionBadge(r)}
                  </div>
                </td>
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
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${r.auditStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                    r.auditStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                      r.auditStatus === 'Re-Pending' ? 'bg-yellow-100 text-yellow-800' :
                        r.auditStatus === 'Re-Approved' ? 'bg-green-200 text-green-900' :
                          r.auditStatus === 'Re-Rejected' ? 'bg-red-200 text-red-900' :
                            'bg-gray-100 text-gray-800'
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

function EditableBlock({ title, rows, onStartEdit, onDeleteRow, onCopyRow, lists, getAdminActionBadge, getAdminActionRowClass }) {
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
              <th className="px-3 py-2 font-semibold sticky right-0 bg-slate-100 z-10 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${getAdminActionRowClass(r)}`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div>
                    {r.workMode}
                    {getAdminActionBadge(r)}
                  </div>
                </td>
                <td className="px-3 py-2 min-w-[14rem]">
                  <div>
                    {r.projectId || r.projectName}
                  </div>
                </td>
                <td className="px-3 py-2">{r.task}</td>
                <td className="px-3 py-2">{r.bookElement}</td>
                <td className="px-3 py-2">{r.chapterNo}</td>
                <td className="px-3 py-2">{r.hoursSpent}</td>
                <td className="px-3 py-2">{r.noOfUnits}</td>
                <td className="px-3 py-2">{r.unitsType}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.dueOn}</td>
                <td className="px-3 py-2">{r.remarks}</td>
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

function Feedback({ message }) {
  const isError = message && (message.includes("Error") || message.includes("Failed") || message.includes("failed") || message.includes("not allowed") || message.includes("already exists"));
  const isSuccess = message && (message.includes("Successfully") || message.includes("submitted"));

  let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
  if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
  if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

  return <div className={`rounded-2xl border px-3 py-2 text-xs ${bgColor}`}>{message}</div>;
}
