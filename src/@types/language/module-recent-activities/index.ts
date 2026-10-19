// src/@types/language/module-recent-activities/index.ts
// Interface de tradução do módulo "Atividades Recentes" (UT-000690 / F-349 —
// Administrativo, tela somente leitura). Instância simples: um único arquivo.
// O conteúdo mora em src/constants/languages/{idioma}/languageRecentActivities.ts.

export interface ModuleRecentActivities {
  recentActivity: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        type: string;
        date: string;
        status: string;
        farm: string;
        actions: string;
      };
      actions: {
        open: string;
        openUnavailable: string;
        opening: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      filter: {
        title: string;
        types: string;
        startDate: string;
        endDate: string;
      };
    };
    /** Labels dos 19 tipos ativos (`RecentActivityType`). */
    types: {
      serviceOrder: string;
      animalBatchTransfer: string;
      batchAreaTransfer: string;
      separation: string;
      deathAnimal: string;
      lossAnimal: string;
      birthAnimal: string;
      weaning: string;
      weighing: string;
      sanitary: string;
      pasture: string;
      dietBeat: string;
      feeding: string;
      appropriation: string;
      marking: string;
      breedingMating: string;
      pregnancyDiagnosis: string;
      supply: string;
      maintenance: string;
    };
    /** Status de auditoria (`source = audit`): `{{date}}` é substituído pela data formatada. */
    status: {
      created: string;
      updated: string;
      /** Padrão date-fns da data por idioma. */
      dateFormat: string;
    };
    /** Labels de status de domínio por `type` (snake_case da API) e `code`. */
    domainStatus: Record<string, Record<string, string>>;
    validation: {
      endBeforeStart: string;
    };
  };
}
