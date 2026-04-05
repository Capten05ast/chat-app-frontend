


import { useState, useRef } from "react";
import axios from "../api/axios";

// ── Always compare IDs as strings ─────────────────────────────────────────────
const sid = (v) => v?.toString?.() ?? "";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

function Message({ msg, currentUser, onDeleted }) {
  // ✅ FIX: Check both senderId AND sender._id to handle populated/unpopulated messages
  const senderIdentifier = msg.senderId || msg.sender?._id || msg.sender;
  const isMe = sid(senderIdentifier) === sid(currentUser?._id);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [showTime, setShowTime]   = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [deleting, setDeleting]   = useState(false);

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
      // Ensure the ID is a string for the URL
      await axios.delete(`/messages/${sid(msg._id)}`);
      onDeleted?.(msg._id);
    } catch (err) {
      console.log(err);
      setDeleting(false);
    }
    setShowMenu(false);
  };

  // ✅ FIX: Extra safety for real-time images
  const imageSrc = msg.image?.url ?? (typeof msg.image === "string" ? msg.image : null);

  return (
    <>
      <style>{`
        @keyframes menuPop {
          from { opacity:0; transform:scale(0.9) translateY(6px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .msg-menu-anim { animation: menuPop 0.18s cubic-bezier(0.34,1.5,0.64,1) both; }

        @keyframes bubbleIn {
          from { opacity:0; transform:scale(0.92) translateY(6px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .bubble-anim { animation: bubbleIn 0.22s cubic-bezier(0.34,1.3,0.64,1) both; }

        .msg-dots-btn {
          opacity:0; width:30px; height:30px;
          display:flex; align-items:center; justify-content:center;
          border-radius:50%; background:white;
          border:1px solid #f3f4f6; box-shadow:0 2px 10px rgba(0,0,0,0.1);
          color:#9ca3af; cursor:pointer; transition:all 0.15s; flex-shrink:0;
        }
        .msg-dots-btn:hover { color:#ef4444; border-color:#fecaca; box-shadow:0 2px 14px rgba(239,68,68,0.2); }
        .group:hover .msg-dots-btn { opacity:1; }

        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {showMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: isMe ? "flex-end" : "flex-start",
          padding: "2px 16px",
          marginBottom: 2,
        }}
        className="group"
        onClick={() => { if (!showMenu) setShowTime(p => !p); }}
        onMouseLeave={() => setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          flexDirection: isMe ? "row-reverse" : "row",
        }}>

          {isMe && (
            <div style={{ position: "relative", alignSelf: "center", marginBottom: 4, flexShrink: 0 }}>
              <button
                className="msg-dots-btn"
                onClick={e => { e.stopPropagation(); setShowMenu(p => !p); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {showMenu && (
                <div className="msg-menu-anim" style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 20,
                  background: "white",
                  borderRadius: 16,
                  overflow: "hidden",
                  minWidth: 150,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
                }}>
                  <button 
                    style={{
                      width:"100%", display:"flex", alignItems:"center", gap:10,
                      padding:"14px 18px", background:"none", border:"none", cursor:"pointer",
                      color:"#ef4444", fontSize:14, fontWeight:700, fontFamily:"inherit"
                    }} 
                    onClick={handleDelete} 
                    disabled={deleting}
                  >
                    {deleting ? (
                      <div style={{
                        width: 15, height: 15,
                        border: "2.5px solid #fca5a5",
                        borderTopColor: "#ef4444",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }} />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    )}
                    {deleting ? "Deleting…" : "Delete message"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "min(78%, 320px)",
            gap: 3,
            alignItems: isMe ? "flex-end" : "flex-start",
          }}>

            {msg.text && (
              <div
                className="bubble-anim"
                style={{
                  padding: "11px 16px",
                  fontSize: 16,
                  lineHeight: 1.5,
                  fontWeight: 500,
                  wordBreak: "break-word",
                  opacity: deleting ? 0.35 : 1,
                  transform: deleting ? "scale(0.97)" : "scale(1)",
                  ...(isMe ? {
                    background: "linear-gradient(135deg, #6d28d9, #db2777)",
                    color: "white",
                    borderRadius: "20px 20px 5px 20px",
                    boxShadow: "0 4px 16px rgba(109,40,217,0.35)",
                  } : {
                    background: "white",
                    color: "#1f2937",
                    borderRadius: "5px 20px 20px 20px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #f3f4f6",
                  }),
                }}
              >
                {msg.text}
              </div>
            )}

            {imageSrc && (
              <div style={{
                overflow: "hidden",
                borderRadius: isMe ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                opacity: deleting ? 0.35 : 1,
              }}>
                {!imgLoaded && (
                  <div style={{ width: 180, height: 144, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <img
                  src={imageSrc}
                  alt="chat"
                  onLoad={() => setImgLoaded(true)}
                  onClick={e => { e.stopPropagation(); window.open(imageSrc, "_blank"); }}
                  style={{
                    maxWidth: 220,
                    display: imgLoaded ? "block" : "none",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 4px",
              maxHeight: showTime ? 24 : 0,
              opacity: showTime ? 1 : 0,
              transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                {formatTime(msg.createdAt)}
              </span>
              {isMe && (
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: msg.seen ? "#7c3aed" : "#d1d5db",
                }}>
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



