// ============================================
// storageUtils - Utilitários para gerenciamento de localStorage
// ============================================

/**
 * Remove um item específico do localStorage
 */
export function clearPaginatedQueryStorage(storageKey: string): void {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(
      `Falha ao remover o item do localStorage (key: ${storageKey}):`,
      error,
    );
  }
}

/**
 * Remove todas as chaves do localStorage que contêm uma substring específica
 */
export function clearLocalStorageByKeySubstring(substring: string): void {
  if (typeof window === "undefined" || !substring) {
    return;
  }

  try {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(substring)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
    });

    if (keysToDelete.length > 0) {
      console.log(
        `🗑️ [storageUtils] ${keysToDelete.length} item(s) removidos do localStorage com chave contendo "${substring}".`,
      );
    }
  } catch (error) {
    console.error(
      `Falha ao tentar limpar o localStorage pela substring "${substring}":`,
      error,
    );
  }
}

/**
 * Remove todas as chaves de paginação do localStorage
 */
export function clearAllPaginatedQueryStorage(): void {
  clearLocalStorageByKeySubstring("storageKeyGB");
}

/**
 * Salva o path atual da sidebar e limpa dados de paginação
 * IMPORTANTE: Limpa SEMPRE que navega, não apenas quando muda de módulo
 */
export function savePathAndClearStorage(newPath: string): void {
  const currentPath = sessionStorage.getItem("pathSidbar") || "";
  
  // Se o path mudou, limpar storage de paginação
  if (currentPath !== newPath) {
    console.log(
      `🔄 [storageUtils] Path mudou de "${currentPath}" para "${newPath}". Limpando storage...`
    );
    clearLocalStorageByKeySubstring("storageKeyGB");
  }
  
  // Salvar novo path
  sessionStorage.setItem("pathSidbar", newPath);
}

/**
 * Obtém o path atual da sidebar
 */
export function getPathSidbar(): string {
  return sessionStorage.getItem("pathSidbar") || "";
}

/**
 * Verifica se o módulo mudou e limpa storage se necessário
 */
export function checkAndClearOnModuleChange(
  currentPath: string,
  newPath: string
): boolean {
  const currentModule = currentPath.split("/")[1];
  const newModule = newPath.split("/")[1];

  if (currentModule !== newModule) {
    console.log(
      `🔄 [storageUtils] Módulo mudou de "${currentModule}" para "${newModule}". Limpando storage...`
    );
    clearLocalStorageByKeySubstring("storageKeyGB");
    return true;
  }

  return false;
}
