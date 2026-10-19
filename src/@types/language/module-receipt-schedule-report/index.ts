// src/@types/language/module-receipt-schedule-report/index.ts
// Interface de tradução do módulo "Agenda/Recebimentos" (relatório
// Financeiro — F-304, esteira 97-Esteiras/055, TASK-055-F304-FE-01). Módulo
// TOP-LEVEL próprio (mirror `module-receipts-report`/`module-nfe-product-
// report`), tela de filtro + download PDF/Excel, SEM grid/prévia, SEM
// seletor de colunas (8 colunas fixas server-side, contrato de tela §2.1).
//
// `receiptScheduleReport.receiptScheduleReport` (singular/plural) é o par
// DERIVADO usado por `src/constants/query-key.ts` (mirror
// `stocks.stock.singularLabel`/`foods.food.singularLabel`) — namespace
// canônico reservado para eventuais consumidores futuros de `useQuery`
// próprios deste módulo; a tela em si reusa 100% os `queryKey` de lookup
// já existentes (`cadastrosBase.clients`, `financialCategories.list`,
// `cadastrosBase.proprietaryOptions`, `farms.mine`).
//
// `report` é o dicionário de TELA (mirror `receiptsReport.report`), 8
// campos (Cliente/Fazenda/Data Início/Data Fim/Proprietário/Centro de
// Custo/Categoria/Formato) — datas OPCIONAIS (fidelidade ao legado, CF304-05
// — v. roteiro §2.1/§4), diferente do irmão `receiptsReport` (F-305, datas
// SEMPRE obrigatórias).
export interface ModuleReceiptScheduleReport {
  receiptScheduleReport: {
    singularLabel: string;
    pluralLabel: string;
  };
  report: {
    pageTitle: string;
    pageSubtitle: string;
    submitButton: string;
    fields: {
      client: string;
      farm: string;
      startDate: string;
      endDate: string;
      proprietary: string;
      costCenter: string;
      category: string;
      format: string;
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
