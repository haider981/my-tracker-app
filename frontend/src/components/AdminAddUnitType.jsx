// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import {
//   Filter as FilterIcon,
//   Plus,
//   Trash2,
//   Search,
//   X as XIcon,
//   Edit3,
//   AlertCircle,
//   CheckCircle,
//   ChevronDown,
// } from "lucide-react";

// const API_BASE_URL = import.meta.env?.VITE_API_BASE;

// /* =================== MAIN PAGE =================== */
// export default function AdminUnitTypeManager() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [user, setUser] = useState(null);

//   // Unit Types State
//   const [unitTypes, setUnitTypes] = useState([]);
//   const [filteredUnitTypes, setFilteredUnitTypes] = useState([]);
//   const [bookElementFilter, setBookElementFilter] = useState("");
//   const [taskFilter, setTaskFilter] = useState("");
//   const [unitTypeFilter, setUnitTypeFilter] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Dropdown data
//   const [bookElements, setBookElements] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [unitTypeOptions, setUnitTypeOptions] = useState([]);

//   // Add Unit Type Modal
//   const [addModalOpen, setAddModalOpen] = useState(false);
//   const [newUnitType, setNewUnitType] = useState({
//     bookElement: "",
//     task: "",
//     unitType: "",
//   });

//   // Edit Unit Type Modal
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editUnitType, setEditUnitType] = useState(null);

//   // Success/Error messages
//   const [successMessage, setSuccessMessage] = useState("");

//   /* ------------------ AUTH ------------------ */
//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       navigate("/");
//       return;
//     }
//     try {
//       const decoded = jwtDecode(token);
//       setUser({
//         name: decoded.name,
//         email: decoded.email,
//         role: decoded.role,
//         picture:
//           decoded.picture ||
//           `https://ui-avatars.com/api/?name=${encodeURIComponent(
//             decoded.name
//           )}&background=random&color=fff`,
//       });
//     } catch (e) {
//       console.error("Invalid token:", e);
//       localStorage.removeItem("authToken");
//       navigate("/");
//     }
//   }, [navigate]);

//   /* ------------------ FETCH UNIT TYPES ------------------ */
//   const fetchUnitTypes = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }
//       const data = await res.json();
//       const unitTypesArray = Array.isArray(data) ? data : data.unitTypes || [];
//       setUnitTypes(unitTypesArray);
//     } catch (err) {
//       console.error("Error fetching unit types:", err);
//       setError("Failed to fetch unit types. Please try again.");
//       setUnitTypes([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ------------------ FETCH DROPDOWN DATA ------------------ */
//   const fetchDropdownData = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
      
//       // Fetch Book Elements
//       const bookRes = await fetch(`${API_BASE_URL}/admin/unit/book-elements`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const bookData = await bookRes.json();
//       setBookElements(bookData.bookElements || []);

//       // Fetch Tasks
//       const taskRes = await fetch(`${API_BASE_URL}/admin/unit/tasks`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const taskData = await taskRes.json();
//       setTasks(taskData.tasks || []);

//       // Fetch Unit Type Options
//       const unitRes = await fetch(`${API_BASE_URL}/admin/unit/unit-type-options`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const unitData = await unitRes.json();
//       setUnitTypeOptions(unitData.unitTypes || []);
//     } catch (err) {
//       console.error("Error fetching dropdown data:", err);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchUnitTypes();
//       fetchDropdownData();
//     }
//   }, [user]);

//   /* ------------------ FILTER ------------------ */
//   useEffect(() => {
//     if (!Array.isArray(unitTypes)) {
//       setFilteredUnitTypes([]);
//       return;
//     }
//     let filtered = [...unitTypes];
//     if (bookElementFilter) {
//       filtered = filtered.filter((ut) =>
//         ut.bookElement?.toLowerCase().includes(bookElementFilter.toLowerCase())
//       );
//     }
//     if (taskFilter) {
//       filtered = filtered.filter((ut) =>
//         ut.task?.toLowerCase().includes(taskFilter.toLowerCase())
//       );
//     }
//     if (unitTypeFilter) {
//       filtered = filtered.filter((ut) =>
//         ut.unitType?.toLowerCase().includes(unitTypeFilter.toLowerCase())
//       );
//     }
//     setFilteredUnitTypes(filtered);
//   }, [bookElementFilter, taskFilter, unitTypeFilter, unitTypes]);

//   /* ------------------ ADD ------------------ */
//   const handleAdd = async () => {
//     if (!newUnitType.bookElement || !newUnitType.task || !newUnitType.unitType) {
//       setError("Please fill in all required fields");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(newUnitType),
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
//       }
//       const savedUnitType = responseData.unitType || responseData;
//       setUnitTypes((prev) => [...prev, savedUnitType]);
//       setAddModalOpen(false);
//       setNewUnitType({
//         bookElement: "",
//         task: "",
//         unitType: "",
//       });
//       setBookElementFilter("");
//       setTaskFilter("");
//       setUnitTypeFilter("");
//       setSuccessMessage(responseData.message || "Unit type added successfully!");
//       setTimeout(() => setSuccessMessage(""), 5000);
      
//       // Refresh dropdown data to include new values
//       fetchDropdownData();
//     } catch (err) {
//       console.error("Error adding unit type:", err);
//       setError(err.message || "Failed to add unit type. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ------------------ EDIT ------------------ */
//   const handleEdit = (unitType) => {
//     setEditUnitType({ ...unitType });
//     setEditModalOpen(true);
//     setError("");
//   };

//   const handleSaveEdit = async () => {
//     if (!editUnitType.bookElement || !editUnitType.task || !editUnitType.unitType) {
//       setError("Please fill in all required fields");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("authToken");
//       const id = editUnitType.id || editUnitType._id;
//       const res = await fetch(
//         `${API_BASE_URL}/admin/unit/unit-types/${id}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(editUnitType),
//         }
//       );
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
//       }
//       const updatedUnitType = responseData.unitType || responseData;
//       setUnitTypes((prev) =>
//         prev.map((ut) => {
//           const currentId = ut.id || ut._id;
//           const updatedId = updatedUnitType.id || updatedUnitType._id;
//           return currentId === updatedId ? updatedUnitType : ut;
//         })
//       );
//       setEditModalOpen(false);
//       setEditUnitType(null);
//       setBookElementFilter("");
//       setTaskFilter("");
//       setUnitTypeFilter("");
//       setSuccessMessage(responseData.message || "Unit type updated successfully!");
//       setTimeout(() => setSuccessMessage(""), 5000);
      
