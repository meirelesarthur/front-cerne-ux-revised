export interface Sidebar {
  /** Dicionário achatado id-da-árvore-de-navegação -> label traduzido.
   * As chaves são os `id`s de módulos/grupos/itens de navigationTree.ts.
   * Uso: languageGB.sidebar.navigation[node.id] ?? node.label (fallback pro
   * texto PT-BR hardcoded que já está em navigationTree.ts, por segurança). */
  navigation: Record<string, string>;
  expandSidebar: string;
  collapseSidebar: string;
  /** Texto default do ModulePlaceholder quando nenhuma `description` é passada. */
  placeholderDescription: string;
}
