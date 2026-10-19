// src/hooks/useMenuModules.ts
// Árvore de navegação FILTRADA pelas permissões do usuário logado.
//
// Consome a árvore estática (`navigationTree.ts`, porte 1:1 do design system)
// e o mapa `navigationPermissions.ts` (item.id → permissão exigida), podando:
// - item-folha sem permissão do usuário → some;
// - grupo sem nenhum item visível → some;
// - módulo sem nenhum grupo/item visível → some (exceto módulos com `path`
//   próprio e sem filhos, ex.: Home, que são sempre visíveis).
//
// Todos os consumidores do menu (NavRail, SecondaryNav via DashboardLayout,
// cards da Home) devem usar ESTE hook em vez de importar `menuModules` direto
// — assim usuário sem a permissão não vê o item em nenhuma superfície.

import { useMemo } from "react";
import { useContextSelector } from "use-context-selector";

import {
  getAllModuleItems,
  menuModules,
  type NavGroup,
  type NavModule,
  type NavSubItem,
} from "@/config/v2/navigationTree";
import { navigationPermissions } from "@/config/v2/navigationPermissions";
import { AuthContext } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

type Checker = {
  can: (p: string) => boolean;
  canAny: (ps: string[]) => boolean;
  hasFarm: boolean;
  isFarmScoped: (p: string) => boolean;
  /**
   * Papel (Spatie role). Opcional só por compatibilidade com chamadores
   * antigos: regra com `role` e sem `hasRole` NEGA (fail-closed).
   */
  hasRole?: (role: string) => boolean;
};

/**
 * Resolve a regra efetiva de um item, seguindo `sameAs` (1 salto) — favoritos
 * herdam a regra do item-alvo, nunca têm permissão própria (regra do legado).
 */
export function ruleForNavId(id: string) {
  const rule = navigationPermissions[id];
  if (rule?.sameAs) return navigationPermissions[rule.sameAs];
  return rule;
}

/**
 * Regra satisfeita? (sem regra = visível para qualquer autenticado)
 *
 * Farm-scoping (GAP-BE-033): uma permissão farm-scoped só libera o item com
 * fazenda ativa — mas farm-scoping nunca CONCEDE acesso, só RESTRINGE (o
 * `can(...)` continua obrigatório antes do check de fazenda, então quem não
 * tem a permissão continua sem ver o item, com ou sem fazenda). `anyOf` é
 * avaliado por-permissão (`.some`), não agregado via `canAny`, porque um
 * `anyOf` poderia em tese misturar permissões farm-scoped e não-farm-scoped.
 */
export function ruleAllows(
  rule: ReturnType<typeof ruleForNavId>,
  { can, hasFarm, isFarmScoped, hasRole }: Checker
): boolean {
  if (!rule) return true;

  // `role` é ADITIVO (execução 079 / DD-079-05): exige o papel ALÉM da
  // permissão/anyOf abaixo, nunca no lugar deles. Regras sem `role` seguem
  // exatamente o caminho anterior.
  if (rule.role && !hasRole?.(rule.role)) return false;

  if (rule.permission) {
    if (!can(rule.permission)) return false;
    return hasFarm || !isFarmScoped(rule.permission);
  }

  if (rule.anyOf?.length) {
    return rule.anyOf.some((p) => can(p) && (hasFarm || !isFarmScoped(p)));
  }

  return true;
}

/** Item visível: sem regra registrada (default aberto) ou regra satisfeita. */
function itemAllowed(item: NavSubItem, checker: Checker): boolean {
  return ruleAllows(ruleForNavId(item.id), checker);
}

function pruneItems(items: NavSubItem[], checker: Checker): NavSubItem[] {
  return items
    .filter((i) => itemAllowed(i, checker))
    .map((i) =>
      i.children
        ? { ...i, children: i.children.filter((c) => itemAllowed(c, checker)) }
        : i
    );
}

function pruneGroups(groups: NavGroup[], checker: Checker): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: pruneItems(g.items, checker) }))
    .filter((g) => g.items.length > 0);
}

/**
 * Poda a árvore inteira. Exportada pura para facilitar teste unitário.
 *
 * Casos de `Checker` verificados por inspeção (GAP-BE-033/B2 — sem test
 * runner no projeto; função pura, avaliável estaticamente contra a tabela):
 *
 * | # | Cenário                                              | can(perm) | hasFarm | isFarmScoped(perm) | Esperado |
 * |---|-------------------------------------------------------|-----------|---------|---------------------|----------|
 * | a | farm-scoped, sem fazenda                               | true      | false   | true                | oculto   |
 * | b | farm-scoped, com fazenda, sem permissão                | false     | true    | true                | oculto   |
 * | c | farm-scoped, com fazenda, com permissão                | true      | true    | true                | visível  |
 * | d1| não-farm, sem fazenda, com permissão                   | true      | false   | false               | visível  |
 * | d2| não-farm, com fazenda, sem permissão                   | false     | true    | false               | oculto   |
 * | e | anyOf misto (1 perm farm-scoped s/ fazenda + 1 não-farm concedida) | mista | false | mista | visível |
 *
 * Rastreio na função acima: (a)/(b)/(c)/(d1)/(d2) → branch `rule.permission`
 * (`if (!can) return false; return hasFarm || !isFarmScoped`); (e) → branch
 * `rule.anyOf` (`.some((p) => can(p) && (hasFarm || !isFarmScoped(p)))`).
 */
