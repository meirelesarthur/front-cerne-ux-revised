// src/constants/languages/languagePtBr/languageWeighing.ts
// Tradução PT-BR do módulo PESAGEM (Operacional > Pecuária > Manejo, F-071).
// Namespace `weighing` — LIVRE (contrato-tela-lane-c-pesagem-frontend.md §7).
// Rótulos literais do legado onde `field_manifest_*` os documenta (Código,
// Data, Lote, Categoria, Movimentação ABC Corte, Preço do @, Animais, Peso,
// Último Peso, Data Últ. Pesagem, Ganho, GMD, Ultrassom, Vincular Sanitário,
// Armazém, Produto, Un. Medida, Estoque, Dose/Animal, Observação, Relatório
// Individual, Importar, Baixar Modelo) — TASK-PES-FE-01, Regra 5.
//
// CORREÇÃO (AD_REJECTED, UT-000109, execução correcoes-lote3 item 4): `isStock`
// (campo `is_stock`, já existente no backend/`WeighingListItem`/form desde
// TASK-PES-FE-01) estava rotulado 'Pesagem de Estoque' — divergência do rótulo
// REAL do legado, confirmado por leitura direta de
// `resources/views/weighings/_forms.blade.php` (`Form::select('is_stock',
// 'Movimentação ABC Corte')`) e `weighings/index.blade.php` (coluna
// "Movimentação ABC Corte", `{{ $item->is_stock ? 'Sim' : 'Não' }}`). Rótulo
// corrigido para 'Movimentação ABC Corte' em `detail.fields`/`form.fields`
// (mesmo campo, sem mudança de payload/schema) + coluna nova
// `list.table.isStock` fechando a divergência também na grid (GAP-FE-PES-01
// tinha fechado 6 colunas sem este campo).

import { ModuleWeighing } from '@/@types/language/module-weighing';

