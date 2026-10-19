// src/constants/languages/languagePtBr/languageSharings.ts
// Tradução PT-BR do módulo "Compartilhamento" (Sharing — Integrações, F-122,
// 97-Esteiras/070). Rótulos pt-BR fiéis ao legado (`_forms.blade.php`/
// `index.blade.php`/`show.blade.php`, `sharings-frontend-contract.md`).

import { ModuleSharings } from '@/@types/language/module-sharings';

export const languageSharings: ModuleSharings['sharings'] = {
  singularLabel: 'Compartilhamento',
  pluralLabel: 'Compartilhamentos',
  list: {
    pageTitle: 'Compartilhamentos',
    pageSubtitle: 'Gerencie os compartilhamentos cadastrados.',
    table: {
      date: 'Data',
      tenant: 'Contratante',
      user: 'Responsável',
      actions: 'Ação',
    },
    actions: {
      edit: 'Editar',
      view: 'Visualizar',
      delete: 'Excluir',
    },
    emptyState: {
      title: 'Nenhum compartilhamento cadastrado.',
      description: 'Comece cadastrando um novo compartilhamento.',
      cta: 'Novo Compartilhamento',
    },
    deleteDialog: {
      header: 'Excluir compartilhamento?',
      body: 'Você tem certeza? Essa ação não poderá ser recuperada.',
      confirm: 'Excluir',
      cancel: 'Cancelar',
    },
    deletedToast: 'Compartilhamento excluído com sucesso.',
    error: {
      message: 'Não foi possível carregar os compartilhamentos.',
      retry: 'Tentar novamente',
    },
  },
  form: {
    createTitle: 'Compartilhamento',
    editTitle: 'Compartilhamentos',
    fields: {
      date: 'Data',
      responsible: 'Responsável',
      tenant: 'Contratante',
      items: 'Itens',
    },
    placeholders: {
      tenant: 'Informe o CPF/CNPJ do Contratante',
    },
    itemsLabel: 'Marcação',
    save: 'Salvar',
    cancel: 'Cancelar',
    createdToast: 'Compartilhamento criado com sucesso.',
    updatedToast: 'Compartilhamento atualizado com sucesso.',
    validation: {
      dateRequired: 'Informe a data',
      tenantRequired: 'Informe o Contratante',
      itemsRequired: 'Selecione ao menos um item',
    },
  },
  detail: {
    pageTitle: 'Compartilhamentos',
    responsible: 'Responsável',
    tenant: 'Contratante',
    date: 'Data',
    items: 'Itens',
    backButton: 'Voltar',
    notFound: {
      title: 'Compartilhamento não encontrado.',
      description: 'O registro pode ter sido excluído ou o link está incorreto.',
    },
    error: {
      message: 'Não foi possível carregar o compartilhamento.',
      retry: 'Tentar novamente',
    },
  },
};
