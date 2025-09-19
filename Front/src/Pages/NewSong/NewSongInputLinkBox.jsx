/* eslint-disable react/prop-types */
import { useCallback, useRef, useState } from "react";
import { checkCifraExists, scrapeCifra } from "../../Tools/Controllers";

/** Normaliza a resposta do scrape em um doc utilizável */
function normalizeScrapeDoc(scraped, instrumentName) {
  if (!scraped) return null;
  const candidates = [
    scraped?.document,
    scraped?.data,
    scraped?.result,
    scraped?.music,
    scraped?.payload,
    scraped?.item,
    scraped,
  ].filter(Boolean);

  let doc = candidates.find((c) => c?.artist && c?.song) || null;
  if (!doc) {
    const nest = candidates.find(
      (c) =>
        typeof c === "object" &&
        Object.values(c).some((v) => v?.artist && v?.song)
    );
    if (nest && !nest.artist && !nest.song) {
      const first = Object.values(nest).find((v) => v?.artist && v?.song);
      if (first) doc = first;
    }
  }
  if (!doc) return null;

  const inst = doc?.[instrumentName] || null;
  return {
    doc,
    inst,
    link: inst?.link ?? doc?.link ?? "",
    songCifra: inst?.songCifra ?? doc?.songCifra ?? "",
    capo: inst?.capo ?? doc?.capo ?? "",
    tuning: inst?.tuning ?? doc?.tuning ?? "",
    artist: doc.artist,
    song: doc.song,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Extrai as últimas duas partes do path da URL (ex.: .../pink-floyd/brain-damage/) */
function parseArtistSongFromUrl(raw) {
  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    const artist = parts.at(-2) || "";
    const song = (parts.at(-1) || "").replace(/\/+$/g, "");
    return { artist, song };
  } catch {
    const parts = String(raw).split("/").filter(Boolean);
    const artist = parts.at(-2) || "";
    const song = (parts.at(-1) || "").replace(/\/+$/g, "");
    return { artist, song };
  }
}

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
  setSongScrapado,
  setArtistScrapado,
  setCifraExiste,
  setCifraFROMDB,
}) {
  const [loading, setLoading] = useState(false); // mantemos, mas NÃO bloqueia inputs
  const inFlightRef = useRef(false);
  const blurTimer = useRef(null);

  const notify = (title, message) => {
    setShowSnackBar?.(true);
    setSnackbarMessage?.({ title, message });
  };

  const guard = (cond, title, message) => {
    if (!cond) {
      notify(title, message);
      return true;
    }
    return false;
  };

  /** Salva artist/song no localStorage e nos estados a partir do link */
  const primeArtistSongFromLink = useCallback(
    (link) => {
      const { artist, song } = parseArtistSongFromUrl(link);
      if (artist) {
        localStorage.setItem("artist", artist);
        setArtistName?.(artist);
        setArtistScrapado?.(artist);
      }
      if (song) {
        localStorage.setItem("song", song);
        setSongName?.(song);
        setSongScrapado?.(song);
      }
      console.log("[NewSongInputLinkBox] artist/song extraídos:", {
        artist,
        song,
      });
      return { artist, song };
    },
    [setArtistName, setSongName, setArtistScrapado, setSongScrapado]
  );

  /** Fluxo principal (sem enviar nada para /api/generalCifra — o Python cuida disso) */
  const handleSubmit = useCallback(
    async (linkOverride) => {
      if (inFlightRef.current) return;

      const link = (linkOverride ?? instrument ?? "").trim();
      console.groupCollapsed(`[${instrumentName}] SUBMIT`);
      console.log("link:", link);

      if (guard(!!link, "Error", "Insira um link válido.")) {
        console.groupEnd();
        return;
      }

      const email = localStorage.getItem("userEmail") || "";
      if (guard(!!email, "Error", "Email do usuário é obrigatório.")) {
        console.groupEnd();
        return;
      }

      // 1) Derivar artist/song se necessário e gravar no LS
      let finalArtist = (artistName || "").trim();
      let finalSong = (songName || "").trim();
      if (!finalArtist || !finalSong) {
        const { artist, song } = primeArtistSongFromLink(link);
        finalArtist = finalArtist || artist;
        finalSong = finalSong || song;
      }

      if (
        guard(
          !!finalArtist && !!finalSong,
          "Error",
          "Não foi possível identificar ARTIST e SONG."
        )
      ) {
        console.groupEnd();
        return;
      }

      try {
        inFlightRef.current = true;
        setLoading(true);
        notify("Load", "Carregando dados...");

        // 2) Verifica se já existe no banco geral (para evitar scrape desnecessário)
        console.time(`[${instrumentName}] checkCifraExists`);
        const existsRes = await checkCifraExists({ instrumentName, link });
        console.timeEnd(`[${instrumentName}] checkCifraExists`);

        if (existsRes?.exists) {
          console.log(`[${instrumentName}] já existe no DB`, existsRes.data);
          setCifraExiste?.(true);
          setCifraFROMDB?.(existsRes.data);
          localStorage.setItem("cifraFROMDB", JSON.stringify(existsRes.data));
          localStorage.setItem("fromWHERE", "DB");

          if (!artistName && existsRes.data?.artist)
            setArtistName?.(existsRes.data.artist);
          if (!songName && existsRes.data?.song)
            setSongName?.(existsRes.data.song);

          notify("Info", "Essa cifra já está na sua biblioteca.");
          const fresh = await gettingSongData?.();
          console.log("[gettingSongData()] (DB-hit) =>", fresh);
          console.groupEnd();
          return;
        }

        console.log(
          `[${instrumentName}] não encontrado no DB. Fazendo scrape…`
        );

        // 3) Scrape → Python grava no user DB e manda para generalCifras internamente
        const payload = {
          artist: finalArtist,
          song: finalSong,
          email,
          instrumentName,
          progress,
          link,
        };
        console.log("[scrape payload]", payload);

        console.time(`[${instrumentName}] scrapeCifra`);
        const scrapedRaw = await scrapeCifra(payload);
        console.timeEnd(`[${instrumentName}] scrapeCifra`);
        console.log("🔎 scrapeCifra RAW:", scrapedRaw);

        // 4) Se o backend já retornar o doc, atualiza UI; caso contrário, segue o fluxo normal
        const parsed = normalizeScrapeDoc(scrapedRaw, instrumentName);
        console.log("✅ parsed:", parsed);
        if (parsed?.doc) {
          setCifraFROMDB?.(parsed.doc);
          localStorage.setItem("cifraFROMDB", JSON.stringify(parsed.doc));
          localStorage.setItem("fromWHERE", "URL");
          if (parsed.artist) setArtistName?.(parsed.artist);
          if (parsed.song) setSongName?.(parsed.song);
          if (parsed.link && parsed.link !== link) setInstrument?.(parsed.link);
        }

        // 5) Polling opcional para refletir criação no generalCifras (feito pelo Python)
        let found = null;
        const MAX_RETRIES = 10;
        const INTERVAL_MS = 800;
        for (let i = 1; i <= MAX_RETRIES; i++) {
          try {
            console.time(`[${instrumentName}] polling #${i}`);
            const chk = await checkCifraExists({ instrumentName, link });
            console.timeEnd(`[${instrumentName}] polling #${i}`);
            if (chk?.exists) {
              found = chk.data;
              break;
            }
          } catch (e) {
            if (e?.response?.status !== 404) {
              console.error(`[${instrumentName}] polling erro:`, e);
              throw e;
            }
          }
          await sleep(INTERVAL_MS);
        }

        if (found) {
          setCifraFROMDB?.(found);
          localStorage.setItem("cifraFROMDB", JSON.stringify(found));
          localStorage.setItem("fromWHERE", "DB");
          if (!artistName && found?.artist) setArtistName?.(found.artist);
          if (!songName && found?.song) setSongName?.(found.song);
        } else {
          console.warn(
            `[${instrumentName}] documento geral ainda não visível (ok, Python cuida disso).`
          );
        }

        // 6) Atualiza UI (carrega dados do user DB)
        console.time("[gettingSongData()]");
        const fresh = await gettingSongData?.();
        console.timeEnd("[gettingSongData()]");
        console.log("[gettingSongData()] =>", fresh);

        notify("Success", "Cifra adicionada com sucesso!");
        setCifraExiste?.(false);
      } catch (err) {
        console.error(`[${instrumentName}] handleSubmit error`, err);
        const msg =
          err?.response?.data?.message ||
          "Ocorreu um erro ao processar a requisição.";
        notify("Error", msg);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        console.groupEnd();
      }
    },
    [
      instrument,
      instrumentName,
      artistName,
      songName,
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
      setInstrument,
      primeArtistSongFromLink,
    ]
  );

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
        onChange={(e) => setInstrument(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          setInstrument(pasted);
          primeArtistSongFromLink(pasted);
          setTimeout(() => handleSubmit(pasted), 0);
          console.log("[onPaste] link colado =>", pasted);
        }}
        onBlur={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          blurTimer.current = setTimeout(() => handleSubmit(), 150);
        }}
        // NÃO desabilitamos o input durante o loading
      />

      {/* Slider progress (NÃO BLOQUEAR MESMO EM LOADING) */}
      <div className="flex items-center mt-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          onMouseUp={() => {
            if (instrument?.trim()) handleSubmit();
          }}
        />
        <div className="w-14 text-right text-sm">{progress}%</div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
