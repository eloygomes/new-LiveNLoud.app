/* eslint-disable import/no-unresolved */
import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Line, Rect, Circle, Text as SvgText } from "react-native-svg";

export type Fingering = { frets: number[]; fingers?: number[] };

interface Props {
  /** Objeto contendo as casas a serem pressionadas.
   *  Usar -1 para corda abafada, 0 para solta. */
  fingering: Fingering | undefined;
  /** Tamanho em px do quadrado que conterá o diagrama (default = 160). */
  size?: number;
}

/** ------------------------------------------------------------------
 *  Apenas desenha o acorde; não há pickers nem estados internos.
 *  Use assim:
 *     <ChordShape fingering={CHORD_DB[chordKey]} />
 *  ------------------------------------------------------------------ */
export default function ChordShape({ fingering, size = 160 }: Props) {
  if (!fingering) {
    /* caso acorde não exista no DB */
    return (
      <Svg width={size} height={size}>
        <SvgText
          x="50%"
          y="50%"
          fontSize={14}
          alignmentBaseline="central"
          textAnchor="middle"
          fill="#666"
        >
          Sem digitação
        </SvgText>
      </Svg>
    );
  }

  const { frets, fingers } = fingering;

  /* —— cálculos de posição ——————————————— */
  const pad = 20; // margem interna
  const stringGap = (size - pad * 2) / 5; // distância entre cordas
  const fretGap = (size - pad * 2) / 4; // distância entre trastes

  const minFret = Math.min(...frets.filter((f) => f > 0));
  const offset = minFret > 1 ? minFret - 1 : 0; // desloca se começa acima da 1ª casa

  return (
    <Svg
      width={size}
      height={size}
      style={[styles.svg, { transform: [{ scaleX: -1 }] }]}
    >
      {/* moldura */}
      <Rect
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
        <Line
          key={`s${i}`}
          x1={pad + i * stringGap}
          y1={pad}
          x2={pad + i * stringGap}
          y2={size - pad}
          stroke="#000"
          strokeWidth={1}
        />
      ))}

      {/* trastes (5 linhas horizontais) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Line
          key={`f${i}`}
          x1={pad}
          y1={pad + i * fretGap}
          x2={size - pad}
          y2={pad + i * fretGap}
          stroke="#000"
          strokeWidth={i === 0 && offset === 0 ? 6 : 1} // pestana na 1ª casa
        />
      ))}

      {/* marcações por corda */}
      {frets.map((fret, idx) => {
        const x = pad + idx * stringGap;

        // X (muda)
        if (fret === -1) {
          return (
            <SvgText
              key={`x${idx}`}
              x={x}
              y={pad - 6}
              fontSize={11}
              textAnchor="middle"
            >
              x
            </SvgText>
          );
        }

        // O (corda solta)
        if (fret === 0) {
          return (
            <SvgText
              key={`o${idx}`}
              x={x}
              y={pad - 6}
              fontSize={11}
              textAnchor="middle"
            >
              o
            </SvgText>
          );
        }

        // bolinha da nota
        const y = pad + (fret - 0.5 - offset) * fretGap;
        return (
          <Circle
            key={`c${idx}`}
            cx={x}
            cy={y}
            r={stringGap * 0.33}
            fill="#333"
          />
        );
      })}

      {/* números dos dedos (opcional) */}
      {fingers?.map((n, idx) => {
        const fret = frets[idx];
        if (fret <= 0) return null;
        const x = pad + idx * stringGap;
        const y = pad + (fret - 0.5 - offset) * fretGap;
        return (
          <SvgText
            key={`n${idx}`}
            x={x}
            y={y + 4}
            fontSize={9}
            fill="#fff"
            textAnchor="middle"
            transform={`scale(-1,1) translate(${-2 * x}, 0)`}
          >
            {n}
          </SvgText>
        );
      })}

      {/* indicação de posição (ex.: “3fr”) */}
      {/* {offset > 0 && (
        <SvgText x={size - pad + 4} y={pad + fretGap / 2} fontSize={11}>
          {offset + 1}fr
        </SvgText>
      )} */}
      {/* indicação de posição (ex.: “3fr”) */}
      {offset > 0 &&
        (() => {
          const xOut = size - pad + 18; // empurra para fora da moldura
          const yMid = pad + fretGap / 2; // meio da 1ª casa

          return (
            <SvgText
              x={xOut}
              y={yMid}
              fontSize={11}
              alignmentBaseline="middle"
              textAnchor="start"
              // contra‑transformação para manter o texto legível
              transform={`scale(-1,1) translate(${-2 * xOut}, 0)`}
            >
              {offset + 1}fr
            </SvgText>
          );
        })()}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 3, // Android
    shadowColor: "#000", // iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
