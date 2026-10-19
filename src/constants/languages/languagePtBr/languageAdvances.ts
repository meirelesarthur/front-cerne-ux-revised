// src/constants/languages/languagePtBr/languageAdvances.ts
// Tradução PT-BR do módulo de ADIANTAMENTO SALARIAL (Administrativo).
// TASK-FE-adiant-salarial (97-Esteiras/034) — CRUD núcleo (D2: dimensão
// financeira fora de escopo, nenhum termo financeiro aqui).

import { ModuleAdvances } from '@/@types/language/module-advances';

export const languageAdvances: ModuleAdvances = {
  advance: {
    singularLabel: 'Adiantamento Salarial',
    pluralLabel: 'Adiantamentos Salariais',
    list: {
      pageTitle: 'Adiantamentos Salariais',
      pageSubtitle: 'Administre os adiantamentos salariais concedidos aos funcionários.',
      deletedToast: 'Adiantamento removido com sucesso',
      table: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
        actions: 'Ações',
      },
      actions: {
        view: 'Visualizar adiantamento',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum adiantamento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro adiantamento salarial.',
        titleFiltered: 'Nenhum adiantamento encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Adiantamento',
      },
      filter: {
        employee: 'Funcionário',
      },
    },
    detail: {
      generalData: {
        title: 'Dados Gerais',
      },
      fields: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
      },
      installments: {
        title: 'Rateio do Adiantamento',
        month: 'Mês',
        value: 'Valor',
        empty: 'Nenhuma parcela vinculada.',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Adiantamento não encontrado',
        description:
          'O adiantamento solicitado não existe, foi removido ou pertence a outra fazenda.',
        back: 'Voltar para Adiantamentos',
      },
    },
    form: {
      title: {
        create: 'Novo Adiantamento Salarial',
        edit: 'Editar Adiantamento Salarial',
      },
      fields: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
        installments: 'Rateio do Adiantamento',
        financialType: 'Tipo de Título',
        provider: 'Fornecedor',
        proprietary: 'Proprietário',
        number: 'Número',
        note: 'Observação',
        fiscalDocument: 'Nota Fiscal',
        hasInput: 'Possui Entrada?',
        inputDate: 'Data da Entrada',
        inputValue: 'Valor da Entrada',
        financialCategory: 'Categoria Financeira',
        costCenter: 'Centro de Custo',
        apportionmentValue: 'Valor',
        apportionmentPercent: '%',
        dueDate: 'Vencimento',
        hasFinancial: 'Gerar Financeiro?',
      },
      installmentRow: {
        month: 'Mês',
        value: 'Valor',
        addButton: 'Adicionar parcela',
        removeButton: 'Remover parcela',
        emptyLabel: 'Nenhuma parcela adicionada.',
        sumBadgeLabel: 'Soma das parcelas',
      },
      sections: {
        financial: 'Gerar Financeiro',
        financialInstallments: 'Parcelas Financeiras',
        apportionment: 'Rateio por Categoria',
        installmentGenerator: 'Gerar Parcelas',
      },
      installmentGenerator: {
        count: 'Qtd. Parcelas',
        firstDueDate: '1º Vencimento',
        intervalDays: 'Intervalo (dias)',
        generateButton: 'Gerar Parcelas',
        overwriteConfirm: 'Isso substitui as parcelas atuais. Continuar?',
      },
      financialInstallmentRow: {
        addButton: 'Adicionar parcela financeira',
        removeButton: 'Remover parcela financeira',
        emptyLabel: 'Nenhuma parcela financeira adicionada.',
        sumBadgeLabel: 'Soma das parcelas financeiras',
      },
      apportionmentRow: {
        addButton: 'Adicionar categoria',
        removeButton: 'Remover categoria',
        emptyLabel: 'Nenhuma categoria adicionada ao rateio.',
        sumBadgeLabel: 'Soma do rateio',
      },
      validation: {
        employeeRequired: 'Selecione o funcionário',
        eventRequired: 'Selecione o evento',
        dateRequired: 'A data é obrigatória',
        amountRequired: 'Informe um valor válido',
        installmentsRequired: 'Adicione ao menos uma parcela',
        installmentsSum: 'A soma das parcelas deve ser igual ao valor total do adiantamento',
        installmentMonthRequired: 'Informe o mês da parcela',
        installmentValueRequired: 'Informe um valor válido para a parcela',
        financialInstallmentsSum:
          'A soma das parcelas financeiras deve ser igual ao valor total do adiantamento',
        apportionmentSum:
          'A soma do rateio por categoria deve ser igual ao valor total do adiantamento',
        typeRequired: 'Selecione o tipo de título',
        fiscalDocumentRequired: 'Informe se é nota fiscal',
        financialCategoryRequired: 'Selecione a categoria financeira',
        costCenterRequired: 'Selecione o centro de custo',
        dueDateRequired: 'Informe o vencimento da parcela financeira',
        financialValueRequired: 'Informe um valor válido para a parcela financeira',
        inputDateRequired: 'Informe a data da entrada',
        inputValueRequired: 'Informe um valor válido para a entrada',
      },
    },
  },
};
