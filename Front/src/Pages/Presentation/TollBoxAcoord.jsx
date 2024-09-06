// /* eslint-disable react/jsx-key */
// import Accordion from "@mui/material/Accordion";

// import AccordionSummary from "@mui/material/AccordionSummary";
// import AccordionDetails from "@mui/material/AccordionDetails";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// import FloatingBtns from "./FloatingBtns";
// import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";
// import ToolBoxYT from "./ToolBoxYT";

// export default function TollBoxAcoord({
//   embedLinks,
//   setLinktoplay,
//   setVideoModalStatus,
// }) {
//   // console.log(embedLinks);
//   const handlePlayClick = (url) => {
//     console.log("setLinktoplay", url);
//     setLinktoplay(url); // Atualiza o link do vídeo para ser reproduzido
//     setVideoModalStatus(true);
//   };
//   return (
//     <div>
//       {/* <ToolBoxYT embedLinks={embedLinks} /> */}
//       <Accordion>
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel1-content"
//           id="panel1-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Instruments
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <ul className="mb-5">
//             <li className="hover:font-semibold flex flex-row">
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 G1
//               </button>
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 G2
//               </button>
//             </li>
//             <li className="hover:font-semibold flex flex-row">
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 B
//               </button>
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 K
//               </button>
//             </li>
//             <li className="hover:font-semibold flex flex-row">
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 D
//               </button>
//               <button
//                 type="button"
//                 className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
//               >
//                 V
//               </button>
//             </li>
//           </ul>
//         </AccordionDetails>
//       </Accordion>
//       {/* <Accordion defaultExpanded className="my-2"> */}
//       <Accordion className="my-2">
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel2-content"
//           id="panel2-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Embed link
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <ul className="mb-5">
//             {embedLinks.map((link, index) => (
//               <li key={index} className="hover:font-semibold flex flex-row">
//                 <button
//                   type="button"
//                   className="neuphormism-b-se w-full p-2 m-2 text-sm"
//                   onClick={() => handlePlayClick(link)}
//                 >
//                   watch {index + 1}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </AccordionDetails>
//       </Accordion>
//       <Accordion className="my-2">
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel2-content"
//           id="panel2-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Navegation
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <ul className="mb-5">
//             <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
//               <a href="#">intro</a>
//             </li>
//             <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
//               <a href="#">verse</a>
//             </li>
//             <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
//               <a href="#">chorus</a>
//             </li>
//             <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
//               <a href="#">bridge</a>
//             </li>
//             <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
//               <a href="#">chorus</a>
//             </li>
//           </ul>
//         </AccordionDetails>
//       </Accordion>

//       <Accordion className="my-2">
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel3-content"
//           id="panel3-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Highlight
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <ul className="m-2">
//             <li className="hover:font-semibold">
//               <button type="button" className="neuphormism-b-se w-full my-2 ">
//                 notes
//               </button>
//             </li>
//             <li className="hover:font-semibold">
//               <button type="button" className="neuphormism-b-se w-full my-2">
//                 lyrics
//               </button>
//             </li>
//           </ul>
//         </AccordionDetails>
//       </Accordion>
//       <Accordion className="my-2">
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel3-content"
//           id="panel3-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Tools
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <ul className="my-5">
//             <li className="hover:font-semibold">
//               <div className="p-10  rounded-md mb-2 neuphormism-b"></div>
//             </li>
//             <li className="hover:font-semibold">
//               <button type="button" className="neuphormism-b-se w-full my-2 ">
//                 tuner
//               </button>
//             </li>
//             <li className="hover:font-semibold">
//               <button type="button" className="neuphormism-b-se w-full my-2">
//                 metronome
//               </button>
//             </li>
//             <li className="hover:font-semibold">
//               <button type="button" className="neuphormism-b-se w-full my-2">
//                 chord library
//               </button>
//             </li>
//           </ul>
//         </AccordionDetails>
//       </Accordion>
//       <Accordion className="my-2">
//         <AccordionSummary
//           expandIcon={<ExpandMoreIcon />}
//           aria-controls="panel3-content"
//           id="panel3-header"
//           className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
//         >
//           Scrolling
//         </AccordionSummary>
//         <AccordionDetails className="neuphormism-b text-sm font-semibold">
//           <div className="my-5">
//             <div className="flex flex-row h-44">
//               <div className="border-b-2 border-gray-300 w-full mb-36">
//                 <div className="flex flex-row text-sm font-semibold py-2">
//                   SCROLLING
//                 </div>
//               </div>
//               <FloatingBtns />
//               <FloatingBtnsAutoScroll />
//             </div>
//           </div>
//         </AccordionDetails>
//       </Accordion>
//     </div>
//   );
// }

/* eslint-disable react/jsx-key */
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import FloatingBtns from "./FloatingBtns";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";

export default function TollBoxAcoord({
  embedLinks,
  setLinktoplay,
  setVideoModalStatus,
}) {
  const handlePlayClick = (url) => {
    setLinktoplay(url); // Atualiza o link do vídeo para ser reproduzido
    setVideoModalStatus(true); // Abre o modal do player
  };

  return (
    <div>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Instruments
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                G1
              </button>
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                G2
              </button>
            </li>
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                B
              </button>
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                K
              </button>
            </li>
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                D
              </button>
              <button
                type="button"
                className="neuphormism-b-se w-1/2 p-2 m-2 text-sm"
              >
                V
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion className="my-2">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Embed link
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            {embedLinks.map((link, index) => (
              <li key={index} className="hover:font-semibold flex flex-row">
                <button
                  type="button"
                  className="neuphormism-b-se w-full p-2 m-2 text-sm"
                  onClick={() => handlePlayClick(link)}
                >
                  watch {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion className="my-2">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Navegation
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">intro</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">verse</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">bridge</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion className="my-2">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4-content"
          id="panel4-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Highlight
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="m-2">
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                notes
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                lyrics
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion className="my-2">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel5-content"
          id="panel5-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Tools
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="my-5">
            <li className="hover:font-semibold">
              <div className="p-10 rounded-md mb-2 neuphormism-b"></div>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                tuner
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                metronome
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                chord library
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion className="my-2">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel6-content"
          id="panel6-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Scrolling
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <div className="my-5">
            <div className="flex flex-row h-44">
              <div className="border-b-2 border-gray-300 w-full mb-36">
                <div className="flex flex-row text-sm font-semibold py-2">
                  SCROLLING
                </div>
              </div>
              <FloatingBtns />
              <FloatingBtnsAutoScroll />
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
