


import { useState } from "react";
import axios from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      setUser(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .login-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .login-wrap {
          min-height: 100vh;
          display: flex;
          background: #ffffff;
        }

        /* ── LEFT FORM PANEL ── */
        .lp-left {
          flex: 0 0 460px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 52px;
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 44px;
        }
        .lp-logo-icon {
          width: 36px; height: 36px;
          background: #7c3aed;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-logo-name {
          font-size: 17px;
          font-weight: 800;
          color: #111;
          letter-spacing: -0.3px;
        }
        .lp-logo-name span { color: #7c3aed; }

        .lp-title {
          font-size: 30px;
          font-weight: 800;
          color: #0f0f0f;
          letter-spacing: -0.8px;
          line-height: 1.15;
          margin-bottom: 8px;
        }
        .lp-sub {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 400;
          margin-bottom: 36px;
          line-height: 1.5;
        }
        .lp-sub b { color: #7c3aed; font-weight: 600; }

        /* Error */
        .lp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
          padding: 11px 14px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        /* Fields */
        .lp-field { margin-bottom: 16px; }
        .lp-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 7px;
        }
        .lp-input-wrap { position: relative; }
        .lp-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #d1d5db; pointer-events: none;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .lp-input-wrap:focus-within .lp-input-icon { color: #7c3aed; }
        .lp-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          color: #111;
          background: #f9fafb;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .lp-input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }
        .lp-input::placeholder { color: #c4c9d4; }
        .lp-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; align-items: center;
          padding: 2px;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #7c3aed; }

        /* Submit */
        .lp-btn {
          width: 100%;
          padding: 14px;
          background: #0f0f0f;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          font-family: inherit;
          letter-spacing: 0.1px;
        }
        .lp-btn:hover:not(:disabled) { background: #1f1f1f; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0 20px;
        }
        .lp-divider-line { flex: 1; height: 1px; background: #f0f0f0; }
        .lp-divider-text { font-size: 12px; color: #c4c9d4; font-weight: 500; }

        .lp-footer {
          text-align: center;
          font-size: 13.5px;
          color: #9ca3af;
        }
        .lp-footer a {
          color: #7c3aed;
          font-weight: 700;
          text-decoration: none;
        }
        .lp-footer a:hover { text-decoration: underline; }

        /* ── RIGHT ILLUSTRATED PANEL ── */
        .lp-right {
          flex: 1;
          background: #f5f3ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        /* Soft blobs in bg */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.25;
          pointer-events: none;
        }
        .lp-blob-1 { width: 340px; height: 340px; background: #7c3aed; top: -80px; right: -60px; }
        .lp-blob-2 { width: 280px; height: 280px; background: #ec4899; bottom: -60px; left: -40px; }

        .lp-illustration {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; gap: 36px;
        }

        /* SVG scene */
        .lp-scene { width: 300px; height: 300px; position: relative; }

        /* Floating chat cards */
        .lp-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          padding: 14px 18px;
          display: flex; align-items: center; gap: 12px;
          position: absolute;
          animation: cardFloat 4s ease-in-out infinite;
          min-width: 190px;
        }
        .lp-card-2 { animation-delay: -2s; animation-duration: 5s; }
        .lp-card-3 { animation-delay: -1s; animation-duration: 4.5s; }

        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .lp-card-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .lp-card-content { flex: 1; min-width: 0; }
        .lp-card-name { font-size: 12px; font-weight: 700; color: #111; }
        .lp-card-msg { font-size: 11px; color: #9ca3af; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-card-time { font-size: 10px; color: #c4c9d4; flex-shrink: 0; }

        /* Online dot */
        .lp-online {
          display: flex; align-items: center; gap: 6px;
          background: #fff;
          border-radius: 20px;
          padding: 7px 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          font-size: 12px; font-weight: 600; color: #374151;
          position: absolute;
        }
        .lp-online-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }

        .lp-right-title {
          font-size: 22px; font-weight: 800; color: #111;
          letter-spacing: -0.5px; text-align: center; line-height: 1.3;
        }
        .lp-right-title span { color: #7c3aed; }
        .lp-right-sub {
          font-size: 13.5px; color: #9ca3af; text-align: center; margin-top: 6px;
          line-height: 1.6;
        }

        /* Stats row */
        .lp-stats {
          display: flex; gap: 16px; margin-top: 4px;
        }
        .lp-stat {
          background: #fff;
          border-radius: 14px;
          padding: 14px 20px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          flex: 1;
        }
        .lp-stat-num { font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
        .lp-stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; font-weight: 500; }

        /* Mobile */
        @media (max-width: 768px) {
          .lp-right { display: none; }
          .lp-left { flex: 1; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-wrap">

        {/* ── LEFT: Form ── */}
        <div className="lp-left">

          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="lp-logo-name">Insta <span>Dopamine</span></span>
          </div>

          <h1 className="lp-title">Welcome back! 👋</h1>
          <p className="lp-sub">
            Sign in to continue to <b>Insta Dopamine</b>.<br/>Your chats are waiting.
          </p>

          {error && (
            <div className="lp-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Email */}
          <div className="lp-field">
            <label className="lp-label">Email address</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                className="lp-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {/* Password */}
          <div className="lp-field" style={{marginBottom: 24}}>
            <label className="lp-label">Password</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                className="lp-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{paddingRight: 44}}
              />
              <button className="lp-eye" type="button" onClick={() => setShowPassword(p => !p)}>
                {showPassword
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button className="lp-btn" onClick={handleLogin} disabled={loading}>
            {loading
              ? <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in...</>
              : <>Sign in <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
            }
          </button>

          <div className="lp-divider">
            <div className="lp-divider-line"/>
            <span className="lp-divider-text">New to Insta Dopamine?</span>
            <div className="lp-divider-line"/>
          </div>

          <p className="lp-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one →</Link>
          </p>
        </div>

        {/* ── RIGHT: Illustration panel ── */}
        <div className="lp-right">
          <div className="lp-blob lp-blob-1"/>
          <div className="lp-blob lp-blob-2"/>

          <div className="lp-illustration">
            {/* Floating chat cards scene */}
            <div className="lp-scene">

              {/* Main center illustration — person with phone */}
              <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{width:'100%',height:'100%',position:'absolute',top:0,left:0}}>
                {/* Body */}
                <ellipse cx="150" cy="260" rx="60" ry="12" fill="#e8e0ff" opacity="0.6"/>
                {/* Legs */}
                <path d="M135 230 Q128 248 120 258" stroke="#c4b5fd" strokeWidth="14" strokeLinecap="round"/>
                <path d="M165 230 Q172 248 180 258" stroke="#c4b5fd" strokeWidth="14" strokeLinecap="round"/>
                {/* Torso */}
                <rect x="122" y="165" width="56" height="72" rx="22" fill="#7c3aed"/>
                {/* Heart on shirt */}
                <path d="M144 193 C144 190 148 187 150 190 C152 187 156 190 156 193 C156 197 150 202 150 202 C150 202 144 197 144 193Z" fill="white" opacity="0.5"/>
                {/* Arms */}
                <path d="M122 180 Q100 195 94 210" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round"/>
                <path d="M178 180 Q200 195 206 210" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round"/>
                {/* Phone in right hand */}
                <rect x="196" y="200" width="22" height="36" rx="5" fill="#1f1f1f"/>
                <rect x="199" y="204" width="16" height="26" rx="3" fill="#7c3aed" opacity="0.7"/>
                {/* Neck */}
                <rect x="142" y="148" width="16" height="20" rx="8" fill="#fbbf24" opacity="0.9"/>
                {/* Head */}
                <circle cx="150" cy="132" r="32" fill="#fbbf24" opacity="0.9"/>
                {/* Hair */}
                <path d="M118 125 Q120 98 150 98 Q180 98 182 125" fill="#1f1f1f" opacity="0.85"/>
                <path d="M118 125 Q112 128 114 136" stroke="#1f1f1f" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
                {/* Eyes */}
                <ellipse cx="141" cy="130" rx="3.5" ry="4" fill="#1f1f1f"/>
                <ellipse cx="159" cy="130" rx="3.5" ry="4" fill="#1f1f1f"/>
                {/* Smile */}
                <path d="M142 141 Q150 148 158 141" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>

              {/* Floating card 1 — top left */}
              <div className="lp-card" style={{top: 0, left: -20}}>
                <div className="lp-card-avatar" style={{background: 'linear-gradient(135deg,#7c3aed,#a855f7)'}}>A</div>
                <div className="lp-card-content">
                  <div className="lp-card-name">Aryan</div>
                  <div className="lp-card-msg">Hey! What's up? 😄</div>
                </div>
                <div className="lp-card-time">now</div>
              </div>

              {/* Floating card 2 — bottom right */}
              <div className="lp-card lp-card-2" style={{bottom: 10, right: -24}}>
                <div className="lp-card-avatar" style={{background: 'linear-gradient(135deg,#ec4899,#f43f5e)'}}>S</div>
                <div className="lp-card-content">
                  <div className="lp-card-name">Sara</div>
                  <div className="lp-card-msg">Sent you a photo 🖼️</div>
                </div>
                <div className="lp-card-time">2m</div>
              </div>

              {/* Online pill */}
              <div className="lp-online" style={{bottom: 70, left: -10}}>
                <div className="lp-online-dot"/>
                <span>12 online now</span>
              </div>
            </div>

            {/* Text */}
            <div style={{textAlign:'center'}}>
              <div className="lp-right-title">
                Chat with your people<br/>on <span>Insta Dopamine</span>
              </div>
              <p className="lp-right-sub">
                Real-time messages, group chats,<br/>and instant photo sharing.
              </p>
            </div>

            {/* Stats */}
            <div className="lp-stats">
              <div className="lp-stat">
                <div className="lp-stat-num">⚡ Fast</div>
                <div className="lp-stat-label">Real-time</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">🔒 Safe</div>
                <div className="lp-stat-label">Secure</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">🌐 Free</div>
                <div className="lp-stat-label">Always</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Login;



