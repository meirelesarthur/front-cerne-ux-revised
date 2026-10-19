// src/hooks/useHeaderSearchIndex.ts
// Índice de busca do Header — monta um array PLANO de itens navegáveis a
// partir do menu já filtrado por permissão (`useMenuModules()`, NUNCA
// reimplementar a poda aqui) e traduzido para o idioma ativo
// (`useLanguage().languageGB.sidebar.navigation`).
//
// Hook puro (sem chamada de API): índice em memória, síncrono, recalculado
// via `useMemo` só quando a árvore podada ou o idioma mudam. Consumido por
// `HeaderSearchResults`/`HeaderSearch` (TASK-FE-902/903).
//
// Referência UX: `GB.Cerne.UX/src/components/SearchBar.tsx` (`buildIndex`) —
// mesma forma de item (id/label/moduleId/moduleLabel/groupLabel/path), sem
// `moduleIcon` (Gate 4 do plano: ícone genérico único por linha, decidido em
// TASK-FE-902, não ícone por módulo).

import { useMemo } from "react";

import { useLanguage } from "@/hooks/useLanguage";
import { useMenuModules } from "@/hooks/useMenuModules";

export interface SearchItem {
  id: string;
  /** Traduzido: languageGB.sidebar.navigation[id] ?? item.label (mesmo fallback do breadcrumb do Header). */
  label: string;
  path: string;
  moduleId: string;
  moduleLabel: string;
  groupLabel?: string;
}

// Separador do breadcrumb — mesmo caractere/estilo já usado pelo cerne para
// encadear módulo/grupo (`HeaderSearchResults.tsx`, `Header/index.tsx`:
// "Início › [Módulo] › [Item]"); não inventar separador novo.
const BREADCRUMB_SEP = ' › ';

// Forma estrutural mínima para a recursão — compatível com `NavSubItem`
// (`navigationTree.ts`) e com `Omit<NavSubItem, "children">` (o tipo atual
// dos filhos de 1º nível), sem importar o tipo concreto: `children` é
// opcional, então um nó sem esse campo (o caso hoje) ainda satisfaz esta
// forma. Mantém a indexação recursiva DEFENSIVA para profundidade arbitrária
// caso a árvore ganhe netos-de-netos no futuro, mesmo que o tipo atual da
// árvore só modele 1 nível de `children`.
interface IndexableNavNode {
  id: string;
  label: string;
  path?: string;
  children?: IndexableNavNode[];
}

// Indexa um item e recursa em `item.children` (profundidade arbitrária).
// - Só empilha o item em `items` se ele tiver `path` (item-pai que é só
//   cabeçalho, sem `path`, nunca vira resultado navegável).
// - SEMPRE recursa em `children`, mesmo quando o próprio item não tem `path`.
// - `groupLabel` encadeia: filho direto do grupo → label do grupo (igual
//   hoje); descendente sob um item-pai → `<groupLabel anterior><SEP><label
//   do item-pai>` (ex.: "Pecuária › Reprodução"). Para `flatItems` (sem
//   grupo), o breadcrumb do descendente começa no label do item-pai.
function indexNavNode(
  items: SearchItem[],
  node: IndexableNavNode,
  moduleId: string,
  moduleLabel: string,
  groupLabel: string | undefined,
  nav: Record<string, string>
): void {
  const label = nav[node.id] ?? node.label;

  if (node.path) {
    items.push({
      id: node.id,
      label,
      path: node.path,
      moduleId,
      moduleLabel,
      groupLabel,
    });
  }

  for (const child of node.children ?? []) {
    const childGroupLabel = groupLabel ? `${groupLabel}${BREADCRUMB_SEP}${label}` : label;
    indexNavNode(items, child, moduleId, moduleLabel, childGroupLabel, nav);
  }
}

export function useHeaderSearchIndex(): SearchItem[] {
  const modules = useMenuModules();
  const { languageGB } = useLanguage();

  return useMemo(() => {
    const nav = languageGB.sidebar.navigation;
    const items: SearchItem[] = [];

    for (const mod of modules) {
      // Favoritos é dinâmico/placeholder (mesma ressalva de useMenuModules.ts)
      // — busca indexa só itens navegáveis reais.
      if (mod.id === "favoritos") continue;

      const moduleLabel = nav[mod.id] ?? mod.label;

      for (const item of mod.flatItems ?? []) {
        indexNavNode(items, item, mod.id, moduleLabel, undefined, nav);
      }

      for (const group of mod.groups ?? []) {
        const groupLabel = nav[group.id] ?? group.label;
        for (const item of group.items) {
          indexNavNode(items, item, mod.id, moduleLabel, groupLabel, nav);
        }
      }
    }

    return items;
  }, [modules, languageGB]);
}

export default useHeaderSearchIndex;
