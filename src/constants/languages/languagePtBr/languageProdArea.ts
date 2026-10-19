// src/constants/languages/languagePtBr/languageProdArea.ts
// Tradução PT-BR do módulo "Prod./Área" (relatório de Agricultura — F-299,
// 97-Esteiras/012, Tarefa 47/48). Chaves conforme
// `frontend-contract-prod-area.md` §9.4. Rótulos literais do legado
// preservados: "Marcar Todos"/"Desmarcar Todos" (`btn-mark-all`/
// `btn-unmark-all`, C-11 corrigido) e "Nenhuma informação encontrada."
// (PDF legado `area-generated.blade.php`).

import { ModuleProductionAreaReport } from '@/@types/language/module-production-area-report';

export const languageProdArea: ModuleProductionAreaReport = {
  report: {
    pageTitle: 'Produção por Área',
    pageSubtitle: 'Relatório de produção por área da fazenda ativa.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    cyclePlaceholder: 'Selecione',
    areasSearchPlaceholder: 'Buscar área',
    areasSelectAll: 'Marcar Todos',
    areasDeselectAll: 'Desmarcar Todos',
    areasSelectedCount: 'Áreas selecionadas',
    areasHint: 'Sem seleção, o relatório considera todas as áreas.',
    printButton: 'Imprimir',
    downloadError: 'Não foi possível gerar o relatório.',
    popupBlocked:
      'O navegador bloqueou a nova aba. Libere pop-ups para este site e tente novamente.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateBeforeStart: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
