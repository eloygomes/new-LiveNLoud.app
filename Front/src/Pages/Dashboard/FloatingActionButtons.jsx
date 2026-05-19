import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import NewSongStartChoice from "../../Components/NewSongStartChoice";

export default function FloatingActionButtons() {
  const navigate = useNavigate();
  const [choiceOpen, setChoiceOpen] = useState(false);
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;

  // ⌨️  Atalho: tecla “A” abre a rota /newsong
  useEffect(() => {
    const onKeyDown = (e) => {
      const isTyping =
        e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      if (!isTyping && e.key.toLowerCase() === "a") {
        e.preventDefault(); // evita rolagem ou outros efeitos
        setChoiceOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  if (isTouchLayout) {
    return null;
  }

  return (
    <Box
      className="fixed bottom-[86px] right-4 z-50 p-0 md:bottom-0 md:right-0 md:p-4"
      sx={{ "& > :not(style)": { m: 1 } }}
    >
      <button
        type="button"
        className="rounded-full"
        onClick={() => setChoiceOpen(true)}
        aria-label="Choose new song type"
      >
        <Fab
          component="span"
          color="primary"
          aria-label="add"
          style={{ backgroundColor: "#DAA520" }}
        >
          <AddIcon />
        </Fab>
      </button>
      <NewSongStartChoice
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onChooseLink={() => {
          setChoiceOpen(false);
          navigate("/newsong");
        }}
      />
    </Box>
  );
}
