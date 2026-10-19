// src/constants/languages/languagePtBr/languageChargeBillExpenses.ts
// Tradução PT-BR do módulo "Contas a Pagar" (ChargeBillExpense — Operacional
// / Agricultura / Carregamento). Namespace `chargeBillExpenses` — LIVRE, sem
// colisão com `expenses` (domínio Financeiro homônimo) nem com
// `chargeBillIncomes` (gêmeo).

import { ModuleChargeBillExpenses } from '@/@types/language/module-charge-bill-expenses';

export const languageChargeBillExpenses: ModuleChargeBillExpenses = {
  chargeBillExpense: {
    singularLabel: 'Conta a Pagar',
    pluralLabel: 'Contas a Pagar',
    titleModule: 'Contas a Pagar',
    list: {
      pageTitle: 'Contas a Pagar',
      pageSubtitle: 'Gerencie as contas a pagar do carregamento.',
      deletedToast: 'Conta a pagar excluída com sucesso.',
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
        titleEmpty: 'Nenhuma conta a pagar cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira conta a pagar.',
        cta: 'Adicionar',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
      deleteConfirm: {
        title: 'Confirmar exclusão',
        description: 'Esta conta a pagar será excluída permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
    },
    form: {
      title: {
        create: 'Nova Conta a Pagar',
        edit: 'Editar Conta a Pagar',
      },
      fields: {
        code: 'Código',
        dtEmission: 'Dt. Emissão',
        dueDate: 'Dt. Vencimento',
        number: 'N. Documento',
        amount: 'Valor',
        provider: 'Fornecedor',
        branch: 'Filial do Fornecedor',
        cultivation: 'Rateio Produto',
        description: 'Descrição',
      },
      placeholders: {
        code: 'Gerado automaticamente ao salvar',
        provider: 'Todos Associados',
        cultivation: 'Todos',
      },
      hints: {
        branchRequiresProvider: 'Selecione um fornecedor primeiro',
        providerHasNoBranches: 'Este fornecedor não possui filiais cadastradas',
      },
      toasts: {
        createdSuccess: 'Conta a pagar criada com sucesso.',
        updatedSuccess: 'Conta a pagar atualizada com sucesso.',
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
        title: 'Conta a pagar não encontrada.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
        back: 'Voltar',
      },
    },
  },
};
