import { useCallback, useMemo, useState } from "react";

export function usePresentationMediaControls({
  instrumentSelected,
  songDataFetched,
}) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [guitarProViewerOpen, setGuitarProViewerOpen] = useState(false);
  const [selectedGuitarProFile, setSelectedGuitarProFile] = useState(null);
  const [touchVideoLink, setTouchVideoLink] = useState("");
  const [isTouchVideoActive, setIsTouchVideoActive] = useState(false);
  const [isTouchVideoMenuOpen, setIsTouchVideoMenuOpen] = useState(false);

  const guitarProFiles = useMemo(
    () =>
      Array.isArray(songDataFetched?.guitarProFiles)
        ? songDataFetched.guitarProFiles
        : [],
    [songDataFetched],
  );
  const hasGuitarProFiles = guitarProFiles.length > 0;
  const canOpenGuitarPro = instrumentSelected !== "voice" && hasGuitarProFiles;

  const openGuitarProViewer = useCallback(() => {
    if (instrumentSelected === "voice" || !guitarProFiles.length) return;

    let file = guitarProFiles[0];
    if (guitarProFiles.length > 1) {
      const optionsText = guitarProFiles
        .map((entry, index) => `${index + 1}. ${entry.originalName}`)
        .join("\n");
      const selection = window.prompt(
        `Qual arquivo deseja abrir?\n${optionsText}`,
      );
      const selectedIndex = Number.parseInt(selection || "", 10) - 1;
      file = guitarProFiles[selectedIndex];
      if (!file) return;
    }

    setSelectedGuitarProFile(file);
    setGuitarProViewerOpen(true);
  }, [guitarProFiles, instrumentSelected]);

  const closeGuitarProViewer = useCallback(() => {
    setGuitarProViewerOpen(false);
  }, []);

  const closeTouchVideo = useCallback(() => {
    setTouchVideoLink("");
    setIsTouchVideoActive(false);
    setIsVideoModalOpen(false);
    setIsTouchVideoMenuOpen(false);
  }, []);

  const closeTouchVideoMenu = useCallback(() => {
    setIsTouchVideoMenuOpen(false);
  }, []);

  const openTouchVideoMenu = useCallback(() => {
    setIsTouchVideoMenuOpen(true);
  }, []);

  const resetMediaControls = useCallback(() => {
    closeTouchVideo();
    setGuitarProViewerOpen(false);
    setSelectedGuitarProFile(null);
  }, [closeTouchVideo]);

  return {
    canOpenGuitarPro,
    closeGuitarProViewer,
    closeTouchVideo,
    closeTouchVideoMenu,
    guitarProViewerOpen,
    isTouchVideoActive,
    isTouchVideoMenuOpen,
    isVideoModalOpen,
    openGuitarProViewer,
    openTouchVideoMenu,
    resetMediaControls,
    selectedGuitarProFile,
    setIsTouchVideoActive,
    setIsVideoModalOpen,
    setTouchVideoLink,
    touchVideoLink,
  };
}
