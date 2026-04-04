


import { useState, useRef } from "react";
import axios from "../api/axios";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

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

function GroupMessage({ msg, currentUser, groupId, onDeleted, showAvatar, showName, allMembersSeen }) {
  const isMe = msg.sender._id === currentUser._id;
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
      await axios.delete(`/group-messages/${groupId}/${msg._id}`);
      onDeleted?.(msg._id);
    } catch (err) {
      console.log(err);
      setDeleting(false);
    }
    setShowMenu(false);
  };

  // Image src — supports both old string format and new { url, fileId } object
  const imageSrc = msg.image?.url ?? (typeof msg.image === "string" ? msg.image : null);

  return (
    <>
      <style>{`
        .gm-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .gm-delete-btn { opacity: 0; transition: opacity 0.15s; }
        .gm-row:hover .gm-delete-btn { opacity: 1; }
      `}</style>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>}

      <div
        className={`gm-wrap gm-row flex items-end gap-2 mb-1.5 ${isMe ? "justify-end" : "justify-start"}`}
        onMouseLeave={() => setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
        {/* Other person's avatar */}
        {!isMe && (
          <div className="w-7 h-7 flex-shrink-0 mb-0.5">
            {showAvatar && (
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-[10px]"
                style={{ background: getAvatarGradient(msg.sender.fullName?.firstName) }}
              >
                {msg.sender.fullName?.firstName[0].toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Delete button (my messages only) + bubble */}
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

          {/* Delete trigger — desktop hover, mobile long press */}
          {isMe && (
            <div className="relative self-center mb-1">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
                className="gm-delete-btn w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm text-sm leading-none"
              >
                ⋮
              </button>

              {showMenu && (
                <div className="absolute bottom-8 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-20" style={{minWidth:100}}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    style={{fontFamily:"inherit"}}
                  >
                    {deleting ? "Deleting…" : "🗑 Delete"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bubble column */}
          <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>

            {/* Sender name — only for others, only on first of a run */}
            {showName && (
              <span className="text-[11px] font-semibold text-gray-500 mb-1 ml-1">
                {msg.sender.fullName?.firstName}
              </span>
            )}

            {/* Image */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="shared"
                onClick={() => window.open(imageSrc, "_blank")}
                className="max-w-[200px] sm:max-w-[230px] rounded-2xl mb-1 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                style={{ opacity: deleting ? 0.4 : 1 }}
              />
            )}

            {/* Text bubble */}
            {msg.message && (
              <div
                className="px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm"
                style={{
                  background: isMe ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "#fff",
                  color: isMe ? "#fff" : "#1f2937",
                  border: isMe ? "none" : "1px solid #f3f4f6",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  fontFamily: "inherit",
                  opacity: deleting ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {msg.message}
              </div>
            )}

            {/* Time + seen tick */}
            <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
              {isMe && (
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={allMembersSeen ? "#7c3aed" : "#9ca3af"}
                  strokeWidth="2.5" strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12"/>
                  {allMembersSeen && <polyline points="16 6 5 17 0 12"/>}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GroupMessage;


