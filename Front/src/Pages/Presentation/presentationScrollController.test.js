import {
  getRegisteredScrollController,
  getRegisteredScrollViewport,
  getScrollControllerState,
  registerScrollController,
  registerScrollViewport,
  subscribeToScrollController,
  unregisterScrollController,
  unregisterScrollViewport,
  updateScrollControllerState,
} from "./presentationScrollController";

describe("presentationScrollController", () => {
  beforeEach(() => {
    delete window.__liveNloudScrollController;
  });

  it("starts with the default state", () => {
    expect(getScrollControllerState()).toEqual({
      autoScrollActive: false,
      speed: 3,
      speedMode: "desktop",
      verticalMode: "page",
    });
  });

  it("updates the global state and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToScrollController(listener);

    updateScrollControllerState({ autoScrollActive: true, speed: 5 });

    expect(getScrollControllerState()).toEqual({
      autoScrollActive: true,
      speed: 5,
      speedMode: "desktop",
      verticalMode: "page",
    });
    expect(listener).toHaveBeenCalledWith({
      autoScrollActive: true,
      speed: 5,
      speedMode: "desktop",
      verticalMode: "page",
    });

    unsubscribe();
  });

  it("registers and unregisters controller and viewport references", () => {
    const controller = { start: vi.fn() };
    const viewport = { scrollTop: 0 };

    registerScrollController(controller);
    registerScrollViewport(viewport);

    expect(getRegisteredScrollController()).toBe(controller);
    expect(getRegisteredScrollViewport()).toBe(viewport);

    unregisterScrollController(controller);
    unregisterScrollViewport(viewport);

    expect(getRegisteredScrollController()).toBeNull();
    expect(getRegisteredScrollViewport()).toBeNull();
  });
});
