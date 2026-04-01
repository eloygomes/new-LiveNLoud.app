import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import {
  getRegisteredScrollViewport,
  getScrollControllerState,
  registerScrollController,
  subscribeToScrollController,
  unregisterScrollController,
  updateScrollControllerState,
} from "./presentationScrollController";

const MIN_SPEED = 1;
const MAX_SPEED = 10;
const DEFAULT_SPEED = 3;
const DEFAULT_MODE = "page";
const AUTO_SCROLL_INTERVAL = 45;
const AUTO_SCROLL_BASE_STEP = 4;
const MAX_AUTO_SCROLL_STEP = AUTO_SCROLL_BASE_STEP * 2;
const VELOCITY_REDUCTION_PER_STEP = 0.1;
const SPEED_LABELS = [
  "very slow",
  "slowest",
  "slower",
  "slow",
  "steady",
  "medium",
  "mid fast",
  "fast",
  "faster",
  "rapid",
];

function isScrollable(node) {
  return Boolean(node && node.scrollHeight > node.clientHeight + 4);
}

function resolveViewportElement() {
  const registeredViewport = getRegisteredScrollViewport();
  if (registeredViewport && isScrollable(registeredViewport)) {
    return registeredViewport;
  }

  const mainNode = document.querySelector("main");
  if (isScrollable(mainNode)) {
    return mainNode;
  }

  const scrollingElement =
    document.scrollingElement || document.documentElement;
  if (isScrollable(scrollingElement)) {
    return scrollingElement;
  }

  return null;
}

function scrollViewportBy(amount, behavior = "smooth") {
  const target = resolveViewportElement();

  if (target && typeof target.scrollBy === "function") {
    target.scrollBy({ top: amount, behavior });
    return;
  }

  window.scrollBy({ top: amount, behavior });
}

function scrollViewportTo(position, behavior = "smooth") {
  const target = resolveViewportElement();

  if (target && typeof target.scrollTo === "function") {
    target.scrollTo({ top: position, behavior });
    return;
  }

  window.scrollTo({ top: position, behavior });
}

function getAutoScrollStep(speed) {
  const distanceFromTop = MAX_SPEED - speed;
  return (
    MAX_AUTO_SCROLL_STEP *
    Math.pow(1 - VELOCITY_REDUCTION_PER_STEP, distanceFromTop)
  );
}

