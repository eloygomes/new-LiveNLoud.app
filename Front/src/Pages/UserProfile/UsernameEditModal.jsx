/* eslint-disable react/prop-types */
import { useState } from "react";
import { updateUserName } from "../../Tools/Controllers";

function UsernameEditModal({ isOpen, onClose }) {
  const [newUserName, setnewUserName] = useState("");

  const handleSubmit = () => {
    updateUserName(newUserName);
    console.log("newUserName", newUserName);
    // console.log("currentUsername", currentUsername)
    alert("Username atualizado com sucesso!");
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
      <div className="bg-white p-5 rounded-md shadow-lg w-80 ">
        <h2 className="text-lg font-bold mb-4">Change User Name</h2>

        <input
          type="text"
          placeholder="Insert your new username"
          value={newUserName}
          onChange={(e) => setnewUserName(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded input-neumorfismo"
        />

        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            className="neuphormism-b-btn w-5/12 p-2 mb-2"
          >
            Update
          </button>
          <button onClick={onClose} className="neuphormism-b-btn w-5/12 p-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsernameEditModal;
