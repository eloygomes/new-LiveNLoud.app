/* eslint-disable react/prop-types */

import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

export default function ChordInput({
  values = [],
  inputLabel,
  setSelectedRoot,
  setSelectedQuality,
  setSelectedTension,
  setSelectedBass,
}) {
  // Default value is an empty array

  const handleChange = (event) => {
    if (inputLabel === "Root") {
      setSelectedRoot(event.target.value);
    }
    if (inputLabel === "Quality") {
      setSelectedQuality(event.target.value);
    }
    if (inputLabel === "Tension") {
      setSelectedTension(event.target.value);
    }
    if (inputLabel === "Bass") {
      setSelectedBass(event.target.value);
    }
  };

  return (
    <Box sx={{ minWidth: 120, marginRight: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">{inputLabel}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          onChange={handleChange}
        >
          {values.map((note, index) => (
            <MenuItem key={index} value={note}>
              {note}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
