


import { useState } from "react";
import axios from "../api/axios";

function CreateGroup({ onClose, onGroupCreated, connections }) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [createdGroup, setCreatedGroup] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState([]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("/groups/create", { name: groupName });
      setCreatedGroup(res.data);
      setStep(2);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendInvites = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          axios.post("/groups/invite", { groupId: createdGroup._id, userId })
        )
      );
      setInviteSent(selectedUsers);
      setSelectedUsers([]);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const handleDone = () => {
    onGroupCreated(createdGroup);
    onClose();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .cg-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes cg-pop { from { opacity:0; transform: scale(0.94) translateY(12px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .cg-card { animation: cg-pop 0.25s cubic-bezier(0.34,1.2,0.64,1) both; }
        .cg-input {
          width: 100%; padding: 14px 16px;
          border: 2px solid #e5e7eb; border-radius: 16px;
          font-size: 15px; font-weight: 600; color: #111827;
          background: #f9fafb; outline: none;
          transition: all 0.2s; font-family: inherit;
        }
        .cg-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .cg-input::placeholder { color: #9ca3af; font-weight: 400; }
      `}</style>

      <div className="cg-wrap fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
        <div className="cg-card bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4" style={{borderBottom:"2px solid #f3f4f6"}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 4px 14px rgba(124,58,237,0.35)"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Create Group</h2>
                  <p className="text-[12px] font-semibold text-gray-500 mt-0.5">
                    {step === 1 ? "Name your group" : "Invite your connections"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Step bar */}
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 flex-1 rounded-full transition-all" style={{background: step >= 1 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "#e5e7eb"}}/>
              <div className="h-2 flex-1 rounded-full transition-all" style={{background: step >= 2 ? "linear-gradient(135deg,#a855f7,#ec4899)" : "#e5e7eb"}}/>
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="px-6 py-6">
              {/* Preview avatar */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-4xl" style={{
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.35)"
                }}>
                  {groupName ? groupName[0].toUpperCase() : "#"}
                </div>
              </div>

              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Group Name</label>
              <input
                className="cg-input mt-2"
                placeholder="e.g. Weekend Squad, Dev Team..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                autoFocus
              />

              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || loading}
                className="mt-5 w-full py-3.5 text-white font-black text-[15px] rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 6px 20px rgba(124,58,237,0.4)"}}
              >
                {loading ? "Creating…" : "Create Group →"}
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="px-6 py-6">
              {/* Success badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl mb-5" style={{background:"#f0fdf4", border:"2px solid #bbf7d0"}}>
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-black text-emerald-700">"{createdGroup?.name}" created!</p>
                  <p className="text-[12px] font-semibold text-emerald-600 mt-0.5">Now invite your connections</p>
                </div>
              </div>

              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Your Connections · {connections.length}
              </label>

              <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {connections.length === 0 ? (
                  <p className="text-[14px] font-semibold text-gray-400 py-6 text-center">No connections yet</p>
                ) : (
                  connections.map((user) => {
                    const isSelected    = selectedUsers.includes(user._id);
                    const alreadyInvited = inviteSent.includes(user._id);

                    return (
                      <button
                        key={user._id}
                        onClick={() => !alreadyInvited && toggleUser(user._id)}
                        disabled={alreadyInvited}
                        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-left"
                        style={{
                          background: alreadyInvited ? "#f0fdf4" : isSelected ? "#faf5ff" : "#f9fafb",
                          border: "2px solid " + (alreadyInvited ? "#bbf7d0" : isSelected ? "#c4b5fd" : "#e5e7eb"),
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-[14px]"
                          style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 2px 8px rgba(124,58,237,0.25)"}}>
                          {user.fullName.firstName[0].toUpperCase()}
                        </div>

                        <span className="flex-1 text-[14px] font-bold truncate"
                          style={{color: alreadyInvited ? "#059669" : isSelected ? "#6d28d9" : "#111827"}}>
                          {user.fullName.firstName} {user.fullName.lastName}
                        </span>

                        {alreadyInvited ? (
                          <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                            Invited ✓
                          </span>
                        ) : isSelected ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0"/>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleSendInvites}
                    disabled={loading}
                    className="flex-1 py-3.5 text-white text-[14px] font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                    style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 4px 16px rgba(124,58,237,0.35)"}}
                  >
                    {loading ? "Sending…" : `Send ${selectedUsers.length} Invite${selectedUsers.length > 1 ? "s" : ""}`}
                  </button>
                )}
                <button
                  onClick={handleDone}
                  className="py-3.5 text-[14px] font-bold rounded-2xl transition-all active:scale-95"
                  style={{
                    flex: selectedUsers.length > 0 ? "0 0 auto" : 1,
                    padding: selectedUsers.length > 0 ? "14px 20px" : "14px",
                    background: selectedUsers.length > 0 ? "#f3f4f6" : "linear-gradient(135deg,#7c3aed,#ec4899)",
                    color: selectedUsers.length > 0 ? "#4b5563" : "#fff",
                    boxShadow: selectedUsers.length > 0 ? "none" : "0 4px 16px rgba(124,58,237,0.35)",
                  }}
                >
                  {inviteSent.length > 0 ? "Done 🎉" : "Skip for now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CreateGroup;




