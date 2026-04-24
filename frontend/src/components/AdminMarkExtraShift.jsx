// import React, { useState, useEffect, useRef } from "react";
// import { jwtDecode } from "jwt-decode";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X as XIcon, Filter as FilterIcon, Users as UsersIcon } from "lucide-react";

// const API_BASE_URL = import.meta.env?.VITE_API_BASE;

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
//   CSMA_Intern: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
//   CSMA_Technology: "bg-yellow-100 border-yellow-300 text-yellow-800",
//   Animation_Maths: "bg-rose-100 border-rose-300 text-rose-800",
//   InternScience: "bg-sky-100 border-sky-300 text-sky-800",
//   "University&_Titles": "bg-stone-100 border-stone-300 text-stone-800",
// };

// const ALL_TEAMS = Object.keys(TEAM_COLORS);
// const ROLES = ["Spoc", "Employee"];

// export default function AdminMarkExtraShift() {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [user, setUser] = useState(null);
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     // Employee and shift states
//     const [employeesList, setEmployeesList] = useState([]);
//     const [employeesLoading, setEmployeesLoading] = useState(true);
//     const [selectedNightEmployees, setSelectedNightEmployees] = useState([]);
//     const [selectedSundayEmployees, setSelectedSundayEmployees] = useState([]);

//     // Active and historical shifts
//     const [activeShifts, setActiveShifts] = useState([]);
//     const [historicalShifts, setHistoricalShifts] = useState([]);
//     const [allHistoricalShifts, setAllHistoricalShifts] = useState([]); // Store all historical shifts
//     const [activeShiftsLoading, setActiveShiftsLoading] = useState(false);
//     const [historyType, setHistoryType] = useState("night");

//     // UI states
//     const [showPopup, setShowPopup] = useState(false);
//     const [popupMessage, setPopupMessage] = useState("");
//     const [popupType, setPopupType] = useState("success");
//     const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState("All Employees");
//     const [selectedPeriod, setSelectedPeriod] = useState("30");

//     // Date picker states
//     const todayISO = stripToISO(new Date());
//     const [datePopoverOpen, setDatePopoverOpen] = useState(false);
//     const [selectedDate, setSelectedDate] = useState(todayISO);
//     const [tempDate, setTempDate] = useState(todayISO);
//     const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(todayISO)));
//     const popRef = useOutclick(() => setDatePopoverOpen(false));

//     // Calculated dates for night and Sunday shifts
//     const [calculatedNightDate, setCalculatedNightDate] = useState(todayISO);
//     const [calculatedSundayDate, setCalculatedSundayDate] = useState("");

//     // Filter states
//     const [showRoleDropdown, setShowRoleDropdown] = useState(false);
//     const roleRef = useOutclick(() => setShowRoleDropdown(false));
//     const [selectedRoles, setSelectedRoles] = useState([...ROLES]);

//     const [showTeamDropdown, setShowTeamDropdown] = useState(false);
//     const teamRef = useOutclick(() => setShowTeamDropdown(false));
//     const [selectedTeams, setSelectedTeams] = useState([]);

//     // Search state
//     const [searchQuery, setSearchQuery] = useState("");

//     // Authentication check
//     useEffect(() => {
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//             navigate("/");
//             return;
//         }

//         try {
//             const decoded = jwtDecode(token);
//             const u = {
//                 name: decoded.name,
//                 email: decoded.email,
//                 role: decoded.role,
//                 picture:
//                     decoded.picture ||
//                     `https://ui-avatars.com/api/?name=${encodeURIComponent(
//                         decoded.name
//                     )}&background=random&color=fff`,
//             };
//             setUser(u);
//         } catch (e) {
//             console.error("Invalid token:", e);
//             localStorage.removeItem("authToken");
//             navigate("/");
//         }
//     }, [navigate]);

//     // Show popup with auto-hide
//     const showPopupMessage = (message, type = "success") => {
//         setPopupMessage(message);
//         setPopupType(type);
//         setShowPopup(true);
//         setTimeout(() => {
//             setShowPopup(false);
//         }, 4000);
//     };

//     // Fetch all employees (Admin only)
//     const fetchAllEmployees = async () => {
//         if (!user) return;

//         setEmployeesLoading(true);
//         try {
//             const token = localStorage.getItem("authToken");
//             const response = await fetch(
//                 `${API_BASE_URL}/admin/shifts/employees?email=${encodeURIComponent(user.email)}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             if (response.ok) {
//                 const data = await response.json();
//                 setEmployeesList(data);
//             } else {
//                 console.error("Failed to fetch employees");
//                 setError("Failed to load employees");
//                 setEmployeesList([]);
//             }
//         } catch (error) {
//             console.error("Error fetching employees:", error);
//             setError("Network error while loading employees");
//             setEmployeesList([]);
//         } finally {
//             setEmployeesLoading(false);
//         }
//     };

//     // Fetch active shifts (upcoming/current)
//     const fetchActiveShifts = async () => {
//         if (!user) return;

//         setActiveShiftsLoading(true);
//         try {
//             const token = localStorage.getItem("authToken");
//             const response = await fetch(
//                 `${API_BASE_URL}/admin/shifts/active?email=${encodeURIComponent(user.email)}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             if (response.ok) {
//                 const data = await response.json();
//                 setActiveShifts(data);
//             } else {
//                 console.error("Failed to fetch active shifts");
//                 setActiveShifts([]);
//             }
//         } catch (error) {
//             console.error("Error fetching active shifts:", error);
//             setActiveShifts([]);
//         } finally {
//             setActiveShiftsLoading(false);
//         }
//     };

//     // Fetch historical shifts
//     const fetchHistoricalShifts = async () => {
//         if (!user) return;

//         try {
//             const token = localStorage.getItem("authToken");
//             const response = await fetch(
//                 `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=${historyType}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             if (response.ok) {
//                 const data = await response.json();
//                 setHistoricalShifts(data);
//             } else {
//                 console.error("Failed to fetch history");
//                 setHistoricalShifts([]);
//             }
//         } catch (error) {
//             console.error("Error fetching history:", error);
//             setHistoricalShifts([]);
//         }
//     };

//     // Fetch ALL historical shifts (both night and Sunday) for validation
//     const fetchAllHistoricalShifts = async () => {
//         if (!user) return;

//         try {
//             const token = localStorage.getItem("authToken");
            
//             // Fetch both night and Sunday shifts in parallel
//             const [nightResponse, sundayResponse] = await Promise.all([
//                 fetch(
//                     `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=night`,
//                     {
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     }
//                 ),
//                 fetch(
//                     `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=sunday`,
//                     {
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     }
//                 )
//             ]);

//             const nightData = nightResponse.ok ? await nightResponse.json() : [];
//             const sundayData = sundayResponse.ok ? await sundayResponse.json() : [];

//             // Combine both arrays
//             setAllHistoricalShifts([...nightData, ...sundayData]);
//         } catch (error) {
//             console.error("Error fetching all historical shifts:", error);
//             setAllHistoricalShifts([]);
//         }
//     };

//     // Fetch data when user is set or history type changes
//     useEffect(() => {
//         if (user) {
//             fetchAllEmployees();
//             fetchActiveShifts();
//             fetchHistoricalShifts();
//             fetchAllHistoricalShifts(); // Fetch all historical shifts for validation
//         }
//     }, [user, historyType]);

//     // Clear selections when date changes
//     useEffect(() => {
//         setSelectedNightEmployees([]);
//         setSelectedSundayEmployees([]);
//     }, [selectedDate]);

//     // Calculate night and Sunday shift dates based on selected date
//     useEffect(() => {
//         if (!selectedDate) return;

//         const selected = new Date(selectedDate);

//         // Night shift: Use the selected date itself
//         setCalculatedNightDate(stripToISO(selected));

//         // Sunday shift: Find the next upcoming Sunday from selected date
//         const calculateNextSunday = (fromDate) => {
//             const date = new Date(fromDate);
//             const dayOfWeek = date.getDay();
            
//             // If it's Sunday (0), get next Sunday (7 days ahead)
//             // Otherwise, calculate days until next Sunday
//             const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
            
//             date.setDate(date.getDate() + daysUntilSunday);
//             return stripToISO(date);
//         };

//         // For Sunday shift, always find next Sunday from selected date
//         const nextSunday = calculateNextSunday(selected);
//         setCalculatedSundayDate(nextSunday);

//     }, [selectedDate]);

//     const handleLogout = () => {
//         localStorage.removeItem("authToken");
//         navigate("/");
//     };

//     // Checkbox change handlers with validation
//     const handleNightCheckbox = (employee) => {
//         // Normalize dates for comparison
//         const normalizeDate = (dateStr) => {
//             if (!dateStr) return '';
//             return dateStr.split('T')[0];
//         };

//         // Check if employee has night shift on the calculated night date (in active shifts)
//         const hasActiveNightShift = activeShifts.some(shift => {
//             const shiftDate = normalizeDate(shift.shift_date);
//             const calculatedDate = normalizeDate(calculatedNightDate);
           
//             return shift.email === employee.email &&
//                    shift.shift_type === 'NIGHT' &&
//                    shiftDate === calculatedDate;
//         });

//         // Check if employee has night shift on the calculated night date (in ALL historical shifts)
//         const hasHistoricalNightShift = allHistoricalShifts.some(shift => {
//             const shiftDate = normalizeDate(shift.shift_date);
//             const calculatedDate = normalizeDate(calculatedNightDate);
           
//             return shift.email === employee.email &&
//                    shift.shift_type === 'NIGHT' &&
//                    shiftDate === calculatedDate;
//         });

//         if (hasActiveNightShift || hasHistoricalNightShift) {
//             showPopupMessage(`${employee.name} already has a night shift on ${formatISOToHuman(calculatedNightDate)}. Please delete the existing shift first.`, "warning");
//             return;
//         }

