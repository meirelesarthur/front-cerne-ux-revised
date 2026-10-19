// src/@types/language/module-received-interest-report/index.ts
// Interface de tradução do módulo "Juros Recebidos" (relatório financeiro —
// F-JR, esteira 97-Esteiras/014, Tarefa 49). Módulo TOP-LEVEL próprio, mirror
// ESTRUTURAL de `module-receipt-schedule-report` (F-304, mesma forma
// pageTitle/pageSubtitle/submitButton/fields/downloadSuccess/downloadError/
// validation/empty/error/retry/searchPlaceholder/selectAll/deselectAll),
// campos ajustados para `client` (não `clients`) e SEM os campos que esta
// tela não tem (`costCenter`/`category`).
//
// `validation` combina os DOIS precedentes: `periodRequired` (mirror
// `module-paid-interest-report`, datas OBRIGATÓRIAS aqui — contrato de API
// §3) + `periodOrder` (mirror `module-receipt-schedule-report`, validação de
// `end_date >= start_date`).
//
// `proprietary` (contrato de tela §3/DEC-043): campo renderizado e wireado
// NORMALMENTE — nenhuma string de aviso "filtro sem efeito" foi adicionada
// aqui, por decisão explícita do dono (fora do escopo desta Tarefa).
export interface ModuleReceivedInterestReport {
  receivedInterestReport: {
    singularLabel: string;
    pluralLabel: string;
  };
  report: {
    pageTitle: string;
    pageSubtitle: string;
    submitButton: string;
    fields: {
      client: string;
      proprietary: string;
      startDate: string;
      endDate: string;
      farm: string;
      format: string;
    };
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
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
