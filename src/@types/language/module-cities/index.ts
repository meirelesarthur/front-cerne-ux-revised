// src/@types/language/module-cities/index.ts
// Interface de tradução do módulo de CIDADES (City — Cadastros Base /
// Geografia). Espelha a convenção do módulo de Estados (module-states) —
// plural na chave do módulo (`cities`), singular na chave interna (`city`).
// O conteúdo mora em src/constants/languages/{idioma}/languageCities.ts.
//
// TASK-FE-023 cobre `list` + `filter` (grid + drawer de filtro por Estado
// cascata + busca). SEM `form`/`actions`/`deletedToast` — catálogo
// read-only puro, sem criar/editar/excluir (mesmo racional de Estados,
// TASK-FE-022). Diferente de Estados: aqui HÁ filtro (capacidade real de
// `CityFilterData` — search + state_uuid — aditivo pedido explicitamente na
// task-packet do dev), então `list.emptyState` TEM variante "filtrado"
// (`titleFiltered`/`descriptionFiltered`) — mas SEM `cta`, pois não existe
// permissão `cities_create`.

export interface ModuleCities {
  city: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        title: string;
        state: string;
      };
      /** Sem CTA (sem permissão de criação); COM variante "filtrado" (há filtro nesta tela, diferente de Estados). */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
    };
    /** Drawer de filtro — `search` (Input) + `state_uuid` (SelectAsyncPaginate cascata, via listStates). Sem campo de status. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      state: string;
      statePlaceholder: string;
    };
  };
}
