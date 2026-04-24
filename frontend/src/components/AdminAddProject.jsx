// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// export default function AdminAddProject() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     // User state from Admin dashboard
//     const [user, setUser] = useState(null);
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [openWorklogs, setOpenWorklogs] = useState(false);
//     const [openProjects, setOpenProjects] = useState(false);

//     // Form state
//     const [segment, setSegment] = useState("Select");
//     const [classSem, setClassSem] = useState("");
//     const [board, setBoard] = useState("");
//     const [subject, setSubject] = useState("");
//     const [series, setSeries] = useState("");
//     const [medium, setMedium] = useState("");
//     const [session, setSession] = useState("");
//     const [startDate, setStartDate] = useState("");
//     const [dueDate, setDueDate] = useState("");
//     const [msg, setMsg] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);

//     // Dynamic data state
//     const [segments, setSegments] = useState([]);
//     const [abbreviationsData, setAbbreviationsData] = useState({
//         classSem: [],
//         board: [],
//         subject: [],
//         series: [],
//         medium: [],
//         session: []
//     });
//     const [loadingAbbreviations, setLoadingAbbreviations] = useState(false);

//     const [requests, setRequests] = useState([]);

//     // API base URL - Updated for admin routes
//     const API_BASE_URL = import.meta.env?.VITE_API_BASE;

//     // Authentication logic from Admin dashboard
//     useEffect(() => {
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//             // Simulate user for demo
//             const mockUser = {
//                 name: "Admin User",
//                 email: "admin@example.com",
//                 role: "Admin",
//                 picture: "https://ui-avatars.com/api/?name=Admin+User&background=random&color=fff"
//             };
//             setUser(mockUser);
//             return;
//         }

//         try {
//             const decoded = jwtDecode(token);
//             const u = {
//                 name: decoded.name,
//                 email: decoded.email,
//                 role: decoded.role,
//                 picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name)}&background=random&color=fff`,
//             };
//             setUser(u);
//         } catch (e) {
//             console.error("Invalid token:", e);
//             localStorage.removeItem("authToken");
//             navigate("/");
//         }
//     }, [navigate]);

//     // Fetch available segments on component mount
//     useEffect(() => {
//         fetchSegments();
//     }, []);

//     // Fetch segments from backend
//     const fetchSegments = async () => {
//         try {
//             const response = await fetch(`${API_BASE_URL}/admin/abbreviations/segments`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
//                 }
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//                 setSegments(result.data);
//             } else {
//                 console.error('Error fetching segments:', result.message);
//                 setMsg(`Error fetching segments: ${result.message}`);
//             }
//         } catch (error) {
//             console.error('Error fetching segments:', error);
//             setMsg('Error connecting to server. Please try again.');
//         }
//     };

//     // Fetch abbreviations data when segment changes
//     const fetchAbbreviationsData = async (selectedSegment) => {
//         if (!selectedSegment || selectedSegment === "Select") {
//             setAbbreviationsData({
//                 classSem: [],
//                 board: [],
//                 subject: [],
//                 series: [],
//                 medium: [],
//                 session: []
//             });
//             return;
//         }

//         setLoadingAbbreviations(true);
        
//         try {
//             const response = await fetch(`${API_BASE_URL}/admin/abbreviations/${selectedSegment}`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
//                 }
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//                 setAbbreviationsData(result.data);
//             } else {
//                 console.error('Error fetching abbreviations:', result.message);
//                 setMsg(`Error fetching abbreviations: ${result.message}`);
//                 // Reset to empty data if error
//                 setAbbreviationsData({
//                     classSem: [],
//                     board: [],
//                     subject: [],
//                     series: [],
//                     medium: [],
//                     session: []
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching abbreviations:', error);
//             setMsg('Error connecting to server. Please try again.');
//             setAbbreviationsData({
//                 classSem: [],
//                 board: [],
//                 subject: [],
//                 series: [],
//                 medium: [],
//                 session: []
//             });
//         } finally {
//             setLoadingAbbreviations(false);
//         }
//     };

//     // Fetch projects from backend - Updated URL for admin route
//     const fetchProjects = async () => {
//         try {
//             const response = await fetch(`${API_BASE_URL}/admin/projects`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
//                 }
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//                 setRequests(result.data);
//             } else {
//                 console.error('Error fetching projects:', result.message);
//                 setMsg(`Error fetching projects: ${result.message}`);
//             }
//         } catch (error) {
//             console.error('Error fetching projects:', error);
//             setMsg('Error connecting to server. Please try again.');
//         }
//     };

//     // Load projects on component mount
//     useEffect(() => {
//         if (user) {
//             fetchProjects();
//         }
//     }, [user]);

//     const handleLogout = () => {
//         localStorage.removeItem("authToken");
//         if (window.google?.accounts?.id) {
//             window.google.accounts.id.disableAutoSelect();
//         }
//         navigate("/");
//     };

//     const handleNavigation = (path) => {
//         navigate(path);
//         setSidebarOpen(false);
//     };

//     // Keep sections open if child page active
//     useEffect(() => {
//         if (location.pathname.includes("worklog")) setOpenWorklogs(true);
//         if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
//             setOpenProjects(true);
//     }, [location]);

//     // Generate project name
//     const generateProjectName = () => {
//         if (!segment || !classSem || !board || !subject || !series || !medium || !session) {
//             return "";
//         }
        
//         // Find full names from abbreviations data
//         const getFullName = (abbreviation, type) => {
//             const items = abbreviationsData[type] || [];
//             const item = items.find(i => i.abbreviation === abbreviation);
//             return item ? item.fullName : abbreviation;
//         };

