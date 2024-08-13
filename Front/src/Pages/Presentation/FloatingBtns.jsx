import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import UpIcon from "@mui/icons-material/KeyboardArrowUp";
import DownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function FloatingBtns() {
  const scrollPage = (direction) => {
    const pageHeight = window.innerHeight * 0.9; // 90% da altura da página
    const currentScrollPosition = window.scrollY;
    const newScrollPosition =
      direction === "up"
        ? currentScrollPosition - pageHeight
        : currentScrollPosition + pageHeight;

    window.scrollTo({
      top: newScrollPosition,
      behavior: "smooth",
    });
  };

  return (
    <Box
      // className="fixed bottom-0 right-14 p-4"
      className="relative bottom-0 right-14 p-4 pt-11"
      sx={{ "& > :not(style)": { m: 1 } }}
    >
      <div className="flex flex-col">
        <div className="m-1">
          <Fab
            className="m-5"
            color="default"
            aria-label="up"
            onClick={() => scrollPage("up")}
          >
            <UpIcon />
          </Fab>
        </div>
        <div className="m-1">
          <Fab
            className="m-5"
            color="default"
            aria-label="down"
            onClick={() => scrollPage("down")}
          >
            <DownIcon />
          </Fab>
        </div>
      </div>
    </Box>
  );
}
