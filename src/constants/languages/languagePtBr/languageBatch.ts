// src/constants/languages/languagePtBr/languageBatch.ts
// Tradução PT-BR do módulo de LOTES ANIMAIS (Cadastros Base / Pecuária).
// Fundação da regeneração das telas (TASK-FE-1074) — mirror `languageCausaMortePerda`
// + `statusOptions` (enum BatchStatus A/P/I/R, consumido por TASK-FE-1075) +
// `archiveConfirm` (M5) + `importExport` (D1, contrato v1.1 §8).

import { ModuleBatches } from '@/@types/language/module-batches';

export const languageBatch: ModuleBatches = {
  batch: {
    singularLabel: 'Lote Animal',
    pluralLabel: 'Lotes Animais',
    list: {
      pageTitle: 'Lotes Animais',
      pageSubtitle: 'Administre os lotes de manejo do rebanho.',
      deletedToast: 'Lote animal excluído com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        date: 'Data',
        specie: 'Espécie',
        categories: 'Categorias',
        status: 'Status',
        totalAnimals: 'Total de Animais',
      },
      actions: {
        edit: 'Editar lote animal',
        delete: 'Excluir lote animal',
        archive: 'Arquivar lote animal',
      },
      emptyState: {
        titleEmpty: 'Nenhum lote animal cadastrado.',
        titleFiltered: 'Nenhum resultado encontrado.',
        titleEmptyNoCreate: 'Nenhum lote animal disponível.',
        descriptionEmpty: 'Comece adicionando o primeiro lote animal.',
        descriptionFiltered: 'Tente ajustar ou remover os filtros atuais.',
        descriptionEmptyNoCreate:
          'Ainda não há lotes animais cadastrados. Entre em contato com o administrador da plataforma.',
        cta: 'Novo Lote Animal',
      },
      deleteConfirm: {
        title: 'Excluir lote animal',
        description: 'Tem certeza que deseja excluir o lote animal',
        warning: 'Esta exclusão é definitiva e não pode ser desfeita.',
      },
    },
    statusOptions: {
      active: 'Ativo',
      pending: 'Pendente',
      inactive: 'Inativo',
      archived: 'Arquivado',
    },
    archiveConfirm: {
      title: 'Arquivar lote animal',
      description: 'Tem certeza que deseja arquivar o lote animal',
      warning: 'Um lote arquivado sai da listagem e não pode ser reativado pela tela.',
      successToast: 'Lote animal arquivado com sucesso',
    },
    filter: {
      title: 'Filtrar Lotes Animais',
      description: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Novo Lote Animal',
        edit: 'Editar Lote Animal',
      },
      subtitle: {
        create: 'Cadastre um novo lote de manejo do rebanho.',
        edit: 'Atualize os dados do lote animal.',
      },
      fields: {
        code: 'Código',
        description: 'Descrição',
        date: 'Data',
        specie: 'Espécie',
        parameterWeight: 'Peso',
        categories: 'Categorias',
        animals: 'Animais',
        animalsCounter: '{count} animal(is) selecionado(s)',
      },
      placeholders: {
        description: 'Ex.: Lote de recria — pasto 3',
        specie: 'Buscar por descrição',
        parameterWeight: 'Buscar por descrição',
        categories: 'Buscar por descrição',
        animals: 'Buscar por identificação',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        dateRequired: 'A data é obrigatória',
        specieRequired: 'Selecione uma espécie',
        categoriesRequired: 'Selecione ao menos uma categoria',
        categoriesMin: 'Selecione ao menos uma categoria',
      },
      warnings: {
        categoriesClearedBySpecieChange:
          'As categorias e os animais selecionados foram removidos porque a espécie foi alterada.',
        animalsClearedByCategoryRemoval:
          'Os animais selecionados desta categoria foram removidos porque a categoria foi desmarcada.',
        animalsClearedByWeightChange:
          'Alguns animais selecionados foram removidos porque não pertencem mais à faixa de peso escolhida.',
      },
      candidateAnimals: {
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        totalAnimalsLabel: 'Total Animais',
        emptyLabel: 'Nenhum animal candidato encontrado para esta categoria.',
        errorLabel: 'Erro ao carregar os animais candidatos.',
        retryLabel: 'Tentar novamente',
        searchPlaceholder: 'Buscar por identificação',
      },
      footer: {
        totalAnimals: 'Total Animais Lote',
        totalWeight: 'Peso Total Lote (Kg)',
        averageWeight: 'Peso Medio Lote (Kg)',
        totalUa: 'Total de UA',
        averageUa: 'UA Média',
      },
    },
    importExport: {
      downloadTemplate: 'Baixar modelo',
      downloadTemplateError: 'Não foi possível baixar o modelo',
      importSpreadsheet: 'Importar planilha',
      modalTitle: 'Importar Lote Animal',
      modalDescription:
        'Cada arquivo importa exatamente 1 lote (cabeçalho + animais). Para importar vários lotes, repita o processo com um arquivo por lote.',
      instructions:
        'Preencha a aba "cabecalho" (Data, Espécie, Descrição) e a aba "animais" (Identificação) do modelo antes de enviar.',
      warning: {
        title: 'O lote pode ser criado vazio',
        description:
          'Se alguma identificação de animal não for encontrada (inexistente, já vinculada a outro lote, ou de outra fazenda), o lote ainda assim é criado — porém sem nenhum animal vinculado. Confira sempre a mensagem exibida após a importação.',
      },
      fileUpload: {
        label: 'Arquivo (.xlsx)',
        hint: 'Apenas arquivos .xlsx, até 10 MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Formato não aceito. Envie um arquivo .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo de 10 MB.',
      },
      result: {
        successTitle: 'Lote importado com sucesso',
        partialTitle: 'Lote criado sem animais vinculados',
        codeLabel: 'Código do lote',
        totalAnimalsLabel: 'Animais vinculados',
      },
      successToast: 'Lote animal importado com sucesso',
      errorToast: 'Não foi possível importar o lote animal',
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
    },
    // Relatório "Performance Animal Individual" (F-234, TASK-FE-PA-01,
    // `GET /batch-profitability-report`) — mirror `report` de Vacas Prenhas
    // (languageBreedingMating.ts), adaptado ao gate OU `sale`/período.
    report: {
      pageTitle: 'Performance Animal',
      pageSubtitle: 'Gere o relatório de performance individual do animal em PDF ou Excel.',
      filters: {
        sale: 'Venda',
        batch: 'Lote',
        startDate: 'Dt. Inicial',
        endDate: 'Dt. Final',
      },
      fields: {
        reportType: 'Tipo de Relatório',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Gerar Relatório',
      successToast: 'Relatório gerado com sucesso.',
      errorToast: 'Não foi possível gerar o relatório.',
      hint: {
        saleOrPeriodRequired:
          'Selecione uma Venda ou preencha o período (Data Inicial e Data Final) para gerar o relatório.',
      },
    },
  },
};
