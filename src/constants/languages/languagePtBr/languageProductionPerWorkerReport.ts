// src/constants/languages/languagePtBr/languageProductionPerWorkerReport.ts
// Tradução PT-BR do módulo "Prod./Colaborador" (relatório agrícola — F-300,
// lote 079, F-300-plano-frontend.md TASK-300-FE-01).
//
// `pageTitle` mirror do rótulo do próprio menu ("Prod./Colaborador") — sem
// divergência de propósito registrada no contrato legado para este módulo
// (diferente do F-298/C-13).

import { ModuleProductionPerWorkerReport } from '@/@types/language/module-production-per-worker-report';

export const languageProductionPerWorkerReport: ModuleProductionPerWorkerReport = {
  report: {
    pageTitle: 'Prod./Colaborador',
    pageSubtitle: 'Relatório de produção agrupado por colaborador.',
    fields: {
      teams: 'Equipe',
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      employees: 'Colaborador',
    },
    teamsPlaceholder: 'Selecione as equipes',
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    employeesPlaceholder: 'Selecione os colaboradores',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
