import { useState } from "react";

export default function Logs() {
  const [data, setData] = useState([]);
  return (
    <>
      <div>
        <div className="flex flex-row justify-between">
          <div className="text-sm flex flex-col">
            <div className=" mt-2 pt-2 pl-2">Added in</div>
            <div className="flex flex-row justify-between py-3">
              <div className=" text-md  pb-2 pl-2">
                {data[0]?.addedIn || "N/A"}
              </div>
            </div>
          </div>

          <div className="text-sm flex flex-col">
            <div className="mt-2 pt-2 pl-2 text-right">Last time played</div>
            <div className="flex flex-row justify-end py-3">
              <div className="text-md pb-2 pl-2">
                {(() => {
                  if (!data || data.length === 0) return "N/A";

                  const instrumentNames = [
                    "guitar01",
                    "guitar02",
                    "bass",
                    "keys",
                    "drums",
                    "voice",
                  ];

                  const allLastPlayDates = [];

                  data.forEach((entry) => {
                    instrumentNames.forEach((instrument) => {
                      let lastPlay = entry[instrument]?.lastPlay;
                      if (lastPlay) {
                        if (Array.isArray(lastPlay)) {
                          // lastPlay é um array
                          lastPlay.forEach((lp) => {
                            let date;
                            if (
                              typeof lp === "string" ||
                              typeof lp === "number" ||
                              lp instanceof Date
                            ) {
                              date = new Date(lp);
                            } else if (lp && lp["$date"]) {
                              date = new Date(lp["$date"]);
                            }
                            if (date && !isNaN(date)) {
                              allLastPlayDates.push(date);
                            }
                          });
                        } else {
                          // lastPlay é um único valor
                          let date;
                          if (
                            typeof lastPlay === "string" ||
                            typeof lastPlay === "number" ||
                            lastPlay instanceof Date
                          ) {
                            date = new Date(lastPlay);
                          } else if (lastPlay && lastPlay["$date"]) {
                            date = new Date(lastPlay["$date"]);
                          }
                          if (date && !isNaN(date)) {
                            allLastPlayDates.push(date);
                          }
                        }
                      }
                    });
                  });

                  if (allLastPlayDates.length === 0) {
                    return "N/A";
                  }

                  const mostRecentDate = new Date(
                    Math.max(...allLastPlayDates.map((date) => date.getTime()))
                  );

                  return mostRecentDate.toLocaleString();
                })()}
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-md font-bold my-2 p-2">Progression</h2>
        <div className="flex flex-row justify-between">
          <h2 className="text-md p-2">average progression</h2>
          <h2 className="text-md p-2">{data[0]?.averageProgression || "0%"}</h2>
        </div>
      </div>
      <div>
        <div className="flex flex-row justify-between">
          <h2 className="text-md font-bold my-2 px-2 pt-5">
            Songs by instruments
          </h2>
        </div>

        <div className="flex flex-row justify-between">
          <h2 className="text-sm p-2">Guitar 01</h2>
          <h2 className="text-sm p-2">
            {data[0]?.songsByInstrument?.guitar01 || "0"} songs
          </h2>
        </div>
      </div>
    </>
  );
}