export default function ScrollControlPanel() {
  const [state, setState] = useState(() => getScrollControllerState());
  const intervalRef = useRef(null);

  useEffect(() => subscribeToScrollController(setState), []);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    updateScrollControllerState({ autoScrollActive: false });
  }, []);

  const setSpeed = useCallback((nextSpeed) => {
    const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, nextSpeed));
    updateScrollControllerState({ speed: clampedSpeed });
  }, []);

  const adjustSpeed = useCallback(
    (delta) => {
      const { speed } = getScrollControllerState();
      setSpeed(speed + delta);
    },
    [setSpeed],
  );

  const scrollNormal = useCallback((direction) => {
    const amount = 120;
    scrollViewportBy(direction === "up" ? -amount : amount);
  }, []);

  const scrollPage = useCallback((direction) => {
    const viewport = resolveViewportElement();
    const viewportHeight = viewport?.clientHeight || window.innerHeight;
    const distance = Math.max(320, viewportHeight * 0.88);
    scrollViewportBy(direction === "up" ? -distance : distance);
  }, []);

  const handleVerticalAction = useCallback(
    (direction) => {
      const { verticalMode } = getScrollControllerState();
      if (verticalMode === "normal") {
        scrollNormal(direction);
        return;
      }

      scrollPage(direction);
    },
    [scrollNormal, scrollPage],
  );

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    updateScrollControllerState({ autoScrollActive: true });
    intervalRef.current = window.setInterval(() => {
      const { speed } = getScrollControllerState();
      scrollViewportBy(getAutoScrollStep(speed), "auto");
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    if (getScrollControllerState().autoScrollActive) {
      stopAutoScroll();
      return;
    }

    startAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  useEffect(() => {
    updateScrollControllerState({
      speed: getScrollControllerState().speed || DEFAULT_SPEED,
      verticalMode: getScrollControllerState().verticalMode || DEFAULT_MODE,
    });

    const controller = {
      toggleAutoScroll,
      startAutoScroll,
      stopAutoScroll,
      adjustSpeed,
      handleVerticalAction,
      scrollViewportTo,
    };

    registerScrollController(controller);

    return () => {
      stopAutoScroll();
      unregisterScrollController(controller);
    };
  }, [
    adjustSpeed,
    handleVerticalAction,
    startAutoScroll,
    stopAutoScroll,
    toggleAutoScroll,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      if (
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        targetTag === "SELECT" ||
        event.target?.isContentEditable
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        toggleAutoScroll();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        stopAutoScroll();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleVerticalAction("up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleVerticalAction("down");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        adjustSpeed(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        adjustSpeed(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [adjustSpeed, handleVerticalAction, stopAutoScroll, toggleAutoScroll]);

  const speedPercent = useMemo(
    () => ((state.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100,
    [state.speed],
  );

  return (
    <div className="mx-auto  ">
      <div className="mx-auto   mb-2 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
        Auto scroll{" "}
      </div>

      <div className="mb-2 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleAutoScroll}
          className={` flex w-full  items-center justify-center rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_12px_rgba(15,23,42,0.08)] transition ${
            state.autoScrollActive
              ? "neuphormism-b-btn-gold text-black bg-[#d9ad26] "
              : "neuphormism-b-se"
          }`}
          aria-label={
            state.autoScrollActive ? "Stop auto scroll" : "Start auto scroll"
          }
        >
          {state.autoScrollActive ? (
            <PauseRoundedIcon />
          ) : (
            <PlayArrowRoundedIcon />
          )}
        </button>

        <div className="mx-auto  pb-5 mb-2 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
          Press to <span className="font-bold">start</span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
        <span>Velocity</span>
        <span>{state.autoScrollActive ? "on" : "off"}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjustSpeed(-1)}
          className="flex h-6 w-6 items-center justify-center rounded-xl bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
          aria-label="Decrease velocity"
        >
          <RemoveRoundedIcon fontSize="small" />
        </button>

        <div className="relative h-2 flex-1 rounded-full bg-[#d6d6d6]">
          <div
            className="absolute left-0 top-0 h-2 rounded-full bg-[#d9ad26]"
            style={{ width: `${speedPercent}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => adjustSpeed(1)}
          className="flex h-6 w-6 items-center justify-center rounded-xl bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
          aria-label="Increase velocity"
        >
          <AddRoundedIcon fontSize="small" />
        </button>
      </div>

      <div className="mt-2 text-center text-[10px] font-semibold text-gray-500">
        {SPEED_LABELS[Math.min(SPEED_LABELS.length - 1, state.speed - 1)]}
      </div>

      <div className="py-5">
        <label
          htmlFor="scroll-vertical-mode"
          className="mb-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500"
        >
          Up / Down keys
        </label>
        <select
          id="scroll-vertical-mode"
          value={state.verticalMode || DEFAULT_MODE}
          onChange={(event) =>
            updateScrollControllerState({ verticalMode: event.target.value })
          }
          className="neuphormism-b-btn w-full rounded-xl border border-gray-200 bg-white px-2 py-2 my-2 text-[11px] font-semibold text-gray-700 outline-none"
        >
          <option value="normal">normal scroll</option>
          <option value="page">full page</option>
        </select>
      </div>

      <div className="">
        <div className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
          Keyboard arrows
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <button
              type="button"
              onClick={() => handleVerticalAction("up")}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
              aria-label="Scroll up"
            >
              <KeyboardArrowUpRoundedIcon fontSize="small" />
            </button>
            <div className="mt-1 text-[9px] font-semibold text-gray-500">
              up
            </div>
          </div>

          <div className="flex items-end justify-center gap-3">
            <div className="text-center">
              <button
                type="button"
                onClick={() => adjustSpeed(-1)}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                aria-label="Decrease speed"
              >
                <KeyboardArrowLeftRoundedIcon fontSize="small" />
              </button>
              <div className="mt-1 text-[9px] font-semibold text-gray-500">
                slower
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleVerticalAction("down")}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                aria-label="Scroll down"
              >
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              </button>
              <div className="mt-1 text-[9px] font-semibold text-gray-500">
                down
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => adjustSpeed(1)}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                aria-label="Increase speed"
              >
                <KeyboardArrowRightRoundedIcon fontSize="small" />
              </button>
              <div className="mt-1 text-[9px] font-semibold text-gray-500">
                faster
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
