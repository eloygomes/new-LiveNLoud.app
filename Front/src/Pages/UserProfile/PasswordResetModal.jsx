/* eslint-disable react/prop-types */
import { useState } from "react";

function PasswordResetModal({ isOpen, onClose, onSubmit }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    onSubmit(oldPassword, newPassword); // Envia oldPassword e newPassword
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-5 rounded-md shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>

        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded input-neumorfismo"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded input-neumorfismo"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded input-neumorfismo"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            className="neuphormism-b-btn w-5/12 p-2 mb-2"
          >
            Submit
          </button>
          <button onClick={onClose} className="neuphormism-b-btn w-5/12 p-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetModal;
