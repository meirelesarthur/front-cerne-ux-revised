// src/constants/languages/languagePtBr/languageAnimals.ts
// Tradução PT-BR do módulo "Rebanho" (Animal — Cadastros Base / Pecuários,
// execução 027). TASK-FE-880 (infra) + TASK-FE-881 (listagem/filtro).

import { ModuleAnimals } from '@/@types/language/module-animals';

export const languageAnimals: ModuleAnimals = {
  animal: {
    singularLabel: 'Animal',
    pluralLabel: 'Rebanho',

    typeOptions: {
      single: 'Individual',
      noId: 'Sem Identificação',
    },

    reproductiveStatusOptions: {
      pregnant: 'Prenha',
      empty: 'Vazia',
      calved: 'Parida',
    },

    statusOptions: {
      active: 'Ativo',
      pending: 'Pendente',
      death: 'Morto',
      loss: 'Perdido',
      sale: 'Vendido',
      deleted: 'Excluído',
    },

    originOptions: {
      birth: 'Nascimento',
      processing: 'Processamento',
      registration: 'Cadastro',
    },

    depreciationTypeOptions: {
      withResidual: 'Com Valor Residual',
      withoutResidual: 'Sem Valor Residual',
    },

    list: {
      pageTitle: 'Rebanho',
      pageSubtitle: 'Administre os animais do rebanho da fazenda ativa.',
      deletedToast: 'Animal excluído com sucesso',
      table: {
        type: 'Tipo',
        identificationType: 'Tipo de Identificação',
        identificationTypeEmpty: '—',
        identification: 'Identificação',
        identificationEmpty: 'S/ID',
        category: 'Categoria',
        batch: 'Lote',
        batchEmpty: 'Sem lote',
        batchMore: '+{count}',
        weight: 'Peso Atual (Kg)',
        status: 'Status',
        reproductiveStatus: 'Status Reprodutivo',
        reproductiveStatusEmpty: 'N/I',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum animal cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro animal do rebanho.',
        titleEmptyNoCreate: 'Nenhum animal disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há animais cadastrados. Entre em contato com o administrador da fazenda.',
        titleFiltered: 'Nenhum animal encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Animal',
      },
      deleteConfirm: {
        title: 'Excluir animal',
        description: 'Tem certeza que deseja excluir o animal',
        warning:
          'Esta ação é definitiva e não pode ser desfeita. Se houver vínculos dependentes, a exclusão pode ser bloqueada pelo sistema.',
      },
      error: {
        message: 'Não foi possível carregar o rebanho.',
        retry: 'Tentar novamente',
      },

      bulkBar: {
        ariaLabel: 'Ações em massa',
        clearSelection: 'Limpar seleção',
        selectedOne: '{count} animal selecionado',
        selectedMany: '{count} animais selecionados',
        reproductiveStatus: 'Status Reprodutivo',
        batchTransfer: 'Transferir de Lote',
        deleteMany: {
          action: 'Apagar Animais',
          confirmWord: 'APAGAR',
        },
      },
    },

    managementScreen: {
      pageTitle: 'Gestão Animais',
      pageSubtitle:
        'Gerencie o rebanho e as ações em lote (transferência, status reprodutivo, exclusão) a partir de uma tela dedicada.',
    },

    filter: {
      title: 'Filtrar rebanho',
      search: 'Pesquisar Id Animal',
      searchPlaceholder: 'Pesquisar Id Animal',
      category: 'Categoria',
      categoryAll: 'Todas',
      batch: 'Lote',
      batchAll: 'Todos',
      status: 'Status',
      statusAll: 'Todos',
      origin: 'Origem',
      originAll: 'Todas',
      reproductiveStatus: 'Status Reprodutivo',
      reproductiveStatusAll: 'Todos',
    },

    dialogs: {
      reproductiveStatus: {
        title: 'Status Reprodutivo em massa',
        countTemplate: 'Aplicar a {count} animais selecionados.',
        pregnancyDate: 'Data da Prenhez',
        birthForecast: 'Previsão de Parto',
        submitButton: 'Aplicar',
        successMessage: '{count} animal(is) atualizado(s) com sucesso.',
      },
      deleteMany: {
        title: 'Apagar animais',
        countTemplate: 'Você está prestes a apagar {count} animais.',
        warning:
          'Os animais serão excluídos. Animais com vínculos ativos (lançamentos, nascimentos, pesagens etc.) não podem ser excluídos e a operação inteira é cancelada.',
        confirmLabel: 'Digite {word} para confirmar',
        submitButton: 'Apagar',
        successMessage: '{count} animal(is) apagado(s) com sucesso.',
        blockedTitle: 'Os animais abaixo possuem vínculos ativos e impediram a exclusão:',
        blockedMore: 'e mais {count} animal(is).',
        blockedTruncated:
          'A lista foi limitada pelo servidor; podem existir outros animais bloqueados.',
        blockedDeselect: 'Desmarcar bloqueados',
      },
      batchTransfer: {
        title: 'Transferir de Lote',
        countTemplate: '{count} animais selecionados.',
        sameBatchMode: 'Mesmo lote para todos',
        perAnimalMode: 'Lote diferente por animal',
        batchLabel: 'Lote de destino',
        batchPlaceholder: 'Selecione o lote',
        animalColumnLabel: 'Animal',
        submitButton: 'Transferir',
        successMessage: '{count} animal(is) transferido(s) com sucesso.',
      },
    },

    excel: {
      downloadTemplate: 'Baixar modelo',
      downloadTemplateError: 'Não foi possível baixar o modelo.',
      export: 'Exportar',
      exportError: 'Não foi possível exportar o rebanho.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Rebanho',
        subtitle: 'Importe animais em lote a partir de uma planilha .xlsx.',
        instructions:
          'Baixe o modelo, preencha os dados do rebanho e envie o arquivo preenchido abaixo.',
        downloadShortcut: 'Baixar modelo',
        warning: {
          title: 'Atenção antes de importar',
          description:
            'Se qualquer linha da planilha for inválida, nenhum animal será importado — corrija os erros indicados e envie novamente.',
        },
        fileUpload: {
          label: 'Arquivo da planilha',
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
          created: 'Animais importados',
          childrenCreated: 'Bezerros criados',
        },
        importSuccessToast: 'Rebanho importado com sucesso.',
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        closeButton: 'Fechar',
      },
    },

    form: {
      title: {
        create: 'Novo Animal',
        edit: 'Editar Animal',
      },
      subtitle: {
        create: 'Cadastre um novo animal do rebanho da fazenda ativa.',
        edit: 'Altere os dados do animal selecionado.',
      },

      fields: {
        photo: 'Foto',
        type: 'Tipo',
        quantity: 'Quantidade',
        specie: 'Espécie',
        category: 'Categoria',
        breed: 'Raça',
        entryDate: 'Data de Entrada',
        birthDate: 'Data de Nascimento',
        identificationType: 'Tipo de Identificação',
        identification: 'Identificação',
        weight: 'Peso (Kg)',
        priceKiloAlive: 'Preço Kg Vivo',
        furDescription: 'Descrição Pelagem',
        note: 'Observação',
        startWeight: 'Peso de Entrada',
        valueUnitary: 'Valor Unitário',
        unityAnimalUa: 'UA (Unidade Animal)',
        priceArrobaAlive: 'Preço @ Vivo',

        motherAnimal: 'Mãe',
        fatherAnimal: 'Pai',

        categoryMatrice: 'Estágio Reprodutivo',
        reproductiveStatus: 'Status Reprodutivo',
        birthForecast: 'Previsão de Parto',

        childCategory: 'Categoria do Bezerro',
        childBirthDate: 'Data de Nascimento do Bezerro',
        childWeight: 'Peso do Bezerro',
        childIdentificationType: 'Tipo de Identificação do Bezerro',
        childIdentification: 'Identificação do Bezerro',

        depreciationType: 'Tipo de Depreciação',
        vlAcquisition: 'Valor de Aquisição',
        residual: 'Residual (%)',
        depreciation: 'Depreciação (%)',
        lifeBens: 'Vida Útil (anos)',
        vlResidual: 'Valor Residual',
        vlDepreciate: 'Valor a Depreciar',
        vlDepreciated: 'Vl. Depreciado',
        sdDepreciate: 'Sd. a Depreciar',
      },

      placeholders: {
        type: 'Selecione o tipo',
        specie: 'Selecione a espécie',
        category: 'Selecione a categoria',
        breed: 'Selecione a raça',
        identificationType: 'Selecione o tipo',
        identification: 'Digite a identificação',
        motherAnimal: 'Digite a identificação da mãe',
        fatherAnimal: 'Digite a identificação do pai',
        categoryMatrice: 'Selecione o estágio reprodutivo',
        reproductiveStatus: 'Selecione o status reprodutivo',
        childCategory: 'Selecione a categoria do bezerro',
        childIdentificationType: 'Selecione o tipo',
        depreciationType: 'Selecione o tipo',
      },

      hints: {
        specieRequired: 'Selecione a espécie para habilitar Categoria e Raça.',
        quantityBatch:
          'Serão criados {quantity} animais idênticos, todos "Sem Identificação" (S/ID).',
        calculatedEmpty: '—',
      },

      identifications: {
        sectionTitle: 'Identificação',
        sectionHint: 'Adicione ao menos um tipo/identificação para o animal individual.',
        emptyTitle: 'Nenhuma identificação adicionada.',
        addRowLabel: 'Adicionar identificação',
        removeRowLabel: 'Remover identificação',
        noIdHint:
          'Animal "Sem Identificação" — o sistema atribui automaticamente "S/ID" a cada registro criado.',
        duplicateWarningTitle: 'Identificação já cadastrada',
        duplicateWarningDescription:
          'A identificação "{{identification}}" já está em uso por outro animal ativo desta fazenda. Você ainda pode salvar normalmente.',
      },

      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar foto',
        removeLabel: 'Remover foto',
        errorType: 'Formato de arquivo não aceito.',
        errorSize: 'O arquivo excede o tamanho máximo permitido.',
      },

      sections: {
        genealogy: 'Genealogia',
        reproductiveStatus: 'Estágio/Status Reprodutivo',
        child: {
          title: 'Bezerro',
          hint: 'Preencha todos os campos para registrar o bezerro junto com a mãe.',
          createOnlyHint:
            'Disponível somente na criação do animal — o bezerro é registrado como um novo animal vinculado à mãe.',
        },
        depreciation: 'Depreciação',
      },
    },
  },
};
