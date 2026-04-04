


import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import axios from "../api/axios";
import { socket } from "../socket";
import CreateGroup from "./CreateGroup";

const getAvatarGradient = (name = "") => {
  const gradients = [
    "from-violet-400 to-indigo-500", "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",     "from-fuchsia-400 to-violet-500",
    "from-lime-400 to-emerald-500", "from-cyan-400 to-sky-500",
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return gradients[sum % gradients.length];
};

const StoryRing = ({ active, children }) => (
  <div className={`p-[2px] rounded-[17px] ${active ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400" : "bg-gray-200"}`}>
    <div className="border-[2px] border-white rounded-[15px]">{children}</div>
  </div>
);

function RenameModal({ group, onClose, onRenamed }) {
  const [name, setName] = useState(group.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || name.trim() === group.name) return onClose();
    setLoading(true);
    setError("");
    try {
      await axios.patch(`/groups/${group._id}/name`, { name: name.trim() });
      onRenamed(group._id, name.trim());
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to rename");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-gray-900">Rename Group</h3>
        <input
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:ring-2 focus:ring-violet-200 transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={40}
        />
        {error && <p className="text-[12px] text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-all">
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
    setLoading(true);
    setError("");
    try {
      await axios.delete(`/groups/${group._id}`);
      onDeleted(group._id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-bold text-gray-900">Delete Group</h3>
          <p className="text-[13px] text-gray-500">
            Delete <span className="font-semibold text-gray-700">"{group.name}"</span>? This can't be undone and all messages will be lost.
          </p>
        </div>
        {error && <p className="text-[12px] text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all">
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
    try {
      const res = await axios.get("/users");
      setUsers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get("/groups/my-groups");
      setGroups(res.data);
    } catch (err) { console.log(err); }
  };

  useImperativeHandle(ref, () => ({ fetchUsers, fetchGroups }));

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (u) => setOnlineUsers(u);

    // 🔥 new_connection — someone connected with us OR we connected with someone
    // Re-fetch users directly inside Sidebar — most reliable, no ref chain needed
    const handleNewConnection = () => {
      console.log("[socket] new_connection received — refreshing users");
      fetchUsers();
    };

    // 🔥 connection_removed — someone disconnected
    // Re-fetch users AND clear selected if that person's chat is open
    const handleConnectionRemoved = ({ userId }) => {
      console.log("[socket] connection_removed received — refreshing users", userId);
      fetchUsers();
      setSelectedUserRef.current((prev) => {
        if (prev && !prev.isGroup && prev._id?.toString() === userId?.toString()) return null;
        return prev;
      });
    };

    const handleMemberJoined = ({ groupId, members }) => {
      fetchGroups();
      if (members && members.length > 0) {
        setSelectedUserRef.current((prev) => {
          if (prev?.isGroup && prev._id?.toString() === groupId?.toString()) {
            return { ...prev, members };
          }
          return prev;
        });
        setGroups((prev) =>
          prev.map((g) =>
            g._id?.toString() === groupId?.toString() ? { ...g, members } : g
          )
        );
      }
    };

    const handleMembersUpdated = ({ groupId, members }) => {
      setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, members } : g));
      setSelectedUserRef.current((prev) =>
        prev?.isGroup && prev._id === groupId ? { ...prev, members } : prev
      );
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setSelectedUserRef.current((prev) =>
        prev?.isGroup && prev._id === groupId ? null : prev
      );
    };

    const handleNewGroupInvite = () => fetchGroups();

    const handleGroupNameUpdated = ({ groupId, name }) => {
      setGroups((prev) =>
        prev.map((g) => g._id === groupId ? { ...g, name } : g)
      );
      setSelectedUserRef.current((prev) =>
        prev?.isGroup && prev._id === groupId ? { ...prev, name } : prev
      );
    };

    const handleGroupDeleted = ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setSelectedUserRef.current((prev) =>
        prev?.isGroup && prev._id === groupId ? null : prev
      );
    };

    socket.on("online_users",          handleOnlineUsers);
    socket.on("new_connection",        handleNewConnection);      // 🔥 NEW
    socket.on("connection_removed",    handleConnectionRemoved);  // 🔥 NEW
    socket.on("group_member_joined",   handleMemberJoined);
    socket.on("group_members_updated", handleMembersUpdated);
    socket.on("removed_from_group",    handleRemovedFromGroup);
    socket.on("new_group_invite",      handleNewGroupInvite);
    socket.on("group_name_updated",    handleGroupNameUpdated);
    socket.on("group_deleted",         handleGroupDeleted);

    return () => {
      socket.off("online_users",          handleOnlineUsers);
      socket.off("new_connection",        handleNewConnection);
      socket.off("connection_removed",    handleConnectionRemoved);
      socket.off("group_member_joined",   handleMemberJoined);
      socket.off("group_members_updated", handleMembersUpdated);
      socket.off("removed_from_group",    handleRemovedFromGroup);
      socket.off("new_group_invite",      handleNewGroupInvite);
      socket.off("group_name_updated",    handleGroupNameUpdated);
      socket.off("group_deleted",         handleGroupDeleted);
    };
  }, []);

  const handleDisconnect = async (e, userId) => {
    e.stopPropagation();
    try {
      await axios.post("/users/disconnect", { userId });
      // Optimistic local removal — don't wait for socket
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelectedUserRef.current((prev) =>
        prev && !prev.isGroup && prev._id === userId ? null : prev
      );
    } catch (err) { console.log(err); }
  };

  const handleRenamed = (groupId, name) => {
    setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, name } : g));
    setSelectedUserRef.current((prev) =>
      prev?.isGroup && prev._id === groupId ? { ...prev, name } : prev
    );
  };

  const handleDeleted = (groupId) => {
    setGroups((prev) => prev.filter((g) => g._id !== groupId));
    setSelectedUserRef.current((prev) =>
      prev?.isGroup && prev._id === groupId ? null : prev
    );
  };

  const filteredUsers  = users.filter((u)  => u.fullName.firstName.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectUser  = (user)  => { setSelectedUser({ ...user,  isGroup: false }); if (onClose) onClose(); };
  const handleSelectGroup = (group) => { setSelectedUser({ ...group, isGroup: true  }); if (onClose) onClose(); };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      {renameTarget && (
        <RenameModal group={renameTarget} onClose={() => setRenameTarget(null)} onRenamed={handleRenamed} />
      )}
      {deleteTarget && (
        <DeleteGroupModal group={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      )}

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
        fixed md:static inset-y-0 left-0 z-30
        w-[300px] md:w-72 lg:w-80
        h-full bg-white
        border-r border-gray-100
        flex flex-col
        shadow-2xl md:shadow-none
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* ── HEADER ── */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-md shadow-violet-200">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight">Messages</span>
            </div>
            <div className="flex gap-1">
              <button onClick={onClose} className="md:hidden p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <button className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-2 focus:ring-violet-100 transition-all"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === "dms" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >💬 Direct</button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === "groups" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >👥 Groups</button>
          </div>
        </div>

        {/* Story-ring avatars row */}
        {activeTab === "dms" && filteredUsers.length > 0 && (
          <div className="px-4 pb-3 overflow-x-auto flex gap-3 scrollbar-none">
            {filteredUsers.slice(0, 6).map((user) => {
              const isOnline = onlineUsers.includes(user._id.toString());
              return (
                <button key={user._id} onClick={() => handleSelectUser(user)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                  <StoryRing active={isOnline}>
                    <div className={`w-12 h-12 rounded-[13px] bg-gradient-to-br ${getAvatarGradient(user.fullName.firstName)} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg leading-none">{user.fullName.firstName[0]?.toUpperCase()}</span>
                    </div>
                  </StoryRing>
                  <span className="text-[10px] font-medium text-gray-500 truncate max-w-[52px]">{user.fullName.firstName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Section label */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            {activeTab === "dms" ? `People · ${filteredUsers.length}` : `Groups · ${filteredGroups.length}`}
          </span>
          {activeTab === "groups" && (
            <button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-700 transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Group
            </button>
          )}
        </div>

        {/* ── LIST ── */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-px">

          {/* DMs */}
          {activeTab === "dms" && (
            <>
              {filteredUsers.map((user) => {
                const isOnline   = onlineUsers.includes(user._id.toString());
                const isSelected = selectedUser?._id === user._id && !selectedUser?.isGroup;
                return (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 group
                      ${isSelected ? "bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100" : "border border-transparent hover:bg-gray-50"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-[15px] bg-gradient-to-br ${getAvatarGradient(user.fullName.firstName)} flex items-center justify-center shadow-sm`}>
                        <span className="text-white font-bold text-lg leading-none">{user.fullName.firstName[0]?.toUpperCase()}</span>
                      </div>
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[14px] font-semibold truncate ${isSelected ? "text-violet-700" : "text-gray-900"}`}>
                          {user.fullName.firstName}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{isOnline ? "now" : ""}</span>
                      </div>
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                        {isOnline ? "Active now" : "Tap to message"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDisconnect(e, user._id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all duration-150"
                      title="Disconnect"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No connections yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add someone by email from the navbar</p>
                </div>
              )}
            </>
          )}

          {/* Groups */}
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 group
                      ${isSelected ? "bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100" : "border border-transparent hover:bg-gray-50"}`}
                  >
                    <div className="w-12 h-12 rounded-[15px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-white font-bold text-lg leading-none">{group.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[14px] font-semibold truncate block ${isSelected ? "text-violet-700" : "text-gray-900"}`}>
                        {group.name}
                      </span>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {isAdmin ? (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenameTarget(group); }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-all"
                          title="Rename group"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(group); }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                          title="Delete group"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <svg className={`w-4 h-4 flex-shrink-0 transition-all ${isSelected ? "text-violet-400 opacity-100" : "text-gray-300 opacity-0 group-hover:opacity-100"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                  </div>
                );
              })}
              {filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No groups yet</p>
                  <button onClick={() => setShowCreateGroup(true)} className="text-xs text-violet-500 font-semibold mt-1 hover:underline">
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



