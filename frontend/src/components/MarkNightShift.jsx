import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate,useLocation } from "react-router-dom";

export default function MarkNightShift() {
    const navigate = useNavigate();
    const location= useLocation();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [approveMissingCount, setApproveMissingCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const API_BASE_URL = import.meta.env?.VITE_API_BASE;

    // Employee and shift states
    const [employeesList, setEmployeesList] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [selectedNightEmployees, setSelectedNightEmployees] = useState([]);
    const [selectedSundayEmployees, setSelectedSundayEmployees] = useState([]);

    // Active and historical shifts
    const [activeShifts, setActiveShifts] = useState([]);
    const [historicalShifts, setHistoricalShifts] = useState([]);
    const [activeShiftsLoading, setActiveShiftsLoading] = useState(false);
    const [historyType, setHistoryType] = useState("night");

    // UI states
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState("success");
    const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState("All Employees");
    const [selectedPeriod, setSelectedPeriod] = useState("30");

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

    // Show popup with auto-hide
    const showPopupMessage = (message, type = "success") => {
        setPopupMessage(message);
        setPopupType(type);
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
        }, 4000);
    };

    // Fetch employees under this SPOC
    const fetchEmployeesUnderSpoc = async () => {
        if (!user) return;

        setEmployeesLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_BASE_URL}/shifts/employees-under-spoc?spoc_email=${encodeURIComponent(user.email)}`,
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
                setError("Failed to load employees under your supervision");
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
                `${API_BASE_URL}/shifts/active?spoc_email=${encodeURIComponent(user.email)}`,
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
                `${API_BASE_URL}/shifts/history?spoc_email=${encodeURIComponent(user.email)}&type=${historyType}`,
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

    // Fetch data when user is set or history type changes
    useEffect(() => {
        if (user) {
            fetchEmployeesUnderSpoc();
            fetchActiveShifts();
            fetchHistoricalShifts();
        }
    }, [user, historyType]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/");
    };

    // Checkbox change handlers with validation
    const handleNightCheckbox = (employee) => {
        // Check if this employee already has a night shift active
        const hasActiveNightShift = activeShifts.some(shift =>
            shift.email === employee.email && shift.shift_type === 'NIGHT'
        );

        if (hasActiveNightShift) {
            showPopupMessage(`${employee.name} already has an active night shift. Please delete the existing shift first.`, "warning");
            return;
        }

        setSelectedNightEmployees((prev) =>
            prev.find(e => e.email === employee.email)
                ? prev.filter((e) => e.email !== employee.email)
                : [...prev, employee]
        );
    };

    const handleSundayCheckbox = (employee) => {
        // Check if this employee already has a Sunday shift active
        const hasActiveSundayShift = activeShifts.some(shift =>
            shift.email === employee.email && shift.shift_type === 'SUNDAY'
        );

        if (hasActiveSundayShift) {
            showPopupMessage(`${employee.name} already has an active Sunday shift. Please delete the existing shift first.`, "warning");
            return;
        }

        setSelectedSundayEmployees((prev) =>
            prev.find(e => e.email === employee.email)
                ? prev.filter((e) => e.email !== employee.email)
                : [...prev, employee]
        );
    };

    // Check if employee has active shift (only for today's night shift or upcoming Sunday)
    const hasActiveNightShift = (employeeEmail) => {
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];

        return activeShifts.some(shift => {
            const shiftDateString = shift.shift_date.split('T')[0];
            return shift.email === employeeEmail &&
                shift.shift_type === 'NIGHT' &&
                shiftDateString === todayDateString;
        });
    };

    const hasActiveSundayShift = (employeeEmail) => {
        // Get upcoming Sunday
        const today = new Date();
        const getNextSunday = (date) => {
            const sunday = new Date(date);
            // const diff = (7 - date.getDay()) % 7 || 7;
            const diff = date.getDay() === 0 ? 0 : (7 - date.getDay());
            sunday.setDate(date.getDate() + diff);
            return sunday;
        };
        const upcomingSunday = getNextSunday(today);
        const sundayDateString = upcomingSunday.toISOString().split('T')[0];

        return activeShifts.some(shift => {
            const shiftDateString = shift.shift_date.split('T')[0];
            return shift.email === employeeEmail &&
                shift.shift_type === 'SUNDAY' &&
                shiftDateString === sundayDateString;
        });
    };


    // const deleteShiftEntry = async (shift) => {
    //     if (!window.confirm("Are you sure you want to delete this shift entry?")) {
    //         return;
    //     }

    //     try {
    //         const token = localStorage.getItem("authToken");

    //         // Build query params. We send shift_date as ISO (UTC)
    //         const params = new URLSearchParams({
    //             email: shift.email,
    //             shift_date: new Date(shift.shift_date).toISOString(),
    //             shift_type: shift.shift_type,
    //             spoc_email: shift.spoc_email
    //         }).toString();

    //         const response = await fetch(`${API_BASE_URL}/shifts?${params}`, {
    //             method: 'DELETE',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         if (response.ok) {
    //             showPopupMessage("Shift entry deleted successfully!", "success");
    //             await fetchActiveShifts(); // Refresh active shifts
    //             await fetchHistoricalShifts(); // Refresh historical data
    //         } else {
    //             const errorData = await response.json().catch(() => ({}));
    //             showPopupMessage(errorData.error || "Failed to delete shift entry", "error");
    //         }
    //     } catch (error) {
    //         console.error("Error deleting shift:", error);
    //         showPopupMessage("Network error. Please try again.", "error");
    //     }
    // };

    const deleteShiftEntry = async (shift) => {
        if (!window.confirm("Are you sure you want to delete this shift entry?")) {
            return;
        }

        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/shifts/${shift.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showPopupMessage("Shift entry deleted successfully!", "success");
                await fetchActiveShifts();
                await fetchHistoricalShifts();
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
            const response = await fetch(`${API_BASE_URL}/shifts/mark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    spoc_name: user.name,
                    spoc_email: user.email,
                    nightEmployees: selectedNightEmployees,
                    sundayEmployees: selectedSundayEmployees
                })
            });

            if (response.ok) {
                const result = await response.json();
                showPopupMessage("Shifts marked successfully!", "success");
                // Refresh data
                await fetchActiveShifts();
                await fetchHistoricalShifts();
                // Clear selections
                setSelectedNightEmployees([]);
                setSelectedSundayEmployees([]);
            } else if (response.status === 409) {
                // Conflict - some shifts already exist
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

    // Helper function to get formatted date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get filtered historical data
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
                    id: entry.id,
                    canDelete: entry.canDelete || false
                });
                return acc;
            }, {});
    };

    const groupedHistory = getFilteredHistory();

    // Group active shifts by date and type
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
                        {/* Left */}
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
                                <span className="block sm:inline">SPOC Dashboard</span>
                                <span className="hidden sm:inline"> - Mark Extra Shifts</span>
                            </h1>
                        </div>

                        {/* Right */}
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

                        {/* Mobile menu button */}
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

                    {/* Mobile dropdown */}
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
                            <SidebarLinks navigate={navigate} location={location} close={() => setSidebarOpen(false)} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
                        </aside>
                    </div>
                )}

                {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
                <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
                    <SidebarLinks navigate={navigate} location={location} unreadCount={unreadCount} approveMissingCount={approveMissingCount} />
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-72 overflow-y-auto w-full min-w-0">
                    <div className="p-4 sm:p-6 w-full">
                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Main Content Layout */}
                        <div className="space-y-6">
                            {/* TOP SECTION - Employee Selection */}
                            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Mark New Shifts</h2>

                                {/* Loading state for employees */}
                                {employeesLoading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-600">Loading employees...</p>
                                    </div>
                                ) : employeesList.length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No employees found under your supervision</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                       <div className="hidden sm:block overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="p-3 border-b font-semibold bg-gray-100">Name</th>
                                                        <th className="p-3 border-b font-semibold bg-gray-100 text-center">Night Shift</th>
                                                        <th className="p-3 border-b font-semibold bg-gray-100 text-center">Sunday Shift</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {employeesList.map((employee, index) => {
                                                        const nightShiftActive = hasActiveNightShift(employee.email);
                                                        const sundayShiftActive = hasActiveSundayShift(employee.email);

                                                        return (
                                                            <tr key={employee.email} className={index % 2 === 0 ? "bg-pink-50/50" : ""}>
                                                                <td className="p-3">
                                                                    <div className="flex flex-col">
                                                                        <span>{employee.name}</span>
                                                                        {(nightShiftActive || sundayShiftActive) && (
                                                                            <div className="text-xs text-orange-600 mt-1">
                                                                                {nightShiftActive && <span className="mr-2">🌙 Active</span>}
                                                                                {sundayShiftActive && <span>📅 Active</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-center">
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
                                                                <td className="p-3 text-center">
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

                                        {/* Mobile Card View */}
                                        <div className="sm:hidden space-y-3">
                                            {employeesList.map((employee) => {
                                                const nightShiftActive = hasActiveNightShift(employee.email);
                                                const sundayShiftActive = hasActiveSundayShift(employee.email);

                                                return (
                                                    <div key={employee.email} className="border border-gray-200 rounded-lg p-3" >
                                                        <div className="font-medium text-gray-800 mb-3">
                                                            {employee.name}
                                                            {(nightShiftActive || sundayShiftActive) && (
                                                                <div className="text-xs text-orange-600 mt-1">
                                                                    {nightShiftActive && <span className="mr-2">🌙 Night shift active</span>}
                                                                    {sundayShiftActive && <span>📅 Sunday shift active</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <label className="flex items-center space-x-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedNightEmployees.find(e => e.email === employee.email) ? true : false}
                                                                    onChange={() => handleNightCheckbox(employee)}
                                                                    disabled={nightShiftActive}
                                                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${nightShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                                <span className={`text-sm ${nightShiftActive ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    Night Shift {nightShiftActive ? '(Active)' : ''}
                                                                </span>
                                                            </label>
                                                            <label className="flex items-center space-x-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSundayEmployees.find(e => e.email === employee.email) ? true : false}
                                                                    onChange={() => handleSundayCheckbox(employee)}
                                                                    disabled={sundayShiftActive}
                                                                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${sundayShiftActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                                <span className={`text-sm ${sundayShiftActive ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    Sunday Shift {sundayShiftActive ? '(Active)' : ''}
                                                                </span>
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
                                        {/* NEW calendar-clock icon */}
                                        <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M4 9h16M7 11h5m-3 3h3" />
                                            <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeWidth="2" />
                                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 15v-2m0 0l2 2m-2-2l-2 2" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No upcoming shifts</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {Object.keys(groupedActiveShifts)
                                            .sort((a, b) => new Date(groupedActiveShifts[a].date) - new Date(groupedActiveShifts[b].date))
                                            .map((key) => {
                                                const shiftGroup = groupedActiveShifts[key];
                                                const isTonight = shiftGroup.type === 'NIGHT';

                                                return (
                                                    <div key={key} className={`border-2 rounded-lg p-4 ${isTonight ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-medium text-gray-900">
                                                                {isTonight ? '🌙 Night Shift' : '📅 Sunday Shift'}
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
                                                                                // required by your DELETE controller (composite-key path)
                                                                                email: employee.email,
                                                                                shift_date: shiftGroup.date,        // e.g. "2025-09-11" (we’ll ISO it inside deleteShiftEntry)
                                                                                shift_type: shiftGroup.type,        // "NIGHT" or "SUNDAY"
                                                                                spoc_email: user?.email,            // in case API doesn’t echo spoc_email back
                                                                                // optional: keep id for future-proofing if you later use /:id deletes
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
                                                            <div key={`${date}-${employee.name}`} className="flex justify-between items-center py-1 px-2 bg-white rounded">
                                                                <span className="text-sm text-gray-700">{employee.name}</span>
                                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                                    Completed
                                                                </span>
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
/* Sidebar Links Component for SPOC Dashboard */
function SidebarLinks({ navigate, location, close, unreadCount = 0, approveMissingCount = 0 }) {
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
                {/* Home */}
                <button
                    className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${isHomePage ? "bg-gray-700" : ""
                        }`}
                    onClick={() => handleNavigation("/spoc-dashboard")}
                >
                    Home
                </button>

                {/* Approve Worklogs */}
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

                {/* Add Project */}
                <button
                    className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
                        }`}
                    onClick={() => handleNavigation("/spoc/add-project")}
                >
                    Add Project
                </button>

                {/* Mark Extra Shift */}
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

