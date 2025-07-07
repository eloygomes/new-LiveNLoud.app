/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCallback } from "react";
import axios from "axios";

/**
 * NewSongInputLinkBox
 * ----------------------------------------------------------------------------
 * Props:
 * - instrumentName, instrument, setInstrument
 * - progress, setProgress
 * - artistName, setArtistName
 * - songName, setSongName
 * - gettingSongData
 * - setShowSnackBar, setSnackbarMessage
 * - useLinkExtraction
 * - setSongScrapado, setArtistScrapado
 * - cifraExiste, setCifraExiste
 * - cifraFROMDB, setCifraFROMDB
 *
 * Fluxo:
 * 1) O usuário digita/ajusta e, ao sair do input ou mover o slider,
 *    chama handleSubmit().
 * 2) Validamos URL e email.
 * 3) Extraímos artista/música (se configurado).
 * 4) Checamos existência via /generalCifra.
 * 5) Se não existir, chamamos /scrape e atualizamos os dados do pai.
 */

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,

  artistName,
  setArtistName,
  songName,
  setSongName,

  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,

  useLinkExtraction = false,

  setSongScrapado,
  setArtistScrapado,
  cifraExiste,
  setCifraExiste,

  cifraFROMDB,
  setCifraFROMDB,
}) {
  // __ handleSubmit: principal lógica de validação, extração, check e scrape
  const handleSubmit = useCallback(async () => {
    // 1) Validações básicas
    if (!instrument?.trim()) {
      setSnackbarMessage({ title: "Error", message: "Insira uma URL válida." });
      return;
    }
    const email = localStorage.getItem("userEmail");

    if (!email) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "Email do usuário é obrigatório.",
      });
      return;
    }

    // 2) Extrair artista/música do link, se necessário
    let finalArtist = artistName;
    let finalSong = songName;
    if (useLinkExtraction && (!artistName || !songName)) {
      const parts = instrument.split("/").filter(Boolean);
      console.log("Parts extracted from URL:", parts);
      if (parts.length < 2) {
        setSnackbarMessage({
          title: "Error",
          message: "URL incompleta para extração.",
        });
        return;
      }
      finalArtist = parts.at(-2);
      finalSong = parts.at(-1);
      if (!finalArtist || !finalSong) {
        setSnackbarMessage({
          title: "Error",
          message: "Falha ao extrair artista e música.",
        });
        return;
      }
      setArtistName(finalArtist);
      setSongName(finalSong);
      // opcional: notificar pai
      setArtistScrapado?.(finalArtist);
      setSongScrapado?.(finalSong);
    }

    // 3) Checar se já existe no banco
    try {
      const res = await axios.post(
        "https://api.live.eloygomes.com.br/api/generalCifra",
        { instrument: instrumentName, link: instrument }
      );
      // se 200 → existe
      setCifraExiste?.(true);
      setCifraFROMDB?.(res.data);
      localStorage.setItem("cifraFROMDB", JSON.stringify(res.data));
      localStorage.setItem("fromWHERE", "DB");
      setSnackbarMessage({
        title: "Info",
        message: "Essa cifra já está na sua biblioteca.",
      });
      return;
    } catch (err) {
      // 404 = não existe; outros → erro
      if (!(err.response && err.response.status === 404)) {
        console.error("[generalCifra]", err);
        setSnackbarMessage({
          title: "Error",
          message: "Erro ao verificar cifra no servidor.",
        });
        return;
      }
    }

    // 4) Se não existe, pedir scrape
    try {
      await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
        artist: finalArtist,
        song: finalSong,
        email,
        instrument: instrumentName,
        instrument_progressbar: progress,
        link: instrument,
      });
      await gettingSongData();
      localStorage.setItem("fromWHERE", "URL");
      setCifraExiste?.(false);
      setSnackbarMessage({
        title: "Success",
        message: "Cifra adicionada com sucesso!",
      });
    } catch (err) {
      console.error("[scrape]", err);
      setSnackbarMessage({
        title: "Error",
        message:
          err.response?.data?.message ||
          "Ocorreu um erro ao processar a requisição.",
      });
    }
  }, [
    instrument,
    instrumentName,
    artistName,
    songName,
    useLinkExtraction,
    progress,
    gettingSongData,
    setArtistName,
    setSongName,
    setShowSnackBar,
    setSnackbarMessage,
    setArtistScrapado,
    setSongScrapado,
    setCifraExiste,
    setCifraFROMDB,
  ]);

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      {/* Header */}
      <div className="flex justify-between">
        <span className="text-sm font-bold">
          {instrumentName[0].toUpperCase() + instrumentName.slice(1)}
        </span>
        <span
          className={`text-sm ${
            instrument ? "text-green-500" : "text-red-500"
          }`}
        >
          {instrument ? "Online" : "Offline"}
        </span>
      </div>

      {/* Link input */}
      <input
        type="text"
        placeholder="Insert your link here"
        className="w-full p-1 border border-gray-300 rounded-sm text-sm h-6 mt-2"
        value={instrument}
        onChange={(e) => {
          setInstrument(e.target.value);
          setShowSnackBar(true);
          setSnackbarMessage({
            title: "Load",
            message: "Carregando dados...",
          });
        }}
        onBlur={handleSubmit}
      />

      {/* Slider progress */}
      <div className="flex items-center mt-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            setProgress(Number(e.target.value));
            handleSubmit();
            setShowSnackBar(true);
            setSnackbarMessage({
              title: "Load",
              message: "Carregando dados...",
            });
          }}
          className="flex-1"
        />
        <div className="w-14 text-right text-sm">{progress}%</div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
