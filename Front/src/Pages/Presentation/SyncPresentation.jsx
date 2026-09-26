import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaCheck, FaPlay, FaTrash } from "react-icons/fa6";
import {
  allDataFromOneSong,
  updateSongEntry,
} from "../../Tools/Controllers";
import SnackBar from "../../Tools/SnackBar";
import { processSongCifra } from "./processSongCifra";
import { buildInstrumentPresentationLayouts } from "./presentationLayoutHelpers";
import { buildProgressionRenderModel } from "./helpers/progressionRenderModel";
import { buildProgressionBlocks } from "./helpers/presentationUtils";
import {
  normalizePlaybackSync,
  reconcilePlaybackSyncToBlocks,
} from "./sync/syncBlockModel";
import { stripImportedCifraPayload } from "./sync/stripImportedCifraPayload";
import { formatSyncTime, getYouTubeVideoId } from "./sync/youtubeUrl";

function getInstrumentData(songData, instrument) {
  return songData?.[instrument] && typeof songData[instrument] === "object"
    ? songData[instrument]
    : {};
}

function buildPlaybackSyncDraft({ songData, videoId }) {
  return (
    normalizePlaybackSync(songData?.playbackSync) || {
      provider: "youtube",
      videoId,
      syncPoints: [],
    }
  );
}

function buildSyncColumnBlocks(layouts) {
  const expandedLayout = layouts.expanded || layouts.default || {};
  const cleanSongCifra = stripImportedCifraPayload(
    expandedLayout.songCifra || "",
  );
  const htmlBlocks = processSongCifra(cleanSongCifra).htmlBlocks;
  const visibleContentBlocks = buildProgressionBlocks(htmlBlocks, {
    dropBlankLines: true,
  });
  const { activeColumns } = buildProgressionRenderModel({
    visibleContentBlocks,
    progressionMarkOverrides: expandedLayout.progressionMarkOverrides || {},
    shouldUseHorizontalColumnFlow: true,
  });

  return activeColumns
    .map((column, index) => {
      const syncAnchorBlock = column.blocks.find(
        (block) => block.syncBlockId && !block.isColumnBreak,
      );

      if (!syncAnchorBlock) return null;

      const html = column.blocks
        .filter((block) => !block.isColumnBreak)
        .map((block) => block.block)
        .join("\n");

      return {
        index,
        syncBlockId: syncAnchorBlock.syncBlockId,
        label: `Coluna ${column.visualColumnLabel || index + 1}`,
        html,
        blockKeys: column.blockKeys || [],
      };
    })
    .filter(Boolean);
}

