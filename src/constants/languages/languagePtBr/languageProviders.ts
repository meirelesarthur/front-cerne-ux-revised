// src/constants/languages/languagePtBr/languageProviders.ts
// Tradução PT-BR do módulo "Fornecedores" (Provider — Cadastros Base).
// TASK-PR-FE-01: singular/plural (queryKey), opções do enum `type`
// (ProviderTypeEnum, rótulos EXATOS de `agro365/lang/pt-BR/trad.php`, ver
// Provider-contrato.md DA-PR-09) e mensagens de validação do schema Yup.

import { ModuleProviders } from '@/@types/language/module-providers';

export const languageProviders: ModuleProviders = {
  provider: {
    singularLabel: 'Fornecedor',
    pluralLabel: 'Fornecedores',

    typeOptions: {
      fornecedor: 'Fornecedor',
      funcionario: 'Funcionário',
      terceirizado: 'Terceirizado',
      transportador: 'Transportador',
      comissionado: 'Comissionado',
      inseminador: 'Inseminador',
    },

    pixTypeOptions: {
      cpfCnpj: 'CPF/CNPJ',
      email: 'E-mail',
      phone: 'Telefone',
      random: 'Chave Aleatória',
    },

    accountTypeOptions: {
      checking: 'Conta Corrente',
      savings: 'Conta Poupança',
    },

    list: {
      pageTitle: 'Fornecedores',
      pageSubtitle: 'Gerencie os fornecedores cadastrados no tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Fornecedor',
        city: 'Cidade',
        type: 'Tipo',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        deactivate: 'Desativar',
        activate: 'Ativar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum fornecedor cadastrado',
        descriptionEmpty: 'Cadastre o primeiro fornecedor para começar.',
        titleFiltered: 'Nenhum fornecedor encontrado',
        descriptionFiltered: 'Ajuste os filtros aplicados e tente novamente.',
        cta: 'Novo Fornecedor',
      },
      deactivatedToast: 'Fornecedor desativado com sucesso.',
      activatedToast: 'Fornecedor ativado com sucesso.',
      deletedToast: 'Fornecedor excluído com sucesso.',
      deactivateDialog: {
        title: 'Desativar Fornecedor',
        description: 'Tem certeza que deseja desativar o fornecedor',
        warning:
          'O fornecedor deixará de aparecer na listagem padrão, mas pode ser reativado depois.',
        confirm: 'Desativar',
      },
      activateDialog: {
        title: 'Ativar Fornecedor',
        description: 'Tem certeza que deseja ativar o fornecedor',
        warning:
          'O fornecedor voltará a ficar ativo e poderá ser desativado novamente quando necessário.',
        confirm: 'Ativar',
      },
      deleteDialog: {
        title: 'Excluir Fornecedor',
        description: 'Tem certeza que deseja excluir o fornecedor',
        warning:
          'Esta ação não pode ser desfeita. Fornecedor com lançamentos vinculados não pode ser excluído; nesse caso, desative-o.',
        confirm: 'Excluir',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome, apelido ou CPF/CNPJ',
      type: 'Tipo',
      typeAll: 'Todos os tipos',
      city: 'Cidade',
      cityAll: 'Todas as cidades',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },

    form: {
      title: {
        create: 'Novo Fornecedor',
        edit: 'Editar Fornecedor',
      },
      subtitle: {
        create: 'Cadastre um novo fornecedor.',
        edit: 'Atualize os dados do fornecedor.',
      },
      tabs: {
        dados: 'Dados',
        conta: 'Conta',
        filiais: 'Filiais',
        vendedores: 'Vendedores',
      },
      comingSoon: 'Esta aba estará disponível em breve.',
      nifFoundWarning:
        'Pessoa já cadastrada — dados carregados. Salvar irá ATUALIZAR o registro existente.',
      nifFoundWarningEditing:
        'Já existe outra Pessoa cadastrada com este CPF/CNPJ — os dados dela substituíram os deste formulário. Revise antes de salvar.',
      nifPermissionDeniedWarning:
        'Sem permissão para consultar o cadastro de pessoas — preencha os dados manualmente.',
      savedInactiveNotSelected:
        'Fornecedor salvo como inativo: ele não foi selecionado no campo, pois fornecedores inativos não aparecem para seleção.',
      enabledOptions: {
        yes: 'Sim',
        no: 'Não',
      },
      placeholders: {
        defaultCostCenter: 'Selecione o centro de custo padrão',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apelido',
        name: 'Razão Social/Nome',
        stateRegistration: 'IE do fornecedor',
        cityRegistration: 'IM do fornecedor',
        type: 'Tipo',
        commission: 'Comissão',
        hourValue: 'Valor da Hora',
        email: 'E-mail',
        phone: 'Telefone',
        zipCode: 'CEP',
        address: 'Endereço',
        number: 'Número',
        district: 'Bairro',
        city: 'Cidade',
        contact: 'Contato',
        contactPhone: 'Telefone do Contato',
        cellphone: 'Celular',
        isEnabled: 'Ativo',
        defaultCostCenter: 'Centro de Custo Padrão',
        bankId: 'Banco',
        accountType: 'Tipo de Conta',
        agency: 'Agência',
        account: 'Conta',
        pixType: 'Tipo de Chave PIX',
        pix: 'Chave PIX',
      },
      cepAutofill: {
        notFound: {
          title: 'CEP não encontrado',
          description: 'Preencha o endereço manualmente.',
        },
        cityNotResolved: {
          title: 'Cidade não localizada',
          description: 'Selecione a cidade manualmente.',
        },
        networkError: {
          title: 'Falha ao consultar o CEP',
          description: 'Preencha o endereço manualmente.',
        },
      },
      branches: {
        empty: 'Nenhuma filial cadastrada.',
        add: 'Adicionar Filial',
        removeAria: 'Remover filial',
        fields: {
          name: 'Nome',
          nif: 'CNPJ',
          stateRegistration: 'IE',
          zipCode: 'CEP',
          city: 'Cidade',
          address: 'Endereço',
        },
        cnpjAutofill: {
          loading: 'Buscando dados do CNPJ...',
          notFound: {
            title: 'Não foi possível buscar os dados do CNPJ automaticamente',
            description: 'Preencha os campos da filial manualmente.',
          },
          cityNotResolved: {
            title: 'Cidade da filial não localizada',
            description: 'Selecione a cidade da filial manualmente.',
          },
        },
      },
      sellers: {
        empty: 'Nenhum vendedor cadastrado.',
        add: 'Adicionar Vendedor',
        removeAria: 'Remover vendedor',
        fields: {
          name: 'Nome',
          email: 'E-mail',
          phone: 'Telefone',
        },
      },
      validation: {
        nifRequired: 'CPF/CNPJ é obrigatório.',
        nifInvalid: 'CPF/CNPJ inválido — confira os dígitos.',
        nameRequired: 'Campo obrigatório.',
        nameMaxLength: 'Máximo de 120 caracteres.',
        nicknameRequired: 'Campo obrigatório.',
        nicknameMaxLength: 'Máximo de 60 caracteres.',
        emailInvalid: 'E-mail inválido.',
        emailMaxLength: 'Máximo de 89 caracteres.',
        addressRequired: 'Campo obrigatório.',
        addressMaxLength: 'Máximo de 120 caracteres.',
        numberRequired: 'Campo obrigatório.',
        numberMaxLength: 'Máximo de 10 caracteres.',
        districtRequired: 'Campo obrigatório.',
        districtMaxLength: 'Máximo de 60 caracteres.',
        cityRequired: 'Selecione uma cidade.',
        typeRequired: 'Selecione o tipo de fornecedor.',
        commissionRequiredForType: 'Comissão é obrigatória para o tipo Comissionado.',
        hourValueRequiredForType: 'Valor da hora é obrigatório para o tipo Terceirizado.',
        contactMaxLength: 'Máximo de 120 caracteres.',
        cellphoneMaxLength: 'Máximo de 15 caracteres.',
        defaultCostCenterInvalid: 'Centro de custo inválido.',
        isEnabledRequired: 'Campo obrigatório.',
        branchNifRequired: 'CPF/CNPJ da filial é obrigatório.',
        branchCityRequired: 'Selecione a cidade da filial.',
        branchAddressRequired: 'Endereço da filial é obrigatório.',
        sellerNameRequired: 'Nome do vendedor é obrigatório.',
        sellerEmailInvalid: 'E-mail inválido.',
      },
    },
  },
};
