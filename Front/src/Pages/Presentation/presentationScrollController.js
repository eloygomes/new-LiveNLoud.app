const GLOBAL_KEY = "__liveNloudScrollController";

const defaultState = {
  autoScrollActive: false,
  speed: 3,
  verticalMode: "page",
};

function getStore() {
  if (!window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = {
      state: { ...defaultState },
      listeners: new Set(),
      controller: null,
      viewport: null,
    };
  }

  return window[GLOBAL_KEY];
}

export function getScrollControllerState() {
  return { ...getStore().state };
}

export function subscribeToScrollController(listener) {
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

export function updateScrollControllerState(partialState) {
  const store = getStore();
  store.state = { ...store.state, ...partialState };
  store.listeners.forEach((listener) => listener({ ...store.state }));
}

export function registerScrollController(controller) {
  getStore().controller = controller;
}

export function unregisterScrollController(controller) {
  const store = getStore();
  if (store.controller === controller) {
    store.controller = null;
  }
}

export function getRegisteredScrollController() {
  return getStore().controller;
}

export function registerScrollViewport(viewport) {
  getStore().viewport = viewport;
}

export function unregisterScrollViewport(viewport) {
  const store = getStore();
  if (store.viewport === viewport) {
    store.viewport = null;
  }
}

export function getRegisteredScrollViewport() {
  return getStore().viewport;
}
