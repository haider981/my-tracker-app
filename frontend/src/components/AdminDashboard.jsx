import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_BASE;

export default function AdminDashboard() {
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


  // 🔑 Check token and set user
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
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
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
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

      {/* Mobile Menu Dropdown */}
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
      
      {/* Main content */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="relative min-h-screen">
          {/* Smooth, uniform background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100" />
          
          <div className="relative max-w-7xl mx-auto px-6 py-6">
            
            {/* Welcome Section */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-slate-800 bg-clip-text text-transparent mb-3 leading-tight">
                Welcome back, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Manage your team's worklogs, projects, and employee data from your centralized admin portal
              </p>
            </div>

            {/* Admin Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Approve Worklogs */}
              <AdminPortalCard
                title="Approve Worklogs"
                description="Review, approve, reject, re-approve and re-reject employee worklog entries with full oversight control."
                icon="✅"
                gradient="from-emerald-500/20 via-teal-500/20 to-cyan-500/20"
                borderGradient="from-emerald-400 to-teal-500"
                onClick={() => navigate("/admin/approve-worklogs")}
              />

              {/* Edit Worklogs */}
              <AdminPortalCard
                title="Edit Worklogs"
                description="Comprehensive worklog management: edit existing entries, delete incorrect records, or add new entries for employees."
                icon="✏️"
                gradient="from-blue-500/20 via-indigo-500/20 to-purple-500/20"
                borderGradient="from-blue-400 to-indigo-500"
                onClick={() => navigate("/admin/edit-worklog-entries")}
              />

              {/* Manage Employees */}
              <AdminPortalCard
                title="Manage Employees"
                description="Complete employee database control: update names, emails, SPOC details, team assignments, roles, and add/remove employees."
                icon="👥"
                gradient="from-violet-500/20 via-purple-500/20 to-fuchsia-500/20"
                borderGradient="from-violet-400 to-purple-500"
                onClick={() => navigate("/admin/handle-employees")}
              />

              {/* Add Abbreviations */}
              <AdminPortalCard
                title="Add Abbreviations"
                description="Maintain project abbreviation dictionary: create new abbreviations, edit existing ones, or remove outdated entries."
                icon="📝"
                gradient="from-amber-500/20 via-orange-500/20 to-red-500/20"
                borderGradient="from-amber-400 to-orange-500"
                onClick={() => navigate("/admin/add-abbreviations")}
              />

              {/* Add Project */}
              <AdminPortalCard
                title="Add Project"
                description="Create and configure new projects with detailed specifications, timelines, and team assignments for streamlined workflow."
                icon="🚀"
                gradient="from-pink-500/20 via-rose-500/20 to-red-500/20"
                borderGradient="from-pink-400 to-rose-500"
                onClick={() => navigate("/admin/add-project")}
              />

              {/* Project Requests */}
              <AdminPortalCard
                title="Project Requests"
                description="Review and process SPOC project requests: approve new project proposals or reject submissions with detailed feedback."
                icon="📋"
                gradient="from-teal-500/20 via-green-500/20 to-emerald-500/20"
                borderGradient="from-teal-400 to-green-500"
                onClick={() => navigate("/admin/project-requests")}
              />
            </div>


          </div>
        </div>
      </main>
    </div>
  );
}

/* Sidebar Links Component */
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "mark-shift" ? "bg-gray-700" : ""}`}
          onClick={() => handleNavigation("/admin/mark-shift")}
        >
          Mark Extra Shift
        </button>
      </nav>
    </div>
  );
}

/* Admin Portal Card Component */
function AdminPortalCard({ title, description, icon, gradient, borderGradient, onClick }) {
  return (
    <div 
      className="group relative rounded-3xl p-8 backdrop-blur-xl bg-white/80 border border-white/60 shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02] lg:hover:scale-105 hover:shadow-2xl active:scale-[0.98] hover:bg-white/90 active:bg-white/95 touch-manipulation"
    >
      {/* Gradient Background */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-40 group-hover:opacity-80 group-active:opacity-70 transition-all duration-500`} />
      
      {/* Secondary Gradient */}
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-tr ${gradient} blur-xl opacity-20 group-hover:opacity-40 group-active:opacity-30 transition-all duration-500`} />
      
      {/* Border Gradient - Enhanced */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${borderGradient} opacity-0 group-hover:opacity-40 group-active:opacity-30 transition-all duration-500 p-[2px]`}>
        <div className="w-full h-full rounded-3xl bg-white/80 backdrop-blur-xl" />
      </div>
      
      {/* Subtle Inner Glow - Enhanced */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-80 transition-all duration-500" />
      
      <div className="relative z-10">
        {/* Icon Container */}
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transform group-hover:scale-110 group-hover:rotate-3 group-active:scale-105 group-active:rotate-1 transition-all duration-500`}>
            <span className="text-2xl filter drop-shadow-sm">{icon}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-slate-800 group-active:text-slate-700 transition-colors duration-300 leading-tight">
          {title}
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-8 group-hover:text-slate-700 group-active:text-slate-800 transition-colors duration-300">
          {description}
        </p>
        
        {/* Action Button */}
        <div className="flex items-center justify-center">
          <button 
            onClick={onClick}
            className="w-full inline-flex items-center justify-center space-x-2 px-6 py-4 bg-slate-900/10 rounded-2xl text-sm font-bold text-slate-800 transition-all duration-300 hover:bg-slate-900 hover:text-white active:scale-95 active:bg-slate-800 shadow-lg hover:shadow-xl backdrop-blur-sm border border-slate-200/50 group-hover:border-slate-300 touch-manipulation"
          >
            <span>Manage</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 group-active:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
