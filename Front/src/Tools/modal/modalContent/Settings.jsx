import { useState } from "react";

export default function Settings({ setModalOptionChoose }) {
  const [usbDeviceStatus, setUsbDeviceStatus] = useState(false);
  const [language, setLanguage] = useState("ENG");
  const [bluetoothStatus, setBluetoothStatus] = useState(false);

  return (
    <>
      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">USB Devices</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">USB Devices connection </h2>
            <h5 className="text-[8pt]   ">
              Manage USB Devices devices connected to the system
            </h5>
          </div>
        </div>
        <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
          <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                usbDeviceStatus ? "text-gray-300" : ""
              }`}
              onClick={() => setUsbDeviceStatus(!usbDeviceStatus)}
            >
              OFF
            </button>
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                usbDeviceStatus ? "" : "text-gray-300 "
              }`}
              onClick={() => setUsbDeviceStatus(!usbDeviceStatus)}
            >
              ON
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">Language</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">System Language</h2>
            <h5 className="text-[8pt]   ">
              Select lenguage for the system display
            </h5>
          </div>
        </div>
        <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
          <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                language ? "" : "text-gray-300"
              }`}
              onClick={() => setLanguage(!language)}
            >
              ENG 🇺🇸
            </button>
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn ${
                language ? "text-gray-300" : ""
              }`}
              onClick={() => setLanguage(!language)}
            >
              BRA 🇧🇷
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">Bluetooth</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">Bluetooth connection </h2>
            <h5 className="text-[8pt]   ">
              Manage bluetooth devices connected to the system
            </h5>
          </div>
        </div>
        <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
          <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                bluetoothStatus ? "text-gray-300" : ""
              }`}
              onClick={() => setBluetoothStatus(!bluetoothStatus)}
            >
              OFF
            </button>
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                bluetoothStatus ? "" : "text-gray-300 "
              }`}
              onClick={() => {
                setBluetoothStatus(!bluetoothStatus);
                setModalOptionChoose("BLUETOOTH");
              }}
            >
              ON
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
