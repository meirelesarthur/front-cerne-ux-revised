// src/@types/language/module-animal-movement-analysis-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Análise Mov. Lote" (relatório de Pecuária
// — F-223, esteira 97-Esteiras/059, CONTRATO-F223-analise-mov-lote.md §5).
// Módulo TOP-LEVEL próprio (mirror `module-animal-batch-history-report`),
// tela de filtro + download binário, SEM grid/prévia.
//
// `outputTypeOptions` chama-se igual ao irmão F-221 — valores 'pdf'|'excel'
// casam 1:1 com o parâmetro literal `type` da API. `validation.endDateBeforeStart`
// é mensagem PRÓPRIA do módulo (mirror `breedingMatings.reproductiveHistoryReport.hint`)
// porque `defaltStrings.validations` não tem uma mensagem relacional genérica
// de intervalo de datas — as demais mensagens (campo obrigatório) reutilizam
// `defaltStrings.validations.*` (fonte única).
//
// NÃO tem campo `status` (diverge do irmão F-221) — o filtro do endpoint só
// expõe `batch`/`start_date`/`end_date`/`type`.
//
// `requiredFieldsHint` removido (esteira 060, ajuste UX do dono) — o texto
// de ajuda deixou de existir na tela; o chip/badge do Lote no PDF é tarefa
// da API, fora deste escopo.
// -----------------------------------------------------------------------------

export interface ModuleAnimalMovementAnalysisReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      batch: string;
      type: string;
    };
    outputTypeOptions: {
      pdf: string;
      excel: string;
    };
    validation: {
      endDateBeforeStart: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
  };
}
