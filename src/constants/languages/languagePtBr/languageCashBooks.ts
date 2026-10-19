// src/constants/languages/languagePtBr/languageCashBooks.ts
// Tradução PT-BR do módulo CashBook (LCDPR — Livro Caixa Digital do Produtor
// Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-01). Mirror estrutural
// de `languageDfes` (mesmo domínio Fiscal).

import { ModuleCashBooks } from '@/@types/language/module-cash-books';

export const languageCashBooks: ModuleCashBooks = {
  cashBook: {
    singularLabel: 'Livro Caixa (LCDPR)',
    pluralLabel: 'Livros Caixa (LCDPR)',

    list: {
      pageTitle: 'Livro Caixa (LCDPR)',
      pageSubtitle: 'Gerencie os registros do Livro Caixa Digital do Produtor Rural.',
      table: {
        year: 'Ano',
        proprietary: 'Proprietário',
        contador: 'Contador',
      },
      actions: {
        view: 'Visualizar',
        downloadTxt: 'Baixar TXT',
        printReport: 'Imprimir Relatório',
        delete: 'Excluir',
      },
      downloadTxtError: 'Não foi possível baixar o TXT deste registro.',
      downloadReportError: 'Não foi possível gerar o relatório deste registro.',
      deleteConfirm: {
        title: 'Excluir registro do Livro Caixa',
        description: 'Tem certeza que deseja excluir o registro do ano',
        warning: 'Esta ação não pode ser desfeita.',
      },
      deleteSuccess: 'Registro excluído com sucesso.',
      deleteError: 'Não foi possível excluir este registro.',
      emptyState: {
        titleEmpty: 'Nenhum registro gerado ainda.',
        descriptionEmpty: 'Crie o primeiro registro de Livro Caixa (LCDPR) desta fazenda.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros aplicados.',
        cta: 'Novo Lançamento',
      },
      error: {
        message: 'Não foi possível carregar os registros do Livro Caixa (LCDPR).',
        retry: 'Tentar novamente',
      },
    },

    filter: {
      title: 'Filtrar Livro Caixa (LCDPR)',
      year: 'Ano',
      yearPlaceholder: 'ex.: 2026',
      proprietary: 'Proprietário',
      proprietaryPlaceholder: 'Buscar proprietário...',
      proprietaryAll: 'Todos',
    },

    form: {
      pageTitle: 'Novo Registro de Livro Caixa (LCDPR)',
      pageSubtitle: 'Gere um novo registro do Livro Caixa Digital do Produtor Rural.',
      fields: {
        startDate: 'Data Inicial',
        endDate: 'Data Final',
        proprietary: 'Proprietário',
        proprietaryPlaceholder: 'Selecione o proprietário',
        period: 'Período de Escrituração',
        periodPlaceholder: 'Selecione o período',
        special: 'Situação Especial',
        specialPlaceholder: 'Selecione a situação especial',
        dtSpecial: 'Data da Situação Especial',
        verification: 'Forma de Apuração',
        verificationPlaceholder: 'Selecione a forma de apuração',
        contador: 'Contador',
        contadorPlaceholder: 'Selecione o contador',
      },
      validation: {
        startDateRequired: 'A data inicial é obrigatória.',
        endDateRequired: 'A data final é obrigatória.',
        endDateNotBeforeStart: 'A data final não pode ser anterior à data inicial.',
        endDateNotTodayOrFuture: 'A data final não pode ser maior ou igual a data atual.',
        endDateSameYearAsStart: 'As datas devem estar no mesmo ano.',
        dateInvalid: 'A data informada é inválida.',
        dateMinYear: 'O ano da data não pode ser anterior a 2000.',
        dtSpecialAfterEnd: 'A data da situação especial não pode ser posterior à data final.',
        proprietaryRequired: 'Selecione um proprietário.',
        proprietaryCpfRequired: 'Requer CPF válido — corrija o cadastro do proprietário',
        periodRequired: 'Selecione o período de escrituração.',
        specialRequired: 'Selecione a situação especial.',
        dtSpecialRequired: 'A data da situação especial é obrigatória.',
        verificationRequired: 'Selecione a forma de apuração.',
        contadorRequired: 'Selecione um contador.',
      },
      createSuccess: 'Registro criado com sucesso.',
      createGenericError: 'Não foi possível criar o registro.',
      cancelButton: 'Cancelar',
      submitButton: 'Salvar',
    },

    detail: {
      pageTitle: 'Registro de Livro Caixa (LCDPR)',
      metadata: {
        year: 'Ano',
        proprietary: 'Proprietário',
        period: 'Período de Escrituração',
        special: 'Situação Especial',
        dtSpecial: 'Data da Situação Especial',
        dtSpecialEmpty: '—',
        verification: 'Forma de Apuração',
        contador: 'Contador',
      },
      monthly: {
        title: 'Resumo Mensal',
        table: {
          month: 'Mês/Ano',
          entrance: 'Entradas (R$)',
          exit: 'Saídas (R$)',
          balance: 'Saldo Acumulado',
        },
        totalsLabel: 'Totais anuais',
      },
      actions: {
        downloadTxt: 'Baixar TXT',
        printReport: 'Imprimir Relatório',
        delete: 'Excluir',
      },
      downloadTxtError: 'Não foi possível baixar o arquivo TXT.',
      downloadReportError: 'Não foi possível gerar o relatório.',
      deleteConfirm: {
        title: 'Excluir registro do Livro Caixa',
        description: 'Tem certeza que deseja excluir este registro',
        warning: 'Esta ação não pode ser desfeita.',
      },
      deleteSuccess: 'Registro excluído com sucesso.',
      deleteError: 'Não foi possível excluir este registro.',
      loadError: {
        message: 'Não foi possível carregar este registro.',
        retry: 'Tentar novamente',
      },
    },
  },
};
