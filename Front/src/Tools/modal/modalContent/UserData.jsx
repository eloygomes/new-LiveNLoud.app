import { useState } from "react";

export default function UserData() {
  const [data, setData] = useState([]);
  return (
    <>
      <div className="flex flex-col justify-start ">
        <div className="flex flex-row justify-between neuphormism-b mt-5 ">
          <div className="flex flex-col p-5">
            <h2 className="text-md font-bold mb-2 ">User Data</h2>
            <div className="flex flex-col ">
              <h2 className="text-[10pt] ">All user data</h2>
              <h5 className="text-[8pt]   ">
                This contains all data from user that was stored by the platform
              </h5>
            </div>
          </div>
          <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
            <button
              className="mx-2 border-2 p-2 py-5 neuphormism-b-btn"
              onClick={() => downloadUserData()}
            >
              Download
            </button>
          </div>
        </div>

        <div className="flex flex-row justify-between neuphormism-b mt-5">
          <div className="flex flex-col p-5">
            <h2 className="text-md font-bold mb-2 ">Platform User Data</h2>
            <div className="flex flex-col ">
              <h2 className="text-[10pt] ">Delete all songs</h2>
              <h5 className="text-[8pt]   ">
                This will delete all songs from your account
              </h5>
            </div>
          </div>
          <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
            <button
              className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold"
              onClick={() => handleDelete()}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-row justify-between neuphormism-b mt-5">
          <div className="flex flex-col p-5">
            <h2 className="text-md font-bold mb-2 ">User Account</h2>
            <div className="flex flex-col ">
              <h2 className="text-[10pt] ">Delete user account</h2>
              <h5 className="text-[8pt]   ">
                This will delete all data from user account contained on the
                platform; this cannot be undone
              </h5>
            </div>
          </div>
          <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
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
