// src/@types/language/module-markers/index.ts
// Interface de tradução do módulo de MARCADORES (Marker — Cadastros Base).
// Espelha a convenção de module-family-equipments/module-contadores. O
// conteúdo mora em src/constants/languages/{idioma}/languageMarkers.ts.
//
// TASK-MK-FE-01 cobre `type` (fábrica de opções) + `list` + `filter` +
// `deleteBlocked` (10 rótulos de `errors.in_use`, GAP-MK-FE-01). A Tarefa
// irmã TASK-MK-FE-02 adiciona `form` (campos + upload de ícone).

export interface ModuleMarkers {
  marker: {
    singularLabel: string;
    pluralLabel: string;
    type: {
      activity: string;
      infrastructure: string;
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        icon: string;
        description: string;
        type: string;
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
      type: string;
      typeAll: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Diálogo de exclusão BLOQUEADA (422 `errors.in_use`, mapa
     *  `{tabela: count}` — GAP-MK-FE-01, [AVALIADO]). `resourceLabel` segue o
     *  mesmo template `"{resource} ({count})"` de `ModuleContadores`, mas
     *  aqui `{resource}` vem do dicionário local `markerInUseTableLabels`,
     *  não da API. */
    deleteBlocked: {
      title: string;
      description: string;
      resourceLabel: string;
      tableLabels: {
        areas: string;
        sectors: string;
        places: string;
        subPlaces: string;
        areaInfrastructure: string;
        sectorInfrastructure: string;
        placeInfrastructure: string;
        subPlaceInfrastructure: string;
        activityCostCenters: string;
        apportionmentItems: string;
      };
    };
    /** Formulário de criação/edição (TASK-MK-FE-02) — 3 campos + upload de
     *  ícone (obrigatório no create, DA-MK-17). Ordem/rótulos PT-BR
     *  espelham a tela Blade do legado (`00-Documentacao_Bruta/Marcadores/
     *  01-marker.md`, Seção 15): Ícone → Descrição → Tipo → Ativo. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        type: string;
        isEnabled: string;
        icon: string;
        /** Rótulo do campo de ícone em modo EDIÇÃO ("Novo ícone" — Doc Bruta
         *  §15, distinto de "Ícone" no create; o legado exibe o ícone atual
         *  separado do campo de upload de um novo). */
        iconNew: string;
      };
      placeholders: {
        description: string;
      };
      hints: {
        iconAccepted: string;
        iconMaxSize: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };
      validation: {
        descriptionMaxLength: string;
        typeRequired: string;
        iconRequired: string;
      };
    };
  };
}
