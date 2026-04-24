import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_BASE;
const POLLING_INTERVAL = 60000; // 60 seconds

/* =================== MAIN COMPONENT =================== */
export default function SpocNotifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);
  const lastCountRef = useRef(0);
  const take = 10;

  /* ------------------ AUTH ------------------ */
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
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate]);

  /* ------------------ GET TOKEN ------------------ */
  const getToken = () => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  /* ------------------ FETCH ALL NOTIFICATIONS ------------------ */
  const fetchNotifications = async (loadMore = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getToken();

      const response = await axios.get(
        `${API_BASE_URL}/spoc/notifications?skip=${loadMore ? skip : 0}&take=${take}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (loadMore) {
          setNotifications((prev) => [...prev, ...response.data.notifications]);
        } else {
          setNotifications(response.data.notifications);
        }
        setUnreadCount(response.data.unreadCount);
        setHasMore(response.data.hasMore);
        setSkip(loadMore ? skip + take : take);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------ FETCH UNREAD COUNT (POLLING) ------------------ */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/spoc/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const newCount = response.data.count;

        // Check if count increased (new notifications arrived)
        if (newCount > lastCountRef.current && lastCountRef.current !== 0) {
          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New Notification", {
              body: `You have ${newCount} unread notification(s)`,
              icon: "/logo192.png",
            });
          }

          // Refresh the full list to show new notifications
          fetchNotifications();
        }

        setUnreadCount(newCount);
        lastCountRef.current = newCount;
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Error fetching notification count:", err);
      }
    }
  }, []);

  /* ------------------ REQUEST NOTIFICATION PERMISSION ------------------ */
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted");
      }
    }
  }, []);

  /* ------------------ START POLLING ------------------ */
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    fetchUnreadCount();
    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);
  }, [fetchUnreadCount]);

  /* ------------------ STOP POLLING ------------------ */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /* ------------------ MARK AS READ ------------------ */
  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await axios.patch(
        `${API_BASE_URL}/spoc/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      lastCountRef.current = Math.max(0, lastCountRef.current - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  /* ------------------ MARK ALL AS READ ------------------ */
  const markAllAsRead = async () => {
    try {
      const token = getToken();
      await axios.patch(
        `${API_BASE_URL}/spoc/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      lastCountRef.current = 0;
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  /* ------------------ FORMAT TIME AGO ------------------ */
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* ------------------ GET NOTIFICATION ICON ------------------ */
  const getNotificationIcon = (type) => {
    if (type.includes("APPROVED")) return "✓";
    if (type.includes("REJECTED")) return "✗";
    if (type.includes("SHIFT")) return "📅";
    if (type.includes("MISSING")) return "📋";
    if (type.includes("PROJECT")) return "📁";
    if (type.includes("ADDED")) return "➕";
    if (type.includes("EDITED")) return "✏️";
    return "🔔";
  };

  /* ------------------ GET NOTIFICATION COLOR ------------------ */
  const getNotificationColor = (type) => {
    if (type.includes("APPROVED")) return "bg-green-100 text-green-600";
    if (type.includes("REJECTED")) return "bg-red-100 text-red-600";
    if (type.includes("SHIFT")) return "bg-blue-100 text-blue-600";
    if (type.includes("MISSING")) return "bg-yellow-100 text-yellow-600";
    if (type.includes("PROJECT")) return "bg-purple-100 text-purple-600";
    if (type.includes("ADDED") || type.includes("EDITED"))
      return "bg-indigo-100 text-indigo-600";
    return "bg-gray-100 text-gray-600";
  };


  /* ------------------ INITIAL FETCH & POLLING ------------------ */
  useEffect(() => {
    const token = getToken();
    if (token && user) {
      fetchNotifications();
      startPolling();
      requestNotificationPermission();
    }

    return () => {
      stopPolling();
    };
  }, [user, startPolling, stopPolling, requestNotificationPermission]);

  /* ------------------ HANDLE VISIBILITY CHANGE ------------------ */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const token = getToken();
      if (!token) return;

      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling, stopPolling]);

  /* ------------------ LOGOUT ------------------ */
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <Navbar
        user={user}
        handleLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
            <SidebarLinks
              navigate={navigate}
              location={location}
              close={() => setSidebarOpen(false)}
              unreadCount={unreadCount}
            />
          </aside>
        </div>
      )}
      <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
        <SidebarLinks
          navigate={navigate}
          location={location}
          unreadCount={unreadCount}
        />
      </aside>

      {/* MAIN CONTENT */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm animate-pulse">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-slate-600 font-medium">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No notifications yet
                </h3>
                <p className="text-slate-500">
                  When you receive notifications, they'll appear here
                </p>
              </div>
            </div>
          ) : (
            /* Notifications List */
            <>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-5 hover:bg-slate-50 transition-colors duration-150 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() =>
                      !notification.isRead && markAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4
                            className={`text-sm font-semibold ${
                              !notification.isRead
                                ? "text-slate-900"
                                : "text-slate-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="flex-shrink-0 text-xs text-slate-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-sm ${
                            !notification.isRead
                              ? "text-slate-800"
                              : "text-slate-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={() => fetchNotifications(true)}
                    disabled={isLoading}
                    className="px-6 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 border-t-transparent"></div>
                        Loading...
                      </span>
                    ) : (
                      "Load more notifications"
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Polling Indicator */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Auto-refreshing every minute
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =================== NAVBAR =================== */
function Navbar({
  user,
  handleLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold">
              SPOC Dashboard - Notifications
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full border-2 border-slate-600"
            />
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-300">{user.email}</div>
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
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700">
            <div className="px-3 py-3 bg-slate-800 flex items-center rounded-lg">
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-slate-600"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-white">
                  {user.name}
                </div>
                <div className="text-xs text-slate-300">{user.email}</div>
              </div>
            </div>
            <div className="px-3 py-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* =================== SIDEBAR =================== */
// function SidebarLinks({ navigate, location, close, unreadCount }) {
//   const handleNavigation = (path) => {
//     navigate(path);
//     if (close) close();
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
//       <nav className="flex flex-col space-y-2">
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname === "/employee-dashboard" ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/employee-dashboard")}
//         >
//           Home
//         </button>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname === "/missing-entry-request" ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/missing-entry-request")}
//         >
//           Missing Entry Request
//         </button>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${
//             location.pathname === "/notifications" ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/notifications")}
//         >
//           <span>Notifications</span>
//           {unreadCount > 0 && (
//             <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
//               {unreadCount > 99 ? "99+" : unreadCount}
//             </span>
//           )}
//         </button>
//       </nav>
//     </div>
//   );
// }

function SidebarLinks({ navigate, location, close, unreadCount }) {
  const [openMissingEntry, setOpenMissingEntry] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("missing-entry")) {
      setOpenMissingEntry(true);
    }
  }, [location]);

  const handleNavigation = (path, isChildOfMissingEntry = false) => {
    navigate(path);
    if (!isChildOfMissingEntry && !path.includes("missing-entry")) {
      setOpenMissingEntry(false);
    }
    if (close) close();
  };

  const toggleMissingEntry = () => {
    setOpenMissingEntry(!openMissingEntry);
  };

  const isHomePage = location.pathname === "/spoc-dashboard";
  const isMissingEntryPage = location.pathname.includes("missing-entry");
  const isNotificationsPage = location.pathname.includes("notifications");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">
        <button
          className={`text-left text-base hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            isHomePage ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc-dashboard")}
        >
          Home
        </button>

        <button
          className={`text-left text-base hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("approve-worklogs") ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc/approve-worklogs")}
        >
          Approve Worklogs
        </button>

        <div>
          <button
            className={`w-full text-base flex justify-between items-center hover:bg-gray-700 p-3 rounded-lg transition-colors ${
              isMissingEntryPage ? "bg-gray-700" : ""
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
                className={`text-left text-base hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("missing-entry-request") ? "bg-gray-700" : ""
                }`}
                onClick={() => handleNavigation("/spoc/missing-entry-request", true)}
              >
                Request Missing Entry
              </button>
              <button
                className={`text-left text-base hover:bg-gray-700 p-2 rounded-lg transition-colors ${
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
          className={`text-left text-base hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("/spoc/add-project") ? "bg-gray-700" : ""
          }`}
          onClick={() => handleNavigation("/spoc/add-project")}
        >
          Add Project
        </button>

        <button
          className={`text-left text-base hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("mark-night-shift") || location.pathname.includes("mark-extra-shift")
              ? "bg-gray-700"
              : ""
          }`}
          onClick={() => handleNavigation("/spoc/mark-night-shift")}
        >
          Mark Extra Shift
        </button>

        <button
          className={`text-left text-base hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between ${
            isNotificationsPage ? "bg-gray-700" : ""
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
