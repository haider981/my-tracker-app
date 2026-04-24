import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AdminAddProject() {
    const navigate = useNavigate();
    const location = useLocation();

    // User state from Admin dashboard
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openWorklogs, setOpenWorklogs] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);

    // Form state
    const [segment, setSegment] = useState("Select");
    const [classSem, setClassSem] = useState("");
    const [board, setBoard] = useState("");
    const [subject, setSubject] = useState("");
    const [series, setSeries] = useState("");
    const [medium, setMedium] = useState("");
    const [session, setSession] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [msg, setMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic data state
    const [segments, setSegments] = useState([]);
    const [abbreviationsData, setAbbreviationsData] = useState({
        classSem: [],
        board: [],
        subject: [],
        series: [],
        medium: [],
        session: []
    });
    const [loadingAbbreviations, setLoadingAbbreviations] = useState(false);

    const [requests, setRequests] = useState([]);

    // API base URL - Updated for admin routes
    const API_BASE_URL = import.meta.env?.VITE_API_BASE;

    // Authentication logic from Admin dashboard
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            // Simulate user for demo
            const mockUser = {
                name: "Admin User",
                email: "admin@example.com",
                role: "Admin",
                picture: "https://ui-avatars.com/api/?name=Admin+User&background=random&color=fff"
            };
            setUser(mockUser);
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

    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const intervalId = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(intervalId);
    }, [user]);

    // Fetch available segments on component mount
    useEffect(() => {
        fetchSegments();
    }, []);

    // Fetch segments from backend
    const fetchSegments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/spoc/abbreviations/segments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setSegments(result.data);
            } else {
                console.error('Error fetching segments:', result.message);
                setMsg(`Error fetching segments: ${result.message}`);
            }
        } catch (error) {
            console.error('Error fetching segments:', error);
            setMsg('Error connecting to server. Please try again.');
        }
    };

    // Fetch abbreviations data when segment changes
    const fetchAbbreviationsData = async (selectedSegment) => {
        if (!selectedSegment || selectedSegment === "Select") {
            setAbbreviationsData({
                classSem: [],
                board: [],
                subject: [],
                series: [],
                medium: [],
                session: []
            });
            return;
        }

        setLoadingAbbreviations(true);

        try {
            const response = await fetch(`${API_BASE_URL}/spoc/abbreviations/${selectedSegment}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setAbbreviationsData(result.data);
            } else {
                console.error('Error fetching abbreviations:', result.message);
                setMsg(`Error fetching abbreviations: ${result.message}`);
                // Reset to empty data if error
                setAbbreviationsData({
                    classSem: [],
                    board: [],
                    subject: [],
                    series: [],
                    medium: [],
                    session: []
                });
            }
        } catch (error) {
            console.error('Error fetching abbreviations:', error);
            setMsg('Error connecting to server. Please try again.');
            setAbbreviationsData({
                classSem: [],
                board: [],
                subject: [],
                series: [],
                medium: [],
                session: []
            });
        } finally {
            setLoadingAbbreviations(false);
        }
    };

    // Fetch projects from backend - Updated URL for admin route
    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/spoc/projects`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setRequests(result.data);
            } else {
                console.error('Error fetching projects:', result.message);
                setMsg(`Error fetching projects: ${result.message}`);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setMsg('Error connecting to server. Please try again.');
        }
    };

    // Load projects on component mount
    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }
        navigate("/");
    };

    const handleNavigation = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    // Keep sections open if child page active
    useEffect(() => {
        if (location.pathname.includes("worklog")) setOpenWorklogs(true);
        if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
            setOpenProjects(true);
    }, [location]);

    // Generate project name
    const generateProjectName = () => {
        if (!segment || !classSem || !board || !subject || !series || !medium || !session) {
            return "";
        }

        // Find full names from abbreviations data
        const getFullName = (abbreviation, type) => {
            const items = abbreviationsData[type] || [];
            const item = items.find(i => i.abbreviation === abbreviation);
            return item ? item.fullName : abbreviation;
        };

        const fullSubject = getFullName(subject, 'subject');
        const fullSeries = getFullName(series, 'series');

        return `${segment} ${classSem} ${board} ${fullSubject} ${fullSeries} ${medium} ${session}`;
    };

    const onSegmentChange = (v) => {
        setSegment(v);
        // Reset all dependent fields
        setClassSem("");
        setBoard("");
        setSubject("");
        setSeries("");
        setMedium("");
        setSession("");

        // Fetch new abbreviations data for selected segment
        fetchAbbreviationsData(v);
    };

    const canSubmit = segment && segment !== "Select" && classSem && board && subject && series && medium && session && dueDate;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsLoading(true);
        setMsg(null);

        const projectId = [segment, classSem, board, subject, series, medium, session].join("_");
        const projectName = generateProjectName();

        const payload = {
            project_id: projectId,
            project_name: projectName,
            due_date: dueDate,
            status: "Approved" // Admin projects are always approved by default
        };

        try {
            // Updated to match admin backend route structure
            const response = await fetch(`${API_BASE_URL}/spoc/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setMsg(`Project created successfully!\nProject ID: ${projectId}\nProject Name: ${projectName}\nStatus: In Review`);

                // Refresh the projects list
                await fetchProjects();

                // Reset form
                setSegment("Select");
                setClassSem("");
                setBoard("");
                setSubject("");
                setSeries("");
                setMedium("");
                setSession("");
                setDueDate("");

                // Reset abbreviations data
                setAbbreviationsData({
                    classSem: [],
                    board: [],
                    subject: [],
                    series: [],
                    medium: [],
                    session: []
                });
            } else {
                setMsg(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            setMsg('Error connecting to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
            {/* Fixed Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
                <div className="max-w-full mx-auto px-4 sm:px-6">
                    {/* Main navbar content */}
                    <div className="flex items-center justify-between h-16">
                        {/* Left side - Logo/Title and Sidebar Toggle */}
                        <div className="flex items-center">
                            {/* Sidebar toggle button for mobile/tablet only */}
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
                                    <span className="hidden sm:inline"> - Add Project</span>
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
                                            handleLogout()
                                            setMobileMenuOpen(false)
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

            {/* Layout Container */}
            <div className="pt-16 flex">
                {/* Mobile Sidebar Overlay and Sidebar */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
                        {/* Mobile Sidebar */}
                        <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
                            <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} unreadCount={unreadCount} />
                        </aside>
                    </div>
                )}

                {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
                <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
                    <SidebarLinks navigate={navigate} location={location} unreadCount={unreadCount} />
                </aside>

                {/* Main content with proper margin for sidebar */}
                <main className={`flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto`}>
                    {/* Content */}
                    <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
                        {/* Add Project Form */}
                        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
                                <div className="text-right">
                                    <span className="text-xs text-red-600">* required fields</span>
                                </div>
                            </div>

                            {/* Loading indicator for abbreviations */}
                            {loadingAbbreviations && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                        <span className="text-sm text-blue-800">Loading options for {segment}...</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Field label="Segment *">
                                    <Select
                                        value={segment}
                                        onChange={onSegmentChange}
                                        options={segments}
                                        isInvalid={!segment || segment === "Select"}
                                    />
                                </Field>

                                <Field label="Class/Semester *">
                                    <SearchableDropdown
                                        value={classSem}
                                        onChange={setClassSem}
                                        options={abbreviationsData.classSem.map(item => item.abbreviation)}
                                        placeholder="Search class/semester..."
                                        isInvalid={!classSem}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Board *">
                                    <SearchableDropdown
                                        value={board}
                                        onChange={setBoard}
                                        options={abbreviationsData.board.map(item => item.abbreviation)}
                                        placeholder="Search board..."
                                        isInvalid={!board}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Subject *">
                                    <EnhancedSearchableDropdown
                                        value={subject}
                                        onChange={setSubject}
                                        data={abbreviationsData.subject}
                                        placeholder="Search subject..."
                                        isInvalid={!subject}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Series/Author *">
                                    <EnhancedSearchableDropdown
                                        value={series}
                                        onChange={setSeries}
                                        data={abbreviationsData.series}
                                        placeholder="Search series/author..."
                                        isInvalid={!series}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Medium *">
                                    <SearchableDropdown
                                        value={medium}
                                        onChange={setMedium}
                                        options={abbreviationsData.medium.map(item => item.abbreviation)}
                                        placeholder="Search medium..."
                                        isInvalid={!medium}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Session *">
                                    <SearchableDropdown
                                        value={session}
                                        onChange={setSession}
                                        options={abbreviationsData.session.map(item => item.abbreviation)}
                                        placeholder="Search session..."
                                        isInvalid={!session}
                                        disabled={!segment || segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Due Date *">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className={`w-full h-12 rounded-2xl border ${!dueDate ? "border-red-500" : "border-slate-300"
                                            } px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                </Field>
                            </div>

                            {/* Generated Project ID and Name Preview */}
                            {segment && segment !== "Select" && classSem && board && subject && series && medium && session && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                                    <h3 className="text-sm font-medium text-green-900 mb-2">Generated Project Details:</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs font-medium text-green-700">Project ID:</span>
                                            <p className="text-sm text-green-800 font-mono bg-white px-3 py-2 rounded-lg border">
                                                {[segment, classSem, board, subject, series, medium, session].join("_")}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-green-700">Project Name:</span>
                                            <p className="text-sm text-green-800 bg-white px-3 py-2 rounded-lg border">
                                                {generateProjectName()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSegment("Select");
                                        setClassSem("");
                                        setBoard("");
                                        setSubject("");
                                        setSeries("");
                                        setMedium("");
                                        setSession("");
                                        setDueDate("");
                                        setMsg(null);
                                        setAbbreviationsData({
                                            classSem: [],
                                            board: [],
                                            subject: [],
                                            series: [],
                                            medium: [],
                                            session: []
                                        });
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
                                >
                                    Clear Form
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isLoading}
                                    className={`w-full sm:w-auto px-6 py-2 rounded-2xl text-white transition-colors ${canSubmit && !isLoading
                                        ? "bg-green-700 hover:bg-green-800"
                                        : "bg-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    {isLoading ? "Creating Project..." : "Create Project"}
                                </button>
                            </div>
                        </form>

                        {/* Success/Error Message */}
                        {msg && <Feedback message={msg} />}

                        {/* Recent Projects Table */}
                        <section className="mt-8">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                                <div className="px-6 py-4 border-b border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-800">Recent Created Projects</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-900">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Project ID</th>
                                                <th className="px-6 py-3 font-semibold">Project Name</th>
                                                <th className="px-6 py-3 font-semibold">Start Date</th>
                                                <th className="px-6 py-3 font-semibold">Due Date</th>
                                                <th className="px-6 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                        No projects found
                                                    </td>
                                                </tr>
                                            ) : (
                                                requests.map((request, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                        <td className="px-6 py-4 font-mono text-xs">{request.projectId}</td>
                                                        <td className="px-6 py-4 text-xs">{request.projectName}</td>
                                                        <td className="px-6 py-4">{new Date(request.startDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">{new Date(request.dueDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                                request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {request.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

/* Sidebar Links Component for SPOC Dashboard */
function SidebarLinks({ navigate, location, close, unreadCount = 0 }) {
  const [openMissingEntry, setOpenMissingEntry] = useState(false);

  // Keep sections open if child page active
  useEffect(() => {
    if (location.pathname.includes("missing-entry")) {
      setOpenMissingEntry(true);
    }
  }, [location]);

  const handleNavigation = (path, isChildOfMissingEntry = false) => {
    navigate(path);
    
    // Only close the dropdown if navigating away from missing entry section
    if (!isChildOfMissingEntry && !path.includes("missing-entry")) {
      setOpenMissingEntry(false);
    }
    
    if (close) close();
  };

  const toggleMissingEntry = () => {
    setOpenMissingEntry(!openMissingEntry);
  };

  // Check if we're on home page and NOT on any missing entry page
  const isHomePage = location.pathname === "/spoc-dashboard";
  const isMissingEntryPage = location.pathname.includes("missing-entry");
  const isNotificationsPage = location.pathname.includes("/spoc/notifications");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">
        {/* Home */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            isHomePage && !isMissingEntryPage ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc-dashboard")}
        >
          Home
        </button>

        {/* Approve Worklogs */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc/approve-worklogs")}
        >
          Approve Worklogs
        </button>

        {/* Missing Entry - COLLAPSIBLE SECTION */}
        <div>
          <button
            className={`w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors ${
              isMissingEntryPage && !location.pathname.includes("missing-entry-request") && !location.pathname.includes("missing-entry-status")
                ? "bg-gray-700"
                : ""
            }`}
            onClick={toggleMissingEntry}
          >
            <span>Missing Entry</span>
            <span className="transition-transform duration-200">
              {openMissingEntry ? "▾" : "▸"}
            </span>
          </button>
          {openMissingEntry && (
            <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("missing-entry-request") ? "bg-gray-700" : ""
                }`}
                onClick={() => handleNavigation("/spoc/missing-entry-request", true)}
              >
                Request Missing Entry
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("missing-entry-status") ? "bg-gray-700" : ""
                }`}
                onClick={() => handleNavigation("/spoc/missing-entry-status", true)}
              >
                Approve Missing Entry
              </button>
            </div>
          )}
        </div>
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc/add-project")}
        >
          Add Project
        </button>

        {/* Mark Extra Shift */}
        <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("mark-night-shift") || location.pathname.includes("mark-extra-shift")
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

/* ---- Sub Components ---- */
function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block mb-2 text-sm font-medium text-slate-800">{label}</span>
            {children}
        </label>
    );
}

function Select({ value, onChange, options = [], labels = {}, isInvalid }) {
    const labelFor = (o) =>
        labels && typeof labels === "object" && labels[o] ? labels[o] : o;
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-12 text-sm px-3 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
                } focus:border-indigo-600 focus:outline-none`}
        >
            <option value="">— Select —</option>
            {options.map((o) => (
                <option key={o} value={o}>
                    {labelFor(o)}
                </option>
            ))}
        </select>
    );
}

