import { describe, expect, it } from "vitest";
import { fitTablatureBlocksToColumns } from "./fitTablatureToColumn";

function createTabBlock({ availableWidth, naturalWidth }) {
  const root = document.createElement("div");
  const block = document.createElement("div");
  const heading = document.createElement("span");
  const tabLine = document.createElement("span");

  block.className = "presentation-editor-tab-block";
  block.style.fontSize = "16px";
  block.style.padding = "0";
  heading.textContent = "C5";
  tabLine.className = "presentation-editor-tab-line";
  tabLine.style.fontSize = "16px";
  tabLine.textContent = "E|--------------------------------|";
  Object.defineProperty(block, "clientWidth", { value: availableWidth });
  Object.defineProperty(tabLine, "scrollWidth", { value: naturalWidth });
  tabLine.getBoundingClientRect = () => ({ width: naturalWidth });

  block.append(heading, document.createElement("br"), tabLine);
  root.append(block);
  return { root, block, heading, tabLine };
}

describe("fitTablatureBlocksToColumns", () => {
  it("scales only tablature lines when their natural width exceeds the column", () => {
    const { root, block, heading, tabLine } = createTabBlock({
      availableWidth: 320,
      naturalWidth: 640,
    });

    expect(fitTablatureBlocksToColumns(root)).toEqual([0.5]);
    expect(block.style.getPropertyValue("--presentation-tab-fit-font-size"))
      .toBe("8px");
    expect(block.dataset.tabFitScale).toBe("0.5000");
    expect(heading.style.fontSize).toBe("");
    expect(tabLine.className).toBe("presentation-editor-tab-line");
  });

  it("keeps the original tab size when it already fits", () => {
    const { root, block } = createTabBlock({
      availableWidth: 640,
      naturalWidth: 320,
    });

    expect(fitTablatureBlocksToColumns(root)).toEqual([1]);
    expect(block.style.getPropertyValue("--presentation-tab-fit-font-size"))
      .toBe("");
    expect(block.dataset.tabFitScale).toBeUndefined();
  });
});
