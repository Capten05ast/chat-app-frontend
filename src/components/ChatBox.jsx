


import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Message from "./Message";
import { socket } from "../socket";

const getAvatarGradient = (name = "") => {
  const gradients = [
    ["#7c3aed", "#a855f7"],
    ["#ec4899", "#f43f5e"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#06b6d4", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#84cc16", "#10b981"],
    ["#0ea5e9", "#6366f1"],
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  const [a, b] = gradients[sum % gradients.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

function ChatBox({ selectedUser, currentUser, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
      } catch (err) { console.log(err); }
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
      setMessages((prev) =>
        prev.map((msg) => msg.senderId === currentUser._id ? { ...msg, seen: true } : msg)
      );
    };
    socket.on("message_seen", handleSeen);
    return () => socket.off("message_seen", handleSeen);
  }, [selectedUser, currentUser._id]);

  // ── Real-time delete: removes message from the OTHER person's screen too ──
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
  };

  const handleSend = async () => {
    if (!selectedUser) return;
    try {
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post("/messages/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        const imageUrl = uploadRes.data.url;
        const msgRes = await axios.post("/messages/send", { receiverId: selectedUser._id, image: imageUrl });
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

  // Optimistic delete — removes instantly on sender's side
  const handleDeleted = (messageId) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const initials = selectedUser?.fullName?.firstName[0]?.toUpperCase();
  const hasInput = text.trim() || selectedImage;
  const avatarGradient = selectedUser ? getAvatarGradient(selectedUser.fullName.firstName) : "";

  // ── EMPTY STATE ──
  if (!selectedUser) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .cb-empty * { font-family: 'Plus Jakarta Sans', sans-serif; }
          .cb-empty-ping { animation: cb-ping 2s ease-in-out infinite; }
          .cb-empty-ping-2 { animation: cb-ping 2s ease-in-out infinite; animation-delay: 0.4s; }
          @keyframes cb-ping { 0%,100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-6px); opacity: 1; } }
        `}</style>
        <div className="cb-empty flex-1 flex flex-col items-center justify-center bg-white gap-5 p-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg,#f5f3ff,#fdf4ff)"}}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#cbg)"/>
              </svg>
            </div>
            <div className="cb-empty-ping absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full" style={{background:"#7c3aed",opacity:0.5}}/>
            <div className="cb-empty-ping-2 absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full" style={{background:"#ec4899",opacity:0.5}}/>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 mb-1.5">No chat selected</p>
            <p className="text-sm text-gray-400 max-w-[200px] leading-relaxed mx-auto">
              Pick someone from the sidebar to start a conversation
            </p>
          </div>
          <button
            onClick={onOpenSidebar}
            className="md:hidden flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-95"
            style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            Browse People
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .cb-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .cb-messages::-webkit-scrollbar { width: 4px; }
        .cb-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
        .cb-messages::-webkit-scrollbar-track { background: transparent; }

        .cb-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; animation: cb-bounce 1.2s ease-in-out infinite; }
        .cb-dot:nth-child(2) { animation-delay: 0.15s; }
        .cb-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes cb-bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }

        .cb-hbtn { transition: all 0.15s; }
        .cb-hbtn:hover { background: #f5f3ff; color: #7c3aed; }

        .cb-input { transition: all 0.2s; }
        .cb-input:focus { background: #fff; box-shadow: 0 0 0 2px rgba(124,58,237,0.12); outline: none; }

        .cb-send { transition: transform 0.15s, box-shadow 0.15s; }
        .cb-send:hover { transform: scale(1.08); }
        .cb-send:active { transform: scale(0.94); }
      `}</style>

      <div className="cb-wrap flex-1 flex flex-col overflow-hidden bg-white min-w-0">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0" style={{boxShadow:"0 1px 0 #f3f4f6"}}>
          <button onClick={onOpenSidebar} className="cb-hbtn md:hidden flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 -ml-1">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-white font-bold text-base" style={{background: avatarGradient}}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 truncate leading-tight">{selectedUser.fullName.firstName} {selectedUser.fullName.lastName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: isTyping ? "#7c3aed" : "#10b981", animation: isTyping ? "cb-bounce 1s infinite" : "none"}}/>
              <span className="text-[12px] font-medium" style={{color: isTyping ? "#7c3aed" : "#9ca3af"}}>
                {isTyping ? "typing..." : "Active now"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button className="cb-hbtn w-9 h-9 rounded-xl flex items-center justify-center text-gray-400">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 9.72 19.79 19.79 0 0 1 1.61 1.1 2 2 0 0 1 3.6-.01h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 15.36z"/>
              </svg>
            </button>
            <button className="cb-hbtn w-9 h-9 rounded-xl flex items-center justify-center text-gray-400">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div className="cb-messages flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-0.5" style={{background:"#fafafa"}}>
          <div className="flex flex-col items-center gap-3 py-8 mb-2">
            <div className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shadow-xl text-white font-bold text-2xl" style={{background: avatarGradient}}>
              {initials}
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-gray-900">{selectedUser.fullName.firstName} {selectedUser.fullName.lastName}</p>
              <span className="inline-block mt-2 text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full font-medium shadow-sm">
                👋 Start of your conversation
              </span>
            </div>
          </div>

          {messages.map((msg) => (
            <Message
              key={msg._id}
              msg={msg}
              currentUser={currentUser}
              onDeleted={handleDeleted}
            />
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 px-1 mt-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white font-bold text-xs" style={{background: avatarGradient}}>
                {initials}
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-[20px_20px_20px_5px]">
                <span className="cb-dot"/>
                <span className="cb-dot"/>
                <span className="cb-dot"/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* ── IMAGE PREVIEW ── */}
        {selectedImage && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0" style={{background:"#fdf4ff"}}>
            <div className="relative flex-shrink-0">
              <img src={URL.createObjectURL(selectedImage)} alt="preview" className="w-14 h-14 object-cover rounded-2xl shadow-sm" style={{border:"1.5px solid #e9d5ff"}}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Image ready to send</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{selectedImage.name}</p>
            </div>
            <button onClick={() => setSelectedImage(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all flex-shrink-0" style={{border:"1px solid #f3f4f6"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <label className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 text-gray-400 cursor-pointer flex items-center justify-center transition-all hover:bg-violet-50 hover:text-violet-500 active:scale-95">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
          </label>

          <input
            ref={inputRef}
            className="cb-input flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-[14px] text-gray-900 placeholder-gray-400 border-none min-w-0"
            style={{fontFamily:"inherit"}}
            value={text}
            placeholder="Message..."
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
          />

          {hasInput ? (
            <button onClick={handleSend} className="cb-send flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          ) : (
            <button className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center transition-all hover:bg-pink-50 hover:text-pink-500 active:scale-95">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          )}
        </div>

      </div>
    </>
  );
}

export default ChatBox;


