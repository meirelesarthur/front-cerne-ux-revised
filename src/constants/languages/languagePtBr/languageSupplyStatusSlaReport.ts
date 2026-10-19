// src/constants/languages/languagePtBr/languageSupplyStatusSlaReport.ts
// Tradução pt-BR do módulo "Relatório SLA" (SupplyStatusSlaReport —
// Administrativo / Suprimentos, TASK-SLA-FE-01, esteira 97-Esteiras/037). Ver
// `@/@types/language/module-supply-status-sla-report` para o contrato completo.

import { ModuleSupplyStatusSlaReport } from '@/@types/language/module-supply-status-sla-report';

export const languageSupplyStatusSlaReport: ModuleSupplyStatusSlaReport = {
  titleModule: 'Relatório SLA',
  pageTitle: 'Relatório SLA',
  pageSubtitle:
    'Filtre por uma solicitação de compra ou por um intervalo de datas e gere o relatório SLA (.xlsx).',
  filter: {
    uuid: 'Solicitação de compra',
    uuidPlaceholder: 'Buscar por código...',
    startDate: 'De',
    endDate: 'Até',
    status: 'Status',
    statusPlaceholder: 'Todos os status',
    generateButton: 'Gerar',
    noTriggerHint:
      'Selecione uma solicitação de compra ou preencha as duas datas para gerar o relatório.',
  },
  validation: {
    dateRangeRequired: 'Preencha as duas datas — de e até.',
  },
  toasts: {
    generating: 'Gerando relatório...',
    success: 'Relatório gerado com sucesso.',
    noDataError: 'Nenhuma solicitação de compra encontrada com os filtros informados.',
    slaConfigMissingError:
      'Configure o parâmetro de SLA para todos os status antes de gerar o relatório.',
    noActiveFarmError: 'Nenhuma fazenda ativa no contexto da requisição.',
  },
};
