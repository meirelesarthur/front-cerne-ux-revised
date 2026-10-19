/**
 * Utilitário para limpeza completa do Service Worker e caches
 * Especialmente útil para resolver problemas com workbox-precache
 */

export interface CleanerOptions {
  onProgress?: (message: string) => void;
  clearStorage?: boolean;
}

export async function cleanServiceWorkerAndCache(
  options: CleanerOptions = {},
): Promise<boolean> {
  const { onProgress, clearStorage = true } = options;

  try {
    onProgress?.("🧹 Iniciando limpeza completa...");

    // 1. Limpar TODOS os caches (prioridade para workbox-precache)
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      onProgress?.(`📦 Encontrados ${cacheNames.length} caches`);

      // Deletar workbox-precache primeiro
      const workboxCaches = cacheNames.filter((name) =>
        name.includes("workbox-precache"),
      );

      for (const cacheName of workboxCaches) {
        const deleted = await caches.delete(cacheName);
        onProgress?.(`${deleted ? "✅" : "❌"} Workbox cache: ${cacheName}`);
      }

      // Depois deletar os outros caches
      const otherCaches = cacheNames.filter(
        (name) => !name.includes("workbox-precache"),
      );

      for (const cacheName of otherCaches) {
        const deleted = await caches.delete(cacheName);
        onProgress?.(`${deleted ? "✅" : "❌"} Cache: ${cacheName}`);
      }
    }

    // 2. Desregistrar TODOS os service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      onProgress?.(`🔧 Encontrados ${registrations.length} Service Workers`);

      for (const registration of registrations) {
        const unregistered = await registration.unregister();
        onProgress?.(
          `${unregistered ? "✅" : "❌"} Service Worker desregistrado`,
        );
      }

      // Aguardar um pouco para garantir que foi desregistrado
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 3. Limpar localStorage e sessionStorage relacionados ao SW (opcional)
    if (clearStorage) {
      try {
        const keysToRemove: string[] = [];

        // localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("workbox") ||
              key.includes("pwa") ||
              key.includes("sw"))
          ) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));

        if (keysToRemove.length > 0) {
          onProgress?.(`🗑️ LocalStorage limpo: ${keysToRemove.join(", ")}`);
        }
      } catch (err) {
        console.warn("⚠️ Erro ao limpar localStorage:", err);
      }
    }

    onProgress?.("✅ Limpeza completa realizada com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro durante limpeza:", error);
    onProgress?.("❌ Erro durante limpeza");
    return false;
  }
}

/**
 * Verifica se há caches do workbox que podem estar causando problemas
 */
export async function checkWorkboxCache(): Promise<{
  hasWorkboxCache: boolean;
  cacheNames: string[];
}> {
  if (!("caches" in window)) {
    return { hasWorkboxCache: false, cacheNames: [] };
  }

  const allCaches = await caches.keys();
  const workboxCaches = allCaches.filter(
    (name) =>
      name.includes("workbox-precache") || name.includes("workbox-runtime"),
  );

  return {
    hasWorkboxCache: workboxCaches.length > 0,
    cacheNames: workboxCaches,
  };
}

/**
 * Força um hard reload (equivalente a Ctrl+F5)
 */
export function forceHardReload(): void {
  // Adicionar timestamp para forçar bypass do cache
  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", Date.now().toString());
  window.location.href = url.toString();
}
