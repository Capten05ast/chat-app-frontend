


import { useState, useRef } from "react";
import axios from "../api/axios";

function ProfilePannel({ user, onClose, onUpdated }) {
  const [firstName, setFirstName]             = useState(user.fullName.firstName);
  const [lastName, setLastName]               = useState(user.fullName.lastName || "");
  const [email, setEmail]                     = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [avatarLoading, setAvatarLoading]     = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [showPassSection, setShowPassSection] = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState(user.avatar || "");

  const fileRef = useRef(null);
  const initials = firstName[0]?.toUpperCase();

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Instant local preview
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarPreview(res.data.avatar);
      onUpdated(res.data); // propagate new user object up to App state
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
    if (!email.trim())     return setError("Email is required");
    if (showPassSection) {
      if (!currentPassword)       return setError("Enter your current password");
      if (newPassword.length < 6) return setError("New password must be at least 6 characters");
      if (newPassword !== confirmPassword) return setError("Passwords don't match");
    }
    setLoading(true);
    try {
      const payload = { firstName, lastName, email };
      if (showPassSection && currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword     = newPassword;
      }
      const res = await axios.patch("/users/update-profile", payload);
      onUpdated(res.data);
      setSuccess("Profile updated! ✅");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
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
          transition: all 0.2s; font-family: inherit;
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

        {/* ── Header with avatar ── */}
        <div className="flex-shrink-0 px-5 py-5" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}>
          <div className="flex items-start justify-between">

            {/* Avatar + upload controls */}
            <div className="flex items-center gap-4">
              {/* Avatar circle — clickable to upload */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarLoading}
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-3xl transition-all active:scale-95"
                  style={{
                    background: avatarPreview ? "transparent" : "rgba(255,255,255,0.2)",
                    border: "2.5px solid rgba(255,255,255,0.45)",
                    boxShadow:"0 4px 16px rgba(0,0,0,0.25)",
                  }}
                  title="Click to change photo"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                  ) : (
                    initials
                  )}

                  {/* Loading spinner overlay */}
                  {avatarLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{background:"rgba(0,0,0,0.45)"}}>
                      <div className="pp-spin w-6 h-6 border-3 border-white/40 rounded-full" style={{borderTopColor:"white", borderWidth:3}}/>
                    </div>
                  )}

                  {/* Camera icon overlay on hover */}
                  {!avatarLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 hover:opacity-100 transition-opacity" style={{background:"rgba(0,0,0,0.4)"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  )}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name + controls */}
              <div>
                <p className="text-white font-black text-[18px] leading-tight tracking-tight">{user.fullName.firstName}</p>
                <p className="text-white/70 text-[13px] font-semibold mt-0.5 mb-3">Edit your profile</p>

                {/* Avatar action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarLoading}
                    className="px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{background:"rgba(255,255,255,0.22)", color:"white", border:"1.5px solid rgba(255,255,255,0.35)"}}
                  >
                    {avatarPreview ? "Change" : "Upload"} Photo
                  </button>
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarLoading}
                      className="px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                      style={{background:"rgba(239,68,68,0.28)", color:"white", border:"1.5px solid rgba(239,68,68,0.4)"}}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white flex-shrink-0 transition-all active:scale-95"
              style={{background:"rgba(255,255,255,0.15)"}}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Name row */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">First Name</label>
              <input className="pp-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"/>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Last Name</label>
              <input className="pp-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"/>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
            <input className="pp-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"/>
            <p className="text-[12px] font-semibold text-gray-400">Changing email won't affect existing connections.</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100"/>

          {/* Password toggle */}
          <button
            onClick={() => setShowPassSection((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
            style={{border:"2px solid " + (showPassSection ? "#c4b5fd" : "#e5e7eb"), background: showPassSection ? "#faf5ff" : "#f9fafb"}}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#ede9fe,#fce7f3)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span className="text-[14px] font-bold text-gray-800">Change Password</span>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
              style={{transform: showPassSection ? "rotate(180deg)" : "none", transition:"transform 0.2s"}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showPassSection && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Current Password</label>
                <input className="pp-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="••••••••"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">New Password</label>
                <input className="pp-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 6 characters"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Confirm Password</label>
                <input className="pp-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••"/>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl" style={{background:"#fef2f2", border:"1.5px solid #fecaca"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[13px] font-bold text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl" style={{background:"#f0fdf4", border:"1.5px solid #bbf7d0"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-[13px] font-bold text-emerald-600">{success}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-5 py-4 flex gap-3" style={{borderTop:"2px solid #f3f4f6"}}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-gray-600 transition-all hover:bg-gray-100"
            style={{border:"2px solid #e5e7eb"}}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-50"
            style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 4px 16px rgba(124,58,237,0.35)"}}
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfilePannel;