//       // Refresh dropdown data
//       fetchDropdownData();
//     } catch (err) {
//       console.error("Error updating unit type:", err);
//       setError(err.message || "Failed to update unit type. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ------------------ DELETE ------------------ */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this unit type?"))
//       return;
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
//       }
//       setUnitTypes((prev) =>
//         prev.filter((ut) => {
//           const utId = ut.id || ut._id;
//           return utId !== id;
//         })
//       );
//       setBookElementFilter("");
//       setTaskFilter("");
//       setUnitTypeFilter("");
//       setSuccessMessage(responseData.message || "Unit type deleted successfully!");
//       setTimeout(() => setSuccessMessage(""), 5000);
//     } catch (err) {
//       console.error("Error deleting unit type:", err);
//       setError(err.message || "Failed to delete unit type. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ------------------ LOGOUT ------------------ */
//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     navigate("/");
//   };

//   /* ------------------ CLEAR MESSAGES ------------------ */
//   const clearMessages = () => {
//     setError("");
//     setSuccessMessage("");
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-100">
//         <div className="flex items-center gap-2">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
//           <p>Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-100">
//       {/* Navbar */}
//       <Navbar
//         user={user}
//         handleLogout={handleLogout}
//         mobileMenuOpen={mobileMenuOpen}
//         setMobileMenuOpen={setMobileMenuOpen}
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//       />

//       {/* Sidebar */}
//       {sidebarOpen && (
//         <div className="fixed inset-0 z-40 lg:hidden">
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50"
//             onClick={() => setSidebarOpen(false)}
//           />
//           <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//             <SidebarLinks
//               navigate={navigate}
//               location={location}
//               close={() => setSidebarOpen(false)}
//             />
//           </aside>
//         </div>
//       )}
//       <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gray-800 text-white shadow-xl overflow-y-auto">
//         <SidebarLinks navigate={navigate} location={location} />
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="lg:ml-72 pt-20 p-6">
//         <div className="space-y-6">
//           {/* Success/Error Messages */}
//           {(successMessage || error) && (
//             <MessageAlert
//               message={successMessage || error}
//               type={successMessage ? "success" : "error"}
//               onClose={clearMessages}
//             />
//           )}

//           {/* Loading Indicator */}
//           {loading && (
//             <div className="flex items-center justify-center py-4">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//               <span className="ml-2 text-slate-600">Processing...</span>
//             </div>
//           )}

//           {/* Filters */}
//           <Filters
//             bookElementFilter={bookElementFilter}
//             setBookElementFilter={setBookElementFilter}
//             taskFilter={taskFilter}
//             setTaskFilter={setTaskFilter}
//             unitTypeFilter={unitTypeFilter}
//             setUnitTypeFilter={setUnitTypeFilter}
//             setAddModalOpen={setAddModalOpen}
//             onRefresh={fetchUnitTypes}
//             loading={loading}
//             bookElements={bookElements}
//             tasks={tasks}
//             unitTypeOptions={unitTypeOptions}
//           />

//           {/* Unit Types Table */}
//           <UnitTypesTable
//             filteredUnitTypes={filteredUnitTypes}
//             handleDelete={handleDelete}
//             handleEdit={handleEdit}
//             loading={loading}
//           />
//         </div>
//       </main>

//       {/* Add Unit Type Modal */}
//       {addModalOpen && (
//         <Modal onClose={() => setAddModalOpen(false)} title="Add Unit Type">
//           <UnitTypeForm
//             unitType={newUnitType}
//             setUnitType={setNewUnitType}
//             onSubmit={handleAdd}
//             onCancel={() => setAddModalOpen(false)}
//             loading={loading}
//             error={error}
//             setError={setError}
//             bookElements={bookElements}
//             tasks={tasks}
//             unitTypeOptions={unitTypeOptions}
//           />
//         </Modal>
//       )}

//       {/* Edit Unit Type Modal */}
//       {editModalOpen && editUnitType && (
//         <Modal onClose={() => setEditModalOpen(false)} title="Edit Unit Type">
//           <UnitTypeForm
//             unitType={editUnitType}
//             setUnitType={setEditUnitType}
//             onSubmit={handleSaveEdit}
//             onCancel={() => setEditModalOpen(false)}
//             isEdit
//             loading={loading}
//             error={error}
//             setError={setError}
//             bookElements={bookElements}
//             tasks={tasks}
//             unitTypeOptions={unitTypeOptions}
//           />
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* =================== COMPONENTS =================== */

// function MessageAlert({ message, type, onClose }) {
//   return (
//     <div
//       className={`rounded-lg p-4 flex items-center justify-between ${
//         type === "success"
//           ? "bg-green-50 border border-green-200"
//           : "bg-red-50 border border-red-200"
//       }`}
//     >
//       <div className="flex items-start">
//         {type === "success" ? (
//           <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
//         ) : (
//           <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
//         )}
//         <div>
//           <p
//             className={`text-sm font-medium ${
//               type === "success" ? "text-green-800" : "text-red-800"
//             }`}
//           >
//             {message}
//           </p>
//           {type === "error" && (
//             <p className="text-xs text-red-600 mt-1">
//               Please verify the information and try again.
//             </p>
//           )}
//         </div>
//       </div>
//       <button
//         onClick={onClose}
//         className={`ml-4 ${
//           type === "success"
//             ? "text-green-600 hover:text-green-800"
//             : "text-red-600 hover:text-red-800"
//         } flex-shrink-0`}
//       >
//         <XIcon className="w-4 h-4" />
//       </button>
//     </div>
//   );
// }

// function Navbar({
//   user,
//   handleLogout,
//   mobileMenuOpen,
//   setMobileMenuOpen,
//   sidebarOpen,
//   setSidebarOpen,
// }) {
//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
//       <div className="max-w-full mx-auto px-4 sm:px-6">
//         <div className="flex items-center justify-between h-16">
//           <div className="flex items-center">
//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="mr-4 p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 lg:hidden"
//             >
//               <svg
//                 className="h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               </svg>
//             </button>
//             <h1 className="text-lg sm:text-xl font-semibold">
//               Admin Dashboard - Unit Types
//             </h1>
//           </div>
//           <div className="hidden md:flex items-center space-x-4">
//             <img
//               src={user.picture}
//               alt={user.name}
//               className="w-8 h-8 rounded-full border-2 border-slate-600"
//             />
//             <div className="text-right">
//               <div className="text-sm font-medium">{user.name}</div>
//               <div className="text-xs text-slate-300">{user.email}</div>
//             </div>
//             <button
//               onClick={handleLogout}
//               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
//             >
//               Logout
//             </button>
//           </div>
//           <div className="md:hidden">
//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
//             >
//               {!mobileMenuOpen ? (
//                 <svg
//                   className="h-6 w-6"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M4 6h16M4 12h16M4 18h16"
//                   />
//                 </svg>
//               ) : (
//                 <svg
//                   className="h-6 w-6"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
//         {mobileMenuOpen && (
//           <div className="md:hidden border-t border-slate-700">
//             <div className="px-3 py-3 bg-slate-800 flex items-center rounded-lg">
//               <img
//                 src={user.picture}
//                 alt={user.name}
//                 className="w-10 h-10 rounded-full border-2 border-slate-600"
//               />
//               <div className="ml-3">
//                 <div className="text-sm font-medium text-white">
//                   {user.name}
//                 </div>
//                 <div className="text-xs text-slate-300">{user.email}</div>
//               </div>
//             </div>
//             <div className="px-3 py-3">
//               <button
//                 onClick={handleLogout}
//                 className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }

