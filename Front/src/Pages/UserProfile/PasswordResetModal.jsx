/* eslint-disable react/prop-types */
import { useState } from "react";

function PasswordResetModal({ isOpen, onClose, onSubmit }) {
  const [newPassword, setNewPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-5 rounded-md shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <button
          onClick={() => onSubmit(newPassword)}
          className="neuphormism-b-btn w-full p-2 mb-2"
        >
          Submit
        </button>
        <button onClick={onClose} className="neuphormism-b-btn w-full p-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PasswordResetModal;