//         const fullSubject = getFullName(subject, 'subject');
//         const fullSeries = getFullName(series, 'series');
        
//         return `${segment} ${classSem} ${board} ${fullSubject} ${fullSeries} ${medium} ${session}`;
//     };

//     const onSegmentChange = (v) => {
//         setSegment(v);
//         // Reset all dependent fields
//         setClassSem("");
//         setBoard("");
//         setSubject("");
//         setSeries("");
//         setMedium("");
//         setSession("");
        
//         // Fetch new abbreviations data for selected segment
//         fetchAbbreviationsData(v);
//     };

//     const canSubmit = segment && segment !== "Select" && classSem && board && subject && series && medium && session && dueDate;

//     const onSubmit = async (e) => {
//         e.preventDefault();
//         if (!canSubmit) return;

//         setIsLoading(true);
//         setMsg(null);

//         const projectId = [segment, classSem, board, subject, series, medium, session].join("_");
//         const projectName = generateProjectName();
        
//         const payload = { 
//             project_id: projectId, 
//             project_name: projectName, 
//             due_date: dueDate,
//             status: "Approved" // Admin projects are always approved by default
//         };

//         try {
//             // Updated to match admin backend route structure
//             const response = await fetch(`${API_BASE_URL}/admin/projects`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
//                 },
//                 body: JSON.stringify(payload)
//             });

//             const result = await response.json();

//             if (result.success) {
//                 setMsg(`Project created successfully!\nProject ID: ${projectId}\nProject Name: ${projectName}\nStatus: Approved`);
                
//                 // Refresh the projects list
//                 await fetchProjects();
                
//                 // Reset form
//                 setSegment("Select");
//                 setClassSem("");
//                 setBoard("");
//                 setSubject("");
//                 setSeries("");
//                 setMedium("");
//                 setSession("");
//                 setDueDate("");
                
//                 // Reset abbreviations data
//                 setAbbreviationsData({
//                     classSem: [],
//                     board: [],
//                     subject: [],
//                     series: [],
//                     medium: [],
//                     session: []
//                 });
//             } else {
//                 setMsg(`Error: ${result.message}`);
//             }
//         } catch (error) {
//             console.error('Error creating project:', error);
//             setMsg('Error connecting to server. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     if (!user) {
//         return (
//             <div className="min-h-screen bg-slate-100 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//                     <p className="text-slate-600">Loading dashboard...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-slate-100">
//             {/* Fixed Navbar */}
//             <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//                 <div className="max-w-full mx-auto px-4 sm:px-6">
//                     {/* Main navbar content */}
//                     <div className="flex items-center justify-between h-16">
//                         {/* Left side - Logo/Title and Sidebar Toggle */}
//                         <div className="flex items-center">
//                             {/* Sidebar toggle button for mobile/tablet only */}
//                             <button
//                                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                                 className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
//                             >
//                                 <span className="sr-only">Toggle sidebar</span>
//                                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                                 </svg>
//                             </button>

//                             <div className="flex-shrink-0">
//                                 <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
//                                     <span className="block sm:inline">Admin Dashboard</span>
//                                     <span className="hidden sm:inline"> - Add Project</span>
//                                 </h1>
//                             </div>
//                         </div>

//                         {/* Desktop menu - visible on md+ screens */}
//                         <div className="hidden md:flex items-center space-x-4">
//                             <div className="flex items-center space-x-3">
//                                 <img
//                                     src={user.picture}
//                                     alt={user.name}
//                                     className="w-8 h-8 rounded-full border-2 border-slate-600"
//                                 />
//                                 <div className="text-right">
//                                     <div className="text-sm font-medium">{user.name}</div>
//                                     <div className="text-xs text-slate-300">{user.email}</div>
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={handleLogout}
//                                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//                             >
//                                 Logout
//                             </button>
//                         </div>

//                         {/* Mobile menu button */}
//                         <div className="md:hidden">
//                             <button
//                                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                                 className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
//                             >
//                                 <span className="sr-only">Open main menu</span>
//                                 {!mobileMenuOpen ? (
//                                     <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                                     </svg>
//                                 ) : (
//                                     <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                     </svg>
//                                 )}
//                             </button>
//                         </div>
//                     </div>

//                     {/* Mobile menu - visible when open on small screens */}
//                     {mobileMenuOpen && (
//                         <div className="md:hidden border-t border-slate-700">
//                             <div className="px-2 pt-2 pb-3 space-y-1">
//                                 {/* User info */}
//                                 <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
//                                     <img
//                                         src={user.picture}
//                                         alt={user.name}
//                                         className="w-10 h-10 rounded-full border-2 border-slate-600"
//                                     />
//                                     <div className="ml-3">
//                                         <div className="text-sm font-medium text-white">{user.name}</div>
//                                         <div className="text-xs text-slate-300">{user.email}</div>
//                                     </div>
//                                 </div>

//                                 {/* Logout button */}
//                                 <div className="px-3">
//                                     <button
//                                         onClick={() => {
//                                             handleLogout()
//                                             setMobileMenuOpen(false)
//                                         }}
//                                         className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//                                     >
//                                         Logout
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </nav>

//             {/* Layout Container */}
//             <div className="pt-16 flex">
//                 {/* Mobile Sidebar Overlay and Sidebar */}
//                 {sidebarOpen && (
//                     <div className="fixed inset-0 z-40 lg:hidden">
//                         {/* Backdrop */}
//                         <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//                         {/* Mobile Sidebar */}
//                         <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
//                             <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} />
//                         </aside>
//                     </div>
//                 )}

//                 {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
//                 <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//                     <SidebarLinks navigate={navigate} location={location} />
//                 </aside>

