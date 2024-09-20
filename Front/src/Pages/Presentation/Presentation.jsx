// import { useEffect, useState } from "react";

// // Gear Icon
// import { FaGear } from "react-icons/fa6";
// import ToolBox from "./ToolBox";
// import { allDataFromOneSong } from "../../Tools/Controllers";

// import { processSongCifra } from "./ProcessSongCifra";

// const toolBoxBtnStatusChange = (status, setStatus) => {
//   setStatus(!status);
// };

// function Presentation() {
//   const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
//   const [artistFromURL, setArtistFromURL] = useState("");
//   const [songFromURL, setSongFromURL] = useState("");
//   const [songDataFetched, setSongDataFetched] = useState();
//   const [instrumentSelected, setInstrumentSelected] = useState("keys");
//   const [embedLinks, setEmbedLinks] = useState([]);
//   const [hideTabs, setHideTabs] = useState(false); // Novo estado para controlar a visibilidade das tabs

//   const [songCifraData, setSongCifraData] = useState("Loading...");

//   const handleDataFromAPI = (data, instrumentSelected) => {
//     if (data && data[instrumentSelected]) {
//       setSongCifraData(data[instrumentSelected].songCifra);
//       return data[instrumentSelected];
//     } else {
//       console.log("Instrumento não encontrado ou data é undefined");
//       return null;
//     }
//   };

//   // Processar o songCifraData usando o algoritmo fornecido
//   const { htmlBlocks } = processSongCifra(songCifraData);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url = window.location.href;

//         // Usando o método split() para dividir a URL pelos '/'
//         const partes = url.split("/");

//         // Capturando o último e o penúltimo valores
//         const urlInstrument = partes[partes.length - 1];
//         setInstrumentSelected(urlInstrument);

//         const urlSong = partes[partes.length - 2];
//         const urlSongwithSpace = decodeURIComponent(urlSong);
//         setSongFromURL(urlSongwithSpace);

//         const urlBand = partes[partes.length - 3];
//         const urlBandwithSpace = decodeURIComponent(urlBand);
//         setArtistFromURL(urlBandwithSpace);

//         const dataFromSong = await allDataFromOneSong(
//           urlBandwithSpace,
//           urlSongwithSpace
//         );
//         const dataFromSongparsedResult = JSON.parse(dataFromSong);
//         setSongDataFetched(dataFromSongparsedResult);
//         setEmbedLinks(dataFromSongparsedResult.embedVideos);

//         // Chamando a função handleDataFromAPI com os dados e o instrumento selecionado
//         handleDataFromAPI(dataFromSongparsedResult, urlInstrument);
//       } catch (error) {
//         console.error("Error fetching song data:", error);
//       }
//     };

//     fetchData();
//   }, []);

//   // Função para alternar a visibilidade das tabs
//   const toggleTabsVisibility = () => {
//     setHideTabs(!hideTabs);
//   };

//   return (
//     <div className="flex justify-center h-screen pt-20">
//       <ToolBox
//         toolBoxBtnStatus={toolBoxBtnStatus}
//         setToolBoxBtnStatus={setToolBoxBtnStatus}
//         toolBoxBtnStatusChange={toolBoxBtnStatusChange}
//         embedLinks={embedLinks}
//         songFromURL={songFromURL}
//         artistFromURL={artistFromURL}
//         instrumentSelected={instrumentSelected}
//         songDataFetched={songDataFetched}
//       />
//       <div className="container mx-auto">
//         <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
//           <div className="flex flex-row justify-between my-5 neuphormism-b p-5">
//             <div className="flex flex-col">
//               <h1 className="text-4xl font-bold">{songFromURL}</h1>
//               <h1 className="text-4xl font-bold">{artistFromURL}</h1>
//             </div>
//             <div
//               className="flex neuphormism-b-btn p-6"
//               onClick={() =>
//                 toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
//               }
//             >
//               <FaGear className="w-8 h-8" />
//             </div>
//           </div>
//           {/* Botão para esconder/mostrar as tabs */}
//           <button
//             onClick={toggleTabsVisibility}
//             className="mb-5 px-4 py-2 bg-blue-500 text-white rounded"
//           >
//             {hideTabs ? "Mostrar Tabs" : "Esconder Tabs"}
//           </button>
//           <div className="flex flex-col neuphormism-b p-5">
//             {htmlBlocks.map((item, index) => (
//               <div
//                 key={index}
//                 className={`my-5 ${
//                   hideTabs && item.includes('class="tab"') ? "hidden" : ""
//                 }`}
//                 dangerouslySetInnerHTML={{
//                   __html: item,
//                 }}
//               ></div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Presentation;

