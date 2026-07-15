import { useRef } from "react";

export default function DrumKnob({ label, value, onChange }) {
  const dragRef = useRef(null);
  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { y: event.clientY, value };
  };
  const move = (event) => {
    if (!dragRef.current) return;
    onChange(Math.max(0, Math.min(100, Math.round(dragRef.current.value + (dragRef.current.y - event.clientY) / 1.5))));
  };
  const end = () => { dragRef.current = null; };
  return <label className="drum-knob-control" title={`${label}: ${value}% — drag up/down`}>
    <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <span className="drum-knob" style={{ "--knob-angle": `${-135 + value * 2.7}deg` }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onDoubleClick={() => onChange(50)}><i /></span>
    <b>{label}</b>
  </label>;
}
