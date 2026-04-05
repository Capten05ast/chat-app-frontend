


import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";

function ProfilePannel({ user, onClose, onUpdated }) {
  // ✅ Form State
  const [firstName, setFirstName] = useState(user?.fullName?.firstName || "");
  const [lastName, setLastName] = useState(user?.fullName?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  
  // ✅ Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassSection, setShowPassSection] = useState(false);

  // ✅ Status State
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  const fileRef = useRef(null);

  // ── Sync internal state if the user prop changes ────────────────────────────
  useEffect(() => {
    if (user) {
      setFirstName(user.fullName?.firstName || "");
      setLastName(user.fullName?.lastName || "");
      setEmail(user.email || "");
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

  const initials = firstName[0]?.toUpperCase() || "?";

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Cleanup old object URLs to prevent memory leaks
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      onUpdated(res.data); 
      setSuccess("Profile picture updated! 🎉");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload picture");
      setAvatarPreview(user.avatar || "");
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Avatar remove ──────────────────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    if (!avatarPreview) return;
    setAvatarLoading(true);
    setError("");
    try {
      const res = await axios.delete("/users/remove-avatar");
      setAvatarPreview("");
      onUpdated(res.data);
      setSuccess("Profile picture removed.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove picture");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Profile info save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!firstName.trim()) return setError("First name is required");
    if (!email.trim()) return setError("Email is required");

    if (showPassSection) {
      if (!currentPassword) return setError("Enter your current password");
      if (newPassword.length < 6) return setError("New password must be at least 6 characters");
      if (newPassword !== confirmPassword) return setError("Passwords don't match");
    }

    setLoading(true);
    try {
      const payload = { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: email.trim() 
      };

      if (showPassSection) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await axios.patch("/users/update-profile", payload);
      onUpdated(res.data);
      setSuccess("Profile updated! ✅");
      
      // Reset password fields only
      setCurrentPassword(""); 
      setNewPassword(""); 
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .pp-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes pp-slide { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .pp-panel { animation: pp-slide 0.28s cubic-bezier(0.34,1.1,0.64,1) both; }
        
        .pp-input {
          width: 100%; padding: 13px 16px;
          border: 2px solid #e5e7eb; border-radius: 14px;
          font-size: 14px; font-weight: 600; color: #111827;
          background: #f9fafb; outline: none;
          transition: all 0.2s;
        }
        .pp-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .pp-input::placeholder { color: #9ca3af; font-weight: 400; }
        
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        .pp-spin { animation: pp-spin 0.7s linear infinite; }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}/>

      {/* Panel */}
      <div className="pp-wrap pp-panel fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 py-5" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarLoading}
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-3xl transition-all active:scale-95 bg-white/20 border-[2.5px] border-white/45 shadow-lg"
                  title="Click to change photo"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                  ) : initials}

                  {avatarLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-2xl">
                      <div className="pp-spin w-6 h-6 border-3 border-white/40 rounded-full border-t-white" style={{borderWidth:3}}/>
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div>
                <p className="text-white font-black text-[18px] leading-tight">{firstName || "User"}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarLoading}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all"
                  >
                    {avatarPreview ? "Change" : "Upload"}
                  </button>
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarLoading}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-red-500/30 text-white border border-red-400/40 hover:bg-red-500/40 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-white bg-white/15 hover:bg-white/25 transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Form Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
              <input className="pp-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"/>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
              <input className="pp-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"/>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
            <input className="pp-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"/>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Password Toggle */}
          <button
            onClick={() => setShowPassSection(!showPassSection)}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all border-2 ${showPassSection ? "border-purple-200 bg-purple-50" : "border-gray-100 bg-gray-50"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span className="text-[14px] font-bold text-gray-700">Change Password</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3" style={{transform: showPassSection ? "rotate(180deg)" : "none", transition:"0.2s"}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showPassSection && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
                <input className="pp-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="••••••••"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                <input className="pp-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 6 characters"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                <input className="pp-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••"/>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-[13px] font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          {success && <p className="text-emerald-600 text-[13px] font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">{success}</p>}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 flex gap-3 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-gray-500 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-200"
            style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfilePannel;



