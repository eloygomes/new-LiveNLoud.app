const OPTIONAL_LARGE_STORAGE_KEYS = [
  "cifraFROMDB",
  "dashboardVisibleSongs",
  "offline:songs",
];

function isQuotaExceededError(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014
  );
}

function clearOptionalLargeStorage(exceptKey) {
  if (typeof window === "undefined") return;

  OPTIONAL_LARGE_STORAGE_KEYS.forEach((key) => {
    if (key !== exceptKey) {
      window.localStorage.removeItem(key);
    }
  });

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("presentation:layouts:"))
    .forEach((key) => {
      if (key !== exceptKey) {
        window.localStorage.removeItem(key);
      }
    });
}

export function setLocalStorageItemSafe(key, value, options = {}) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar "${key}" no localStorage:`, error);

    if (!isQuotaExceededError(error)) {
      return false;
    }

    clearOptionalLargeStorage(key);

    if (options.retryAfterCleanup === false) {
      return false;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (retryError) {
      console.error(`Erro ao salvar "${key}" após limpar cache local:`, retryError);
      return false;
    }
  }
}

export function setLocalStorageJsonSafe(key, value, options = {}) {
  return setLocalStorageItemSafe(key, JSON.stringify(value), options);
}
