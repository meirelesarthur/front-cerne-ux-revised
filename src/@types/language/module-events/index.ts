// src/@types/language/module-events/index.ts
// Interface de tradução do módulo de EVENTOS (Event — rubrica de folha,
// Administrativo / Gestão Pessoal). Espelha a convenção de module-functions/
// module-markers. O conteúdo mora em
// src/constants/languages/{idioma}/languageEventos.ts.
//
// TASK-FE-EVT-01 cobre `list` + `filter` + `deleteBlocked` (5 rótulos de
// `errors.in_use` — o maior fan-in do projeto) + `typeOptions`/
// `methodOptions`/`conditionOptions` (fábricas de opções dos 3 enums,
// consumidas pela grid via `_label` do backend E pelo `Select` do
// formulário). TASK-FE-EVT-02 ACRESCENTA `form` (campos do formulário
// create/edit — `name`/`type`/`method`/`condition`/`is_enabled`).

export interface ModuleEvents {
  event: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        type: string;
        method: string;
        condition: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      /** "Data de cadastro (de/até)" — filtro sobre `created_at`, NUNCA rotulado como período/vigência do próprio Evento (contrato de tela §2). */
      dateFrom: string;
      dateTo: string;
      dateRangeInvalid: string;
    };
    /** Diálogo de exclusão BLOQUEADA (422 `errors.in_use`, mapa
     *  `{tabela: count}`) — shape confirmado no contrato de API §6, 5
     *  chaves (`earning_event`/`employee_events`/`absences`/`bonuses`/
     *  `advances`), o maior fan-in do projeto até aqui. */
    deleteBlocked: {
      title: string;
      description: string;
      resourceLabel: string;
      tableLabels: {
        earning_event: string;
        employee_events: string;
        absences: string;
        bonuses: string;
        advances: string;
      };
    };
    /** Fábrica de opções `EventPeriodicity` — consumida pela grid (via
     *  `type_label` do backend, não estas chaves) e pelo `Select` do
     *  formulário (TASK-FE-EVT-02). */
    typeOptions: {
      weekly: string;
      biweekly: string;
      monthly: string;
      quarterly: string;
      semiannual: string;
      annual: string;
    };
    /** Fábrica de opções `EventMethod`. */
    methodOptions: {
      informed: string;
      fixed: string;
    };
    /** Fábrica de opções `EventCondition` (GAP-BE-01 Opção B — sempre
     *  obrigatório, sem opção "não definido"). */
    conditionOptions: {
      sum: string;
      decrease: string;
    };
    /** Formulário de criação/edição (TASK-FE-EVT-02) — 5 campos: name → type
     *  → method → condition → is_enabled. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        type: string;
        method: string;
        condition: string;
        isEnabled: string;
      };
      placeholders: {
        name: string;
      };
      validation: {
        nameMaxLength: string;
      };
    };
  };
}
