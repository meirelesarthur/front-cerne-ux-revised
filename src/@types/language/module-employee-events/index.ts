// src/@types/language/module-employee-events/index.ts
// Interface de tradução do módulo "Funcionário X Eventos" (EmployeeEvent —
// Administrativo / Gestão Pessoal). Espelha a convenção de module-events/
// module-correcao-estoque. O conteúdo mora em
// src/constants/languages/{idioma}/languageFuncionarioXEventos.ts.
//
// TASK-FE-FXE-01 cobre `list`/`filter`/`importModal`/`reportButton` (Tela 1 —
// picker de Funcionários + import + relatório PDF). TASK-FE-FXE-02 ACRESCENTA
// `matrix` (Tela 2 — Matriz de Vínculos via `sync`), mesmo arquivo/mesmos 3
// locales (contrato de tela §5).

export interface ModuleEmployeeEvents {
  employeeEvent: {
    singularLabel: string;
    pluralLabel: string;
    /**
     * [NOVO 2026-08-12, TASK-FE-FXE-03/DA-EE-FE-02] Rótulo do botão do HEADER
     * da Tela 1 — distinto de `matrix.addEventButton` ("Adicionar novo",
     * usado DENTRO da Matriz para acrescentar uma linha). Abre
     * `addLinkModal`, mirror do botão "Novo" do header legado
     * `employeeevents/index.blade.php`.
     */
    addLinkButton: string;
    /** Modal picker de Funcionário aberto pelo `addLinkButton` — 1 campo `SelectAsyncPaginate` + navegação para a Matriz (sem mutação nesta tela). */
    addLinkModal: {
      title: string;
      description: string;
      employeeLabel: string;
      employeePlaceholder: string;
      cancelButton: string;
      confirmButton: string;
    };
    /** Tela 1 — listagem-picker de Funcionários (`/administrativo/func-eventos`). */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        name: string;
        document: string;
        office: string;
        actions: {
          manageLinks: string;
        };
      };
      /** SEM CTA de criação — picker read-only, não há cadastro de Funcionário nesta tela. */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
    };
    /** Drawer de filtro — Contrato B, reaproveita `EmployeeFilterForm` (mesmo tipo de Funcionários, sem tipo novo). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      startDate: string;
      endDate: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Modal de importação de planilha (mirror `StockCorrectionImportModal`, texto redigido do zero — 5 colunas reais: Funcionário/Evento/Valor/Método/Habilitado). */
    importModal: {
      menuButtonLabel: string;
      title: string;
      subtitle: string;
      downloadShortcut: string;
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
      /** Etapa `result` — shape confirmado por leitura direta (`EmployeeEventImportResult`), 5 métricas (diverge de Correção de Estoque). */
      result: {
        employeesProcessedLabel: string;
        rowsProcessedLabel: string;
        createdLabel: string;
        updatedLabel: string;
        deletedLabel: string;
      };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      importSuccessToast: string;
      downloadTemplateError: string;
    };
    /** Botão "Relatório PDF" do header da Tela 1 — download direto, sem filtro (mirror `SaldoEstoqueRelatorio::handleExportPdf`). */
    reportButton: {
      label: string;
      exportError: {
        title: string;
        description: string;
      };
    };
    /** Tela 2 — Matriz de Vínculos do Funcionário (`/administrativo/func-eventos/:employeeUuid`, TASK-FE-FXE-02). */
    matrix: {
      title: string;
      /**
       * [NOVO TASK-104] Título do `FormContainer` em MODO CRIAR
       * (`/administrativo/func-eventos/novo`, sem `employeeUuid` ainda
       * resolvido/selecionado) — distinto de `title` (usado em MODO EDITAR,
       * que mostra `employee.name` direto).
       */
      createTitle: string;
      /**
       * [NOVO TASK-104] Cabeçalho Funcionário → CPF/CNPJ → Função, label +
       * campo bloqueado (mirror `employeeevents/_forms.blade`), renderizado
       * no topo da Matriz em AMBOS os modos (CRIAR/EDITAR). Em modo CRIAR,
       * `employeeLabel`/`employeeSelectPlaceholder` armam o
       * `SelectAsyncPaginate` inline que substitui `AdicionarVinculoModal`.
       */
      header: {
        employeeLabel: string;
        employeeSelectPlaceholder: string;
        nifLabel: string;
        functionLabel: string;
      };
      backButton: string;
      emptyState: {
        title: string;
        description: string;
      };
      addEventButton: string;
      addEventPlaceholder: string;
      noEventsAvailable: string;
      removeRowButton: string;
      table: {
        event: string;
        /**
         * [NOVO TASK-104] Coluna "Condição" — READONLY/display-only, mirror
         * legado `employeeevents/_forms.blade`. NUNCA persistida (não existe
         * em `SyncEmployeeEventItem`); o valor vem do `condition_label` do
         * Evento (catálogo `listEvents`), resolvido por `event_uuid` da linha.
         */
        condition: string;
        value: string;
        method: string;
        enabled: string;
      };
      saveButton: string;
      cancelButton: string;
      saveSuccessToast: string;
      saveError: {
        title: string;
        description: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
    };
  };
}
