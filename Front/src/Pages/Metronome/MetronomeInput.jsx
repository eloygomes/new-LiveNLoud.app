/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";

export default function MetronomeInput({
  values = [],
  inputLabel,
  value,
  onChange,
}) {
  // Definindo o mínimo e máximo com base no array de valores
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Considerando que os valores estão uniformemente espaçados
  const step = values[1] - values[0];

  return (
    <Box sx={{ width: 300, marginRight: 2 }}>
      <Typography id="bpm-slider" gutterBottom>
        {inputLabel}
      </Typography>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, newValue) =>
          // Simulando um evento, para manter a compatibilidade com o onChange do componente pai
          onChange({ target: { value: newValue } })
        }
        valueLabelDisplay="auto"
        aria-labelledby="bpm-slider"
        sx={{
          color: "#DAA520", // Cor principal do Slider (afeta o thumb e a track)
          "& .MuiSlider-thumb": {
            backgroundColor: "#FFFFFF", // Cor do thumb
          },
          "& .MuiSlider-track": {
            backgroundColor: "#DAA520", // Cor da track (barra que indica o progresso)
          },
          "& .MuiSlider-rail": {
            opacity: 0.5, // Transparência da rail (barra de fundo)
            backgroundColor: "#BDBDBD", // Cor da rail
          },
        }}
      />
    </Box>
  );
}
