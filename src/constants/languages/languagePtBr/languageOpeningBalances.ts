// src/constants/languages/languagePtBr/languageOpeningBalances.ts
// Tradução PT-BR do módulo de ESTOQUE INICIAL (Cadastros Base). TASK-FE-1040
// (fundação) — rótulo fiel ao legado (`trad.estoque_inicial`, Doc Bruta §13).
// TASK-FE-1042 (listagem) acrescenta `list`/`filter`.

import { ModuleOpeningBalances } from '@/@types/language/module-opening-balances';

export const languageOpeningBalances: ModuleOpeningBalances = {
  openingBalance: {
    singularLabel: 'Estoque Inicial',
    pluralLabel: 'Estoques Iniciais',
    list: {
      pageTitle: 'Estoques Iniciais',
      pageSubtitle: 'Administre os saldos iniciais lançados por produto e armazém.',
      deletedToast: 'Estoque Inicial removido com sucesso',
      table: {
        product: 'Produto',
        measurement: 'Un. Medida',
        warehouse: 'Armazém',
        quantity: 'Quantidade',
        movementDate: 'Dt. Movimento',
        providerLot: 'Lote Fornecedor',
        classification: 'Classificação',
        // Fallback literal do legado (`trad.var_nao_possui`).
        noData: 'Não Possui',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum estoque inicial cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro estoque inicial.',
        titleFiltered: 'Nenhum estoque inicial encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Estoque Inicial',
      },
    },
    filter: {
      title: 'Filtrar estoques iniciais',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por produto ou lote',
      product: 'Produto',
      productPlaceholder: 'Todos os produtos',
      warehouse: 'Armazém',
      warehousePlaceholder: 'Todos os armazéns',
    },
    // Formulário Criar/Editar, Zonas 1-3 — TASK-FE-1043.
    form: {
      title: {
        create: 'Novo Estoque Inicial',
        edit: 'Editar Estoque Inicial',
      },
      subtitle: {
        create: 'Preencha os dados do saldo inicial de estoque',
        edit: 'Atualize o saldo inicial de estoque',
      },
      sections: {
        identification: 'Identificação',
        quantitiesValues: 'Quantidades & Valores',
        additionalInfo: 'Informações Adicionais',
        coffeeInfo: 'Informações do Café',
      },
      fields: {
        product: 'Produto',
        warehouse: 'Armazém',
        measurement: 'Unidade de Medida',
        quantity: 'Qtde. Total',
        amount: 'Vl. Unitário',
        totalAmount: 'Valor Total',
        averageCost: 'Custo Médio Unitário',
        providerLot: 'Lote Fornecedor',
        expirationDate: 'Dt. de Validade',
        classification: 'Classificação',
        drink: 'Bebida',
      },
      placeholders: {
        product: 'Buscar produto por nome ou código...',
        warehouse: 'Selecione o armazém...',
        providerLot: 'Ex: LOT-2025-001',
        classification: 'Selecione a classificação...',
      },
      hints: {
        measurementAutoFilled: 'Preenchida automaticamente a partir do produto selecionado',
        totalAmountFormula: '= Qtde. × Vl. Unit.',
        averageCostFormula: '= Valor Total ÷ Qtde. Total',
      },
      // Jargão de classificação de bebida/qualidade de xícara do Café
      // (`agro365/app/ItemInvoice.php::drinks()`) — texto IDÊNTICO nos 3
      // idiomas, mesma grafia do legado (jargão técnico não se traduz).
      drinkOptions: {
        extMole: 'EXT. MOLE',
        mole: 'MOLE',
        duroMais: 'DURO +',
        duro: 'DURO',
        duroVerde: 'DURO/VERDE',
        duroSujo: 'DURO/SUJO',
        duroFrtd: 'DURO/FRTD',
        duro1Riada: 'DURO/1 RIADA',
        duro2Riadas: 'DURO/2 RIADAS',
        duro3Riadas: 'DURO/3 RIADAS',
        duro4Riadas: 'DURO/4 RIADAS',
        duroRiado: 'DURO RIADO',
        riado: 'RIADO',
        d1ri1rio: 'D/1RI/1RIO',
        d1ri2rio: 'D/1RI/2RIO',
        d2ri1rio: 'D/2RI/1RIO',
        dRiRio: 'D/RI/RIO',
        riadoRio: 'RIADO/RIO',
        rio: 'RIO',
        rioZona: 'RIO ZONA',
        rioZonal: 'RIO ZONAL',
      },
      validation: {
        quantityRequired: 'Informe a quantidade',
        quantityMin: 'Informe uma quantidade válida (maior que zero)',
        quantityMax: 'A quantidade total excede o máximo permitido.',
        amountRequired: 'Informe o valor unitário',
        amountMin: 'O valor unitário não pode ser negativo',
        amountMax: 'O valor unitário excede o máximo permitido.',
        totalMax:
          'O valor total (quantidade × valor unitário) excede o máximo permitido (99.999.999,99).',
        providerLotRequired: 'Lote obrigatório para este produto',
        providerLotMaxLength: 'O lote deve ter no máximo 15 caracteres',
        expirationDateRequired: 'Data de validade obrigatória para este produto',
      },
      duplicateAlert: {
        title: 'Já existe um saldo inicial para este produto neste armazém.',
        dismissAction: 'Entendi',
      },
      errors: {
        invalidFields: 'Existem campos obrigatórios não preenchidos ou inválidos.',
      },
    },
    // Detalhe (view) — TASK-FE-1045.
    detail: {
      pageTitle: 'Visualizar Estoque Inicial',
      notFound: {
        title: 'Estoque Inicial não encontrado',
        description: 'O registro solicitado não existe ou foi removido.',
        back: 'Voltar',
      },
      actions: {
        back: 'Voltar',
        edit: 'Editar',
      },
    },
    // Ações de Excel (download modelo/import/export) — TASK-FE-1047.
    excel: {
      downloadTemplate: 'Baixar modelo',
      export: 'Exportar',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
      exportError: 'Não foi possível exportar os dados. Tente novamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Estoque Inicial',
        subtitle:
          'Baixe o modelo, preencha e envie a planilha para lançar os saldos iniciais em lote.',
        instructions:
          'As colunas Produto, Armazém, Qtde Total e Vl. Unitário são obrigatórias em cada linha. Selecione o Produto e o Armazém a partir dos dropdowns validados (abas auxiliares da planilha) — o saldo é sempre importado sem lote.',
        warning: {
          title: 'Registros existentes são sobrescritos',
          description:
            'Se já existir um saldo inicial para o mesmo produto e armazém, a quantidade e o valor unitário desta planilha SUBSTITUEM os valores atuais — a importação nunca soma às quantidades já lançadas.',
        },
        downloadShortcut: 'Baixar modelo',
        fileUpload: {
          label: 'Planilha preenchida',
          hint: 'Envie o arquivo .xlsx preenchido a partir do modelo baixado.',
          dropzoneTitle: 'Arraste a planilha ou clique para selecionar',
          dropzoneDraggingTitle: 'Solte a planilha aqui',
          changeLabel: 'Trocar arquivo',
          removeLabel: 'Remover arquivo',
          errorTypeMessage: 'Formato não aceito. Envie um arquivo .xlsx.',
          errorSizeMessage: 'Arquivo excede o tamanho máximo de 10MB.',
        },
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        importSuccessToast: 'Importação do estoque inicial concluída com sucesso.',
        result: {
          imported: 'Importados',
        },
        rowErrors: {
          title: 'Algumas linhas não puderam ser importadas — corrija e envie novamente',
          rowPrefix: 'Linha {row}:',
        },
        closeButton: 'Fechar',
      },
    },
  },
};
