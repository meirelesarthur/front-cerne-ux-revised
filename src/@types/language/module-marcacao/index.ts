// src/@types/language/module-marcacao/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de MARCAÇÃO (Marking — Operacional >
// Agricultura > Manejo, TASK-MC-FE-01, esteira 97-Esteiras/044). Espelha a
// convenção de `module-movement-sales/index.ts`: o TIPO do módulo
// (`ModuleMarcacao`) expõe diretamente a entidade singular (`marking`) — a
// chave de namespace `marcacao` só existe em `LanguageDate.marcacao:
// ModuleMarcacao` (mirror `LanguageDate.movementSales: ModuleMovementSales`,
// `ModuleMovementSales = { movementSale: {...} }`, SEM repetir o nome do
// módulo dentro do próprio tipo). Conteúdo mora em
// `src/constants/languages/{idioma}/languageMarcacao.ts`.
//
// CORREÇÃO (tsc, achado do build): a versão anterior deste arquivo envolvia
// `marking` numa chave extra `marcacao` DENTRO do tipo (`ModuleMarcacao =
// { marcacao: { marking: {...} } }`), divergindo do que TODO o código
// consumidor já escrevia (`languageGB.marcacao.marking.*` — 1 nível de
// `marcacao`, vindo de `LanguageDate`, + `marking`). `tsc` acusava
// corretamente "Property 'marking' does not exist on type 'ModuleMarcacao'"
// porque o tipo só declarava a chave `marcacao` (dupla) no seu topo. Fix:
// remover o nível extra — `ModuleMarcacao` agora começa direto em `marking`.
//
// Namespace `marcacao` — LIVRE, sem colisão com `weaning`/`movementSales`.
//
// TASK-MC-FE-01 (fundação) cobre `list` + `filter` + `deleteDialog` +
// `status` + `colors` + as validações mínimas de `forecast`/`done` que os
// schemas desta MESMA Tarefa (`marking-forecast-schema.ts`/
// `marking-done-schema.ts`) já exigem para compilar. TASK-MC-FE-04
// (formulário) acrescenta `form`. TASK-MC-FE-05..09 (onda 2, FORA desta
// execução) acrescentam o restante de `forecast`/`done` (campos de UI) +
// `import`/`export`/`report` — edição ADITIVA quando chegarem.
// -----------------------------------------------------------------------------

export interface ModuleMarcacao {
  marking: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        area: string;
        responsible: string;
        variety: string;
        quantity: string;
        harvest: string;
        week: string;
        date: string;
        color: string;
        status: string;
      };
      actions: {
        view: string;
        print: string;
        edit: string;
        editDisabledTooltip: string;
        forecast: string;
        forecastDisabledTooltip: string;
        done: string;
        doneDisabledTooltip: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      area: string;
      harvest: string;
      variety: string;
      user: string;
      status: string;
      color: string;
      startDate: string;
      endDate: string;
      week: string;
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    /** Fábrica `markingStatusOptions` (Marcado/Previsto/Realizado, `MarkingStatusEnum`). */
    status: {
      marcado: string;
      previsto: string;
      realizado: string;
    };
    /** Fábrica `markingColorOptions` — 16 rótulos, chaves = `labelKey` de
     *  `markingColorCatalog` (mirror EXATO de `MarkingColorEnum::label()`). */
    colors: {
      amarelo: string;
      azulClaro: string;
      branco: string;
      marrom: string;
      preto: string;
      rosa: string;
      roxo: string;
      verde: string;
      vermelho: string;
      rosaClaro: string;
      rosaPink: string;
      palha: string;
      azulEscuro: string;
      azulMarinho: string;
      laranja: string;
      azulRoyal: string;
    };
    /** Formulário de criar/editar/ver (TASK-MC-FE-04). */
    form: {
      title: {
        create: string;
        edit: string;
        view: string;
      };
      fields: {
        code: string;
        area: string;
        date: string;
        variety: string;
        user: string;
        quantity: string;
        harvest: string;
        employee: string;
        center: string;
        color: string;
        /** Bloco READONLY da semana resolvida pela cascata (Safra+Data),
         *  mirror da tabelinha `.weeks` do legado (TASK-MC-FIX-FE-01). */
        week: string;
        weekStartDate: string;
        weekEndDate: string;
      };
      placeholders: {
        area: string;
        variety: string;
        user: string;
        harvest: string;
        employee: string;
        center: string;
        color: string;
      };
      hints: {
        colorSuggestionByHarvest: string;
      };
      cascade: {
        /** Toast de erro explícito quando `GET /harvests/{uuid}/weeks/current`
         *  não encontra semana para a data (mirror `erro_cor_safra` do
         *  legado) — nunca falha silenciosa. */
        errorToast: string;
      };
    };
    /** TASK-MC-FE-01 (validação) + TASK-MC-FE-05/07 (onda 2 — telas
     *  single/bulk de Previsão). */
    forecast: {
      title: string;
      subtitle: string;
      bulkSubtitleTemplate: string;
      fields: {
        order: string;
        percentage: string;
        averageWeight: string;
        averagePrice: string;
        days: string;
        quantity: string;
        incomeBoxes: string;
        total: string;
        forecastDate: string;
      };
      addLine: string;
      removeLine: string;
      maxLinesWarning: string;
      emptyIdsToast: string;
      successToast: string;
      validation: {
        sumPercentage100: string;
      };
    };
    /** TASK-MC-FE-01 (validação) + TASK-MC-FE-06/07 (onda 2 — telas
     *  single/bulk de Realizado). */
    done: {
      title: string;
      subtitle: string;
      bulkSubtitleTemplate: string;
      fields: {
        order: string;
        orderPlaceholder: string;
        date: string;
        quantity: string;
        discard: string;
        averageWeight: string;
        averagePrice: string;
        status: string;
        color: string;
        total: string;
      };
      /** Rótulos de `MarkingDoneStatusEnum` (`'1'`/`'2'`/`'3'`) — fábrica
       *  `markingDoneStatusOptions` (TASK-MC-FE-06). */
      statusOptions: {
        aberto: string;
        parcial: string;
        concluido: string;
      };
      addLine: string;
      removeLine: string;
      maxLinesWarning: string;
      emptyIdsToast: string;
      successToast: string;
      validation: {
        uniqueOrder: string;
      };
    };
    /** Import/Export/Download de modelo (TASK-MC-FE-08). */
    excel: {
      downloadTemplate: string;
      downloadTemplateError: string;
      export: string;
      exportError: string;
      import: {
        menuLabel: string;
        title: string;
        subtitle: string;
        instructions: string;
        warning: {
          title: string;
          description: string;
        };
        fileUpload: {
          label: string;
          hint: string;
          dropzoneTitle: string;
          dropzoneDraggingTitle: string;
          changeLabel: string;
          removeLabel: string;
          errorTypeMessage: string;
          errorSizeMessage: string;
        };
        rowErrors: {
          title: string;
        };
        result: {
          rowsProcessedTemplate: string;
          codeRangeTemplate: string;
        };
        cancelButton: string;
        submitButton: string;
        closeButton: string;
        successToast: string;
        noPermission: string;
      };
    };
  };
}
