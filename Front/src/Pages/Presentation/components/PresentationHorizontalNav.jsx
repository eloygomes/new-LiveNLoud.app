import { FaAnglesLeft, FaAnglesRight, FaGripLines } from "react-icons/fa6";
import DraggableComponent from "../DraggableComponent";

function PresentationHorizontalNav({
  open,
  effectiveLiveMode,
  onNavigate,
}) {
  if (!open) return null;

  return (
    <div className="presentation-horizontal-nav-dock">
      <DraggableComponent handle=".drag-handle" defaultPosition={{ x: 0, y: 0 }}>
        <div
          className={`presentation-horizontal-nav-group ${
            effectiveLiveMode ? "" : "neuphormism-b"
          }`}
          role="group"
          aria-label="Expanded layout navigation"
        >
          <div className="presentation-horizontal-nav-buttons">
            <button
              type="button"
              className={`presentation-horizontal-nav ${
                effectiveLiveMode ? "" : "neuphormism-b-btn font-black text-black"
              }`}
              onClick={() => onNavigate(-1)}
              aria-label="Navigate left through expanded cifra"
            >
              {effectiveLiveMode ? (
                <>
                  <FaAnglesLeft aria-hidden="true" />
                  <span className="sr-only">Previous columns</span>
                </>
              ) : (
                "<<"
              )}
            </button>
            <button
              type="button"
              className={`presentation-horizontal-nav ${
                effectiveLiveMode ? "" : "neuphormism-b-btn font-black text-black"
              }`}
              onClick={() => onNavigate(1)}
              aria-label="Navigate right through expanded cifra"
            >
              {effectiveLiveMode ? (
                <>
                  <FaAnglesRight aria-hidden="true" />
                  <span className="sr-only">Next columns</span>
                </>
              ) : (
                ">>"
              )}
            </button>
          </div>
          <div
            className="drag-handle presentation-horizontal-drag-handle"
            aria-label="Move navigation controls"
            title="Move navigation controls"
          >
            {effectiveLiveMode ? <FaGripLines aria-hidden="true" /> : "Click and hold to drag"}
          </div>
        </div>
      </DraggableComponent>
    </div>
  );
}

export default PresentationHorizontalNav;
