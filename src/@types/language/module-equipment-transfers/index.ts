// src/@types/language/module-equipment-transfers/index.ts
// Interface de tradução do módulo TRANSFERÊNCIA DE MÁQUINAS
// (EquipmentTransfer — Gestão de Frota, F-101, 97-Esteiras/005,
// TASK-ETR-FE-01). Espelha a convenção do módulo de Revisões Agendadas
// (module-scheduled-reviews): plural na chave do módulo
// (`equipmentTransfers`), singular na chave interna (`equipmentTransfer`).
// O conteúdo mora em
// src/constants/languages/{idioma}/languageEquipmentTransfers.ts.
//
// Superfície EXATA de fid-g3f-transferencia-maquinas.md §FE-20 /
// contrato-tela-transferencia-maquinas-frontend.md §FE-20 — nenhuma chave a
// mais, nenhuma a menos. `singularLabel`/`pluralLabel` são OBRIGATÓRIAS (a
// `queryKey` deriva delas).

export interface ModuleEquipmentTransfers {
  equipmentTransfer: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        status: string;
        code: string;
        responsible: string;
        date: string;
        farmOrigin: string;
        farmDestination: string;
        equipments: string;
      };
      legend: {
        title: string;
        open: string;
        finished: string;
        canceled: string;
      };
      actions: {
        view: string;
        receive: string;
        cancel: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        titleError: string;
        descriptionError: string;
        retry: string;
      };
    };
    filter: {
      startDate: string;
      endDate: string;
    };
    form: {
      createTitle: string;
      createSubtitle: string;
      fields: {
        code: string;
        responsible: string;
        date: string;
        farmOrigin: string;
        farmDestination: string;
      };
      equipments: {
        sectionTitle: string;
        equipment: string;
        addItem: string;
        removeItem: string;
        minOneRequired: string;
      };
      attachments: {
        sectionTitle: string;
        name: string;
        file: string;
        addItem: string;
        removeItem: string;
      };
      /** Aditivo além da superfície mínima de FE-20 — exigido por FE-21
       *  (`useUnsavedChangesGuard` nas telas de criar e receber), mirror
       *  `text.form.unsavedChangesDialog` já presente em ~10 módulos do
       *  repositório (ex.: `module-breeding-seasons`, `module-budgets`).
       *  Reutilizado também pela tela de Recebimento (TASK-ETR-FE-04). */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
    receive: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        receiptDate: string;
        employee: string;
        /** Aditivo além de FE-20 — mensagem de `rules={{ required }}` do
         *  `Controller` (sem resolver yup/zod no repositório, FE-09). */
        receiptDateRequired: string;
        employeeRequired: string;
      };
      submit: string;
      successMessage: string;
    };
    show: {
      pageTitle: string;
      receiptBlock: {
        title: string;
        receiptDate: string;
        employee: string;
      };
      equipments: {
        title: string;
      };
      attachments: {
        title: string;
        viewDocument: string;
        empty: string;
      };
    };
    cancel: {
      dialogTitle: string;
      dialogDescription: string;
      dialogWarning: string;
      confirmLabel: string;
      successMessage: string;
    };
  };
}
