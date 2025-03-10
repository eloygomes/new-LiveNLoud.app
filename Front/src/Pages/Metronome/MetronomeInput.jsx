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
  const min = Math.min(...values);
  const max = Math.max(...values);

  const step = values[1] - values[0];

  return (
    <Box className="mr-0 " sx={{ width: 300 }}>
      <Typography id="bpm-slider" gutterBottom>
        <div className="md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-6xl">
          {inputLabel}
        </div>
      </Typography>
      <Slider
        className="my-10"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, newValue) => onChange({ target: { value: newValue } })}
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
