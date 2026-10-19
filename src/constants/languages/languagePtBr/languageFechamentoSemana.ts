// src/constants/languages/languagePtBr/languageFechamentoSemana.ts
// Tradução PT-BR do módulo de FECHAMENTO SEMANA (Operacional). Namespace
// `fechamentoSemana` — LIVRE.

import { ModuleFechamentoSemana } from '@/@types/language/module-fechamento-semana';

export const languageFechamentoSemana: ModuleFechamentoSemana = {
  closingWeek: {
    singularLabel: 'Fechamento Semana',
    pluralLabel: 'Fechamentos Semana',
    titleModule: 'Fechamentos Semana',
    list: {
      pageTitle: 'Fechamentos Semana',
      pageSubtitle: 'Gerencie os fechamentos semanais da fazenda.',
      deletedToast: 'Fechamento semana excluído com sucesso.',
      table: {
        code: 'Nº',
        week: 'Semana',
        startDate: 'Dt. Início',
        endDate: 'Dt. Fim',
      },
      actions: {
        view: 'Visualizar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum fechamento semana cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro fechamento.',
        cta: 'Adicionar',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    deleteDialog: {
      title: 'Confirmar exclusão',
      descriptionTemplate:
        'O Fechamento Semana Nº {code} será excluído permanentemente. Esta ação não pode ser desfeita.',
    },
    search: {
      pageTitle: 'Novo fechamento semana',
      pageSubtitle: 'Selecione o período para gerar o relatório.',
      fields: {
        startDate: 'Data de início',
        endDate: 'Data de fim',
      },
      validation: {
        startDateRequired: 'A data de início é obrigatória.',
        endDateRequired: 'A data de fim é obrigatória.',
        endDateBeforeStartDate: 'A data de fim não pode ser anterior à data de início.',
      },
      generateButton: 'Gerar',
      emptyReport: 'Nenhum carregamento encontrado neste período.',
      businessErrorFallback: 'Não foi possível fechar a semana. Tente novamente.',
    },
    report: {
      reportTitle: 'Demonstrativo de Formação do Preço Médio',
      table: {
        cultivation: 'Cultivo',
        quality: 'Qualidade',
        quantityFinal: 'Qtd. Final',
        expenses: 'Despesas rateadas',
        amount: 'Preço médio',
        items: {
          date: 'Data',
          dueDate: 'Vencimento',
          provider: 'Fornecedor',
          client: 'Cliente',
          quantityFinal: 'Qtd Kg',
          price: 'Preço',
          totalAmount: 'Valor Operação',
        },
      },
      code: 'Nº',
      week: 'Semana',
      saveButton: 'Salvar',
      backButton: 'Voltar',
      savedToast: 'Semana fechada com sucesso.',
    },
    detail: {
      fields: {
        code: 'Nº',
        date: 'Data',
        startDate: 'Dt. Início',
        endDate: 'Dt. Fim',
        week: 'Semana',
        responsible: 'Responsável',
      },
      itemsSectionTitle: 'Itens do fechamento',
      itemsTable: {
        cultivation: 'Cultivo',
        quality: 'Qualidade',
        amount: 'Valor',
      },
      itemsEmptyState: 'Nenhum item salvo neste fechamento.',
      backButton: 'Voltar',
      notFound: 'Fechamento semana não encontrado.',
    },
  },
};
