import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [user, setUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      // client_id:
      //   "523707882385-pmrt07cjsgu6cljlo1l3ufm201onutsb.apps.googleusercontent.com",
         client_id:import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(document.getElementById("googleSignInDiv"), {
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 240,
    });
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      // const res = await axios.post("http://localhost:5000/api/auth/google", {
      const res = await axios.post("https://my-tracker-app-3fqn.onrender.com/api/auth/google", {
        idToken: response.credential,
      });

      if (res.data.success) {
        const userData = res.data.user;
        setUser(userData);
        setJwtToken(res.data.token);
        localStorage.setItem("authToken", res.data.token);

        switch (userData.role.toLowerCase()) {
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
    google.accounts.id.disableAutoSelect();
  };

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
