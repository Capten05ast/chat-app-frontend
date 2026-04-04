


import { useState, useRef } from "react";
import axios from "../api/axios";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

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

function GroupMessage({ msg, currentUser, groupId, onDeleted }) {
  const isMe = msg.sender._id === currentUser._id;
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Long-press for mobile
  const longPressTimer = useRef(null);
  const handlePressStart = () => {
    if (!isMe) return;
    longPressTimer.current = setTimeout(() => setShowMenu(true), 450);
  };
  const handlePressEnd = () => clearTimeout(longPressTimer.current);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await axios.delete(`/group-messages/${groupId}/${msg._id}`);
      onDeleted?.(msg._id);
    } catch (err) {
      console.log(err);
      setDeleting(false);
    }
    setShowMenu(false);
  };

  return (
    <>
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}

      <div
        className={`flex items-end gap-2 mb-1 group ${isMe ? "justify-end" : "justify-start"}`}
        onMouseLeave={() => setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
        {/* Other person's avatar */}
        {!isMe && (
          <div className="w-7 h-7 flex-shrink-0 mb-1">
            <div className={`w-7 h-7 rounded-[9px] bg-gradient-to-br ${getAvatarGradient(msg.sender.fullName?.firstName)} flex items-center justify-center shadow-sm`}>
              <span className="text-white font-bold text-[10px]">
                {msg.sender.fullName?.firstName[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

          {/* ── ··· button (desktop hover, my msgs only) ── */}
          {isMe && (
            <div className="relative self-center mb-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
              </button>

              {showMenu && (
                <div
                  className="absolute bottom-9 right-0 z-20 bg-white border border-gray-100 rounded-2xl overflow-hidden min-w-[130px]"
                  style={{boxShadow:"0 8px 30px rgba(0,0,0,0.10)"}}
                >
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {deleting ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    )}
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Bubble ── */}
          <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
            {!isMe && (
              <span className="text-[11px] font-medium text-zinc-400 mb-1 ml-1">
                {msg.sender.fullName?.firstName}
              </span>
            )}

            {msg.image && (
              <img
                src={msg.image}
                alt="shared"
                onClick={() => window.open(msg.image, "_blank")}
                className={`max-w-[180px] sm:max-w-[220px] mb-1 shadow-md cursor-pointer hover:opacity-90 transition-opacity duration-200
                  ${deleting ? "opacity-40" : "opacity-100"}
                  ${isMe ? "rounded-[16px_16px_4px_16px]" : "rounded-[4px_16px_16px_16px]"}`}
              />
            )}

            {msg.message && (
              <div className={`px-3.5 sm:px-4 py-2.5 text-[13px] sm:text-[14px] leading-relaxed shadow-sm transition-opacity duration-200
                ${deleting ? "opacity-40" : "opacity-100"}
                ${isMe
                  ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white rounded-[18px_18px_4px_18px]"
                  : "bg-white text-zinc-800 border border-violet-100 rounded-[4px_18px_18px_18px]"
                }`}>
                {msg.message}
              </div>
            )}

            <span className="text-[10px] text-zinc-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default GroupMessage;




