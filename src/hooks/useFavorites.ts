// src/hooks/useFavorites.ts
// Favoritos de menu do usuário (GAP-BE-023).
//
// Fonte: `ctx.favorites` do AuthContext — rotas cruas vindas do GET /auth/me
// (junto das permissões). A SPA grava o PATH do item de navegação (ex.:
// "/financeiro/pagar"); rotas legadas do Blade (ex.: "expenses.index") podem
// coexistir — são preservadas nas escritas e ignoradas na renderização.
//
// Regra herdada do legado (getMenu()/extractFavorites): favorito NÃO tem
// permissão própria — só aparece se o item-alvo é visível para o usuário
// (a poda acontece no useMenuModules).

import { useCallback } from "react";
import { useContextSelector } from "use-context-selector";

import { AuthContext } from "@/contexts/AuthContext";

export function useFavorites() {
  const favorites = useContextSelector(AuthContext, (ctx) => ctx.favorites);
  const toggleFavorite = useContextSelector(
    AuthContext,
    (ctx) => ctx.toggleFavorite
  );

  const isFavorite = useCallback(
    (route: string) => favorites.includes(route),
    [favorites]
  );

  return { favorites, isFavorite, toggleFavorite };
}