//         setSelectedNightEmployees((prev) =>
//             prev.find(e => e.email === employee.email)
//                 ? prev.filter((e) => e.email !== employee.email)
//                 : [...prev, employee]
//         );
//     };

//     const handleSundayCheckbox = (employee) => {
//         // Normalize dates for comparison
//         const normalizeDate = (dateStr) => {
//             if (!dateStr) return '';
//             return dateStr.split('T')[0];
//         };

//         // Check if employee has Sunday shift on the calculated Sunday date (in active shifts)
//         const hasActiveSundayShift = activeShifts.some(shift => {
//             const shiftDate = normalizeDate(shift.shift_date);
//             const calculatedDate = normalizeDate(calculatedSundayDate);
           
//             return shift.email === employee.email &&
//                    shift.shift_type === 'SUNDAY' &&
//                    shiftDate === calculatedDate;
//         });

//         // Check if employee has Sunday shift on the calculated Sunday date (in ALL historical shifts)
//         const hasHistoricalSundayShift = allHistoricalShifts.some(shift => {
//             const shiftDate = normalizeDate(shift.shift_date);
//             const calculatedDate = normalizeDate(calculatedSundayDate);
           
//             return shift.email === employee.email &&
//                    shift.shift_type === 'SUNDAY' &&
//                    shiftDate === calculatedDate;
//         });

//         if (hasActiveSundayShift || hasHistoricalSundayShift) {
//             showPopupMessage(`${employee.name} already has a Sunday shift on ${formatISOToHuman(calculatedSundayDate)}. Please delete the existing shift first.`, "warning");
//             return;
//         }

//         setSelectedSundayEmployees((prev) =>
//             prev.find(e => e.email === employee.email)
//                 ? prev.filter((e) => e.email !== employee.email)
//                 : [...prev, employee]
//         );
//     };

//     const deleteShiftEntry = async (shift) => {
//         if (!window.confirm("Are you sure you want to delete this shift entry?")) {
//             return;
//         }

//         try {
//             const token = localStorage.getItem("authToken");
//             const params = new URLSearchParams({
//                 email: shift.email,
//                 shift_date: new Date(shift.shift_date).toISOString(),
//                 shift_type: shift.shift_type,
//                 admin_email: user?.email
//             }).toString();

//             const response = await fetch(`${API_BASE_URL}/admin/shifts?${params}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (response.ok) {
//                 showPopupMessage("Shift entry deleted successfully!", "success");
//                 await fetchActiveShifts();
//                 await fetchHistoricalShifts();
//                 await fetchAllHistoricalShifts(); // Refresh all historical shifts
//             } else {
//                 const errorData = await response.json().catch(() => ({}));
//                 showPopupMessage(errorData.error || "Failed to delete shift entry", "error");
//             }
//         } catch (error) {
//             console.error("Error deleting shift:", error);
//             showPopupMessage("Network error. Please try again.", "error");
//         }
//     };

//     const handleSubmit = async () => {
//         if (!user) return;

//         if (selectedNightEmployees.length === 0 && selectedSundayEmployees.length === 0) {
//             showPopupMessage("Please select at least one employee for night or Sunday shift", "error");
//             return;
//         }

//         setLoading(true);
//         setError("");

//         try {
//             const token = localStorage.getItem("authToken");
//             const response = await fetch(`${API_BASE_URL}/admin/shifts/mark`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify({
//                     admin_name: user.name,
//                     admin_email: user.email,
//                     nightShiftDate: calculatedNightDate,
//                     sundayShiftDate: calculatedSundayDate,
//                     nightEmployees: selectedNightEmployees,
//                     sundayEmployees: selectedSundayEmployees
//                 })
//             });

//             if (response.ok) {
//                 showPopupMessage("Shifts marked successfully!", "success");
//                 await fetchActiveShifts();
//                 await fetchHistoricalShifts();
//                 await fetchAllHistoricalShifts(); // Refresh all historical shifts
//                 setSelectedNightEmployees([]);
//                 setSelectedSundayEmployees([]);
//             } else if (response.status === 409) {
//                 const errorData = await response.json();
//                 showPopupMessage(errorData.message || "Some shifts already exist", "warning");
//             } else {
//                 const errorData = await response.json();
//                 showPopupMessage(errorData.error || "Failed to mark shifts", "error");
//             }
//         } catch (error) {
//             console.error("Error submitting shifts:", error);
//             showPopupMessage("Network error. Please try again.", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const formatDate = (date) => {
//         return new Date(date).toLocaleDateString('en-US', {
//             weekday: 'short',
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//         });
//     };

//     const getFilteredHistory = () => {
//         if (!historicalShifts.length) return [];

//         const today = new Date();
//         const days = parseInt(selectedPeriod);

//         return historicalShifts
//             .filter((entry) => {
//                 const entryDate = new Date(entry.shift_date);
//                 const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24);
//                 const inPeriod = days ? diffDays <= days : true;

//                 if (!inPeriod) return false;

//                 if (selectedHistoryEmployee !== "All Employees" &&
//                     entry.name !== selectedHistoryEmployee) {
//                     return false;
//                 }

//                 return true;
//             })
//             .reduce((acc, entry) => {
//                 const dateKey = entry.shift_date.split('T')[0];
//                 if (!acc[dateKey]) {
//                     acc[dateKey] = [];
//                 }
//                 acc[dateKey].push({
//                     name: entry.name,
//                     email: entry.email,
//                     shift_date: entry.shift_date,
//                     shift_type: entry.shift_type,
//                     id: entry.id,
//                     canDelete: entry.canDelete || false
//                 });
//                 return acc;
//             }, {});
//     };

//     const groupedHistory = getFilteredHistory();

//     const groupActiveShifts = () => {
//         const grouped = {};
//         activeShifts.forEach(shift => {
//             const dateKey = shift.shift_date.split('T')[0];
//             const key = `${dateKey}-${shift.shift_type}`;
//             if (!grouped[key]) {
//                 grouped[key] = {
//                     date: dateKey,
//                     type: shift.shift_type,
//                     employees: []
//                 };
//             }
//             grouped[key].employees.push({
//                 name: shift.name,
//                 id: shift.id,
//                 email: shift.email
//             });
//         });
//         return grouped;
//     };

//     const groupedActiveShifts = groupActiveShifts();

//     const applyTempDate = () => {
//         setSelectedDate(tempDate);
//         setDatePopoverOpen(false);
//     };

//     const getTeamColorClass = (team) => {
//         return TEAM_COLORS[team] || "bg-gray-100 border-gray-300 text-gray-800";
//     };

//     // Filter employees by role, team, and search query
//     const filteredEmployees = employeesList.filter(emp => {
//         const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(emp.role || "Employee");
//         const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(emp.team);
//         const searchMatch = searchQuery === "" || 
//             emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             (emp.team && emp.team.toLowerCase().includes(searchQuery.toLowerCase()));
//         return roleMatch && teamMatch && searchMatch;
//     });

//     if (!user) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-slate-100">
//                 <div className="flex items-center gap-3">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
//                     <p>Loading...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="flex min-h-screen bg-gray-50">
//             {/* Popup Notification */}
//             {showPopup && (
//                 <div className="fixed top-20 right-4 z-50 max-w-md">
//                     <div className={`rounded-lg shadow-lg p-4 ${popupType === 'success' ? 'bg-green-500 text-white' :
//                         popupType === 'error' ? 'bg-red-500 text-white' :
//                             popupType === 'warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
//                         }`}>
//                         <div className="flex items-center justify-between">
//                             <p className="text-sm font-medium">{popupMessage}</p>
//                             <button
//                                 onClick={() => setShowPopup(false)}
//                                 className="ml-4 text-lg font-bold hover:opacity-70"
//                             >
//                                 ×
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Navbar */}
//             <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//                 <div className="max-w-full mx-auto px-4 sm:px-6">
//                     <div className="flex items-center justify-between h-16">
//                         <div className="flex items-center">
//                             <button
//                                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                                 className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
//                             >
//                                 <span className="sr-only">Toggle sidebar</span>
//                                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                                 </svg>
//                             </button>
//                             <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
//                                 <span className="block sm:inline">Admin Dashboard</span>
//                                 <span className="hidden sm:inline"> - Mark Extra Shifts</span>
//                             </h1>
//                         </div>

//                         <div className="hidden md:flex items-center space-x-4">
//                             <div className="flex items-center space-x-3">
//                                 <img
//                                     src={user?.picture}
//                                     alt={user?.name || "User"}
//                                     className="w-8 h-8 rounded-full border-2 border-slate-600"
//                                 />
//                                 <div className="text-right">
//                                     <div className="text-sm font-medium">{user?.name || "..."}</div>
//                                     <div className="text-xs text-slate-300">{user?.email || ""}</div>
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={handleLogout}
//                                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
//                             >
//                                 Logout
//                             </button>
//                         </div>

//                         <div className="md:hidden">
//                             <button
//                                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                                 className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
//                             >
//                                 {!mobileMenuOpen ? (
//                                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                                     </svg>
//                                 ) : (
//                                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                     </svg>
//                                 )}
//                             </button>
//                         </div>
//                     </div>

//                     {mobileMenuOpen && (
//                         <div className="md:hidden border-t border-slate-700">
//                             <div className="px-2 pt-2 pb-3 space-y-1">
//                                 <div className="flex items-center px-3 py-3 bg-slate-800 rounded-lg">
//                                     <img
//                                         src={user?.picture}
//                                         alt={user?.name || "User"}
//                                         className="w-10 h-10 rounded-full border-2 border-slate-600"
//                                     />
//                                     <div className="ml-3">
//                                         <div className="text-sm font-medium text-white">{user?.name || "..."}</div>
//                                         <div className="text-xs text-slate-300">{user?.email || ""}</div>
//                                     </div>
//                                 </div>
//                                 <div className="px-3">
//                                     <button
//                                         onClick={() => {
//                                             handleLogout();
//                                             setMobileMenuOpen(false);
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

