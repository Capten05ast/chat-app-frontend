


import { useState, useRef } from "react";
import axios from "../api/axios";

const formatTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const getAvatarGradient = (name = "") => {
  const gradients = [
    ["#7c3aed","#a855f7"],["#ec4899","#f43f5e"],
    ["#f59e0b","#ef4444"],["#10b981","#3b82f6"],
    ["#06b6d4","#6366f1"],["#8b5cf6","#ec4899"],
  ];
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  const [a, b] = gradients[sum % gradients.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

// Reusable avatar — real pic or gradient initials
function SenderAvatar({ sender, size = 32 }) {
  const name = sender?.fullName?.firstName || "?";
  const initials = name[0]?.toUpperCase();
  if (sender?.avatar) {
    return (
      <div style={{width:size,height:size,borderRadius:Math.round(size*0.35),overflow:"hidden",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
        <img src={sender.avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      </div>
    );
  }
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*0.35),flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:getAvatarGradient(name),boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <span style={{color:"white",fontWeight:900,fontSize:Math.round(size*0.34)}}>{initials}</span>
    </div>
  );
}

function GroupMessage({ msg, currentUser, groupId, onDeleted, showAvatar, showName, allMembersSeen }) {
  const isMe = msg.sender._id === currentUser._id;
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const longPressTimer = useRef(null);
  const handlePressStart = () => { if (!isMe) return; longPressTimer.current = setTimeout(() => setShowMenu(true), 450); };
  const handlePressEnd = () => clearTimeout(longPressTimer.current);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try { await axios.delete(`/group-messages/${groupId}/${msg._id}`); onDeleted?.(msg._id); }
    catch (err) { console.log(err); setDeleting(false); }
    setShowMenu(false);
  };

  const imageSrc = msg.image?.url ?? (typeof msg.image === "string" ? msg.image : null);

  return (
    <>
      <style>{`
        .gm-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .gm-delete-btn { opacity: 0; transition: opacity 0.15s; }
        .gm-row:hover .gm-delete-btn { opacity: 1; }
      `}</style>

      {showMenu && <div className="fixed inset-0 z-10" onClick={()=>setShowMenu(false)}/>}

      <div
        className={`gm-wrap gm-row flex items-end gap-2 mb-2 ${isMe?"justify-end":"justify-start"}`}
        onMouseLeave={()=>setShowMenu(false)}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
      >
        {/* ✅ Real sender avatar — shows profile pic if they have one */}
        {!isMe && (
          <div className="flex-shrink-0 mb-0.5" style={{width:32,height:32}}>
            {showAvatar && <SenderAvatar sender={msg.sender} size={32}/>}
          </div>
        )}

        <div className={`flex items-end gap-1.5 ${isMe?"flex-row-reverse":"flex-row"}`}>

          {/* Delete button */}
          {isMe && (
            <div className="relative self-center mb-1">
              <button onClick={e=>{e.stopPropagation();setShowMenu(p=>!p);}} className="gm-delete-btn w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-red-500 transition-all" style={{border:"1.5px solid #e5e7eb",boxShadow:"0 2px 6px rgba(0,0,0,0.08)"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
              {showMenu && (
                <div className="absolute bottom-9 right-0 bg-white rounded-2xl z-20 overflow-hidden" style={{minWidth:130,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",border:"1.5px solid #f3f4f6"}}>
                  <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-all disabled:opacity-50" style={{fontFamily:"inherit"}}>
                    {deleting ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin flex-shrink-0"/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
                    {deleting?"Deleting…":"Delete"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bubble */}
          <div className={`flex flex-col max-w-[78%] sm:max-w-[62%] ${isMe?"items-end":"items-start"}`}>
            {showName && (
              <span className="text-[12px] font-bold text-gray-600 mb-1 ml-1">{msg.sender.fullName?.firstName}</span>
            )}

            {imageSrc && (
              <img src={imageSrc} alt="shared" onClick={()=>window.open(imageSrc,"_blank")} className="max-w-[210px] sm:max-w-[240px] rounded-2xl mb-1 cursor-pointer hover:opacity-90 transition-opacity" style={{opacity:deleting?0.4:1,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",border:isMe?"none":"1.5px solid #e5e7eb"}}/>
            )}

            {msg.message && (
              <div className="px-4 py-2.5 text-[14px] leading-relaxed" style={{background:isMe?"linear-gradient(135deg,#7c3aed,#ec4899)":"#fff",color:isMe?"#fff":"#111827",border:isMe?"none":"1.5px solid #e5e7eb",borderRadius:isMe?"18px 18px 4px 18px":"4px 18px 18px 18px",fontFamily:"inherit",fontWeight:500,opacity:deleting?0.4:1,transition:"opacity 0.2s",boxShadow:isMe?"0 4px 14px rgba(124,58,237,0.3)":"0 2px 8px rgba(0,0,0,0.06)"}}>
                {msg.message}
              </div>
            )}

            <div className={`flex items-center gap-1 mt-1 ${isMe?"flex-row-reverse":"flex-row"}`}>
              <span className="text-[11px] font-semibold text-gray-400">{formatTime(msg.createdAt)}</span>
              {isMe && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={allMembersSeen?"#7c3aed":"#9ca3af"} strokeWidth="2.5" strokeLinecap="round">
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