//                 {/* Main content with proper margin for sidebar */}
//                 <main className={`flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto`}>
//                     {/* Content */}
//                     <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
//                         {/* Add Project Form */}
//                         <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
//                             <div className="flex items-start justify-between mb-6">
//                                 <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
//                                 <div className="text-right">
//                                     <span className="text-xs text-red-600">* required fields</span>
//                                     <div className="text-xs text-green-600 mt-1">Projects created by Admin are auto-approved</div>
//                                 </div>
//                             </div>

//                             {/* Loading indicator for abbreviations */}
//                             {loadingAbbreviations && (
//                                 <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                                     <div className="flex items-center">
//                                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
//                                         <span className="text-sm text-blue-800">Loading options for {segment}...</span>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                                 <Field label="Segment *">
//                                     <Select
//                                         value={segment}
//                                         onChange={onSegmentChange}
//                                         options={segments}
//                                         isInvalid={!segment || segment === "Select"}
//                                     />
//                                 </Field>

//                                 <Field label="Class/Semester *">
//                                     <SearchableDropdown
//                                         value={classSem}
//                                         onChange={setClassSem}
//                                         options={abbreviationsData.classSem.map(item => item.abbreviation)}
//                                         placeholder="Search class/semester..."
//                                         isInvalid={!classSem}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Board *">
//                                     <SearchableDropdown
//                                         value={board}
//                                         onChange={setBoard}
//                                         options={abbreviationsData.board.map(item => item.abbreviation)}
//                                         placeholder="Search board..."
//                                         isInvalid={!board}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Subject *">
//                                     <EnhancedSearchableDropdown
//                                         value={subject}
//                                         onChange={setSubject}
//                                         data={abbreviationsData.subject}
//                                         placeholder="Search subject..."
//                                         isInvalid={!subject}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Series/Author *">
//                                     <EnhancedSearchableDropdown
//                                         value={series}
//                                         onChange={setSeries}
//                                         data={abbreviationsData.series}
//                                         placeholder="Search series/author..."
//                                         isInvalid={!series}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Medium *">
//                                     <SearchableDropdown
//                                         value={medium}
//                                         onChange={setMedium}
//                                         options={abbreviationsData.medium.map(item => item.abbreviation)}
//                                         placeholder="Search medium..."
//                                         isInvalid={!medium}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Session *">
//                                     <SearchableDropdown
//                                         value={session}
//                                         onChange={setSession}
//                                         options={abbreviationsData.session.map(item => item.abbreviation)}
//                                         placeholder="Search session..."
//                                         isInvalid={!session}
//                                         disabled={!segment || segment === "Select" || loadingAbbreviations}
//                                     />
//                                 </Field>

//                                 <Field label="Due Date *">
//                                     <input
//                                         type="date"
//                                         value={dueDate}
//                                         onChange={(e) => setDueDate(e.target.value)}
//                                         className={`w-full h-12 rounded-2xl border ${!dueDate ? "border-red-500" : "border-slate-300"
//                                             } px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
//                                     />
//                                 </Field>
//                             </div>

//                             {/* Generated Project ID and Name Preview */}
//                             {segment && segment !== "Select" && classSem && board && subject && series && medium && session && (
//                                 <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
//                                     <h3 className="text-sm font-medium text-green-900 mb-2">Generated Project Details:</h3>
//                                     <div className="space-y-2">
//                                         <div>
//                                             <span className="text-xs font-medium text-green-700">Project ID:</span>
//                                             <p className="text-sm text-green-800 font-mono bg-white px-3 py-2 rounded-lg border">
//                                                 {[segment, classSem, board, subject, series, medium, session].join("_")}
//                                             </p>
//                                         </div>
//                                         <div>
//                                             <span className="text-xs font-medium text-green-700">Project Name:</span>
//                                             <p className="text-sm text-green-800 bg-white px-3 py-2 rounded-lg border">
//                                                 {generateProjectName()}
//                                             </p>
//                                         </div>
//                                         <div>
//                                             <span className="text-xs font-medium text-green-700">Status:</span>
//                                             <span className="inline-flex px-3 py-1 ml-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                                 Added by Admin (Auto Approved)
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         setSegment("Select");
//                                         setClassSem("");
//                                         setBoard("");
//                                         setSubject("");
//                                         setSeries("");
//                                         setMedium("");
//                                         setSession("");
//                                         setDueDate("");
//                                         setMsg(null);
//                                         setAbbreviationsData({
//                                             classSem: [],
//                                             board: [],
//                                             subject: [],
//                                             series: [],
//                                             medium: [],
//                                             session: []
//                                         });
//                                     }}
//                                     className="w-full sm:w-auto px-4 py-2 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
//                                 >
//                                     Clear Form
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     disabled={!canSubmit || isLoading}
//                                     className={`w-full sm:w-auto px-6 py-2 rounded-2xl text-white transition-colors ${canSubmit && !isLoading
//                                         ? "bg-green-700 hover:bg-green-800"
//                                         : "bg-slate-400 cursor-not-allowed"
//                                         }`}
//                                 >
//                                     {isLoading ? "Creating Project..." : "Create Project"}
//                                 </button>
//                             </div>
//                         </form>

//                         {/* Success/Error Message */}
//                         {msg && <Feedback message={msg} />}

