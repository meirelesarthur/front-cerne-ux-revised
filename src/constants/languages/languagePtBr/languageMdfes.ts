// src/constants/languages/languagePtBr/languageMdfes.ts
// Tradução PT-BR do módulo "MDFe" (Mdfe — domínio Fiscal-Transporte,
// execução 045, Onda 1, TASK-MDFE-FE-01).

import { ModuleMdfes } from '@/@types/language/module-mdfes';

export const languageMdfes: ModuleMdfes = {
  mdfe: {
    titleModule: 'MDFe',
    singularLabel: 'MDFe',
    pluralLabel: 'MDFes',

    list: {
      pageTitle: 'MDFe',
      pageSubtitle: 'Administre os Manifestos de Documentos Fiscais Eletrônicos.',
      deletedToast: 'MDFe removido com sucesso',
      table: {
        integrationStatus: '',
        numero: '#',
        emissor: 'Emissor',
        dataInicioViagem: 'Data início viagem',
        cnpjContratante: 'CNPJ Contratante',
        estado: 'Estado',
        quantidadeCarga: 'Qtd. carga',
        valorCarga: 'Valor carga',
        mdfeNumero: 'Número MDFe',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        view: 'Visualizar',
        print: 'Imprimir',
      },
      emptyState: {
        titleEmpty: 'Nenhum MDFe cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro MDFe.',
        titleFiltered: 'Nenhum MDFe encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo MDFe',
      },
      naoEncerradosButton: 'Não encerrados',
      helpButton: 'Ajuda',
      quotaBlockedMessage:
        'A cota mensal de emissão de MDFe do seu plano foi atingida. Entre em contato para aumentar o limite.',
      printError: 'Não foi possível gerar o relatório do MDFe.',
    },

    filter: {
      title: 'Filtrar MDFe',
      estado: 'Estado',
      estadoAll: 'Todos',
      dataInicioViagemDe: 'Início da viagem de',
      dataInicioViagemAte: 'Início da viagem até',
      emissor: 'Emissor',
      veiculo: 'Veículo',
    },

    estadoOptions: {
      novo: 'Novo',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      cancelado: 'Cancelado',
    },

    cargaPosteriorOptions: {
      yes: 'Sim',
      no: 'Não',
    },

    typeEmissionOptions: {
      normal: 'Normal',
      contingencia: 'Contingência',
    },

    tabs: {
      geral: 'Geral',
      transporte: 'Transporte',
      descarga: 'Descarga',
    },

    form: {
      title: { create: 'Novo MDFe', edit: 'Editar MDFe' },
      editBlockedToast: {
        title: 'Edição bloqueada',
        description: 'Este MDFe não pode mais ser editado no estado atual.',
      },
      subtitle: {
        create: 'Cadastre um novo Manifesto de Documentos Fiscais Eletrônicos.',
        edit: 'Atualize os dados do MDFe.',
      },
      fields: {
        ufInicio: 'UF Início',
        ufFim: 'UF Fim',
        dataInicioViagem: 'Data início viagem',
        cargaPosterior: 'Carga posterior',
        typeEmission: 'Tipo de emissão',
        cnpjContratante: 'CNPJ Contratante',
        quantidadeCarga: 'Quantidade de carga',
        valorCarga: 'Valor da carga',
        produtoPredNome: 'Produto predominante',
        produtoPredNcm: 'NCM',
        produtoPredCodBarras: 'Código de barras',
        cepCarrega: 'CEP de carregamento',
        cepDescarrega: 'CEP de descarregamento',
        latitudeCarregamento: 'Latitude de carregamento',
        longitudeCarregamento: 'Longitude de carregamento',
        latitudeDescarregamento: 'Latitude de descarregamento',
        longitudeDescarregamento: 'Longitude de descarregamento',
        tpCarga: 'Tipo de carga',
        seguradoraNome: 'Seguradora',
        seguradoraCnpj: 'CNPJ da seguradora',
        numeroApolice: 'Número da apólice',
        numeroAverbacao: 'Número da averbação',
        infoComplementar: 'Informações complementares',
        infoAdicionalFisco: 'Informações adicionais ao fisco',
        veiculoTracao: 'Veículo de tração',
        veiculoReboque: 'Reboque 1',
        veiculoReboque2: 'Reboque 2',
        veiculoReboque3: 'Reboque 3',
        tpEmit: 'Tipo de emitente',
        tpTransp: 'Tipo de transportador',
        lacRodo: 'Lacre rodoviário',
        condutorNome: 'Nome do condutor',
        condutorCpf: 'CPF do condutor',
      },
      cancelButton: 'Cancelar',
      saveButton: 'Salvar',
      saveDisabledTooltip: {
        prefix: 'Para salvar, preencha: ',
        municipioCarregamento: 'Município de Carregamento',
        infoDescarga: 'Informação de Descarga',
        condutorNome: 'Nome do condutor',
        condutorCpf: 'CPF do condutor',
      },
    },

    municipiosCarregamento: {
      sectionTitle: 'Municípios de Carregamento',
      cidade: 'Cidade',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhum município adicionado.',
      columnCidade: 'Cidade',
    },

    percurso: {
      sectionTitle: 'Percurso (UFs)',
      uf: 'UF',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhuma UF de percurso adicionada.',
      columnUf: 'UF',
    },

    ciot: {
      sectionTitle: 'CIOTs',
      codigo: 'Código',
      cpfCnpj: 'CPF/CNPJ',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhum CIOT adicionado.',
      stagingMessage: 'Informe código e documento',
      columnCodigo: 'Código',
      columnCpfCnpj: 'CPF/CNPJ',
      codeLengthError: 'O CIOT deve ter exatamente 12 dígitos numéricos.',
      requiredForTpEmit:
        'Informe ao menos um CIOT: obrigatório para MDF-e de prestador de serviço de transporte (tipo de emitente 1 ou 3).',
    },

    valePedagio: {
      sectionTitle: 'Vale-pedágio',
      cnpjFornecedor: 'CNPJ do fornecedor',
      cnpjFornecedorPagador: 'CNPJ do fornecedor pagador',
      numeroCompra: 'Número da compra',
      valor: 'Valor',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhum vale-pedágio adicionado.',
      stagingMessage: 'Informe todos os campos do vale-pedágio',
    },

    payment: {
      sectionTitle: 'Pagamentos',
      responsibleName: 'Nome do responsável',
      responsibleCpfCnpj: 'CPF/CNPJ do responsável',
      paymentType: 'Tipo de pagamento',
      componentType: 'Tipo de componente',
      amount: 'Valor',
      bankCode: 'Banco',
      agencyCode: 'Agência',
      cnpjIpef: 'CNPJ IPEF',
      pixKey: 'Chave PIX',
      additionalInfo: 'Informações adicionais',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhum pagamento adicionado.',
      stagingMessage: 'Informe nome, documento e valor',
    },

    infoDescarga: {
      sectionTitle: 'Informações de Descarga',
      tpUnidTransp: 'Tipo de unidade de transporte',
      idUnidTransp: 'Identificação (placa)',
      quantidadeRateio: 'Quantidade de rateio',
      cidade: 'Cidade de descarga',
      chaveNfe: 'Chave NFe',
      segCodNfe: 'Código de segurança NFe',
      chaveCte: 'Chave CTe',
      segCodCte: 'Código de segurança CTe',
      addButton: 'Adicionar',
      removeButton: 'Remover',
      emptyText: 'Nenhuma descarga adicionada.',
      stagingMessage: 'Informe tipo de unidade, identificação, quantidade de rateio e cidade',
      incompletePairMessage:
        'Informe a chave e o código de segurança juntos, ou deixe os dois em branco',
      unidadeCarga: {
        sectionTitle: 'Unidade de Carga',
        idUnidadeCarga: 'Identificação',
        quantidadeRateio: 'Quantidade de rateio',
        addButton: 'Adicionar',
        removeButton: 'Remover',
      },
      lacreUnidadeCarga: {
        sectionTitle: 'Lacre de Unidade de Carga',
        numero: 'Número',
        addButton: 'Adicionar',
        removeButton: 'Remover',
      },
      lacreTransporte: {
        sectionTitle: 'Lacre de Transporte',
        numero: 'Número',
        addButton: 'Adicionar',
        removeButton: 'Remover',
      },
    },

    tpEmit: {
      prestadorServico: 'Prestador de serviço',
      transportadorProprio: 'Transportador próprio',
    },

    tpTransp: {
      etc: 'ETC',
      tac: 'TAC',
      ctc: 'CTC',
    },

    tipoCarga: {
      tc01: 'Granel sólido',
      tc02: 'Granel líquido',
      tc03: 'Frigorificada',
      tc04: 'Conteinerizada',
      tc05: 'Carga geral',
      tc06: 'Neogranel',
      tc07: 'Perigosa (granel sólido)',
      tc08: 'Perigosa (granel líquido)',
      tc09: 'Perigosa (carga frigorificada)',
      tc10: 'Perigosa (conteinerizada)',
      tc11: 'Perigosa (carga geral)',
    },

    paymentType: {
      pago: 'Pago',
      aPagar: 'A Pagar',
    },

    componentType: {
      valePedagio: 'Vale Pedágio',
      impostosTaxas: 'Impostos/Taxas',
      despesas: 'Despesas',
      outros: 'Outros',
    },

    unidadeTransporte: {
      u1: 'Rodoviário Tração',
      u2: 'Rodoviário Reboque',
      u3: 'Navio',
      u4: 'Balsa',
      u5: 'Aeronave',
      u6: 'Vagão',
      u7: 'Outros',
    },

    naoEncerrados: {
      pageTitle: 'MDFe não encerrados',
      pageSubtitle: 'Consulte os MDFes ainda não encerrados por emissor.',
      emissorRequired: 'Selecione um emissor para consultar.',
      submitButton: 'Consultar',
      table: {
        chave: 'Chave',
        protocolo: 'Protocolo',
        mdfeNumero: 'Número MDFe',
        createdAt: 'Criado em',
      },
      encerrarButton: 'Encerrar',
      encerrarTooltip: 'Disponível após a emissão SEFAZ (Onda 2)',
      emptyState: {
        title: 'Nenhum MDFe não encerrado.',
        description: 'Selecione um emissor e consulte novamente.',
      },
    },

    detail: {
      sections: { header: 'Dados do MDFe' },
      fields: { dataEmissao: 'Data de Emissão' },
      notFound: {
        title: 'MDFe não encontrado.',
        description: 'O MDFe não existe ou foi removido.',
        back: 'Voltar',
      },
      actions: { edit: 'Editar' },
    },

    emission: {
      panelTitle: 'Emissão SEFAZ',
      emitButton: 'Emitir',
      emitSuccessToast: 'MDFe emitido com sucesso.',
      emitGenericError: 'Não foi possível emitir o MDFe junto à SEFAZ.',
      emitModal: {
        title: 'Emitir MDFe',
        description:
          'Confirma a emissão deste MDFe junto à SEFAZ? Esta ação transmite o documento e não pode ser desfeita.',
        confirmButton: 'Confirmar Emissão',
        issuerLabel: 'Emissor',
        issuerPlaceholder: 'Selecione o emissor',
        issuerRequired: 'Selecione o emissor do MDFe',
        noIssuersAvailable: 'Nenhum emissor elegível para emissão foi encontrado.',
        loadIssuersError: 'Não foi possível carregar os emissores.',
      },
      cancelButton: 'Cancelar MDFe',
      cancelSuccessToast: 'MDFe cancelado com sucesso.',
      cancelGenericError: 'Não foi possível cancelar o MDFe junto à SEFAZ.',
      closeButton: 'Encerrar',
      closeSuccessToast: 'MDFe encerrado com sucesso.',
      closeGenericError: 'Não foi possível encerrar o MDFe junto à SEFAZ.',
      closeModal: {
        title: 'Encerrar MDFe',
        description:
          'Confirma o encerramento deste MDFe junto à SEFAZ? Esta ação não pode ser desfeita.',
        confirmButton: 'Confirmar Encerramento',
      },
      downloadXmlButton: 'Baixar XML',
      downloadXmlError: 'Não foi possível baixar o XML deste MDFe.',
      motivoLabel: 'Motivo',
      motivoRequired: 'Informe o motivo do cancelamento.',
      motivoMinLength: 'O motivo deve ter no mínimo 15 caracteres.',
      fields: {
        mdfeNumero: 'Número MDFe',
        chave: 'Chave de Acesso',
        protocolo: 'Protocolo',
        dateSendSefaz: 'Data de Envio SEFAZ',
      },
      cancelModal: {
        title: 'Cancelar MDFe',
        description:
          'Informe o motivo do cancelamento. Esta ação transmite um evento à SEFAZ e não pode ser desfeita.',
        motivoPlaceholder: 'Descreva o motivo do cancelamento (mínimo 15 caracteres)',
        confirmButton: 'Confirmar Cancelamento',
      },
    },
  },
};