export const languageWeighing: ModuleWeighing = {
  weighing: {
    singularLabel: 'Pesagem',
    pluralLabel: 'Pesagens',
    titleModule: 'Pesagem',
    list: {
      pageTitle: 'Pesagem',
      pageSubtitle: 'Gerencie as pesagens dos animais da fazenda.',
      newButton: 'Novo',
      importButton: 'Importar',
      downloadTemplateButton: 'Baixar Modelo',
      deletedToast: 'Pesagem excluída com sucesso.',
      reportDownloadedToast: 'Relatório baixado com sucesso.',
      table: {
        code: 'Código',
        date: 'Data',
        isStock: 'Movimentação ABC Corte',
        batchOrCategory: 'Lote/Categoria',
        animalsCount: 'Qtd. Animais',
        averageWeight: 'Peso Médio',
        averageGain: 'Ganho Médio',
        gmd: 'GMD',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
        report: 'Relatório Individual',
      },
      emptyState: {
        titleEmpty: 'Nenhuma pesagem cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira pesagem.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      filter: {
        title: 'Filtrar pesagens',
        batch: 'Lote',
        category: 'Categoria',
        responsible: 'Responsável',
      },
      deleteDialog: {
        title: 'Confirmar exclusão',
        descriptionTemplate:
          'A pesagem {code} será excluída permanentemente. Esta ação não pode ser desfeita.',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    detail: {
      title: 'Pesagem',
      backButton: 'Voltar',
      sections: {
        identification: 'Identificação',
        animals: 'Animais',
        sanitary: 'Sanitário',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        batch: 'Lote',
        category: 'Categoria',
        isStock: 'Movimentação ABC Corte',
        arrobaValue: 'Preço do @',
        animal: 'Animal',
        weight: 'Peso',
        lastWeight: 'Último Peso',
        lastWeightDate: 'Data Últ. Pesagem',
        gain: 'Ganho',
        gmd: 'GMD',
        ultrasound: 'Ultrassom',
        aol: 'AOL',
        egs: 'EGS',
        marm: 'MARM',
        classification: 'Classe',
        warehouse: 'Armazém',
        product: 'Produto',
        measurement: 'Un. Medida',
        stock: 'Estoque',
        dose: 'Dose/Animal',
        total: 'Total',
        note: 'Observação',
      },
      emptySection: 'Nenhum registro nesta seção.',
      notFound: {
        title: 'Pesagem não encontrada.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
    },
    form: {
      title: {
        create: 'Nova Pesagem',
        edit: 'Editar Pesagem',
      },
      sections: {
        header: 'Identificação',
        animals: 'Animais',
        sanitary: 'Sanitário',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        batch: 'Lote',
        category: 'Categoria',
        isStock: 'Movimentação ABC Corte',
        arrobaValue: 'Preço do @',
        sanitary: 'Vincular Sanitário',
        animal: 'Animal',
        weight: 'Peso',
        lastWeight: 'Último Peso',
        lastWeightDate: 'Data Últ. Pesagem',
        gain: 'Ganho',
        gmd: 'GMD',
        ultrasound: 'Ultrassom',
        aol: 'AOL',
        egs: 'EGS',
        marm: 'MARM',
        classification: 'Classe',
        warehouse: 'Armazém',
        product: 'Produto',
        measurement: 'Un. Medida',
        stock: 'Estoque',
        dose: 'Dose/Animal',
        total: 'Total',
        note: 'Observação',
      },
      placeholders: {
        batch: 'Selecione o lote',
        category: 'Selecione a categoria',
        animal: 'Selecione o animal',
        warehouse: 'Selecione o armazém',
        product: 'Selecione o produto',
        measurement: 'Selecione a unidade',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado ao salvar',
        selectBatchFirst: 'Selecione o lote primeiro',
        sanitaryUnavailableInEdit: 'Esta pesagem não tem registro Sanitário para editar',
      },
      addAnimal: 'Adicionar animal',
      removeAnimal: 'Remover animal',
      addItem: 'Adicionar item',
      removeItem: 'Remover item',
      emptyAnimalsRow: 'Nenhum animal adicionado.',
      allAnimalsSelected: 'Todos os animais já foram selecionados.',
      dateConflictBlocked:
        'Há animais com data de pesagem inválida. Corrija a data ou troque/remova os animais destacados para salvar.',
      emptyItemsRow: 'Nenhum item adicionado.',
      stockInsufficientWarning: 'Saldo em estoque insuficiente para a dose informada.',
      validation: {
        dateRequired: 'A data é obrigatória.',
        batchOrCategoryRequired: 'Selecione um lote ou uma categoria.',
        arrobaValueRequired: 'O preço do @ é obrigatório.',
        animalsRequired: 'Selecione ao menos 1 animal.',
        animalRequired: 'O animal é obrigatório.',
        weightRequired: 'O peso é obrigatório.',
        lastWeightRequired: 'O último peso é obrigatório.',
        lastWeightDateRequired: 'A data do último peso é obrigatória.',
        aolRequired: 'Informe o AOL.',
        egsRequired: 'Informe o EGS.',
        marmRequired: 'Informe o MARM.',
        classificationRequired: 'Informe a classe.',
        classificationMaxLength: 'A classe deve ter no máximo 1 caractere.',
        itemsRequired: 'Adicione ao menos 1 item de produto.',
        warehouseRequired: 'O armazém é obrigatório.',
        productRequired: 'O produto é obrigatório.',
        measurementRequired: 'A unidade de medida é obrigatória.',
        quantityRequired: 'A dose é obrigatória.',
        quantityMin: 'A dose não pode ser negativa.',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'As alterações não salvas serão perdidas.',
        confirm: 'Sair sem salvar',
        cancel: 'Continuar editando',
      },
      toast: {
        createdSuccess: 'Pesagem criada com sucesso.',
        updatedSuccess: 'Pesagem atualizada com sucesso.',
      },
    },
    importDialog: {
      title: 'Importar Pesagens',
      subtitle: 'Importe pesagens em lote a partir de uma planilha .xlsx.',
      instructions:
        'Baixe o modelo, preencha os dados das pesagens e envie o arquivo preenchido abaixo.',
      downloadShortcut: 'Baixar modelo',
      warning: {
        title: 'Atenção antes de importar',
        description:
          'Se qualquer linha da planilha for inválida, nenhuma pesagem será importada — corrija os erros indicados e envie novamente.',
      },
      fields: {
        file: 'Arquivo da planilha',
      },
      fileUpload: {
        hint: 'Formato .xlsx, até 10MB.',
        dropzoneTitle: 'Arraste a planilha ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte a planilha aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Formato de arquivo não aceito. Envie um arquivo .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Não foi possível importar a planilha',
      },
      result: {
        created: 'Pesagens importadas',
      },
      importSuccessToast: 'Pesagens importadas com sucesso.',
      noPermission: 'Você não tem permissão para importar pesagens.',
      submitButton: 'Importar',
      cancelButton: 'Cancelar',
      closeButton: 'Fechar',
      downloadTemplateButton: 'Baixar Modelo',
    },
  },
};
