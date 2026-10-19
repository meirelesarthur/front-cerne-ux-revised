// src/constants/languages/languagePtBr/languageBreedingBatch.ts
// Tradução PT-BR do módulo "Lotes/Reprodução" (BreedingBatch — Operacional /
// Reprodução, 97-Esteiras/048, Tarefas 04/05/06/07).

import { ModuleBreedingBatch } from '@/@types/language/module-breeding-batch';

export const languageBreedingBatch: ModuleBreedingBatch = {
  breedingBatch: {
    singularLabel: 'Lote de Reprodução',
    pluralLabel: 'Lotes de Reprodução',
    titleModule: 'Lotes de Reprodução',
    list: {
      pageTitle: 'Lotes de Reprodução',
      pageSubtitle: 'Gerencie os lotes de reprodução cadastrados.',
      deletedToast: 'Lote de reprodução excluído com sucesso',
      newButton: 'Novo Lote',
      table: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        description: 'Descrição',
        actions: 'Ações',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum lote de reprodução cadastrado.',
        descriptionEmpty: 'Comece cadastrando um novo lote de reprodução.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
        cta: 'Novo Lote',
      },
      filter: {
        title: 'Filtrar Lotes de Reprodução',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
      },
      deleteDialog: {
        title: 'Excluir lote de reprodução?',
        description: 'será excluído permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
    },
    detail: {
      title: 'Lote de Reprodução',
      backButton: 'Voltar',
      editButton: 'Editar',
      sections: {
        generalData: 'Dados Gerais',
        linkedBatches: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        description: 'Descrição',
        responsible: 'Responsável',
        breedingSeason: 'Estação de Monta',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      notFound: {
        title: 'Lote de reprodução não encontrado.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
      invalidParamsToast: {
        title: 'Lote de Reprodução',
        description: 'Parâmetros inválidos para exibir o detalhe.',
      },
      linkedBatchesTable: {
        code: 'Código',
        description: 'Descrição',
      },
      linkedBatchesEmpty: 'Nenhum lote vinculado.',
    },
    form: {
      title: {
        create: 'Novo Lote de Reprodução',
        edit: 'Editar Lote de Reprodução',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        description: 'Descrição',
        breedingSeason: 'Estação de Monta',
        batches: 'Lotes',
        addBatchButton: 'Adicionar Lote',
        removeBatchButton: 'Remover',
      },
      validation: {
        dateRequired: 'Informe a data',
        descriptionRequired: 'Informe a descrição',
        breedingSeasonRequired: 'Informe a estação de monta',
        batchesMinRequired: 'Adicione ao menos um lote',
        batchRequired: 'Selecione um lote',
        batchDuplicate: 'Este lote já foi selecionado em outra linha',
        batchInvalidDate: 'Data de criação do lote é mais recente que a data do lote de reprodução',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
    },
  },
};
