import FloatingBtns from "./FloatingBtns";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";

// eslint-disable-next-line react/prop-types
function ToolBox({ toolBoxBtnStatus }) {
  return (
    <>
      <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
        <div className=" w-40 h-[88vh] flex flex-col justify-between neuphormism-b-se fixed right-16 bottom-3 p-4">
          <div className="border-b-2 border-gray-300 w-full ">
            <div className="flex flex-row text-2xl font-semibold">MENU</div>
          </div>
          <div className="border-b-2 border-gray-300 w-full ">
            <div className="flex flex-row text-2xl font-semibold">PARTS</div>
            <ul>
              <li>intro</li>
              <li>verse</li>
              <li>chorus</li>
              <li>bridge</li>
              <li>chorus</li>
            </ul>
          </div>

          <div className="flex flex-row">
            <FloatingBtns />
            <FloatingBtnsAutoScroll />
          </div>
        </div>
      </div>
    </>
  );
}

export default ToolBox;
