


import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Message from "./Message";
import { socket } from "../socket";

const getAvatarGradient = (name = "") => {
  const gradients = [
    ["#7c3aed", "#a855f7"], ["#ec4899", "#f43f5e"],
    ["#f59e0b", "#ef4444"], ["#10b981", "#3b82f6"],
    ["#06b6d4", "#6366f1"], ["#8b5cf6", "#ec4899"],
    ["#84cc16", "#10b981"], ["#0ea5e9", "#6366f1"],
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  const [a, b] = gradients[sum % gradients.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

// Reusable avatar — real pic if available, else gradient initials
function UserAvatar({ user, size = 44, radius = 14, shadow = "" }) {
  const name = user?.fullName?.firstName || "?";
  const initials = name[0]?.toUpperCase();
  if (user?.avatar) {
    return (
      <div style={{width:size,height:size,borderRadius:radius,overflow:"hidden",flexShrink:0,boxShadow:shadow}}>
        <img src={user.avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      </div>
    );
  }
  return (
    <div style={{width:size,height:size,borderRadius:radius,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:getAvatarGradient(name),boxShadow:shadow}}>
      <span style={{color:"white",fontWeight:900,fontSize:Math.round(size*0.38)}}>{initials}</span>
    </div>
  );
}

function ChatBox({ selectedUser, currentUser, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try { const res = await axios.get(`/messages/${selectedUser._id}`); setMessages(res.data); }
      catch (err) { console.log(err); }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    const handleReceive = (data) => {
      if (data.senderId === selectedUser?._id || data.receiverId === selectedUser?._id) {
        setMessages((prev) => [...prev, data]);
        axios.post("/messages/mark-seen", { senderId: selectedUser._id });
      }
    };
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [selectedUser]);

  useEffect(() => {
    const handleTyping = ({ senderId }) => { if (senderId === selectedUser?._id) setIsTyping(true); };
    const handleStopTyping = ({ senderId }) => { if (senderId === selectedUser?._id) setIsTyping(false); };
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    return () => { socket.off("typing", handleTyping); socket.off("stop_typing", handleStopTyping); };
  }, [selectedUser]);

  useEffect(() => {
    const handleSeen = ({ receiverId }) => {
      if (receiverId !== selectedUser?._id) return;
      setMessages((prev) => prev.map((msg) => msg.senderId === currentUser._id ? { ...msg, seen: true } : msg));
    };
    socket.on("message_seen", handleSeen);
    return () => socket.off("message_seen", handleSeen);
  }, [selectedUser, currentUser._id]);

  useEffect(() => {
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };
    socket.on("message_deleted", handleMessageDeleted);
    return () => socket.off("message_deleted", handleMessageDeleted);
  }, []);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", { senderId: currentUser._id, receiverId: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: currentUser._id, receiverId: selectedUser._id });
    }, 800);
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (!file) return; setSelectedImage(file); };

  const handleSend = async () => {
    if (!selectedUser) return;
    try {
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post("/messages/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        const imageData = { url: uploadRes.data.url, fileId: uploadRes.data.fileId };
        const msgRes = await axios.post("/messages/send", { receiverId: selectedUser._id, image: imageData });
        setMessages((prev) => [...prev, msgRes.data.data]);
        socket.emit("send_message", msgRes.data.data);
        setSelectedImage(null);
        return;
      }
      if (text.trim()) {
        const res = await axios.post("/messages/send", { receiverId: selectedUser._id, text });
        setMessages((prev) => [...prev, res.data.data]);
        socket.emit("send_message", res.data.data);
        setText("");
      }
    } catch (err) { console.log(err); }
  };

  const handleDeleted = (messageId) => { setMessages((prev) => prev.filter((m) => m._id !== messageId)); };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const initials = selectedUser?.fullName?.firstName[0]?.toUpperCase();
  const hasInput = text.trim() || selectedImage;
  const avatarGradient = selectedUser ? getAvatarGradient(selectedUser.fullName.firstName) : "";

  if (!selectedUser) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          .cb-empty * { font-family: 'Plus Jakarta Sans', sans-serif; }
          @keyframes cb-float { 0%,100%{transform:translateY(0);opacity:.7} 50%{transform:translateY(-8px);opacity:1} }
          .cb-float-1 { animation: cb-float 3s ease-in-out infinite; }
          .cb-float-2 { animation: cb-float 3s ease-in-out infinite; animation-delay: 0.5s; }
        `}</style>
        <div className="cb-empty flex-1 flex flex-col items-center justify-center bg-white gap-5 p-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs><linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#cbg)"/>
              </svg>
            </div>
            <div className="cb-float-1 absolute -top-2 -right-2 w-5 h-5 rounded-full" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}/>
            <div className="cb-float-2 absolute -bottom-2 -left-2 w-4 h-4 rounded-full" style={{background:"linear-gradient(135deg,#ec4899,#f43f5e)"}}/>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Your Messages</p>
            <p className="text-[14px] text-gray-500 max-w-[200px] leading-relaxed mx-auto font-medium">Pick someone from the sidebar to start chatting</p>
          </div>
          <button onClick={onOpenSidebar} className="md:hidden flex items-center gap-2.5 px-6 py-3 text-white text-[14px] font-bold rounded-2xl shadow-xl transition-all active:scale-95" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)",boxShadow:"0 8px 24px rgba(124,58,237,0.35)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            Browse People
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .cb-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .cb-messages::-webkit-scrollbar { width: 3px; }
        .cb-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
        .cb-messages::-webkit-scrollbar-track { background: transparent; }
        .cb-dot { width: 7px; height: 7px; border-radius: 50%; background: #7c3aed; animation: cb-bounce 1.2s ease-in-out infinite; }
        .cb-dot:nth-child(2) { animation-delay: 0.15s; }
        .cb-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes cb-bounce { 0%,80%,100% { transform: translateY(0); opacity:0.5; } 40% { transform: translateY(-6px); opacity:1; } }
        .cb-hbtn:hover { background: #f5f3ff; color: #7c3aed; border-radius:12px; }
        .cb-input:focus { background: #fff; box-shadow: 0 0 0 2.5px rgba(124,58,237,0.2); outline: none; }
        .cb-send:hover { transform: scale(1.08); }
        .cb-send:active { transform: scale(0.93); }
      `}</style>

      <div className="cb-wrap flex-1 flex flex-col overflow-hidden bg-white min-w-0">

        {/* ── HEADER — real avatar ── */}
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <button onClick={onOpenSidebar} className="cb-hbtn md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-600 -ml-1 transition-all">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          {/* Avatar — real pic or gradient */}
          <UserAvatar user={selectedUser} size={44} radius={14} shadow="0 4px 12px rgba(124,58,237,0.3)"/>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] sm:text-[15px] font-black text-gray-900 truncate leading-tight tracking-tight">
              {selectedUser.fullName.firstName} {selectedUser.fullName.lastName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:isTyping?"#7c3aed":"#10b981",boxShadow:isTyping?"0 0 0 3px rgba(124,58,237,0.2)":"0 0 0 3px rgba(16,185,129,0.2)"}}/>
              <span className="text-[12px] font-semibold" style={{color:isTyping?"#7c3aed":"#6b7280"}}>{isTyping?"typing...":"Active now"}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button className="cb-hbtn w-10 h-10 flex items-center justify-center text-gray-500 transition-all">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 9.72 19.79 19.79 0 0 1 1.61 1.1 2 2 0 0 1 3.6-.01h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 15.36z"/></svg>
            </button>
            <button className="cb-hbtn w-10 h-10 flex items-center justify-center text-gray-500 transition-all">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></svg>
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div className="cb-messages flex-1 overflow-y-auto px-1 sm:px-4 py-3 flex flex-col gap-0.5" style={{background:"#f8f7ff"}}>

          {/* Conversation start — real avatar ── */}
          <div className="flex flex-col items-center gap-3 py-6 sm:py-10 mb-2">
            <UserAvatar user={selectedUser} size={80} radius={24} shadow="0 8px 32px rgba(124,58,237,0.3)"/>
            <div className="text-center">
              <p className="text-[16px] font-black text-gray-900 tracking-tight">{selectedUser.fullName.firstName} {selectedUser.fullName.lastName}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full font-semibold shadow-sm">
                👋 Start of your conversation
              </span>
            </div>
          </div>

          {messages.map((msg) => (
            <Message key={msg._id} msg={msg} currentUser={currentUser} onDeleted={handleDeleted}/>
          ))}

          {/* Typing indicator — real avatar */}
          {isTyping && (
            <div className="flex items-end gap-2 px-2 mt-2">
              <UserAvatar user={selectedUser} size={36} radius={12} shadow="0 4px 10px rgba(124,58,237,0.25)"/>
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-md px-4 py-3.5 rounded-[20px_20px_20px_5px]">
                <span className="cb-dot"/><span className="cb-dot"/><span className="cb-dot"/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Image preview */}
        {selectedImage && (
          <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-violet-100 flex-shrink-0" style={{background:"linear-gradient(135deg,#fdf4ff,#f5f3ff)"}}>
            <img src={URL.createObjectURL(selectedImage)} alt="preview" className="w-14 h-14 object-cover rounded-2xl shadow-md flex-shrink-0" style={{border:"2px solid #ddd6fe"}}/>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900">Image ready to send</p>
              <p className="text-[12px] text-gray-500 truncate mt-0.5 font-medium">{selectedImage.name}</p>
            </div>
            <button onClick={()=>setSelectedImage(null)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all flex-shrink-0" style={{border:"1.5px solid #e5e7eb"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 bg-white border-t-2 border-gray-100 flex-shrink-0">
          <label className="flex-shrink-0 w-10 h-10 rounded-2xl cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
          </label>
          <input ref={inputRef} className="cb-input flex-1 px-4 py-3 bg-gray-100 rounded-full text-[15px] text-gray-900 placeholder-gray-400 border-none min-w-0 font-medium transition-all" style={{fontFamily:"inherit"}} value={text} placeholder="Message..." onChange={handleTyping} onKeyDown={handleKeyDown}/>
          {hasInput ? (
            <button onClick={handleSend} className="cb-send flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)",boxShadow:"0 4px 16px rgba(124,58,237,0.4)"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95" style={{background:"linear-gradient(135deg,#fce7f3,#ffe4e6)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatBox;




