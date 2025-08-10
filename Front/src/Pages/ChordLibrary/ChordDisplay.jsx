/* eslint-disable react/prop-types */

function ChordDiagram({ fingering, chordName }) {
  const size = 240;
  const pad = 20; // margem interna
  const stringGap = (size - pad * 2) / 5; // distância entre cordas
  const fretGap = (size - pad * 2) / 4; // distância entre trastes

  if (!fingering) {
    return (
      <div className="flex justify-center items-center">
        <svg width={size} height={size}>
          <text
            x="50%"
            y="50%"
            fontSize="14"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#666"
          >
            Sem digitação
          </text>
        </svg>
      </div>
    );
  }

  const { frets, fingers = [] } = fingering;
  const minFret = Math.min(...frets.filter((f) => f > 0));
  const offset = Number.isFinite(minFret) && minFret > 1 ? minFret - 1 : 0;

  return (
    <div className="flex justify-center items-center">
      <svg
        width={size}
        height={size}
        style={{ background: "#fff", borderRadius: 12 }}
      >
        {/* moldura */}
        <rect
          x={pad - 2}
          y={pad - 2}
          width={size - pad * 2 + 4}
          height={size - pad * 2 + 4}
          stroke="#000"
          strokeWidth={2}
          fill="none"
        />

        {/* cordas (6) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`s${i}`}
            x1={pad + i * stringGap}
            y1={pad}
            x2={pad + i * stringGap}
            y2={size - pad}
            stroke="#000"
            strokeWidth={1}
          />
        ))}

        {/* trastes (5) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`f${i}`}
            x1={pad}
            y1={pad + i * fretGap}
            x2={size - pad}
            y2={pad + i * fretGap}
            stroke="#000"
            strokeWidth={i === 0 && offset === 0 ? 6 : 1}
          />
        ))}

        {/* marcações por corda */}
        {frets.map((fret, idx) => {
          const x = pad + idx * stringGap;

          // X (muda)
          if (fret === -1) {
            return (
              <text
                key={`x${idx}`}
                x={x}
                y={pad - 6}
                fontSize={11}
                textAnchor="middle"
              >
                x
              </text>
            );
          }
          // O (solta)
          if (fret === 0) {
            return (
              <text
                key={`o${idx}`}
                x={x}
                y={pad - 6}
                fontSize={11}
                textAnchor="middle"
              >
                o
              </text>
            );
          }

          const y = pad + (fret - 0.5 - offset) * fretGap;
          return (
            <circle
              key={`c${idx}`}
              cx={x}
              cy={y}
              r={stringGap * 0.33}
              fill="#333"
            />
          );
        })}

        {/* números dos dedos */}
        {fingers.map((n, idx) => {
          const fret = frets[idx];
          if (!n || fret <= 0) return null;
          const x = pad + idx * stringGap;
          const y = pad + (fret - 0.5 - offset) * fretGap;
          return (
            <text
              key={`n${idx}`}
              x={x}
              y={y + 4}
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
            >
              {n}
            </text>
          );
        })}

        {/* indicação de posição (ex.: 3fr) */}
        {offset > 0 && (
          <text x={size - pad + 4} y={pad + fretGap / 2} fontSize={11}>
            {offset + 1}fr
          </text>
        )}
      </svg>
    </div>
  );
}

export default function ChordDisplay({ fingering, chordName }) {
  return (
    <div className="flex justify-center items-center ">
      <div className="p-5 rounded-lg shadow-lg bg-white">
        <ChordDiagram fingering={fingering} chordName={chordName} />
      </div>
    </div>
  );
}
