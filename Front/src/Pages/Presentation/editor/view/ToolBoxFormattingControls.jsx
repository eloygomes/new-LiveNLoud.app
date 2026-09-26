const FORMAT_ACTIONS = [
  ["bold", "B", "Bold"],
  ["italic", "I", "Italic"],
  ["underline", "U", "Underline"],
  ["strike", "S", "Strike"],
  ["undo", "↶", "Undo"],
  ["redo", "↷", "Redo"],
  ["clear", "Clear", "Clear formatting"],
];

export default function ToolBoxFormattingControls({ controller, state = {} }) {
  if (!controller) return null;

  return (
    <div className="space-y-3" aria-label="Text formatting controls">
      <div className="grid grid-cols-4 gap-2">
        {FORMAT_ACTIONS.map(([command, label, ariaLabel]) => (
          <button
            key={command}
            type="button"
            className={`neuphormism-b-btn min-h-9 rounded-[10px] px-2 text-xs font-bold ${
              state[command] ? "bg-[goldenrod]" : ""
            }`}
            onClick={() => controller.run(command)}
            disabled={command === "undo" ? !state.canUndo : command === "redo" ? !state.canRedo : false}
            aria-label={ariaLabel}
            aria-pressed={["bold", "italic", "underline", "strike"].includes(command) ? Boolean(state[command]) : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["left", "center", "right"].map((align) => (
          <button
            key={align}
            type="button"
            className={`neuphormism-b-btn min-h-9 rounded-[10px] px-2 text-xs font-bold ${state.align === align ? "bg-[goldenrod]" : ""}`}
            onClick={() => controller.run("align", align)}
            aria-label={`Align ${align}`}
          >
            {align[0].toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[0.68rem] font-bold uppercase tracking-[0.12em]">
          Structure
          <select
            className="mt-1 w-full rounded-[10px] bg-white p-2 text-xs"
            value={state.level || 0}
            onChange={(event) => controller.run("level", event.target.value)}
          >
            <option value="0">Body</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </label>
        <label className="text-[0.68rem] font-bold uppercase tracking-[0.12em]">
          Selection size
          <select
            className="mt-1 w-full rounded-[10px] bg-white p-2 text-xs"
            defaultValue=""
            onChange={(event) => event.target.value && controller.run("fontSize", event.target.value)}
          >
            <option value="">Default</option>
            <option value="0.8em">Small</option>
            <option value="1em">Normal</option>
            <option value="1.25em">Large</option>
            <option value="1.5em">XL</option>
          </select>
        </label>
      </div>
      <label className="flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.12em]">
        Text color
        <input
          type="color"
          defaultValue="#111111"
          onChange={(event) => controller.run("color", event.target.value)}
          aria-label="Text color"
        />
      </label>
    </div>
  );
}
