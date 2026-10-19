// src/constants/languages/languagePtBr/languageSanitary.ts
// Tradução PT-BR do módulo SANITÁRIO (Operacional > Pecuária > Manejo, F-062).
// Namespace `sanitary` — LIVRE (contrato-tela-lane-c-sanitario-frontend.md §2.1).
// Rótulos literais do legado onde `field_manifest_*` os documenta (Código,
// Data, Lote, Responsável, Animais, Dose Animal, Un. Medida, Estoque, Centro
// de Custo, Observação, Controle de Mão de Obra, Tipo, Executor,
// Quantidade Total) — TASK-SAN-FE-01, Regra 5.

import { ModuleSanitary } from '@/@types/language/module-sanitary';

export const languageSanitary: ModuleSanitary = {
  sanitary: {
    singularLabel: 'Sanitário',
    pluralLabel: 'Sanitários',
    titleModule: 'Sanitário',
    list: {
      pageTitle: 'Sanitário',
      pageSubtitle: 'Gerencie os eventos sanitários da fazenda.',
      newButton: 'Novo',
      createMultipleButton: 'Criar em Lote',
      deletedToast: 'Sanitário excluído com sucesso.',
      table: {
        code: 'Código',
        date: 'Data',
        batch: 'Lote',
        responsible: 'Responsável',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum sanitário cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro sanitário.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      filter: {
        title: 'Filtrar sanitários',
        batch: 'Lote',
        responsible: 'Responsável',
      },
      deleteDialog: {
        title: 'Confirmar exclusão',
        descriptionTemplate:
          'O sanitário {code} será excluído permanentemente. Esta ação não pode ser desfeita.',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    detail: {
      title: 'Sanitário',
      backButton: 'Voltar',
      sections: {
        identification: 'Identificação',
        products: 'Produtos',
        animals: 'Animais',
        labor: 'Controle de Horas',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        batch: 'Lote',
        warehouse: 'Armazém',
        product: 'Produto',
        measurement: 'Un. Medida',
        stock: 'Estoque',
        dose: 'Dose Animal',
        total: 'Qtd. Total',
        costCenter: 'Centro de Custo',
        note: 'Observação',
        funcType: 'Tipo',
        executor: 'Executor',
        quantity: 'Quantidade Total',
      },
      emptySection: 'Nenhum registro nesta seção.',
      notFound: {
        title: 'Sanitário não encontrado.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
    },
    form: {
      title: {
        create: 'Novo Sanitário',
        edit: 'Editar Sanitário',
      },
      sections: {
        header: 'Identificação',
        items: 'Produtos',
        labor: 'Mão de Obra',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        batch: 'Lote',
        timeControl: 'Controle de Mão de Obra',
        animals: 'Animais',
        warehouse: 'Armazém',
        product: 'Produto',
        measurement: 'Un. Medida',
        stock: 'Estoque',
        dose: 'Dose Animal',
        costCenter: 'Centro de Custo',
        note: 'Observação',
        funcType: 'Tipo',
        executor: 'Executor',
        totalQuantity: 'Quantidade Total',
      },
      placeholders: {
        batch: 'Selecione o lote',
        animals: 'Selecione os animais',
        warehouse: 'Selecione o armazém',
        product: 'Selecione o produto',
        measurement: 'Selecione a unidade',
        funcType: 'Selecione o tipo',
        executor: 'Selecione o executor',
      },
      markAllButton: 'Marcar todos',
      unmarkAllButton: 'Desmarcar todos',
      funcTypeOptions: {
        employee: 'Funcionário',
        function: 'Função',
        provider: 'Fornecedor',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado ao salvar',
        selectBatchFirst: 'Selecione o lote primeiro',
      },
      addItem: 'Adicionar item',
      removeItem: 'Remover item',
      addLabor: 'Adicionar linha',
      removeLabor: 'Remover linha',
      emptyItemsRow: 'Nenhum item adicionado.',
      emptyLaborRow: 'Nenhuma linha de mão de obra adicionada.',
      stockInsufficientWarning: 'Saldo em estoque insuficiente para a dose informada.',
      validation: {
        dateRequired: 'A data é obrigatória.',
        batchRequired: 'O lote é obrigatório.',
        animalsRequired: 'Selecione ao menos 1 animal.',
        itemsRequired: 'Adicione ao menos 1 item de produto.',
        warehouseRequired: 'O armazém é obrigatório.',
        productRequired: 'O produto é obrigatório.',
        measurementRequired: 'A unidade de medida é obrigatória.',
        quantityRequired: 'A dose é obrigatória.',
        quantityMin: 'A dose não pode ser negativa.',
        laborFuncTypeRequired: 'O tipo é obrigatório.',
        laborExecutorRequired: 'O executor é obrigatório.',
        laborMeasurementRequired: 'A unidade de medida é obrigatória.',
        laborTotalQuantityRequired: 'A quantidade total é obrigatória.',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'As alterações não salvas serão perdidas.',
        confirm: 'Sair sem salvar',
        cancel: 'Continuar editando',
      },
      toast: {
        createdSuccess: 'Sanitário criado com sucesso.',
        updatedSuccess: 'Sanitário atualizado com sucesso.',
      },
    },
    createMultipleDialog: {
      title: 'Criar Sanitário em Lote',
      fields: {
        batches: 'Lotes',
        animals: 'Animais',
      },
      placeholders: {
        batches: 'Selecione os lotes',
      },
      validation: {
        batchesRequired: 'Selecione ao menos 1 lote.',
        itemsRequired: 'Adicione ao menos 1 item de produto.',
      },
      submitButton: 'Criar',
      cancelButton: 'Cancelar',
      successToast: 'Sanitários criados com sucesso.',
    },
    report: {
      pageTitle: 'Relatório de Sanitário por Lote',
      pageSubtitle: 'Exporte o histórico de aplicações sanitárias por lote em PDF ou Excel.',
      filters: {
        category: 'Categoria',
        corral: 'Curral',
        batch: 'Lote',
        animal: 'Animal',
        product: 'Produto',
        startDate: 'Dt. Início',
        endDate: 'Dt. Fim',
      },
      placeholders: {
        category: 'Todas as categorias',
        corral: 'Todos os currais',
        animal: 'Selecione o animal',
        product: 'Selecione o produto',
      },
      hint: {
        datesRequired: 'Selecione o período (Data Início e Data Fim) para gerar o relatório.',
      },
      exportPdf: 'PDF',
      exportXlsx: 'Excel (XLSX)',
      toasts: {
        success: 'Relatório gerado com sucesso.',
        genericError: 'Não foi possível gerar o relatório.',
      },
    },
  },
};