//             {/* Layout */}
//             <div className="pt-16 flex w-full">
//                 {/* Mobile Sidebar Overlay and Sidebar */}
//                 {sidebarOpen && (
//                     <div className="fixed inset-0 z-40 lg:hidden">
//                         <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
//                         <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white shadow-xl overflow-y-auto">
//                             <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} />
//                         </aside>
//                     </div>
//                 )}

//                 {/* Desktop Sidebar */}
//                 <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//                     <SidebarLinks navigate={navigate} location={location} />
//                 </aside>

//                 {/* Main Content */}
//                 <main className="flex-1 lg:ml-72 overflow-y-auto w-full min-w-0">
//                     <div className="p-4 sm:p-6 w-full">
//                         {/* Error Display */}
//                         {error && (
//                             <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg w-full">
//                                 {error}
//                             </div>
//                         )}

//                         {/* Filters Card */}
//                         <div className="mb-6 rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
//                             <div className="flex items-center gap-2 mb-3 lg:mb-4">
//                                 <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
//                                 <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters & Date Selection</h3>
//                             </div>

//                             {/* Search Bar */}
//                             <div className="mb-4">
//                                 <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Search Employees</label>
//                                 <div className="relative">
//                                     <input
//                                         type="text"
//                                         value={searchQuery}
//                                         onChange={(e) => setSearchQuery(e.target.value)}
//                                         placeholder="Search by name, email, or team..."
//                                         className="w-full border rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
//                                     />
//                                     <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                                     </svg>
//                                     {searchQuery && (
//                                         <button
//                                             onClick={() => setSearchQuery("")}
//                                             className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
//                                         >
//                                             <XIcon className="w-4 h-4" />
//                                         </button>
//                                     )}
//                                 </div>
//                             </div>

//                             <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">
//                                 {/* Date Picker */}
//                                 <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
//                                     <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Select Reference Date</label>
//                                     <button
//                                         onClick={() => setDatePopoverOpen((o) => !o)}
//                                         className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                                     >
//                                         <span className="flex items-center gap-2 min-w-0 flex-1">
//                                             <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
//                                             <span className="text-xs lg:text-sm font-medium truncate">{formatISOToHuman(selectedDate)}</span>
//                                         </span>
//                                         <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
//                                             {selectedDate === todayISO ? "Today" : selectedDate > todayISO ? "Future" : "Past"}
//                                         </span>
//                                     </button>

//                                     {datePopoverOpen && (
//                                         <div className="absolute z-50 mt-2 w-[340px] right-0 lg:right-auto lg:left-0 rounded-xl border bg-white shadow-xl">
//                                             <div className="px-3 py-2 border-b flex items-center justify-between">
//                                                 <div className="text-xs font-medium text-slate-700">Select Date</div>
//                                                 <div className="flex items-center gap-1">
//                                                     <button
//                                                         onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), -1)))}
//                                                         className="p-1 hover:bg-slate-100 rounded"
//                                                         aria-label="Prev month"
//                                                     >
//                                                         <ChevronLeft className="w-4 h-4" />
//                                                     </button>
//                                                     <div className="text-xs font-medium w-[130px] text-center">{formatMonthKey(activeMonth)}</div>
//                                                     <button
//                                                         onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), 1)))}
//                                                         className="p-1 hover:bg-slate-100 rounded"
//                                                         aria-label="Next month"
//                                                     >
//                                                         <ChevronRight className="w-4 h-4" />
//                                                     </button>
//                                                 </div>
//                                             </div>

//                                             <CalendarGrid
//                                                 monthKey={activeMonth}
//                                                 selectedDate={tempDate}
//                                                 onPick={(iso) => setTempDate(iso)}
//                                             />

//                                             <div className="px-3 py-2 border-t flex items-center gap-2 justify-end">
//                                                 <button
//                                                     onClick={() => {
//                                                         setTempDate(todayISO);
//                                                         setSelectedDate(todayISO);
//                                                         setActiveMonth(toMonthKey(new Date(todayISO)));
//                                                         setDatePopoverOpen(false);
//                                                     }}
//                                                     className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
//                                                 >
//                                                     Today
//                                                 </button>
//                                                 <button onClick={applyTempDate} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>

//                                 {/* Role Filter */}
//                                 <div ref={roleRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                                     <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Filter by Role</label>
//                                     <button
//                                         onClick={() => setShowRoleDropdown((o) => !o)}
//                                         className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                                     >
//                                         <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                                             {selectedRoles.length === 0 ? (
//                                                 <span className="text-slate-600">No roles selected</span>
//                                             ) : selectedRoles.length === ROLES.length ? (
//                                                 <span className="text-slate-600">All roles</span>
//                                             ) : (
//                                                 selectedRoles.map((role) => (
//                                                     <span key={role} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                                                         {role}
//                                                     </span>
//                                                 ))
//                                             )}
//                                         </span>
//                                         <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showRoleDropdown ? "rotate-180" : "rotate-0"}`} />
//                                     </button>

//                                     {showRoleDropdown && (
//                                         <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                                             <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
//                                                 <span className="flex items-center gap-2">
//                                                     <UsersIcon className="w-3.5 h-3.5" />
//                                                     Select roles
//                                                 </span>
//                                                 <div className="flex items-center gap-2">
//                                                     <button onClick={() => setSelectedRoles([...ROLES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
//                                                     <button onClick={() => setSelectedRoles([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
//                                                 </div>
//                                             </div>
//                                             {ROLES.map((role) => (
//                                                 <label key={role} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                                                     <input
//                                                         type="checkbox"
//                                                         value={role}
//                                                         checked={selectedRoles.includes(role)}
//                                                         onChange={() =>
//                                                             setSelectedRoles((prev) =>
//                                                                 prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
//                                                             )
//                                                         }
//                                                         className="mr-2"
//                                                     />
//                                                     {role}
//                                                 </label>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>

//                                 {/* Team Filter */}
//                                 <div ref={teamRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
//                                     <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Filter by Teams</label>
//                                     <button
//                                         onClick={() => setShowTeamDropdown((o) => !o)}
//                                         className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
//                                     >
//                                         <span className="flex flex-wrap gap-1 min-w-0 flex-1">
//                                             {selectedTeams.length === 0 ? (
//                                                 <span className="text-slate-600">All teams</span>
//                                             ) : (
//                                                 selectedTeams.map((team) => (
//                                                     <span key={team} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColorClass(team)}`}>
//                                                         {team}
//                                                     </span>
//                                                 ))
//                                             )}
//                                         </span>
//                                         <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showTeamDropdown ? "rotate-180" : "rotate-0"}`} />
//                                     </button>

//                                     {showTeamDropdown && (
//                                         <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                                             <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
//                                                 <span className="flex items-center gap-2">
//                                                     <UsersIcon className="w-3.5 h-3.5" />
//                                                     Select teams
//                                                 </span>
//                                                 <div className="flex items-center gap-2">
//                                                     <button onClick={() => setSelectedTeams([...ALL_TEAMS])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
//                                                     <button onClick={() => setSelectedTeams([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
//                                                 </div>
//                                             </div>
//                                             {ALL_TEAMS.map((team) => (
//                                                 <label key={team} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
//                                                     <input
//                                                         type="checkbox"
//                                                         value={team}
//                                                         checked={selectedTeams.includes(team)}
//                                                         onChange={() =>
//                                                             setSelectedTeams((prev) =>
//                                                                 prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
//                                                             )
//                                                         }
//                                                         className="mr-2"
//                                                     />
//                                                     <span className={`inline-block w-3 h-3 rounded-full mr-2 ${TEAM_COLORS[team]?.split(' ')[0]}`}></span>
//                                                     {team}
//                                                 </label>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>

//                                 {/* Summary */}
//                                 <div className="w-full lg:w-auto lg:ml-auto">
//                                     <div className="text-xs text-slate-700">
//                                         <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-sky-100 text-sky-800">
//                                             <CalendarIcon className="w-4 h-4 flex-shrink-0" />
//                                             <span className="font-medium">
//                                                 {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'} available
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Main Content Layout */}
//                         <div className="space-y-6 w-full">
//                             {/* TOP SECTION - Employee Selection */}
//                             <div className="bg-white rounded-lg shadow p-4 lg:p-6 w-full">
//                                 <h2 className="text-xl font-semibold mb-2 text-gray-800">
//                                     Mark Shifts (Reference Date: {formatISOToHuman(selectedDate)})
//                                 </h2>
                                
//                                 {/* Shift Date Info */}
//                                 <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
//                                         <div className="flex items-center gap-2">
//                                             <span className="text-2xl">🌙</span>
//                                             <div>
//                                                 <div className="font-semibold text-blue-900">Night Shift Date:</div>
//                                                 <div className="text-blue-700 font-medium">{formatISOToHuman(calculatedNightDate)}</div>
//                                             </div>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <span className="text-2xl">📅</span>
//                                             <div>
//                                                 <div className="font-semibold text-purple-900">Sunday Shift Date:</div>
//                                                 <div className="text-purple-700 font-medium">{formatISOToHuman(calculatedSundayDate)}</div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="mt-2 text-xs text-gray-600 italic">
//                                         * Night shifts are marked for the selected reference date. Sunday shifts are marked for the next upcoming Sunday from the reference date.
//                                     </div>
//                                 </div>

