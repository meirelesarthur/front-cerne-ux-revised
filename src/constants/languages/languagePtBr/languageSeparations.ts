// src/constants/languages/languagePtBr/languageSeparations.ts
// Tradução PT-BR do módulo de APARTAÇÃO (Operacional > Pecuária).
// Namespace `separations` — LIVRE (frontend-contract-apartacao.md §1).

import { ModuleSeparations } from '@/@types/language/module-separations';

export const languageSeparations: ModuleSeparations = {
  separation: {
    singularLabel: 'Apartação',
    pluralLabel: 'Apartações',
    list: {
      pageTitle: 'Apartação',
      pageSubtitle: 'Gerencie as apartações de lotes da fazenda.',
      deletedToast: 'Apartação excluída com sucesso.',
      table: {
        code: 'Código',
        date: 'Data',
        employeeName: 'Responsável',
        batchCount: 'Qtd. Lotes',
        animalCount: 'Qtd. Animais',
        processingStatus: {
          processed: 'Processado',
          pending: 'Pendente',
        },
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      helpVideo: 'Ajuda em vídeo',
      helpVideoComingSoon: 'Disponível em breve',
      emptyState: {
        titleEmpty: 'Nenhuma apartação cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira apartação.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar apartações',
      batch: 'Lote',
    },
    deleteDialog: {
      title: 'Confirmar exclusão',
      descriptionTemplate:
        'A apartação {code} será excluída permanentemente. Esta ação não pode ser desfeita.',
    },
    detail: {
      pageTitleTemplate: 'Apartação {code}',
      notFound: {
        title: 'Apartação não encontrada.',
        description: 'A apartação solicitada não existe ou foi removida.',
        back: 'Voltar para a listagem',
      },
      sections: {
        header: 'Cabeçalho',
        batches: 'Lotes',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        employeeName: 'Responsável',
      },
      batchesTable: {
        description: 'Lote',
        empty: 'Nenhum lote vinculado.',
      },
      backButton: 'Voltar',
    },
    form: {
      title: {
        create: 'Nova Apartação',
        edit: 'Editar Apartação',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        batches: 'Lotes',
      },
      placeholders: {
        batches: 'Selecione os lotes',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado ao salvar',
      },
      validation: {
        dateRequired: 'A data é obrigatória.',
        batchesRequired: 'Selecione ao menos um lote.',
        batchesMin: 'Selecione ao menos um lote.',
      },
      batchDateWarning: {
        title: 'Aviso de consistência de data',
        itemTemplate: '{description} (data {date})',
        description: 'Os lotes a seguir têm data divergente da apartação: {list}',
      },
    },
  },
};
