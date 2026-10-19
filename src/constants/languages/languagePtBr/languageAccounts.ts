// src/constants/languages/languagePtBr/languageAccounts.ts
// Tradução PT-BR do módulo "Contas Bancárias" (Account — Cadastros Base /
// Financeiros, execução 025, TASK-FE-561). Rótulos de campo fiéis a
// `Account-FrontEnd-contrato.md §5` — "Nº do Contrato Bancário"/"Nº do
// Convênio Bancário" (NUNCA "Carteira"/"Convênio" do mock antigo, colunas
// removidas do schema em 2025).

import { ModuleAccounts } from '@/@types/language/module-accounts';

export const languageAccounts: ModuleAccounts = {
  account: {
    singularLabel: 'Conta Bancária',
    pluralLabel: 'Contas Bancárias',

    list: {
      pageTitle: 'Contas Bancárias',
      pageSubtitle:
        'Gerencie as contas correntes, poupança, aplicações e caixas internos do tenant.',
      columns: {
        description: 'Descrição',
        bank: 'Banco',
        agency: 'Agência',
        account: 'Conta',
        type: 'Tipo',
        limit: 'Limite',
        balance: 'Saldo',
        isEnabled: 'Status',
        ticket: 'Boleto',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma conta bancária cadastrada',
        descriptionEmpty: 'Cadastre a primeira conta bancária para começar.',
        titleFiltered: 'Nenhuma conta encontrada',
        descriptionFiltered: 'Tente ajustar os filtros ou a busca.',
        cta: 'Adicionar Novo',
      },
      noFarmSelected: {
        title: 'Selecione uma fazenda',
        description: 'Escolha uma fazenda ativa para visualizar as contas bancárias do tenant.',
      },
      deleteConfirm: {
        title: 'Excluir Conta Bancária',
        description: 'Tem certeza que deseja excluir a conta bancária',
        warning: 'Esta ação não pode ser desfeita.',
      },
      deletedToast: 'Conta bancária excluída com sucesso.',
      deleteBlocked: {
        title: 'Não é possível excluir',
        balance: 'Esta conta possui saldo diferente de zero.',
        dependents: 'Esta conta possui contas de investimento vinculadas a ela.',
        hint: 'Esta checagem considera apenas as contas já carregadas na página atual — vínculos fora dela só aparecem no erro retornado pelo servidor ao tentar excluir. Regularize o saldo e desvincule as contas dependentes antes de excluir.',
        confirm: 'Entendi',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição, código ou banco',
      type: 'Tipo',
      typeAll: 'Todos os tipos',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },

    form: {
      title: {
        create: 'Nova Conta Bancária',
        edit: 'Editar Conta Bancária',
      },
      subtitle: {
        create: 'Cadastre uma nova conta bancária.',
        edit: 'Atualize os dados da conta bancária.',
      },
      sections: {
        general: 'Informações Gerais',
        ticket: 'Emissão de Boleto',
        farms: 'Fazendas Vinculadas',
      },
      fields: {
        bank: 'Banco',
        agency: 'Agência',
        account: 'Conta',
        type: 'Tipo',
        code: 'Código',
        description: 'Descrição',
        limit: 'Limite',
        balance: 'Saldo',
        isEnabled: 'Ativo',
        useCashBook: 'Usa no Livro Caixa',
        provider: 'Fornecedor',
        investmentAccount: 'Conta Investimento Vinculada',
        isTicket: 'Emite Boleto',
        bankContract: 'Nº do Contrato Bancário',
        bankAgreement: 'Nº do Convênio Bancário',
        typeCnab: 'Tipo do Boleto (CNAB)',
        proprietaries: 'Proprietários',
        farms: 'Fazendas',
      },
      placeholders: {
        bank: 'Selecione o banco',
        agency: 'Ex.: 0001',
        account: 'Ex.: 12345-6',
        type: 'Selecione o tipo',
        code: 'Ex.: 0001',
        description: 'Ex.: Conta Corrente Principal',
        provider: 'Selecione o fornecedor',
        investmentAccount: 'Selecione a conta de aplicação',
        bankContract: 'Ex.: 12345678',
        bankAgreement: 'Ex.: 12345678',
        typeCnab: 'Selecione o tipo de CNAB',
      },
      typeOptions: {
        current: 'Corrente',
        savings: 'Poupança',
        investment: 'Aplicação Financeira',
        cashBook: 'Caixa Interno',
      },
      cnabOptions: {
        cnab240: 'CNAB240',
        cnab400: 'CNAB400',
      },
      hints: {
        balanceReadOnly: 'Saldo calculado externamente — não editável neste formulário.',
        investmentAccountFilter: 'Apenas contas do tipo Aplicação Financeira são exibidas.',
      },
      farms: {
        searchPlaceholder: 'Buscar fazenda...',
        selectAllLabel: 'Marcar todas',
        deselectAllLabel: 'Desmarcar todas',
        selectedCountLabel: 'Fazendas selecionadas',
        emptyLabel: 'Nenhuma fazenda encontrada.',
        errorLabel: 'Erro ao carregar as fazendas.',
        retryLabel: 'Tentar novamente',
      },
      proprietaries: {
        searchPlaceholder: 'Buscar proprietário...',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Proprietários selecionados',
        emptyLabel:
          'Nenhum proprietário vinculado às fazendas marcadas. Vincule o proprietário à fazenda no cadastro de Proprietários.',
        emptyNoFarmsLabel:
          'Marque ao menos uma fazenda acima para listar os proprietários vinculados a ela.',
        errorLabel: 'Erro ao carregar os proprietários.',
        retryLabel: 'Tentar novamente',
      },
      validation: {
        bankRequired: 'Selecione o banco.',
        agencyRequired: 'Campo obrigatório.',
        agencyMaxLength: 'Máximo de 6 caracteres.',
        accountRequired: 'Campo obrigatório.',
        accountMaxLength: 'Máximo de 20 caracteres.',
        typeRequired: 'Selecione o tipo da conta.',
        codeRequired: 'Campo obrigatório.',
        codeMaxLength: 'Máximo de 4 caracteres.',
        descriptionRequired: 'Campo obrigatório.',
        descriptionMaxLength: 'Máximo de 40 caracteres.',
        limitRequired: 'Informe o limite.',
        bankContractRequired: 'Nº do Contrato Bancário é obrigatório para contas com boleto.',
        bankContractMaxLength: 'Máximo de 8 caracteres.',
        bankAgreementRequired: 'Nº do Convênio Bancário é obrigatório para contas com boleto.',
        bankAgreementMaxLength: 'Máximo de 8 caracteres.',
        typeCnabRequired: 'Selecione o tipo de CNAB para contas com boleto.',
        proprietariesRequired: 'Selecione ao menos um proprietário para contas com boleto.',
      },
      savedToast: 'Conta bancária salva com sucesso.',
    },
  },
};
