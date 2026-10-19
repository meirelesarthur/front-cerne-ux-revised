// src/constants/languages/languagePtBr/languageLossAnimal.ts
// Tradução PT-BR do módulo de PERDAS (Operacional / Pecuária).

import { ModuleLossAnimals } from '@/@types/language/module-loss-animals';

export const languageLossAnimal: ModuleLossAnimals = {
  lossAnimal: {
    singularLabel: 'Perda',
    pluralLabel: 'Perdas',
    titleModule: 'Perdas',
    detailTitle: 'Detalhes da Perda',
    list: {
      pageTitle: 'Perdas',
      pageSubtitle: 'Gerencie os registros de perda de animais da fazenda ativa.',
      deletedToast: 'Perda excluída com sucesso',
      table: {
        code: 'Código',
        animal: 'Animal',
        category: 'Categoria',
        cause: 'Causa',
        date: 'Data',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma informação cadastrada.',
        descriptionEmpty: 'Comece cadastrando sua primeira perda.',
        titleEmptyNoCreate: 'Nenhuma perda disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há perdas cadastradas. Contate o administrador da plataforma.',
        cta: 'Nova Perda',
      },
      deleteConfirm: {
        title: 'Excluir perda',
        description: 'Tem certeza que deseja excluir este registro de perda',
        warning: 'Esta exclusão é definitiva e não pode ser desfeita.',
      },
      deleteBusinessError:
        'Registro vinculado a outra tabela, somente poderá ser excluído se retirar o vínculo.',
    },
    filter: {
      title: 'Filtrar Perdas',
      animal: 'Animal',
      cause: 'Causa',
      startDate: 'Data início',
      endDate: 'Data fim',
    },
    form: {
      title: {
        create: 'Nova Perda',
        edit: 'Editar Perda',
      },
      fields: {
        code: 'Código',
        codePlaceholder: 'Gerado ao salvar',
        date: 'Data',
        responsible: 'Responsável',
        batch: 'Lote',
        animal: 'Animal',
        cause: 'Causa',
        note: 'Observação',
      },
      placeholders: {
        batch: 'Selecione o lote',
        animal: 'Busque pela identificação',
        cause: 'Selecione a causa',
        note: 'Observação opcional',
      },
      validation: {
        dateRequired: 'A data é obrigatória',
        animalRequired: 'Selecione um animal',
        causeRequired: 'Selecione uma causa',
        checkDate: {
          animalEntryAfterLossDate: 'Data de entrada do animal é mais recente que a data da perda.',
          batchCreationAfterMovementDate:
            'Data de criação do lote/área é mais recente que a data da movimentação.',
        },
      },
    },
  },
};
