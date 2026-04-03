


import { useState } from "react";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

function Message({ msg, currentUser }) {
  const isMe = msg.senderId === currentUser._id;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} px-3 sm:px-5 mb-0.5`}
      onClick={() => setShowTime((p) => !p)}
    >
      <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] gap-0.5 ${isMe ? "items-end" : "items-start"}`}>

        {/* Text bubble */}
        {msg.text && (
          <div className={`px-4 py-2.5 text-[14px] leading-relaxed break-words
            ${isMe
              ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200/40 rounded-[18px_18px_4px_18px]"
              : "bg-white text-zinc-900 shadow-sm border border-violet-100 rounded-[4px_18px_18px_18px]"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Image */}
        {msg.image && (
          <div className={`overflow-hidden shadow-md ${isMe ? "rounded-[16px_16px_4px_16px]" : "rounded-[4px_16px_16px_16px]"}`}>
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
              src={msg.image}
              alt="chat"
              onLoad={() => setImgLoaded(true)}
              onClick={(e) => { e.stopPropagation(); window.open(msg.image, "_blank"); }}
              className={`max-w-[176px] sm:max-w-[220px] block object-cover transition-opacity duration-300 cursor-pointer hover:opacity-90 ${imgLoaded ? "opacity-100" : "opacity-0 h-0"}`}
            />
          </div>
        )}

        {/* Timestamp + seen tick */}
        <div className={`flex items-center gap-1 px-1 transition-all duration-200 ${showTime ? "opacity-100 max-h-6" : "opacity-0 max-h-0 overflow-hidden"}`}>
          <span className="text-[10px] text-zinc-400">{formatTime(msg.createdAt)}</span>
          {isMe && (
            <span className={`text-[11px] font-semibold leading-none transition-colors ${msg.seen ? "text-violet-500" : "text-zinc-300"}`}>
              {msg.seen ? "✔✔" : "✔"}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default Message;



