import UserRegistrationForm from "./UserRegistrationForm";
import musician from "../../assets/musician.jpg";

function UserRegistration() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">User Registration</h1>
            <h4 className="ml-auto mt-auto text-sm">
              &ldquo;Cara, crachá time&ldquo;
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="w-2/3 bg-green-300 flex items-center justify-center">
              <img src={musician} className="h-full object-cover" alt="" />
            </div>
            <div className="w-1/3 flex flex-col justify-between mb-20 ">
              <UserRegistrationForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegistration;
