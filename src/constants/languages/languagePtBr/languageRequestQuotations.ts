// src/constants/languages/languagePtBr/languageRequestQuotations.ts
// Tradução pt-BR do módulo "Cotações" (RequestQuotation — Administrativo /
// Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01). Ver
// `@/@types/language/module-request-quotations` para o contrato completo.

import { ModuleRequestQuotations } from '@/@types/language/module-request-quotations';

export const languageRequestQuotations: ModuleRequestQuotations = {
  requestQuotation: {
    singularLabel: 'Cotação',
    pluralLabel: 'Cotações',

    form: {
      fields: {
        provider: 'Fornecedor',
        branch: 'Filial',
        requiresFile: 'Exigir informações técnicas do produto',
        note: 'Observação',
      },
      placeholders: {
        provider: 'Busque um fornecedor',
        branch: 'Selecione a filial',
        branchNoProvider: 'Selecione um fornecedor primeiro',
        note: 'Observações adicionais',
      },
      requiresFileOptions: {
        yes: 'Sim',
        no: 'Não',
      },
      validation: {
        providerRequired: 'Fornecedor é obrigatório',
        requiresFileRequired: 'Requer Anexo é obrigatório',
      },

      createTitle: 'Adicionar Fornecedor',
      editTitle: 'Editar Cotação',
      createdToast: 'Cotação criada com sucesso!',
      updatedToast: 'Cotação atualizada com sucesso!',
      errorFallback: 'Não foi possível salvar a cotação.',
    },

    statusOptions: {
      aguardando: 'Aguardando',
      enviada: 'Enviada',
      recebida: 'Recebida',
    },

    paymentMethodOptions: {
      aVista: 'À Vista',
      boleto: 'Boleto',
      cartao: 'Cartão',
      pix: 'Pix',
      cheque: 'Cheque',
    },

    tab: {
      title: 'Cotações',
      addProviderButton: 'Adicionar Fornecedor',
      sendEmailBatchButton: 'Enviar E-mail em Lote',
      emptyState: {
        title: 'Nenhuma cotação ainda',
        description: 'Adicione um fornecedor para começar a cotar esta solicitação.',
      },
      card: {
        selectAriaLabel: 'Selecionar cotação',
        fields: {
          creator: 'Responsável',
          totalValue: 'Valor',
          netValue: 'Valor com Desconto',
          saving: 'Saving',
          savingResponsible: 'Responsável do Saving',
        },
        actions: {
          view: 'Ver',
          edit: 'Editar',
          editObservation: 'Editar Observação',
          applySaving: 'Aplicar Saving',
          sendForAuthorization: 'Enviar para Autorização',
          delete: 'Excluir',
        },
      },
      deleteDialog: {
        title: 'Excluir Cotação',
        description: 'Tem certeza que deseja excluir a cotação de',
        warning: 'Esta ação não pode ser desfeita.',
      },
      deletedToast: 'Cotação excluída com sucesso!',
      deleteErrorFallback: 'Não foi possível excluir a cotação.',
    },

    stage: {
      itemsBlock: {
        title: 'Itens',
        blockedNotice: 'Informe todos os produtos para prosseguir com a cotação',
        columns: { product: 'Produto', quantity: 'Quantidade', description: 'Descrição' },
        saveButton: 'Salvar',
        savedToast: 'Registro atualizado com sucesso.',
        errorFallback: 'Não foi possível atualizar os itens.',
        quantityRequired: 'Este campo deve ser preenchido.',
        descriptionRequired: 'Este campo deve ser preenchido.',
        loadError: 'Não foi possível carregar os itens da solicitação.',
        retry: 'Tentar novamente',
      },
      providerBoard: {
        title: 'Sobre o fornecedor',
        corporateName: 'Razão Social',
        tradeName: 'Nome Fantasia',
        email: 'E-mail',
        phone: 'Telefone',
        cellphone: 'Celular',
        city: 'Cidade',
        loading: 'Carregando dados do fornecedor...',
        loadError: 'Não foi possível carregar os dados do fornecedor.',
      },
      whatsAppModal: {
        title: 'Enviar mensagens',
        column: 'Fornecedor/Vendedor',
        close: 'Fechar',
        sendTo: 'Enviar mensagem para',
        supplierTag: 'Fornecedor',
      },
      separate: {
        title: 'Criar Sub Solicitação',
        description:
          'Selecione os produtos/serviços que irão para a sub solicitação. Os demais continuam nesta solicitação.',
        requestLabel: 'Solicitação',
        itemsLabel: 'Itens',
        searchPlaceholder: 'Buscar item',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Selecionados',
        emptyLabel: 'Nenhum item encontrado.',
        itemsRequired: 'Selecione ao menos um item',
        loadError: 'Não foi possível carregar os itens da solicitação.',
        retry: 'Tentar novamente',
        submit: 'Salvar',
        successToast: 'Sub solicitação criada com sucesso.',
        createdCode: 'Código da nova solicitação',
      },
      queue: {
        receivedToast: 'Solicitação recebida com sucesso.',
        redoTooltip: 'Refazer',
      },
    },

    detail: {
      title: 'Detalhes da Cotação',
      fields: {
        quotationDate: 'Data da Cotação',
        expirationDate: 'Data de Expiração',
        providerResponsible: 'Responsável (Fornecedor)',
        observation: 'Observação do Fornecedor',
      },
      pendingReceiptNotice:
        'Itens e formas de pagamento ficam disponíveis após o fornecedor responder a cotação.',
      itemsSection: {
        title: 'Itens',
        empty: 'Nenhum item informado.',
        columns: {
          description: 'Descrição',
          brand: 'Marca',
          quantity: 'Quantidade',
          unitaryValue: 'Valor Unitário',
          total: 'Total',
          observation: 'Observação',
        },
      },
      paymentsSection: {
        title: 'Formas de Pagamento',
        empty: 'Nenhuma forma de pagamento informada.',
        columns: {
          paymentMethod: 'Forma de Pagamento',
          installments: 'Parcelas',
          interval: 'Intervalo (dias)',
          installmentValue: 'Valor da Parcela',
          total: 'Total',
        },
      },
      errorState: {
        title: 'Não foi possível carregar a cotação',
        description: 'Ocorreu um erro ao buscar os detalhes desta cotação.',
        retry: 'Tentar novamente',
      },
    },

    saving: {
      title: 'Aplicar Saving',
      fields: {
        responsible: 'Responsável',
        netValue: 'Valor com Desconto',
        netValueHelper: 'Valor final da cotação após o desconto negociado com o fornecedor.',
        savingPreview: 'Saving (%)',
      },
      placeholders: {
        responsible: 'Busque um responsável',
      },
      validation: {
        responsibleRequired: 'Responsável é obrigatório',
        discountRequired: 'Valor com Desconto é obrigatório',
        discountMin: 'Valor com Desconto não pode ser negativo',
        discountMustBeLessThanTotal:
          'Valor com Desconto deve ser menor que o valor total da cotação',
      },
      applyButton: 'Aplicar Saving',
      appliedToast: 'Saving aplicado com sucesso!',
      errorFallback: 'Não foi possível aplicar o saving.',
    },

    authorizer: {
      title: 'Enviar para Autorização',
      fields: {
        authorizer: 'Autorizador',
      },
      placeholders: {
        authorizer: 'Selecione um autorizador',
      },
      validation: {
        authorizerRequired: 'Autorizador é obrigatório',
      },
      emptyEligibleState: {
        title: 'Nenhum autorizador elegível',
        description: 'Não há autorizadores disponíveis para esta solicitação no momento.',
      },
      loadErrorState: {
        title: 'Não foi possível carregar os autorizadores',
        description: 'Ocorreu um erro ao buscar os autorizadores elegíveis.',
        retry: 'Tentar novamente',
      },
      sendButton: 'Enviar',
      sentToast: 'Solicitação enviada para autorização com sucesso!',
      errorFallback: 'Não foi possível enviar para autorização.',
    },

    emailBatch: {
      title: 'Enviar E-mail em Lote',
      description:
        'Selecione os destinatários de cada cotação selecionada. Cotações sem nenhum destinatário marcado não recebem e-mail.',
      providerRecipient: {
        label: 'Incluir e-mail do fornecedor',
        noEmailNotice: 'Fornecedor sem e-mail cadastrado.',
      },
      sellers: {
        label: 'Vendedores',
        searchPlaceholder: 'Buscar vendedor',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Selecionados',
        emptyLabel: 'Nenhum vendedor cadastrado para este fornecedor.',
        loadErrorLabel: 'Erro ao carregar os vendedores do fornecedor.',
        retryLabel: 'Tentar novamente',
      },
      noRecipientsSelected: 'Nenhum destinatário selecionado — esta cotação não receberá e-mail.',
      emptySelectionError: 'Selecione um fornecedor.',
      submitButton: 'Enviar E-mails',
      sentToast: 'Emails enviados com sucesso',
      errorFallback: 'Não foi possível enviar os e-mails em lote.',
      invalidEmailsError: {
        line: 'Fornecedor {value} sem email cadastrado.',
        title: 'E-mails inválidos encontrados',
        description:
          'Um ou mais destinatários selecionados não possuem e-mail válido cadastrado. Corrija o cadastro do fornecedor/vendedor e tente novamente.',
      },
    },

    whatsApp: {
      buttonLabel: 'Enviar mensagem via WhatsApp',
      messageTitle: 'Solicitação de orçamento',
      farmLabel: 'Fazenda',
      purchaseCodeLabel: 'Código da solicitação:',
      descriptionLabel: 'Descrição/Chamado:',
      providerLabel: 'Fornecedor:',
      invitationText:
        'Gostaríamos, através desse contato, solicitar o orçamento dos itens listados no formulário que está disponível no link que se encontra no final desta mensagem.',
      emailAvailableText: 'O mesmo já está disponível no email',
      fillInstructions:
        'Preencha as informações com atenção, o formulário poderá ser enviado apenas uma vez.',
      regardsLabel: 'Atenciosamente:',
      formLinkLabel: 'Link do formulário:',
      providerMissingError: 'Os dados do fornecedor não foram encontrados.',
    },

    publicForm: {
      pageTitle: 'Formulário de Cotação',
      requestHeader: 'Solicitação Nº {code} - {farm}',
      descriptionLabel: 'Descrição/Chamado:',
      providerLabel: 'Fornecedor:',
      fields: {
        itemProduct: 'Produto',
        itemService: 'Serviços',
        totalValue: 'Vl.Total',
        quotationNote: 'Observação',
        quantity: 'Quantidade',
        brand: 'Marca',
        unitaryValue: 'Valor Unitário',
        amount: 'Valor Total',
        observation: 'Observação',
        reponsible: 'Responsável (Fornecedor)',
        expirationDate: 'Data de Validade da Cotação',
        file: 'Anexo',
      },
      requiresFileAlert:
        'Essa cotação exige que seja enviado o anexo das informações técnicas do produto',
      placeholders: {
        brand: 'Marca do produto',
        observation: 'Observações sobre este item',
        reponsible: 'Nome de quem está respondendo',
      },
      paymentsSection: {
        title: 'Condições de Pagamento',
        addButton: 'Adicionar Condição',
        removeButton: 'Remover',
        emptyLabel: 'Nenhuma condição de pagamento informada.',
        cannotRemoveLastRow: 'Você deve ter ao menos um item na lista',
        incompleteRow: 'Preencha todos os campos antes de adicionar novos.',
        removeConfirm: {
          title: 'Você está certo?',
          text: 'Deseja remover esse item mesmo?',
        },
        fields: {
          paymentMethod: 'Forma de Pagamento',
          installments: 'Parcelas',
          interval: 'Intervalo (dias)',
          total: 'Valor Total',
          amount: 'Valor/Parcela',
        },
        placeholders: {
          paymentMethod: 'Selecione a forma de pagamento',
        },
      },
      fileUpload: {
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeFileLabel: 'Trocar arquivo',
        removeFileLabel: 'Remover arquivo',
        replaceFileLabel: 'Substituir arquivo',
        existingFileLabel: 'Arquivo atual',
        errorTypeMessage: 'Tipo de arquivo não aceito. Envie um PDF.',
        errorSizeMessage: 'Arquivo excede o tamanho máximo permitido (20MB).',
      },
      validation: {
        reponsibleRequired: 'Responsável é obrigatório',
        reponsibleMax: 'Responsável deve ter no máximo 120 caracteres',
        expirationDateRequired: 'Data de Validade é obrigatória',
        expirationDateInvalid: 'Data de Validade inválida',
        expirationDateMin: 'Data de Validade não pode ser anterior a hoje',
        fileRequired: 'Anexo é obrigatório',
        unitaryValueRequired: 'Valor Unitário é obrigatório',
        brandRequired: 'Marca é obrigatória',
        observationMax: 'Observação deve ter no máximo 60 caracteres',
        paymentsMinOne: 'Informe ao menos uma condição de pagamento',
        paymentMethodRequired: 'Forma de Pagamento é obrigatória',
        installmentsRequired: 'Parcelas é obrigatório',
        installmentsMin: 'Parcelas deve ser no mínimo 1',
        intervalRequired: 'Intervalo é obrigatório',
        intervalMin: 'Intervalo não pode ser negativo',
        totalValueMin: 'O valor deve ser maior que zero',
      },
      submitButton: 'Enviar Cotação',
      submittedToast: 'Cotação enviada com sucesso!',
      errorFallback: 'Não foi possível enviar a cotação.',
      loadingState: 'Carregando formulário de cotação...',
      notFoundState: {
        title: 'Formulário não encontrado',
        description: 'O link acessado é inválido. Verifique o link recebido e tente novamente.',
      },
      loadErrorState: {
        title: 'Não foi possível carregar o formulário',
        description: 'Ocorreu um erro ao buscar os dados desta cotação.',
        retry: 'Tentar novamente',
      },
      alreadySubmittedState: {
        title: 'Cotação Finalizada.',
        description: '',
      },
      rateLimitedError:
        'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.',
    },
  },
};
