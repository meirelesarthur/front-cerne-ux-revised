// src/@types/language/module-supply-status-sla-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Relatório SLA" (SupplyStatusSlaReport —
// Administrativo / Suprimentos, TASK-SLA-FE-01, esteira 97-Esteiras/037).
// Chave PLANA de primeiro nível em `LanguageDate` (`supplyStatusSlaReport`,
// TOP-LEVEL, mirror `saleContracts`/`movements`) — DISTINTO de
// `supplyStatusSlas` (módulo "Parâmetros SLA", TASK-FE-SLA-01, config), sem
// colisão de namespace.
//
// 1 única tela (filtro + botão "Gerar", sem grid/paginação, TASK-SLA-FE-02) —
// por isso não há bloco de `columns`/`table` aqui, diferente de
// `ModuleRequestPurchases`.
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageSupplyStatusSlaReport.ts.
// -----------------------------------------------------------------------------

export interface ModuleSupplyStatusSlaReport {
  titleModule: string;
  pageTitle: string;
  pageSubtitle: string;
  filter: {
    uuid: string;
    uuidPlaceholder: string;
    startDate: string;
    endDate: string;
    status: string;
    statusPlaceholder: string;
    generateButton: string;
    /** Dica exibida quando nenhum gatilho válido (uuid OU par de datas)
     *  está preenchido — botão "Gerar" desabilitado (TASK-SLA-FE-02 DoD). */
    noTriggerHint: string;
  };
  validation: {
    /** Mirror `required_with` mútuo do backend (`start_date`/`end_date`) —
     *  um sem o outro é 422 de validação de FORMATO (não de negócio). */
    dateRangeRequired: string;
  };
  toasts: {
    generating: string;
    success: string;
    /** 404 real (`ResourceNotFoundException`) —
     *  "Nenhuma solicitação de compra encontrada com os filtros informados." */
    noDataError: string;
    /** 422 real de negócio (`BusinessRuleException`) — configuração de SLA
     *  incompleta para a fazenda ativa (nem todos os 11 status têm
     *  parâmetro cadastrado). ACHADO desta Tarefa: o texto do task-packet
     *  citava "403", mas a leitura direta de
     *  `GenerateRequestPurchaseSlaReportAction`/`BusinessRuleException`
     *  confirma HTTP 422 — mensagem mapeada pelo status REAL. */
    slaConfigMissingError: string;
    /** 422 de negócio — nenhuma fazenda ativa no contexto da requisição. */
    noActiveFarmError: string;
  };
}
