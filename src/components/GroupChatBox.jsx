


import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import { socket } from "../socket";
import GroupMessage from "./GroupMessage";

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
  }, [group?.members]);

  useEffect(() => {
    currentGroupIdRef.current = group?._id ?? null;
    if (!group?._id) return;
    fetchMessages();
    setShowInviteList(false);
    setConnections([]);
    setShowMembers(false);
  }, [group?._id]);

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
    const handler = ({ groupId, members }) => {
      if (groupId?.toString() !== currentGroupIdRef.current?.toString()) return;
      if (members && members.length > 0) setLocalMembers(members);
      if (onGroupUpdated) onGroupUpdated();
    };
    socket.on("group_member_joined", handler);
    return () => socket.off("group_member_joined", handler);
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
      setConnections(res.data.filter((u) => !memberIds.includes(u._id) && !pendingIds.includes(u._id)));
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
      let imageData = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post("/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageData = { url: uploadRes.data.url, fileId: uploadRes.data.fileId };
        clearImage();
      }
      await axios.post(`/group-messages/${group._id}`, { message: text, image: imageData });
      setText("");
    } catch (err) { console.log(err); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.post(`/groups/${group._id}/remove-member`, { memberId });
      setLocalMembers((prev) => prev.filter((m) => (typeof m === "object" ? m._id : m) !== memberId));
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) { console.log(err); }
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .gcb-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .gcb-messages::-webkit-scrollbar { width: 3px; }
        .gcb-messages::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 99px; }
        .gcb-messages::-webkit-scrollbar-track { background: transparent; }
        .gcb-panel::-webkit-scrollbar { width: 3px; }
        .gcb-panel::-webkit-scrollbar-thumb { background: #ede9fe; border-radius: 99px; }
        .gcb-hbtn { transition: all 0.15s; border-radius: 10px; }
        .gcb-hbtn:hover { background: #f5f3ff; color: #7c3aed; }
        .gcb-hbtn-active { background: #ede9fe; color: #7c3aed; }
        .gcb-input:focus { background: #fff; box-shadow: 0 0 0 2.5px rgba(124,58,237,0.2); outline: none; }
        .gcb-send { transition: transform 0.15s; }
        .gcb-send:hover { transform: scale(1.08); }
        .gcb-send:active { transform: scale(0.93); }
        .gcb-member-row:hover .gcb-remove-btn { opacity: 1; }
        .gcb-remove-btn { opacity: 0; transition: opacity 0.15s; }
        @keyframes gcb-slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .gcb-panel-anim { animation: gcb-slide-in 0.22s ease both; }
      `}</style>

      <div className="gcb-wrap flex-1 flex flex-col h-full overflow-hidden bg-white">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <button onClick={onOpenSidebar} className="gcb-hbtn md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-600 -ml-1">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg" style={{background: groupGradient, boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
            {group.name[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 text-[16px] sm:text-[15px] leading-tight truncate tracking-tight">{group.name}</h3>
            <p className="text-[12px] text-gray-500 mt-0.5 font-semibold">{localMembers.length} members</p>
          </div>

          <button
            onClick={() => { setShowMembers(!showMembers); if (showMembers) setShowInviteList(false); }}
            className={`gcb-hbtn flex-shrink-0 w-10 h-10 flex items-center justify-center ${showMembers ? "gcb-hbtn-active" : "text-gray-500"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
          <div className="gcb-messages flex-1 overflow-y-auto px-1 sm:px-5 py-3 space-y-0.5" style={{background:"#f8f7ff"}}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-9 h-9 rounded-full border-4 border-violet-100" style={{borderTopColor:"#7c3aed", animation:"spin 0.7s linear infinite"}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
                <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-white font-black text-3xl" style={{background: groupGradient, boxShadow:"0 8px 32px rgba(124,58,237,0.3)"}}>
                  {group.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-900 font-black text-[17px] tracking-tight">{group.name}</p>
                  <p className="text-gray-500 text-[13px] font-semibold mt-1">{localMembers.length} members · Say hello! 👋</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-violet-100"/>
                    <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100 flex-shrink-0 tracking-wide">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-violet-100"/>
                  </div>

                  {msgs.map((msg, idx) => {
                    const isMe = msg.sender._id === currentUser._id;
                    const showAvatar = !isMe && (idx === 0 || msgs[idx - 1]?.sender._id !== msg.sender._id);
                    const showName = showAvatar;
                    const allMembersSeen = localMembers.every((m) => {
                      const memberId = typeof m === "object" ? m._id.toString() : m.toString();
                      return msg.seenBy?.some((s) => s.toString() === memberId);
                    });

                    return (
                      <GroupMessage
                        key={msg._id}
                        msg={msg}
                        currentUser={currentUser}
                        groupId={group._id}
                        onDeleted={handleDeleted}
                        showAvatar={showAvatar}
                        showName={showName}
                        allMembersSeen={allMembersSeen}
                      />
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef}/>
          </div>

          {/* ── MEMBERS PANEL ── */}
          {showMembers && (
            <>
              <div className="md:hidden absolute inset-0 bg-black/30 z-10 backdrop-blur-sm" onClick={() => setShowMembers(false)}/>
              <div className="gcb-panel-anim absolute right-0 top-0 bottom-0 z-20 md:relative md:z-auto w-[285px] sm:w-[272px] bg-white border-l-2 border-violet-50 flex flex-col shadow-2xl md:shadow-none">

                <div className="px-4 py-4 border-b-2 border-violet-50 flex items-center justify-between flex-shrink-0">
                  <span className="text-[15px] font-black text-gray-900 tracking-tight">Members · {localMembers.length}</span>
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => { const next = !showInviteList; setShowInviteList(next); if (next) fetchConnections(); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold rounded-xl transition-all"
                        style={{
                          background: showInviteList ? "#ede9fe" : "#f8f7ff",
                          color: showInviteList ? "#7c3aed" : "#4b5563",
                          border: "1.5px solid " + (showInviteList ? "#c4b5fd" : "#e5e7eb"),
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Invite
                      </button>
                    )}
                    <button onClick={() => setShowMembers(false)} className="gcb-hbtn md:hidden w-8 h-8 flex items-center justify-center text-gray-500">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {showInviteList && (
                  <div className="border-b-2 border-violet-50 flex-shrink-0" style={{background:"#faf5ff"}}>
                    <p className="text-[11px] font-black text-violet-600 uppercase tracking-widest px-4 pt-3 pb-2">Your connections</p>
                    {connections.length === 0 ? (
                      <p className="text-[13px] font-semibold text-gray-500 text-center py-4">No eligible connections</p>
                    ) : (
                      <div className="max-h-44 overflow-y-auto px-2 pb-2 space-y-0.5">
                        {connections.map((u) => (
                          <div key={u._id} className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-white transition-all">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[11px] flex-shrink-0" style={{background: getAvatarGradient(u.fullName?.firstName || "U"), boxShadow:"0 2px 8px rgba(124,58,237,0.2)"}}>
                              {u.fullName?.firstName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <p className="text-[14px] text-gray-800 font-bold flex-1 truncate">
                              {u.fullName?.firstName} {u.fullName?.lastName}
                            </p>
                            <button onClick={() => handleInvite(u._id)}
                              className="px-3 py-1.5 text-white text-[12px] font-bold rounded-xl flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
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
                      <div key={m._id} className="gcb-member-row flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-violet-50 transition-all">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0" style={{background: getAvatarGradient(m.fullName?.firstName || "U"), boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                          {m.fullName?.firstName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 truncate">
                            {m.fullName?.firstName || "Member"}
                            {isSelf && <span className="text-gray-400 font-normal text-[13px]"> (you)</span>}
                          </p>
                          {memberIsAdmin && <span className="text-[11px] font-black" style={{color:"#7c3aed"}}>Admin</span>}
                        </div>
                        {isAdmin && !isSelf && (
                          <button onClick={() => handleRemoveMember(m._id)}
                            className="gcb-remove-btn w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
          <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-violet-100 flex-shrink-0" style={{background:"linear-gradient(135deg,#fdf4ff,#f5f3ff)"}}>
            <img src={imagePreview} alt="preview" className="object-cover rounded-2xl shadow-md flex-shrink-0" style={{width:52,height:52,border:"2px solid #ddd6fe"}}/>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900">Image ready to send</p>
              <p className="text-[12px] text-gray-500 font-medium truncate mt-0.5">{selectedImage?.name}</p>
            </div>
            <button onClick={clearImage} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-sm flex-shrink-0 transition-all" style={{border:"1.5px solid #e5e7eb"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 bg-white border-t-2 border-gray-100 flex-shrink-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
          <button onClick={() => fileRef.current.click()}
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>

          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${group.name}...`}
            className="gcb-input flex-1 px-4 py-3 bg-gray-100 rounded-full text-[15px] sm:text-[14px] text-gray-900 placeholder-gray-400 border-none resize-none max-h-28 overflow-y-auto min-w-0 font-medium transition-all"
            style={{fontFamily:"inherit", lineHeight:"1.5"}}
          />

          <button onClick={handleSend} disabled={!text.trim() && !selectedImage}
            className="gcb-send flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background: "linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 4px 16px rgba(124,58,237,0.4)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default GroupChatBox;


