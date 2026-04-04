


import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import { socket } from "../socket";
import GroupMessage from "./GroupMessage";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getAvatarGradient = (name = "") => {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-rose-400 to-pink-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
    "from-fuchsia-400 to-violet-600",
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return gradients[sum % gradients.length];
};

function GroupChatBox({ group, currentUser, onOpenSidebar, onGroupUpdated }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [connections, setConnections] = useState([]);
  const [showInviteList, setShowInviteList] = useState(false);
  const [localMembers, setLocalMembers] = useState(group?.members || []);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const currentGroupIdRef = useRef(null);

  useEffect(() => {
    setLocalMembers(group?.members || []);
    currentGroupIdRef.current = group?._id ?? null;
    if (!group?._id) return;
    fetchMessages();
    setShowInviteList(false);
    setConnections([]);
    setShowMembers(false);
  }, [group?._id]);

  useEffect(() => {
    setLocalMembers(group?.members || []);
  }, [group?.members]);

  useEffect(() => {
    const handler = ({ groupId, message }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setMessages((prev) => [...prev, message]);
    };
    socket.on("new_group_message", handler);
    return () => socket.off("new_group_message", handler);
  }, []);

  useEffect(() => {
    const handler = ({ groupId, members }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setLocalMembers(members);
      if (onGroupUpdated) onGroupUpdated();
    };
    socket.on("group_members_updated", handler);
    return () => socket.off("group_members_updated", handler);
  }, []);

  useEffect(() => {
    const handler = ({ groupId, seenBy }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setMessages((prev) =>
        prev.map((msg) => {
          const alreadySeen = msg.seenBy?.some((id) => id.toString() === seenBy.toString());
          if (alreadySeen) return msg;
          return { ...msg, seenBy: [...(msg.seenBy || []), seenBy] };
        })
      );
    };
    socket.on("group_messages_seen", handler);
    return () => socket.off("group_messages_seen", handler);
  }, []);

  // ── Real-time group message delete ──
  useEffect(() => {
    const handler = ({ groupId, messageId }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setMessages((prev) => prev.filter((m) => m._id !== messageId.toString()));
    };
    socket.on("group_message_deleted", handler);
    return () => socket.off("group_message_deleted", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/group-messages/${group._id}`);
      setMessages(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get("/users");
      const memberIds = localMembers.map((m) => typeof m === "object" ? m._id : m);
      const pendingIds = (group.pendingInvites || []).map((p) => typeof p === "object" ? p._id : p);
      const eligible = res.data.filter((u) => !memberIds.includes(u._id) && !pendingIds.includes(u._id));
      setConnections(eligible);
    } catch (err) { console.log(err); }
  };

  const handleInvite = async (userId) => {
    try {
      await axios.post("/groups/invite", { groupId: group._id, userId });
      setConnections((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) { console.log(err); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedImage) return;
    try {
      let imageUrl = "";
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post("/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.url;
        clearImage();
      }
      await axios.post(`/group-messages/${group._id}`, { message: text, image: imageUrl });
      setText("");
    } catch (err) { console.log(err); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.post(`/groups/${group._id}/remove-member`, { memberId });
      setLocalMembers((prev) => prev.filter((m) => {
        const id = typeof m === "object" ? m._id : m;
        return id !== memberId;
      }));
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) { console.log(err); }
  };

  // Optimistic delete — removes instantly on sender's side
  const handleDeleted = (messageId) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId.toString()));
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const dateLabel = formatDate(msg.createdAt);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(msg);
    return acc;
  }, {});

  if (!group) return null;

  const isAdmin =
    currentUser._id === (group.admin?._id || group.admin) ||
    currentUser._id === group.admin?.toString();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f7f6ff] overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3 bg-white border-b border-violet-100 flex-shrink-0">
        <button
          onClick={onOpenSidebar}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-[10px] text-zinc-400 hover:bg-[#f7f6ff] transition-all flex-shrink-0 -ml-1"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="w-10 h-10 rounded-[13px] bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-[0_2px_8px_rgba(124,58,237,0.2)] flex-shrink-0">
          <span className="text-white font-bold text-base leading-none">{group.name[0].toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-[15px] leading-tight truncate tracking-tight">{group.name}</h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">{localMembers.length} members</p>
        </div>

        <button
          onClick={() => { setShowMembers(!showMembers); if (showMembers) setShowInviteList(false); }}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] border transition-all
            ${showMembers
              ? "bg-violet-50 border-violet-200 text-violet-600"
              : "border-violet-100 text-zinc-400 hover:bg-[#f7f6ff] hover:text-violet-500"
            }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── MESSAGES ── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-200">
                <span className="text-white font-bold text-2xl">{group.name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-zinc-900 font-semibold text-base">{group.name}</p>
                <p className="text-zinc-400 text-sm mt-1">{localMembers.length} members · Say hello! 👋</p>
              </div>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-violet-100" />
                  <span className="text-[11px] font-medium text-zinc-400 bg-white border border-violet-100 px-3 py-1 rounded-full flex-shrink-0">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-violet-100" />
                </div>

                {msgs.map((msg) => (
                  <GroupMessage
                    key={msg._id}
                    msg={msg}
                    currentUser={currentUser}
                    groupId={group._id}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── MEMBERS PANEL ── */}
        {showMembers && (
          <>
            <div
              className="md:hidden absolute inset-0 bg-black/20 z-10 backdrop-blur-sm"
              onClick={() => setShowMembers(false)}
            />

            <div className="absolute right-0 top-0 bottom-0 z-20 md:relative md:z-auto w-[270px] sm:w-72 bg-white border-l border-violet-100 flex flex-col shadow-2xl shadow-violet-100/30 md:shadow-none">

              <div className="px-4 py-3 border-b border-violet-50 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-semibold text-zinc-900">Members · {localMembers.length}</span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => { const next = !showInviteList; setShowInviteList(next); if (next) fetchConnections(); }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs font-medium transition-all border ${
                        showInviteList
                          ? "bg-violet-50 text-violet-600 border-violet-200"
                          : "bg-[#f7f6ff] text-zinc-500 border-violet-100 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
                      }`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Invite
                    </button>
                  )}
                  <button
                    onClick={() => setShowMembers(false)}
                    className="md:hidden w-7 h-7 flex items-center justify-center rounded-[8px] text-zinc-400 hover:bg-[#f7f6ff] transition-all"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {showInviteList && (
                <div className="border-b border-violet-50 bg-[#f7f6ff]/60 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest px-3 pt-3 pb-1.5">
                    Your connections
                  </p>
                  {connections.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">No eligible connections</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto px-2 pb-2 space-y-0.5">
                      {connections.map((u) => (
                        <div key={u._id} className="flex items-center gap-2 px-2 py-2 rounded-[10px] hover:bg-white transition-all">
                          <div className={`w-7 h-7 rounded-[9px] bg-gradient-to-br ${getAvatarGradient(u.fullName?.firstName || "U")} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <span className="text-white font-bold text-[10px]">{u.fullName?.firstName?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                          <p className="text-sm text-zinc-700 font-medium flex-1 truncate">
                            {u.fullName?.firstName} {u.fullName?.lastName}
                          </p>
                          <button
                            onClick={() => handleInvite(u._id)}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-medium rounded-[7px] transition-all active:scale-95 flex-shrink-0"
                          >
                            Invite
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                {localMembers.map((member) => {
                  const m = typeof member === "object" ? member : { _id: member };
                  const memberIsAdmin = group.admin?._id === m._id || group.admin === m._id;
                  const isSelf = m._id === currentUser._id;
                  return (
                    <div key={m._id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] hover:bg-[#f7f6ff] group transition-all">
                      <div className={`w-8 h-8 rounded-[10px] bg-gradient-to-br ${getAvatarGradient(m.fullName?.firstName || "U")} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        <span className="text-white font-bold text-xs">{m.fullName?.firstName?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {m.fullName?.firstName || "Member"}
                          {isSelf && <span className="text-zinc-400 font-normal"> (you)</span>}
                        </p>
                        {memberIsAdmin && (
                          <span className="text-[10px] font-medium text-violet-500">Admin</span>
                        )}
                      </div>
                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(m._id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[8px] text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── IMAGE PREVIEW ── */}
      {imagePreview && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-violet-100 flex-shrink-0">
          <img src={imagePreview} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-violet-100 shadow-sm flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800">Image selected</p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{selectedImage?.name}</p>
          </div>
          <button
            onClick={clearImage}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[10px] bg-[#f7f6ff] text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-violet-100 hover:border-red-200 transition-all active:scale-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 bg-white border-t border-violet-100 flex-shrink-0">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <button
          onClick={() => fileRef.current.click()}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#f7f6ff] border border-violet-100 text-zinc-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-500 transition-all active:scale-95"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>

        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Message ${group.name}...`}
          className="flex-1 px-4 py-2.5 bg-[#f7f6ff] border border-violet-100 rounded-full text-[14px] text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all resize-none max-h-28 overflow-y-auto min-w-0"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() && !selectedImage}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.04] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default GroupChatBox;



