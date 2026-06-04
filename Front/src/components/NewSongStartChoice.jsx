/* eslint-disable react/prop-types */
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaDrum,
  FaGuitar,
  FaKeyboard,
  FaLink,
  FaMicrophone,
  FaMusic,
  FaRegFileAlt,
  FaTimes,
} from "react-icons/fa";

const BLANK_INSTRUMENTS = [
  { key: "guitar01", label: "Guitar 01", icon: FaGuitar },
  { key: "guitar02", label: "Guitar 02", icon: FaGuitar },
  { key: "bass", label: "Bass", icon: FaMusic },
  { key: "keys", label: "Keys", icon: FaKeyboard },
  { key: "drums", label: "Drums", icon: FaDrum },
  { key: "voice", label: "Voice", icon: FaMicrophone },
];

export default function NewSongStartChoice({ open, onClose, onChooseLink }) {
  const [mode, setMode] = useState("choice");
  const [blankSongName, setBlankSongName] = useState("");
  const [blankArtistName, setBlankArtistName] = useState("");
  const [blankInstrument, setBlankInstrument] = useState("guitar01");

  if (!open) return null;

  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;

  const handleBlank = () => {
    setMode("blank");
  };

  const handleClose = () => {
    setMode("choice");
    onClose?.();
  };

  const canStartBlank =
    blankSongName.trim() && blankArtistName.trim() && blankInstrument;

  const goBlankPresentation = () => {
    if (!canStartBlank) return;
  };

  const content = (
    <div
      className={
        isTouchLayout
          ? "absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]"
          : `absolute left-1/2 top-1/2 ${
              mode === "blank" ? "w-[min(92vw,860px)]" : "w-[min(92vw,460px)]"
            } origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.8] rounded-[28px] bg-[#f2f2f2] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]`
      }
    >
      {isTouchLayout ? (
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-300" />
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
            New song
          </p>
          <h2 className="mt-2 text-[2rem] font-bold leading-none text-black">
            {mode === "blank" ? "Blank presentation" : "Choose how to start"}
          </h2>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
          onClick={handleClose}
          aria-label="Close new song options"
        >
          <FaTimes />
        </button>
      </div>

      {mode === "choice" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="neuphormism-b-se flex items-center gap-3 rounded-[18px] px-4 py-4 text-left text-black"
            onClick={handleBlank}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] neuphormism-b-btn text-gray-500">
              <FaRegFileAlt />
            </span>
            <span>
              <span className="block text-lg font-bold">Blank</span>
              <span className="mt-1 block text-xs font-bold text-gray-500">
                Start with song data
              </span>
            </span>
          </button>

          <button
            type="button"
            className="neuphormism-b-se flex items-center gap-3 rounded-[18px] px-4 py-4 text-left text-black"
            onClick={onChooseLink}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] neuphormism-b-btn text-[goldenrod]">
              <FaLink />
            </span>
            <span>
              <span className="block text-lg font-bold">Link</span>
              <span className="mt-1 block text-xs font-bold text-gray-500">
                Add from a song URL
              </span>
            </span>
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          <section className="rounded-[20px] neuphormism-b-se p-4">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Song Data
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Song name
                </span>
                <input
                  type="text"
                  value={blankSongName}
                  onChange={(event) => setBlankSongName(event.target.value)}
                  placeholder="Insert song name"
                  className="h-14 w-full rounded-[14px] border border-white/70 bg-white px-4 text-base font-bold text-black outline-none shadow-[8px_8px_18px_#bebebe,-8px_-8px_18px_#ffffff] focus:border-[goldenrod]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Artist name
                </span>
                <input
                  type="text"
                  value={blankArtistName}
                  onChange={(event) => setBlankArtistName(event.target.value)}
                  placeholder="Insert artist name"
                  className="h-14 w-full rounded-[14px] border border-white/70 bg-white px-4 text-base font-bold text-black outline-none shadow-[8px_8px_18px_#bebebe,-8px_-8px_18px_#ffffff] focus:border-[goldenrod]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[20px] neuphormism-b-se p-4">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Instrument
            </p>
            <div className="grid gap-3 md:grid-cols-6">
              {BLANK_INSTRUMENTS.map(({ key, label, icon: Icon }) => {
                const selected = blankInstrument === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-[18px] p-4 text-left transition active:scale-[0.99] ${
                      selected
                        ? "bg-[goldenrod] text-black shadow-[8px_8px_18px_rgba(0,0,0,0.18),-8px_-8px_18px_rgba(255,255,255,0.75)]"
                        : "neuphormism-b-se text-gray-500"
                    }`}
                    onClick={() => setBlankInstrument(key)}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full neuphormism-b-btn">
                      <Icon className="text-[14px]" />
                    </span>
                    <span className="mt-4 block text-sm font-bold">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            className="w-full rounded-[16px] bg-[goldenrod] px-4 py-4 text-sm font-bold uppercase tracking-[0.16em] text-black shadow-[8px_8px_18px_rgba(0,0,0,0.16),-8px_-8px_18px_rgba(255,255,255,0.78)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canStartBlank}
            onClick={goBlankPresentation}
          >
            Open blank presentation
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[13000] bg-black/35">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close new song options"
        onClick={handleClose}
      />
      {content}
    </div>,
    document.body,
  );
}