//                                 {/* Loading state for employees */}
//                                 {employeesLoading ? (
//                                     <div className="text-center py-8">
//                                         <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                                         <p className="mt-2 text-gray-600">Loading employees...</p>
//                                     </div>
//                                 ) : filteredEmployees.length === 0 ? (
//                                     <div className="text-center py-8">
//                                         <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//                                         </svg>
//                                         <p className="mt-2 text-gray-500">No employees found with selected filters</p>
//                                     </div>
//                                 ) : (
//                                     <>
//                                         {/* Desktop Table View */}
//                                         {/* Desktop Table View - Fixed Height Version */}
// <div className="hidden sm:block overflow-x-auto w-full">
//     <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
//         <table className="w-full text-left border-collapse">
//             <thead className="sticky top-0 bg-gray-100 z-10">
//                 <tr>
//                     <th className="p-3 border-b font-semibold">Name</th>
//                     <th className="p-3 border-b font-semibold">Team</th>
//                     <th className="p-3 border-b font-semibold">Role</th>
//                     <th className="p-3 border-b font-semibold text-center">
//                         Night Shift
//                         <div className="text-xs font-normal text-gray-600">{formatISOToHuman(calculatedNightDate)}</div>
//                     </th>
//                     <th className="p-3 border-b font-semibold text-center">
//                         Sunday Shift
//                         <div className="text-xs font-normal text-gray-600">{formatISOToHuman(calculatedSundayDate)}</div>
//                     </th>
//                 </tr>
//             </thead>
//             <tbody>
//                 {filteredEmployees.map((employee, index) => {
//                     const nightShiftActive = activeShifts.some(shift =>
//                         shift.email === employee.email &&
//                         shift.shift_type === 'NIGHT' &&
//                         shift.shift_date.split('T')[0] === calculatedNightDate
//                     ) || allHistoricalShifts.some(shift =>
//                         shift.email === employee.email &&
//                         shift.shift_type === 'NIGHT' &&
//                         shift.shift_date.split('T')[0] === calculatedNightDate
//                     );
                    
//                     const sundayShiftActive = activeShifts.some(shift =>
//                         shift.email === employee.email &&
//                         shift.shift_type === 'SUNDAY' &&
//                         shift.shift_date.split('T')[0] === calculatedSundayDate
//                     ) || allHistoricalShifts.some(shift =>
//                         shift.email === employee.email &&
//                         shift.shift_type === 'SUNDAY' &&
//                         shift.shift_date.split('T')[0] === calculatedSundayDate
//                     );

//                     return (
//                         <tr key={employee.email} className={index % 2 === 0 ? "bg-pink-50/50" : "bg-white"}>
//                             <td className="p-3 whitespace-nowrap border-b">
//                                 <div className="flex flex-col">
//                                     <span className="font-medium">{employee.name}</span>
//                                     {(nightShiftActive || sundayShiftActive) && (
//                                         <div className="text-xs text-orange-600 mt-1">
//                                             {nightShiftActive && <span className="mr-2">🌙 Active</span>}
//                                             {sundayShiftActive && <span>📅 Active</span>}
//                                         </div>
//                                     )}
//                                 </div>
//                             </td>
//                             <td className="p-3 whitespace-nowrap border-b">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTeamColorClass(employee.team)}`}>
//                                     {employee.team || 'N/A'}
//                                 </span>
//                             </td>
//                             <td className="p-3 whitespace-nowrap border-b">
//                                 <span className="text-sm text-gray-600">{employee.role || 'Employee'}</span>
//                             </td>
//                             <td className="p-3 text-center whitespace-nowrap border-b">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedNightEmployees.find(e => e.email === employee.email) ? true : false}
//                                     onChange={() => handleNightCheckbox(employee)}
//                                     disabled={nightShiftActive}
//                                     className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${nightShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
//                                 />
//                                 {nightShiftActive && (
//                                     <div className="text-xs text-orange-600 mt-1">Already marked</div>
//                                 )}
//                             </td>
//                             <td className="p-3 text-center whitespace-nowrap border-b">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedSundayEmployees.find(e => e.email === employee.email) ? true : false}
//                                     onChange={() => handleSundayCheckbox(employee)}
//                                     disabled={sundayShiftActive}
//                                     className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${sundayShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
//                                 />
//                                 {sundayShiftActive && (
//                                     <div className="text-xs text-orange-600 mt-1">Already marked</div>
//                                 )}
//                             </td>
//                         </tr>
//                     );
//                 })}
//             </tbody>
//         </table>
//     </div>
// </div>

//                                         {/* Mobile Card View */}
//                                         <div className="sm:hidden space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2">
//                                             {filteredEmployees.map((employee) => {
//                                                 const nightShiftActive = activeShifts.some(shift =>
//                                                     shift.email === employee.email &&
//                                                     shift.shift_type === 'NIGHT' &&
//                                                     shift.shift_date.split('T')[0] === calculatedNightDate
//                                                 ) || allHistoricalShifts.some(shift =>
//                                                     shift.email === employee.email &&
//                                                     shift.shift_type === 'NIGHT' &&
//                                                     shift.shift_date.split('T')[0] === calculatedNightDate
//                                                 );
                                                
//                                                 const sundayShiftActive = activeShifts.some(shift =>
//                                                     shift.email === employee.email &&
//                                                     shift.shift_type === 'SUNDAY' &&
//                                                     shift.shift_date.split('T')[0] === calculatedSundayDate
//                                                 ) || allHistoricalShifts.some(shift =>
//                                                     shift.email === employee.email &&
//                                                     shift.shift_type === 'SUNDAY' &&
//                                                     shift.shift_date.split('T')[0] === calculatedSundayDate
//                                                 );

//                                                 return (
//                                                     <div key={employee.email} className="border border-gray-200 rounded-lg p-3">
//                                                         <div className="font-medium text-gray-800 mb-2">
//                                                             {employee.name}
//                                                         </div>
//                                                         <div className="flex items-center gap-2 mb-3">
//                                                             <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColorClass(employee.team)}`}>
//                                                                 {employee.team || 'N/A'}
//                                                             </span>
//                                                             <span className="text-xs text-gray-600">{employee.role || 'Employee'}</span>
//                                                         </div>
//                                                         {(nightShiftActive || sundayShiftActive) && (
//                                                             <div className="text-xs text-orange-600 mb-3">
//                                                                 {nightShiftActive && <span className="mr-2">🌙 Night shift active</span>}
//                                                                 {sundayShiftActive && <span>📅 Sunday shift active</span>}
//                                                             </div>
//                                                         )}
//                                                         <div className="space-y-2">
//                                                             <label className="flex items-center justify-between p-2 bg-blue-50 rounded">
//                                                                 <div>
//                                                                     <span className={`text-sm ${nightShiftActive ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
//                                                                         🌙 Night ({formatISOToHuman(calculatedNightDate)})
//                                                                     </span>
//                                                                 </div>
//                                                                 <input
//                                                                     type="checkbox"
//                                                                     checked={selectedNightEmployees.find(e => e.email === employee.email) ? true : false}
//                                                                     onChange={() => handleNightCheckbox(employee)}
//                                                                     disabled={nightShiftActive}
//                                                                     className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${nightShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
//                                                                 />
//                                                             </label>
//                                                             <label className="flex items-center justify-between p-2 bg-purple-50 rounded">
//                                                                 <div>
//                                                                     <span className={`text-sm ${sundayShiftActive ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
//                                                                         📅 Sunday ({formatISOToHuman(calculatedSundayDate)})
//                                                                     </span>
//                                                                 </div>
//                                                                 <input
//                                                                     type="checkbox"
//                                                                     checked={selectedSundayEmployees.find(e => e.email === employee.email) ? true : false}
//                                                                     onChange={() => handleSundayCheckbox(employee)}
//                                                                     disabled={sundayShiftActive}
//                                                                     className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${sundayShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
//                                                                 />
//                                                             </label>
//                                                         </div>
//                                                     </div>
//                                                 );
//                                             })}
//                                         </div>

//                                         {/* Submit Button */}
//                                         <div className="mt-6 flex justify-end">
//                                             <button
//                                                 className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                                                 onClick={handleSubmit}
//                                                 disabled={loading}
//                                             >
//                                                 {loading && (
//                                                     <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
//                                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                                         <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                                     </svg>
//                                                 )}
//                                                 {loading ? 'Submitting...' : 'SUBMIT'}
//                                             </button>
//                                         </div>
//                                     </>
//                                 )}
//                             </div>

//                             {/* MIDDLE SECTION - Active/Upcoming Shifts */}
//                             <div className="bg-white rounded-lg shadow p-4 lg:p-6">
//                                 <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Shifts</h2>

//                                 {activeShiftsLoading ? (
//                                     <div className="text-center py-8">
//                                         <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                                         <p className="mt-2 text-gray-600">Loading active shifts...</p>
//                                     </div>
//                                 ) : Object.keys(groupedActiveShifts).length === 0 ? (
//                                     <div className="text-center py-8">
//                                         <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                                             <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M4 9h16M7 11h5m-3 3h3" />
//                                             <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeWidth="2" />
//                                         </svg>
//                                         <p className="mt-2 text-gray-500">No upcoming shifts</p>
//                                     </div>
//                                 ) : (
//                                     <div className="grid gap-4 md:grid-cols-2">
//                                         {Object.keys(groupedActiveShifts)
//                                             .sort((a, b) => new Date(groupedActiveShifts[a].date) - new Date(groupedActiveShifts[b].date))
//                                             .map((key) => {
//                                                 const shiftGroup = groupedActiveShifts[key];
//                                                 const isNight = shiftGroup.type === 'NIGHT';

