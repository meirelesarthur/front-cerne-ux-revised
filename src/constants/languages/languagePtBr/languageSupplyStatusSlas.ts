// src/constants/languages/languagePtBr/languageSupplyStatusSlas.ts
// Tradução pt-BR do módulo "Parâmetros SLA" (SupplyStatusSla — Administrativo
// / Suprimentos, TASK-FE-SLA-01). Ver
// `@/@types/language/module-supply-status-slas` para o contrato completo.

import { ModuleSupplyStatusSlas } from '@/@types/language/module-supply-status-slas';

export const languageSupplyStatusSlas: ModuleSupplyStatusSlas = {
  supplyStatusSla: {
    singularLabel: 'Parâmetro de SLA',
    pluralLabel: 'Parâmetros SLA',
    titleModule: 'Parâmetros SLA',

    list: {
      pageTitle: 'Parâmetros SLA',
      pageSubtitle:
        'Configure o tempo máximo tolerado, em horas, para cada status da solicitação de compra.',
      table: {
        statusLabel: 'Status',
        maxHours: 'Tempo máximo (horas)',
        actions: {
          edit: 'Editar',
          save: 'Salvar',
          cancel: 'Cancelar',
        },
      },
      noFarmState: {
        title: 'Selecione uma fazenda',
        description: 'Selecione uma fazenda ativa para ver os parâmetros de SLA.',
      },
      emptyState: {
        title: 'Nenhum parâmetro encontrado',
        description: 'Não há parâmetros de SLA cadastrados para a fazenda ativa.',
      },
      error: {
        message: 'Não foi possível carregar os parâmetros de SLA.',
        retry: 'Tentar novamente',
      },
      validation: {
        maxHoursRequired: 'O tempo máximo é obrigatório.',
        maxHoursInvalid: 'O tempo máximo deve ser um número inteiro válido.',
        maxHoursMin: 'O tempo máximo não pode ser negativo.',
      },
      savedToast: 'SLA Status atualizado com sucesso!',
      recordsCount: 'N. Registros: {total}',
      tenantNotice: 'Atenção: o tempo máximo definido aqui vale para todas as fazendas do tenant.',
    },
  },
};
