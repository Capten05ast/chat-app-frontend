


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
    ["#7c3aed", "#a855f7"],
    ["#ec4899", "#f43f5e"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#06b6d4", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  const [a, b] = gradients[sum % gradients.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
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

  useEffect(() => { setLocalMembers(group?.members || []); }, [group?.members]);

  // New group message
  useEffect(() => {
    const handler = ({ groupId, message }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setMessages((prev) => [...prev, message]);
    };
    socket.on("new_group_message", handler);
    return () => socket.off("new_group_message", handler);
  }, []);

  // Member removed
  useEffect(() => {
    const handler = ({ groupId, members }) => {
      if (groupId !== currentGroupIdRef.current) return;
      setLocalMembers(members);
      if (onGroupUpdated) onGroupUpdated();
    };
    socket.on("group_members_updated", handler);
    return () => socket.off("group_members_updated", handler);
  }, []);

  // 🔥 Someone accepted invite — update member list live on admin's tab
  useEffect(() => {
    const handler = async ({ groupId, members }) => {
      console.log("[socket] group_member_joined received", groupId, "current:", currentGroupIdRef.current);
      if (groupId.toString() !== currentGroupIdRef.current?.toString()) return;
      if (members && members.length > 0) {
        setLocalMembers(members);
      } else {
        try {
          const res = await axios.get(`/groups/my-groups`);
          const updatedGroup = res.data.find((g) => g._id.toString() === groupId.toString());
          if (updatedGroup) setLocalMembers(updatedGroup.members);
        } catch (err) {
          console.log("Failed to re-fetch group members:", err);
        }
      }
      if (onGroupUpdated) onGroupUpdated();
    };
    socket.on("group_member_joined", handler);
    return () => socket.off("group_member_joined", handler);
  }, []);

  // Seen receipts
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

  // 🔥 Real-time message delete (from GPT — kept as it's a new feature)
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

  // 🔥 Updated handleSend — supports fileId from GPT's upload response
  const handleSend = async () => {
    if (!text.trim() && !selectedImage) return;
    try {
      let imageData = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post("/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageData = {
          url: uploadRes.data.url,
          fileId: uploadRes.data.fileId,
        };
        clearImage();
      }
      await axios.post(`/group-messages/${group._id}`, {
        message: text,
        image: imageData,
      });
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

  // 🔥 Optimistic delete — from GPT, kept as new feature
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

  const groupGradient = "linear-gradient(135deg, #7c3aed, #ec4899)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gcb-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .gcb-messages::-webkit-scrollbar { width: 4px; }
        .gcb-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
        .gcb-messages::-webkit-scrollbar-track { background: transparent; }

        .gcb-panel::-webkit-scrollbar { width: 3px; }
        .gcb-panel::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 99px; }

        .gcb-hbtn { transition: all 0.15s; border-radius: 10px; }
        .gcb-hbtn:hover { background: #f5f3ff; color: #7c3aed; }
        .gcb-hbtn-active { background: #ede9fe; color: #7c3aed; }

        .gcb-input:focus { background: #fff; box-shadow: 0 0 0 2px rgba(124,58,237,0.12); outline: none; }

        .gcb-send { transition: transform 0.15s; }
        .gcb-send:hover { transform: scale(1.08); }
        .gcb-send:active { transform: scale(0.94); }

        .gcb-member-row:hover .gcb-remove-btn { opacity: 1; }
        .gcb-remove-btn { opacity: 0; transition: opacity 0.15s; }

        @keyframes gcb-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        .gcb-panel-anim { animation: gcb-slide-in 0.2s ease both; }
      `}</style>

      <div className="gcb-wrap flex-1 flex flex-col h-full overflow-hidden bg-white">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0" style={{boxShadow:"0 1px 0 #f3f4f6"}}>

          <button onClick={onOpenSidebar} className="gcb-hbtn md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 -ml-1">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-white font-bold text-base" style={{background: groupGradient}}>
            {group.name[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">{group.name}</h3>
            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">{localMembers.length} members</p>
          </div>

          <button
            onClick={() => { setShowMembers(!showMembers); if (showMembers) setShowInviteList(false); }}
            className={`gcb-hbtn flex-shrink-0 w-9 h-9 flex items-center justify-center ${showMembers ? "gcb-hbtn-active" : "text-gray-400"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
          <div className="gcb-messages flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-0.5" style={{background:"#fafafa"}}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200" style={{borderTopColor:"#7c3aed", animation:"spin 0.7s linear infinite"}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
                <div className="w-16 h-16 rounded-[22px] flex items-center justify-center shadow-xl text-white font-bold text-2xl" style={{background: groupGradient}}>
                  {group.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-800 font-bold text-base">{group.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{localMembers.length} members · Say hello! 👋</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gray-200"/>
                    <span className="text-[11px] font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm flex-shrink-0">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-gray-200"/>
                  </div>

                  {/* 🔥 Using GroupMessage component (GPT's addition — kept) */}
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
            <div ref={bottomRef}/>
          </div>

          {/* ── MEMBERS PANEL ── */}
          {showMembers && (
            <>
              <div className="md:hidden absolute inset-0 bg-black/20 z-10 backdrop-blur-sm" onClick={() => setShowMembers(false)}/>

              <div className="gcb-panel-anim absolute right-0 top-0 bottom-0 z-20 md:relative md:z-auto w-[272px] bg-white border-l border-gray-100 flex flex-col shadow-xl md:shadow-none">

                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <span className="text-[13px] font-bold text-gray-900">Members · {localMembers.length}</span>
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => { const next = !showInviteList; setShowInviteList(next); if (next) fetchConnections(); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all"
                        style={{
                          background: showInviteList ? "#ede9fe" : "#f9fafb",
                          color: showInviteList ? "#7c3aed" : "#6b7280",
                          border: "1px solid " + (showInviteList ? "#ddd6fe" : "#f3f4f6"),
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Invite
                      </button>
                    )}
                    <button onClick={() => setShowMembers(false)} className="gcb-hbtn md:hidden w-7 h-7 flex items-center justify-center text-gray-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {showInviteList && (
                  <div className="border-b border-gray-100 flex-shrink-0" style={{background:"#faf5ff"}}>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider px-4 pt-3 pb-1.5">
                      Your connections
                    </p>
                    {connections.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No eligible connections</p>
                    ) : (
                      <div className="max-h-44 overflow-y-auto px-2 pb-2 space-y-0.5">
                        {connections.map((u) => (
                          <div key={u._id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white transition-all">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
                              style={{background: getAvatarGradient(u.fullName?.firstName || "U")}}>
                              {u.fullName?.firstName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <p className="text-sm text-gray-700 font-semibold flex-1 truncate">
                              {u.fullName?.firstName} {u.fullName?.lastName}
                            </p>
                            <button onClick={() => handleInvite(u._id)}
                              className="px-2.5 py-1 text-white text-[11px] font-bold rounded-lg flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                              style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
                              Invite
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="gcb-panel flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                  {localMembers.map((member) => {
                    const m = typeof member === "object" ? member : { _id: member };
                    const memberIsAdmin = group.admin?._id === m._id || group.admin === m._id;
                    const isSelf = m._id === currentUser._id;
                    return (
                      <div key={m._id} className="gcb-member-row flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm"
                          style={{background: getAvatarGradient(m.fullName?.firstName || "U")}}>
                          {m.fullName?.firstName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">
                            {m.fullName?.firstName || "Member"}
                            {isSelf && <span className="text-gray-400 font-normal"> (you)</span>}
                          </p>
                          {memberIsAdmin && (
                            <span className="text-[10px] font-bold" style={{color:"#7c3aed"}}>Admin</span>
                          )}
                        </div>
                        {isAdmin && !isSelf && (
                          <button onClick={() => handleRemoveMember(m._id)}
                            className="gcb-remove-btn w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0" style={{background:"#fdf4ff"}}>
            <img src={imagePreview} alt="preview" className="object-cover rounded-2xl shadow-sm flex-shrink-0" style={{width:52,height:52,border:"1.5px solid #e9d5ff"}}/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Image ready to send</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{selectedImage?.name}</p>
            </div>
            <button onClick={clearImage} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm flex-shrink-0 transition-all"
              style={{border:"1px solid #f3f4f6"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>

          <button onClick={() => fileRef.current.click()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center transition-all hover:bg-violet-50 hover:text-violet-500 active:scale-95">
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
            className="gcb-input flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-[14px] text-gray-900 placeholder-gray-400 border-none resize-none max-h-28 overflow-y-auto min-w-0 transition-all"
            style={{fontFamily:"inherit", lineHeight:"1.5"}}
          />

          <button onClick={handleSend} disabled={!text.trim() && !selectedImage}
            className="gcb-send flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background: "linear-gradient(135deg,#7c3aed,#ec4899)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}

export default GroupChatBox;



