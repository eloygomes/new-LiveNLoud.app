import { useEffect, useState } from "react";
import { requestData } from "../../Tools/Controllers";
import { Link } from "react-router-dom";

function DashList2Items() {
  const [data, setData] = useState([]);

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
        const result = await requestData();
        const parsedResult = JSON.parse(result);

        // Verificar se o resultado é um array e definir o estado diretamente
        if (Array.isArray(parsedResult)) {
          setData(parsedResult);
        } else {
          console.error("Unexpected data structure:", parsedResult);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {data.map((item, index) => (
        <div key={index} className="relative group hover:bg-gray-300">
          <Link
            to={`/editsong/${item.artist.replace(
              /\s+/g,
              "-"
            )}/${item.song.replace(/\s+/g, "-")}`}
            className="absolute inset-0 z-10"
            onClick={() => {
              localStorage.setItem("song", item.song);
              localStorage.setItem("artist", item.artist);
            }}
          />
          <div className="flex flex-row justify-around p-3 border-b-[1px] border-gray-400 cursor-pointer hover:bg-gray-200 z-0">
            <div className="w-[10%] text-center px-5">{item.id}</div>
            <div
              className="w-full px-5 overflow-hidden text-ellipsis whitespace-nowrap"
              title={item.song}
            >
              {item.song}
            </div>
            <div
              className="w-full pr-5 px-5 overflow-hidden text-ellipsis whitespace-nowrap"
              title={item.artist}
            >
              {item.artist}
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
            <ul className="w-full text-center px-5 flex flex-row justify-between space-x-2 z-20">
              {instrumentLabels.map((instrument) => (
                <li key={instrument.key} className="list-none">
                  <a
                    href={
                      item.instruments[instrument.key] && item[instrument.key]
                        ? `/presentation/${item.id}`
                        : "#"
                    }
                    className={`${
                      item.instruments[instrument.key]
                        ? "text-gray-700 hover:text-gray-900 hover:font-bold"
                        : "text-gray-400"
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
