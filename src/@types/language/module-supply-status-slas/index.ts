// src/@types/language/module-supply-status-slas/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Parâmetros SLA" (SupplyStatusSla —
// Administrativo / Suprimentos, TASK-FE-SLA-01). Mirror estrutural de
// `ModuleRequestPurchases` (chave singular `supplyStatusSla`, mesmo padrão de
// `requestPurchase`/`function`) — chave PLANA de primeiro nível em
// `LanguageDate` (`supplyStatusSlas`, plural), sem namespace aninhado
// `administrativo.*` (convenção real do projeto, ver
// `module-request-purchases/index.ts`).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.supplyStatusSlas.*`
// (convenção canônica derivada da tradução — NUNCA string literal). O
// conteúdo mora em
// src/constants/languages/{idioma}/languageSupplyStatusSlas.ts.
//
// 1 única tela (listagem + edição inline de `max_hours`, sem tela de
// detalhe/formulário separada — DEC-D do contrato de API) — por isso não há
// bloco `form`/`filter` aqui, diferente de `ModuleRequestPurchases`.
// -----------------------------------------------------------------------------

export interface ModuleSupplyStatusSlas {
  supplyStatusSla: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    // ============================================
    // LISTAGEM COM EDIÇÃO INLINE (única tela do módulo)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        statusLabel: string;
        maxHours: string;
        actions: {
          edit: string;
          save: string;
          cancel: string;
        };
      };
      /** Guard `hasFarm` (`farm.context` estrito) — mirror `TenantParameters`. */
      noFarmState: {
        title: string;
        description: string;
      };
      /** Cenário raro — só ocorreria se o seed dos 11 status nunca rodou para a fazenda. */
      emptyState: {
        title: string;
        description: string;
      };
      error: {
        message: string;
        retry: string;
      };
      validation: {
        maxHoursRequired: string;
        maxHoursInvalid: string;
        maxHoursMin: string;
      };
      savedToast: string;
      /** Contador do legado, com `{total}`. */
      recordsCount: string;
      /** Aviso: o parâmetro vale para todas as fazendas do tenant (T-081-API-06). */
      tenantNotice: string;
    };
  };
}
