import { useEffect } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { Link, useNavigate } from "react-router-dom";

export default function FloatingActionButtons() {
  const navigate = useNavigate();

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

  return (
    <Box
      className="fixed bottom-0 right-0 p-4 z-50"
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