// function Filters({
//   bookElementFilter,
//   setBookElementFilter,
//   taskFilter,
//   setTaskFilter,
//   unitTypeFilter,
//   setUnitTypeFilter,
//   setAddModalOpen,
//   onRefresh,
//   loading,
//   bookElements,
//   tasks,
//   unitTypeOptions,
// }) {
//   const [bookElementSearch, setBookElementSearch] = useState("");
//   const [taskSearch, setTaskSearch] = useState("");
//   const [showBookDropdown, setShowBookDropdown] = useState(false);
//   const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  
//   const bookDropdownRef = useRef(null);
//   const taskDropdownRef = useRef(null);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
//         setShowBookDropdown(false);
//       }
//       if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target)) {
//         setShowTaskDropdown(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const filteredBookElements = bookElements.filter((be) =>
//     be.toLowerCase().includes(bookElementSearch.toLowerCase())
//   );
//   const filteredTasks = tasks.filter((t) =>
//     t.toLowerCase().includes(taskSearch.toLowerCase())
//   );

//   return (
//     <div className="rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4">
//       <div className="flex items-center gap-2 mb-3">
//         <FilterIcon className="w-4 h-4 text-indigo-600" />
//         <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//         {/* Book Element Filter */}
//         <div className="relative" ref={bookDropdownRef}>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             BOOK ELEMENT
//           </label>
//           <div className="relative">
//             <div
//               className="flex items-center border rounded-lg bg-white px-3 py-2 shadow-sm w-full cursor-pointer"
//               onClick={() => setShowBookDropdown(!showBookDropdown)}
//             >
//               <Search className="w-4 h-4 text-slate-500 mr-2" />
//               <input
//                 type="text"
//                 placeholder="Search book element..."
//                 value={bookElementSearch}
//                 onChange={(e) => setBookElementSearch(e.target.value)}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setShowBookDropdown(true);
//                 }}
//                 className="flex-1 outline-none text-sm"
//               />
//               <ChevronDown className="w-4 h-4 text-slate-500" />
//             </div>
//             {showBookDropdown && (
//               <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                 {filteredBookElements.length > 0 ? (
//                   filteredBookElements.map((be, idx) => (
//                     <div
//                       key={idx}
//                       className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
//                       onClick={() => {
//                         setBookElementFilter(be);
//                         setBookElementSearch(be);
//                         setShowBookDropdown(false);
//                       }}
//                     >
//                       {be}
//                     </div>
//                   ))
//                 ) : (
//                   <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
//                 )}
//               </div>
//             )}
//           </div>
//           {bookElementFilter && (
//             <button
//               onClick={() => {
//                 setBookElementFilter("");
//                 setBookElementSearch("");
//               }}
//               className="absolute right-10 top-9 text-slate-400 hover:text-slate-600"
//             >
//               <XIcon className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Task Filter */}
//         <div className="relative" ref={taskDropdownRef}>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             TASK
//           </label>
//           <div className="relative">
//             <div
//               className="flex items-center border rounded-lg bg-white px-3 py-2 shadow-sm w-full cursor-pointer"
//               onClick={() => setShowTaskDropdown(!showTaskDropdown)}
//             >
//               <Search className="w-4 h-4 text-slate-500 mr-2" />
//               <input
//                 type="text"
//                 placeholder="Search task..."
//                 value={taskSearch}
//                 onChange={(e) => setTaskSearch(e.target.value)}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setShowTaskDropdown(true);
//                 }}
//                 className="flex-1 outline-none text-sm"
//               />
//               <ChevronDown className="w-4 h-4 text-slate-500" />
//             </div>
//             {showTaskDropdown && (
//               <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                 {filteredTasks.length > 0 ? (
//                   filteredTasks.map((t, idx) => (
//                     <div
//                       key={idx}
//                       className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
//                       onClick={() => {
//                         setTaskFilter(t);
//                         setTaskSearch(t);
//                         setShowTaskDropdown(false);
//                       }}
//                     >
//                       {t}
//                     </div>
//                   ))
//                 ) : (
//                   <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
//                 )}
//               </div>
//             )}
//           </div>
//           {taskFilter && (
//             <button
//               onClick={() => {
//                 setTaskFilter("");
//                 setTaskSearch("");
//               }}
//               className="absolute right-10 top-9 text-slate-400 hover:text-slate-600"
//             >
//               <XIcon className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Unit Type Filter */}
//         <div>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             UNIT TYPE
//           </label>
//           <select
//             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//             value={unitTypeFilter}
//             onChange={(e) => setUnitTypeFilter(e.target.value)}
//           >
//             <option value="">All Unit Types</option>
//             {unitTypeOptions.map((ut, idx) => (
//               <option key={idx} value={ut}>
//                 {ut}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>
//       <div className="flex gap-2">
//         <button
//           onClick={onRefresh}
//           disabled={loading}
//           className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
//         >
//           <svg
//             className="w-4 h-4"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//             />
//           </svg>
//           Refresh
//         </button>
//         <button
//           onClick={() => setAddModalOpen(true)}
//           disabled={loading}
//           className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
//         >
//           <Plus className="w-4 h-4" /> Add Unit Type
//         </button>
//       </div>
//     </div>
//   );
// }

// function UnitTypesTable({
//   filteredUnitTypes,
//   handleDelete,
//   handleEdit,
//   loading,
// }) {
//   const safeUnitTypes = Array.isArray(filteredUnitTypes) ? filteredUnitTypes : [];

//   if (loading && safeUnitTypes.length === 0) {
//     return (
//       <div className="bg-white rounded-xl shadow border border-slate-200 p-8">
//         <div className="flex items-center justify-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//           <span className="ml-2 text-slate-600">Loading unit types...</span>
//         </div>
//       </div>
//     );
//   }

