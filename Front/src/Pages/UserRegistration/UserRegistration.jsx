import UserRegistrationForm from "./UserRegistrationForm";
import musician from "../../assets/musician.jpg";

function UserRegistration() {
  return (
    <div className=" flex justify-center h-screen pt-5">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto flex flex-col">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">User Registration</h1>
            <h4 className="ml-auto mt-auto text-sm">
              &ldquo;Cara, crachá time&ldquo;
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5 h-[75vh]">
            <div className="w-1/2 flex items-center justify-center">
              <img src={musician} className=" h-[70vh] object-cover" alt="" />
            </div>
            <div className="w-1/2 flex flex-col justify-between  ">
              <div className="mx-10">
                <UserRegistrationForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegistration;
