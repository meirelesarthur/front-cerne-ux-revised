// src/constants/languages/languagePtBr/languageOpenMovements.ts
// Tradução PT-BR do módulo "Saldo Inicial" (OpenMovement — Cadastros Base /
// Financeiros), execução 031. Rótulo visível sempre "Saldo Inicial" (PT) —
// mirror do rótulo já fixado em `languageSidebar.ts:46` (item `cad-fin-sal`).
// Não confundir com "Saldo Inicial" de Estoque (`languageOpeningBalances.ts`
// — outro módulo, outra permissão, outra rota).

import { ModuleOpenMovements } from '@/@types/language/module-open-movements';

export const languageOpenMovements: ModuleOpenMovements = {
  openMovement: {
    singularLabel: 'Saldo Inicial',
    pluralLabel: 'Saldos Iniciais',
    list: {
      pageTitle: 'Saldo Inicial',
      pageSubtitle: 'Administre os saldos iniciais das contas bancárias.',
      deletedToast: 'Saldo inicial removido com sucesso',
      table: {
        code: 'Código',
        account: 'Conta Bancária',
        date: 'Data',
        value: 'Valor',
        proprietary: 'Proprietário',
      },
      actions: {
        view: 'Visualizar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum saldo inicial cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro saldo inicial.',
        titleFiltered: 'Nenhum saldo inicial encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Saldo Inicial',
      },
      deleteConfirm: {
        title: 'Excluir saldo inicial',
        description: 'Tem certeza que deseja excluir este saldo inicial',
      },
    },
    filter: {
      title: 'Filtrar Saldos Iniciais',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      account: 'Conta Bancária',
      accountPlaceholder: 'Buscar conta bancária',
      proprietary: 'Proprietário',
      proprietaryPlaceholder: 'Buscar proprietário',
    },
    form: {
      title: { create: 'Novo Saldo Inicial' },
      subtitle: { create: 'Cadastre um novo saldo inicial de conta bancária.' },
      fields: {
        account: 'Conta Bancária',
        type: 'Tipo',
        typeCategory: 'Tp. Categoria',
        proprietary: 'Proprietário Gestor',
        date: 'Dt. Movimento',
        value: 'Valor R$',
        interest: 'Juros R$',
        document: 'Documento',
        note: 'Histórico',
      },
      placeholders: {
        account: 'Buscar conta bancária',
        proprietary: 'Buscar proprietário',
        document: 'Número do documento',
        note: 'Observação sobre o movimento',
      },
      fixedValues: {
        type: 'Entrada',
        typeCategory: 'Saldo Inicial',
      },
      apportionments: {
        sectionTitle: 'Rateio',
        sectionHint: 'Distribua o valor do saldo inicial entre categoria e centro de custo.',
        sumLabel: 'Total rateado',
        sumHint: 'a soma diverge do valor informado',
        emptyTitle: 'Nenhum item de rateio adicionado. Adicione ao menos um item.',
        addRowLabel: 'Adicionar Item',
        removeRowLabel: 'Remover item',
        fields: {
          category: 'Categoria',
          costCenter: 'Centro de Custo',
          value: 'Valor',
        },
        placeholders: {
          category: 'Buscar categoria',
          costCenter: 'Buscar centro de custo',
        },
        categoryLockedHelper: 'Categoria única aplicável — selecionada automaticamente.',
      },
      validation: {
        accountRequired: 'Selecione a conta bancária.',
        dateRequired: 'Informe a data do movimento.',
        valueRequired: 'Informe o valor.',
        valueNotZero: 'O valor do saldo não pode ser 0.',
        documentMaxLength: 'Máximo de 100 caracteres.',
        noteMaxLength: 'Máximo de 40 caracteres.',
        proprietaryRequired: 'Selecione o proprietário gestor.',
        itemsMinLength: 'Adicione ao menos um item de rateio.',
        itemCategoryRequired: 'Selecione a categoria.',
        itemCostCenterRequired: 'Selecione o centro de custo.',
        itemValueRequired: 'Informe o valor do item.',
        itemValueMin: 'O valor do item deve ser maior que zero.',
      },
    },
    detail: {
      sections: {
        identification: 'Identificação',
        apportionments: 'Rateio',
      },
      fields: {
        account: 'Conta Bancária',
        type: 'Tipo Movimento',
        typeCategory: 'Tp. Categoria',
        date: 'Dt. Movimento',
        document: 'Documento',
        value: 'Valor',
        interest: 'Juros',
        note: 'Histórico',
        proprietary: 'Proprietário Gestor',
      },
      table: {
        category: 'Categoria',
        costCenter: 'Centro de Custo',
        value: 'Valor',
      },
      notFound: {
        title: 'Saldo inicial não encontrado',
        description: 'O registro pode ter sido excluído. Volte à listagem e tente novamente.',
        back: 'Voltar',
      },
      noData: 'Não Possui',
    },
  },
};
