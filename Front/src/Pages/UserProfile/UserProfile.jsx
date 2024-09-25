import userPerfil from "../../assets/userPerfil.jpg";
import UserProfileAvatar from "./UserProfileAvatar";

import { requestData } from "../../Tools/Controllers";

import { FaEdit } from "react-icons/fa";
import { useEffect, useState } from "react";

function UserProfile() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await requestData(localStorage.getItem("userEmail"));
        const parsedResult = JSON.parse(result);

        console.log(parsedResult);

        if (Array.isArray(parsedResult)) {
          // Filtra itens sem instrumentos definidos
          const filteredData = parsedResult.filter(
            (item) =>
              item.instruments &&
              Object.values(item.instruments).some((val) => val === true)
          );
          setData(filteredData);
        } else {
          console.error("Unexpected data structure:", parsedResult);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // console.log(data);

  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">User profile</h1>
            <h4 className="ml-auto mt-auto text-sm">Edit your data</h4>
          </div>
          <div className="flex flex-row neuphormism-b p-5">
            <div className="flex flex-col justify-between w-1/2 p-5">
              <div className="flex flex-row">
                <div className="flex-1">
                  <UserProfileAvatar src={userPerfil} size={200} />
                </div>
                <div className="flex flex-col justify-center mt-10 flex-1">
                  <button className="neuphormism-b-btn mx-6 p-2">Upload</button>
                  <p className="text-[10px] p-6">
                    Click to upload! The avatar imagens needs to be in a valid
                    format like JPG, JPEG, GIF and has max of 500x500px
                  </p>
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">User Data</h2>
              <div className="flex flex-col">
                <div className="text-sm mt-2 pt-2 pl-2">user name</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">Fausto Silva</div>
                  <div className="flex items-center justify-center  bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
                    <FaEdit className="text-gray-600 text-lg" />
                  </div>
                </div>
              </div>
              <div className="text-sm flex flex-col">
                <div className=" mt-2 pt-2 pl-2">user email</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">
                    fausto.silva@domingao.com.br
                  </div>
                </div>
              </div>
              <div className="text-sm flex flex-col">
                <div className=" mt-2 pt-2 pl-2">password</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">***********</div>
                  <div className=" text-md  ">
                    <div className="flex items-center justify-center  bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
                      <FaEdit className="text-gray-600 text-lg" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-between">
                <div className="text-sm flex flex-col">
                  <div className=" mt-2 pt-2 pl-2">Added in</div>
                  <div className="flex flex-row justify-between py-3">
                    <div className=" text-md  pb-2 pl-2">14/08/2024</div>
                  </div>
                </div>
                <div className="text-sm flex flex-col">
                  <div className=" mt-2 pt-2 pl-2">Last time played</div>
                  <div className="flex flex-row justify-end py-3">
                    <div className=" text-md  pb-2 pl-2">14/08/2024</div>
                  </div>
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">Progression</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-md p-2">avarege progression</h2>
                <h2 className="text-md p-2">30%</h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-md font-bold my-2 px-2 pt-5">
                  Songs by instruments
                </h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Guitar 01</h2>
                <h2 className="text-sm p-2">6 songs</h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Guitar 02</h2>
                <h2 className="text-sm p-2">3 songs</h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Bass</h2>
                <h2 className="text-sm p-2">2 songs</h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Keys</h2>
                <h2 className="text-sm p-2">5 songs</h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Drums</h2>
                <h2 className="text-sm p-2">7 songs</h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Voice</h2>
                <h2 className="text-sm p-2">1 songs</h2>
              </div>
            </div>
            <div className="flex flex-col justify-start w-1/2 p-5">
              <h2 className="text-md font-bold my-2 p-2">Logs</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-[10pt] p-2 w-1/2">
                  Catalog updated, 45 song addeded
                </h2>
                <h2 className="text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  08:30 - 19/12/2024
                </h2>
              </div>
              <div className="flex flex-row justify-between">
                <h2 className="text-[10pt] p-2">User name edited</h2>
                <h2 className="text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  08:30 - 19/12/2024
                </h2>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">user settings</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm py-5 px-2 w-1/2">Language</h2>
                <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    ENG 🇺🇸
                  </button>
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    BRA 🇧🇷{" "}
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">user data</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2">All user data</h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This contains all data from user that was storage by the
                    plataform
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    Download
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">
                plataform user data
              </h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2">All user data</h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This contains all data from user that was storage by the
                    plataform(like all songs, playlists, etc.)
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold">
                    Delete
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">user account</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2 truncate">
                    Delete user account
                  </h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This delete all data from user account contained on
                    plataform, this could not be undo
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
