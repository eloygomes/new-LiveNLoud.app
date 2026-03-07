import { useEffect, useState, useMemo, useCallback } from "react";
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";
import {
  allDataFromOneSong,
  updateLastPlayed,
  updateSongEntry,
} from "../../Tools/Controllers";
import { useRef } from "react";
import SnackBar from "../../Tools/SnackBar";

import { processSongCifra } from "./ProcessSongCifra";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ChordSheetJS from "chordsheetjs";

const escapeHtml = (value = "") =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const plainTextToHtml = (text = "") =>
  text
    .split("\n")
    .map((line) => {
      if (!line.length) {
        return "<p>&nbsp;</p>";
      }
      const preservedSpaces = escapeHtml(line)
        .replace(/ /g, "&nbsp;")
        .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
      return `<p>${preservedSpaces}</p>`;
    })
    .join("");

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

  const [songCifraData, setSongCifraData] = useState("");
  const [songLyrics, setSongLyrics] = useState("");
  const [songChords, setSongChords] = useState("");
  const [songTabs, setSongTabs] = useState("");

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [draftCifra, setDraftCifra] = useState("");
  const [isSavingCifra, setIsSavingCifra] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });

  const pushSnackbarMessage = useCallback((title, message) => {
    setShowSnackBar(true);
    setSnackbarMessage({ title, message });
  }, []);

  const chordHelpers = useMemo(() => {
    const moduleRef =
      (ChordSheetJS && ChordSheetJS.ChordSheetJS) || ChordSheetJS || {};
    const ParserCtor = moduleRef.ChordProParser;
    const FormatterCtor = moduleRef.ChordProFormatter;

    return {
      parser: ParserCtor ? new ParserCtor() : null,
      formatter: FormatterCtor ? new FormatterCtor() : null,
    };
  }, []);

  const normalizeCifra = useCallback(
    (value = "") => {
      if (!value || typeof value !== "string") return "";
      try {
        if (!chordHelpers.parser || !chordHelpers.formatter) return value;
        const parsed = chordHelpers.parser.parse(value);
        return chordHelpers.formatter.format(parsed);
      } catch (error) {
        console.warn("ChordSheetJS parse/format falhou:", error);
        return value;
      }
    },
    [chordHelpers],
  );

  const normalizedSongCifra = useMemo(
    () => normalizeCifra(songCifraData),
    [songCifraData, normalizeCifra],
  );

  useEffect(() => {
    if (!isEditing) {
      setDraftCifra(normalizedSongCifra);
    }
  }, [normalizedSongCifra, isEditing]);

  // Conteúdo que deve ser mostrado de acordo com a seleção do usuário
  const contentSelected = useMemo(() => {
    switch (selectContenttoShow) {
      case "tabs":
        return songTabs;
      case "chords":
        return songChords;
      case "lyrics":
        return songLyrics;
      case "full":
        return normalizedSongCifra; // Retorna a cifra completa
      default:
        return normalizedSongCifra; // mostra cifra completa no primeiro carregamento
    }
  }, [
    selectContenttoShow,
    normalizedSongCifra,
    songLyrics,
    songChords,
    songTabs,
  ]);

  const handleDataFromAPI = (data, instrumentSelected) => {
    if (data && data[instrumentSelected]) {
      setSongCifraData(data[instrumentSelected].songCifra || "");
      setSongLyrics(data[instrumentSelected].songLyrics || "");
      setSongChords(data[instrumentSelected].songChords || "");
      setSongTabs(data[instrumentSelected].songTabs || "");
      return data[instrumentSelected];
    } else {
      console.log("Instrumento não encontrado ou data é undefined");
      // zera pra evitar 'Loading...' cair no parser
      setSongCifraData("");
      setSongLyrics("");
      setSongChords("");
      setSongTabs("");
      return null;
    }
  };

  const currentInstrumentData = useMemo(() => {
    if (!songDataFetched || !instrumentSelected) return {};
    return songDataFetched[instrumentSelected] || {};
  }, [songDataFetched, instrumentSelected]);

  const startEditingCifra = () => {
    setSaveError("");
    setIsEditing(true);
    setDraftCifra(normalizedSongCifra);
  };

  const handleDiscardDraft = () => {
    setDraftCifra(normalizedSongCifra);
    setIsEditing(false);
    setSaveError("");
  };

  const [lastSaveTimestamp, setLastSaveTimestamp] = useState("");

  const handleSaveCifra = async () => {
    if (!instrumentSelected || !songDataFetched) {
      setSaveError("Sem dados da música carregados para salvar.");
      pushSnackbarMessage("Erro", "Sem dados da música carregados para salvar.");
      return;
    }
    setIsSavingCifra(true);
    setSaveError("");

    const updatedBlock = {
      ...currentInstrumentData,
      songCifra: draftCifra,
    };

    const nextSongData = {
      ...(songDataFetched || {}),
      [instrumentSelected]: updatedBlock,
      updateIn: new Date().toISOString().split("T")[0],
    };

    try {
      await updateSongEntry(nextSongData);

      setSongCifraData(draftCifra);
      setSongDataFetched((prev) => ({
        ...nextSongData,
      }));
      setIsEditing(false);
      const timestamp = new Date().toLocaleTimeString();
      setLastSaveTimestamp(timestamp);
      pushSnackbarMessage("Salvo", `Último salvamento às ${timestamp}`);
    } catch (error) {
      setSaveError("Não foi possível salvar a cifra. Tente novamente.");
      pushSnackbarMessage(
        "Erro",
        "Não foi possível salvar a cifra. Tente novamente.",
      );
      console.error("Erro ao salvar cifra:", error);
    } finally {
      setIsSavingCifra(false);
    }
  };

  const hasDraftChanges = (normalizedSongCifra || "") !== (draftCifra || "");

  // Processar o songCifraData usando o algoritmo fornecido
  // console.log("htmlBlocks", htmlBlocks);

  // const { htmlBlocks } = processSongCifra(songCifraData);
  // const { htmlBlocks } = processSongCifra(songChords);
  // const { htmlBlocks } = processSongCifra(songLyrics);
  // const { htmlBlocks } = processSongCifra(songTabs);

  // const { htmlBlocks } = processSongCifra(contentSelected);
  const isParsableString =
    typeof contentSelected === "string" &&
    contentSelected.trim() !== "" &&
    contentSelected !== "Loading...";

  let htmlBlocks = [];
  if (isParsableString) {
    try {
      htmlBlocks = processSongCifra(contentSelected).htmlBlocks || [];
    } catch (e) {
      console.warn("processSongCifra falhou, usando fallback vazio:", e);
      htmlBlocks = [];
    }
  } else {
    htmlBlocks = []; // ainda carregando ou sem conteúdo válido
  }

  // console.log("songLyrics", songLyrics);
  // console.log("songChords", songChords);
  // console.log("songTabs", songTabs);

  // console.log("htmlBlocks", htmlBlocks);
  // console.log("htmlBlocks", typeof htmlBlocks); // objeto

  // console.log("songCifraData", songCifraData);
  // console.log("songCifraData", typeof songCifraData); // string

  // console.log("htmlBlocks", htmlBlocks);

  const didPingRef = useRef(false);

  useEffect(() => {
    if (!artistFromURL || !songFromURL || !instrumentSelected) return;

    // evita chamada dupla no StrictMode (dev)
    if (didPingRef.current) return;
    didPingRef.current = true;

    updateLastPlayed(songFromURL, artistFromURL, instrumentSelected).catch(
      (e) => console.error("updateLastPlayed error:", e),
    );
  }, [artistFromURL, songFromURL, instrumentSelected]);

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
        localStorage.setItem("song", urlSongwithSpace);

        const urlBand = partes[partes.length - 3];
        const urlBandwithSpace = decodeURIComponent(urlBand);
        setArtistFromURL(urlBandwithSpace);
        localStorage.setItem("artist", urlBandwithSpace);

        const dataFromSong = await allDataFromOneSong(
          urlBandwithSpace,
          urlSongwithSpace,
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

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Placeholder.configure({
          placeholder: "Edite a cifra aqui...",
        }),
      ],
      content: plainTextToHtml(draftCifra || ""),
      editable: isEditing,
      editorProps: {
        attributes: {
          class:
            "min-h-[60vh] w-full whitespace-pre-wrap font-mono text-base leading-6 focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        setDraftCifra(editor.getText({ blockSeparator: "\n" }));
      },
    },
    [isEditing],
  );

  // Função para alternar a visibilidade das tabs
  const toggleTabsVisibility = () => {
    setHideTabs(!hideTabs);
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        <SnackBar snackbarMessage={snackbarMessage} />
      </div>
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
        isEditing={isEditing}
        isSavingCifra={isSavingCifra}
        hasDraftChanges={hasDraftChanges}
        songCifraData={songCifraData}
        handleSaveCifra={handleSaveCifra}
        handleDiscardDraft={handleDiscardDraft}
        startEditingCifra={startEditingCifra}
      />
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row justify-between my-5 neuphormism-b p-5">
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold">{songFromURL}</h1>
              <h1 className="text-4xl font-bold">{artistFromURL}</h1>
            </div>
            <div className="flex flex-row items-center gap-3">
              <div
                className="flex neuphormism-b-btn p-6"
                onClick={() =>
                  toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
                }
              >
                <FaGear className="w-8 h-8" />
              </div>
            </div>
          </div>
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <div
            className={`flex flex-col neuphormism-b p-5 ${
              hideChords ? "hide-chords" : ""
            }`}
          >
            {isEditing ? (
              editor ? (
                <EditorContent editor={editor} />
              ) : (
                <p>Carregando editor...</p>
              )
            ) : (
              htmlBlocks.map((block, index) => {
                const classMatch = block.match(/class="([^"]*)"/);
                const classes = classMatch ? classMatch[1].split(" ") : [];

                let shouldRender = true;

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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Presentation;
