import { useMemo } from "react";
import { processSongCifra } from "../ProcessSongCifra";
import { inferDisplayKey, transposeCifra } from "../transposeCifra";
import { shouldDropBlankLinesForPresentationFlow } from "../presentationLayoutHelpers";
import { buildProgressionBlocks } from "../helpers/presentationUtils";
import { buildProgressionRenderModel } from "../helpers/progressionRenderModel";

export function usePresentationRenderModel({
  contentSelected,
  isExpandedCifra,
  isTwoColumns,
  progressionMarkOverrides,
  transposeSteps,
}) {
  const shouldUseTwoColumns = isTwoColumns;
  const shouldUseHorizontalColumnFlow = isExpandedCifra && shouldUseTwoColumns;
  const shouldDropBlankLinesForHorizontalFlow =
    shouldDropBlankLinesForPresentationFlow({
      shouldUseHorizontalColumnFlow,
    });
  const shouldUseExpandedVerticalFlow = isExpandedCifra && !shouldUseTwoColumns;

  const transposedContent = useMemo(
    () => transposeCifra(contentSelected, transposeSteps),
    [contentSelected, transposeSteps],
  );
  const displayKey = useMemo(
    () => inferDisplayKey(transposedContent || contentSelected),
    [contentSelected, transposedContent],
  );

  const htmlBlocks = useMemo(() => {
    const isParsableString =
      typeof transposedContent === "string" &&
      transposedContent.trim() !== "" &&
      transposedContent !== "Loading...";

    if (!isParsableString) return [];

    try {
      return processSongCifra(transposedContent).htmlBlocks || [];
    } catch (error) {
      console.warn("processSongCifra falhou, usando fallback vazio:", error);
      return [];
    }
  }, [transposedContent]);

  const visibleContentBlocks = useMemo(
    () =>
      buildProgressionBlocks(htmlBlocks, {
        dropBlankLines: shouldDropBlankLinesForHorizontalFlow,
      }),
    [htmlBlocks, shouldDropBlankLinesForHorizontalFlow],
  );

  const progressionRenderModel = useMemo(
    () =>
      buildProgressionRenderModel({
        visibleContentBlocks,
        progressionMarkOverrides,
        shouldUseHorizontalColumnFlow,
      }),
    [
      progressionMarkOverrides,
      shouldUseHorizontalColumnFlow,
      visibleContentBlocks,
    ],
  );

  return {
    activeProgressionRenderColumns: progressionRenderModel.activeColumns,
    displayKey,
    shouldUseExpandedVerticalFlow,
    shouldUseHorizontalColumnFlow,
    shouldUseTwoColumns,
    visibleContentBlocks,
  };
}
