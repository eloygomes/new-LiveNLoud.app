import { useState } from "react";

export default function UserData() {
  const [data, setData] = useState([]);
  return (
    <>
      <div className="flex flex-col justify-start ">
        <h2 className="text-md font-bold mb-2 mt-5 ">User Data</h2>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col ">
            <h2 className="text-[10pt] py-3">All user data</h2>
            <h5 className="text-[8pt]   ">
              This contains all data from user that was stored by the platform
            </h5>
          </div>
          <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
            <button
              className="mx-2 border-2 p-2 py-5 neuphormism-b-btn"
              onClick={() => downloadUserData()}
            >
              Download
            </button>
          </div>
        </div>
        <h2 className="text-md font-bold mb-2 mt-5 ">Platform User Data</h2>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col w-1/2">
            <h2 className="text-[10pt] py-3  w-1/2 whitespace-nowrap">
              Delete all songs
            </h2>
            <h5 className="text-[8pt]  ">
              This will delete all songs from your account
            </h5>
          </div>
          <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
            <button
              className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold"
              onClick={() => handleDelete()}
            >
              Delete
            </button>
          </div>
        </div>
        <h2 className="text-md font-bold mb-2 mt-5 ">User Account</h2>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col w-1/2">
            <h2 className="text-[10pt] py-3  w-1/2 whitespace-nowrap">
              Delete user account
            </h2>
            <h5 className="text-[8pt]   ">
              This will delete all data from user account contained on the
              platform; this cannot be undone
            </h5>
          </div>
          <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
            {/* Abre o modal para o usuário digitar a senha e confirmar a exclusão */}
            <button
              className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold"
              onClick={() => handleDeleteAccountClick()}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
