// src/components/UserProfile/DeleteAccountModal.js
import { useState } from "react";
import { deleteUserAccountOnDb } from "../../Tools/Controllers";

function DeleteAccountModal({ isOpen, onClose, onSubmit }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
    deleteUserAccountOnDb();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      {/* Modal content */}
      <div className="bg-white rounded-lg p-6 relative z-10">
        <h2 className="text-2xl font-bold mb-4">Confirm Account Deletion</h2>
        <p className="mb-4">
          Please enter your password to confirm account deletion.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border p-2 w-full mb-4"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
