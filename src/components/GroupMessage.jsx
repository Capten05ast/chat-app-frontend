


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
      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}

      <div
        className={`flex items-end gap-2 mb-1 group ${isMe ? "justify-end" : "justify-start"}`}
        onMouseLeave={() => setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
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

          {isMe && (
            <div className="relative self-center mb-1">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full bg-white border text-gray-400 hover:text-red-500"
              >
                ⋮
              </button>

              {showMenu && (
                <div className="absolute bottom-9 right-0 bg-white border rounded-xl shadow">
                  <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-red-500">
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={`flex flex-col max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>

            {!isMe && (
              <span className="text-xs text-gray-400">{msg.sender.fullName?.firstName}</span>
            )}

            {/* 🔥 IMAGE FIXED */}
            {msg.image && (
              <img
                src={msg.image?.url}
                alt="shared"
                onClick={() => window.open(msg.image?.url, "_blank")}
                className={`max-w-[220px] mb-1 cursor-pointer ${deleting ? "opacity-40" : ""}`}
              />
            )}

            {msg.message && (
              <div className={`px-3 py-2 ${isMe ? "bg-purple-500 text-white" : "bg-white border"}`}>
                {msg.message}
              </div>
            )}

            <span className="text-[10px] text-gray-400 mt-1">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default GroupMessage;


