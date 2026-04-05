


import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import { socket } from "../socket";
import axios from "../api/axios";
import GroupChatBox from "../components/GroupChatBox";
import ProfilePanel from "../components/ProfilePannel";

function Home({ user, setUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectEmail, setConnectEmail] = useState("");
  const [toast, setToast] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);
  const [showConnectInput, setShowConnectInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      socket.connect();
      socket.emit("join", user._id);
    }
    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    fetchPendingInvites();
    const handleNewInvite = () => fetchPendingInvites();
    socket.on("new_group_invite", handleNewInvite);
    return () => socket.off("new_group_invite", handleNewInvite);
  }, []);

  useEffect(() => {
    const handleNewConnection = () => { sidebarRef.current?.fetchUsers(); };
    socket.on("new_connection", handleNewConnection);
    return () => socket.off("new_connection", handleNewConnection);
  }, []);

  useEffect(() => {
    const handleConnectionRemoved = ({ userId }) => {
      sidebarRef.current?.fetchUsers();
      setSelectedUser((prev) => {
        if (prev && !prev.isGroup && prev._id === userId) return null;
        return prev;
      });
    };
    socket.on("connection_removed", handleConnectionRemoved);
    return () => socket.off("connection_removed", handleConnectionRemoved);
  }, []);

  const fetchPendingInvites = async () => {
    try {
      const res = await axios.get("/groups/pending-invites");
      setPendingInvites(res.data);
    } catch (err) { console.log(err); }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
      socket.disconnect();
      window.location.href = "/login";
    } catch (err) { console.log(err); }
  };

  const handleConnect = async () => {
    if (!connectEmail.trim()) return;
    try {
      await axios.post("/users/connect", { email: connectEmail });
      showToast("Connected successfully! 🎉");
      setConnectEmail("");
      setShowConnectInput(false);
      setTimeout(() => sidebarRef.current?.fetchUsers(), 300);
    } catch (err) {
      showToast(err.response?.data?.message || "User not found!", "error");
    }
  };

  const handleAccept = async (groupId) => {
    try {
      await axios.post("/groups/accept", { groupId });
      showToast("Joined group successfully! 🎉");
      await Promise.all([fetchPendingInvites(), sidebarRef.current?.fetchGroups()]);
      setShowInvites(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong!", "error");
    }
  };

  const handleDecline = async (groupId) => {
    try {
      await axios.post("/groups/decline", { groupId });
      showToast("Invite declined", "error");
      fetchPendingInvites();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong!", "error");
    }
  };

  const initials = user.fullName.firstName[0]?.toUpperCase();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300 whitespace-nowrap
          ${toast.type === "success" ? "bg-zinc-900 text-white" : "bg-red-500 text-white"}`}
        >
          {toast.type === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
          {toast.message}
        </div>
      )}

      {/* ── NAVBAR ── */}
      <header className="bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 flex-shrink-0"
        style={{boxShadow:"0 2px 20px rgba(124,58,237,0.35)"}}>
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">

          {/* Avatar pill */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-9 h-9 rounded-[11px] bg-white/25 border-2 border-white/40 group-hover:border-white/70 flex items-center justify-center transition-all"
              style={{boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
              <span className="text-white font-black text-sm">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white font-black text-[14px] leading-tight tracking-tight">{user.fullName.firstName}</p>
              <p className="text-white/70 text-[11px] leading-none font-medium">Welcome back 👋</p>
            </div>
          </button>

          {/* Center */}
          <div className="flex-1 flex items-center justify-center">

            {/* Mobile brand */}
            <div className="flex sm:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-white/25 border border-white/30 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="text-white font-black text-[17px] tracking-tight">Insta<span className="text-pink-200">Dopamine</span></span>
            </div>

            {/* Desktop: brand + connect */}
            <div className="hidden sm:flex items-center gap-2 w-full max-w-sm">
              <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                <div className="w-6 h-6 rounded-lg bg-white/25 border border-white/25 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <span className="text-white font-black text-[14px] tracking-tight whitespace-nowrap">
                  Insta<span className="text-pink-200">Dopamine</span>
                </span>
              </div>
              <div className="hidden md:block w-px h-5 bg-white/30 flex-shrink-0" />
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  placeholder="Connect by email..."
                  className="w-full pl-8 pr-3 py-2 bg-white/20 border border-white/30 rounded-xl text-sm text-white placeholder-white/60 outline-none focus:bg-white/30 focus:border-white/50 transition-all font-medium"
                />
              </div>
              <button
                onClick={handleConnect}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-violet-600 text-sm font-black rounded-xl transition-all active:scale-95 flex-shrink-0 hover:bg-violet-50"
                style={{boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Mobile connect */}
            <div className="sm:hidden">
              {showConnectInput && (
                <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-2.5 flex items-center gap-2 shadow-xl">
                  <input
                    value={connectEmail}
                    onChange={(e) => setConnectEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
                    placeholder="Enter email to connect..."
                    autoFocus
                    className="flex-1 px-3 py-2.5 bg-white/20 border border-white/30 rounded-xl text-sm text-white placeholder-white/60 outline-none focus:bg-white/30 font-medium"
                  />
                  <button onClick={handleConnect} className="px-3 py-2.5 bg-white text-violet-600 text-sm font-black rounded-xl active:scale-95 flex-shrink-0">
                    Add
                  </button>
                  <button onClick={() => setShowConnectInput(false)} className="p-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowConnectInput(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white transition-all active:scale-95"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </button>
            </div>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setShowInvites(!showInvites)}
                className={`relative w-9 h-9 flex items-center justify-center rounded-xl border text-white transition-all active:scale-95
                  ${showInvites ? "bg-white/30 border-white/50" : "bg-white/20 border-white/30"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {pendingInvites.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {pendingInvites.length}
                  </span>
                )}
              </button>

              {showInvites && (
                <div className="absolute right-0 top-12 w-[320px] sm:w-80 bg-white rounded-2xl z-50 overflow-hidden"
                  style={{boxShadow:"0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)"}}>
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900">Group Invites</span>
                    {pendingInvites.length > 0 && (
                      <span className="text-[11px] font-bold text-white bg-violet-600 px-2.5 py-1 rounded-full">
                        {pendingInvites.length} pending
                      </span>
                    )}
                  </div>
                  {pendingInvites.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-700">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">No pending invites right now</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {pendingInvites.map((group) => (
                        <div key={group._id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-all">
                          <div className="w-10 h-10 rounded-[13px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0"
                            style={{boxShadow:"0 4px 12px rgba(124,58,237,0.3)"}}>
                            <span className="text-white font-black text-sm">{group.name[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">{group.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">from {group.admin.fullName.firstName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => handleAccept(group._id)}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95">
                              Accept
                            </button>
                            <button onClick={() => handleDecline(group._id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 text-xs font-bold rounded-lg transition-all">
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white hover:bg-red-500/40 transition-all active:scale-95"
              title="Logout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          ref={sidebarRef}
          currentUser={user}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {selectedUser?.isGroup ? (
          <GroupChatBox
            group={selectedUser}
            currentUser={user}
            onOpenSidebar={() => setSidebarOpen(true)}
            onGroupUpdated={() => {
              sidebarRef.current?.fetchUsers();
              sidebarRef.current?.fetchGroups();
            }}
          />
        ) : (
          <ChatBox
            selectedUser={selectedUser}
            currentUser={user}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </div>

      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdated={(updatedUser) => {
            setUser(updatedUser);
            setShowProfile(false);
            showToast("Profile updated! ✅");
          }}
        />
      )}
    </div>
  );
}

export default Home;


