import { useEffect } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { Link, useNavigate } from "react-router-dom";

export default function FloatingActionButtons() {
  const navigate = useNavigate();
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;

  // ⌨️  Atalho: tecla “A” abre a rota /newsong
  useEffect(() => {
    const onKeyDown = (e) => {
      const isTyping =
        e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      if (!isTyping && e.key.toLowerCase() === "a") {
        e.preventDefault(); // evita rolagem ou outros efeitos
        navigate("/newsong"); // mesma ação do botão
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