import { useEffect, useState } from "react";

// Gear Icon
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";
import { allDataFromOneSong } from "../../Tools/Controllers";

import { processSongCifra } from "./ProcessSongCifra";

const toolBoxBtnStatusChange = (status, setStatus) => {
  setStatus(!status);
};

function Presentation() {
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
  const [artistFromURL, setArtistFromURL] = useState("");
  const [songFromURL, setSongFromURL] = useState("");
  const [songDataFetched, setSongDataFetched] = useState();
  const [instrumentSelected, setInstrumentSelected] = useState("keys");
  const [embedLinks, setEmbedLinks] = useState([]);
  const [hideTabs, setHideTabs] = useState(false); // Estado para controlar a visibilidade das tabs
  const [hideNonTabs, setHideNonTabs] = useState(false); // Estado para controlar a visibilidade das seções que não são tabs

  const [songCifraData, setSongCifraData] = useState("Loading...");

  const handleDataFromAPI = (data, instrumentSelected) => {
    if (data && data[instrumentSelected]) {
      setSongCifraData(data[instrumentSelected].songCifra);
      return data[instrumentSelected];
    } else {
      console.log("Instrumento não encontrado ou data é undefined");
      return null;
    }
  };

  // Processar o songCifraData usando o algoritmo fornecido
  const { htmlBlocks } = processSongCifra(songCifraData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = window.location.href;

        // Usando o método split() para dividir a URL pelos '/'
        const partes = url.split("/");

        // Capturando o último e o penúltimo valores
        const urlInstrument = partes[partes.length - 1];
        setInstrumentSelected(urlInstrument);

        const urlSong = partes[partes.length - 2];
        const urlSongwithSpace = decodeURIComponent(urlSong);
        setSongFromURL(urlSongwithSpace);

        const urlBand = partes[partes.length - 3];
        const urlBandwithSpace = decodeURIComponent(urlBand);
        setArtistFromURL(urlBandwithSpace);

        const dataFromSong = await allDataFromOneSong(
          urlBandwithSpace,
          urlSongwithSpace
        );
        const dataFromSongparsedResult = JSON.parse(dataFromSong);
        setSongDataFetched(dataFromSongparsedResult);
        setEmbedLinks(dataFromSongparsedResult.embedVideos);

        // Chamando a função handleDataFromAPI com os dados e o instrumento selecionado
        handleDataFromAPI(dataFromSongparsedResult, urlInstrument);
      } catch (error) {
        console.error("Error fetching song data:", error);
      }
    };

    fetchData();
  }, []);

  // Função para alternar a visibilidade das tabs
  const toggleTabsVisibility = () => {
    setHideTabs(!hideTabs);
  };

  // Função para alternar a visibilidade das seções que não são tabs
  const toggleNonTabsVisibility = () => {
    setHideNonTabs(!hideNonTabs);
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <ToolBox
        toolBoxBtnStatus={toolBoxBtnStatus}
        setToolBoxBtnStatus={setToolBoxBtnStatus}
        toolBoxBtnStatusChange={toolBoxBtnStatusChange}
        embedLinks={embedLinks}
        songFromURL={songFromURL}
        artistFromURL={artistFromURL}
        instrumentSelected={instrumentSelected}
        songDataFetched={songDataFetched}
      />
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row justify-between my-5 neuphormism-b p-5">
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold">{songFromURL}</h1>
              <h1 className="text-4xl font-bold">{artistFromURL}</h1>
            </div>
            <div
              className="flex neuphormism-b-btn p-6"
              onClick={() =>
                toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
              }
            >
              <FaGear className="w-8 h-8" />
            </div>
          </div>
          {/* Botões para controlar a visibilidade */}
          <div className="mb-5 flex space-x-4">
            <button
              onClick={toggleTabsVisibility}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {hideTabs ? "Mostrar Tabs" : "Esconder Tabs"}
            </button>
            <button
              onClick={toggleNonTabsVisibility}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              {hideNonTabs ? "Mostrar Seções" : "Esconder Seções"}
            </button>
          </div>
          <div className="flex flex-col neuphormism-b p-5">
            {htmlBlocks.map((item, index) => (
              <div
                key={index}
                className={`my-5 ${
                  (hideTabs && item.includes('class="tab"')) ||
                  (hideNonTabs && !item.includes('class="tab"'))
                    ? "hidden"
                    : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: item,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Presentation;