//                                                 return (
//                                                     <div key={key} className={`border-2 rounded-lg p-4 ${isNight ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
//                                                         <div className="flex items-center justify-between mb-3">
//                                                             <h3 className="font-medium text-gray-900">
//                                                                 {isNight ? '🌙 Night Shift' : '📅 Sunday Shift'}
//                                                             </h3>
//                                                             <span className="text-sm text-gray-600">
//                                                                 {formatDate(shiftGroup.date)}
//                                                             </span>
//                                                         </div>
//                                                         <div className="space-y-2">
//                                                             {shiftGroup.employees.map((employee) => (
//                                                                 <div key={`${key}-${employee.name}`} className="flex justify-between items-center py-1 px-2 bg-white rounded">
//                                                                     <span className="text-sm text-gray-700">{employee.name}</span>
//                                                                     <button
//                                                                         onClick={() =>
//                                                                             deleteShiftEntry({
//                                                                                 email: employee.email,
//                                                                                 shift_date: shiftGroup.date,
//                                                                                 shift_type: shiftGroup.type,
//                                                                                 id: employee.id
//                                                                             })
//                                                                         }
//                                                                         className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded-full transition-colors"
//                                                                         title="Delete shift entry"
//                                                                     >
//                                                                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                                                         </svg>
//                                                                     </button>
//                                                                 </div>
//                                                             ))}
//                                                         </div>
//                                                         <div className="mt-2 text-xs text-gray-500">
//                                                             {shiftGroup.employees.length} employee{shiftGroup.employees.length !== 1 ? 's' : ''}
//                                                         </div>
//                                                     </div>
//                                                 );
//                                             })}
//                                     </div>
//                                 )}
//                             </div>

//                             {/* BOTTOM SECTION - Historical Shifts */}
//                             <div className="bg-white rounded-lg shadow p-4 lg:p-6">
//                                 <h2 className="text-xl font-semibold mb-4 text-gray-800">Historical Shifts</h2>

//                                 {/* History Controls */}
//                                 <div className="grid gap-4 md:grid-cols-3 mb-6">
//                                     {/* Shift Type Toggle */}
//                                     <div className="flex bg-gray-100 p-1 rounded-lg">
//                                         <button
//                                             className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${historyType === 'night'
//                                                 ? 'bg-blue-600 text-white shadow-sm'
//                                                 : 'text-gray-600 hover:text-gray-900'
//                                                 }`}
//                                             onClick={() => setHistoryType('night')}
//                                         >
//                                             Night Shifts
//                                         </button>
//                                         <button
//                                             className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${historyType === 'sunday'
//                                                 ? 'bg-blue-600 text-white shadow-sm'
//                                                 : 'text-gray-600 hover:text-gray-900'
//                                                 }`}
//                                             onClick={() => setHistoryType('sunday')}
//                                         >
//                                             Sunday Shifts
//                                         </button>
//                                     </div>

//                                     {/* Employee Filter */}
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Filter by Employee
//                                         </label>
//                                         <select
//                                             value={selectedHistoryEmployee}
//                                             onChange={(e) => setSelectedHistoryEmployee(e.target.value)}
//                                             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                         >
//                                             <option value="All Employees">All Employees</option>
//                                             {employeesList.map((emp) => (
//                                                 <option key={emp.email} value={emp.name}>
//                                                     {emp.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     {/* Period Filter */}
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Time Period
//                                         </label>
//                                         <select
//                                             value={selectedPeriod}
//                                             onChange={(e) => setSelectedPeriod(e.target.value)}
//                                             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                         >
//                                             <option value="7">Last 7 days</option>
//                                             <option value="30">Last 30 days</option>
//                                             <option value="90">Last 90 days</option>
//                                             <option value="">All time</option>
//                                         </select>
//                                     </div>
//                                 </div>

//                                 {/* History List */}
//                                 <div className="space-y-3 max-h-96 overflow-y-auto">
//                                     {Object.keys(groupedHistory).length === 0 ? (
//                                         <div className="text-center py-8">
//                                             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                                             </svg>
//                                             <p className="mt-2 text-gray-500">No historical shifts found</p>
//                                         </div>
//                                     ) : (
//                                         Object.keys(groupedHistory)
//                                             .sort((a, b) => new Date(b) - new Date(a))
//                                             .map((date) => (
//                                                 <div key={date} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
//                                                     <div className="flex justify-between items-center mb-2">
//                                                         <h3 className="font-medium text-gray-900">
//                                                             {formatDate(date)}
//                                                         </h3>
//                                                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                                                             {groupedHistory[date].length} employee{groupedHistory[date].length !== 1 ? 's' : ''}
//                                                         </span>
//                                                     </div>
//                                                     <div className="space-y-1">
//                                                         {groupedHistory[date].map((employee) => (
//                                                             <div key={`${date}-${employee.name}-${employee.id}`} className="flex justify-between items-center py-1 px-2 bg-white rounded">
//                                                                 <span className="text-sm text-gray-700">{employee.name}</span>
//                                                                 <div className="flex items-center gap-2">
//                                                                     <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
//                                                                         Completed
//                                                                     </span>
//                                                                     <button
//                                                                         onClick={() =>
//                                                                             deleteShiftEntry({
//                                                                                 email: employee.email,
//                                                                                 shift_date: employee.shift_date,
//                                                                                 shift_type: employee.shift_type,
//                                                                                 id: employee.id
//                                                                             })
//                                                                         }
//                                                                         className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded-full transition-colors"
//                                                                         title="Delete shift entry"
//                                                                     >
//                                                                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                                                         </svg>
//                                                                     </button>
//                                                                 </div>
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 </div>
//                                             ))
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </div>
//     );
// }

// /* Sidebar Links Component for Admin Dashboard */
// function SidebarLinks({ navigate, location, close }) {
//   const [openWorklogs, setOpenWorklogs] = useState(false);
//   const [openProjects, setOpenProjects] = useState(false);

//   // Keep sections open if child page active
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
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/push-missing-request"); close(); }}
//         >
//           Push Missing Requests
//         </button>
//          {/* Teams */}
//          <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("handle-employees") ? "bg-gray-700" : ""}`}
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
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "add-unit-type" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/add-unit-type")}
//         >
//           Add Unit Type
//         </button>
//        <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin/mark-shift" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/mark-shift")}
//         >
//           Mark Extra Shift
//         </button>
//       </nav>
//     </div>
//   );
// }

// /* Calendar Grid Component */
// function CalendarGrid({ monthKey, selectedDate, onPick }) {
//     const monthDate = parseMonthKey(monthKey);
//     const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
//     const startWeekday = firstDay.getUTCDay();
//     const daysInMonth = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();

//     const cells = [];
//     for (let i = 0; i < startWeekday; i++) cells.push(null);
//     for (let d = 1; d <= daysInMonth; d++) {
//         const iso = stripToISO(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), d)));
//         cells.push(iso);
//     }
//     while (cells.length % 7 !== 0) cells.push(null);

//     const today = stripToISO(new Date());

//     return (
//         <div className="px-3 py-2">
//             <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
//                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
//                     <div key={d} className="text-center py-1">{d}</div>
//                 ))}
//             </div>
//             <div className="grid grid-cols-7 gap-2 px-1 pb-2">
//                 {cells.map((iso, idx) => {
//                     if (!iso) return <div key={idx} className="h-9" />;
//                     const selected = iso === selectedDate;
//                     const isToday = iso === today;
//                     return (
//                         <button
//                             key={idx}
//                             onClick={() => onPick(iso)}
//                             className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition hover:bg-blue-50
//                                 ${selected ? "bg-indigo-600 text-white font-semibold" : "bg-white"}
//                                 ${isToday ? "ring-1 ring-indigo-400" : ""}`}
//                             title={formatISOToHuman(iso)}
//                         >
//                             {new Date(iso).getUTCDate()}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// }

// /* Date helper functions */
// function stripToISO(d) {
//     const dt = new Date(d);
//     dt.setUTCHours(0, 0, 0, 0);
//     return dt.toISOString().split("T")[0];
// }

// function formatISOToHuman(value) {
//     if (!value) return "-";
//     const d = new Date(value);
//     if (isNaN(d.getTime())) return "-";
//     return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
// }

// function toMonthKey(d) {
//     return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
// }

// function parseMonthKey(key) {
//     const [y, m] = key.split("-").map((v) => parseInt(v, 10));
//     return new Date(Date.UTC(y, m - 1, 1));
// }

// function formatMonthKey(key) {
//     const d = parseMonthKey(key);
//     return d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
// }

// function addMonths(date, delta) {
//     return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
// }

// /* useOutclick hook */
// function useOutclick(onOut) {
//     const ref = useRef(null);
//     useEffect(() => {
//         function onDoc(e) {
//             if (!ref.current) return;
//             if (!ref.current.contains(e.target)) onOut?.();
//         }
//         document.addEventListener("mousedown", onDoc);
//         return () => document.removeEventListener("mousedown", onDoc);
//     }, [onOut]);
//     return ref;
// }

import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X as XIcon, Filter as FilterIcon, Users as UsersIcon } from "lucide-react";
import axios from 'axios';

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
  CSMA_Science: "bg-violet-100 border-violet-300 text-violet-800",
  CSMA_Intern: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
  CSMA_Technology: "bg-yellow-100 border-yellow-300 text-yellow-800",
  Animation_Maths: "bg-rose-100 border-rose-300 text-rose-800",
  InternScience: "bg-sky-100 border-sky-300 text-sky-800",
  "University&_Titles": "bg-stone-100 border-stone-300 text-stone-800",
};

const ALL_TEAMS = Object.keys(TEAM_COLORS);
const ROLES = ["Spoc", "Employee"];

