export interface Home {
  /** Heading principal, ex. "Bom dia, vamos começar!" */
  greeting: string;
  /** Placeholder da busca decorativa. */
  searchPlaceholder: string;
  /** Descrição curta por módulo (chave = id do módulo em navigationTree.ts). */
  moduleDescriptions: Record<string, string>;
  panels: {
    recentAccess: { title: string; action: string };
    farms: { title: string; action: string; addButton: string };
    favorites: { title: string; action: string };
  };
  farmStatus: { active: string; inactive: string };
}
