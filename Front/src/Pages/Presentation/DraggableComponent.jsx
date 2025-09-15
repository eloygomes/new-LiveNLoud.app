// /* eslint-disable react/prop-types */

// import Paper from "@mui/material/Paper";
// import Draggable from "react-draggable";

// const DraggableComponent = ({ children, toolBoxBtnStatus, ...props }) => {
//   return (
//     <Draggable {...props}>
//       <Paper
//         style={{
//           cursor: "move",
//           display: "inline-block",
//           position: toolBoxBtnStatus ? "fixed" : "absolute", // Use valid position values
//           right: "0px",
//           bottom: "0px",
//         }}
//       >
//         {children}
//       </Paper>
//     </Draggable>
//   );
// };

// export default DraggableComponent;

// DraggableComponent.jsx
import { useRef } from "react";
import Draggable from "react-draggable";

/* eslint-disable react/prop-types */
export default function DraggableComponent({
  children,
  handle = ".drag-handle", // classe do elemento que será a "alça" de arrasto
  defaultPosition = { x: 0, y: 0 },
  ...rest
}) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle={handle}
      defaultPosition={defaultPosition}
      {...rest}
    >
      {/* IMPORTANTE: o ref PRECISA estar no nó real que se move */}
      <div ref={nodeRef}>{children}</div>
    </Draggable>
  );
}
