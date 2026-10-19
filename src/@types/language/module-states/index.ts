// src/@types/language/module-states/index.ts
// Interface de tradução do módulo de ESTADOS (State — Cadastros Base /
// Geografia). Espelha a convenção do módulo de Técnicas Diagnóstico
// (module-diagnostic-techniques) — plural na chave do módulo (`states`),
// singular na chave interna (`state`). O conteúdo mora em
// src/constants/languages/{idioma}/languageStates.ts.
//
// TASK-FE-022 cobre SOMENTE `list` — menor módulo i18n da família: catálogo
// read-only puro (SEM criar/editar/excluir), SEM filtro (diferente de
// TecnicasDiagnostico/Species, que têm `search` aditivo). Por isso NÃO tem
// `filter` nem `form`, e `list.emptyState` não tem variante "filtrado"
// (`titleFiltered`/`descriptionFiltered`/`cta`) — não existe filtro para gerar
// esse estado, nem CTA de criação (não há permissão `states_create`).

export interface ModuleStates {
  state: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        title: string;
        letter: string;
      };
      /** Sem CTA e sem variante "filtrado" — catálogo read-only, sem filtro, sem permissão de criação. */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
    };
  };
}
