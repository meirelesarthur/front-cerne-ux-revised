// src/@types/language/module-parameters/index.ts
// Interface de tradução do módulo de PARÂMETROS (Parameter — Configurações,
// execução 031, TASK-FE-031-40). Espelha a convenção de module-markers.
// Chave TOP-LEVEL dedicada (`parameters`, mirror `markers`/
// `financialCategories`) — NÃO aninhada em `ModuleBaseRegistrations`
// (convenção atual para entidade nova, contrato-front-parametros.md §4). O
// conteúdo mora em src/constants/languages/{idioma}/languageParameters.ts.

export interface ModuleParameters {
  parameter: {
    singularLabel: string;
    pluralLabel: string;
    /** Rótulos do enum `type` (1=Alfanumérico/2=Numérico/3=Lógico, contrato de
     *  API §4) — consumidos por `parameter-type-options.ts` (Select do
     *  formulário). A coluna "Tipo" da grid usa `type_label`, já traduzido
     *  pela API. */
    type: {
      alphanumeric: string;
      numeric: string;
      logical: string;
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        value: string;
        type: string;
        description: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      /** Tooltip/badge exibido ao lado do Nome quando o parâmetro é um dos 5
       *  nomes reservados (GAP-BE-511, Opção A) — explica por que "Excluir"
       *  não aparece no menu de ações daquela linha (contrato §5). */
      reservedTooltip: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
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
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        value: string;
        type: string;
        description: string;
      };
      placeholders: {
        name: string;
        value: string;
        description: string;
      };
      /** Helper text do campo Nome quando `is_reserved` (travado, fora do
       *  `register()`, TASK-FE-031-42) — explica ao usuário por que o campo
       *  está bloqueado. */
      reservedNameHelper: string;
      validation: {
        nameMaxLength: string;
        valueMaxLength: string;
        typeRequired: string;
        descriptionMaxLength: string;
      };
    };
    detail: {
      fields: {
        name: string;
        value: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
      actions: {
        edit: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