//                         {/* Recent Projects Table */}
//                         <section className="mt-8">
//                             <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
//                                 <div className="px-6 py-4 border-b border-slate-200">
//                                     <h3 className="text-lg font-semibold text-slate-800">Recent Created Projects</h3>
//                                 </div>
//                                 <div className="overflow-x-auto">
//                                     <table className="min-w-full text-left text-sm">
//                                         <thead className="bg-slate-100 text-slate-900">
//                                             <tr>
//                                                 <th className="px-6 py-3 font-semibold">Project ID</th>
//                                                 <th className="px-6 py-3 font-semibold">Project Name</th>
//                                                 <th className="px-6 py-3 font-semibold">Start Date</th>
//                                                 <th className="px-6 py-3 font-semibold">Due Date</th>
//                                                 <th className="px-6 py-3 font-semibold">Status</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {requests.length === 0 ? (
//                                                 <tr>
//                                                     <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
//                                                         No projects found
//                                                     </td>
//                                                 </tr>
//                                             ) : (
//                                                 requests.map((request, idx) => (
//                                                     <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
//                                                         <td className="px-6 py-4 font-mono text-xs">{request.projectId}</td>
//                                                         <td className="px-6 py-4 text-xs">{request.projectName}</td>
//                                                         <td className="px-6 py-4">{new Date(request.startDate).toLocaleDateString()}</td>
//                                                         <td className="px-6 py-4">{new Date(request.dueDate).toLocaleDateString()}</td>
//                                                         <td className="px-6 py-4">
//                                                             <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
//                                                                 request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
//                                                                     'bg-blue-100 text-black-800'
//                                                                 }`}>
//                                                                 {request.status}
//                                                             </span>
//                                                         </td>
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         </section>
//                     </div>
//                 </main>
//             </div>
//         </div>
//     );
// }

// /* ---- Sidebar Links Component ---- */
// function SidebarLinks({ navigate, location, close }) {
//     const [openWorklogs, setOpenWorklogs] = useState(false);
//     const [openProjects, setOpenProjects] = useState(false);

//     // Keep sections open if child page active
//     useEffect(() => {
//         if (location.pathname.includes("worklog")) setOpenWorklogs(true);
//         if (location.pathname.includes("project") || location.pathname.includes("abbreviations"))
//             setOpenProjects(true);
//     }, [location]);

//     const handleNavigation = (path) => {
//         navigate(path);
//         if (close) close();
//     };

//     return (
//         <div className="p-6">
//             <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//             <nav className="flex flex-col space-y-2">
//                 <button
//                     className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
//                         }`}
//                     onClick={() => handleNavigation("/admin-dashboard")}
//                 >
//                     Home
//                 </button>

//                 {/* Worklogs */}
//                 <div>
//                     <button
//                         className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
//                         onClick={() => setOpenWorklogs(!openWorklogs)}
//                     >
//                         <span>Worklogs</span>
//                         <span className="transition-transform duration-200">
//                             {openWorklogs ? "▾" : "▸"}
//                         </span>
//                     </button>
//                     {openWorklogs && (
//                         <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//                             <button
//                                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
//                                     }`}
//                                 onClick={() => handleNavigation("/admin/approve-worklogs")}
//                             >
//                                 Approve Worklogs
//                             </button>
//                             <button
//                                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""
//                                     }`}
//                                 onClick={() => handleNavigation("/admin/edit-worklog-entries")}
//                             >
//                                 Edit Worklogs
//                             </button>
//                         </div>
//                     )}
//                 </div>

//                 {/* Employees */}
//                 <button
//                     className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
//                         }`}
//                     onClick={() => handleNavigation("/admin/handle-employees")}
//                 >
//                     Manage Employees
//                 </button>
//                 <button
//                     className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""
//                         }`}
//                     onClick={() => { navigate("/admin/push-missing-request"); close(); }}
//                 >
//                     Push Missing Requests
//                 </button>
//                  {/* Teams */}
//          <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/team-wise-dropdowns")}
//         >
//           Team-wise Dropdowns
//         </button>
//                 {/* Projects */}
//                 <div>
//                     <button
//                         className="w-full flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors"
//                         onClick={() => setOpenProjects(!openProjects)}
//                     >
//                         <span>Projects</span>
//                         <span className="transition-transform duration-200">
//                             {openProjects ? "▾" : "▸"}
//                         </span>
//                     </button>
//                     {openProjects && (
//                         <div className="ml-4 mt-2 flex flex-col space-y-2 animate-fadeIn">
//                             <button
//                                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""
//                                     }`}
//                                 onClick={() => handleNavigation("/admin/add-abbreviations")}
//                             >
//                                 Add Abbreviations
//                             </button>
//                             <button
//                                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""
//                                     }`}
//                                 onClick={() => handleNavigation("/admin/add-project")}
//                             >
//                                 Add Project
//                             </button>
//                             <button
//                                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("project-requests") ? "bg-gray-700" : ""
//                                     }`}
//                                 onClick={() => handleNavigation("/admin/project-requests")}
//                             >
//                                 Project Requests
//                             </button>
//                         </div>
//                     )}
//                 </div>
//                  <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin/add-unit-type" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/add-unit-type")}
//         >
//           Add Unit Type
//         </button>
//                 <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "mark-shift" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/mark-shift")}
//         >
//           Mark Extra Shift
//         </button>
//             </nav>
//         </div>
//     );
// }

// /* ---- Sub Components ---- */
// function Field({ label, children }) {
//     return (
//         <label className="block">
//             <span className="block mb-2 text-sm font-medium text-slate-800">{label}</span>
//             {children}
//         </label>
//     );
// }

// function Select({ value, onChange, options = [], labels = {}, isInvalid }) {
//     const labelFor = (o) =>
//         labels && typeof labels === "object" && labels[o] ? labels[o] : o;
//     return (
//         <select
//             value={value}
//             onChange={(e) => onChange(e.target.value)}
//             className={`w-full h-12 text-sm px-3 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
//                 } focus:border-indigo-600 focus:outline-none`}
//         >
//             <option value="">— Select —</option>
//             {options.map((o) => (
//                 <option key={o} value={o}>
//                     {labelFor(o)}
//                 </option>
//             ))}
//         </select>
//     );
// }

