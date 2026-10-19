// src/@types/language/module-animal-batch-history-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Histórico de Animais/Lote" (relatório de
// Pecuária — F-221, esteira 97-Esteiras/058, TASK-058-F221-FE-01). Módulo
// TOP-LEVEL próprio (mirror `module-weighing-harvest-report`/
// `module-stock-provider-lot-report`), tela de filtro + download binário,
// SEM grid/prévia.
//
// Diferente dos irmãos de Financeiro (`format`: 'pdf'|'xlsx'), o seletor de
// saída aqui chama-se `outputTypeOptions` (valores 'pdf'|'excel' — casam 1:1
// com o parâmetro literal `type` da API, plano §"Riscos", item 2).
//
// Mensagens de validação usam `defaltStrings.validations.*` (fonte única,
// plano §2.5) — este módulo não duplica mensagens de erro de campo.
// -----------------------------------------------------------------------------

export interface ModuleAnimalBatchHistoryReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      batch: string;
      status: string;
      type: string;
    };
    outputTypeOptions: {
      pdf: string;
      excel: string;
    };
    requiredFieldsHint: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
  };
}
