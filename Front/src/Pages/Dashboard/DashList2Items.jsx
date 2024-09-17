import { useEffect, useState } from "react";
import { requestData } from "../../Tools/Controllers";
import { Link } from "react-router-dom";

function DashList2Items() {
  const [data, setData] = useState([]);
  const [isMobile, setIsMobile] = useState("");

  const instrumentLabels = [
    { key: "guitar01", label: "G1" },
    { key: "guitar02", label: "G2" },
    { key: "bass", label: "B" },
    { key: "keys", label: "K" },
    { key: "drums", label: "D" },
    { key: "voice", label: "V" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log(localStorage.getItem("userEmail"));
        const result = await requestData(localStorage.getItem("userEmail"));
        const parsedResult = JSON.parse(result);

        if (Array.isArray(parsedResult)) {
          // Filter out items without any instruments set to true
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

  useEffect(() => {
    if (window.innerWidth <= 845) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  // console.log(data);
  // console.log(data.length);

  return (
    <>
      {data.length < 1 ? (
        <div className="text-center py-10">Nenhuma música encontrada</div>
      ) : isMobile ? (
        <div className="flex flex-col">
          {data.map((item, index) => (
            <div key={index} className="relative group hover:bg-gray-300">
              <div className="flex flex-row justify-between p-3 border-b-[1px] border-gray-400 cursor-pointer hover:bg-gray-200 z-0 text-sm">
                <Link
                  className="relative flex justify-between w-full"
                  to={`/editsong/${encodeURIComponent(
                    item.artist || ""
                  )}/${encodeURIComponent(item.song || "")}`}
                  onClick={() => {
                    localStorage.setItem("song", item.song || "");
                    localStorage.setItem("artist", item.artist || "");
                  }}
                >
                  <div className="flex flex-row justify-between w-full">
                    <div className="w-[5%] text-center px-0 ">{index + 1}</div>
                    <div
                      className="w-full px-5 overflow-hidden text-ellipsis whitespace-nowrap flex-1"
                      title={item.song || ""}
                    >
                      {item.song && item.song.length > 20
                        ? `${item.song.slice(0, 20)}...`
                        : item.song || "N/A"}
                    </div>
                    <div
                      className="w-full pr-5  overflow-hidden text-ellipsis whitespace-nowrap flex-1"
                      title={item.artist || ""}
                    >
                      {item.artist && item.artist.length > 20
                        ? `${item.artist.slice(0, 20)}...`
                        : item.artist || "N/A"}
                    </div>
                    <div className="flex items-center justify-center flex-1">
                      <div className="w-10/12 bg-gray-200 rounded-full input-neumorfismo">
                        <div
                          className="bg-gray-700 rounded text-center py-1 text-[8pt] leading-none text-white"
                          style={{ width: `${item.progressBar || 0}%` }}
                        >
                          {item.progressBar || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex flex-row w-[40%] justify-between">
                  <ul className="w-full text-center px-5 flex flex-row justify-between space-x-2 ">
                    {instrumentLabels.map((instrument) => (
                      <li key={instrument.key} className="list-none z-10">
                        <Link
                          to={
                            item.instruments && item.instruments[instrument.key]
                              ? `/presentation/${encodeURIComponent(
                                  item.artist || ""
                                )}/${encodeURIComponent(
                                  item.song || ""
                                )}/${encodeURIComponent(instrument.key)}`
                              : "#"
                          }
                          className={` z-40 ${
                            item.instruments && item.instruments[instrument.key]
                              ? "text-gray-700 hover:text-gray-900 hover:font-bold"
                              : "text-gray-400"
                          }`}
                          onClick={(e) => {
                            if (
                              !item.instruments ||
                              !item.instruments[instrument.key]
                            ) {
                              e.preventDefault();
                            }
                            e.stopPropagation();
                          }}
                        >
                          {instrument.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop
        <div className="flex flex-col">
          {data.map((item, index) => (
            <div key={index} className="relative group hover:bg-gray-300">
              <Link
                to={`/editsong/${encodeURIComponent(
                  item.artist || ""
                )}/${encodeURIComponent(item.song || "")}`}
                className="absolute inset-0 z-10"
                onClick={() => {
                  localStorage.setItem("song", item.song || "");
                  localStorage.setItem("artist", item.artist || "");
                }}
              />
              <div className="flex flex-row justify-around p-3 border-b-[1px] border-gray-400 cursor-pointer hover:bg-gray-200 z-0">
                <div className="w-[10%] text-center px-5">{index + 1}</div>
                <div
                  className="w-full px-5 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={item.song || ""}
                >
                  {item.song || "N/A"}
                </div>
                <div
                  className="w-full pr-5 px-5 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={item.artist || ""}
                >
                  {item.artist || "N/A"}
                </div>
                <div className="w-full flex items-center justify-center">
                  <div className="w-10/12 bg-gray-200 rounded-full input-neumorfismo">
                    <div
                      className="bg-gray-700 rounded text-center py-1 text-[8pt] leading-none text-white"
                      style={{ width: `${item.progressBar || 0}%` }}
                    >
                      {item.progressBar || 0}%
                    </div>
                  </div>
                </div>
                <ul className="w-full text-center px-5 flex flex-row justify-between space-x-2 ">
                  {instrumentLabels.map((instrument) => (
                    <li key={instrument.key} className="list-none z-10">
                      <Link
                        to={
                          item.instruments && item.instruments[instrument.key]
                            ? `/presentation/${encodeURIComponent(
                                item.artist || ""
                              )}/${encodeURIComponent(
                                item.song || ""
                              )}/${encodeURIComponent(instrument.key)}`
                            : "#"
                        }
                        className={`${
                          item.instruments && item.instruments[instrument.key]
                            ? "text-gray-700 hover:text-gray-900 hover:font-bold"
                            : "text-gray-400"
                        }`}
                        onClick={(e) => {
                          if (
                            !item.instruments ||
                            !item.instruments[instrument.key]
                          ) {
                            e.preventDefault();
                          }
                          e.stopPropagation();
                        }}
                      >
                        {instrument.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <div className="border-b border-gray-300"></div>
        </div>
      )}
    </>
  );
}

export default DashList2Items;
