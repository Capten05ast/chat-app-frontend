


import { useState, useRef } from "react";
import axios from "../api/axios";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

function Message({ msg, currentUser, onDeleted }) {
  const isMe = msg.senderId === currentUser._id;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      await axios.delete(`/messages/${msg._id}`);
      onDeleted?.(msg._id);
    } catch (err) {
      console.log(err);
      setDeleting(false);
    }
    setShowMenu(false);
  };

  // ✅ Handles both old string format and new { url, fileId } object format
  const imageSrc = msg.image?.url ?? (typeof msg.image === "string" ? msg.image : null);

  return (
    <>
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}

      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"} px-3 sm:px-5 mb-0.5 group`}
        onClick={() => { if (!showMenu) setShowTime((p) => !p); }}
        onMouseLeave={() => setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

          {/* ··· delete button — desktop hover only, my messages only */}
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
                    style={{fontFamily:"inherit"}}
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

          {/* Bubble */}
          <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] gap-0.5 ${isMe ? "items-end" : "items-start"}`}>

            {msg.text && (
              <div className={`px-4 py-2.5 text-[15px] sm:text-[14px] leading-relaxed break-words transition-opacity duration-200
                ${deleting ? "opacity-40" : "opacity-100"}
                ${isMe
                  ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200/40 rounded-[18px_18px_4px_18px]"
                  : "bg-white text-zinc-900 shadow-sm border border-violet-100 rounded-[4px_18px_18px_18px]"
                }`}
              >
                {msg.text}
              </div>
            )}

            {imageSrc && (
              <div className={`overflow-hidden shadow-md transition-opacity duration-200
                ${deleting ? "opacity-40" : "opacity-100"}
                ${isMe ? "rounded-[16px_16px_4px_16px]" : "rounded-[4px_16px_16px_16px]"}`}>
                {!imgLoaded && (
                  <div className="w-44 h-36 sm:w-52 sm:h-44 bg-violet-50 border border-violet-100 animate-pulse flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <img
                  src={imageSrc}
                  alt="chat"
                  onLoad={() => setImgLoaded(true)}
                  onClick={(e) => { e.stopPropagation(); window.open(imageSrc, "_blank"); }}
                  className={`max-w-[176px] sm:max-w-[220px] block object-cover transition-opacity duration-300 cursor-pointer hover:opacity-90 ${imgLoaded ? "opacity-100" : "opacity-0 h-0"}`}
                />
              </div>
            )}

            <div className={`flex items-center gap-1 px-1 transition-all duration-200 ${showTime ? "opacity-100 max-h-6" : "opacity-0 max-h-0 overflow-hidden"}`}>
              <span className="text-[11px] sm:text-[10px] text-zinc-400">{formatTime(msg.createdAt)}</span>
              {isMe && (
                <span className={`text-[12px] sm:text-[11px] font-semibold leading-none transition-colors ${msg.seen ? "text-violet-500" : "text-zinc-300"}`}>
                  {msg.seen ? "✔✔" : "✔"}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Message;



