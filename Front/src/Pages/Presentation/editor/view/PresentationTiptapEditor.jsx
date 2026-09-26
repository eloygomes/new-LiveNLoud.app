import { useEffect, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { PresentationEditorController } from "../controller/PresentationEditorController";
import { fitTablatureBlocksToColumns } from "./fitTablatureToColumn";

export default function PresentationTiptapEditor({
  document,
  editable = false,
  horizontal,
  onFocus,
  onReady,
  onStateChange,
  onUpdate,
  transposeSteps = 0,
}) {
  const [controller, setController] = useState(null);

  useEffect(() => {
    const nextController = new PresentationEditorController({
      document,
      editable,
      horizontal,
      onFocus,
      onStateChange,
      onUpdate,
    });
    setController(nextController);
    onReady?.(nextController);

    return () => {
      onReady?.(null);
      nextController.destroy();
    };
  }, []);

  useEffect(() => {
    controller?.setHorizontal(horizontal);
  }, [controller, horizontal]);

  useEffect(() => {
    controller?.setEditable(editable);
  }, [controller, editable]);

  useEffect(() => {
    controller?.setTransposeSteps(transposeSteps);
  }, [controller, transposeSteps]);

  useEffect(() => {
    const root = controller?.getEditor()?.view?.dom;
    if (!root || typeof window === "undefined") return undefined;

    let disposed = false;
    let frameId = null;
    const scheduleFit = () => {
      if (disposed) return;
      if (frameId !== null) window.cancelAnimationFrame?.(frameId);
      if (window.requestAnimationFrame) {
        frameId = window.requestAnimationFrame(() => {
          frameId = null;
          fitTablatureBlocksToColumns(root);
        });
      } else {
        fitTablatureBlocksToColumns(root);
      }
    };

    const mutationObserver = typeof MutationObserver === "function"
      ? new MutationObserver(scheduleFit)
      : null;
    mutationObserver?.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleFit)
      : null;
    resizeObserver?.observe(root);
    if (root.parentElement) resizeObserver?.observe(root.parentElement);
    window.addEventListener("resize", scheduleFit);
    document.fonts?.ready?.then(scheduleFit);
    scheduleFit();

    return () => {
      disposed = true;
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleFit);
      if (frameId !== null) window.cancelAnimationFrame?.(frameId);
    };
  }, [controller, horizontal]);

  if (!controller) return null;

  return <EditorContent editor={controller.getEditor()} />;
}
