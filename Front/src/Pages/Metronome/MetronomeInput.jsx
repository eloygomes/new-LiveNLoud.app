// /* eslint-disable react/prop-types */
// import * as React from "react";
// import Box from "@mui/material/Box";
// import InputLabel from "@mui/material/InputLabel";
// import MenuItem from "@mui/material/MenuItem";
// import FormControl from "@mui/material/FormControl";
// import Select from "@mui/material/Select";

// export default function MetronomeInput({ values = [], inputLabel }) {
//   // Default value is an empty array
//   const [age, setAge] = React.useState("");

//   const handleChange = (event) => {
//     setAge(event.target.value);
//   };

//   return (
//     <Box sx={{ minWidth: 120, marginRight: 2 }}>
//       <FormControl fullWidth>
//         <InputLabel id="demo-simple-select-label">{inputLabel}</InputLabel>
//         <Select
//           labelId="demo-simple-select-label"
//           id="demo-simple-select"
//           value={age}
//           label="Age"
//           onChange={handleChange}
//         >
//           {values.map((note, index) => (
//             <MenuItem key={index} value={note}>
//               {note}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//     </Box>
//   );
// }

/* eslint-disable react/prop-types */

import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

export default function MetronomeInput({
  values = [],
  inputLabel,
  value,
  onChange,
}) {
  return (
    <Box sx={{ minWidth: 120, marginRight: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="bpm-select-label">{inputLabel}</InputLabel>
        <Select
          labelId="bpm-select-label"
          id="bpm-select"
          value={value}
          label={inputLabel}
          onChange={onChange}
        >
          {values.map((bpmValue, index) => (
            <MenuItem key={index} value={bpmValue}>
              {bpmValue}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
