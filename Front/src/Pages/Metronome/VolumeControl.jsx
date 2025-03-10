/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

export default function VolumeControl({ value, onChange, isMuted, onMute }) {
  return (
    <Box
      className="neuphormism-b rounded-md w-[49%] h-[200px] "
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        borderRadius: 2,
        padding: 2,
        // backgroundColor: "#1e1e1e", // Mantendo o visual Neumorphism
      }}
    >
      <Typography id="volume-slider" gutterBottom sx={{ paddingBottom: 2 }}>
        Volume
      </Typography>
      <Box
        sx={{
          height: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Slider
          value={isMuted ? 0 : value}
          min={0}
          max={1}
          step={0.01}
          onChange={(_, newValue) => onChange({ target: { value: newValue } })}
          orientation="vertical"
          valueLabelDisplay="auto"
          aria-labelledby="volume-slider"
          sx={{
            color: "#DAA520",
            "& .MuiSlider-thumb": {
              backgroundColor: "#FFFFFF",
            },
            "& .MuiSlider-track": {
              backgroundColor: "#DAA520",
            },
            "& .MuiSlider-rail": {
              opacity: 0.5,
              backgroundColor: "#BDBDBD",
            },
          }}
        />
      </Box>
      <Button
        variant="contained"
        onClick={onMute}
        sx={{
          marginTop: 2,
          width: 3,

          backgroundColor: "#DAA520",
          "&:hover": { backgroundColor: "#B8860B" },
        }}
      >
        {isMuted ? (
          <VolumeOffIcon className="p-1" />
        ) : (
          <VolumeUpIcon className="p-1" />
        )}
      </Button>
    </Box>
  );
}
