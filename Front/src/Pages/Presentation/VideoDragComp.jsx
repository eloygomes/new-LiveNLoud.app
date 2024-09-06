/* eslint-disable react/prop-types */

import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";

const VideoDragComp = ({ children, toolBoxBtnStatus, ...props }) => {
  return (
    <Draggable {...props}>
      <Paper
        style={{
          cursor: "move",
          // display: "inline-block",
          position: toolBoxBtnStatus ? "fixed" : "absolute", // Use valid position values
          right: "30vh",
          bottom: "10vh",
        }}
      >
        {children}
      </Paper>
    </Draggable>
  );
};

export default VideoDragComp;
