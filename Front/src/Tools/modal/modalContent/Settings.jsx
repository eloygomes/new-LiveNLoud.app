import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function Settings({ setModalOptionChoose }) {
  const { language, languages, setLanguage, t } = useLanguage();
  const [usbDeviceStatus, setUsbDeviceStatus] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState(false);

  return (
    <>
      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">{t("settings.usbDevices")}</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">{t("settings.usbConnection")}</h2>
            <h5 className="text-[8pt]   ">
              {t("settings.usbDescription")}
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
              {t("settings.off")}
            </button>
            <button
              className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                usbDeviceStatus ? "" : "text-gray-300 "
              }`}
              onClick={() => setUsbDeviceStatus(!usbDeviceStatus)}
            >
              {t("settings.on")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">{t("settings.language")}</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">{t("settings.systemLanguage")}</h2>
            <h5 className="text-[8pt]   ">
              {t("settings.languageDescription")}
            </h5>
          </div>
        </div>
        <div className="flex flex-row justify-end text-sm p-5  truncate flex-1 text-right">
          <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`mx-2 border-2 p-2 neuphormism-b-btn min-w-16 ${
                  language === item.code ? "" : "text-gray-300"
                }`}
                onClick={() => setLanguage(item.code)}
              >
                {item.shortLabel} {item.flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between neuphormism-b mt-5 ">
        <div className="flex flex-col p-5">
          <h2 className="text-md font-bold mb-2 ">{t("settings.bluetooth")}</h2>
          <div className="flex flex-col ">
            <h2 className="text-[10pt] ">{t("settings.bluetoothConnection")}</h2>
            <h5 className="text-[8pt]   ">
              {t("settings.bluetoothDescription")}
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
              {t("settings.off")}
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
              {t("settings.on")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