function SearchableDropdown({ value, onChange, options = [], placeholder, isInvalid, disabled = false }) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Filter options based on query
    const filtered = useMemo(
        () =>
            options.filter((o) =>
                o.toLowerCase().includes(query.toLowerCase())
            ),
        [query, options]
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest(".search-select-container")) return;
            setIsOpen(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="relative search-select-container">
            <input
                type="text"
                value={query || value || ""}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (!e.target.value) onChange("");
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={disabled ? "Select segment first" : placeholder}
                disabled={disabled}
                className={`w-full h-12 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
                    } px-3 focus:border-indigo-600 focus:outline-none ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            />
            {isOpen && (query || !value) && !disabled && (
                <ul className="absolute z-20 bg-white border-2 border-slate-300 rounded-2xl mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
                    {filtered.length > 0 ? (
                        filtered.map((o) => (
                            <li
                                key={o}
                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                onClick={() => {
                                    onChange(o);
                                    setQuery("");
                                    setIsOpen(false);
                                }}
                            >
                                {o}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-slate-500">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
}

function EnhancedSearchableDropdown({ value, onChange, data = [], placeholder, isInvalid, disabled = false }) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Filter data based on query - search both abbreviation and full name
    const filtered = useMemo(() => {
        if (!query) return data;

        return data.filter((item) => {
            return item.abbreviation.toLowerCase().includes(query.toLowerCase()) ||
                item.fullName.toLowerCase().includes(query.toLowerCase());
        });
    }, [query, data]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest(".enhanced-search-select-container")) return;
            setIsOpen(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="relative enhanced-search-select-container">
            <input
                type="text"
                value={query || value || ""}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (!e.target.value) onChange("");
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={disabled ? "Select segment first" : placeholder}
                disabled={disabled}
                className={`w-full h-12 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
                    } px-3 focus:border-indigo-600 focus:outline-none ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            />
            {isOpen && (query || !value) && !disabled && (
                <ul className="absolute z-20 bg-white border-2 border-slate-300 rounded-2xl mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
                    {filtered.length > 0 ? (
                        filtered.map((item) => (
                            <li
                                key={item.abbreviation}
                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                onClick={() => {
                                    onChange(item.abbreviation);
                                    setQuery("");
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">[{item.abbreviation}]</span>
                                    <span className="text-xs text-slate-600">{item.fullName}</span>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-slate-500">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
}

function Feedback({ message }) {
    const isError = message && (message.includes("Error") || message.includes("Failed"));
    const isSuccess = message && (message.includes("submitted") || message.includes("✔"));

    let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
    if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
    if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

    return (
        <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap ${bgColor}`}>
            {message}
        </div>
    );
}
