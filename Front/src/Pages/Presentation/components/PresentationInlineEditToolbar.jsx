import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaEraser,
  FaHeading,
  FaItalic,
  FaMinus,
  FaMusic,
  FaPalette,
  FaPlus,
  FaRedo,
  FaSave,
  FaStrikethrough,
  FaTimes,
  FaUnderline,
  FaUndo,
} from "react-icons/fa";

const FONT_SIZES = ["0.8em", "1em", "1.25em", "1.5em"];

function EditButton({ active = false, disabled = false, label, onClick, children }) {
  return (
    <button
      type="button"
      className={`presentation-inline-edit-button ${active ? "neuphormism-b-btn-gold" : "neuphormism-b-btn"}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export default function PresentationInlineEditToolbar({
  blockSpacingLabel,
  decreaseBlockSpacing,
  decreaseGlobalFontSize,
  editorController,
  editorState = {},
  fontSizeLabel,
  hasDraftChanges,
  increaseBlockSpacing,
  increaseGlobalFontSize,
  isSaving,
  onDiscard,
  onSave,
  onToggleProgression,
  showProgression,
}) {
  const run = (command, value) => editorController?.run(command, value);
  const currentFontSize = editorState.fontSize || "1em";
  const currentFontSizeIndex = Math.max(0, FONT_SIZES.indexOf(currentFontSize));
  const nextFontSize = FONT_SIZES[(currentFontSizeIndex + 1) % FONT_SIZES.length];
  const nextHeadingLevel = (Number(editorState.level || 0) + 1) % 4;

  return (
    <div
      className="presentation-inline-edit-toolbar"
      role="toolbar"
      aria-label="Cifra editing tools"
    >
      <div className="presentation-inline-edit-row" data-editor-toolbar-row="1">
        <EditButton active={editorState.bold} label="Bold" onClick={() => run("bold")}>
          <FaBold />
        </EditButton>
        <EditButton active={editorState.italic} label="Italic" onClick={() => run("italic")}>
          <FaItalic />
        </EditButton>
        <EditButton active={editorState.underline} label="Underline" onClick={() => run("underline")}>
          <FaUnderline />
        </EditButton>
        <EditButton active={editorState.strike} label="Strikethrough" onClick={() => run("strike")}>
          <FaStrikethrough />
        </EditButton>
        <EditButton disabled={!editorState.canUndo} label="Undo" onClick={() => run("undo")}>
          <FaUndo />
        </EditButton>
        <EditButton disabled={!editorState.canRedo} label="Redo" onClick={() => run("redo")}>
          <FaRedo />
        </EditButton>
        <EditButton label="Clear formatting" onClick={() => run("clear")}>
          <FaEraser />
        </EditButton>
        <label
          className="presentation-inline-edit-button neuphormism-b-btn cursor-pointer"
          aria-label="Text color"
          title="Text color"
        >
          <FaPalette />
          <input
            className="sr-only"
            type="color"
            value={editorState.color || "#000000"}
            onChange={(event) => run("color", event.target.value)}
          />
        </label>
        <EditButton
          active={showProgression}
          label="Progression markers"
          onClick={onToggleProgression}
        >
          <FaMusic />
        </EditButton>
        <EditButton
          disabled={isSaving || !hasDraftChanges}
          label={isSaving ? "Saving" : "Save"}
          onClick={onSave}
        >
          <FaSave />
        </EditButton>
      </div>

      <div className="presentation-inline-edit-row" data-editor-toolbar-row="2">
        <EditButton active={editorState.align === "left"} label="Align left" onClick={() => run("align", "left")}>
          <FaAlignLeft />
        </EditButton>
        <EditButton active={editorState.align === "center"} label="Align center" onClick={() => run("align", "center")}>
          <FaAlignCenter />
        </EditButton>
        <EditButton active={editorState.align === "right"} label="Align right" onClick={() => run("align", "right")}>
          <FaAlignRight />
        </EditButton>
        <EditButton label={`Heading level ${nextHeadingLevel}`} onClick={() => run("level", nextHeadingLevel)}>
          <FaHeading />
        </EditButton>
        <EditButton label={`Selection size ${nextFontSize}`} onClick={() => run("fontSize", nextFontSize)}>
          <span className="text-sm font-black">A↗</span>
        </EditButton>
        <EditButton label={`Decrease presentation font (${fontSizeLabel})`} onClick={decreaseGlobalFontSize}>
          <span className="relative"><span className="text-sm font-black">A</span><FaMinus className="absolute -bottom-1 -right-2 h-2 w-2" /></span>
        </EditButton>
        <EditButton label={`Increase presentation font (${fontSizeLabel})`} onClick={increaseGlobalFontSize}>
          <span className="relative"><span className="text-sm font-black">A</span><FaPlus className="absolute -bottom-1 -right-2 h-2 w-2" /></span>
        </EditButton>
        <EditButton label={`Decrease block spacing (${blockSpacingLabel})`} onClick={decreaseBlockSpacing}>
          <span className="text-sm font-black">↕−</span>
        </EditButton>
        <EditButton label={`Increase block spacing (${blockSpacingLabel})`} onClick={increaseBlockSpacing}>
          <span className="text-sm font-black">↕+</span>
        </EditButton>
        <EditButton label="Discard changes" onClick={onDiscard}>
          <FaTimes />
        </EditButton>
      </div>
    </div>
  );
}
