// src/constants/languages/languagePtBr/languageAccountingEntries.ts
// Tradução PT-BR do módulo "Partida Dobrada" (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-02). Mirror estrutural
// de `languageDfes.ts` (mesmo domínio Fiscal, módulo top-level próprio).
//
// As 3 mensagens de `validation.items*` são texto IDÊNTICO ao 422 real
// (`AccountingEntryRequest::withValidator()`), para o 422 do servidor e a
// validação client (`accounting-entry-schema.ts`, TASK-PD-FE-04) nunca
// divergirem visualmente.

import { ModuleAccountingEntries } from '@/@types/language/module-accounting-entries';

export const languageAccountingEntries: ModuleAccountingEntries = {
  accountingEntry: {
    singularLabel: 'Lançamento Contábil',
    pluralLabel: 'Lançamentos Contábeis',

    titleModule: 'Partida Dobrada',
    createTitle: 'Novo Lançamento Contábil',
    editTitle: 'Editar Lançamento Contábil',
    viewTitle: 'Visualizar Lançamento Contábil',

    list: {
      pageTitle: 'Partida Dobrada',
      pageSubtitle: 'Lançamentos contábeis da fazenda ativa.',
      table: {
        code: 'Código',
        origin: 'Origem',
        description: 'Descrição',
        totalAmount: 'Valor Total',
        responsible: 'Responsável',
        date: 'Data',
      },
      emptyState: {
        titleEmpty: 'Nenhum lançamento contábil',
        descriptionEmpty: 'Você ainda não criou nenhum Lançamento Contábil.',
        cta: 'Novo Lançamento',
        titleFiltered: 'Nenhum resultado encontrado',
        descriptionFiltered: 'Ajuste os filtros aplicados e tente novamente.',
      },
      error: {
        message: 'Não foi possível carregar os lançamentos contábeis.',
        retry: 'Tentar novamente',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      deletedToast: 'Lançamento Contábil excluído com sucesso.',
    },

    origin: {
      administrative: 'Administrativo',
      agriculture: 'Agricultura',
      livestock: 'Pecuária',
    },

    condition: {
      debit: 'Devedor',
      credit: 'Credor',
    },

    form: {
      fields: {
        date: 'Data',
        description: 'Descrição',
        origin: 'Origem',
        code: 'Código',
        codePlaceholder: 'Gerado automaticamente',
        author: 'Responsável',
        totalAmount: 'Valor Total',
      },
      items: {
        sectionTitle: 'Itens do Lançamento (Débito e Crédito)',
        sectionHint:
          'Cada lançamento precisa de ao menos 1 item de débito e 1 de crédito, com soma igual.',
        fields: {
          planAccount: 'Conta Contábil',
          condition: 'Tipo',
          value: 'Valor',
        },
        addRowLabel: 'Adicionar item',
        removeRowLabel: 'Remover item',
        totalDebitLabel: 'Total Débito',
        totalCreditLabel: 'Total Crédito',
        differenceHint: 'A diferença entre débito e crédito precisa ser zero para salvar.',
      },
    },

    // ⚠️ MESMO TEXTO do backend (AccountingEntryRequest::withValidator()) — não reformular.
    validation: {
      itemsMinDebit: 'É necessário informar ao menos 1 item de débito.',
      itemsMinCredit: 'É necessário informar ao menos 1 item de crédito.',
      itemsSumMismatch: 'O somatório de débito deve ser igual ao somatório de crédito.',
      dateRequired: 'A data é obrigatória.',
      descriptionRequired: 'A descrição é obrigatória.',
      originRequired: 'A origem é obrigatória.',
      planAccountRequired: 'A conta contábil é obrigatória.',
      conditionRequired: 'O tipo (Débito/Crédito) é obrigatório.',
      valueRequired: 'O valor é obrigatório.',
      valueMin: 'O valor deve ser maior ou igual a R$ 0,01.',
    },

    filter: {
      title: 'Filtrar Lançamentos Contábeis',
      fields: {
        code: 'Código',
        origin: 'Origem',
        description: 'Descrição',
        startDate: 'Data inicial',
        endDate: 'Data final',
        user: 'Responsável',
      },
    },

    // Relatório da Partida Dobrada (F-257, esteira 069, TASK-PDR-FE-03).
    // `reportTypeOptions` = texto EXATO de
    // `DoubleEntryAccountingReportType::description()` (api_root).
    report: {
      pageTitle: 'Partida Dobrada',
      pageSubtitle: 'Relatórios da Partida Dobrada da fazenda ativa.',
      reportTypeLabel: 'Tipo de Relatório',
      reportTypeOptions: {
        journal: 'Diário Contábil',
        generalLedger: 'Razão Contábil',
        trialBalance: 'Balancete de Verificação',
        balanceSheet: 'Balanço Patrimonial (Simplificado)',
      },
      planAccountLabel: 'Conta Contábil',
      planAccountPlaceholder: 'Todas as contas',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
      orderByLabel: 'Ordenar por',
      orderByOptions: {
        recent: '+ Recente',
        oldest: '+ Antigo',
      },
      downloadPdfButton: 'Baixar PDF',
      downloadError: 'Não foi possível gerar o relatório.',
      validation: {
        reportTypeRequired: 'O tipo de relatório é obrigatório.',
        planAccountProhibited:
          'A conta contábil não se aplica ao Balanço Patrimonial Simplificado.',
        periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      },
    },
  },
};
