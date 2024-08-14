import userPerfil from "../../assets/userPerfil.jpg";
import UserProfileAvatar from "./UserProfileAvatar";

function UserProfile() {
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
              <div className="left-column ">
                <div className="flex items-center space-x-2">
                  <UserProfileAvatar src={userPerfil} size={40} />
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">User Data</h2>
              <div className="neuphormism-b my-2 p-2">user name</div>
              <div className="neuphormism-b my-2 p-2">user email</div>
              <div className="neuphormism-b my-2 p-2">password</div>
              <div className="flex flex-row justify-between">
                <div className="neuphormism-b my-5 p-2  flex-1">
                  user register date
                </div>
                <div className="neuphormism-b my-5 p-2 flex-1 ml-5">
                  user last login date
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">User Reports</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-md p-2">Catalog added</h2>
                <h2 className="text-md p-2">45 songs</h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-md p-2">avarege progression</h2>
                <h2 className="text-md p-2">30%</h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-md p-2">Instruments</h2>
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

              <h2 className="text-md font-bold my-2 p-2">Notifications</h2>
            </div>
            <div className="right-column w-1/2 p-5">user settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
