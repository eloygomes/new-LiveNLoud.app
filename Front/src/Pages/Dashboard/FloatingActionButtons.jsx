import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { Link } from "react-router-dom";

export default function FloatingActionButtons() {
  return (
    <Box
      className="fixed bottom-0 right-0 p-4"
      sx={{ "& > :not(style)": { m: 1 } }}
    >
      <Link to="/newsong">
        <Fab
          color="primary"
          aria-label="add"
          style={{ backgroundColor: "#DAA520" }}
        >
          <AddIcon />
        </Fab>
      </Link>
    </Box>
  );
}