// function SearchableDropdown({ value, onChange, options = [], placeholder, isInvalid, disabled = false }) {
//     const [query, setQuery] = useState("");
//     const [isOpen, setIsOpen] = useState(false);

//     // Filter options based on query
//     const filtered = useMemo(
//         () =>
//             options.filter((o) =>
//                 o.toLowerCase().includes(query.toLowerCase())
//             ),
//         [query, options]
//     );

//     // Close dropdown when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (e) => {
//             if (e.target.closest(".search-select-container")) return;
//             setIsOpen(false);
//         };
//         document.addEventListener("click", handleClickOutside);
//         return () => document.removeEventListener("click", handleClickOutside);
//     }, []);

//     return (
//         <div className="relative search-select-container">
//             <input
//                 type="text"
//                 value={query || value || ""}
//                 onChange={(e) => {
//                     setQuery(e.target.value);
//                     setIsOpen(true);
//                     if (!e.target.value) onChange("");
//                 }}
//                 onFocus={() => setIsOpen(true)}
//                 placeholder={disabled ? "Select segment first" : placeholder}
//                 disabled={disabled}
//                 className={`w-full h-12 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
//                     } px-3 focus:border-indigo-600 focus:outline-none ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
//             />
//             {isOpen && (query || !value) && !disabled && (
//                 <ul className="absolute z-20 bg-white border-2 border-slate-300 rounded-2xl mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
//                     {filtered.length > 0 ? (
//                         filtered.map((o) => (
//                             <li
//                                 key={o}
//                                 className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
//                                 onClick={() => {
//                                     onChange(o);
//                                     setQuery("");
//                                     setIsOpen(false);
//                                 }}
//                             >
//                                 {o}
//                             </li>
//                         ))
//                     ) : (
//                         <li className="px-4 py-3 text-slate-500">No results found</li>
//                     )}
//                 </ul>
//             )}
//         </div>
//     );
// }

// function EnhancedSearchableDropdown({ value, onChange, data = [], placeholder, isInvalid, disabled = false }) {
//     const [query, setQuery] = useState("");
//     const [isOpen, setIsOpen] = useState(false);

//     // Filter data based on query - search both abbreviation and full name
//     const filtered = useMemo(() => {
//         if (!query) return data;
        
//         return data.filter((item) => {
//             return item.abbreviation.toLowerCase().includes(query.toLowerCase()) || 
//                    item.fullName.toLowerCase().includes(query.toLowerCase());
//         });
//     }, [query, data]);

//     // Close dropdown when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (e) => {
//             if (e.target.closest(".enhanced-search-select-container")) return;
//             setIsOpen(false);
//         };
//         document.addEventListener("click", handleClickOutside);
//         return () => document.removeEventListener("click", handleClickOutside);
//     }, []);

//     return (
//         <div className="relative enhanced-search-select-container">
//             <input
//                 type="text"
//                 value={query || value || ""}
//                 onChange={(e) => {
//                     setQuery(e.target.value);
//                     setIsOpen(true);
//                     if (!e.target.value) onChange("");
//                 }}
//                 onFocus={() => setIsOpen(true)}
//                 placeholder={disabled ? "Select segment first" : placeholder}
//                 disabled={disabled}
//                 className={`w-full h-12 rounded-2xl border-2 ${isInvalid ? "border-red-500" : "border-slate-300"
//                     } px-3 focus:border-indigo-600 focus:outline-none ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
//             />
//             {isOpen && (query || !value) && !disabled && (
//                 <ul className="absolute z-20 bg-white border-2 border-slate-300 rounded-2xl mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
//                     {filtered.length > 0 ? (
//                         filtered.map((item) => (
//                             <li
//                                 key={item.abbreviation}
//                                 className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0"
//                                 onClick={() => {
//                                     onChange(item.abbreviation);
//                                     setQuery("");
//                                     setIsOpen(false);
//                                 }}
//                             >
//                                 <div className="flex flex-col">
//                                     <span className="font-medium text-slate-900">[{item.abbreviation}]</span>
//                                     <span className="text-xs text-slate-600">{item.fullName}</span>
//                                 </div>
//                             </li>
//                         ))
//                     ) : (
//                         <li className="px-4 py-3 text-slate-500">No results found</li>
//                     )}
//                 </ul>
//             )}
//         </div>
//     );
// }

// function Feedback({ message }) {
//     const isError = message && (message.includes("Error") || message.includes("Failed"));
//     const isSuccess = message && (message.includes("submitted") || message.includes("✔"));

//     let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
//     if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
//     if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

//     return (
//         <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap ${bgColor}`}>
//             {message}
//         </div>
//     );
// }

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