//   if (safeUnitTypes.length === 0 && !loading) {
//     return (
//       <div className="bg-white rounded-xl shadow border border-slate-200 p-8">
//         <p className="text-center text-slate-500">
//           No unit types found. Add your first unit type to get started.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
//       {/* Desktop Table View */}
//       <div className="hidden md:block">
//         <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
//           <table className="w-full text-sm border-collapse">
//             <thead className="sticky top-0 bg-slate-100 z-10">
//               <tr className="text-slate-700">
//                 <Th>Book Element</Th>
//                 <Th>Task</Th>
//                 <Th>Unit Type</Th>
//                 <Th>Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {safeUnitTypes.map((ut, index) => {
//                 if (!ut || typeof ut !== "object") {
//                   console.warn(`Invalid unit type at index ${index}:`, ut);
//                   return null;
//                 }
//                 const utId = ut.id || ut._id || index;
//                 return (
//                   <tr key={utId} className="border-t hover:bg-slate-50">
//                     <Td>{ut.bookElement || "N/A"}</Td>
//                     <Td>{ut.task || "N/A"}</Td>
//                     <Td>
//                       <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
//                         {ut.unitType || "N/A"}
//                       </span>
//                     </Td>
//                     <Td>
//                       <div className="flex gap-2">
//                         <button
//                           className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md"
//                           onClick={() => handleEdit(ut)}
//                           disabled={loading}
//                           title="Edit Unit Type"
//                         >
//                           <Edit3 size={16} />
//                         </button>
//                         <button
//                           className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-3 py-1 rounded-md"
//                           onClick={() => handleDelete(utId)}
//                           disabled={loading}
//                           title="Delete Unit Type"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </Td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Mobile Card View */}
//       <div className="block md:hidden max-h-[600px] overflow-y-auto divide-y divide-slate-200">
//         {safeUnitTypes.map((ut, index) => {
//           if (!ut || typeof ut !== "object") {
//             console.warn(`Invalid unit type at index ${index}:`, ut);
//             return null;
//           }
//           const utId = ut.id || ut._id || index;
//           return (
//             <div key={utId} className="p-4">
//               <p className="text-sm mb-2">
//                 <span className="font-medium text-slate-700">Book Element:</span>
//                 <span className="ml-2 text-slate-800">{ut.bookElement || "N/A"}</span>
//               </p>
//               <p className="text-sm mb-2">
//                 <span className="font-medium text-slate-700">Task:</span>
//                 <span className="ml-2 text-slate-800">{ut.task || "N/A"}</span>
//               </p>
//               <p className="text-sm mb-3">
//                 <span className="font-medium text-slate-700">Unit Type:</span>
//                 <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
//                   {ut.unitType || "N/A"}
//                 </span>
//               </p>
//               <div className="flex gap-2">
//                 <button
//                   className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
//                   onClick={() => handleEdit(ut)}
//                   disabled={loading}
//                 >
//                   <Edit3 size={14} />
//                   Edit
//                 </button>
//                 <button
//                   className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
//                   onClick={() => handleDelete(utId)}
//                   disabled={loading}
//                 >
//                   <Trash2 size={14} />
//                   Delete
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function UnitTypeForm({
//   unitType,
//   setUnitType,
//   onSubmit,
//   onCancel,
//   isEdit,
//   loading,
//   error,
//   setError,
//   bookElements,
//   tasks,
//   unitTypeOptions,
// }) {
//   const [showBookDropdown, setShowBookDropdown] = useState(false);
//   const [showTaskDropdown, setShowTaskDropdown] = useState(false);
//   const [showUnitTypeDropdown, setShowUnitTypeDropdown] = useState(false);
  
//   const [bookElementInput, setBookElementInput] = useState(unitType.bookElement || "");
//   const [taskInput, setTaskInput] = useState(unitType.task || "");
//   const [unitTypeInput, setUnitTypeInput] = useState(unitType.unitType || "");

//   const bookDropdownRef = useRef(null);
//   const taskDropdownRef = useRef(null);
//   const unitTypeDropdownRef = useRef(null);

//   useEffect(() => {
//     setBookElementInput(unitType.bookElement || "");
//     setTaskInput(unitType.task || "");
//     setUnitTypeInput(unitType.unitType || "");
//   }, [unitType]);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
//         setShowBookDropdown(false);
//       }
//       if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target)) {
//         setShowTaskDropdown(false);
//       }
//       if (unitTypeDropdownRef.current && !unitTypeDropdownRef.current.contains(event.target)) {
//         setShowUnitTypeDropdown(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleInputChange = (field, value) => {
//     setUnitType({ ...unitType, [field]: value });
//     if (error) setError("");
//   };

//   const filteredBookElements = bookElements.filter((be) =>
//     be.toLowerCase().includes(bookElementInput.toLowerCase())
//   );
//   const filteredTasks = tasks.filter((t) =>
//     t.toLowerCase().includes(taskInput.toLowerCase())
//   );
//   const filteredUnitTypes = unitTypeOptions.filter((ut) =>
//     ut.toLowerCase().includes(unitTypeInput.toLowerCase())
//   );

//   return (
//     <div>
//       {error && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//           <div className="flex items-center">
//             <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
//             <p className="text-sm text-red-800">{error}</p>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 gap-4">
//         {/* Book Element - Dropdown with Custom Input */}
//         <div className="relative" ref={bookDropdownRef}>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             Book Element <span className="text-red-500">*</span>
//           </label>
//           <div className="relative">
//             <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
//               <input
//                 type="text"
//                 className="flex-1 outline-none text-sm"
//                 value={bookElementInput}
//                 onChange={(e) => {
//                   setBookElementInput(e.target.value);
//                   handleInputChange("bookElement", e.target.value);
//                   setShowBookDropdown(true);
//                 }}
//                 onFocus={() => setShowBookDropdown(true)}
//                 placeholder="Type or select book element..."
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowBookDropdown(!showBookDropdown)}
//                 className="ml-2"
//               >
//                 <ChevronDown className="w-4 h-4 text-slate-500" />
//               </button>
//             </div>
//             {showBookDropdown && (
//               <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                 {bookElementInput && !bookElements.includes(bookElementInput) && (
//                   <div
//                     className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
//                     onClick={() => {
//                       handleInputChange("bookElement", bookElementInput);
//                       setShowBookDropdown(false);
//                     }}
//                   >
//                     <span className="font-medium text-indigo-700">+ Add new: </span>
//                     <span className="text-slate-800">{bookElementInput}</span>
//                   </div>
//                 )}
//                 {filteredBookElements.length > 0 ? (
//                   filteredBookElements.map((be, idx) => (
//                     <div
//                       key={idx}
//                       className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
//                       onClick={() => {
//                         setBookElementInput(be);
//                         handleInputChange("bookElement", be);
//                         setShowBookDropdown(false);
//                       }}
//                     >
//                       {be}
//                     </div>
//                   ))
//                 ) : (
//                   !bookElementInput && (
//                     <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
//                   )
//                 )}
//               </div>
//             )}
//           </div>
//           <p className="text-xs text-slate-500 mt-1">
//             Select from existing or type to add new
//           </p>
//         </div>

//         {/* Task - Dropdown with Custom Input */}
//         <div className="relative" ref={taskDropdownRef}>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             Task <span className="text-red-500">*</span>
//           </label>
//           <div className="relative">
//             <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
//               <input
//                 type="text"
//                 className="flex-1 outline-none text-sm"
//                 value={taskInput}
//                 onChange={(e) => {
//                   setTaskInput(e.target.value);
//                   handleInputChange("task", e.target.value);
//                   setShowTaskDropdown(true);
//                 }}
//                 onFocus={() => setShowTaskDropdown(true)}
//                 placeholder="Type or select task..."
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowTaskDropdown(!showTaskDropdown)}
//                 className="ml-2"
//               >
//                 <ChevronDown className="w-4 h-4 text-slate-500" />
//               </button>
//             </div>
//             {showTaskDropdown && (
//               <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                 {taskInput && !tasks.includes(taskInput) && (
//                   <div
//                     className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
//                     onClick={() => {
//                       handleInputChange("task", taskInput);
//                       setShowTaskDropdown(false);
//                     }}
//                   >
//                     <span className="font-medium text-indigo-700">+ Add new: </span>
//                     <span className="text-slate-800">{taskInput}</span>
//                   </div>
//                 )}
//                 {filteredTasks.length > 0 ? (
//                   filteredTasks.map((t, idx) => (
//                     <div
//                       key={idx}
//                       className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
//                       onClick={() => {
//                         setTaskInput(t);
//                         handleInputChange("task", t);
//                         setShowTaskDropdown(false);
//                       }}
//                     >
//                       {t}
//                     </div>
//                   ))
//                 ) : (
//                   !taskInput && (
//                     <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
//                   )
//                 )}
//               </div>
//             )}
//           </div>
//           <p className="text-xs text-slate-500 mt-1">
//             Select from existing or type to add new
//           </p>
//         </div>

