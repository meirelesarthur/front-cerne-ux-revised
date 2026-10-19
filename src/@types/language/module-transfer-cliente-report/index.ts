// src/@types/language/module-transfer-cliente-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Romaneio Cliente" (relatório de
// Agricultura — F-332, esteira 97-Esteiras/058, TASK-058-F332-FE-01). Módulo
// TOP-LEVEL próprio (mirror `module-animal-batch-history-report`), tela de
// filtro + download binário, SEM grid/prévia, SEM `format`/`outputTypeOptions`
// (PDF-ONLY — plano FRONT-F332-plano.md §7, FID-13 do plano de API).
//
// Mensagens de validação vêm de `report.validation.*` (mirror
// `dre-report-filter-schema.ts`, NÃO de `defaltStrings.validations.*` — o par
// de datas usa a MESMA mensagem para ambos os campos, mirror `dre`).
// -----------------------------------------------------------------------------

export interface ModuleTransferClienteReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      client: string;
      startDate: string;
      endDate: string;
    };
    validation: {
      periodRequired: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
  };
}
