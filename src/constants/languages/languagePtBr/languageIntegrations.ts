// src/constants/languages/languagePtBr/languageIntegrations.ts
// Tradução PT-BR do módulo compartilhado "Integrações" — telas de export
// da área Integrações (F-119 "Exportação NFS-e → Domínio", canário da
// esteira 071; reusável pelas irmãs F-116/117/118/120, Decisão E de
// `ExportNfseDominio-contrato-tela.md`). Labels fiéis ao legado
// (`trad.php:408,410` — "Dt. Início" / "Dt. Fim" / "Exportar Dados").

import { ModuleIntegrations } from '@/@types/language/module-integrations';

export const languageIntegrations: ModuleIntegrations['integrations'] = {
  singularLabel: 'Integração',
  pluralLabel: 'Integrações',
  exportNfseDominio: {
    titleModule: 'Exportação NFS-e (Domínio)',
    form: {
      startDateLabel: 'Dt. Início',
      endDateLabel: 'Dt. Fim',
      exportButton: 'Exportar Dados',
      validation: {
        endBeforeStart: 'A data fim deve ser maior ou igual à data início.',
      },
    },
    toasts: {
      successTitle: 'Exportação gerada',
      successDescription: 'O arquivo foi baixado com sucesso.',
      errorTitle: 'Falha na exportação',
    },
  },
  exportMovementsDominio: {
    titleModule: 'Exportação Mov. Bancário (Domínio)',
    form: {
      startDateLabel: 'Dt. Início',
      endDateLabel: 'Dt. Fim',
      typeLabel: 'Tipo Dados',
      exportButton: 'Exportar Dados',
      typeOptions: {
        income: 'Entrada',
        expense: 'Saída',
      },
      validation: {
        endBeforeStart: 'A data fim deve ser maior ou igual à data início.',
      },
    },
    toasts: {
      successTitle: 'Exportação gerada',
      successDescription: 'O arquivo foi baixado com sucesso.',
      errorTitle: 'Falha na exportação',
    },
  },
  exportEarningsDominio: {
    titleModule: 'Exportação Folha Salarial (Domínio)',
    form: {
      yearLabel: 'Ano',
      monthLabel: 'Mês',
      exportButton: 'Exportar Dados',
      months: {
        jan: 'Janeiro',
        feb: 'Fevereiro',
        mar: 'Março',
        apr: 'Abril',
        may: 'Maio',
        jun: 'Junho',
        jul: 'Julho',
        aug: 'Agosto',
        sep: 'Setembro',
        oct: 'Outubro',
        nov: 'Novembro',
        dec: 'Dezembro',
      },
      validation: {
        yearRequired: 'Selecione o ano.',
        monthRequired: 'Selecione o mês.',
      },
    },
    toasts: {
      successTitle: 'Exportação gerada',
      successDescription: 'O arquivo foi baixado com sucesso.',
      errorTitle: 'Falha na exportação',
    },
  },
  exportFinancialCsv: {
    titleModule: 'Exportação CSV (C. Pagas/Recebidas)',
    form: {
      startDateLabel: 'Dt. Início',
      endDateLabel: 'Dt. Fim',
      exportButton: 'Exportar Dados',
      validation: {
        endBeforeStart: 'A data fim deve ser maior ou igual à data início.',
      },
    },
    toasts: {
      successTitle: 'Exportação gerada',
      successDescription: 'O arquivo foi baixado com sucesso.',
      errorTitle: 'Falha na exportação',
    },
  },
  exportExpensesIncomesDominio: {
    titleModule: 'Exportar Dados Domínio — Contas a Pagar/Receber',
    form: {
      farmLabel: 'Fazenda',
      startDateLabel: 'Dt. Emissão Início',
      endDateLabel: 'Dt. Emissão Fim',
      startDueDateLabel: 'Dt. Venc. Início',
      endDueDateLabel: 'Dt. Venc. Fim',
      proprietaryLabel: 'Proprietário Gestor',
      statusLabel: 'Status',
      centerLabel: 'Centro de Custo',
      typeLabel: 'Tipo Dados',
      categoriesLabel: 'Categorias',
      exportButton: 'Exportar Dados',
      validation: {
        endBeforeStart: 'A data fim deve ser maior ou igual à data início.',
        endDueBeforeStartDue:
          'A data fim de vencimento deve ser maior ou igual à data início de vencimento.',
      },
      status: {
        aVencer: 'A vencer',
        vencido: 'Vencido',
        baixaParcial: 'Baixa parcial',
        baixado: 'Baixado',
        adiantPendente: 'Adiant. pendente',
        adiantBaixado: 'Adiant. baixado',
        faturaPendente: 'Fatura/Pendente',
        faturaBaixado: 'Fatura/Baixado',
      },
      type: {
        expense: 'Contas a Pagar',
        income: 'Contas a Receber',
      },
    },
    toasts: {
      successTitle: 'Exportação gerada',
      successDescription: 'O arquivo foi baixado com sucesso.',
      errorTitle: 'Falha na exportação',
    },
  },
};
