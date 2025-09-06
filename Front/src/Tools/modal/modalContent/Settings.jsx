export default function Settings() {
  return (
    <>
      <h2 className="text-md font-bold mb-2 mt-5 ">Settings</h2>
      <div className="flex flex-row justify-between">
        <h2 className="text-sm py-5 w-1/2">Language</h2>
        <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
          <button className="mx-2 border-2 p-2 neuphormism-b-btn">
            ENG 🇺🇸
          </button>
          <button className="mx-2 border-2 p-2 neuphormism-b-btn text-gray-300">
            BRA 🇧🇷
          </button>
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <h2 className="text-sm py-5 w-1/2">USB Devices</h2>
        <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
          <button className="mx-2 border-2 p-2 neuphormism-b-btn">
            ENG 🇺🇸
          </button>
          <button className="mx-2 border-2 p-2 neuphormism-b-btn text-gray-300">
            BRA 🇧🇷
          </button>
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <h2 className="text-sm py-5 w-1/2">Bluetooth</h2>
        <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
          <button className="mx-2 border-2 p-2 neuphormism-b-btn">
            ENG 🇺🇸
          </button>
          <button className="mx-2 border-2 p-2 neuphormism-b-btn text-gray-300">
            BRA 🇧🇷
          </button>
        </div>
      </div>
    </>
  );
}
