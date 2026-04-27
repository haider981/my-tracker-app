import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X as XIcon,
  AlertCircle,
  CheckCircle,
  Filter as FilterIcon,
  Search,
  Loader2,
} from "lucide-react";

/* =========================
   API SERVICE FUNCTIONS
   ========================= */
const API_BASE_URL = import.meta.env?.VITE_API_BASE;

const apiService = {
  // Get abbreviations for a specific segment grouped by type
  getAbbreviationsBySegment: async (segment) => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/abbreviations/segment/${segment}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Add new abbreviation
  addAbbreviation: async (data) => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/abbreviations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add abbreviation');
    }
    
    return response.json();
  },

  // Update abbreviation
  updateAbbreviation: async (id, data) => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/abbreviations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update abbreviation');
    }
    
    return response.json();
  },

  // Delete abbreviation
  deleteAbbreviation: async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/abbreviations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete abbreviation');
    }
    
    return response.json();
  },
};

/* =========================
   TYPE DEFINITIONS
   ========================= */
const TYPE_LABELS = {
  'classsem': 'Class/Sem',
  'board': 'Board/Uni',
  'subject': 'Subject',
  'series': 'Series/Author',
  'medium': 'Medium',
  'session': 'Session'
};

/* =========================
   MAIN PAGE
   ========================= */
