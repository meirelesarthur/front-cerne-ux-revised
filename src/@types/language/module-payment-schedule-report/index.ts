// src/@types/language/module-payment-schedule-report/index.ts
// Interface de tradução do módulo "Agenda/Pagamentos" (relatório Financeiro —
// F-294, CONTRATO-F294-agenda-pagamentos.md, esteira 97-Esteiras/059). Módulo
// TOP-LEVEL próprio (mirror `module-receipt-schedule-report`, F-304 — sibling
// mais próximo: mesma casca FormContainer + submit externo + dispatch PDF-
// inline × Excel-download), tela de filtro + download PDF/Excel, SEM grid/
// prévia, SEM seletor de colunas (11 colunas + 2 consolidados fixos
// server-side, CONTRATO §"Contrato legado — síntese").
//
// `paymentScheduleReport.paymentScheduleReport` (singular/plural) é o par
// DERIVADO usado por `src/constants/query-key.ts` (mirror
// `receiptScheduleReport.receiptScheduleReport`) — namespace reservado para
// eventuais consumidores futuros de `useQuery` próprios deste módulo; a tela
// em si reusa 100% os `queryKey` de lookup já existentes
// (`cadastrosBase.proprietaryOptions`, `financialCategories.list`,
// `farms.list`).
//
// `report` é o dicionário de TELA (mirror `receiptScheduleReport.report`), 9
// campos (Número/Fazenda/Data Início/Data Fim/Proprietário/Status/Centro de
// Custo/Categoria/Formato) — datas OPCIONAIS (fidelidade ao legado,
// DEC-265/CONTRATO §"Leitura do dev" item 2), `status` ESCALAR único
// (DIVERGÊNCIA registrada no contrato — `PaymentScheduleReportFilterData`/
// `PaymentScheduleReportRepository`, NÃO `status[]` do irmão consolidado
// F-214), com rótulos próprios (`statusOptions`, mirror
// `App\Enums\Reports\PaymentScheduleReportStatusEnum::label()`).
export interface ModulePaymentScheduleReport {
  paymentScheduleReport: {
    singularLabel: string;
    pluralLabel: string;
  };
  report: {
    pageTitle: string;
    pageSubtitle: string;
    submitButton: string;
    fields: {
      number: string;
      farm: string;
      startDate: string;
      endDate: string;
      proprietary: string;
      status: string;
      costCenter: string;
      category: string;
      format: string;
    };
    statusOptions: {
      dueSoon: string;
      overdue: string;
      partial: string;
      settled: string;
    };
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodOrder: string;
    };
    empty: string;
    error: string;
    retry: string;
    searchPlaceholder: string;
    selectAll: string;
    deselectAll: string;
  };
}