export default function SyncPresentation() {
  const { artist, song, instrument } = useParams();
  const decodedArtist = decodeURIComponent(artist || "");
  const decodedSong = decodeURIComponent(song || "");
  const decodedInstrument = decodeURIComponent(instrument || "guitar01");
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);

  const [songData, setSongData] = useState(null);
  const [draftSync, setDraftSync] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const selectedVideoId = draftSync?.videoId || "";

  useEffect(() => {
    let active = true;

    async function loadSong() {
      try {
        setStatus("loading");
        const raw = await allDataFromOneSong(decodedArtist, decodedSong);
        const parsed = JSON.parse(raw);
        if (!active) return;
        const videoId = getYouTubeVideoId(parsed?.embedVideos?.[0]);
        setSongData(parsed);
        setDraftSync(buildPlaybackSyncDraft({ songData: parsed, videoId }));
        setStatus("ready");
      } catch (error) {
        if (!active) return;
        console.error("SyncPresentation load error:", error);
        setStatus("error");
        setMessage("Nao foi possivel carregar a musica.");
      }
    }

    loadSong();
    return () => {
      active = false;
    };
  }, [decodedArtist, decodedSong]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!selectedVideoId || typeof window === "undefined") return undefined;

    let cancelled = false;

    const loadYouTubeApi = () =>
      new Promise((resolve) => {
        if (window.YT?.Player) {
          resolve(window.YT);
          return;
        }

        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          previousCallback?.();
          resolve(window.YT);
        };

        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(script);
        }
      });

    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerRef.current) return;
      playerInstanceRef.current?.destroy?.();
      playerInstanceRef.current = new YT.Player(playerRef.current, {
        videoId: selectedVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
      });
    });

    return () => {
      cancelled = true;
      playerInstanceRef.current?.destroy?.();
      playerInstanceRef.current = null;
    };
  }, [selectedVideoId]);

  const syncBlocks = useMemo(() => {
    const instrumentData = getInstrumentData(songData, decodedInstrument);
    const layouts = buildInstrumentPresentationLayouts(instrumentData);
    return buildSyncColumnBlocks(layouts);
  }, [decodedInstrument, songData]);

  useEffect(() => {
    if (!draftSync?.syncPoints?.length || !syncBlocks.length) return;

    const currentBlockIds = new Set(
      syncBlocks.map((block) => block.syncBlockId),
    );
    const hasMatchingPoint = draftSync.syncPoints.some((point) =>
      currentBlockIds.has(point.syncBlockId),
    );
    if (hasMatchingPoint) return;

    const reconciled = reconcilePlaybackSyncToBlocks(draftSync, syncBlocks);
    if (!reconciled?.syncPoints?.length) return;

    setDraftSync(reconciled);
    setDirty(true);
    setMessage("Timestamps antigos foram recuperados para revisao.");
  }, [draftSync, syncBlocks]);

  const syncPointMap = useMemo(
    () => {
      const currentBlockIds = new Set(
        syncBlocks.map((block) => block.syncBlockId),
      );

      return new Map(
        (draftSync?.syncPoints || [])
          .filter((point) => currentBlockIds.has(point.syncBlockId))
          .map((point) => [point.syncBlockId, point]),
      );
    },
    [draftSync, syncBlocks],
  );

  useEffect(() => {
    if (selectedBlockId || !syncBlocks.length) return;
    setSelectedBlockId(syncBlocks[0].syncBlockId);
  }, [selectedBlockId, syncBlocks]);

  const markedCount = syncPointMap.size;
  const selectedBlockIndex = Math.max(
    0,
    syncBlocks.findIndex((block) => block.syncBlockId === selectedBlockId),
  );

  const updateSyncPoint = (syncBlockId, updater) => {
    setDirty(true);
    setDraftSync((current) => {
      const base = normalizePlaybackSync(current) || {
        provider: "youtube",
        videoId: selectedVideoId,
        syncPoints: [],
      };
      const existing = base.syncPoints.find(
        (point) => point.syncBlockId === syncBlockId,
      );
      const nextPoint = updater(existing);
      const syncPoints = base.syncPoints
        .filter((point) => point.syncBlockId !== syncBlockId)
        .concat(nextPoint ? [nextPoint] : [])
        .sort((left, right) => left.time - right.time);

      return { ...base, syncPoints };
    });
  };

  const getCurrentPlayerTime = () => {
    try {
      const value = playerInstanceRef.current?.getCurrentTime?.();
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    } catch {
      return 0;
    }
  };

  const syncCurrentBlock = (syncBlockId) => {
    const time = getCurrentPlayerTime();
    updateSyncPoint(syncBlockId, () => ({ syncBlockId, time }));
  };

  const handleManualTime = (syncBlockId, value) => {
    const time = Number(value);
    updateSyncPoint(syncBlockId, () => ({ syncBlockId, time }));
  };

  const adjustTime = (syncBlockId, delta) => {
    updateSyncPoint(syncBlockId, (existing) => ({
      syncBlockId,
      time: Math.max(0, Number(existing?.time || 0) + delta),
    }));
  };

  const removePoint = (syncBlockId) => {
    updateSyncPoint(syncBlockId, () => null);
  };

  const removeAllPoints = () => {
    setDirty(true);
    setDraftSync((current) => {
      const base = normalizePlaybackSync(current) || {
        provider: "youtube",
        videoId: selectedVideoId,
        syncPoints: [],
      };

      return {
        ...base,
        syncPoints: [],
      };
    });
    setMessage("Todos os timestamps foram removidos.");
  };

  const acceptSuggestedPoint = (syncBlockId) => {
    updateSyncPoint(syncBlockId, (existing) =>
      existing
        ? {
            syncBlockId,
            time: existing.time,
          }
        : null,
    );
  };

  const suggestSyncPoints = () => {
    const existingPoints = new Map(
      (draftSync?.syncPoints || []).map((point) => [point.syncBlockId, point]),
    );
    const confirmedAnchors = syncBlocks
      .map((block, index) => ({
        index,
        point: existingPoints.get(block.syncBlockId),
      }))
      .filter(({ point }) => point && !point.needsReview);

    if (!confirmedAnchors.length) {
      setMessage("Registre pelo menos um timestamp antes de sugerir.");
      return;
    }

    const duration = Number(playerInstanceRef.current?.getDuration?.() || 0);
    let suggestedCount = 0;

    setDirty(true);
    setDraftSync((current) => {
      const base = normalizePlaybackSync(current) || {
        provider: "youtube",
        videoId: selectedVideoId,
        syncPoints: [],
      };
      const nextPoints = new Map(
        base.syncPoints.map((point) => [point.syncBlockId, point]),
      );

      syncBlocks.forEach((block, index) => {
        if (nextPoints.has(block.syncBlockId)) return;

        const previousAnchor = confirmedAnchors
          .filter((anchor) => anchor.index < index)
          .at(-1);
        const nextAnchor = confirmedAnchors.find((anchor) => anchor.index > index);
        if (!previousAnchor && !nextAnchor) return;

        const startIndex = previousAnchor?.index ?? -1;
        const endIndex = nextAnchor?.index ?? syncBlocks.length;
        const startTime = previousAnchor?.point?.time ?? 0;
        const endTime = nextAnchor?.point?.time ?? duration;

        if (!Number.isFinite(endTime) || endTime <= startTime) return;

        const progress = (index - startIndex) / (endIndex - startIndex);
        nextPoints.set(block.syncBlockId, {
          syncBlockId: block.syncBlockId,
          time: Math.round((startTime + (endTime - startTime) * progress) * 100) / 100,
          needsReview: true,
        });
        suggestedCount += 1;
      });

      return {
        ...base,
        syncPoints: Array.from(nextPoints.values()).sort(
          (left, right) => left.time - right.time,
        ),
      };
    });

    setMessage(
      suggestedCount
        ? `${suggestedCount} sugestoes criadas para revisao.`
        : "Nao encontrei intervalos suficientes para sugerir.",
    );
  };

  const testPoint = (time) => {
    if (!selectedVideoId) return;
    playerInstanceRef.current?.seekTo?.(Math.max(0, Number(time) || 0), true);
    playerInstanceRef.current?.playVideo?.();
  };

  const saveSync = async () => {
    try {
      const normalized = normalizePlaybackSync(draftSync);
      await updateSongEntry({
        ...songData,
        artist: decodedArtist,
        song: decodedSong,
        playbackSync: normalized,
        updateIn: new Date().toISOString().slice(0, 10),
      });
      setDirty(false);
      setMessage("Sincronizacao salva.");
    } catch (error) {
      console.error("SyncPresentation save error:", error);
      setMessage(error?.message || "Falha ao salvar sincronizacao.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f2f2f2] p-6 text-black">
        Carregando...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#f2f2f2] p-6 text-black">{message}</div>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[#f2f2f2] text-black">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1760px] flex-col gap-5 px-5 py-5 md:px-9">
        <header className="neuphormism-b flex shrink-0 flex-wrap items-center justify-between gap-4 px-8 py-6">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.42em] text-[goldenrod]">
              Sync Presentation
            </div>
            <h1 className="mt-2 truncate text-[2.25rem] font-black leading-none">
              {decodedSong}
            </h1>
            <p className="mt-1 text-lg font-bold text-black/70">
              {decodedArtist} · {decodedInstrument}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="neuphormism-b-btn-flat px-4 py-3 text-sm font-bold text-black/70">
              {markedCount}/{syncBlocks.length} marcados
            </div>
            <button
              type="button"
              className="neuphormism-b-btn px-5 py-3 text-sm font-bold text-black"
              onClick={suggestSyncPoints}
            >
              Sugerir marcas
            </button>
            <button
              type="button"
              className="neuphormism-b-btn-red px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={removeAllPoints}
              disabled={!draftSync?.syncPoints?.length}
            >
              Remover todos
            </button>
            <Link
              className="neuphormism-b-btn px-5 py-3 text-sm font-bold text-black"
              to={`/presentation/${encodeURIComponent(decodedArtist)}/${encodeURIComponent(decodedSong)}/${encodeURIComponent(decodedInstrument)}`}
            >
              Presentation
            </Link>
            <button
              type="button"
              className="neuphormism-b-btn-green px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={saveSync}
              disabled={!dirty}
            >
              Salvar sincronizacao
            </button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 items-stretch gap-5 overflow-hidden xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
          <aside className="min-h-0 space-y-4">
            <div className="neuphormism-b overflow-hidden p-4">
              {selectedVideoId ? (
                <div
                  ref={playerRef}
                  className="aspect-video w-full overflow-hidden rounded-[18px] bg-black"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-[18px] bg-black/90 px-5 text-center text-sm font-bold text-white/70">
                  Adicione um video do YouTube na musica para sincronizar.
                </div>
              )}
              <label className="mt-4 block text-xs font-bold uppercase tracking-[0.22em] text-black/50">
                Video
              </label>
              <input
                className="mt-2 w-full rounded-[10px] border-0 bg-[#f2f2f2] px-4 py-3 text-sm font-bold text-black shadow-[inset_4px_4px_8px_#c9c9c9,inset_-4px_-4px_8px_#ffffff] outline-none"
                value={selectedVideoId}
                placeholder="YouTube video id"
                onChange={(event) => {
                  setDirty(true);
                  setDraftSync((current) => ({
                    ...(normalizePlaybackSync(current) || {
                      provider: "youtube",
                      syncPoints: [],
                    }),
                    videoId:
                      getYouTubeVideoId(event.target.value) || event.target.value,
                  }));
                }}
              />
            </div>

            <div className="neuphormism-b p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-black/50">
                Trecho atual
              </div>
              <div className="mt-2 text-4xl font-black text-[goldenrod]">
                {String(selectedBlockIndex + 1).padStart(2, "0")}
              </div>
              <p className="mt-2 text-sm font-bold text-black/65">
                Reproduza o video e clique em Registrar timestamp no trecho onde
                a musica entra.
              </p>
            </div>
          </aside>

          <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.32em] text-[goldenrod]">
                  Blocos da cifra
                </div>
                <h2 className="mt-1 text-2xl font-black">
                  Marque o inicio de cada trecho
                </h2>
              </div>
              <div className="text-sm font-bold text-black/50">
                Os cards mostram a cifra como ela aparece na Presentation.
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-1 pr-4">
              <div className="flex w-full min-w-0 flex-col gap-4 pb-6">
                {syncBlocks.map((block) => {
                const point = syncPointMap.get(block.syncBlockId);
                const time = Number(point?.time || 0);
                const isSelected = selectedBlockId === block.syncBlockId;
                const hasTime = Boolean(point);

                return (
                  <div
                    key={block.syncBlockId}
                    className={`neuphormism-b flex w-full min-w-0 max-w-full flex-col gap-5 p-5 transition ${
                      isSelected ? "ring-2 ring-[goldenrod]" : ""
                    }`}
                    onClick={() => setSelectedBlockId(block.syncBlockId)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
                          {String(block.index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-black text-black/75">
                          {block.label}
                        </span>
                        {hasTime ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[goldenrod] px-3 py-1 text-xs font-black text-black">
                            <FaCheck className="h-3 w-3" />
                            {point?.needsReview
                              ? `sugerido ${formatSyncTime(time)}`
                              : formatSyncTime(time)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-black text-black/45">
                            sem marca
                          </span>
                        )}
                      </div>
                      <div
                        className="sync-presentation-cifra-preview presentation-content-flow rounded-[14px] bg-[#f7f7f7] px-5 py-4 text-black shadow-[inset_3px_3px_7px_#d0d0d0,inset_-3px_-3px_7px_#ffffff]"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                      />
                      <div className="mt-2 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-black/25">
                        {block.syncBlockId}
                      </div>
                    </div>

                    <div className="grid w-full min-w-0 max-w-full items-end gap-4 border-t border-black/10 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(200px,0.8fr)_minmax(240px,1fr)]">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.22em] text-black/45">
                          Timestamp
                        </label>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            className="min-w-0 flex-1 rounded-[10px] border-0 bg-[#f2f2f2] px-3 py-3 text-lg font-black text-black shadow-[inset_4px_4px_8px_#c9c9c9,inset_-4px_-4px_8px_#ffffff] outline-none"
                            type="number"
                            min="0"
                            step="0.01"
                            value={time}
                            onChange={(event) =>
                              handleManualTime(
                                block.syncBlockId,
                                event.target.value,
                              )
                            }
                          />
                          <span className="text-sm font-black text-black/50">
                            {formatSyncTime(time)}
                          </span>
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-2 gap-2">
                        {[-0.5, -0.1, 0.1, 0.5].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            className="neuphormism-b-btn min-w-0 px-2 py-2 text-xs font-black text-black"
                            onClick={(event) => {
                              event.stopPropagation();
                              adjustTime(block.syncBlockId, delta);
                            }}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta}s
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-2">
                          <button
                            type="button"
                            className="neuphormism-b-btn-green flex min-w-0 items-center justify-center gap-2 px-3 py-3 text-center text-sm font-black text-black"
                          onClick={(event) => {
                            event.stopPropagation();
                            syncCurrentBlock(block.syncBlockId);
                          }}
                          >
                            <FaCheck className="h-4 w-4" />
                            Registrar timestamp
                          </button>
                          {point?.needsReview ? (
                            <button
                              type="button"
                              className="neuphormism-b-btn flex min-w-0 items-center justify-center gap-2 px-3 py-3 text-center text-sm font-black text-black"
                              onClick={(event) => {
                                event.stopPropagation();
                                acceptSuggestedPoint(block.syncBlockId);
                              }}
                            >
                              <FaCheck className="h-4 w-4" />
                              Aceitar sugestao
                            </button>
                          ) : null}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="neuphormism-b-btn flex items-center justify-center gap-2 px-3 py-3 text-xs font-black text-black"
                            onClick={(event) => {
                              event.stopPropagation();
                              testPoint(time);
                            }}
                          >
                            <FaPlay className="h-3 w-3" />
                            Testar
                          </button>
                          <button
                            type="button"
                            className="neuphormism-b-btn-red flex items-center justify-center gap-2 px-3 py-3 text-xs font-black text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              removePoint(block.syncBlockId);
                            }}
                          >
                            <FaTrash className="h-3 w-3" />
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
      {message ? (
        <SnackBar snackbarMessage={{ title: "Sync", message }} />
      ) : null}
    </main>
  );
}
