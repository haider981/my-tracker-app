import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X as XIcon,
  AlertCircle,
  CheckCircle,
  Search,
  Loader2,
} from "lucide-react";

// API Base URL - Update this based on your backend URL
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

/* =========================
   MAIN PAGE
   ========================= */
export default function TeamWiseDropdowns() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [subTeams, setSubTeams] = useState([]);
  const [selectedSubTeam, setSelectedSubTeam] = useState("");
  const [dropdownData, setDropdownData] = useState({
    bookElements: [],
    chapterNumbers: [],
    taskNames: []
  });
  const [loading, setLoading] = useState(false);

  const [banner, setBanner] = useState({ type: "", text: "" });

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

  // Fetch available sub-teams on mount
  useEffect(() => {
    fetchSubTeams();
  }, []);

  // Fetch dropdown data when sub-team changes
  useEffect(() => {
    if (selectedSubTeam) {
      fetchDropdownData(selectedSubTeam);
    }
  }, [selectedSubTeam]);

  const fetchSubTeams = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/teamwise-dropdowns/teams/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch teams");
      
      const result = await response.json();
      if (result.success) {
        setSubTeams(result.data);
        if (result.data.length > 0) {
          setSelectedSubTeam(result.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      showError("Failed to load sub-teams");
    }
  };

  const fetchDropdownData = async (teamName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/teamwise-dropdowns/${encodeURIComponent(teamName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch dropdown data");

      const result = await response.json();
      if (result.success) {
        setDropdownData(result.data);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      showError("Failed to load dropdown data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const showSuccess = (text) => {
    setBanner({ type: "success", text });
    setTimeout(() => setBanner({ type: "", text: "" }), 3000);
  };

  const showError = (text) => {
    setBanner({ type: "error", text });
    setTimeout(() => setBanner({ type: "", text: "" }), 5000);
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
      <Navbar
        user={user}
        handleLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

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

      <main className="lg:ml-72 pt-20 p-6">
        <div className="space-y-6">
          {banner.text && (
            <MessageAlert
              type={banner.type}
              message={banner.text}
              onClose={() => setBanner({ type: "", text: "" })}
            />
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Team-wise Dropdowns
              </h1>
              <p className="text-sm text-slate-600">
                Manage dropdown data for all sub-teams.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Sub-Team
              </label>
              <select
                value={selectedSubTeam}
                onChange={(e) => setSelectedSubTeam(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                {subTeams.map((team) => (
                  <option key={team} value={team}>
                    {team.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-slate-200">
            <div className="border-b border-slate-200 p-4 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedSubTeam.replace(/_/g, " ")} - Dropdown Configuration
              </h2>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <p className="text-slate-600">Loading data...</p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <DropdownManager
                  teamName={selectedSubTeam}
                  data={dropdownData}
                  onRefresh={() => fetchDropdownData(selectedSubTeam)}
                  onSuccess={showSuccess}
                  onError={showError}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================
   Dropdown Manager Component
   ========================= */
function DropdownManager({ teamName, data, onRefresh, onSuccess, onError }) {
  const handleAdd = async (columnHeader, value) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/teamwise-dropdowns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName,
          columnHeader,
          value,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.message);
        onRefresh();
      } else {
        onError(result.message);
      }
    } catch (error) {
      console.error("Error adding value:", error);
      onError("Failed to add value");
    }
  };

  const handleUpdate = async (columnHeader, oldValue, newValue) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/teamwise-dropdowns`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName,
          columnHeader,
          oldValue,
          newValue,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.message);
        onRefresh();
      } else {
        onError(result.message);
      }
    } catch (error) {
      console.error("Error updating value:", error);
      onError("Failed to update value");
    }
  };

  const handleDelete = async (columnHeader, value) => {
    if (!window.confirm(`Are you sure you want to delete "${value}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/teamwise-dropdowns`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName,
          columnHeader,
          value,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.message);
        onRefresh();
      } else {
        onError(result.message);
      }
    } catch (error) {
      console.error("Error deleting value:", error);
      onError("Failed to delete value");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DropdownCard
        title="Book Elements"
        items={data.bookElements}
        onAdd={(val) => handleAdd("book_element", val)}
        onUpdate={(oldVal, newVal) => handleUpdate("book_element", oldVal, newVal)}
        onDelete={(val) => handleDelete("book_element", val)}
      />

      <DropdownCard
        title="Task Names"
        items={data.taskNames}
        onAdd={(val) => handleAdd("task", val)}
        onUpdate={(oldVal, newVal) => handleUpdate("task", oldVal, newVal)}
        onDelete={(val) => handleDelete("task", val)}
      />

      <DropdownCard
        title="Chapter Numbers"
        items={data.chapterNumbers}
        onAdd={(val) => handleAdd("chapter_number", val)}
        onUpdate={(oldVal, newVal) => handleUpdate("chapter_number", oldVal, newVal)}
        onDelete={(val) => handleDelete("chapter_number", val)}
      />
    </div>
  );
}

/* =========================
   Dropdown Card Component
   ========================= */
function DropdownCard({ title, items, onAdd, onDelete, onUpdate }) {
  const [filter, setFilter] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState("");

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem("");
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditValue(filteredItems[index]);
  };

  const handleSaveEdit = () => {
    const oldValue = filteredItems[editIndex];
    if (editValue.trim() && editValue !== oldValue) {
      onUpdate(oldValue, editValue.trim());
    }
    setEditIndex(-1);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditIndex(-1);
    setEditValue("");
  };

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
        <div className="flex items-center border rounded-lg px-2 py-1.5 bg-white">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter items..."
            className="text-sm outline-none w-full"
          />
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No items found</p>
          ) : (
            filteredItems.map((item, idx) => {
              const isEditing = editIndex === idx;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-200"
                >
                  {isEditing ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm mr-2"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                  ) : (
                    <span className="text-sm text-slate-700 flex-1">{item}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                          title="Save"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 text-slate-800 rounded"
                          title="Cancel"
                        >
                          <XIcon size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(idx)}
                          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Shared UI Components
   ========================= */
function MessageAlert({ message, type, onClose }) {
  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${
        type === "success"
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-center">
        {type === "success" ? (
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        )}
        <p
          className={`text-sm font-medium ${
            type === "success" ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`${
          type === "success"
            ? "text-green-600 hover:text-green-800"
            : "text-red-600 hover:text-red-800"
        }`}
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

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
              aria-label="Toggle sidebar"
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
              Admin Dashboard - Team Dropdowns
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
              aria-label="Toggle user menu"
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("team-wise-dropdowns") ? "bg-gray-700" : ""}`}
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
