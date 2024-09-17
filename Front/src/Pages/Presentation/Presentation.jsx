import { useEffect, useState } from "react";

// Gear Icon
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";
import { allDataFromOneSong } from "../../Tools/Controllers";

import { processSongCifra } from "./ProcessSongCifra";

const toolBoxBtnStatusChange = (status, setStatus) => {
  setStatus(!status);
  // console.log(status);
};

function Presentation() {
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
  const [artistFromURL, setArtistFromURL] = useState("");
  const [songFromURL, setSongFromURL] = useState("");
  const [songDataFetched, setSongDataFetched] = useState();
  const [instrumentSelected, setInstrumentSelected] = useState("keys");
  const [embedLinks, setEmbedLinks] = useState([]);

  const [songCifraData, setSongCifraData] = useState("Loading...");

  const handleDataFromAPI = (data, instrumentSelected) => {
    // Verificando se o objeto 'data' existe e se contém o instrumento selecionado
    if (data && data[instrumentSelected]) {
      // console.log(data[instrumentSelected]);
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
        const urlInstrument = partes[partes.length - 1]; // 'keys'
        setInstrumentSelected(urlInstrument);

        const urlSong = partes[partes.length - 2]; // 'Stand%20By%20Me'
        const urlSongwithSpace = decodeURIComponent(urlSong); // Decodifica a URL
        // console.log("urlSongwithSpace", urlSongwithSpace);
        setSongFromURL(urlSongwithSpace);

        const urlBand = partes[partes.length - 3]; // 'Legi%C3%A3o'
        const urlBandwithSpace = decodeURIComponent(urlBand); // Decodifica a URL
        // console.log("urlBandwithSpace", urlBandwithSpace);
        setArtistFromURL(urlBandwithSpace);

        const dataFromSong = await allDataFromOneSong(
          urlBandwithSpace,
          urlSongwithSpace
        );
        const dataFromSongparsedResult = JSON.parse(dataFromSong);
        // console.log(dataFromSongparsedResult);
        setSongDataFetched(dataFromSongparsedResult);
        setEmbedLinks(dataFromSongparsedResult.embedVideos);

        // Chamando a função handleDataFromAPI com os dados e o instrumento selecionado
        handleDataFromAPI(dataFromSongparsedResult, urlInstrument);
      } catch (error) {
        console.error("Error fetching song data:", error);
      }
    };

    fetchData(); // Execute the async function
  }, []);

  // console.log(songDataFetched.embedVideos);

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
          <div className="flex flex-col neuphormism-b p-5">
            {htmlBlocks.map((item, index) => (
              <div
                key={index}
                className="my-5"
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
