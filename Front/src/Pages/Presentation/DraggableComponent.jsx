/* eslint-disable react/prop-types */

import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";

const DraggableComponent = ({ children, toolBoxBtnStatus, ...props }) => {
  return (
    <Draggable {...props}>
      <Paper
        style={{
          cursor: "move",
          display: "inline-block",
          position: toolBoxBtnStatus ? "fixed" : "absolute", // Use valid position values
          right: "0px",
          bottom: "0px",
        }}
      >
        {children}
      </Paper>
    </Draggable>
  );
};

export default DraggableComponent;
