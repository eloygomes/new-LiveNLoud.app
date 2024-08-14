/* eslint-disable react/prop-types */

import DraggableComponent from "./DraggableComponent";
import TollBoxAcoord from "./TollBoxAcoord";

function ToolBox({
  toolBoxBtnStatus,
  setToolBoxBtnStatus,
  toolBoxBtnStatusChange,
}) {
  return (
    <>
      <DraggableComponent toolBoxBtnStatus={toolBoxBtnStatus}>
        <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
          <div className=" w-40  flex flex-col justify-between neuphormism-b fixed right-16 bottom-3 p-2">
            <div>
              <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between  py-2">
                <h1 className="flex flex-row text-sm font-bold">ToolBox</h1>
                <div
                  className="flex flex-row text-2xl font-semibold hover:font-black"
                  onClick={() =>
                    toolBoxBtnStatusChange(
                      toolBoxBtnStatus,
                      setToolBoxBtnStatus
                    )
                  }
                >
                  X
                </div>
              </div>
              <TollBoxAcoord />
            </div>
            <h1 className="flex flex-row text-[6pt] font-bold items-center justify-center mx-auto w-full bg-gray-500 text-white">
              Click and hold to drag
            </h1>
          </div>
        </div>
      </DraggableComponent>
    </>
  );
}

export default ToolBox;
