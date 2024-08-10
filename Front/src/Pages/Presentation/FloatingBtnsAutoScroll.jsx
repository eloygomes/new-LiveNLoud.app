import { useState } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import UpIcon from "@mui/icons-material/KeyboardArrowUp";
import DownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function FloatingBtnsAutoScroll() {
  const [hoverInterval, setHoverInterval] = useState(null);

  const scrollPage = (direction, increment = 0.9) => {
    const pageHeight = window.innerHeight * increment; // Incremento com base na altura da página
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

  const startScrollOnHover = (direction) => {
    const intervalId = setInterval(() => {
      scrollPage(direction, 1 / 200); // Scroll de 1/12 da altura da página
    }, 100); // Tempo para um novo scroll (ajustável)
    setHoverInterval(intervalId);
  };

  const stopScrollOnHover = () => {
    clearInterval(hoverInterval);
    setHoverInterval(null);
  };

  return (
    <Box
      className="fixed  right-32 bottom-3 p-4"
      sx={{ "& > :not(style)": { m: 1 } }}
    >
      <div className="flex flex-col">
        <div className="m-1">
          <Fab
            className="m-5 "
            size="small"
            color="default"
            aria-label="up"
            onClick={() => scrollPage("up", 0.9)} // Scroll de 90% da altura da página ao clicar
            onMouseEnter={() => startScrollOnHover("up")}
            onMouseLeave={stopScrollOnHover}
          >
            <UpIcon />
          </Fab>
        </div>
        <div className="m-1">
          <Fab
            className="m-5"
            size="small"
            color="default"
            aria-label="down"
            onClick={() => scrollPage("down", 0.9)} // Scroll de 90% da altura da página ao clicar
            onMouseEnter={() => startScrollOnHover("down")}
            onMouseLeave={stopScrollOnHover}
          >
            <DownIcon />
          </Fab>
        </div>
      </div>
    </Box>
  );
}
