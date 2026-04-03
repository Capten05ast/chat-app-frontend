


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
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300
          ${toast.type === "success" ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-red-500 text-white shadow-red-200"}`}
        >
          {toast.type === "success" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* ── NAVBAR ── */}
      <header className="bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 flex-shrink-0 shadow-lg shadow-violet-300/30">
        <div className="flex items-center gap-3 px-4 py-3">

          {/* LEFT — Avatar (always) */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-9 h-9 rounded-[12px] bg-white/20 border border-white/30 group-hover:border-white/60 flex items-center justify-center shadow-inner transition-all">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            {/* Name text — desktop only */}
            <div className="hidden sm:block text-left">
              <p className="text-white font-bold text-[14px] leading-tight">{user.fullName.firstName}</p>
              <p className="text-white/60 text-[11px] leading-none">Welcome back 👋</p>
            </div>
          </button>

          {/* CENTER */}
          <div className="flex-1 flex items-center justify-center">

            {/* Mobile: Bold brand name centered like WhatsApp/Instagram */}
            <div className="flex sm:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-[9px] bg-white/20 border border-white/30 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-black text-[16px] tracking-tight">Insta</span>
                <span className="text-pink-200 font-black text-[16px] tracking-tight -mt-0.5">Dopamine</span>
              </div>
            </div>

            {/* Desktop: brand + connect input */}
            <div className="hidden sm:flex items-center gap-2 w-full max-w-sm">
              <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/25 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <span className="text-white font-extrabold text-[13px] tracking-tight whitespace-nowrap">
                  Insta <span className="text-pink-200">Dopamine</span>
                </span>
              </div>
              <div className="hidden md:block w-px h-5 bg-white/20 flex-shrink-0" />
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  placeholder="Connect by email..."
                  className="w-full pl-8 pr-3 py-2 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 outline-none focus:bg-white/25 focus:border-white/40 transition-all"
                />
              </div>
              <button
                onClick={handleConnect}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/25 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 flex-shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>
          </div>

          {/* RIGHT — Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Mobile: connect icon tap-to-expand (full-bar overlay) */}
            <div className="sm:hidden">
              {showConnectInput && (
                <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 px-4 py-3 flex items-center gap-2 shadow-xl">
                  <input
                    value={connectEmail}
                    onChange={(e) => setConnectEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
                    placeholder="Enter email to connect..."
                    autoFocus
                    className="flex-1 px-3 py-2 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 outline-none focus:bg-white/25 transition-all"
                  />
                  <button onClick={handleConnect} className="px-3 py-2 bg-white/25 border border-white/25 text-white text-sm font-semibold rounded-xl active:scale-95 flex-shrink-0">
                    Add
                  </button>
                  <button onClick={() => setShowConnectInput(false)} className="p-2 text-white/70 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowConnectInput(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:scale-95"
                title="Connect by email"
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
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {pendingInvites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white/30">
                    {pendingInvites.length}
                  </span>
                )}
              </button>

              {showInvites && (
                <div className="absolute right-0 top-11 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Group Invites</span>
                    {pendingInvites.length > 0 && (
                      <span className="text-xs font-semibold text-white bg-violet-500 px-2 py-0.5 rounded-full">
                        {pendingInvites.length} new
                      </span>
                    )}
                  </div>
                  {pendingInvites.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500">No pending invites</p>
                      <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {pendingInvites.map((group) => (
                        <div key={group._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all">
                          <div className="w-10 h-10 rounded-[13px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-bold text-sm">{group.name[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                            <p className="text-xs text-gray-400">from {group.admin.fullName.firstName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => handleAccept(group._id)} className="px-2.5 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95">Accept</button>
                            <button onClick={() => handleDecline(group._id)} className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 text-xs font-semibold rounded-lg transition-all">Decline</button>
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
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-red-400/40 border border-white/20 text-white transition-all active:scale-95"
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

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden border-r border-gray-500 relative">
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

      {/* Profile Panel */}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdated={(updatedUser) => {
            setUser(updatedUser);
            setShowProfile(false);
            showToast("Profile updated successfully! ✅");
          }}
        />
      )}
    </div>
  );
}

export default Home;



