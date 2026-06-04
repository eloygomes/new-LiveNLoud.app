import { useCallback, useEffect } from "react";
import { getLiveColumnTargetIndex } from "../presentationLayoutHelpers";
import {
  getRegisteredScrollController,
  registerScrollViewport,
  unregisterScrollViewport,
} from "../presentationScrollController";

const isTextNavigationTarget = (target) =>
  target instanceof HTMLElement &&
  (target.closest(
    'input, textarea, select, button, [contenteditable="true"], .presentation-render-content-block',
  ) ||
    target.isContentEditable);

const getExpandedNavigationItems = (viewport) => {
  const columns = Array.from(
    viewport.querySelectorAll(".presentation-horizontal-columns > .presentation-column"),
  );
  if (columns.length) return columns;

  return Array.from(viewport.querySelectorAll(".presentation-render-block"));
};

export function usePresentationLiveMode({
  activeProgressionRenderColumns,
  closeTouchVideo,
  effectiveLiveMode,
  hideChords,
  hideTooltip,
  isEditing,
  isTouchLayout,
  liveModeRootRef,
  presentationContentRef,
  pushSnackbarMessage,
  selectContenttoShow,
  setActiveLiveColumnKey,
  setActiveShowProgressionMarkers,
  setIsLiveMode,
  setIsPseudoLiveMode,
  shouldUseHorizontalColumnFlow,
}) {
  const focusLiveViewport = useCallback(() => {
    const contentNode = presentationContentRef.current;
    if (!contentNode) return;

    try {
      window.focus();
    } catch {}

    requestAnimationFrame(() => {
      contentNode.focus({ preventScroll: true });
    });
  }, [presentationContentRef]);

  const scrollExpandedLayout = useCallback(
    (direction) => {
      const viewport = presentationContentRef.current;
      if (!viewport) return;

      const navigationItems = getExpandedNavigationItems(viewport);
      if (!navigationItems.length) return;

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const activeIndex = effectiveLiveMode
        ? (navigationItems
            .map((item, index) => ({
              index,
              distance: Math.abs(
                item.offsetLeft + item.clientWidth / 2 - viewportCenter,
              ),
            }))
            .sort((left, right) => left.distance - right.distance)[0]?.index ??
          0)
        : Math.max(
            0,
            navigationItems.findLastIndex(
              (item) => item.offsetLeft <= viewport.scrollLeft + 24,
            ),
          );
      const targetIndex = getLiveColumnTargetIndex({
        currentIndex: activeIndex,
        direction,
        columnCount: navigationItems.length,
      });
      const targetItem = navigationItems[targetIndex];
      if (!targetItem) return;

      const centeredOffset = effectiveLiveMode
        ? targetItem.offsetLeft -
          (viewport.clientWidth - targetItem.clientWidth) / 2
        : targetItem.offsetLeft - 20;

      viewport.scrollTo({
        left: Math.max(0, centeredOffset),
        behavior: "auto",
      });

      setActiveLiveColumnKey(
        targetItem.dataset.liveColumnKey ||
          targetItem.querySelector("[data-live-column-key]")?.dataset
            ?.liveColumnKey ||
          "",
      );
    },
    [effectiveLiveMode, presentationContentRef, setActiveLiveColumnKey],
  );

  const enterLiveMode = useCallback(async () => {
    const rootNode = liveModeRootRef.current;
    if (!rootNode) return;

    setActiveShowProgressionMarkers(false);

    if (isTouchLayout) {
      if (typeof rootNode.requestFullscreen === "function") {
        try {
          await rootNode.requestFullscreen();
          setIsLiveMode(true);
          setIsPseudoLiveMode(false);
          focusLiveViewport();
          return;
        } catch (error) {
          console.warn("Fallback para pseudo LIVE mode:", error);
        }
      }

      setIsPseudoLiveMode(true);
      focusLiveViewport();
      return;
    }

    try {
      await rootNode.requestFullscreen();
      setIsLiveMode(true);
      focusLiveViewport();
    } catch (error) {
      console.error("Não foi possível entrar no modo LIVE:", error);
      pushSnackbarMessage(
        "Erro",
        "Não foi possível abrir o modo LIVE em tela cheia.",
      );
    }
  }, [
    focusLiveViewport,
    isTouchLayout,
    liveModeRootRef,
    pushSnackbarMessage,
    setActiveShowProgressionMarkers,
    setIsLiveMode,
    setIsPseudoLiveMode,
  ]);

  const exitLiveMode = useCallback(async () => {
    if (
      document.fullscreenElement &&
      typeof document.exitFullscreen === "function"
    ) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Não foi possível sair do modo LIVE:", error);
      }
    }

    setIsPseudoLiveMode(false);
    setIsLiveMode(false);
  }, [setIsLiveMode, setIsPseudoLiveMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = document.fullscreenElement != null;
      setIsLiveMode(fullscreenActive);
      if (fullscreenActive) {
        setIsPseudoLiveMode(false);
        focusLiveViewport();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [focusLiveViewport, setIsLiveMode, setIsPseudoLiveMode]);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (!viewport) return undefined;

    registerScrollViewport(viewport);
    return () => {
      unregisterScrollViewport(viewport);
    };
  }, [
    effectiveLiveMode,
    hideChords,
    isEditing,
    presentationContentRef,
    selectContenttoShow,
  ]);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (!viewport || !shouldUseHorizontalColumnFlow || isEditing) {
      return undefined;
    }

    const handleWheel = (event) => {
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (!delta) return;
      event.preventDefault();
      scrollExpandedLayout(delta > 0 ? 1 : -1);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [
    effectiveLiveMode,
    isEditing,
    presentationContentRef,
    scrollExpandedLayout,
    shouldUseHorizontalColumnFlow,
  ]);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (!viewport || !effectiveLiveMode || !shouldUseHorizontalColumnFlow) {
      setActiveLiveColumnKey("");
      return undefined;
    }

    let frameId = 0;
    let snapTimeoutId = 0;
    let hasInitialCenter = false;
    let isProgrammaticScroll = false;
    const centerBlock = (block, behavior = "auto") => {
      if (!block) return;
      isProgrammaticScroll = true;
      viewport.scrollTo({
        left: Math.max(
          0,
          block.offsetLeft - (viewport.clientWidth - block.clientWidth) / 2,
        ),
        behavior,
      });
      window.setTimeout(() => {
        isProgrammaticScroll = false;
      }, 0);
    };
    const updateActiveColumn = () => {
      const blocks = Array.from(
        viewport.querySelectorAll(".presentation-render-block"),
      );
      if (!blocks.length) {
        setActiveLiveColumnKey("");
        return;
      }

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const closestBlock = blocks
        .map((block) => ({
          block,
          key: block.dataset.liveColumnKey || "",
          distance: Math.abs(
            block.offsetLeft + block.clientWidth / 2 - viewportCenter,
          ),
        }))
        .sort((left, right) => left.distance - right.distance)[0];

      setActiveLiveColumnKey((current) =>
        closestBlock?.key && current !== closestBlock.key
          ? closestBlock.key
          : current,
      );

      if (!hasInitialCenter) {
        hasInitialCenter = true;
        centerBlock(closestBlock?.block, "auto");
      }
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateActiveColumn);
      window.clearTimeout(snapTimeoutId);

      if (!isProgrammaticScroll) {
        snapTimeoutId = window.setTimeout(() => {
          const blocks = Array.from(
            viewport.querySelectorAll(".presentation-render-block"),
          );
          const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
          const closestBlock = blocks
            .map((block) => ({
              block,
              distance: Math.abs(
                block.offsetLeft + block.clientWidth / 2 - viewportCenter,
              ),
            }))
            .sort((left, right) => left.distance - right.distance)[0]?.block;
          centerBlock(closestBlock, "auto");
        }, 160);
      }
    };

    requestUpdate();
    viewport.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(snapTimeoutId);
      viewport.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [
    activeProgressionRenderColumns,
    effectiveLiveMode,
    presentationContentRef,
    setActiveLiveColumnKey,
    shouldUseHorizontalColumnFlow,
  ]);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (!viewport || !shouldUseHorizontalColumnFlow || isEditing) {
      return undefined;
    }

    const handleExpandedKeyNavigation = (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      if (isTextNavigationTarget(event.target)) return;

      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      scrollExpandedLayout(direction);
    };

    window.addEventListener("keydown", handleExpandedKeyNavigation);
    return () => {
      window.removeEventListener("keydown", handleExpandedKeyNavigation);
    };
  }, [
    isEditing,
    presentationContentRef,
    scrollExpandedLayout,
    shouldUseHorizontalColumnFlow,
  ]);

  useEffect(() => {
    if (!effectiveLiveMode) return undefined;

    focusLiveViewport();

    const handleWindowFocus = () => {
      focusLiveViewport();
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [effectiveLiveMode, focusLiveViewport]);

  useEffect(() => {
    if (!effectiveLiveMode) return undefined;

    const handleLiveNavigation = (event) => {
      if (event.defaultPrevented) return;

      const contentNode = presentationContentRef.current;
      if (!contentNode) return;

      const scrollController = getRegisteredScrollController();

      if (scrollController && event.key === " ") {
        event.preventDefault();
        scrollController.toggleAutoScroll();
        return;
      }

      if (scrollController && event.key === "Escape") {
        event.preventDefault();
        scrollController.stopAutoScroll();
        return;
      }

      if (scrollController && event.key === "ArrowLeft") {
        event.preventDefault();
        scrollController.adjustSpeed(-1);
        return;
      }

      if (scrollController && event.key === "ArrowRight") {
        event.preventDefault();
        scrollController.adjustSpeed(1);
        return;
      }

      let delta = 0;
      if (scrollController && event.key === "ArrowDown") {
        event.preventDefault();
        scrollController.handleVerticalAction("down");
        return;
      }
      if (scrollController && event.key === "ArrowUp") {
        event.preventDefault();
        scrollController.handleVerticalAction("up");
        return;
      }
      if (event.key === "PageDown")
        delta = Math.max(320, window.innerHeight * 0.85);
      if (event.key === "PageUp")
        delta = -Math.max(320, window.innerHeight * 0.85);
      if (event.key === "Home") {
        event.preventDefault();
        if (scrollController) {
          scrollController.scrollViewportTo(0);
          return;
        }
        contentNode.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        if (scrollController) {
          scrollController.scrollViewportTo(contentNode.scrollHeight);
          return;
        }
        contentNode.scrollTo({
          top: contentNode.scrollHeight,
          behavior: "auto",
        });
        return;
      }

      if (!delta) return;
      event.preventDefault();
      contentNode.scrollBy({ top: delta, behavior: "auto" });
    };

    window.addEventListener("keydown", handleLiveNavigation);
    return () => {
      window.removeEventListener("keydown", handleLiveNavigation);
    };
  }, [effectiveLiveMode, presentationContentRef]);

  useEffect(() => {
    if (!isTouchLayout) return undefined;

    window.dispatchEvent(
      new CustomEvent("mobile-ui-visibility-change", {
        detail: { hidden: effectiveLiveMode },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("mobile-ui-visibility-change", {
          detail: { hidden: false },
        }),
      );
    };
  }, [effectiveLiveMode, isTouchLayout]);

  useEffect(() => {
    const handleForcedCleanup = async () => {
      hideTooltip();
      setIsPseudoLiveMode(false);
      setIsLiveMode(false);
      closeTouchVideo();

      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === "function"
      ) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.warn(
            "Failed to exit fullscreen during presentation cleanup:",
            error,
          );
        }
      }
    };

    window.addEventListener("presentation-force-cleanup", handleForcedCleanup);
    return () => {
      window.removeEventListener(
        "presentation-force-cleanup",
        handleForcedCleanup,
      );
    };
  }, [closeTouchVideo, hideTooltip, setIsLiveMode, setIsPseudoLiveMode]);

  return {
    enterLiveMode,
    exitLiveMode,
    focusLiveViewport,
    scrollExpandedLayout,
  };
}
