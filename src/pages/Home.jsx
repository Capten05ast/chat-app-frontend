


import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import { socket } from "../socket";
import axios from "../api/axios";
import GroupChatBox from "../components/GroupChatBox";
import ProfilePanel from "../components/ProfilePannel";

function Home({ user, setUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectEmail, setConnectEmail] = useState("");
  const [toast, setToast] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);
  const [showConnectInput, setShowConnectInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const sidebarRef = useRef(null);

  // ✅ THE CORE FIX:
  // 1. socket.js now has autoConnect:false so it doesn't connect before user exists
  // 2. We emit "join" INSIDE the "connect" event handler, not after socket.connect()
  //    This guarantees "join" only fires once the connection is fully established
  // 3. On unmount (logout), we remove the listener AND disconnect cleanly
  useEffect(() => {
    if (!user?._id) return;

    const handleConnect = () => {
      socket.emit("join", user._id);
    };

    // Register the connect handler BEFORE calling connect()
    // so if the socket connects instantly, we don't miss the event
    socket.on("connect", handleConnect);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [user._id]);

  useEffect(() => {
    fetchPendingInvites();
    const handleNewInvite = () => fetchPendingInvites();
    socket.on("new_group_invite", handleNewInvite);
    return () => socket.off("new_group_invite", handleNewInvite);
  }, []);

  useEffect(() => {
    const handleNewConnection = () => { sidebarRef.current?.fetchUsers(); };
    socket.on("new_connection", handleNewConnection);
    return () => socket.off("new_connection", handleNewConnection);
  }, []);

  useEffect(() => {
    const handleConnectionRemoved = ({ userId }) => {
      sidebarRef.current?.fetchUsers();
      setSelectedUser((prev) => {
        if (prev && !prev.isGroup && prev._id === userId) return null;
        return prev;
      });
    };
    socket.on("connection_removed", handleConnectionRemoved);
    return () => socket.off("connection_removed", handleConnectionRemoved);
  }, []);

  useEffect(() => {
    const handleProfilePicUpdated = ({ userId, avatar }) => {
      if (userId === user._id) {
        setUser((prev) => ({ ...prev, avatar }));
      }
      sidebarRef.current?.fetchUsers();
      setSelectedUser((prev) => {
        if (prev && !prev.isGroup && prev._id === userId) {
          return { ...prev, avatar };
        }
        return prev;
      });
    };
    socket.on("profile_pic_updated", handleProfilePicUpdated);
    return () => socket.off("profile_pic_updated", handleProfilePicUpdated);
  }, [user._id]);

  const fetchPendingInvites = async () => {
    try {
      const res = await axios.get("/groups/pending-invites");
      setPendingInvites(res.data);
    } catch (err) { console.log(err); }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
      socket.disconnect();
      window.location.href = "/login";
    } catch (err) { console.log(err); }
  };

  const handleConnect = async () => {
    if (!connectEmail.trim()) return;
    try {
      await axios.post("/users/connect", { email: connectEmail });
      showToast("Connected successfully! 🎉");
      setConnectEmail("");
      setShowConnectInput(false);
      setTimeout(() => sidebarRef.current?.fetchUsers(), 300);
    } catch (err) {
      showToast(err.response?.data?.message || "User not found!", "error");
    }
  };

  const handleAccept = async (groupId) => {
    try {
      await axios.post("/groups/accept", { groupId });
      showToast("Joined group! 🎉");
      await Promise.all([fetchPendingInvites(), sidebarRef.current?.fetchGroups()]);
      setShowInvites(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong!", "error");
    }
  };

  const handleDecline = async (groupId) => {
    try {
      await axios.post("/groups/decline", { groupId });
      showToast("Invite declined", "error");
      fetchPendingInvites();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong!", "error");
    }
  };

  const initials = user.fullName.firstName[0]?.toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-14px) scale(0.94); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        .toast-anim { animation: toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }

        @keyframes dropIn {
          from { opacity:0; transform:translateY(-10px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .drop-anim { animation: dropIn 0.2s cubic-bezier(0.34,1.4,0.64,1) both; }

        @keyframes slideDown {
          from { opacity:0; transform:translateY(-100%); }
          to   { opacity:1; transform:translateY(0); }
        }
        .connect-overlay { animation: slideDown 0.22s ease both; }

        @keyframes badgePulse {
          0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.55); }
          50%      { box-shadow:0 0 0 6px rgba(239,68,68,0); }
        }
        .badge-pulse { animation: badgePulse 2s infinite; }

        .nav-input::placeholder { color:rgba(255,255,255,0.55); font-weight:600; }
        .nav-input:focus {
          background:rgba(255,255,255,0.28) !important;
          border-color:rgba(255,255,255,0.65) !important;
          box-shadow:0 0 0 3px rgba(255,255,255,0.18);
          outline:none;
        }

        .nav-icon-btn {
          width:40px; height:40px;
          display:flex; align-items:center; justify-content:center;
          border-radius:13px;
          background:rgba(255,255,255,0.16);
          border:1.5px solid rgba(255,255,255,0.28);
          color:white; cursor:pointer;
          transition:all 0.15s;
          flex-shrink:0; position:relative;
        }
        .nav-icon-btn:hover { background:rgba(255,255,255,0.30); border-color:rgba(255,255,255,0.5); transform:translateY(-1px); }
        .nav-icon-btn:active { transform:scale(0.92); }

        .invite-row:hover { background:#fafafa !important; }
        .accept-btn:hover { opacity:0.88 !important; }

        @media (max-width:640px) {
          .nav-desktop { display:none !important; }
        }
        @media (min-width:641px) {
          .nav-mobile-only { display:none !important; }
          #nav-name-block { display:block !important; }
          .nav-desktop { display:flex !important; }
        }
      `}</style>

      <div style={{height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", background:"#f8f7ff"}}>

        {/* ── TOAST ── */}
        {toast && (
          <div className="toast-anim" style={{
            position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
            zIndex:9999,
            display:"flex", alignItems:"center", gap:10,
            padding:"13px 22px",
            borderRadius:18,
            fontSize:14, fontWeight:800,
            whiteSpace:"nowrap",
            boxShadow:"0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset",
            background: toast.type === "success" ? "#0f0f0f" : "#ef4444",
            color:"white",
          }}>
            {toast.type === "success"
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
            {toast.message}
          </div>
        )}

        {/* ── NAVBAR ── */}
        <header style={{
          background:"linear-gradient(135deg, #5b21b6 0%, #7c3aed 45%, #db2777 100%)",
          flexShrink:0,
          boxShadow:"0 4px 28px rgba(109,40,217,0.45), 0 1px 0 rgba(255,255,255,0.12) inset",
          position:"relative", zIndex:40,
        }}>
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.1) 0%, transparent 55%), radial-gradient(ellipse at 85% 50%, rgba(255,255,255,0.07) 0%, transparent 55%)"}}/>

          <div style={{display:"flex", alignItems:"center", gap:10, padding:"11px 16px", position:"relative", zIndex:1}}>

            {/* Avatar + name */}
            <button
              onClick={() => setShowProfile(true)}
              style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"none",border:"none",cursor:"pointer",padding:"3px 10px 3px 3px",borderRadius:14,transition:"background 0.15s"}}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.13)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div style={{width:42,height:42,borderRadius:14,background:user.avatar?"transparent":"linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.15))",border:"2px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2) inset",flexShrink:0,overflow:"hidden"}}>
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{color:"white",fontWeight:900,fontSize:17,letterSpacing:"-0.5px"}}>{initials}</span>
                }
              </div>
              <div style={{display:"none"}} id="nav-name-block">
                <p style={{color:"white",fontWeight:900,fontSize:14,letterSpacing:"-0.4px",margin:0,lineHeight:1.2}}>{user.fullName.firstName}</p>
                <p style={{color:"rgba(255,255,255,0.6)",fontWeight:600,fontSize:11,margin:0}}>My Profile</p>
              </div>
            </button>

            {/* Center */}
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div className="nav-mobile-only" style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.22)",border:"1.5px solid rgba(255,255,255,0.35)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span style={{color:"white",fontWeight:900,fontSize:19,letterSpacing:"-0.6px"}}>Insta<span style={{color:"#fbcfe8"}}>Dopamine</span></span>
              </div>

              <div className="nav-desktop" style={{display:"none",alignItems:"center",gap:10,width:"100%",maxWidth:500}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <div style={{width:28,height:28,borderRadius:9,background:"rgba(255,255,255,0.22)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <span style={{color:"white",fontWeight:900,fontSize:15,letterSpacing:"-0.4px",whiteSpace:"nowrap"}}>Insta<span style={{color:"#fbcfe8"}}>Dopamine</span></span>
                </div>
                <div style={{width:1,height:22,background:"rgba(255,255,255,0.28)",flexShrink:0}}/>
                <div style={{flex:1,position:"relative"}}>
                  <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input className="nav-input" value={connectEmail} onChange={e=>setConnectEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleConnect()} placeholder="Connect by email..." style={{width:"100%",padding:"9px 12px 9px 34px",background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:12,color:"white",fontSize:14,fontWeight:600,fontFamily:"inherit",transition:"all 0.2s"}}/>
                </div>
                <button onClick={handleConnect} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",background:"white",color:"#7c3aed",border:"none",borderRadius:12,fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"0 2px 14px rgba(0,0,0,0.22)",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.28)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,0.22)";}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add
                </button>
              </div>
            </div>

            {/* Right actions */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>

              {/* Mobile connect */}
              <div className="nav-mobile-only">
                {showConnectInput && (
                  <div className="connect-overlay" style={{position:"fixed",inset:"0 0 auto 0",zIndex:9999,background:"linear-gradient(135deg,#5b21b6,#db2777)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 6px 32px rgba(0,0,0,0.3)"}}>
                    <input className="nav-input" value={connectEmail} onChange={e=>setConnectEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleConnect();}} placeholder="Enter email to connect..." autoFocus style={{flex:1,padding:"11px 16px",background:"rgba(255,255,255,0.18)",border:"1.5px solid rgba(255,255,255,0.32)",borderRadius:14,color:"white",fontSize:15,fontWeight:600,fontFamily:"inherit"}}/>
                    <button onClick={handleConnect} style={{padding:"11px 20px",background:"white",color:"#7c3aed",border:"none",borderRadius:14,fontSize:15,fontWeight:900,cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"0 2px 10px rgba(0,0,0,0.15)"}}>Add</button>
                    <button onClick={()=>setShowConnectInput(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",padding:8,flexShrink:0}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
                <button className="nav-icon-btn" onClick={()=>setShowConnectInput(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </button>
              </div>

              {/* Bell */}
              <div style={{position:"relative"}}>
                <button className="nav-icon-btn" onClick={()=>setShowInvites(!showInvites)} style={{background:showInvites?"rgba(255,255,255,0.32)":undefined,borderColor:showInvites?"rgba(255,255,255,0.55)":undefined}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {pendingInvites.length > 0 && (
                    <span className="badge-pulse" style={{position:"absolute",top:-7,right:-7,minWidth:20,height:20,background:"#ef4444",color:"white",fontSize:10,fontWeight:900,borderRadius:10,padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center",border:"2.5px solid white"}}>
                      {pendingInvites.length}
                    </span>
                  )}
                </button>

                {showInvites && (
                  <div className="drop-anim" style={{position:"absolute",right:0,top:"calc(100% + 12px)",width:348,maxWidth:"calc(100vw - 24px)",background:"white",borderRadius:22,boxShadow:"0 24px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",overflow:"hidden",zIndex:999}}>
                    <div style={{padding:"18px 22px 14px",background:"linear-gradient(135deg,#f5f3ff,#fdf4ff)",borderBottom:"1px solid #ede9fe",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <p style={{margin:0,fontSize:16,fontWeight:900,color:"#0f0f0f",letterSpacing:"-0.4px"}}>Group Invites</p>
                        <p style={{margin:"3px 0 0",fontSize:12,color:"#7c3aed",fontWeight:700}}>{pendingInvites.length>0?`${pendingInvites.length} waiting for you`:"You're all caught up!"}</p>
                      </div>
                      {pendingInvites.length>0&&<div style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)",color:"white",fontSize:11,fontWeight:900,padding:"5px 12px",borderRadius:20,boxShadow:"0 2px 10px rgba(124,58,237,0.35)"}}>{pendingInvites.length} new</div>}
                    </div>
                    {pendingInvites.length===0?(
                      <div style={{padding:"44px 24px",textAlign:"center"}}>
                        <div style={{width:60,height:60,background:"linear-gradient(135deg,#f5f3ff,#fdf4ff)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 4px 16px rgba(124,58,237,0.12)"}}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </div>
                        <p style={{margin:0,fontSize:15,fontWeight:900,color:"#1f2937"}}>All caught up!</p>
                        <p style={{margin:"5px 0 0",fontSize:13,color:"#9ca3af",fontWeight:600}}>No pending group invites</p>
                      </div>
                    ):(
                      <div style={{maxHeight:320,overflowY:"auto"}}>
                        {pendingInvites.map((group,idx)=>(
                          <div key={group._id} className="invite-row" style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:14,borderBottom:idx<pendingInvites.length-1?"1px solid #f9fafb":"none",transition:"background 0.12s"}}>
                            <div style={{width:48,height:48,borderRadius:16,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px rgba(124,58,237,0.35)",fontSize:20,fontWeight:900,color:"white"}}>{group.name[0].toUpperCase()}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{margin:0,fontSize:15,fontWeight:900,color:"#0f0f0f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{group.name}</p>
                              <p style={{margin:"3px 0 0",fontSize:12,color:"#6b7280",fontWeight:600}}>Invited by {group.admin.fullName.firstName}</p>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                              <button className="accept-btn" onClick={()=>handleAccept(group._id)} style={{padding:"7px 16px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",color:"white",border:"none",borderRadius:10,fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(124,58,237,0.4)",transition:"opacity 0.15s"}}>Accept</button>
                              <button onClick={()=>handleDecline(group._id)} style={{padding:"6px 12px",background:"#f3f4f6",color:"#6b7280",border:"none",borderRadius:10,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.background="#f3f4f6";e.currentTarget.style.color="#6b7280";}}>Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logout */}
              <button className="nav-icon-btn" onClick={handleLogout} title="Logout" onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.38)";e.currentTarget.style.borderColor="rgba(239,68,68,0.5)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.16)";e.currentTarget.style.borderColor="rgba(255,255,255,0.28)";}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)"}}/>
        </header>

        {/* Main */}
        <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative"}}>
          <Sidebar
            ref={sidebarRef}
            currentUser={user}
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
            isOpen={sidebarOpen}
            onClose={()=>setSidebarOpen(false)}
          />
          {selectedUser?.isGroup ? (
            <GroupChatBox
              group={selectedUser}
              currentUser={user}
              onOpenSidebar={()=>setSidebarOpen(true)}
              onGroupUpdated={()=>{sidebarRef.current?.fetchUsers();sidebarRef.current?.fetchGroups();}}
            />
          ) : (
            <ChatBox selectedUser={selectedUser} currentUser={user} onOpenSidebar={()=>setSidebarOpen(true)}/>
          )}
        </div>

        {showProfile && (
          <ProfilePanel
            user={user}
            onClose={()=>setShowProfile(false)}
            onUpdated={(updatedUser)=>{
              setUser(updatedUser);
              setShowProfile(false);
              showToast("Profile updated! ✅");
            }}
          />
        )}
      </div>
    </>
  );
}

export default Home;