//         {/* Unit Type - Dropdown with Custom Input */}
//         <div className="relative" ref={unitTypeDropdownRef}>
//           <label className="block text-xs font-medium text-slate-700 mb-1">
//             Unit Type <span className="text-red-500">*</span>
//           </label>
//           <div className="relative">
//             <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
//               <input
//                 type="text"
//                 className="flex-1 outline-none text-sm"
//                 value={unitTypeInput}
//                 onChange={(e) => {
//                   setUnitTypeInput(e.target.value);
//                   handleInputChange("unitType", e.target.value);
//                   setShowUnitTypeDropdown(true);
//                 }}
//                 onFocus={() => setShowUnitTypeDropdown(true)}
//                 placeholder="Type or select unit type..."
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowUnitTypeDropdown(!showUnitTypeDropdown)}
//                 className="ml-2"
//               >
//                 <ChevronDown className="w-4 h-4 text-slate-500" />
//               </button>
//             </div>
//             {showUnitTypeDropdown && (
//               <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                 {unitTypeInput && !unitTypeOptions.includes(unitTypeInput) && (
//                   <div
//                     className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
//                     onClick={() => {
//                       handleInputChange("unitType", unitTypeInput);
//                       setShowUnitTypeDropdown(false);
//                     }}
//                   >
//                     <span className="font-medium text-indigo-700">+ Add new: </span>
//                     <span className="text-slate-800">{unitTypeInput}</span>
//                   </div>
//                 )}
//                 {filteredUnitTypes.length > 0 ? (
//                   filteredUnitTypes.map((ut, idx) => (
//                     <div
//                       key={idx}
//                       className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
//                       onClick={() => {
//                         setUnitTypeInput(ut);
//                         handleInputChange("unitType", ut);
//                         setShowUnitTypeDropdown(false);
//                       }}
//                     >
//                       {ut}
//                     </div>
//                   ))
//                 ) : (
//                   !unitTypeInput && (
//                     <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
//                   )
//                 )}
//               </div>
//             )}
//           </div>
//           <p className="text-xs text-slate-500 mt-1">
//             Select from existing or type to add new
//           </p>
//         </div>
//       </div>

//       <div className="mt-6 flex justify-end gap-2">
//         <button
//           className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-slate-800 disabled:bg-gray-100 disabled:text-slate-400"
//           onClick={onCancel}
//           disabled={loading}
//         >
//           Cancel
//         </button>
//         <button
//           className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white flex items-center gap-2"
//           onClick={onSubmit}
//           disabled={loading}
//         >
//           {loading && (
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//           )}
//           {isEdit ? "Save Changes" : "Add Unit Type"}
//         </button>
//       </div>
//     </div>
//   );
// }

// function Modal({ onClose, title, children }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//       <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
//           <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
//           <button
//             onClick={onClose}
//             className="text-slate-600 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100"
//           >
//             <XIcon className="w-5 h-5" />
//           </button>
//         </div>
//         <div className="p-6">{children}</div>
//       </div>
//     </div>
//   );
// }

// function Th({ children }) {
//   return (
//     <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">
//       {children}
//     </th>
//   );
// }

// function Td({ children }) {
//   return <td className="px-4 py-3 text-slate-700">{children}</td>;
// }

// /* =================== SIDEBAR =================== */
// function SidebarLinks({ navigate, location, close }) {
//   const [openWorklogs, setOpenWorklogs] = useState(false);
//   const [openProjects, setOpenProjects] = useState(false);

//   useEffect(() => {
//     if (location.pathname.includes("worklog")) setOpenWorklogs(true);
//     if (
//       location.pathname.includes("project") ||
//       location.pathname.includes("abbreviations")
//     )
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
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname === "/admin-dashboard" ? "bg-gray-700" : ""
//           }`}
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
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("approve-worklogs")
//                     ? "bg-gray-700"
//                     : ""
//                 }`}
//                 onClick={() => handleNavigation("/admin/approve-worklogs")}
//               >
//                 Approve Worklogs
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("edit-worklog-entries")
//                     ? "bg-gray-700"
//                     : ""
//                 }`}
//                 onClick={() => handleNavigation("/admin/edit-worklog-entries")}
//               >
//                 Edit Worklogs
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Employees */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname.includes("handle-employees") ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/admin/handle-employees")}
//         >
//           Manage Employees
//         </button>
//              <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname.includes("push-missing-request") ? "bg-gray-700" : ""
//             }`}
//           onClick={() => { navigate("/admin/push-missing-request"); close(); }}
//         >
//           Push Missing Requests
//         </button>

//         {/* Teams */}
//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname.includes("team-wise-dropdowns")
//               ? "bg-gray-700"
//               : ""
//           }`}
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
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("add-abbreviations")
//                     ? "bg-gray-700"
//                     : ""
//                 }`}
//                 onClick={() => handleNavigation("/admin/add-abbreviations")}
//               >
//                 Add Abbreviations
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("add-project") ? "bg-gray-700" : ""
//                 }`}
//                 onClick={() => handleNavigation("/admin/add-project")}
//               >
//                 Add Project
//               </button>
//               <button
//                 className={`text-left hover:bg-gray-700 p-2 rounded-lg transition-colors ${
//                   location.pathname.includes("project-requests")
//                     ? "bg-gray-700"
//                     : ""
//                 }`}
//                 onClick={() => handleNavigation("/admin/project-requests")}
//               >
//                 Project Requests
//               </button>
//             </div>
//           )}
//         </div>

