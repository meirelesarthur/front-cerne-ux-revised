// src/@types/language/module-maintenance-preventives/index.ts
// Interface de tradução do módulo Gestão de Frota — Manutenções Preventivas
// (MaintenancePreventive) — domínio PRÓPRIO (mirror `module-supplies`). O
// conteúdo mora em
// `src/constants/languages/{idioma}/languageMaintenancePreventives.ts`.
//
// Tarefa 43 (fundação: rota/listagem/visualização/exclusão) → Tarefa 44
// (formulário criar/editar com N linhas dinâmicas).

export interface ModuleMaintenancePreventives {
  maintenancePreventive: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        date: string;
        requester: string;
        actions: string;
      };
      itemsTable: {
        equipment: string;
        date: string;
        message: string;
        hourMeterKm: string;
        note: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      filter: {
        title: string;
        equipment: string;
        equipmentPlaceholder: string;
        startDate: string;
        endDate: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      errorState: {
        title: string;
        description: string;
        retry: string;
      };
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        date: string;
        requester: string;
        user: string;
      };
      items: {
        title: string;
        addItem: string;
        removeItem: string;
        emptyRow: string;
        fields: {
          equipment: string;
          message: string;
          date: string;
          hourMeterKm: string;
          note: string;
        };
        placeholders: {
          equipment: string;
          message: string;
        };
      };
      errors: {
        invalidFields: string;
        equipmentRequired: string;
        messageRequired: string;
      };
    };
    detail: {
      sections: {
        header: string;
        items: string;
      };
      fields: {
        code: string;
        date: string;
        requester: string;
        user: string;
      };
      actions: {
        edit: string;
        delete: string;
        back: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
