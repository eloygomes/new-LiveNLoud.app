/* eslint-disable react/prop-types */
import FloatingBtns from "./FloatingBtns";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";

function ToolBox({
  toolBoxBtnStatus,
  setToolBoxBtnStatus,
  toolBoxBtnStatusChange,
}) {
  return (
    <>
      <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
        <div className=" w-40 h-[90vh] flex flex-col justify-between neuphormism-b fixed right-16 bottom-3 p-4">
          <div>
            <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between  py-2">
              <div className="flex flex-row text-sm font-bold">
                FAST NAVIGATION
              </div>
              <div
                className="flex flex-row text-2xl font-semibold hover:font-black"
                onClick={() =>
                  toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
                }
              >
                X
              </div>
            </div>
            <div className="border-b-2 border-gray-300 w-full ">
              <div className="flex flex-row text-md font-semibold py-2">
                PARTS
              </div>
              <ul>
                <li className="hover:font-semibold">
                  <a href="#">intro</a>
                </li>
                <li className="hover:font-semibold">
                  <a href="#">verse</a>
                </li>
                <li className="hover:font-semibold">
                  <a href="#">chorus</a>
                </li>
                <li className="hover:font-semibold">
                  <a href="#">bridge</a>
                </li>
                <li className="hover:font-semibold">
                  <a href="#">chorus</a>
                </li>
              </ul>
            </div>
            <div className="border-b-2 border-gray-300 w-full mb-5">
              <div className="flex flex-row text-md font-semibold py-2">
                HIGHLIGHT
              </div>
              <ul>
                <li className="hover:font-semibold">
                  <button
                    type="button"
                    className="neuphormism-b-se w-full my-2 "
                  >
                    notes
                  </button>
                </li>
                <li className="hover:font-semibold">
                  <button
                    type="button"
                    className="neuphormism-b-se w-full my-2"
                  >
                    lyrics
                  </button>
                </li>
              </ul>
            </div>
            <div className="border-b-2 border-gray-300 w-full mb-5">
              <div className="flex flex-row text-md font-semibold py-2">
                TOOLS
              </div>
              <ul>
                <li className="hover:font-semibold">
                  <button
                    type="button"
                    className="neuphormism-b-se w-full my-2 "
                  >
                    tuner
                  </button>
                </li>
                <li className="hover:font-semibold">
                  <button
                    type="button"
                    className="neuphormism-b-se w-full my-2"
                  >
                    metronome
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-row h-44">
            <div className="border-b-2 border-gray-300 w-full mb-36">
              <div className="flex flex-row text-md font-semibold py-2">
                SCROLLING
              </div>
            </div>
            <FloatingBtns />
            <FloatingBtnsAutoScroll />
          </div>
        </div>
      </div>
    </>
  );
}

export default ToolBox;