export default function AdminAddAbbreviation() {
  const navigate = useNavigate();
  const location = useLocation();

  // nav + auth (same behavior as your other page)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // tabs
  const TABS = ["UNI", "VK", "FK"];
  const [activeTab, setActiveTab] = useState("UNI");

  // data and loading states
  const [dataByTab, setDataByTab] = useState({
    UNI: {},
    VK: {},
    FK: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // messages
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

  /* ---------- auth ---------- */
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

  /* ---------- Load data from API ---------- */
  const loadData = async (segment) => {
    try {
      setLoading(true);
      setError("");
      const response = await apiService.getAbbreviationsBySegment(segment);
      
      if (response.success) {
        setDataByTab(prev => ({
          ...prev,
          [segment]: response.data
        }));
      } else {
        setError(response.message || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (user) {
      loadData(activeTab);
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const onChangeList = (tabKey, listTitle, rows) => {
    setDataByTab((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        [listTitle]: rows,
      },
    }));
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
      {/* Navbar (same look & behavior) */}
      <Navbar
        user={user}
        handleLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Sidebar (same) */}
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

      {/* Content */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="space-y-6">
          {banner.text && (
            <MessageAlert
              type={banner.type}
              message={banner.text}
              onClose={() => setBanner({ type: "", text: "" })}
            />
          )}

          {/* Page header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Add / Edit Abbreviations
              </h1>
              <p className="text-sm text-slate-600">
                Manage lists for UNI, VK and FK. Edit inline, remove items, or
                add new rows.
              </p>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow border border-slate-200">
            <div className="border-b border-slate-200 p-2">
              <div className="flex gap-2">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === t
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading spinner */}
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <p className="text-slate-600">Loading abbreviations...</p>
                </div>
              </div>
            ) : (
              /* Lists grid */
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(TYPE_LABELS).map(([typeKey, typeLabel]) => {
                  const rows = dataByTab[activeTab][typeKey] || [];
                  return (
                    <EditableListCard
                      key={typeKey}
                      title={typeLabel}
                      typeKey={typeKey}
                      segment={activeTab}
                      rows={rows}
                      onChange={(updated) => onChangeList(activeTab, typeKey, updated)}
                      onSaved={() => showSuccess(`${typeLabel} updated for ${activeTab}`)}
                      onError={showError}
                      apiService={apiService}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================
   Editable List Card
   ========================= */
function EditableListCard({ title, typeKey, segment, rows, onChange, onSaved, onError, apiService }) {
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState(rows);
  const [editIndex, setEditIndex] = useState(-1);
  const [tempRow, setTempRow] = useState({ full: "", abbr: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraft(rows);
  }, [rows]);

  const startEdit = (idx) => {
    setEditIndex(idx);
    setTempRow({ full: draft[idx].full, abbr: draft[idx].abbr });
    setError("");
  };

  const cancelEdit = () => {
    setEditIndex(-1);
    setTempRow({ full: "", abbr: "" });
    setError("");
  };

  const saveEdit = async () => {
    if (!tempRow.full?.trim() || !tempRow.abbr?.trim()) {
      setError("Both fields are required.");
      return;
    }

    setLoading(true);
    try {
      const rowToUpdate = draft[editIndex];
      const response = await apiService.updateAbbreviation(rowToUpdate.id, {
        full_name: tempRow.full.trim(),
        abbreviation: tempRow.abbr.trim()
      });

      if (response.success) {
        const updatedRows = [...draft];
        updatedRows[editIndex] = {
          id: rowToUpdate.id,
          full: tempRow.full.trim(),
          abbr: tempRow.abbr.trim()
        };
        setDraft(updatedRows);
        onChange(updatedRows);
        cancelEdit();
        onSaved?.();
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeRow = async (idx) => {
    const rowToDelete = draft[idx];
    if (!rowToDelete.id) return;

    setLoading(true);
    try {
      const response = await apiService.deleteAbbreviation(rowToDelete.id);
      
      if (response.success) {
        const updatedRows = draft.filter((_, i) => i !== idx);
        setDraft(updatedRows);
        onChange(updatedRows);
        onSaved?.();
      }
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [newRow, setNewRow] = useState({ full: "", abbr: "" });
  
  const addRow = async () => {
    if (!newRow.full.trim() || !newRow.abbr.trim()) {
      setError("Both fields are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.addAbbreviation({
        full_name: newRow.full.trim(),
        abbreviation: newRow.abbr.trim(),
        type: typeKey,
        segment: segment
      });

      if (response.success) {
        const newRowData = {
          id: response.data.id,
          full: response.data.full_name,
          abbr: response.data.abbreviation
        };
        const updatedRows = [...draft, newRowData];
        setDraft(updatedRows);
        onChange(updatedRows);
        setNewRow({ full: "", abbr: "" });
        setError("");
        onSaved?.();
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = draft.filter(
    (r) =>
      r.full.toLowerCase().includes(filter.toLowerCase()) ||
      r.abbr.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        <div className="hidden md:flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-indigo-600" />
          <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
            <Search className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-3 mb-1 p-2 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mr-2" /> {error}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="px-3 py-2 text-left w-1/2">Full Name</th>
              <th className="px-3 py-2 text-left w-1/3">Abbreviation</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => {
              const originalIndex = draft.indexOf(row);
              const isEditing = editIndex === originalIndex;
              return (
                <tr key={row.id || originalIndex} className="border-t">
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={tempRow.full}
                        onChange={(e) =>
                          setTempRow((p) => ({ ...p, full: e.target.value }))
                        }
                        disabled={loading}
                      />
                    ) : (
                      row.full
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={tempRow.abbr}
                        onChange={(e) =>
                          setTempRow((p) => ({ ...p, abbr: e.target.value }))
                        }
                        disabled={loading}
                      />
                    ) : (
                      row.abbr
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded flex items-center gap-1"
                            onClick={saveEdit}
                            disabled={loading}
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          </button>
                          <button
                            className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-3 py-1 rounded"
                            onClick={cancelEdit}
                            disabled={loading}
                          >
                            <XIcon size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                            onClick={() => startEdit(originalIndex)}
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1 rounded"
                            onClick={() => removeRow(originalIndex)}
                            title="Delete"
                            disabled={loading}
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
          {/* Add new row */}
          <tfoot>
            <tr className="border-t bg-slate-50">
              <td className="px-3 py-2">
                <input
                  className="w-full border rounded px-2 py-1"
                  placeholder="Full name"
                  value={newRow.full}
                  onChange={(e) =>
                    setNewRow((p) => ({ ...p, full: e.target.value }))
                  }
                  disabled={loading}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  className="w-full border rounded px-2 py-1"
                  placeholder="Abbreviation"
                  value={newRow.abbr}
                  onChange={(e) =>
                    setNewRow((p) => ({ ...p, abbr: e.target.value }))
                  }
                  disabled={loading}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded flex items-center gap-1"
                  onClick={addRow}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden p-3 pt-0 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FilterIcon className="w-4 h-4 text-indigo-600" />
          <div className="flex items-center border rounded-lg px-2 py-1 bg-white w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="text-xs outline-none w-full"
            />
          </div>
        </div>

        {filtered.map((row, idx) => {
          const originalIndex = draft.indexOf(row);
          const isEditing = editIndex === originalIndex;
          return (
            <div
              key={row.id || originalIndex}
              className="border rounded-lg p-3 shadow-sm bg-white"
            >
              <div className="text-xs text-slate-500">Full Name</div>
              <div className="font-medium">
                {isEditing ? (
                  <input
                    className="w-full border rounded px-2 py-1 mt-1"
                    value={tempRow.full}
                    onChange={(e) =>
                      setTempRow((p) => ({ ...p, full: e.target.value }))
                    }
                    disabled={loading}
                  />
                ) : (
                  row.full
                )}
              </div>
              <div className="text-xs text-slate-500 mt-2">Abbreviation</div>
              <div className="font-mono">
                {isEditing ? (
                  <input
                    className="w-full border rounded px-2 py-1 mt-1"
                    value={tempRow.abbr}
                    onChange={(e) =>
                      setTempRow((p) => ({ ...p, abbr: e.target.value }))
                    }
                    disabled={loading}
                  />
                ) : (
                  row.abbr
                )}
              </div>

              <div className="flex gap-2 mt-3">
                {isEditing ? (
                  <>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      onClick={saveEdit}
                      disabled={loading}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                    </button>
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-3 py-1 rounded text-sm"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                      onClick={() => startEdit(originalIndex)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      onClick={() => removeRow(originalIndex)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Remove"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* add row (mobile) */}
        <div className="border rounded-lg p-3 bg-slate-50">
          <div className="text-sm font-medium mb-2">Add new</div>
          <div className="space-y-2">
            <input
              className="w-full border rounded px-2 py-1"
              placeholder="Full name"
              value={newRow.full}
              onChange={(e) =>
                setNewRow((p) => ({ ...p, full: e.target.value }))
              }
              disabled={loading}
            />
            <input
              className="w-full border rounded px-2 py-1"
              placeholder="Abbreviation"
              value={newRow.abbr}
              onChange={(e) =>
                setNewRow((p) => ({ ...p, abbr: e.target.value }))
              }
              disabled={loading}
            />
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
              onClick={addRow}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Shared UI bits (same vibe)
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
              Admin Dashboard - Abbreviations
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

function SidebarLinks({ navigate, location, close, pendingCount = 0, projectPendingCount = 0}) {
  const [openWorklogs, setOpenWorklogs] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("worklog")) setOpenWorklogs(true);
    if (
      location.pathname.includes("project") ||
      location.pathname.includes("abbreviations")
    )
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
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
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("approve-worklogs")
                    ? "bg-gray-700"
                    : ""
                }`}
                onClick={() => handleNavigation("/admin/approve-worklogs")}
              >
                Approve Worklogs
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("edit-worklog-entries")
                    ? "bg-gray-700"
                    : ""
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
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
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("add-abbreviations")
                    ? "bg-gray-700"
                    : ""
                }`}
                onClick={() => handleNavigation("/admin/add-abbreviations")}
              >
                Add Abbreviations
              </button>
              <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("add-project") ? "bg-gray-700" : ""
                }`}
                onClick={() => handleNavigation("/admin/add-project")}
              >
                Add Project
              </button>
              {/* <button
                className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
                  location.pathname.includes("project-requests")
                    ? "bg-gray-700"
                    : ""
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
