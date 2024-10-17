/* eslint-disable react/prop-types */

function GuitarChordSVG({ strings, fingering, chordName }) {
  //   console.log("chordName", chordName);
  //   console.log("fingering", fingering);
  //   console.log("strings", strings);

  // Função para obter a posição e os dedos a partir das strings e fingering
  const getFingerPositions = () => {
    const stringArray = strings.split(" ");
    const fingerArray = fingering.split(" ");

    return stringArray.map((pos, index) => ({
      fret: pos === "X" ? "X" : parseInt(pos),
      finger: fingerArray[index],
      string: index + 1,
    }));
  };

  const fingerPositions = getFingerPositions();
  //   console.log("fingerPositions", fingerPositions);

  return (
    <div className="flex justify-center items-center">
      <svg
        height="162"
        version="1.1"
        width="147"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 147 162"
        className="overflow-hidden"
        transform="scale(1, -1)"
      >
        {/* Linhas verticais para as cordas */}
        {[20, 47, 74, 101, 128].map((x, i) => (
          <path key={i} fill="none" stroke="#444444" d={`M${x},36L${x},130`} />
        ))}
        {/* Linhas horizontais para os trastes */}
        {[36, 54.8, 73.6, 92.4, 111.2, 130].map((y, i) => (
          <path key={i} fill="none" stroke="#444444" d={`M20,${y}L128,${y}`} />
        ))}
        {/* Retângulo que representa o nut (capo) */}
        <rect x="16" y="36" width="4" height="94" fill="#444444" />
        {/* Adicionar círculos para cada posição dos dedos */}
        {fingerPositions.map((pos, index) => {
          //   console.log("pos", pos);

          const xPosition = 20 + pos.fret * 27; // Ajuste para posicionar nas cordas
          const yPosition = pos.fret === "X" ? 0 : 36 + (pos.string - 1) * 18.8;
          //   console.log(yPosition);

          return pos.fret !== "X" ? (
            <g
              key={index}
              transform={`translate(0, ${2 * yPosition}) scale(1, -1)`} // Inverte verticalmente
            >
              <circle cx={xPosition} cy={yPosition} r="8" fill="#444444" />
              <text
                x={xPosition}
                y={yPosition}
                textAnchor="middle"
                fontFamily="Arial"
                fontSize="10px"
                fill="#ffffff"
                dy="3"
              >
                {pos.finger}
              </text>
            </g>
          ) : (
            <g key={index}>
              <text
                x={xPosition - 10}
                y={yPosition}
                fontFamily="Arial"
                fontSize="10px"
                fill="#444444"
              >
                X
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ChordDisplay({ strings, fingering, chordName }) {
  const chordData = {
    strings,
    fingering,
    chordName,
  };

  return (
    <div className="flex justify-center items-center ">
      <div className="p-5 rounded-lg shadow-lg bg-white">
        <GuitarChordSVG {...chordData} />
      </div>
    </div>
  );
}

export default ChordDisplay;
