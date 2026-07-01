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
    if (!isQuotaExceededError(error)) {
      console.error(`Erro ao salvar "${key}" no localStorage:`, error);
      return false;
    }

    console.warn(`Cache local cheio ao salvar "${key}". Limpando dados opcionais.`);
    clearOptionalLargeStorage(key);
    if (OPTIONAL_LARGE_STORAGE_KEYS.includes(key)) {
      window.localStorage.removeItem(key);
    }

    if (options.retryAfterCleanup === false) {
      return false;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn(
        `Nao foi possivel salvar "${key}" no cache local apos limpar dados opcionais. Cache local ignorado.`,
      );
      return false;
    }
  }
}

export function setLocalStorageJsonSafe(key, value, options = {}) {
  return setLocalStorageItemSafe(key, JSON.stringify(value), options);
}
