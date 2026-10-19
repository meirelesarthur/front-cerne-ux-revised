// src/@types/language/module-production-area-report/index.ts
// Interface de tradução do módulo "Prod./Área" (relatório de Agricultura —
// F-299, 97-Esteiras/012, Tarefa 47/48). Fluxo filtro→clique→PDF direto, SEM
// prévia em grade (correção pós-teste-manual, esteira 012 — as chaves de
// prévia/tabela foram removidas), com os campos próprios desta tela: ciclo
// de produção (select com cascata), áreas (CheckboxListField com "Marcar
// Todos"/"Desmarcar Todos" literais do legado) e aviso de pop-up bloqueado
// (PDF inline via `window.open`, contrato de tela §7.2).
//
// `production_cycle`/`areas` não têm placeholder próprio de "Todos" (mirror
// `farmPlaceholder` de `costCalculationReport`) porque a Tarefa 47 usa
// `cyclePlaceholder` genérico ("Selecione") e o multiselect de áreas não tem
// placeholder textual (é o `CheckboxListField`, com busca e contador
// próprios) — só `areasSearchPlaceholder`/`areasHint`.

export interface ModuleProductionAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
    };
    cyclePlaceholder: string;
    areasSearchPlaceholder: string;
    areasSelectAll: string;
    areasDeselectAll: string;
    areasSelectedCount: string;
    areasHint: string;
    printButton: string;
    downloadError: string;
    popupBlocked: string;
    validation: {
      periodRequired: string;
      endDateBeforeStart: string;
    };
  };
}
