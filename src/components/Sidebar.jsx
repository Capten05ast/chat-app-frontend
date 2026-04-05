


import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import axios from "../api/axios";
import { socket } from "../socket";
import CreateGroup from "./CreateGroup";

const getAvatarGradient = (name = "") => {
  const gradients = [
    "from-violet-500 to-indigo-600", "from-rose-500 to-pink-600",
    "from-amber-400 to-orange-500",  "from-emerald-500 to-teal-600",
    "from-sky-500 to-blue-600",      "from-fuchsia-500 to-violet-600",
    "from-lime-500 to-emerald-600",  "from-cyan-500 to-sky-600",
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return gradients[sum % gradients.length];
};

const StoryRing = ({ active, children }) => (
  <div className={`p-[2.5px] rounded-[17px] ${active
    ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400"
    : "bg-gray-200"}`}>
    <div className={`${active ? "border-[2px] border-white rounded-[14.5px]" : ""}`}>
      {children}
    </div>
  </div>
);

function RenameModal({ group, onClose, onRenamed }) {
  const [name, setName] = useState(group.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || name.trim() === group.name) return onClose();
    setLoading(true); setError("");
    try {
      await axios.patch(`/groups/${group._id}/name`, { name: name.trim() });
      onRenamed(group._id, name.trim());
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to rename");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4"
        style={{boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        <div>
          <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Rename Group</h3>
          <p className="text-[13px] text-gray-500 font-semibold mt-1">Give your group a new name</p>
        </div>
        <input
          autoFocus
          className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-bold text-gray-900 outline-none transition-all bg-gray-50"
          style={{border:"2px solid #e5e7eb", fontFamily:"inherit"}}
          onFocus={e => e.target.style.borderColor="#7c3aed"}
          onBlur={e => e.target.style.borderColor="#e5e7eb"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={40}
        />
        {error && <p className="text-[13px] text-red-500 font-bold">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="px-5 py-2.5 rounded-xl text-[14px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
            style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteGroupModal({ group, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true); setError("");
    try {
      await axios.delete(`/groups/${group._id}`);
      onDeleted(group._id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4"
        style={{boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Delete Group</h3>
          <p className="text-[14px] text-gray-500 font-semibold leading-relaxed">
            Delete <span className="font-black text-gray-800">"{group.name}"</span>? This can't be undone and all messages will be lost.
          </p>
        </div>
        {error && <p className="text-[13px] text-red-500 font-bold">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="px-5 py-2.5 rounded-xl text-[14px] font-black text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all active:scale-95">
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Sidebar = forwardRef(function Sidebar(
  { setSelectedUser, selectedUser, currentUser, isOpen, onClose }, ref
) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dms");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const setSelectedUserRef = useRef(setSelectedUser);
  useEffect(() => { setSelectedUserRef.current = setSelectedUser; }, [setSelectedUser]);

  const fetchUsers = async () => {
    try { const res = await axios.get("/users"); setUsers(res.data); } catch (err) { console.log(err); }
  };
  const fetchGroups = async () => {
    try { const res = await axios.get("/groups/my-groups"); setGroups(res.data); } catch (err) { console.log(err); }
  };

  useImperativeHandle(ref, () => ({ fetchUsers, fetchGroups }));
  useEffect(() => { fetchUsers(); fetchGroups(); }, []);

  useEffect(() => {
    const handleOnlineUsers = (u) => setOnlineUsers(u);
    const handleNewConnection = () => { console.log("[socket] new_connection"); fetchUsers(); };
    const handleConnectionRemoved = ({ userId }) => {
      fetchUsers();
      setSelectedUserRef.current((prev) => {
        if (prev && !prev.isGroup && prev._id?.toString() === userId?.toString()) return null;
        return prev;
      });
    };
    const handleMemberJoined = ({ groupId, members }) => {
      fetchGroups();
      if (members?.length > 0) {
        setSelectedUserRef.current((prev) => prev?.isGroup && prev._id?.toString() === groupId?.toString() ? { ...prev, members } : prev);
        setGroups((prev) => prev.map((g) => g._id?.toString() === groupId?.toString() ? { ...g, members } : g));
      }
    };
    const handleMembersUpdated = ({ groupId, members }) => {
      setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, members } : g));
      setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? { ...prev, members } : prev);
    };
    const handleRemovedFromGroup = ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? null : prev);
    };
    const handleGroupNameUpdated = ({ groupId, name }) => {
      setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, name } : g));
      setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? { ...prev, name } : prev);
    };
    const handleGroupDeleted = ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? null : prev);
    };

    socket.on("online_users",          handleOnlineUsers);
    socket.on("new_connection",        handleNewConnection);
    socket.on("connection_removed",    handleConnectionRemoved);
    socket.on("group_member_joined",   handleMemberJoined);
    socket.on("group_members_updated", handleMembersUpdated);
    socket.on("removed_from_group",    handleRemovedFromGroup);
    socket.on("new_group_invite",      fetchGroups);
    socket.on("group_name_updated",    handleGroupNameUpdated);
    socket.on("group_deleted",         handleGroupDeleted);

    return () => {
      socket.off("online_users",          handleOnlineUsers);
      socket.off("new_connection",        handleNewConnection);
      socket.off("connection_removed",    handleConnectionRemoved);
      socket.off("group_member_joined",   handleMemberJoined);
      socket.off("group_members_updated", handleMembersUpdated);
      socket.off("removed_from_group",    handleRemovedFromGroup);
      socket.off("new_group_invite",      fetchGroups);
      socket.off("group_name_updated",    handleGroupNameUpdated);
      socket.off("group_deleted",         handleGroupDeleted);
    };
  }, []);

  const handleDisconnect = async (e, userId) => {
    e.stopPropagation();
    try {
      await axios.post("/users/disconnect", { userId });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelectedUserRef.current((prev) => prev && !prev.isGroup && prev._id === userId ? null : prev);
    } catch (err) { console.log(err); }
  };

  const handleRenamed = (groupId, name) => {
    setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, name } : g));
    setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? { ...prev, name } : prev);
  };
  const handleDeleted = (groupId) => {
    setGroups((prev) => prev.filter((g) => g._id !== groupId));
    setSelectedUserRef.current((prev) => prev?.isGroup && prev._id === groupId ? null : prev);
  };

  const filteredUsers  = users.filter((u)  => u.fullName.firstName.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectUser  = (user)  => { setSelectedUser({ ...user,  isGroup: false }); if (onClose) onClose(); };
  const handleSelectGroup = (group) => { setSelectedUser({ ...group, isGroup: true  }); if (onClose) onClose(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .sb-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .sb-list::-webkit-scrollbar { width: 3px; }
        .sb-list::-webkit-scrollbar-thumb { background: #ede9fe; border-radius: 99px; }
        .sb-story::-webkit-scrollbar { display: none; }
      `}</style>

      {isOpen && (
        <div className=" pt-20 fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={onClose}/>
      )}

      {renameTarget && <RenameModal group={renameTarget} onClose={() => setRenameTarget(null)} onRenamed={handleRenamed}/>}
      {deleteTarget && <DeleteGroupModal group={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted}/>}

      {showCreateGroup && (
        <CreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(newGroup) => {
            fetchGroups();
            setActiveTab("groups");
            setSelectedUser({ ...newGroup, isGroup: true });
            if (onClose) onClose();
          }}
          connections={users}
        />
      )}

      <aside className={`
        sb-wrap
        fixed md:static inset-y-0 left-0 z-30
        w-[88vw] max-w-[340px] md:w-72 lg:w-80
        h-full bg-white
        border-r-2 border-gray-100
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `} style={{boxShadow: isOpen ? "6px 0 48px rgba(0,0,0,0.18)" : "none"}}>

        {/* ── HEADER ── */}
        <div className="px-4 pt-24 pb-3.5" style={{borderBottom:"2px solid #f3f4f6"}}>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Brand icon */}
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 4px 14px rgba(124,58,237,0.4)"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <span className="text-[20px] font-black text-gray-900 tracking-tight">Messages</span>
            </div>
            <button onClick={onClose} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-all active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3.5">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-[14px] font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all"
              style={{background:"#f8f7ff", border:"2px solid #ede9fe", fontFamily:"inherit"}}
              onFocus={e => e.target.style.borderColor="#c4b5fd"}
              onBlur={e => e.target.style.borderColor="#ede9fe"}
              placeholder="Search people & groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{background:"#f3f4f6"}}>
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex-1 py-2.5 text-[13px] font-black rounded-xl transition-all ${
                activeTab === "dms"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >💬 Direct</button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2.5 text-[13px] font-black rounded-xl transition-all ${
                activeTab === "groups"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >👥 Groups</button>
          </div>
        </div>

        {/* ── Story-ring row (DMs only) ── */}
        {activeTab === "dms" && filteredUsers.length > 0 && (
          <div className="sb-story px-4 py-3.5 overflow-x-auto flex gap-4" style={{borderBottom:"2px solid #f3f4f6"}}>
            {filteredUsers.slice(0, 7).map((user) => {
              const isOnline = onlineUsers.includes(user._id.toString());
              return (
                <button key={user._id} onClick={() => handleSelectUser(user)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform">
                  <StoryRing active={isOnline}>
                    <div className={`w-13 h-13 rounded-[14px] bg-gradient-to-br ${getAvatarGradient(user.fullName.firstName)} flex items-center justify-center`}
                      style={{width:52, height:52}}>
                      <span className="text-white font-black text-[20px] leading-none">{user.fullName.firstName[0]?.toUpperCase()}</span>
                    </div>
                  </StoryRing>
                  <span className="text-[11px] font-bold text-gray-600 truncate" style={{maxWidth:54}}>{user.fullName.firstName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Section label ── */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">
            {activeTab === "dms" ? `People · ${filteredUsers.length}` : `Groups · ${filteredGroups.length}`}
          </span>
          {activeTab === "groups" && (
            <button onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1.5 text-[12px] font-black text-violet-700 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Group
            </button>
          )}
        </div>

        {/* ── LIST ── */}
        <div className="sb-list flex-1 overflow-y-auto px-2 pb-6 space-y-1">

          {/* ── DMs ── */}
          {activeTab === "dms" && (
            <>
              {filteredUsers.map((user) => {
                const isOnline   = onlineUsers.includes(user._id.toString());
                const isSelected = selectedUser?._id === user._id && !selectedUser?.isGroup;
                return (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`flex items-center gap-3.5 px-3 py-3.5 rounded-2xl cursor-pointer transition-all duration-150 group
                      ${isSelected
                        ? "border-2 border-violet-200"
                        : "border-2 border-transparent hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    style={isSelected ? {background:"linear-gradient(135deg,#faf5ff,#fdf4ff)"} : {}}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${getAvatarGradient(user.fullName.firstName)} flex items-center justify-center`}
                        style={{boxShadow: isSelected ? "0 4px 16px rgba(124,58,237,0.35)" : "0 2px 10px rgba(0,0,0,0.1)"}}>
                        <span className="text-white font-black text-[22px] leading-none">{user.fullName.firstName[0]?.toUpperCase()}</span>
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                          style={{boxShadow:"0 0 0 2px rgba(16,185,129,0.25)"}}/>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[16px] font-black truncate tracking-tight ${isSelected ? "text-violet-700" : "text-gray-900"}`}>
                          {user.fullName.firstName}
                        </span>
                        {isOnline && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            live
                          </span>
                        )}
                      </div>
                      <p className={`text-[13px] font-semibold mt-0.5 truncate ${isOnline ? "text-emerald-600" : "text-gray-400"}`}>
                        {isOnline ? "Active now" : "Tap to message"}
                      </p>
                    </div>

                    {/* Disconnect btn */}
                    <button
                      onClick={(e) => handleDisconnect(e, user._id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-9 h-9 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center active:scale-95"
                      title="Disconnect"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <p className="text-[16px] font-black text-gray-800">No connections yet</p>
                  <p className="text-[13px] font-semibold text-gray-400 mt-1.5 leading-relaxed max-w-[200px]">Add someone by email from the navbar</p>
                </div>
              )}
            </>
          )}

          {/* ── Groups ── */}
          {activeTab === "groups" && (
            <>
              {filteredGroups.map((group) => {
                const isSelected = selectedUser?._id === group._id && selectedUser?.isGroup;
                const isAdmin = group.admin?._id?.toString() === currentUser?._id?.toString()
                             || group.admin?.toString()       === currentUser?._id?.toString();
                return (
                  <div
                    key={group._id}
                    onClick={() => handleSelectGroup(group)}
                    className={`flex items-center gap-3.5 px-3 py-3.5 rounded-2xl cursor-pointer transition-all duration-150 group
                      ${isSelected
                        ? "border-2 border-violet-200"
                        : "border-2 border-transparent hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    style={isSelected ? {background:"linear-gradient(135deg,#faf5ff,#fdf4ff)"} : {}}
                  >
                    {/* Group avatar */}
                    <div className="w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 text-white font-black text-[22px]"
                      style={{
                        background:"linear-gradient(135deg,#7c3aed,#ec4899)",
                        boxShadow: isSelected ? "0 4px 16px rgba(124,58,237,0.4)" : "0 2px 10px rgba(124,58,237,0.25)"
                      }}>
                      {group.name[0].toUpperCase()}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-[16px] font-black truncate block tracking-tight ${isSelected ? "text-violet-700" : "text-gray-900"}`}>
                        {group.name}
                      </span>
                      <p className="text-[13px] font-semibold text-gray-400 mt-0.5">
                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Admin actions / chevron */}
                    {isAdmin ? (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenameTarget(group); }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(group); }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <svg className={`w-5 h-5 flex-shrink-0 transition-all ${isSelected ? "text-violet-400 opacity-100" : "text-gray-300 opacity-0 group-hover:opacity-100"}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                  </div>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <p className="text-[16px] font-black text-gray-800">No groups yet</p>
                  <button onClick={() => setShowCreateGroup(true)}
                    className="text-[13px] font-black text-violet-700 mt-2 px-4 py-2 rounded-xl transition-all active:scale-95"
                    style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
                    Create your first group →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
});

export default Sidebar;