export default function AdminAddProject() {
    const navigate = useNavigate();
    const location = useLocation();

    // User state from Admin dashboard
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Form state
    const [segment, setSegment] = useState("Select");
    const [classSem, setClassSem] = useState("");
    const [board, setBoard] = useState("");
    const [subject, setSubject] = useState("");
    const [series, setSeries] = useState("");
    const [medium, setMedium] = useState("");
    const [session, setSession] = useState("");
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

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");

    // Edit modal state
    const [editingProject, setEditingProject] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Delete confirmation state
    const [deletingProjectId, setDeletingProjectId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // API base URL
    const API_BASE_URL = import.meta.env?.VITE_API_BASE;

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
            
    // Authentication logic
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
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
             axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchPendingCount();
      fetchProjectPendingCount();
        } catch (e) {
            console.error("Invalid token:", e);
            localStorage.removeItem("authToken");
            navigate("/");
        }
    }, [navigate]);

    // Fetch available segments on component mount
    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/abbreviations/segments`, {
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
            const response = await fetch(`${API_BASE_URL}/admin/abbreviations/${selectedSegment}`, {
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

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/projects`, {
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

    const generateProjectName = (seg, cls, brd, subj, ser, med, sess) => {
        if (!seg || !cls || !brd || !subj || !ser || !med || !sess) {
            return "";
        }

        const getFullName = (abbreviation, type) => {
            const items = abbreviationsData[type] || [];
            const item = items.find(i => i.abbreviation === abbreviation);
            return item ? item.fullName : abbreviation;
        };

        const fullSubject = getFullName(subj, 'subject');
        const fullSeries = getFullName(ser, 'series');

        return `${seg} ${cls} ${brd} ${fullSubject} ${fullSeries} ${med} ${sess}`;
    };

    const onSegmentChange = (v) => {
        setSegment(v);
        setClassSem("");
        setBoard("");
        setSubject("");
        setSeries("");
        setMedium("");
        setSession("");
        fetchAbbreviationsData(v);
    };

    const canSubmit = segment && segment !== "Select" && classSem && board && subject && series && medium && session && dueDate;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsLoading(true);
        setMsg(null);

        const projectId = [segment, classSem, board, subject, series, medium, session].join("_");
        const projectName = generateProjectName(segment, classSem, board, subject, series, medium, session);

        const payload = {
            project_id: projectId,
            project_name: projectName,
            due_date: dueDate,
            status: "Approved"
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setMsg(`Project created successfully!\nProject ID: ${projectId}\nProject Name: ${projectName}\nStatus: Approved`);
                await fetchProjects();
                resetForm();
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

    const resetForm = () => {
        setSegment("Select");
        setClassSem("");
        setBoard("");
        setSubject("");
        setSeries("");
        setMedium("");
        setSession("");
        setDueDate("");
        setAbbreviationsData({
            classSem: [],
            board: [],
            subject: [],
            series: [],
            medium: [],
            session: []
        });
    };

    // Handle Edit Project
    const handleEdit = (project) => {
        setMsg(null); // Clear any existing messages
        const parts = project.projectId.split('_');
        if (parts.length === 7) {
            setEditingProject({
                originalId: project.projectId,
                segment: parts[0],
                classSem: parts[1],
                board: parts[2],
                subject: parts[3],
                series: parts[4],
                medium: parts[5],
                session: parts[6],
                dueDate: project.dueDate,
                originalSegment: parts[0] // Store original segment for validation
            });
            setShowEditModal(true);
            fetchAbbreviationsData(parts[0]);
        }
    };

    // Validate if current field values are valid for the selected segment
    const validateEditingFields = () => {
        if (!editingProject) return { isValid: true, errors: [] };

        // If segment hasn't changed, no validation needed
        if (editingProject.segment === editingProject.originalSegment) {
            return { isValid: true, errors: [] };
        }

        const errors = [];

        // Check if current values exist in new segment's abbreviations
        if (editingProject.classSem && !abbreviationsData.classSem.some(item => item.abbreviation === editingProject.classSem)) {
            errors.push("Class/Semester");
        }
        if (editingProject.board && !abbreviationsData.board.some(item => item.abbreviation === editingProject.board)) {
            errors.push("Board");
        }
        if (editingProject.subject && !abbreviationsData.subject.some(item => item.abbreviation === editingProject.subject)) {
            errors.push("Subject");
        }
        if (editingProject.series && !abbreviationsData.series.some(item => item.abbreviation === editingProject.series)) {
            errors.push("Series/Author");
        }
        if (editingProject.medium && !abbreviationsData.medium.some(item => item.abbreviation === editingProject.medium)) {
            errors.push("Medium");
        }
        if (editingProject.session && !abbreviationsData.session.some(item => item.abbreviation === editingProject.session)) {
            errors.push("Session");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    // Handle Update Project
    const handleUpdate = async () => {
        if (!editingProject) return;

        setIsLoading(true);
        setMsg(null);

        const newProjectId = [
            editingProject.segment,
            editingProject.classSem,
            editingProject.board,
            editingProject.subject,
            editingProject.series,
            editingProject.medium,
            editingProject.session
        ].join("_");

        const projectName = generateProjectName(
            editingProject.segment,
            editingProject.classSem,
            editingProject.board,
            editingProject.subject,
            editingProject.series,
            editingProject.medium,
            editingProject.session
        );

        try {
            const response = await fetch(`${API_BASE_URL}/admin/projects/${editingProject.originalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    project_id: newProjectId,
                    project_name: projectName,
                    due_date: editingProject.dueDate
                })
            });

            const result = await response.json();

            if (result.success) {
                setMsg(`Project updated successfully!`);
                await fetchProjects();
                // Don't close modal immediately to show success message
                setTimeout(() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                    setMsg(null);
                }, 2000);
            } else {
                setMsg(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            setMsg('Error connecting to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Delete Project
    const handleDelete = (projectId) => {
        setDeletingProjectId(projectId);
        setShowDeleteConfirm(true);
    };

    // Confirm Delete
    const confirmDelete = async () => {
        if (!deletingProjectId) return;

        setIsLoading(true);
        setMsg(null);

        // Find the project details for feedback message
        const projectToDelete = requests.find(p => p.projectId === deletingProjectId);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/projects/${deletingProjectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setMsg(`Project deleted successfully!\nProject ID: ${deletingProjectId}\nProject Name: ${projectToDelete?.projectName || 'N/A'}`);
                await fetchProjects();
                setShowDeleteConfirm(false);
                setDeletingProjectId(null);
            } else {
                setMsg(`Error deleting project: ${result.message}`);
                setShowDeleteConfirm(false);
                setDeletingProjectId(null);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            setMsg('Error connecting to server. Please try again.');
            setShowDeleteConfirm(false);
            setDeletingProjectId(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Search and filter logic with relevance scoring
    const filteredAndSortedProjects = useMemo(() => {
        if (!searchQuery.trim()) {
            return requests;
        }

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        const scoredProjects = requests.map(project => {
            const projectId = project.projectId.toLowerCase();
            const projectName = project.projectName.toLowerCase();

            let score = 0;
            let matches = [];

            searchTerms.forEach(term => {
                // Exact match in project ID
                if (projectId.includes(term)) {
                    score += 10;
                    matches.push({ type: 'id', term });
                }
                // Exact match in project name
                if (projectName.includes(term)) {
                    score += 5;
                    matches.push({ type: 'name', term });
                }
            });

            return { ...project, score, matches };
        });

        return scoredProjects
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score);
    }, [requests, searchQuery]);

    // Highlight matching terms
    const highlightText = (text, type) => {
        if (!searchQuery.trim()) return text;

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        let highlightedText = text;

        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
        });

        return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
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
                                    <span className="block sm:inline">Admin Dashboard</span>
                                    <span className="hidden sm:inline"> - Add Project</span>
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

                <main className={`flex-1 transition-all duration-300 ease-in-out lg:ml-72 overflow-y-auto`}>
                    <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
                        {/* Add Project Form */}
                        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
                                <div className="text-right">
                                    <span className="text-xs text-red-600">* required fields</span>
                                    <div className="text-xs text-green-600 mt-1">Projects created by Admin are auto-approved</div>
                                </div>
                            </div>

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
                                                {generateProjectName(segment, classSem, board, subject, series, medium, session)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-green-700">Status:</span>
                                            <span className="inline-flex px-3 py-1 ml-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Added by Admin (Auto Approved)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
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

                        {msg && !showEditModal && (
                            <div className="mt-6">
                                <Feedback message={msg} />
                            </div>
                        )}

                        {/* Recent Projects Table with Search */}
                        <section className="mt-6">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                                <div className="px-6 py-4 border-b border-slate-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <h3 className="text-lg font-semibold text-slate-800">All Projects</h3>
                                        <div className="relative w-full sm:w-96">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by project ID or name..."
                                                className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
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
                                                <th className="px-6 py-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedProjects.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                        {searchQuery ? "No projects match your search" : "No projects found"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAndSortedProjects.map((request, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                        <td className="px-6 py-4 font-mono text-xs">
                                                            {highlightText(request.projectId, 'id')}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs max-w-xs">
                                                            {highlightText(request.projectName, 'name')}
                                                        </td>
                                                        <td className="px-6 py-4">{new Date(request.startDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">{new Date(request.dueDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                                request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {request.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(request)}
                                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(request.projectId)}
                                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
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

            {/* Edit Modal */}
            {showEditModal && editingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl font-semibold text-slate-800">Edit Project</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingProject(null);
                                    setMsg(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {msg && (
                                <div className="mb-4">
                                    <Feedback message={msg} />
                                </div>
                            )}

                            {(() => {
                                const validation = validateEditingFields();
                                if (!validation.isValid && !loadingAbbreviations) {
                                    return (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                                            <div className="flex items-start">
                                                <svg className="h-5 w-5 text-red-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-red-900 mb-1">Segment Change Detected</h4>
                                                    <p className="text-sm text-red-800 mb-2">
                                                        The following fields are not valid for the selected segment "{editingProject.segment}":
                                                    </p>
                                                    <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                                                        {validation.errors.map((field, idx) => (
                                                            <li key={idx}>{field}</li>
                                                        ))}
                                                    </ul>
                                                    <p className="text-sm text-red-800 mt-2 font-medium">
                                                        Please update these fields with valid values for the new segment or revert to the original segment.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {loadingAbbreviations && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                        <span className="text-sm text-blue-800">Loading options...</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Field label="Segment *">
                                    <Select
                                        value={editingProject.segment}
                                        onChange={(v) => {
                                            setEditingProject({ ...editingProject, segment: v });
                                            fetchAbbreviationsData(v);
                                            // Clear any previous validation messages
                                            if (editingProject.originalSegment === v) {
                                                setMsg(null);
                                            }
                                        }}
                                        options={segments}
                                        isInvalid={!editingProject.segment || editingProject.segment === "Select"}
                                    />
                                </Field>

                                <Field label="Class/Semester *">
                                    <SearchableDropdown
                                        value={editingProject.classSem}
                                        onChange={(v) => setEditingProject({ ...editingProject, classSem: v })}
                                        options={abbreviationsData.classSem.map(item => item.abbreviation)}
                                        placeholder="Search class/semester..."
                                        isInvalid={!editingProject.classSem}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Board *">
                                    <SearchableDropdown
                                        value={editingProject.board}
                                        onChange={(v) => setEditingProject({ ...editingProject, board: v })}
                                        options={abbreviationsData.board.map(item => item.abbreviation)}
                                        placeholder="Search board..."
                                        isInvalid={!editingProject.board}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Subject *">
                                    <EnhancedSearchableDropdown
                                        value={editingProject.subject}
                                        onChange={(v) => setEditingProject({ ...editingProject, subject: v })}
                                        data={abbreviationsData.subject}
                                        placeholder="Search subject..."
                                        isInvalid={!editingProject.subject}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Series/Author *">
                                    <EnhancedSearchableDropdown
                                        value={editingProject.series}
                                        onChange={(v) => setEditingProject({ ...editingProject, series: v })}
                                        data={abbreviationsData.series}
                                        placeholder="Search series/author..."
                                        isInvalid={!editingProject.series}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Medium *">
                                    <SearchableDropdown
                                        value={editingProject.medium}
                                        onChange={(v) => setEditingProject({ ...editingProject, medium: v })}
                                        options={abbreviationsData.medium.map(item => item.abbreviation)}
                                        placeholder="Search medium..."
                                        isInvalid={!editingProject.medium}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Session *">
                                    <SearchableDropdown
                                        value={editingProject.session}
                                        onChange={(v) => setEditingProject({ ...editingProject, session: v })}
                                        options={abbreviationsData.session.map(item => item.abbreviation)}
                                        placeholder="Search session..."
                                        isInvalid={!editingProject.session}
                                        disabled={!editingProject.segment || editingProject.segment === "Select" || loadingAbbreviations}
                                    />
                                </Field>

                                <Field label="Due Date *">
                                    <input
                                        type="date"
                                        value={editingProject.dueDate}
                                        onChange={(e) => setEditingProject({ ...editingProject, dueDate: e.target.value })}
                                        className={`w-full h-12 rounded-2xl border ${!editingProject.dueDate ? "border-red-500" : "border-slate-300"
                                            } px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                </Field>
                            </div>

                            {editingProject.segment && editingProject.classSem && editingProject.board &&
                                editingProject.subject && editingProject.series && editingProject.medium && editingProject.session && (
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                        <h3 className="text-sm font-medium text-blue-900 mb-2">Updated Project Details:</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-xs font-medium text-blue-700">New Project ID:</span>
                                                <p className="text-sm text-blue-800 font-mono bg-white px-3 py-2 rounded-lg border">
                                                    {[editingProject.segment, editingProject.classSem, editingProject.board,
                                                    editingProject.subject, editingProject.series, editingProject.medium,
                                                    editingProject.session].join("_")}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-blue-700">New Project Name:</span>
                                                <p className="text-sm text-blue-800 bg-white px-3 py-2 rounded-lg border">
                                                    {generateProjectName(
                                                        editingProject.segment, editingProject.classSem, editingProject.board,
                                                        editingProject.subject, editingProject.series, editingProject.medium,
                                                        editingProject.session
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingProject(null);
                                        setMsg(null);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={isLoading || !validateEditingFields().isValid}
                                    className={`w-full sm:w-auto px-6 py-2 rounded-2xl text-white transition-colors ${!isLoading && validateEditingFields().isValid
                                            ? "bg-indigo-600 hover:bg-indigo-700"
                                            : "bg-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    {isLoading ? "Updating..." : "Update Project"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deletingProjectId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-center text-slate-900 mb-4">Delete Project</h3>
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-medium text-slate-600">Project ID:</span>
                                    <p className="text-sm text-slate-900 font-mono break-all">{deletingProjectId}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-slate-600">Project Name:</span>
                                    <p className="text-sm text-slate-900 break-words">
                                        {requests.find(p => p.projectId === deletingProjectId)?.projectName || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-center text-slate-600 mb-6">
                            Are you sure you want to delete this project? This action cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletingProjectId(null);
                                }}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${!isLoading ? "bg-red-600 hover:bg-red-700" : "bg-slate-400 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? "Deleting..." : "Delete Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Sidebar Links Component ---- */
function SidebarLinks({ navigate, location, close, pendingCount = 0, projectPendingCount = 0}) {
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
                    className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
                        }`}
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
                                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
                                    }`}
                                onClick={() => handleNavigation("/admin/approve-worklogs")}
                            >
                                Approve Worklogs
                            </button>
                            <button
                                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("edit-worklog-entries") ? "bg-gray-700" : ""
                                    }`}
                                onClick={() => handleNavigation("/admin/edit-worklog-entries")}
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
                                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-abbreviations") ? "bg-gray-700" : ""
                                    }`}
                                onClick={() => handleNavigation("/admin/add-abbreviations")}
                            >
                                Add Abbreviations
                            </button>
                            <button
                                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("add-project") ? "bg-gray-700" : ""
                                    }`}
                                onClick={() => handleNavigation("/admin/add-project")}
                            >
                                Add Project
                            </button>
                            {/* <button
                                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${location.pathname.includes("project-requests") ? "bg-gray-700" : ""
                                    }`}
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
          {projectPendingCount > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
              {projectPendingCount > 9 ? "9+" : projectPendingCount}
            </span>
          )}
        </button>
                 <button
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin/add-unit-type" ? "bg-gray-700" : ""}`}
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
    const containerRef = useRef(null);

    const filtered = useMemo(
        () =>
            options.filter((o) =>
                o.toLowerCase().includes(query.toLowerCase())
            ),
        [query, options]
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
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
    const containerRef = useRef(null);

    const filtered = useMemo(() => {
        if (!query) return data;

        return data.filter((item) => {
            return item.abbreviation.toLowerCase().includes(query.toLowerCase()) ||
                item.fullName.toLowerCase().includes(query.toLowerCase());
        });
    }, [query, data]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
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
    const isSuccess = message && (message.includes("successfully") || message.includes("✔"));

    let bgColor = "bg-blue-50 border-blue-200 text-blue-900";
    if (isError) bgColor = "bg-red-50 border-red-200 text-red-900";
    if (isSuccess) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";

    return (
        <div className={`rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap ${bgColor}`}>
            {message}
        </div>
    );
}
