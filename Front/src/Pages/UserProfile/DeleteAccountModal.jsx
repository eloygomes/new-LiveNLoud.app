import { useState } from "react";

function DeleteAccountModal({ isOpen, onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmationText !== "DELETE") {
      return;
    }
    onSubmit(password, confirmationText);
  };

  const handleClose = () => {
    setPassword("");
    setConfirmationText("");
    onClose();
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
          This action deletes your account data across the platform. Enter your
          password and type DELETE to continue.
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
          <input
            type="text"
            placeholder='Type DELETE to confirm'
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            required
            className="border p-2 w-full mb-4 uppercase"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="mr-4 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmationText !== "DELETE"}
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
