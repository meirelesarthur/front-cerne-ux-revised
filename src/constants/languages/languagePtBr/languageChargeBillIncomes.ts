// src/constants/languages/languagePtBr/languageChargeBillIncomes.ts
// Tradução PT-BR do módulo "Contas a Receber" (ChargeBillIncome —
// Operacional / Agricultura / Carregamento). Namespace `chargeBillIncomes` —
// LIVRE, sem colisão com `incomes` (domínio Financeiro homônimo).

import { ModuleChargeBillIncomes } from '@/@types/language/module-charge-bill-incomes';

export const languageChargeBillIncomes: ModuleChargeBillIncomes = {
  chargeBillIncome: {
    singularLabel: 'Conta a Receber',
    pluralLabel: 'Contas a Receber',
    titleModule: 'Contas a Receber',
    list: {
      pageTitle: 'Contas a Receber',
      pageSubtitle: 'Gerencie as contas a receber do carregamento.',
      deletedToast: 'Conta a receber excluída com sucesso.',
      columns: {
        code: 'Código',
        dueDate: 'Dt. Vencimento',
        provider: 'Fornecedor',
        cultivation: 'Rateio Produto',
        amount: 'Valor',
        actions: 'Ações',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      fallback: {
        provider: 'Todos Associados',
        cultivation: 'Todos',
      },
      emptyState: {
        titleEmpty: 'Nenhuma conta a receber cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira conta a receber.',
        cta: 'Adicionar',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
      deleteConfirm: {
        title: 'Confirmar exclusão',
        description: 'Esta conta a receber será excluída permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
    },
    form: {
      title: {
        create: 'Nova Conta a Receber',
        edit: 'Editar Conta a Receber',
      },
      fields: {
        code: 'Código',
        dtEmission: 'Dt. Emissão',
        dueDate: 'Dt. Vencimento',
        number: 'N. Documento',
        amount: 'Valor',
        provider: 'Fornecedor',
        cultivation: 'Rateio Produto',
        description: 'Descrição',
      },
      placeholders: {
        code: 'Gerado automaticamente ao salvar',
        provider: 'Todos Associados',
        cultivation: 'Todos',
      },
      toasts: {
        createdSuccess: 'Conta a receber criada com sucesso.',
        updatedSuccess: 'Conta a receber atualizada com sucesso.',
      },
    },
    detail: {
      fields: {
        code: 'Código',
        dtEmission: 'Dt. Emissão',
        dueDate: 'Dt. Vencimento',
        number: 'N. Documento',
        amount: 'Valor',
        provider: 'Fornecedor',
        cultivation: 'Rateio Produto',
        description: 'Descrição',
      },
      actions: {
        edit: 'Editar',
        back: 'Voltar',
      },
      notFound: {
        title: 'Conta a receber não encontrada.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
        back: 'Voltar',
      },
    },
  },
};
