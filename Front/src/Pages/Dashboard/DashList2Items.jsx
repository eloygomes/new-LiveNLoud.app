import FAKEDATA from "../../../FAKEDATA";
import { Link } from "react-router-dom";

/* eslint-disable react/prop-types */
function DashList2Items() {
  const instrumentLabels = [
    { key: "guitar01", label: "G1" },
    { key: "guitar02", label: "G2" },
    { key: "bass", label: "B" },
    { key: "keys", label: "K" },
    { key: "drums", label: "D" },
    { key: "voice", label: "V" },
  ];

  return (
    <div className="flex flex-col">
      {FAKEDATA.map((data, index) => (
        <div key={index} className="relative group hover:bg-gray-300">
          <Link to={`/editsong/${data.id}`} className="absolute inset-0 z-10" />
          <div className="flex flex-row justify-around p-3 border-b-[1px] border-gray-400 cursor-pointer hover:bg-gray-200 z-0">
            <div className="w-[10%] text-center px-5">{data.id}</div>
            <div className="w-full px-5">{data.Song}</div>
            <div className="w-full pr-5">{data.Artist}</div>
            <div className="w-full flex items-center justify-center">
              <div className="w-10/12 bg-gray-200 rounded-full input-neumorfismo">
                <div
                  className="bg-gray-700 rounded text-center py-1 text-[8pt] leading-none text-white"
                  style={{ width: `${data.progressBar}%` }}
                >
                  {data.progressBar}%
                </div>
              </div>
            </div>
            <ul className="w-full text-center px-5 flex flex-row justify-between space-x-2 z-20">
              {instrumentLabels.map((instrument) => (
                <li key={instrument.key} className="list-none">
                  <a
                    href={
                      data.Instruments[instrument.key] && data[instrument.key]
                        ? data[instrument.key].url
                        : ""
                    }
                    className={`${
                      data.Instruments[instrument.key]
                        ? "text-gray-700 hover:text-gray-900 hover:font-bold"
                        : "text-gray-400 hover:text-gray-900 hover:font-bold"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {instrument.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <div className="border-b border-gray-300"></div>
    </div>
  );
}

export default DashList2Items;
