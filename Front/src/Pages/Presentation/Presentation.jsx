import { useEffect, useState, useMemo } from "react";
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";
import { allDataFromOneSong, updateLastPlayed } from "../../Tools/Controllers";

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
  const [hideChords, setHideChords] = useState(false); // Estado para controlar a visibilidade dos acordes

  const [songCifraData, setSongCifraData] = useState("Loading...");

  const [songLyrics, setSongLyrics] = useState("Loading...");
  const [songChords, setSongChords] = useState("Loading...");
  const [songTabs, setSongTabs] = useState("Loading...");

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");

  // Conteúdo que deve ser mostrado de acordo com a seleção do usuário
  const contentSelected = useMemo(() => {
    switch (selectContenttoShow) {
      case "tabs":
        return songTabs;
      case "chords":
        return songChords;
      case "lyrics":
        return songLyrics;
      default:
        return songCifraData; // mostra cifra completa no primeiro carregamento
    }
  }, [selectContenttoShow, songCifraData, songLyrics, songChords, songTabs]);

  const handleDataFromAPI = (data, instrumentSelected) => {
    if (data && data[instrumentSelected]) {
      setSongCifraData(data[instrumentSelected].songCifra);
      setSongLyrics(data[instrumentSelected].songLyrics);
      setSongChords(data[instrumentSelected].songChords);
      setSongTabs(data[instrumentSelected].songTabs);

      return data[instrumentSelected];
    } else {
      console.log("Instrumento não encontrado ou data é undefined");
      return null;
    }
  };

  // Processar o songCifraData usando o algoritmo fornecido
  // console.log("htmlBlocks", htmlBlocks);

  // const { htmlBlocks } = processSongCifra(songCifraData);
  // const { htmlBlocks } = processSongCifra(songChords);
  // const { htmlBlocks } = processSongCifra(songLyrics);
  // const { htmlBlocks } = processSongCifra(songTabs);

  const { htmlBlocks } = processSongCifra(contentSelected);

  console.log("songLyrics", songLyrics);
  console.log("songChords", songChords);
  console.log("songTabs", songTabs);

  console.log("htmlBlocks", htmlBlocks);
  // console.log("htmlBlocks", typeof htmlBlocks); // objeto

  // console.log("songCifraData", songCifraData);
  // console.log("songCifraData", typeof songCifraData); // string

  // console.log("htmlBlocks", htmlBlocks);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");

    const artistFromURL = localStorage.getItem("artist");
    const songFromURL = localStorage.getItem("song");

    // console.log("userEmail", userEmail);
    // console.log("artistFromURL", artistFromURL);
    // console.log("songFromURL", songFromURL);

    updateLastPlayed(songFromURL, artistFromURL, instrumentSelected);
  }, []);

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
        toggleTabsVisibility={toggleTabsVisibility}
        hideChords={hideChords}
        setHideChords={setHideChords}
        setSelectContenttoShow={setSelectContenttoShow}
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

          <div
            className={`flex flex-col neuphormism-b p-5 ${
              hideChords ? "hide-chords" : ""
            }`}
          >
            {htmlBlocks.map((block, index) => {
              // Extrair as classes do bloco
              const classMatch = block.match(/class="([^"]*)"/);
              const classes = classMatch ? classMatch[1].split(" ") : [];

              // Determinar se o bloco deve ser renderizado
              let shouldRender = true;

              // Se hideTabs estiver ativo e o bloco tiver as classes que queremos esconder, não renderiza
              if (
                hideTabs &&
                (classes.includes("presentation-combined-tab-chords") ||
                  classes.includes("presentation-tab") ||
                  classes.includes("presentation-tab-section"))
              ) {
                shouldRender = false;
              }

              if (shouldRender) {
                return (
                  <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: block }}
                  />
                );
              } else {
                return null;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Presentation;
