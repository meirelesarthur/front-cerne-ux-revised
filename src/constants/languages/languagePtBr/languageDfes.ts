// src/constants/languages/languagePtBr/languageDfes.ts
// Tradução PT-BR do módulo "DFe Recebidas" (Dfe — domínio Fiscal, execução
// 044, TASK-DFE-FE-03). Mirror estrutural de `languageBaseRegistrations.nfse`
// (mesmo domínio Fiscal, contrato-dfe-norm.md como fonte de fidelidade de
// campos/comportamentos).

import { ModuleDfes } from '@/@types/language/module-dfes';

export const languageDfes: ModuleDfes = {
  dfe: {
    singularLabel: 'DFe Recebida',
    pluralLabel: 'DFe Recebidas',

    list: {
      pageTitle: 'DFe Recebidas',
      pageSubtitle: 'Administre os documentos fiscais eletrônicos recebidos via SEFAZ.',
      table: {
        integrationStatus: 'Status',
        emissor: 'Emissor',
        // LST-04/LST-05 (contrato-dfe-norm.md) — adicionadas na TASK-DFE-FE-05
        // (ausentes na fundação da TASK-DFE-FE-03, gap fechado nesta Tarefa).
        ieFornecedor: 'IE Fornecedor',
        ieDestinatario: 'IE Destinatário',
        cpfCnpj: 'CPF/CNPJ',
        numero: 'Número',
        valor: 'Valor',
        dtEmissao: 'Dt. Emissão',
        manifesto: 'Manifesto',
        prazoManifesto: 'Prazo Manifesto',
        lancada: 'Lançada',
        chave: 'Chave de Acesso',
      },
      manifestoOptions: {
        naoManifestada: 'Não manifestada',
        ciencia: 'Ciência da Operação',
        confirmacao: 'Confirmação da Operação',
        desconhecimento: 'Desconhecimento da Operação',
        naoRealizada: 'Operação não Realizada',
      },
      prazoManifesto: {
        manifestado: 'Manifestado',
        restamDias: 'restam {{days}} dia(s)',
        encerrado: 'Prazo encerrado',
      },
      launchedOptions: {
        produto: 'Produto',
        animal: 'Animal',
        despesa: 'Despesa',
        abate: 'Abate',
        naoLancada: 'Não lançada',
      },
      actions: {
        manifestar: 'Manifestar',
        alternarPessoal: 'Alternar pessoal',
        alternarRemessa: 'Alternar remessa',
        lancarProduto: 'Lançar Produto',
        lancarAnimal: 'Lançar Animal',
        lancarDespesa: 'Lançar Despesa',
        lancarRetorno: 'Lançar Retorno',
        gerarDanfe: 'Gerar DANFE',
        baixarXml: 'Baixar XML',
      },
      bulkSelection: {
        limitExceeded: 'Selecione no máximo 20 documentos por vez.',
        selectAllDisabledHint: '"Selecionar todos" está disponível só com até 20 itens na página.',
      },
      emptyState: {
        titleNoIssuer: 'Selecione o Emissor',
        descriptionNoIssuer: 'Selecione o Emissor para filtrar e listar os DFe recebidos.',
        titleEmpty: 'Nenhum DFe sincronizado ainda.',
        descriptionEmpty: 'Use "Buscar DFe" para sincronizar os documentos deste Emissor.',
        titleFiltered: 'Nenhum DFe encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou o período informado.',
      },
      error: {
        message: 'Não foi possível carregar os DFe recebidos.',
        retry: 'Tentar novamente',
      },
      downloadXmlError: 'Não foi possível baixar o XML deste DFe.',
      downloadXmlSuccess: 'XML baixado com sucesso',
      generateDanfeError: 'Não foi possível gerar o DANFE deste DFe.',
      toggleSuccess: 'Atualizado com sucesso',
      toggleError: 'Não foi possível atualizar este DFe.',
      launchXmlDownloadError: 'Não foi possível baixar o XML para lançamento.',
      launchGenericError: 'Não foi possível iniciar o lançamento deste DFe.',
    },

    filter: {
      title: 'Filtrar DFe Recebidas',
      issuer: 'Selecione o Emissor',
      issuerPlaceholder: 'Buscar emissor fiscal...',
      issuerRequired: 'Obrigatório para listar melhor',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por chave, número ou CPF/CNPJ',
      dateFrom: 'Emitida de',
      dateTo: 'Emitida até',
      dateRangeInvalid: 'A data final é anterior à data inicial.',
      launched: 'Lançada',
      launchedAll: 'Todas',
      launchedOptions: {
        yes: 'Sim',
        no: 'Não',
      },
      status: 'Manifesto',
      statusAll: 'Todos',
      isPersonal: 'Pessoal',
      isPersonalAll: 'Todos',
      isShipment: 'Remessa',
      isShipmentAll: 'Todos',
    },

    syncScreen: {
      pageTitle: 'Buscar DFe',
      pageSubtitle: 'Consulte os documentos fiscais eletrônicos recebidos deste Emissor.',
      issuer: 'Selecione o Emissor',
      issuerPlaceholder: 'Buscar emissor fiscal...',
      issuerRequired: 'Selecione um Emissor Fiscal',
      submitButton: 'Consultar DF-e',
      loadingMessage:
        'Consultando o webservice nacional... isso pode levar alguns segundos ou minutos.',
      successToast: 'Sincronização com a SEFAZ concluída.',
      errorToast: 'Não foi possível consultar os DF-e deste Emissor.',
      certificateMissingError:
        'Este Emissor não possui certificado digital A1 cadastrado. Cadastre o certificado para consultar DF-e.',
      certificateMissingLink: 'Ir para o certificado do Emissor',
      syncInProgress: 'Sincronização deste emissor já em andamento.',
      environmentMissingError:
        'Este Emissor não tem o ambiente SEFAZ (produção/homologação) configurado. Configure o ambiente no cadastro do Emissor.',
      environmentMissingLink: 'Ir para o cadastro do Emissor',
      emptyIssuerState: 'Selecione um Emissor para consultar os DF-e.',
    },

    manifest: {
      modalTitle: 'Manifestar DFe',
      modalTitleBatch: 'Manifestar {{count}} DFe selecionados',
      description: 'Selecione o evento de manifestação a transmitir à SEFAZ.',
      fields: {
        evento: 'Evento',
        eventoPlaceholder: 'Selecione o evento',
        justificativa: 'Justificativa',
        justificativaPlaceholder: 'Descreva o motivo (mínimo 15 caracteres)',
      },
      confirmButton: 'Confirmar Manifestação',
      cancelButton: 'Cancelar',
      successMessage: 'Manifestação enviada com sucesso',
      errorMessage: 'Não foi possível enviar a manifestação à SEFAZ.',
      validation: {
        eventoRequired: 'Selecione o evento de manifestação',
        justificativaRequired: 'A justificativa é obrigatória para este evento',
        justificativaMin: 'A justificativa deve ter ao menos 15 caracteres',
      },
      eventOptions: {
        ciencia: 'Ciência da Operação',
        confirmacao: 'Confirmação da Operação',
        desconhecimento: 'Desconhecimento da Operação',
        naoRealizada: 'Operação não Realizada',
      },
      deadlineDisabledHint: 'Opção indisponível — prazo de manifestação encerrado.',
    },

    report: {
      pageTitle: 'DFe/Lançadas',
      pageSubtitle:
        'Gere o relatório de documentos fiscais eletrônicos e seu status de lançamento.',
      fields: {
        issuer: 'Selecione o Emissor',
        issuerPlaceholder: 'Buscar emissor fiscal...',
        issuerRequired: 'O Emissor é obrigatório para gerar o relatório',
        dateEmissionFrom: 'Emitida de',
        dateEmissionTo: 'Emitida até',
        dateLaunchFrom: 'Lançada de',
        dateLaunchTo: 'Lançada até',
        launched: 'Lançada',
        launchedAll: 'Todas',
        reportType: 'Tipo de Relatório',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Gerar relatório',
      loadingMessage: 'Gerando o relatório... isso pode levar alguns segundos.',
      successToast: 'Relatório gerado com sucesso',
      errorToast: 'Não foi possível gerar o relatório de DFe.',
      issuerRequiredError: 'Selecione o Emissor antes de gerar o relatório.',
    },

    return: {
      pageTitle: 'Vincular Retorno',
      pageSubtitle: 'Selecione a venda pendente a vincular com esta NFe de retorno.',
      filter: {
        type: 'Tipo de Vínculo',
        typeAll: 'Todos',
        typeOptions: {
          sale: 'Venda Animal',
          slaughterMap: 'Romaneio',
        },
        date: 'Data',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por código ou cliente',
      },
      table: {
        code: 'Código',
        client: 'Cliente',
        date: 'Data',
        amount: 'Valor',
      },
      emptyState: {
        title: 'Nenhuma venda pendente para este Emissor.',
        description: 'Não há vendas pendentes de finalização para o CPF/CNPJ desta NFe.',
      },
      acceptSuggestionButton: 'Aceitar sugestão',
      suggestionsTitle: 'Sugestões',
      notReturnError: 'Esta DF-e não é de retorno.',
      alreadyLaunchedError: 'Esta DF-e já foi lançada.',
      loadError: 'Não foi possível carregar os candidatos do retorno.',
      linkAndFinishButton: 'Vincular e finalizar',
      backButton: 'Voltar',
    },
  },
};
