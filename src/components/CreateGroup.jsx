


import { useState } from "react";
import axios from "../api/axios";

function CreateGroup({ onClose, onGroupCreated, connections }) {
  const [step, setStep] = useState(1); // step 1: name, step 2: invite
  const [groupName, setGroupName] = useState("");
  const [createdGroup, setCreatedGroup] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState([]);

  // 🔥 STEP 1 — create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("/groups/create", { name: groupName });
      setCreatedGroup(res.data);
      setStep(2); // move to invite step
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 toggle select user
  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 🔥 STEP 2 — send invites
  const handleSendInvites = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          axios.post("/groups/invite", {
            groupId: createdGroup._id,
            userId,
          })
        )
      );
      setInviteSent(selectedUsers);
      setSelectedUsers([]);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onGroupCreated(createdGroup);
    onClose();
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">Create Group</h2>
                <p className="text-[11px] text-gray-400">
                  {step === 1 ? "Name your group" : "Invite your connections"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? "bg-violet-500" : "bg-gray-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? "bg-violet-500" : "bg-gray-200"}`} />
          </div>
        </div>

        {/* STEP 1 — Group Name */}
        {step === 1 && (
          <div className="px-6 py-6">
            {/* Group avatar preview */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-200">
                <span className="text-white font-bold text-3xl">
                  {groupName ? groupName[0].toUpperCase() : "#"}
                </span>
              </div>
            </div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Group Name
            </label>
            <input
              className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
              placeholder="e.g. Weekend Squad, Dev Team..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              autoFocus
            />

            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || loading}
              className="mt-4 w-full py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-2xl shadow-md shadow-violet-200 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Group →"}
            </button>
          </div>
        )}

        {/* STEP 2 — Invite Connections */}
        {step === 2 && (
          <div className="px-6 py-6">
            {/* Group created badge */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl mb-5">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  "{createdGroup?.name}" created!
                </p>
                <p className="text-xs text-emerald-500">Now invite your connections</p>
              </div>
            </div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Connections · {connections.length}
            </label>

            {/* Connections list */}
            <div className="mt-2 max-h-56 overflow-y-auto space-y-1 pr-1">
              {connections.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  No connections yet
                </p>
              ) : (
                connections.map((user) => {
                  const isSelected = selectedUsers.includes(user._id);
                  const alreadyInvited = inviteSent.includes(user._id);

                  return (
                    <button
                      key={user._id}
                      onClick={() => !alreadyInvited && toggleUser(user._id)}
                      disabled={alreadyInvited}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 text-left
                        ${alreadyInvited
                          ? "bg-emerald-50 border border-emerald-100 cursor-default"
                          : isSelected
                            ? "bg-violet-50 border border-violet-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-bold text-sm">
                          {user.fullName.firstName[0].toUpperCase()}
                        </span>
                      </div>

                      <span className={`flex-1 text-sm font-semibold truncate
                        ${alreadyInvited ? "text-emerald-600" : isSelected ? "text-violet-700" : "text-gray-800"}`}
                      >
                        {user.fullName.firstName} {user.fullName.lastName}
                      </span>

                      {/* Status */}
                      {alreadyInvited ? (
                        <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          Invited ✓
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleSendInvites}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-semibold rounded-2xl shadow-md shadow-violet-200 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Sending..." : `Send ${selectedUsers.length} Invite${selectedUsers.length > 1 ? "s" : ""}`}
                </button>
              )}
              <button
                onClick={handleDone}
                className={`py-3 text-sm font-semibold rounded-2xl transition-all active:scale-95
                  ${selectedUsers.length > 0
                    ? "px-4 bg-gray-100 hover:bg-gray-200 text-gray-600"
                    : "flex-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-200 hover:opacity-90"
                  }`}
              >
                {inviteSent.length > 0 ? "Done 🎉" : "Skip for now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateGroup;




