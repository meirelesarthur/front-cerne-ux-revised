// src/@types/language/module-costing-livestock-area-report/index.ts
// Interface de tradução do módulo "Custeio/Área Pecuária" (relatório
// pecuário — F-251, CusteioAreaPecuaria-contrato-api.md, lote 076). Mirror
// ESTRUTURAL de `module-production-costing-area-report/index.ts` (relatório
// PDF-only, sem grid/prévia, mesma cascata client-side IG-01), acrescido do
// 3º campo de filtro `grazings` (Módulo de Pastejo) que o irmão F-298 não
// tem.

export interface ModuleCostingLivestockAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      grazings: string;
      startDate: string;
      endDate: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    grazingsPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
