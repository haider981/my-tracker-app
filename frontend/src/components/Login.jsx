// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";

// export default function Login() {
//   const [user, setUser] = useState(null);
//   const [jwtToken, setJwtToken] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   // Check for existing valid token on component mount
//   useEffect(() => {
//     checkExistingAuth();
//   }, []);

//   const checkExistingAuth = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       // Decode and check expiration
//       const decoded = jwtDecode(token);
//       const currentTime = Date.now() / 1000;
      
//       if (decoded.exp < currentTime) {
//         // Token expired, remove it
//         localStorage.removeItem("authToken");
//         setLoading(false);
//         return;
//       }

//       // Token is valid, set axios defaults and redirect
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      
//       const userData = {
//         name: decoded.name,
//         email: decoded.email,
//         role: decoded.role,
//         team: decoded.team,
//         picture: decoded.picture
//       };

//       setUser(userData);
//       setJwtToken(token);

//       // Auto-redirect to appropriate dashboard
//       redirectToDashboard(userData.role);

//     } catch (error) {
//       console.error("Token validation error:", error);
//       localStorage.removeItem("authToken");
//       setLoading(false);
//     }
//   };

//   const redirectToDashboard = (role) => {
//     switch (role?.toLowerCase()) {
//       case "employee":
//         navigate("/employee-dashboard");
//         break;
//       case "spoc":
//         navigate("/spoc-dashboard");
//         break;
//       case "admin":
//         navigate("/admin-dashboard");
//         break;
//       default:
//         navigate("/employee-dashboard");
//     }
//   };

//   useEffect(() => {
//     if (loading) return; // Don't initialize Google Sign-In while checking existing auth

//     /* global google */
//     if (window.google) {
//       google.accounts.id.initialize({
//         client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
//         callback: handleCredentialResponse,
//       });

//       google.accounts.id.renderButton(document.getElementById("googleSignInDiv"), {
//         theme: "filled_black",
//         size: "large",
//         text: "signin_with",
//         shape: "pill",
//         width: 240,
//       });
//     }
//   }, [loading]);

//   const handleCredentialResponse = async (response) => {
//     try {
//       const res = await axios.post(`${import.meta.env?.VITE_API_BASE}/auth/google`, {
//         idToken: response.credential,
//       });

//       if (res.data.success) {
//         const userData = res.data.user;
//         setUser(userData);
//         setJwtToken(res.data.token);
//         localStorage.setItem("authToken", res.data.token);

//         // Set axios defaults for future requests
//         axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;

//         redirectToDashboard(userData.role);
//       } else {
//         alert("Login failed");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       alert("Login error");
//     }
//   };

//   const handleLogout = () => {
//     setUser(null);
//     setJwtToken(null);
//     localStorage.removeItem("authToken");
//     if (window.google?.accounts?.id) {
//       google.accounts.id.disableAutoSelect();
//     }
//     // Clear axios authorization header
//     delete axios.defaults.headers.common.Authorization;
//   };

//   // Show loading while checking existing authentication
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
//           <p className="text-white">Checking authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
//       <div className="shadow-xl rounded-2xl p-10 w-full max-w-md border border-gray-700 text-center">
//         {!user ? (
//           <>
//             <h1 className="text-3xl font-bold text-white mb-3">
//               Welcome to VK's Employee WorkSphere
//             </h1>
//             <br /><br/>
//             <h2 className="text-lg text-gray-400 text-center max-w-xl mx-auto leading-relaxed">
//               A tool to help you organize, prioritize, and manage your tasks efficiently.
//             </h2><br/><br/><br/>

//             <p className="text-gray-400 mb-8">
//               Sign in with Google to access your dashboard
//             </p>
//             <div id="googleSignInDiv" className="flex justify-center mb-6"></div>
//             <p className="mt-6 text-xs text-gray-500">
//               By signing in, you agree to our{" "}
//               <a href="#" className="underline">
//                 Terms
//               </a>{" "}
//               &{" "}
//               <a href="#" className="underline">
//                 Privacy Policy
//               </a>
//               .
//             </p>
//           </>
//         ) : (
//           <div className="space-y-4">
//             <img
//               src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
//               alt="avatar"
//               className="w-16 h-16 mx-auto rounded-full shadow"
//             />
//             <h3 className="text-xl font-semibold text-white">
//               Welcome, {user.name}
//             </h3>
//             <p className="text-gray-400">Email: {user.email}</p>
//             <p className="text-gray-300 font-medium">
//               Role: <span className="text-blue-400">{user.role}</span>
//             </p>
//             <button
//               onClick={handleLogout}
//               className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md transition"
//             >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function Login() {
  const API_BASE = import.meta.env?.VITE_API_BASE;
  const [user, setUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing valid token on component mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      // Decode and check expiration
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired, remove it
        localStorage.removeItem("authToken");
        setLoading(false);
        return;
      }

      // Token is valid, set axios defaults and redirect
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      
      const userData = {
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        team: decoded.team,
        sub_team: decoded.sub_team,
        picture: decoded.picture
      };

      setUser(userData);
      setJwtToken(token);

      // Auto-redirect to appropriate dashboard
      redirectToDashboard(userData.role);

    } catch (error) {
      console.error("Token validation error:", error);
      localStorage.removeItem("authToken");
      setLoading(false);
    }
  };

  const redirectToDashboard = (role) => {
    switch (role?.toLowerCase()) {
      case "employee":
        navigate("/employee-dashboard");
        break;
      case "spoc":
        navigate("/spoc-dashboard");
        break;
      case "admin":
        navigate("/admin-dashboard");
        break;
      default:
        navigate("/employee-dashboard");
    }
  };

  useEffect(() => {
    if (loading) return; // Don't initialize Google Sign-In while checking existing auth

    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      google.accounts.id.renderButton(document.getElementById("googleSignInDiv"), {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 240,
      });
    }
  }, [loading]);

  const handleCredentialResponse = async (response) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        idToken: response.credential,
      });

      if (res.data.success) {
        const userData = res.data.user;
        setUser(userData);
        setJwtToken(res.data.token);
        localStorage.setItem("authToken", res.data.token);

        // Set axios defaults for future requests
        axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;

        redirectToDashboard(userData.role);
      } else {
        alert("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setJwtToken(null);
    localStorage.removeItem("authToken");
    if (window.google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
    // Clear axios authorization header
    delete axios.defaults.headers.common.Authorization;
  };

  // Show loading while checking existing authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="shadow-xl rounded-2xl p-10 w-full max-w-md border border-gray-700 text-center">
        {!user ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome to VK's Employee WorkSphere
            </h1>
            <br /><br/>
            <h2 className="text-lg text-gray-400 text-center max-w-xl mx-auto leading-relaxed">
              A tool to help you organize, prioritize, and manage your tasks efficiently.
            </h2><br/><br/><br/>

            <p className="text-gray-400 mb-8">
              Sign in with Google to access your dashboard
            </p>
            <div id="googleSignInDiv" className="flex justify-center mb-6"></div>
            <p className="mt-6 text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a href="#" className="underline">
                Terms
              </a>{" "}
              &{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <img
              src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
              alt="avatar"
              className="w-16 h-16 mx-auto rounded-full shadow"
            />
            <h3 className="text-xl font-semibold text-white">
              Welcome, {user.name}
            </h3>
            <p className="text-gray-400">Email: {user.email}</p>
            <p className="text-gray-300 font-medium">
              Role: <span className="text-blue-400">{user.role}</span>
            </p>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
