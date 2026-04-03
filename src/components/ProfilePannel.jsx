

import { useState } from "react";
import axios from "../api/axios";

function ProfilePannel({ user, onClose, onUpdated }) {
  const [firstName, setFirstName]       = useState(user.fullName.firstName);
  const [lastName, setLastName]         = useState(user.fullName.lastName || "");
  const [email, setEmail]               = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [showPassSection, setShowPassSection] = useState(false);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!firstName.trim()) return setError("First name is required");
    if (!email.trim())     return setError("Email is required");

    if (showPassSection) {
      if (!currentPassword) return setError("Enter your current password");
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
      onUpdated(res.data); // 🔥 update user in App state
      setSuccess("Profile updated successfully! ✅");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const initials = firstName[0]?.toUpperCase();
  const gradients = "from-violet-500 via-pink-500 to-orange-400";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 px-5 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients} border-2 border-white/30 flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight">{user.fullName.firstName}</p>
              <p className="text-white/60 text-[12px]">Edit your profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Name row */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                placeholder="First name"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              placeholder="Email address"
            />
            <p className="text-[11px] text-gray-400">Changing email won't affect your existing connections.</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Change password toggle */}
          <button
            onClick={() => setShowPassSection((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span className="text-[13px] font-semibold text-gray-700">Change Password</span>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
              className={`transition-transform duration-200 ${showPassSection ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Password fields */}
          {showPassSection && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Current Password</label>
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">New Password</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Confirm Password</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-[13px] text-emerald-600 font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[13px] font-semibold shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfilePannel;




