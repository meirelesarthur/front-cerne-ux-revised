// src/constants/languages/languagePtBr/languageModuleWeighing.ts
// Tradução PT-BR do módulo PESAGEM RODOVIÁRIA (ModuleWeighing — Operacional,
// execução 044, F-045, TASK-MWG-FE-01). Namespace `moduleWeighing` —
// DELIBERADAMENTE disjunto de `weighing` (pesagem ANIMAL, F-071, já em
// produção) — `CONTRATO-TELA-PESAGEM-FE §1`.
//
// `common` reúne os blocos reutilizados por TODAS as 9 telas + 5 diálogos
// (get_pwa_i18n_pattern §2a) — inclusive os labels dos 3 enums do domínio
// (`status`/`type`/`category`, contrato API §3). Chaves por-tela (`list`,
// `create`, `wizard`, ...) chegam como STUB nesta Tarefa — cada Tarefa de
// tela (02-09) preenche a sua sem re-tocar as demais já prontas.

import { ModuleModuleWeighing } from '@/@types/language/module-module-weighing';

export const languageModuleWeighing: ModuleModuleWeighing = {
  moduleWeighing: {
    singularLabel: 'Pesagem Rodoviária',
    pluralLabel: 'Pesagens Rodoviárias',
    titleModule: 'Pesagem Rodoviária',
    common: {
      table: {
        actions: 'Ações',
      },
      toast: {
        deleteSuccess: 'Pesagem rodoviária excluída com sucesso.',
      },
      deleteDialog: {
        title: 'Confirmar exclusão',
        descriptionTemplate:
          'A pesagem rodoviária {code} será excluída permanentemente. Esta ação não pode ser desfeita.',
      },
      buttons: {
        new: 'Nova Pesagem',
        save: 'Salvar',
        cancel: 'Cancelar',
      },
      status: {
        preCadastro: 'Pré-Cadastro',
        pesagemInicial: 'Pesagem Inicial',
        classificacao: 'Classificação',
        pesagemFinal: 'Pesagem Final',
        finalizado: 'Finalizado',
      },
      type: {
        vendaSaida: 'Venda/Saída',
        compraEntrada: 'Compra/Entrada',
        avulsa: 'Avulsa',
        entradaColheita: 'Entrada Colheita',
        entradaTerceiros: 'Entrada de Terceiros',
      },
      category: {
        externa: 'Externa',
        interna: 'Interna',
      },
    },
    list: {
      pageTitle: 'Pesagem Rodoviária',
      pageSubtitle: 'Gerencie as pesagens rodoviárias da fazenda.',
      reportButton: 'Relatório',
      table: {
        status: 'Status',
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        warehouse: 'Armazém',
        product: 'Produto',
        type: 'Tipo',
        category: 'Categoria',
      },
      actions: {
        edit: 'Editar',
        nextStep: 'Próxima Etapa',
        finalize: 'Finalizar',
        issueNfe: 'Emitir NFe',
        issueTransfer: 'Emitir Romaneio',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma pesagem rodoviária cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira pesagem.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      filter: {
        title: 'Filtrar pesagens',
        responsible: 'Responsável',
        equipment: 'Equipamento',
        warehouse: 'Armazém',
        product: 'Produto',
        provider: 'Fornecedor',
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
      legend: {
        label: 'Legenda',
      },
    },
    create: {
      title: {
        create: 'Nova Pesagem Rodoviária',
        edit: 'Editar Pesagem Rodoviária',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        product: 'Produto',
        measurement: 'Medida',
        area: 'Área',
        warehouse: 'Armazém',
        equipment: 'Equipamento/Veículo',
        provider: 'Motorista',
        providerBuy: 'Fornecedor',
        client: 'Cliente',
        farmTo: 'Fazenda de destino',
        employee: 'Responsável',
        hasClassification: 'Classificar por qualidade?',
        discountTable: 'Tabela de desconto',
        providerLot: 'Lote do fornecedor',
        expirationDate: 'Validade',
        note: 'Observação',
        type: 'Tipo',
        category: 'Categoria',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado automaticamente',
      },
      validation: {
        requiredField: 'Campo obrigatório.',
        clientRequired: 'Cliente é obrigatório para Venda/Saída ou Entrada de Terceiros externa.',
        providerBuyRequired: 'Fornecedor é obrigatório para Compra/Entrada externa.',
        farmToRequired: 'Fazenda de destino é obrigatória para pesagem interna.',
        expirationDateRequired: 'Validade é obrigatória para produtos com controle de lote.',
      },
      toasts: {
        createdSuccess: 'Pesagem rodoviária criada com sucesso.',
        updatedSuccess: 'Pesagem rodoviária atualizada com sucesso.',
      },
      duplicateLotWarning: 'Este lote já foi usado em outra pesagem recente.',
    },
    wizard: {
      stepCounter: {
        label: 'Etapa',
        of: 'de',
      },
      footer: {
        back: 'Voltar',
        next: 'Avançar',
      },
      fields: {
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        netWeightPreview: 'Peso Líquido (previsto)',
        warehouse: 'Armazém',
      },
      stepTitles: {
        tare: 'Tara do Veículo',
        gross: 'Peso Total',
      },
      validation: {
        requiredField: 'Campo obrigatório.',
        weightRange: 'Informe um peso válido (maior que zero).',
        netWeightNegative: 'O peso líquido não pode ser negativo.',
      },
      toasts: {
        advancedSuccess: 'Etapa registrada com sucesso.',
      },
    },
    classification: {
      discountTable: 'Tabela de desconto',
      keys: {
        impureza: 'Impureza',
        umidade: 'Umidade',
        quebrado: 'Quebrado',
        esverdeado: 'Esverdeado',
        avariado: 'Avariado',
        taxaRecepcao: 'Taxa de Recepção',
      },
      percentLabel: '%',
      appliedLabel: 'Aplicar',
      appliedManualLabel: 'Desconto aplicado (%)',
      discountPreviewTitle: 'Preview de desconto',
      discountPreviewTotal: 'Desconto total (previsto)',
      validation: {
        percentRange: 'Percentual deve estar entre 0 e 100.',
      },
    },
    finish: {
      title: 'Finalizar Pesagem Rodoviária',
      summary: {
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        discount: 'Desconto de Classificação',
        netWeight: 'Peso Líquido',
      },
      dfeList: {
        title: 'DFe elegíveis para vínculo',
        emptyUnavailable: 'Lista de DFe indisponível no momento.',
        number: 'Número',
        issuer: 'Emitente',
        issueDate: 'Data de emissão',
        select: 'Selecionar',
      },
      confirmButton: 'Confirmar Finalização',
      toasts: {
        finalizedSuccess: 'Pesagem rodoviária finalizada com sucesso.',
      },
    },
    report: {
      pageTitle: 'Relatório de Pesagem Rodoviária',
      pageSubtitle: 'Gere o relatório das pesagens rodoviárias da fazenda.',
      filters: {
        startDate: 'Data inicial',
        endDate: 'Data final',
        type: 'Tipo',
        category: 'Categoria',
        warehouse: 'Armazém',
        product: 'Produto',
        client: 'Cliente',
      },
      exportPdfButton: 'Baixar PDF',
      exportXlsxButton: 'Baixar Excel',
      toasts: {
        success: 'Relatório gerado com sucesso.',
        generateError: 'Não foi possível gerar o relatório.',
      },
      validation: {
        startDateRequired: 'A data inicial é obrigatória.',
        endDateRequired: 'A data final é obrigatória.',
        endDateBeforeStart: 'A data final deve ser maior ou igual à data inicial.',
      },
      columns: {
        grossOrNetLabel: 'Peso Bruto',
      },
    },
    detail: {
      printButton: 'Imprimir',
      fields: {
        code: 'Código',
        date: 'Data',
        product: 'Produto',
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        netWeight: 'Peso Líquido',
        measurement: 'Medida',
        discount: 'Desconto de Classificação',
        averageCost: 'Custo Médio',
        total: 'Total',
      },
      history: {
        title: 'Histórico',
        datetime: 'Data/Hora',
        status: 'Status',
        inputType: 'Origem',
        inputTypeAuto: 'Automático',
        inputTypeManual: 'Manual',
      },
      notFound: {
        title: 'Pesagem não encontrada',
        description: 'A pesagem solicitada não existe ou você não tem permissão para vê-la.',
        backAction: 'Voltar',
      },
    },
    dialogs: {
      warehouse: {},
      product: {},
      equipment: {},
      provider: {},
      client: {},
    },
    scaleConnection: {
      connecting: 'Conectando à balança...',
      connected: 'Balança conectada',
      disconnected: 'Balança desconectada',
      payloadError: 'Não foi possível ler o peso da balança. Digite manualmente.',
      captureButton: 'Capturar peso',
    },
    scaleTutorial: {
      title: 'Como conectar a balança',
      helpButton: 'Ajuda com a balança',
      instructions:
        'Baixe e instale o conector da balança no computador conectado à balança física. ' +
        'Com o conector em execução, clique em "Capturar peso" nesta tela para ler o valor ' +
        'automaticamente. Se a balança não conectar, você ainda pode digitar o peso manualmente.',
      statusLabel: 'Status da conexão',
      downloadButton: 'Baixar conector',
    },
  },
};