//         <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
//             location.pathname === "/admin/add-unit-type" ? "bg-gray-700" : ""
//           }`}
//           onClick={() => handleNavigation("/admin/add-unit-type")}
//         >
//           Add Unit Type
//         </button>
//             <button
//           className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${location.pathname === "mark-shift" ? "bg-gray-700" : ""}`}
//           onClick={() => handleNavigation("/admin/mark-shift")}
//         >
//           Mark Extra Shift
//         </button>
//       </nav>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import {
  Filter as FilterIcon,
  Plus,
  Trash2,
  Search,
  X as XIcon,
  Edit3,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

const API_BASE_URL = import.meta.env?.VITE_API_BASE;

/* =================== MAIN PAGE =================== */
export default function AdminUnitTypeManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Unit Types State
  const [unitTypes, setUnitTypes] = useState([]);
  const [filteredUnitTypes, setFilteredUnitTypes] = useState([]);
  const [bookElementFilter, setBookElementFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [unitTypeFilter, setUnitTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dropdown data
  const [bookElements, setBookElements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState([]);

  // Add Unit Type Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUnitType, setNewUnitType] = useState({
    bookElement: "",
    task: "",
    unitType: "",
  });

  // Edit Unit Type Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUnitType, setEditUnitType] = useState(null);

  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState("");

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
       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchPendingCount();
      fetchProjectPendingCount();
    } catch (e) {
      console.error("Invalid token:", e);
      localStorage.removeItem("authToken");
      navigate("/");
    }
  }, [navigate]);

  /* ------------------ FETCH UNIT TYPES ------------------ */
  const fetchUnitTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const unitTypesArray = Array.isArray(data) ? data : data.unitTypes || [];
      setUnitTypes(unitTypesArray);
    } catch (err) {
      console.error("Error fetching unit types:", err);
      setError("Failed to fetch unit types. Please try again.");
      setUnitTypes([]);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ FETCH DROPDOWN DATA ------------------ */
  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      // Fetch Book Elements
      const bookRes = await fetch(`${API_BASE_URL}/admin/unit/book-elements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const bookData = await bookRes.json();
      setBookElements(bookData.bookElements || []);

      // Fetch Tasks
      const taskRes = await fetch(`${API_BASE_URL}/admin/unit/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const taskData = await taskRes.json();
      setTasks(taskData.tasks || []);

      // Fetch Unit Type Options
      const unitRes = await fetch(`${API_BASE_URL}/admin/unit/unit-type-options`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const unitData = await unitRes.json();
      setUnitTypeOptions(unitData.unitTypes || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnitTypes();
      fetchDropdownData();
    }
  }, [user]);

  /* ------------------ FILTER ------------------ */
  useEffect(() => {
    if (!Array.isArray(unitTypes)) {
      setFilteredUnitTypes([]);
      return;
    }
    let filtered = [...unitTypes];
    if (bookElementFilter) {
      filtered = filtered.filter((ut) =>
        ut.bookElement?.toLowerCase().includes(bookElementFilter.toLowerCase())
      );
    }
    if (taskFilter) {
      filtered = filtered.filter((ut) =>
        ut.task?.toLowerCase().includes(taskFilter.toLowerCase())
      );
    }
    if (unitTypeFilter) {
      filtered = filtered.filter((ut) =>
        ut.unitType?.toLowerCase().includes(unitTypeFilter.toLowerCase())
      );
    }
    setFilteredUnitTypes(filtered);
  }, [bookElementFilter, taskFilter, unitTypeFilter, unitTypes]);

  /* ------------------ ADD ------------------ */
  const handleAdd = async () => {
    if (!newUnitType.bookElement || !newUnitType.task || !newUnitType.unitType) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUnitType),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
      }
      const savedUnitType = responseData.unitType || responseData;
      setUnitTypes((prev) => [...prev, savedUnitType]);
      setAddModalOpen(false);
      setNewUnitType({
        bookElement: "",
        task: "",
        unitType: "",
      });
      setBookElementFilter("");
      setTaskFilter("");
      setUnitTypeFilter("");
      setSuccessMessage(responseData.message || "Unit type added successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      
      // Refresh dropdown data to include new values
      fetchDropdownData();
    } catch (err) {
      console.error("Error adding unit type:", err);
      setError(err.message || "Failed to add unit type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ EDIT ------------------ */
  const handleEdit = (unitType) => {
    setEditUnitType({ ...unitType });
    setEditModalOpen(true);
    setError("");
  };

  const handleSaveEdit = async () => {
    if (!editUnitType.bookElement || !editUnitType.task || !editUnitType.unitType) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const id = editUnitType.id || editUnitType._id;
      const res = await fetch(
        `${API_BASE_URL}/admin/unit/unit-types/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editUnitType),
        }
      );
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
      }
      const updatedUnitType = responseData.unitType || responseData;
      setUnitTypes((prev) =>
        prev.map((ut) => {
          const currentId = ut.id || ut._id;
          const updatedId = updatedUnitType.id || updatedUnitType._id;
          return currentId === updatedId ? updatedUnitType : ut;
        })
      );
      setEditModalOpen(false);
      setEditUnitType(null);
      setBookElementFilter("");
      setTaskFilter("");
      setUnitTypeFilter("");
      setSuccessMessage(responseData.message || "Unit type updated successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      
      // Refresh dropdown data
      fetchDropdownData();
    } catch (err) {
      console.error("Error updating unit type:", err);
      setError(err.message || "Failed to update unit type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ DELETE ------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit type?"))
      return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/admin/unit/unit-types/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${res.status}`);
      }
      setUnitTypes((prev) =>
        prev.filter((ut) => {
          const utId = ut.id || ut._id;
          return utId !== id;
        })
      );
      setBookElementFilter("");
      setTaskFilter("");
      setUnitTypeFilter("");
      setSuccessMessage(responseData.message || "Unit type deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error deleting unit type:", err);
      setError(err.message || "Failed to delete unit type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ LOGOUT ------------------ */
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  /* ------------------ CLEAR MESSAGES ------------------ */
  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
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

      {/* MAIN CONTENT */}
      <main className="lg:ml-72 pt-20 p-6">
        <div className="space-y-6">
          {/* Success/Error Messages */}
          {(successMessage || error) && (
            <MessageAlert
              message={successMessage || error}
              type={successMessage ? "success" : "error"}
              onClose={clearMessages}
            />
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-slate-600">Processing...</span>
            </div>
          )}

          {/* Filters */}
          <Filters
            bookElementFilter={bookElementFilter}
            setBookElementFilter={setBookElementFilter}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            unitTypeFilter={unitTypeFilter}
            setUnitTypeFilter={setUnitTypeFilter}
            setAddModalOpen={setAddModalOpen}
            onRefresh={fetchUnitTypes}
            loading={loading}
            bookElements={bookElements}
            tasks={tasks}
            unitTypeOptions={unitTypeOptions}
          />

          {/* Unit Types Table */}
          <UnitTypesTable
            filteredUnitTypes={filteredUnitTypes}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            loading={loading}
          />
        </div>
      </main>

      {/* Add Unit Type Modal */}
      {addModalOpen && (
        <Modal onClose={() => setAddModalOpen(false)} title="Add Unit Type">
          <UnitTypeForm
            unitType={newUnitType}
            setUnitType={setNewUnitType}
            onSubmit={handleAdd}
            onCancel={() => setAddModalOpen(false)}
            loading={loading}
            error={error}
            setError={setError}
            bookElements={bookElements}
            tasks={tasks}
            unitTypeOptions={unitTypeOptions}
          />
        </Modal>
      )}

      {/* Edit Unit Type Modal */}
      {editModalOpen && editUnitType && (
        <Modal onClose={() => setEditModalOpen(false)} title="Edit Unit Type">
          <UnitTypeForm
            unitType={editUnitType}
            setUnitType={setEditUnitType}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditModalOpen(false)}
            isEdit
            loading={loading}
            error={error}
            setError={setError}
            bookElements={bookElements}
            tasks={tasks}
            unitTypeOptions={unitTypeOptions}
          />
        </Modal>
      )}
    </div>
  );
}