export default function AdminMarkExtraShift() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Employee and shift states
    const [employeesList, setEmployeesList] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [selectedNightEmployees, setSelectedNightEmployees] = useState([]);
    const [selectedSundayEmployees, setSelectedSundayEmployees] = useState([]);

    // Active and historical shifts
    const [activeShifts, setActiveShifts] = useState([]);
    const [historicalShifts, setHistoricalShifts] = useState([]);
    const [allHistoricalShifts, setAllHistoricalShifts] = useState([]); // Store all historical shifts
    const [activeShiftsLoading, setActiveShiftsLoading] = useState(false);
    const [historyType, setHistoryType] = useState("night");

    // UI states
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState("success");
    const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState("All Employees");
    const [selectedPeriod, setSelectedPeriod] = useState("30");

    // Date picker states
    const todayISO = stripToISO(new Date());
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(todayISO);
    const [tempDate, setTempDate] = useState(todayISO);
    const [activeMonth, setActiveMonth] = useState(() => toMonthKey(new Date(todayISO)));
    const popRef = useOutclick(() => setDatePopoverOpen(false));

    // Calculated dates for night and Sunday shifts
    const [calculatedNightDate, setCalculatedNightDate] = useState(todayISO);
    const [calculatedSundayDate, setCalculatedSundayDate] = useState("");

    // Filter states
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const roleRef = useOutclick(() => setShowRoleDropdown(false));
    const [selectedRoles, setSelectedRoles] = useState([...ROLES]);

    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const teamRef = useOutclick(() => setShowTeamDropdown(false));
    const [selectedTeams, setSelectedTeams] = useState([]);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

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

    // Authentication check
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
                picture:
                    decoded.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        decoded.name
                    )}&background=random&color=fff`,
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

    // Show popup with auto-hide
    const showPopupMessage = (message, type = "success") => {
        setPopupMessage(message);
        setPopupType(type);
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
        }, 4000);
    };

    // Fetch all employees (Admin only)
    const fetchAllEmployees = async () => {
        if (!user) return;

        setEmployeesLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_BASE_URL}/admin/shifts/employees?email=${encodeURIComponent(user.email)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setEmployeesList(data);
            } else {
                console.error("Failed to fetch employees");
                setError("Failed to load employees");
                setEmployeesList([]);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            setError("Network error while loading employees");
            setEmployeesList([]);
        } finally {
            setEmployeesLoading(false);
        }
    };

    // Fetch active shifts (upcoming/current)
    const fetchActiveShifts = async () => {
        if (!user) return;

        setActiveShiftsLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_BASE_URL}/admin/shifts/active?email=${encodeURIComponent(user.email)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setActiveShifts(data);
            } else {
                console.error("Failed to fetch active shifts");
                setActiveShifts([]);
            }
        } catch (error) {
            console.error("Error fetching active shifts:", error);
            setActiveShifts([]);
        } finally {
            setActiveShiftsLoading(false);
        }
    };

    // Fetch historical shifts
    const fetchHistoricalShifts = async () => {
        if (!user) return;

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=${historyType}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setHistoricalShifts(data);
            } else {
                console.error("Failed to fetch history");
                setHistoricalShifts([]);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            setHistoricalShifts([]);
        }
    };

    // Fetch ALL historical shifts (both night and Sunday) for validation
    const fetchAllHistoricalShifts = async () => {
        if (!user) return;

        try {
            const token = localStorage.getItem("authToken");
            
            // Fetch both night and Sunday shifts in parallel
            const [nightResponse, sundayResponse] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=night`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                ),
                fetch(
                    `${API_BASE_URL}/admin/shifts/history?email=${encodeURIComponent(user.email)}&type=sunday`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )
            ]);

            const nightData = nightResponse.ok ? await nightResponse.json() : [];
            const sundayData = sundayResponse.ok ? await sundayResponse.json() : [];

            // Combine both arrays
            setAllHistoricalShifts([...nightData, ...sundayData]);
        } catch (error) {
            console.error("Error fetching all historical shifts:", error);
            setAllHistoricalShifts([]);
        }
    };

    // Fetch data when user is set or history type changes
    useEffect(() => {
        if (user) {
            fetchAllEmployees();
            fetchActiveShifts();
            fetchHistoricalShifts();
            fetchAllHistoricalShifts(); // Fetch all historical shifts for validation
        }
    }, [user, historyType]);

    // Clear selections when date changes
    useEffect(() => {
        setSelectedNightEmployees([]);
        setSelectedSundayEmployees([]);
    }, [selectedDate]);

    // Calculate night and Sunday shift dates based on selected date
    useEffect(() => {
        if (!selectedDate) return;

        const selected = new Date(selectedDate);

        // Night shift: Use the selected date itself
        setCalculatedNightDate(stripToISO(selected));

        // Sunday shift: Find the next upcoming Sunday from selected date
        const calculateNextSunday = (fromDate) => {
            const date = new Date(fromDate);
            const dayOfWeek = date.getDay();
            
            // If it's Sunday (0), get next Sunday (7 days ahead)
            // Otherwise, calculate days until next Sunday
            // const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
            const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
            
            date.setDate(date.getDate() + daysUntilSunday);
            return stripToISO(date);
        };

        // For Sunday shift, always find next Sunday from selected date
        const nextSunday = calculateNextSunday(selected);
        setCalculatedSundayDate(nextSunday);

    }, [selectedDate]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/");
    };

    // Checkbox change handlers with validation
    const handleNightCheckbox = (employee) => {
        // Normalize dates for comparison
        const normalizeDate = (dateStr) => {
            if (!dateStr) return '';
            return dateStr.split('T')[0];
        };

        // Check if employee has night shift on the calculated night date (in active shifts)
        const hasActiveNightShift = activeShifts.some(shift => {
            const shiftDate = normalizeDate(shift.shift_date);
            const calculatedDate = normalizeDate(calculatedNightDate);
           
            return shift.email === employee.email &&
                   shift.shift_type === 'NIGHT' &&
                   shiftDate === calculatedDate;
        });

        // Check if employee has night shift on the calculated night date (in ALL historical shifts)
        const hasHistoricalNightShift = allHistoricalShifts.some(shift => {
            const shiftDate = normalizeDate(shift.shift_date);
            const calculatedDate = normalizeDate(calculatedNightDate);
           
            return shift.email === employee.email &&
                   shift.shift_type === 'NIGHT' &&
                   shiftDate === calculatedDate;
        });

        if (hasActiveNightShift || hasHistoricalNightShift) {
            showPopupMessage(`${employee.name} already has a night shift on ${formatISOToHuman(calculatedNightDate)}. Please delete the existing shift first.`, "warning");
            return;
        }

        setSelectedNightEmployees((prev) =>
            prev.find(e => e.email === employee.email)
                ? prev.filter((e) => e.email !== employee.email)
                : [...prev, employee]
        );
    };

    const handleSundayCheckbox = (employee) => {
        // Normalize dates for comparison
        const normalizeDate = (dateStr) => {
            if (!dateStr) return '';
            return dateStr.split('T')[0];
        };

        // Check if employee has Sunday shift on the calculated Sunday date (in active shifts)
        const hasActiveSundayShift = activeShifts.some(shift => {
            const shiftDate = normalizeDate(shift.shift_date);
            const calculatedDate = normalizeDate(calculatedSundayDate);
           
            return shift.email === employee.email &&
                   shift.shift_type === 'SUNDAY' &&
                   shiftDate === calculatedDate;
        });

        // Check if employee has Sunday shift on the calculated Sunday date (in ALL historical shifts)
        const hasHistoricalSundayShift = allHistoricalShifts.some(shift => {
            const shiftDate = normalizeDate(shift.shift_date);
            const calculatedDate = normalizeDate(calculatedSundayDate);
           
            return shift.email === employee.email &&
                   shift.shift_type === 'SUNDAY' &&
                   shiftDate === calculatedDate;
        });

        if (hasActiveSundayShift || hasHistoricalSundayShift) {
            showPopupMessage(`${employee.name} already has a Sunday shift on ${formatISOToHuman(calculatedSundayDate)}. Please delete the existing shift first.`, "warning");
            return;
        }

        setSelectedSundayEmployees((prev) =>
            prev.find(e => e.email === employee.email)
                ? prev.filter((e) => e.email !== employee.email)
                : [...prev, employee]
        );
    };

    const deleteShiftEntry = async (shift) => {
        if (!window.confirm("Are you sure you want to delete this shift entry?")) {
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            const params = new URLSearchParams({
                email: shift.email,
                shift_date: new Date(shift.shift_date).toISOString(),
                shift_type: shift.shift_type,
                admin_email: user?.email
            }).toString();

            const response = await fetch(`${API_BASE_URL}/admin/shifts?${params}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showPopupMessage("Shift entry deleted successfully!", "success");
                await fetchActiveShifts();
                await fetchHistoricalShifts();
                await fetchAllHistoricalShifts(); // Refresh all historical shifts
            } else {
                const errorData = await response.json().catch(() => ({}));
                showPopupMessage(errorData.error || "Failed to delete shift entry", "error");
            }
        } catch (error) {
            console.error("Error deleting shift:", error);
            showPopupMessage("Network error. Please try again.", "error");
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        if (selectedNightEmployees.length === 0 && selectedSundayEmployees.length === 0) {
            showPopupMessage("Please select at least one employee for night or Sunday shift", "error");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/admin/shifts/mark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    admin_name: user.name,
                    admin_email: user.email,
                    nightShiftDate: calculatedNightDate,
                    sundayShiftDate: calculatedSundayDate,
                    nightEmployees: selectedNightEmployees,
                    sundayEmployees: selectedSundayEmployees
                })
            });

            if (response.ok) {
                showPopupMessage("Shifts marked successfully!", "success");
                await fetchActiveShifts();
                await fetchHistoricalShifts();
                await fetchAllHistoricalShifts(); // Refresh all historical shifts
                setSelectedNightEmployees([]);
                setSelectedSundayEmployees([]);
            } else if (response.status === 409) {
                const errorData = await response.json();
                showPopupMessage(errorData.message || "Some shifts already exist", "warning");
            } else {
                const errorData = await response.json();
                showPopupMessage(errorData.error || "Failed to mark shifts", "error");
            }
        } catch (error) {
            console.error("Error submitting shifts:", error);
            showPopupMessage("Network error. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFilteredHistory = () => {
        if (!historicalShifts.length) return [];

        const today = new Date();
        const days = parseInt(selectedPeriod);

        return historicalShifts
            .filter((entry) => {
                const entryDate = new Date(entry.shift_date);
                const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24);
                const inPeriod = days ? diffDays <= days : true;

                if (!inPeriod) return false;

                if (selectedHistoryEmployee !== "All Employees" &&
                    entry.name !== selectedHistoryEmployee) {
                    return false;
                }

                return true;
            })
            .reduce((acc, entry) => {
                const dateKey = entry.shift_date.split('T')[0];
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push({
                    name: entry.name,
                    email: entry.email,
                    shift_date: entry.shift_date,
                    shift_type: entry.shift_type,
                    id: entry.id,
                    canDelete: entry.canDelete || false
                });
                return acc;
            }, {});
    };

    const groupedHistory = getFilteredHistory();

    const groupActiveShifts = () => {
        const grouped = {};
        activeShifts.forEach(shift => {
            const dateKey = shift.shift_date.split('T')[0];
            const key = `${dateKey}-${shift.shift_type}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: dateKey,
                    type: shift.shift_type,
                    employees: []
                };
            }
            grouped[key].employees.push({
                name: shift.name,
                id: shift.id,
                email: shift.email
            });
        });
        return grouped;
    };

    const groupedActiveShifts = groupActiveShifts();

    const applyTempDate = () => {
        setSelectedDate(tempDate);
        setDatePopoverOpen(false);
    };

    const getTeamColorClass = (team) => {
        return TEAM_COLORS[team] || "bg-gray-100 border-gray-300 text-gray-800";
    };

    // Filter employees by role, team, and search query
    const filteredEmployees = employeesList.filter(emp => {
        const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(emp.role || "Employee");
        const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(emp.team);
        const searchMatch = searchQuery === "" || 
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.team && emp.team.toLowerCase().includes(searchQuery.toLowerCase()));
        return roleMatch && teamMatch && searchMatch;
    });

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

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Popup Notification */}
            {showPopup && (
                <div className="fixed top-20 right-4 z-50 max-w-md">
                    <div className={`rounded-lg shadow-lg p-4 ${popupType === 'success' ? 'bg-green-500 text-white' :
                        popupType === 'error' ? 'bg-red-500 text-white' :
                            popupType === 'warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                        }`}>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{popupMessage}</p>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="ml-4 text-lg font-bold hover:opacity-70"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar */}
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
                            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                                <span className="block sm:inline">Admin Dashboard</span>
                                <span className="hidden sm:inline"> - Mark Extra Shifts</span>
                            </h1>
                        </div>

                        <div className="hidden md:flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user?.picture}
                                    alt={user?.name || "User"}
                                    className="w-8 h-8 rounded-full border-2 border-slate-600"
                                />
                                <div className="text-right">
                                    <div className="text-sm font-medium">{user?.name || "..."}</div>
                                    <div className="text-xs text-slate-300">{user?.email || ""}</div>
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
                                    <img
                                        src={user?.picture}
                                        alt={user?.name || "User"}
                                        className="w-10 h-10 rounded-full border-2 border-slate-600"
                                    />
                                    <div className="ml-3">
                                        <div className="text-sm font-medium text-white">{user?.name || "..."}</div>
                                        <div className="text-xs text-slate-300">{user?.email || ""}</div>
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

            {/* Layout */}
            <div className="pt-16 flex w-full">
                {/* Mobile Sidebar Overlay and Sidebar */}
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
                <main className="flex-1 lg:ml-72 overflow-y-auto w-full min-w-0">
                    <div className="p-4 sm:p-6 w-full">
                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg w-full">
                                {error}
                            </div>
                        )}

                        {/* Filters Card */}
                        <div className="mb-6 rounded-xl lg:rounded-2xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4 lg:p-5">
                            <div className="flex items-center gap-2 mb-3 lg:mb-4">
                                <FilterIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
                                <h3 className="text-sm lg:text-base font-semibold text-slate-800 tracking-tight">Filters & Date Selection</h3>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Search Employees</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or team..."
                                        className="w-full border rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-end lg:gap-6">
                                {/* Date Picker */}
                                <div className="w-full lg:min-w-[280px] lg:w-auto relative" ref={popRef}>
                                    <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Select Reference Date</label>
                                    <button
                                        onClick={() => setDatePopoverOpen((o) => !o)}
                                        className="w-full border rounded-lg px-3 py-2 flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                                    >
                                        <span className="flex items-center gap-2 min-w-0 flex-1">
                                            <CalendarIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                            <span className="text-xs lg:text-sm font-medium truncate">{formatISOToHuman(selectedDate)}</span>
                                        </span>
                                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                            {selectedDate === todayISO ? "Today" : selectedDate > todayISO ? "Future" : "Past"}
                                        </span>
                                    </button>

                                    {datePopoverOpen && (
                                        <div className="absolute z-50 mt-2 w-[340px] right-0 lg:right-auto lg:left-0 rounded-xl border bg-white shadow-xl">
                                            <div className="px-3 py-2 border-b flex items-center justify-between">
                                                <div className="text-xs font-medium text-slate-700">Select Date</div>
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
                                                        onClick={() => setActiveMonth(toMonthKey(addMonths(parseMonthKey(activeMonth), 1)))}
                                                        className="p-1 hover:bg-slate-100 rounded"
                                                        aria-label="Next month"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <CalendarGrid
                                                monthKey={activeMonth}
                                                selectedDate={tempDate}
                                                onPick={(iso) => setTempDate(iso)}
                                            />

                                            <div className="px-3 py-2 border-t flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setTempDate(todayISO);
                                                        setSelectedDate(todayISO);
                                                        setActiveMonth(toMonthKey(new Date(todayISO)));
                                                        setDatePopoverOpen(false);
                                                    }}
                                                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                                                >
                                                    Today
                                                </button>
                                                <button onClick={applyTempDate} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Role Filter */}
                                <div ref={roleRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                                    <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Filter by Role</label>
                                    <button
                                        onClick={() => setShowRoleDropdown((o) => !o)}
                                        className="w-full border rounded-lg px-3 py-2 text-xs lg:text-sm text-left flex justify-between items-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-slate-700"
                                    >
                                        <span className="flex flex-wrap gap-1 min-w-0 flex-1">
                                            {selectedRoles.length === 0 ? (
                                                <span className="text-slate-600">No roles selected</span>
                                            ) : selectedRoles.length === ROLES.length ? (
                                                <span className="text-slate-600">All roles</span>
                                            ) : (
                                                selectedRoles.map((role) => (
                                                    <span key={role} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        {role}
                                                    </span>
                                                ))
                                            )}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${showRoleDropdown ? "rotate-180" : "rotate-0"}`} />
                                    </button>

                                    {showRoleDropdown && (
                                        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            <div className="px-3 py-2 text-xs text-slate-500 border-b bg-slate-50 flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <UsersIcon className="w-3.5 h-3.5" />
                                                    Select roles
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setSelectedRoles([...ROLES])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Select All</button>
                                                    <button onClick={() => setSelectedRoles([])} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
                                                </div>
                                            </div>
                                            {ROLES.map((role) => (
                                                <label key={role} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs lg:text-sm">
                                                    <input
                                                        type="checkbox"
                                                        value={role}
                                                        checked={selectedRoles.includes(role)}
                                                        onChange={() =>
                                                            setSelectedRoles((prev) =>
                                                                prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                                                            )
                                                        }
                                                        className="mr-2"
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Team Filter */}
                                <div ref={teamRef} className="relative w-full lg:min-w-[260px] lg:w-auto">
                                    <label className="block text-xs lg:text-sm font-medium text-slate-700 mb-1">Filter by Teams</label>
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

                                {/* Summary */}
                                <div className="w-full lg:w-auto lg:ml-auto">
                                    <div className="text-xs text-slate-700">
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-sky-100 text-sky-800">
                                            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-medium">
                                                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'} available
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Layout */}
                        <div className="space-y-6 w-full">
                            {/* TOP SECTION - Employee Selection */}
                            <div className="bg-white rounded-lg shadow p-4 lg:p-6 w-full">
                                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                                    Mark Shifts (Reference Date: {formatISOToHuman(selectedDate)})
                                </h2>
                                
                                {/* Shift Date Info */}
                                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🌙</span>
                                            <div>
                                                <div className="font-semibold text-blue-900">Night Shift Date:</div>
                                                <div className="text-blue-700 font-medium">{formatISOToHuman(calculatedNightDate)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📅</span>
                                            <div>
                                                <div className="font-semibold text-purple-900">Sunday Shift Date:</div>
                                                <div className="text-purple-700 font-medium">{formatISOToHuman(calculatedSundayDate)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-600 italic">
                                        * Night shifts are marked for the selected reference date. Sunday shifts are marked for the next upcoming Sunday from the reference date.
                                    </div>
                                </div>

                                {/* Loading state for employees */}
                                {employeesLoading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-600">Loading employees...</p>
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No employees found with selected filters</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        {/* Desktop Table View - Fixed Height Version */}
<div className="hidden sm:block overflow-x-auto w-full">
    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                    <th className="p-3 border-b font-semibold">Name</th>
                    <th className="p-3 border-b font-semibold">Team</th>
                    <th className="p-3 border-b font-semibold">Role</th>
                    <th className="p-3 border-b font-semibold text-center">
                        Night Shift
                        <div className="text-xs font-normal text-gray-600">{formatISOToHuman(calculatedNightDate)}</div>
                    </th>
                    <th className="p-3 border-b font-semibold text-center">
                        Sunday Shift
                        <div className="text-xs font-normal text-gray-600">{formatISOToHuman(calculatedSundayDate)}</div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {filteredEmployees.map((employee, index) => {
                    const nightShiftActive = activeShifts.some(shift =>
                        shift.email === employee.email &&
                        shift.shift_type === 'NIGHT' &&
                        shift.shift_date.split('T')[0] === calculatedNightDate
                    ) || allHistoricalShifts.some(shift =>
                        shift.email === employee.email &&
                        shift.shift_type === 'NIGHT' &&
                        shift.shift_date.split('T')[0] === calculatedNightDate
                    );
                    
                    const sundayShiftActive = activeShifts.some(shift =>
                        shift.email === employee.email &&
                        shift.shift_type === 'SUNDAY' &&
                        shift.shift_date.split('T')[0] === calculatedSundayDate
                    ) || allHistoricalShifts.some(shift =>
                        shift.email === employee.email &&
                        shift.shift_type === 'SUNDAY' &&
                        shift.shift_date.split('T')[0] === calculatedSundayDate
                    );

                    return (
                        <tr key={employee.email} className={index % 2 === 0 ? "bg-pink-50/50" : "bg-white"}>
                            <td className="p-3 whitespace-nowrap border-b">
                                <div className="flex flex-col">
                                    <span className="font-medium">{employee.name}</span>
                                    {(nightShiftActive || sundayShiftActive) && (
                                        <div className="text-xs text-orange-600 mt-1">
                                            {nightShiftActive && <span className="mr-2">🌙 Active</span>}
                                            {sundayShiftActive && <span>📅 Active</span>}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="p-3 whitespace-nowrap border-b">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTeamColorClass(employee.team)}`}>
                                    {employee.team || 'N/A'}
                                </span>
                            </td>
                            <td className="p-3 whitespace-nowrap border-b">
                                <span className="text-sm text-gray-600">{employee.role || 'Employee'}</span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap border-b">
                                <input
                                    type="checkbox"
                                    checked={selectedNightEmployees.find(e => e.email === employee.email) ? true : false}
                                    onChange={() => handleNightCheckbox(employee)}
                                    disabled={nightShiftActive}
                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${nightShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                {nightShiftActive && (
                                    <div className="text-xs text-orange-600 mt-1">Already marked</div>
                                )}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap border-b">
                                <input
                                    type="checkbox"
                                    checked={selectedSundayEmployees.find(e => e.email === employee.email) ? true : false}
                                    onChange={() => handleSundayCheckbox(employee)}
                                    disabled={sundayShiftActive}
                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${sundayShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                {sundayShiftActive && (
                                    <div className="text-xs text-orange-600 mt-1">Already marked</div>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
</div>

                                        {/* Mobile Card View */}
                                        <div className="sm:hidden space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                            {filteredEmployees.map((employee) => {
                                                const nightShiftActive = activeShifts.some(shift =>
                                                    shift.email === employee.email &&
                                                    shift.shift_type === 'NIGHT' &&
                                                    shift.shift_date.split('T')[0] === calculatedNightDate
                                                ) || allHistoricalShifts.some(shift =>
                                                    shift.email === employee.email &&
                                                    shift.shift_type === 'NIGHT' &&
                                                    shift.shift_date.split('T')[0] === calculatedNightDate
                                                );
                                                
                                                const sundayShiftActive = activeShifts.some(shift =>
                                                    shift.email === employee.email &&
                                                    shift.shift_type === 'SUNDAY' &&
                                                    shift.shift_date.split('T')[0] === calculatedSundayDate
                                                ) || allHistoricalShifts.some(shift =>
                                                    shift.email === employee.email &&
                                                    shift.shift_type === 'SUNDAY' &&
                                                    shift.shift_date.split('T')[0] === calculatedSundayDate
                                                );

                                                return (
                                                    <div key={employee.email} className="border border-gray-200 rounded-lg p-3">
                                                        <div className="font-medium text-gray-800 mb-2">
                                                            {employee.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTeamColorClass(employee.team)}`}>
                                                                {employee.team || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-gray-600">{employee.role || 'Employee'}</span>
                                                        </div>
                                                        {(nightShiftActive || sundayShiftActive) && (
                                                            <div className="text-xs text-orange-600 mb-3">
                                                                {nightShiftActive && <span className="mr-2">🌙 Night shift active</span>}
                                                                {sundayShiftActive && <span>📅 Sunday shift active</span>}
                                                            </div>
                                                        )}
                                                        <div className="space-y-2">
                                                            <label className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                                <div>
                                                                    <span className={`text-sm ${nightShiftActive ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
                                                                        🌙 Night ({formatISOToHuman(calculatedNightDate)})
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedNightEmployees.find(e => e.email === employee.email) ? true : false}
                                                                    onChange={() => handleNightCheckbox(employee)}
                                                                    disabled={nightShiftActive}
                                                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${nightShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </label>
                                                            <label className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                                                <div>
                                                                    <span className={`text-sm ${sundayShiftActive ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
                                                                        📅 Sunday ({formatISOToHuman(calculatedSundayDate)})
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSundayEmployees.find(e => e.email === employee.email) ? true : false}
                                                                    onChange={() => handleSundayCheckbox(employee)}
                                                                    disabled={sundayShiftActive}
                                                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${sundayShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                onClick={handleSubmit}
                                                disabled={loading}
                                            >
                                                {loading && (
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                )}
                                                {loading ? 'Submitting...' : 'SUBMIT'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* MIDDLE SECTION - Active/Upcoming Shifts */}
                            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Shifts</h2>

                                {activeShiftsLoading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-600">Loading active shifts...</p>
                                    </div>
                                ) : Object.keys(groupedActiveShifts).length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M4 9h16M7 11h5m-3 3h3" />
                                            <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeWidth="2" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No upcoming shifts</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {Object.keys(groupedActiveShifts)
                                            .sort((a, b) => new Date(groupedActiveShifts[a].date) - new Date(groupedActiveShifts[b].date))
                                            .map((key) => {
                                                const shiftGroup = groupedActiveShifts[key];
                                                const isNight = shiftGroup.type === 'NIGHT';

                                                return (
                                                    <div key={key} className={`border-2 rounded-lg p-4 ${isNight ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-medium text-gray-900">
                                                                {isNight ? '🌙 Night Shift' : '📅 Sunday Shift'}
                                                            </h3>
                                                            <span className="text-sm text-gray-600">
                                                                {formatDate(shiftGroup.date)}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {shiftGroup.employees.map((employee) => (
                                                                <div key={`${key}-${employee.name}`} className="flex justify-between items-center py-1 px-2 bg-white rounded">
                                                                    <span className="text-sm text-gray-700">{employee.name}</span>
                                                                    <button
                                                                        onClick={() =>
                                                                            deleteShiftEntry({
                                                                                email: employee.email,
                                                                                shift_date: shiftGroup.date,
                                                                                shift_type: shiftGroup.type,
                                                                                id: employee.id
                                                                            })
                                                                        }
                                                                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded-full transition-colors"
                                                                        title="Delete shift entry"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {shiftGroup.employees.length} employee{shiftGroup.employees.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* BOTTOM SECTION - Historical Shifts */}
                            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Historical Shifts</h2>

                                {/* History Controls */}
                                <div className="grid gap-4 md:grid-cols-3 mb-6">
                                    {/* Shift Type Toggle */}
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${historyType === 'night'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            onClick={() => setHistoryType('night')}
                                        >
                                            Night Shifts
                                        </button>
                                        <button
                                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${historyType === 'sunday'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            onClick={() => setHistoryType('sunday')}
                                        >
                                            Sunday Shifts
                                        </button>
                                    </div>

                                    {/* Employee Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Filter by Employee
                                        </label>
                                        <select
                                            value={selectedHistoryEmployee}
                                            onChange={(e) => setSelectedHistoryEmployee(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="All Employees">All Employees</option>
                                            {employeesList.map((emp) => (
                                                <option key={emp.email} value={emp.name}>
                                                    {emp.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Period Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Time Period
                                        </label>
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => setSelectedPeriod(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="7">Last 7 days</option>
                                            <option value="30">Last 30 days</option>
                                            <option value="90">Last 90 days</option>
                                            <option value="">All time</option>
                                        </select>
                                    </div>
                                </div>

                                {/* History List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {Object.keys(groupedHistory).length === 0 ? (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="mt-2 text-gray-500">No historical shifts found</p>
                                        </div>
                                    ) : (
                                        Object.keys(groupedHistory)
                                            .sort((a, b) => new Date(b) - new Date(a))
                                            .map((date) => (
                                                <div key={date} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="font-medium text-gray-900">
                                                            {formatDate(date)}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {groupedHistory[date].length} employee{groupedHistory[date].length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {groupedHistory[date].map((employee) => (
                                                            <div key={`${date}-${employee.name}-${employee.id}`} className="flex justify-between items-center py-1 px-2 bg-white rounded">
                                                                <span className="text-sm text-gray-700">{employee.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                                        Completed
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            deleteShiftEntry({
                                                                                email: employee.email,
                                                                                shift_date: employee.shift_date,
                                                                                shift_type: employee.shift_type,
                                                                                id: employee.id
                                                                            })
                                                                        }
                                                                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded-full transition-colors"
                                                                        title="Delete shift entry"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

/* Sidebar Links Component for Admin Dashboard */
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
          {projectPendingCount > 0 && (
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "/admin/mark-shift" ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/mark-shift")}
        >
          Mark Extra Shift
        </button>
      </nav>
    </div>
  );
}

/* Calendar Grid Component */
function CalendarGrid({ monthKey, selectedDate, onPick }) {
    const monthDate = parseMonthKey(monthKey);
    const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
    const startWeekday = firstDay.getUTCDay();
    const daysInMonth = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = stripToISO(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), d)));
        cells.push(iso);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const today = stripToISO(new Date());

    return (
        <div className="px-3 py-2">
            <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2 px-1 pb-2">
                {cells.map((iso, idx) => {
                    if (!iso) return <div key={idx} className="h-9" />;
                    const selected = iso === selectedDate;
                    const isToday = iso === today;
                    return (
                        <button
                            key={idx}
                            onClick={() => onPick(iso)}
                            className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition hover:bg-blue-50
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

/* Date helper functions */
function stripToISO(d) {
    const dt = new Date(d);
    dt.setUTCHours(0, 0, 0, 0);
    return dt.toISOString().split("T")[0];
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

/* useOutclick hook */
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
