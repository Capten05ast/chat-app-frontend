


import { useState } from "react";
import axios from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

function Register({ setUser }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/register", {
        fullName: { firstName, lastName }, email, password,
      });
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
        .reg-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .reg-wrap {
          min-height: 100vh;
          display: flex;
          background: #ffffff;
        }

        /* ── LEFT: Illustration ── */
        .rp-left {
          flex: 1;
          background: #fdf4ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .rp-blob {
          position: absolute; border-radius: 50%;
          filter: blur(60px); opacity: 0.22; pointer-events: none;
        }
        .rp-blob-1 { width: 360px; height: 360px; background: #ec4899; top: -80px; left: -60px; }
        .rp-blob-2 { width: 280px; height: 280px; background: #7c3aed; bottom: -60px; right: -40px; }

        .rp-scene-wrap {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; gap: 32px;
        }

        /* Steps */
        .rp-steps { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px; }
        .rp-step {
          display: flex; align-items: center; gap: 14px;
          background: #fff;
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: 0 2px 14px rgba(0,0,0,0.05);
          animation: stepSlide 0.5s ease both;
        }
        .rp-step:nth-child(2) { animation-delay: 0.1s; }
        .rp-step:nth-child(3) { animation-delay: 0.2s; }
        @keyframes stepSlide {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .rp-step-num {
          width: 32px; height: 32px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .rp-step-text { font-size: 13.5px; font-weight: 600; color: #374151; }

        /* Avatar group */
        .rp-avatars {
          display: flex; align-items: center;
          background: #fff;
          border-radius: 20px;
          padding: 10px 18px;
          box-shadow: 0 2px 14px rgba(0,0,0,0.06);
          gap: 4px;
        }
        .rp-av {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff;
          margin-left: -6px;
        }
        .rp-av:first-child { margin-left: 0; }
        .rp-av-text { font-size: 12px; font-weight: 600; color: #6b7280; margin-left: 8px; }

        .rp-right-title {
          font-size: 22px; font-weight: 800; color: #111;
          letter-spacing: -0.5px; text-align: center; line-height: 1.3;
        }
        .rp-right-title span { color: #ec4899; }
        .rp-right-sub {
          font-size: 13.5px; color: #9ca3af; text-align: center;
          margin-top: 6px; line-height: 1.6;
        }

        /* ── RIGHT: Form ── */
        .rp-right {
          flex: 0 0 480px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 52px;
        }

        .rp-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 36px;
        }
        .rp-logo-icon {
          width: 36px; height: 36px; background: linear-gradient(135deg,#7c3aed,#ec4899);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .rp-logo-name { font-size: 17px; font-weight: 800; color: #111; letter-spacing: -0.3px; }
        .rp-logo-name span { color: #ec4899; }

        .rp-title { font-size: 28px; font-weight: 800; color: #0f0f0f; letter-spacing: -0.7px; margin-bottom: 6px; }
        .rp-sub { font-size: 14px; color: #9ca3af; font-weight: 400; margin-bottom: 28px; line-height: 1.5; }

        /* Error */
        .rp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 13px;
          padding: 11px 14px; border-radius: 12px; margin-bottom: 18px;
        }

        /* Name row */
        .rp-row { display: flex; gap: 12px; margin-bottom: 14px; }

        .rp-field { margin-bottom: 14px; }
        .rp-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #6b7280; text-transform: uppercase;
          letter-spacing: 0.6px; margin-bottom: 7px;
        }
        .rp-input-wrap { position: relative; }
        .rp-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #d1d5db; pointer-events: none; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .rp-input-wrap:focus-within .rp-input-icon { color: #ec4899; }
        .rp-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px; color: #111;
          background: #f9fafb; outline: none;
          transition: all 0.2s; font-family: inherit;
        }
        .rp-input-plain {
          width: 100%;
          padding: 13px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px; color: #111;
          background: #f9fafb; outline: none;
          transition: all 0.2s; font-family: inherit;
        }
        .rp-input:focus, .rp-input-plain:focus {
          border-color: #ec4899;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.08);
        }
        .rp-input::placeholder, .rp-input-plain::placeholder { color: #c4c9d4; }
        .rp-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .rp-eye:hover { color: #ec4899; }

        /* Submit */
        .rp-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: #fff; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          margin-top: 6px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; font-family: inherit; letter-spacing: 0.1px;
        }
        .rp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.25); }
        .rp-btn:active:not(:disabled) { transform: translateY(0); }
        .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0 16px;
        }
        .rp-divider-line { flex: 1; height: 1px; background: #f0f0f0; }
        .rp-divider-text { font-size: 12px; color: #c4c9d4; font-weight: 500; }

        .rp-footer { text-align: center; font-size: 13.5px; color: #9ca3af; }
        .rp-footer a { color: #7c3aed; font-weight: 700; text-decoration: none; }
        .rp-footer a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .rp-left { display: none; }
          .rp-right { flex: 1; padding: 40px 28px; }
        }
      `}</style>

      <div className="reg-wrap">

        {/* ── LEFT: Illustration ── */}
        <div className="rp-left">
          <div className="rp-blob rp-blob-1"/>
          <div className="rp-blob rp-blob-2"/>

          <div className="rp-scene-wrap">

            {/* SVG Illustration — person waving */}
            <svg viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:260,height:240}}>
              {/* Shadow */}
              <ellipse cx="140" cy="248" rx="55" ry="10" fill="#e9d5ff" opacity="0.5"/>
              {/* Legs */}
              <path d="M125 215 Q118 232 110 244" stroke="#c4b5fd" strokeWidth="14" strokeLinecap="round"/>
              <path d="M155 215 Q162 232 170 244" stroke="#c4b5fd" strokeWidth="14" strokeLinecap="round"/>
              {/* Torso */}
              <rect x="112" y="152" width="56" height="68" rx="22" fill="#ec4899"/>
              {/* Star on shirt */}
              <path d="M140 167 L142 173 L148 173 L143 177 L145 183 L140 179 L135 183 L137 177 L132 173 L138 173 Z" fill="white" opacity="0.45"/>
              {/* Left arm — down */}
              <path d="M112 168 Q92 182 88 198" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round"/>
              {/* Right arm — waving up */}
              <path d="M168 162 Q188 140 196 118" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round"/>
              {/* Right hand wave */}
              <circle cx="198" cy="112" r="10" fill="#fbbf24" opacity="0.9"/>
              {/* Neck */}
              <rect x="132" y="136" width="16" height="18" rx="8" fill="#fbbf24" opacity="0.9"/>
              {/* Head */}
              <circle cx="140" cy="120" r="30" fill="#fbbf24" opacity="0.9"/>
              {/* Hair */}
              <path d="M110 115 Q112 88 140 88 Q168 88 170 115" fill="#1f1f1f" opacity="0.85"/>
              <path d="M110 115 Q104 120 107 130" stroke="#1f1f1f" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
              {/* Eyes — happy squint */}
              <path d="M131 117 Q134 113 137 117" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M143 117 Q146 113 149 117" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Big smile */}
              <path d="M131 128 Q140 138 149 128" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              {/* Sparkles */}
              <path d="M60 60 L63 68 L71 71 L63 74 L60 82 L57 74 L49 71 L57 68 Z" fill="#7c3aed" opacity="0.5"/>
              <path d="M210 50 L212 56 L218 58 L212 60 L210 66 L208 60 L202 58 L208 56 Z" fill="#ec4899" opacity="0.5"/>
              <circle cx="75" cy="40" r="4" fill="#a855f7" opacity="0.4"/>
              <circle cx="200" cy="80" r="3" fill="#f472b6" opacity="0.4"/>
              {/* Chat bubbles floating */}
              <rect x="32" y="100" width="64" height="32" rx="12" fill="#7c3aed" opacity="0.12"/>
              <text x="64" y="121" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="700" fontFamily="sans-serif">Hello! 👋</text>
              <rect x="184" y="150" width="72" height="32" rx="12" fill="#ec4899" opacity="0.12"/>
              <text x="220" y="171" textAnchor="middle" fontSize="11" fill="#ec4899" fontWeight="700" fontFamily="sans-serif">Let's chat!</text>
            </svg>

            {/* Steps */}
            <div className="rp-steps">
              {[
                { n: "01", text: "Create your free account" },
                { n: "02", text: "Find friends by email" },
                { n: "03", text: "Start chatting instantly ⚡" },
              ].map(s => (
                <div key={s.n} className="rp-step">
                  <div className="rp-step-num">{s.n}</div>
                  <div className="rp-step-text">{s.text}</div>
                </div>
              ))}
            </div>

            {/* Avatar group */}
            <div className="rp-avatars">
              {[
                {l:"A", bg:"linear-gradient(135deg,#7c3aed,#a855f7)"},
                {l:"S", bg:"linear-gradient(135deg,#ec4899,#f43f5e)"},
                {l:"R", bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
                {l:"K", bg:"linear-gradient(135deg,#10b981,#3b82f6)"},
              ].map((a,i) => (
                <div key={i} className="rp-av" style={{background:a.bg}}>{a.l}</div>
              ))}
              <span className="rp-av-text">+2k people joined</span>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="rp-right">

          <div className="rp-logo">
            <div className="rp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="rp-logo-name">Insta <span>Dopamine</span></span>
          </div>

          <h1 className="rp-title">Create your account 🚀</h1>
          <p className="rp-sub">Free forever. Takes less than a minute.</p>

          {error && (
            <div className="rp-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Name row */}
          <div className="rp-row">
            <div style={{flex:1}}>
              <label className="rp-label">First Name</label>
              <input className="rp-input-plain" placeholder="John" value={firstName}
                onChange={e => setFirstName(e.target.value)} onKeyDown={e => e.key==="Enter" && handleRegister()}/>
            </div>
            <div style={{flex:1}}>
              <label className="rp-label">Last Name</label>
              <input className="rp-input-plain" placeholder="Doe" value={lastName}
                onChange={e => setLastName(e.target.value)} onKeyDown={e => e.key==="Enter" && handleRegister()}/>
            </div>
          </div>

          {/* Email */}
          <div className="rp-field">
            <label className="rp-label">Email address</label>
            <div className="rp-input-wrap">
              <span className="rp-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input className="rp-input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleRegister()}/>
            </div>
          </div>

          {/* Password */}
          <div className="rp-field" style={{marginBottom: 20}}>
            <label className="rp-label">Password</label>
            <div className="rp-input-wrap">
              <span className="rp-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input className="rp-input" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleRegister()} style={{paddingRight:44}}/>
              <button className="rp-eye" type="button" onClick={() => setShowPassword(p => !p)}>
                {showPassword
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button className="rp-btn" onClick={handleRegister} disabled={loading}>
            {loading
              ? <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Creating account...</>
              : <>Create account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
            }
          </button>

          <div className="rp-divider">
            <div className="rp-divider-line"/>
            <span className="rp-divider-text">Already have an account?</span>
            <div className="rp-divider-line"/>
          </div>

          <p className="rp-footer">
            Already registered?{" "}
            <Link to="/login">Sign in →</Link>
          </p>
        </div>

      </div>
    </>
  );
}

export default Register;