/* =================== COMPONENTS =================== */

function MessageAlert({ message, type, onClose }) {
  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${
        type === "success"
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-start">
        {type === "success" ? (
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-medium ${
              type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message}
          </p>
          {type === "error" && (
            <p className="text-xs text-red-600 mt-1">
              Please verify the information and try again.
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className={`ml-4 ${
          type === "success"
            ? "text-green-600 hover:text-green-800"
            : "text-red-600 hover:text-red-800"
        } flex-shrink-0`}
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
              Admin Dashboard - Unit Types
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

function Filters({
  bookElementFilter,
  setBookElementFilter,
  taskFilter,
  setTaskFilter,
  unitTypeFilter,
  setUnitTypeFilter,
  setAddModalOpen,
  onRefresh,
  loading,
  bookElements,
  tasks,
  unitTypeOptions,
}) {
  const [bookElementSearch, setBookElementSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  
  const bookDropdownRef = useRef(null);
  const taskDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target)) {
        setShowTaskDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBookElements = bookElements.filter((be) =>
    be.toLowerCase().includes(bookElementSearch.toLowerCase())
  );
  const filteredTasks = tasks.filter((t) =>
    t.toLowerCase().includes(taskSearch.toLowerCase())
  );

  return (
    <div className="rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FilterIcon className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Book Element Filter */}
        <div className="relative" ref={bookDropdownRef}>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            BOOK ELEMENT
          </label>
          <div className="relative">
            <div
              className="flex items-center border rounded-lg bg-white px-3 py-2 shadow-sm w-full cursor-pointer"
              onClick={() => setShowBookDropdown(!showBookDropdown)}
            >
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input
                type="text"
                placeholder="Search book element..."
                value={bookElementSearch}
                onChange={(e) => setBookElementSearch(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBookDropdown(true);
                }}
                className="flex-1 outline-none text-sm"
              />
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
            {showBookDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBookElements.length > 0 ? (
                  filteredBookElements.map((be, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                      onClick={() => {
                        setBookElementFilter(be);
                        setBookElementSearch(be);
                        setShowBookDropdown(false);
                      }}
                    >
                      {be}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>
          {bookElementFilter && (
            <button
              onClick={() => {
                setBookElementFilter("");
                setBookElementSearch("");
              }}
              className="absolute right-10 top-9 text-slate-400 hover:text-slate-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Task Filter */}
        <div className="relative" ref={taskDropdownRef}>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            TASK
          </label>
          <div className="relative">
            <div
              className="flex items-center border rounded-lg bg-white px-3 py-2 shadow-sm w-full cursor-pointer"
              onClick={() => setShowTaskDropdown(!showTaskDropdown)}
            >
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input
                type="text"
                placeholder="Search task..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTaskDropdown(true);
                }}
                className="flex-1 outline-none text-sm"
              />
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
            {showTaskDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                      onClick={() => {
                        setTaskFilter(t);
                        setTaskSearch(t);
                        setShowTaskDropdown(false);
                      }}
                    >
                      {t}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>
          {taskFilter && (
            <button
              onClick={() => {
                setTaskFilter("");
                setTaskSearch("");
              }}
              className="absolute right-10 top-9 text-slate-400 hover:text-slate-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Unit Type Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            UNIT TYPE
          </label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={unitTypeFilter}
            onChange={(e) => setUnitTypeFilter(e.target.value)}
          >
            <option value="">All Unit Types</option>
            {unitTypeOptions.map((ut, idx) => (
              <option key={idx} value={ut}>
                {ut}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
        <button
          onClick={() => setAddModalOpen(true)}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Unit Type
        </button>
      </div>
    </div>
  );
}

function UnitTypesTable({
  filteredUnitTypes,
  handleDelete,
  handleEdit,
  loading,
}) {
  const safeUnitTypes = Array.isArray(filteredUnitTypes) ? filteredUnitTypes : [];

  if (loading && safeUnitTypes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-slate-600">Loading unit types...</span>
        </div>
      </div>
    );
  }

  if (safeUnitTypes.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl shadow border border-slate-200 p-8">
        <p className="text-center text-slate-500">
          No unit types found. Add your first unit type to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr className="text-slate-700">
                <Th>Book Element</Th>
                <Th>Task</Th>
                <Th>Unit Type</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {safeUnitTypes.map((ut, index) => {
                if (!ut || typeof ut !== "object") {
                  console.warn(`Invalid unit type at index ${index}:`, ut);
                  return null;
                }
                const utId = ut.id || ut._id || index;
                return (
                  <tr key={utId} className="border-t hover:bg-slate-50">
                    <Td>{ut.bookElement || "N/A"}</Td>
                    <Td>{ut.task || "N/A"}</Td>
                    <Td>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {ut.unitType || "N/A"}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <button
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md"
                          onClick={() => handleEdit(ut)}
                          disabled={loading}
                          title="Edit Unit Type"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-3 py-1 rounded-md"
                          onClick={() => handleDelete(utId)}
                          disabled={loading}
                          title="Delete Unit Type"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden max-h-[600px] overflow-y-auto divide-y divide-slate-200">
        {safeUnitTypes.map((ut, index) => {
          if (!ut || typeof ut !== "object") {
            console.warn(`Invalid unit type at index ${index}:`, ut);
            return null;
          }
          const utId = ut.id || ut._id || index;
          return (
            <div key={utId} className="p-4">
              <p className="text-sm mb-2">
                <span className="font-medium text-slate-700">Book Element:</span>
                <span className="ml-2 text-slate-800">{ut.bookElement || "N/A"}</span>
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium text-slate-700">Task:</span>
                <span className="ml-2 text-slate-800">{ut.task || "N/A"}</span>
              </p>
              <p className="text-sm mb-3">
                <span className="font-medium text-slate-700">Unit Type:</span>
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {ut.unitType || "N/A"}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                  onClick={() => handleEdit(ut)}
                  disabled={loading}
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                  onClick={() => handleDelete(utId)}
                  disabled={loading}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitTypeForm({
  unitType,
  setUnitType,
  onSubmit,
  onCancel,
  isEdit,
  loading,
  error,
  setError,
  bookElements,
  tasks,
  unitTypeOptions,
}) {
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showUnitTypeDropdown, setShowUnitTypeDropdown] = useState(false);
  
  const [bookElementInput, setBookElementInput] = useState(unitType.bookElement || "");
  const [taskInput, setTaskInput] = useState(unitType.task || "");
  const [unitTypeInput, setUnitTypeInput] = useState(unitType.unitType || "");

  const bookDropdownRef = useRef(null);
  const taskDropdownRef = useRef(null);
  const unitTypeDropdownRef = useRef(null);

  useEffect(() => {
    setBookElementInput(unitType.bookElement || "");
    setTaskInput(unitType.task || "");
    setUnitTypeInput(unitType.unitType || "");
  }, [unitType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target)) {
        setShowTaskDropdown(false);
      }
      if (unitTypeDropdownRef.current && !unitTypeDropdownRef.current.contains(event.target)) {
        setShowUnitTypeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (field, value) => {
    setUnitType({ ...unitType, [field]: value });
    if (error) setError("");
  };

  const filteredBookElements = bookElements.filter((be) =>
    be.toLowerCase().includes(bookElementInput.toLowerCase())
  );
  const filteredTasks = tasks.filter((t) =>
    t.toLowerCase().includes(taskInput.toLowerCase())
  );
  const filteredUnitTypes = unitTypeOptions.filter((ut) =>
    ut.toLowerCase().includes(unitTypeInput.toLowerCase())
  );

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Book Element - Dropdown with Custom Input */}
        <div className="relative" ref={bookDropdownRef}>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Book Element <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
              <input
                type="text"
                className="flex-1 outline-none text-sm"
                value={bookElementInput}
                onChange={(e) => {
                  setBookElementInput(e.target.value);
                  handleInputChange("bookElement", e.target.value);
                  setShowBookDropdown(true);
                }}
                onFocus={() => setShowBookDropdown(true)}
                placeholder="Type or select book element..."
              />
              <button
                type="button"
                onClick={() => setShowBookDropdown(!showBookDropdown)}
                className="ml-2"
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {showBookDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {bookElementInput && !bookElements.includes(bookElementInput) && (
                  <div
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
                    onClick={() => {
                      handleInputChange("bookElement", bookElementInput);
                      setShowBookDropdown(false);
                    }}
                  >
                    <span className="font-medium text-indigo-700">+ Add new: </span>
                    <span className="text-slate-800">{bookElementInput}</span>
                  </div>
                )}
                {filteredBookElements.length > 0 ? (
                  filteredBookElements.map((be, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                      onClick={() => {
                        setBookElementInput(be);
                        handleInputChange("bookElement", be);
                        setShowBookDropdown(false);
                      }}
                    >
                      {be}
                    </div>
                  ))
                ) : (
                  !bookElementInput && (
                    <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
                  )
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select from existing or type to add new
          </p>
        </div>

        {/* Task - Dropdown with Custom Input */}
        <div className="relative" ref={taskDropdownRef}>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Task <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
              <input
                type="text"
                className="flex-1 outline-none text-sm"
                value={taskInput}
                onChange={(e) => {
                  setTaskInput(e.target.value);
                  handleInputChange("task", e.target.value);
                  setShowTaskDropdown(true);
                }}
                onFocus={() => setShowTaskDropdown(true)}
                placeholder="Type or select task..."
              />
              <button
                type="button"
                onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                className="ml-2"
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {showTaskDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {taskInput && !tasks.includes(taskInput) && (
                  <div
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
                    onClick={() => {
                      handleInputChange("task", taskInput);
                      setShowTaskDropdown(false);
                    }}
                  >
                    <span className="font-medium text-indigo-700">+ Add new: </span>
                    <span className="text-slate-800">{taskInput}</span>
                  </div>
                )}
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                      onClick={() => {
                        setTaskInput(t);
                        handleInputChange("task", t);
                        setShowTaskDropdown(false);
                      }}
                    >
                      {t}
                    </div>
                  ))
                ) : (
                  !taskInput && (
                    <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
                  )
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select from existing or type to add new
          </p>
        </div>

        {/* Unit Type - Dropdown with Custom Input */}
        <div className="relative" ref={unitTypeDropdownRef}>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Unit Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm">
              <input
                type="text"
                className="flex-1 outline-none text-sm"
                value={unitTypeInput}
                onChange={(e) => {
                  setUnitTypeInput(e.target.value);
                  handleInputChange("unitType", e.target.value);
                  setShowUnitTypeDropdown(true);
                }}
                onFocus={() => setShowUnitTypeDropdown(true)}
                placeholder="Type or select unit type..."
              />
              <button
                type="button"
                onClick={() => setShowUnitTypeDropdown(!showUnitTypeDropdown)}
                className="ml-2"
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {showUnitTypeDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {unitTypeInput && !unitTypeOptions.includes(unitTypeInput) && (
                  <div
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm border-b border-slate-200"
                    onClick={() => {
                      handleInputChange("unitType", unitTypeInput);
                      setShowUnitTypeDropdown(false);
                    }}
                  >
                    <span className="font-medium text-indigo-700">+ Add new: </span>
                    <span className="text-slate-800">{unitTypeInput}</span>
                  </div>
                )}
                {filteredUnitTypes.length > 0 ? (
                  filteredUnitTypes.map((ut, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                      onClick={() => {
                        setUnitTypeInput(ut);
                        handleInputChange("unitType", ut);
                        setShowUnitTypeDropdown(false);
                      }}
                    >
                      {ut}
                    </div>
                  ))
                ) : (
                  !unitTypeInput && (
                    <div className="px-3 py-2 text-sm text-slate-500">Start typing to add new</div>
                  )
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select from existing or type to add new
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-slate-800 disabled:bg-gray-100 disabled:text-slate-400"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white flex items-center gap-2"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isEdit ? "Save Changes" : "Add Unit Type"}
        </button>
      </div>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
}

/* =================== SIDEBAR =================== */
function SidebarLinks({ navigate, location, close, pendingCount = 0, projectPendingCount = 0 }) {
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname.includes("team-wise-dropdowns")
              ? "bg-gray-700"
              : ""
          }`}
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
          className={`text-left hover:bg-gray-700 p-3 rounded-lg transition-colors ${
            location.pathname === "/admin/add-unit-type" ? "bg-gray-700" : ""
          }`}
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
