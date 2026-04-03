


import { useEffect, useState } from "react";
import axios from "./api/axios";
import AppRoutes from "./AppRoutes";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 prevent blank screen on load

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get("/users/me");
        setUser(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setUser(null); // expected — not logged in
        } else {
          console.log(err);
        }
      } finally {
        setLoading(false); // 🔥 always stop loading, success or fail
      }
    };

    checkUser();
  }, []);

  // 🔥 Splash screen while auth check runs
  // Prevents flash to /login before the check completes
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-xl shadow-violet-200 animate-pulse">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[15px] font-bold text-gray-900 tracking-tight">Chats</p>
          <p className="text-xs text-gray-400">Loading your account...</p>
        </div>
        <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <AppRoutes user={user} setUser={setUser} />;
}

export default App;



