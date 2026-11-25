export interface Sidebar {
  /** Dicionário achatado id-da-árvore-de-navegação -> label traduzido.
   * As chaves são os `id`s de módulos/grupos/itens de navigationTree.ts.
   * Uso: languageGB.sidebar.navigation[node.id] ?? node.label (fallback pro
   * texto PT-BR hardcoded que já está em navigationTree.ts, por segurança). */
  navigation: Record<string, string>;
  /** Descrição curta por id de item (cards da central de agrupador). Opcional por item. */
  descriptions: Record<string, string>;
  expandSidebar: string;
  collapseSidebar: string;
  /** Texto default do ModulePlaceholder quando nenhuma `description` é passada. */
  placeholderDescription: string;
  /** Central genérica do agrupador (clique no rótulo do grupo no menu). */
  groupHub: {
    /** "{count}" = nº de funcionalidades; "{module}" = módulo. */
    subtitle: string;
    subtitleOne: string;
    cardsAriaLabel: string;
    notFoundTitle: string;
    notFoundDescription: string;
    /** aria-label do rótulo do grupo; "{group}" = nome do grupo. */
    openHub: string;
    /** aria-label do chevron; "{group}" = nome do grupo. */
    toggleGroup: string;
  };
}