export function pruneMenuModules(
  modules: NavModule[],
  checker: Checker
): NavModule[] {
  return modules
    .map((m) => ({
      ...m,
      groups: m.groups ? pruneGroups(m.groups, checker) : undefined,
      flatItems: m.flatItems ? pruneItems(m.flatItems, checker) : undefined,
    }))
    .filter(
      (m) =>
        (m.groups?.length ?? 0) > 0 ||
        (m.flatItems?.length ?? 0) > 0 ||
        // Módulo-folha com rota própria (ex.: Home) é sempre visível.
        (!!m.path && !m.groups && !m.flatItems)
    );
}

/**
 * Índice path → item-folha da árvore estática (exclui o módulo "favoritos",
 * cujos flatItems são placeholders do design system). Usado para materializar
 * os favoritos reais do usuário.
 */
const leafByPath: ReadonlyMap<string, NavSubItem> = (() => {
  const map = new Map<string, NavSubItem>();
  for (const m of menuModules) {
    if (m.id === "favoritos") continue;
    for (const item of getAllModuleItems(m)) {
      map.set(item.path, item);
      for (const child of item.children ?? []) map.set(child.path, child);
    }
  }
  return map;
})();

export function useMenuModules(): NavModule[] {
  const { can, canAny, hasRole, hasFarm, isFarmScoped } = usePermissions();
  const favorites = useContextSelector(AuthContext, (ctx) => ctx.favorites);

  return useMemo(() => {
    const checker: Checker = { can, canAny, hasFarm, isFarmScoped, hasRole };

    // Módulo Favoritos é DINÂMICO por usuário (GAP-BE-023): os flatItems
    // estáticos da árvore são placeholders do design system e NUNCA são
    // renderizados — o módulo sai da poda estática e é reconstruído aqui.
    // Cada rota gravada é o PATH de um item da árvore (rotas legadas do Blade
    // não casam e são ignoradas na renderização, mas preservadas nas
    // escritas). A permissão do favorito é a do item-alvo (mesma regra do
    // getMenu() legado) — sem favoritos visíveis, o módulo some.
    const result = pruneMenuModules(menuModules, checker).filter(
      (m) => m.id !== "favoritos"
    );

    const favoriteItems = favorites
      .map((route) => leafByPath.get(route))
      .filter((item): item is NavSubItem => !!item && itemAllowed(item, checker));

    const staticFavorites = menuModules.find((m) => m.id === "favoritos");
    if (favoriteItems.length > 0 && staticFavorites) {
      // Reinsere na mesma posição relativa da árvore estática (após a Home):
      // conta quantos módulos que vêm ANTES de "favoritos" sobreviveram à poda.
      const staticIdx = menuModules.findIndex((m) => m.id === "favoritos");
      const beforeIds = new Set(
        menuModules.slice(0, staticIdx).map((m) => m.id)
      );
      const insertAt = result.filter((m) => beforeIds.has(m.id)).length;
      result.splice(insertAt, 0, {
        ...staticFavorites,
        flatItems: favoriteItems,
        groups: undefined,
      });
    }

    return result;
  }, [can, canAny, hasRole, hasFarm, isFarmScoped, favorites]);
}

/** Variante filtrada de `getModuleById` — para o SecondaryNav aberto por clique. */
export function useMenuModuleById(id: string | null): NavModule | undefined {
  const modules = useMenuModules();
  return id ? modules.find((m) => m.id === id) : undefined;
}

/**
 * Variante filtrada de `findModuleByPath` — módulo dono do pathname atual,
 * já podado pelas permissões (o SecondaryNav aberto por URL não deve exibir
 * itens que o usuário não pode ver).
 */
export function useMenuModuleByPath(pathname: string): NavModule | undefined {
  const modules = useMenuModules();
  return useMemo(() => {
    const direct = modules.find(
      (m) => m.path && (pathname === m.path || pathname.startsWith(m.path + "/"))
    );
    if (direct) return direct;
    return modules.find((m) => {
      const items = [
        ...(m.flatItems ?? []),
        ...(m.groups?.flatMap((g) => g.items) ?? []),
      ].flatMap((i) => [i, ...(i.children ?? [])]);
      return items.some(
        (i) => pathname === i.path || pathname.startsWith(i.path + "/")
      );
    });
  }, [modules, pathname]);
}
