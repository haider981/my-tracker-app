// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import "./index.css"
// import Login from "./components/Login";
// import EmployeeDashboard from "./components/EmployeeDashboard";
// import SpocDashboard from "./components/SpocDashboard";
// import SpocAddProject from "./components/SpocAddProject";
// import SpocApproveWorklogs from "./components/SpocApproveWorklogs";
// import MarkNightShift from "./components/MarkNightShift";

// import AdminDashboard from "./components/AdminDashboard";
// import AdminAddProject from "./components/AdminAddProject";
// import AdminAddAbbreviations from "./components/AdminAddAbbreviations";
// import AdminProjectRequests from "./components/AdminProjectRequests";
// import AdminHandleEmployees from "./components/AdminHandleEmployees";
// import AdminApproveWorklogs from "./components/AdminApproveWorklogs";
// import AdminEditWorklogEntries from "./components/AdminEditWorklogEntries";



// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
//         <Route path="/spoc-dashboard" element={<SpocDashboard />} />
//         <Route path="/spoc/add-project" element={<SpocAddProject />} />
//         <Route path="/spoc/approve-worklogs" element={<SpocApproveWorklogs />} />
//         <Route path="/spoc/mark-night-shift" element={<MarkNightShift />} />

//         <Route path="/admin-dashboard" element={<AdminDashboard />} />
//         <Route path="/admin/add-project" element={<AdminAddProject />} />
//         <Route path="/admin/add-abbreviations" element={<AdminAddAbbreviations />} />
//         <Route path="/admin/project-requests" element={<AdminProjectRequests />} />
//         <Route path="/admin/handle-employees" element={<AdminHandleEmployees />} />
//         <Route path="/admin/approve-worklogs" element={<AdminApproveWorklogs />} />
//         <Route path="/admin/edit-worklog-entries" element={<AdminEditWorklogEntries />} />

//       </Routes>
//     </Router>
//   );
// }


import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css"
import Login from "./components/Login";
import EmployeeDashboard from "./components/EmployeeDashboard";
import SpocDashboard from "./components/SpocDashboard";
import SpocAddProject from "./components/SpocAddProject";
import SpocApproveWorklogs from "./components/SpocApproveWorklogs";
import MarkNightShift from "./components/MarkNightShift";

import AdminDashboard from "./components/AdminDashboard";
import AdminAddProject from "./components/AdminAddProject";
import AdminAddAbbreviations from "./components/AdminAddAbbreviations";
import AdminProjectRequests from "./components/AdminProjectRequests";
import AdminHandleEmployees from "./components/AdminHandleEmployees";
import AdminApproveWorklogs from "./components/AdminApproveWorklogs";
import AdminEditWorklogEntries from "./components/AdminEditWorklogEntries";
import ProtectedRoute from "./components/ProtectedRoute";
import TeamWiseDropdowns from "./components/TeamWiseDropdowns";
import AddEntryRequestSpoc from "./components/AddEntryRequestSpoc";
import SpocViewRequests from "./components/SpocViewRequests";
import AdminPushMissingRequest from "./components/AdminPushMissingRequest";
import AddEntryRequestEmp from "./components/AddEntryRequestEmp";
import AdminAddUnitType from "./components/AdminAddUnitType";
import AdminMarkExtraShift from "./components/AdminMarkExtraShift";
import EmployeeNotifications from "./components/EmployeeNotifications";
import SpocNotifications from "./components/SpocNotifications";


export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        
        {/* Employee Routes - Only accessible by employees */}
        <Route 
          path="/employee-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employee/add-entry-request" 
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <AddEntryRequestEmp />
            </ProtectedRoute>
          } 
        />
         <Route
          path="/employee/notifications"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeNotifications />
            </ProtectedRoute>
          }
        />
        
        {/* SPOC Routes - Only accessible by SPOC */}
        <Route 
          path="/spoc-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <SpocDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/spoc/add-project" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <SpocAddProject />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/spoc/approve-worklogs" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <SpocApproveWorklogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/spoc/mark-night-shift" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <MarkNightShift />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/spoc/missing-entry-request" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <AddEntryRequestSpoc />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/spoc/missing-entry-status" 
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <SpocViewRequests />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/spoc/notifications"
          element={
            <ProtectedRoute allowedRoles={["spoc"]}>
              <SpocNotifications />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes - Only accessible by admin */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/add-project" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddProject />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/add-abbreviations" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddAbbreviations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/project-requests" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProjectRequests />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/handle-employees" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHandleEmployees />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/approve-worklogs" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminApproveWorklogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/edit-worklog-entries" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminEditWorklogEntries />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/team-wise-dropdowns" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TeamWiseDropdowns />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/push-missing-request"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPushMissingRequest />
            </ProtectedRoute>
          }
        />
          <Route
          path="/admin/add-unit-type"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddUnitType />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mark-shift"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMarkExtraShift />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route - redirect to login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}
