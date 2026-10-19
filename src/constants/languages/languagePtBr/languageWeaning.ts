// src/constants/languages/languagePtBr/languageWeaning.ts
// Tradução PT-BR do módulo de DESMAMA (Operacional > Pecuária > Manejo).
// Namespace `weaning` — LIVRE (`02-arquitetura-frontend-desmama.md`).

import { ModuleWeaning } from '@/@types/language/module-weaning';

export const languageWeaning: ModuleWeaning = {
  weaning: {
    singularLabel: 'Desmama',
    pluralLabel: 'Desmamas',
    list: {
      pageTitle: 'Desmama',
      pageSubtitle: 'Gerencie as desmamas da fazenda.',
      deletedToast: 'Desmama excluída com sucesso.',
      table: {
        code: 'Código',
        date: 'Data',
        type: 'Tipo',
        batch: 'Lote',
        responsible: 'Responsável',
        status: 'Processamento',
      },
      status: {
        pending: 'Pendente',
        finished: 'Finalizado',
        none: '—',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
        editDisabledTooltip: 'Esta desmama já tem processamento finalizado e não pode ser editada.',
        deleteDisabledTooltip:
          'Esta desmama já tem processamento finalizado e não pode ser excluída.',
      },
      emptyState: {
        titleEmpty: 'Nenhuma desmama cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira desmama.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar desmamas',
      responsible: 'Responsável',
    },
    deleteDialog: {
      title: 'Confirmar exclusão',
      descriptionTemplate:
        'A desmama {code} será excluída permanentemente. Esta ação não pode ser desfeita.',
    },
    type: {
      recria: 'Recria',
      venda: 'Venda',
    },
    form: {
      title: {
        create: 'Nova Desmama',
        edit: 'Editar Desmama',
        view: 'Visualizar Desmama',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        type: 'Tipo',
        batch: 'Lote',
        transferBatch: 'Lote (transferência)',
        responsible: 'Responsável',
        animals: 'Animais (mães)',
      },
      placeholders: {
        type: 'Selecione o tipo',
        batch: 'Selecione o lote',
        transferBatch: 'Selecione o lote de transferência',
        animals: 'Busque as mães pela identificação',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado ao salvar',
        selectBatchFirst: 'Selecione o lote primeiro',
      },
      validation: {
        transferSameAsOrigin: 'O lote de transferência deve ser diferente do lote de origem.',
      },
      buttons: {
        back: 'Voltar',
        edit: 'Editar',
      },
      finishedProcessingTooltip:
        'Esta desmama já tem processamento finalizado e não pode mais ser editada.',
    },
    report: {
      headerButtonLabel: 'Relatório',
      title: 'Relatório de Desmamas',
      pageSubtitle: 'Filtre o período e o formato para gerar o relatório.',
      fields: {
        startDate: 'Dt. Início',
        endDate: 'Dt. Fim',
        format: 'Formato',
      },
      format: {
        pdf: 'PDF',
        xlsx: 'Excel (XLSX)',
      },
      submitButton: 'Exportar',
      cancelButton: 'Cancelar',
      errorToast: 'Não foi possível gerar o relatório.',
      downloadSuccess: 'Relatório gerado com sucesso.',
    },
  },
};
