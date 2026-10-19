// src/constants/languages/languagePtBr/languagePeople.ts
// Tradução PT-BR do módulo PESSOAS UNIFICADO (Person — Cadastros Base).

import { ModulePeople } from '@/@types/language/module-people';

export const languagePeople: ModulePeople = {
  person: {
    singularLabel: 'Pessoa',
    roles: {
      proprietary: 'Proprietário',
      employee: 'Funcionário',
      provider: 'Fornecedor',
      client: 'Cliente',
      user: 'Usuário',
    },
    roleHints: {
      proprietary: 'Dono de fazenda — participação por propriedade e inscrições estaduais.',
      employee: 'Colaborador — cargo, função, dados bancários e centro de custo.',
      provider: 'Vende insumos — filiais, vendedores e dados bancários.',
      client: 'Comprador — inscrições estaduais, contribuinte e dados fiscais.',
      user: 'Acesso ao sistema — perfis, fazendas e encarregados.',
    },

    list: {
      pageTitle: 'Pessoas',
      pageSubtitle:
        'Cadastro único de identidade civil — cada pessoa pode acumular papéis de Proprietário, Funcionário, Fornecedor, Cliente e Usuário.',
      searchPlaceholder: 'Buscar por nome, apelido ou CPF/CNPJ',
      deletedToast: 'Pessoa removida com sucesso',
      table: {
        name: 'Nome',
        document: 'CPF / CNPJ',
        email: 'E-mail',
        roles: 'Papéis',
        noRole: 'Sem papel',
        actions: '',
      },
      actions: {
        view: 'Ver detalhes',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma pessoa cadastrada.',
        descriptionEmpty: 'Comece cadastrando a primeira pessoa.',
        titleFiltered: 'Nenhuma pessoa encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Pessoa',
      },
      deleteDialog: {
        title: 'Excluir pessoa?',
        description: 'Tem certeza que deseja excluir',
        warning:
          'A pessoa deixa de aparecer nas listagens, mas os papéis e satélites vinculados permanecem intactos no banco.',
      },
    },

    filter: {
      title: 'Filtrar pessoas',
      search: 'Buscar',
      role: 'Papel',
      roleAll: 'Todos os papéis',
    },

    steps: {
      basico: 'Dados Básicos',
      endereco: 'Endereço',
    },

    form: {
      title: { create: 'Nova Pessoa', edit: 'Editar Pessoa' },
      subtitle: {
        create: 'Preencha as etapas para cadastrar a pessoa.',
        edit: 'Atualize os dados da pessoa.',
      },

      basico: {
        subtitle: 'Informe a identificação da pessoa e ative os papéis aplicáveis.',
        nif: 'CPF / CNPJ',
        nameFisica: 'Nome Completo',
        namePj: 'Nome Fantasia',
        nicknameFisica: 'Apelido',
        nicknamePj: 'Razão Social',
        email: 'E-mail',
        phone: 'Telefone',
        rolesLabel: 'Papéis desta pessoa',
        rolesHint:
          'Ative os papéis aplicáveis — cada um adiciona uma etapa de configuração a seguir.',
        nifFoundWarning:
          'Pessoa já cadastrada — dados carregados. Salvar irá ATUALIZAR o registro existente.',
      },

      endereco: {
        subtitle: 'Localização e endereço de correspondência da pessoa.',
        zipCode: 'CEP',
        city: 'Cidade',
        address: 'Endereço',
        number: 'Número',
        district: 'Bairro',
      },

      proprietary: {
        subtitle: 'Vincule as fazendas, a participação por propriedade e as inscrições estaduais.',
        stateRegistrations: 'Inscrições Estaduais',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Adicionar inscrição',
        emptyStateRegistrations: 'Nenhuma inscrição estadual cadastrada.',
        farms: 'Fazendas e Participação',
        addFarm: 'Adicionar fazenda',
        emptyFarms: 'Nenhuma fazenda vinculada.',
        farm: 'Fazenda',
        percentage: 'Participação (%)',
      },

      employee: {
        subtitle: 'Cargo, função, centro de custo e dados bancários do colaborador.',
        office: 'Cargo',
        function: 'Função (CBO)',
        commission: 'Comissão (%)',
        vlTimeProductive: 'Valor Hora Produtiva',
        vlTimeUnproductive: 'Valor Hora Improdutiva',
        baseSalary: 'Salário Base',
        goalSalary: 'Salário Meta',
        centerId: 'Centro de Custo',
        birthday: 'Data de Nascimento',
        bank: {
          title: 'Dados Bancários',
          bankId: 'Banco',
          accountType: 'Tipo de Conta',
          agency: 'Agência',
          account: 'Conta',
          pixType: 'Tipo de Chave PIX',
          pix: 'Chave PIX',
        },
      },

      provider: {
        subtitle: 'Tipo de fornecimento, dados bancários, filiais e vendedores.',
        type: 'Tipo de Fornecedor',
        typeOptions: {
          resale: 'Revenda de insumos',
          industry: 'Indústria',
          service: 'Prestador de serviço',
          carrier: 'Transportadora',
          commissioned: 'Representante comissionado',
        },
        commission: 'Comissão (%)',
        hourValue: 'Valor por Hora',
        stateRegistration: 'IE do fornecedor',
        cityRegistration: 'IM do fornecedor',
        contact: 'Contato',
        contactPhone: 'Telefone do Contato',
        branches: 'Filiais',
        addBranch: 'Adicionar filial',
        emptyBranches: 'Nenhuma filial cadastrada.',
        branchNif: 'CNPJ da Filial',
        branchName: 'Nome da Filial',
        branchStateRegistration: 'Inscrição Estadual',
        branchZipCode: 'CEP',
        branchCity: 'Cidade',
        branchAddress: 'Endereço',
        sellers: 'Vendedores',
        addSeller: 'Adicionar vendedor',
        emptySellers: 'Nenhum vendedor cadastrado.',
        sellerName: 'Nome',
        sellerEmail: 'E-mail',
        sellerPhone: 'Telefone',
      },

      client: {
        subtitle: 'Dados fiscais, contato comercial e inscrições estaduais do comprador.',
        cellphone: 'Celular',
        contact: 'Contato',
        contactPhone: 'Telefone do Contato',
        cityRegistration: 'IM do cliente',
        farmName: 'Nome da Fazenda',
        finalCustomer: 'Consumidor Final',
        finalCustomerHint: 'Impacta a tributação na emissão de NF-e.',
        taxpayer: 'Contribuinte',
        taxpayerHint: 'Define se o cliente é contribuinte de ICMS (impacto fiscal).',
        country: 'País',
        idAbroad: 'ID no Exterior',
        stateRegistrations: 'Inscrições Estaduais',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Adicionar inscrição',
        emptyStateRegistrations: 'Nenhuma inscrição estadual cadastrada.',
      },

      user: {
        subtitle: 'Acesso ao sistema — senha, perfis, fazendas e encarregados.',
        password: 'Senha',
        passwordConfirmation: 'Confirmação de Senha',
        passwordHint: 'Mínimo 8 caracteres, com maiúscula, minúscula e número.',
        editPasswordNotice:
          'A senha não pode ser alterada por aqui na edição. Para trocá-la, use o fluxo de redefinição de senha.',
        purchasingAssistant: 'Conferente de Compras',
        purchasingAssistantHint: 'Perfil especial com permissões de conferência de compras.',
        farms: 'Fazendas',
        roles: 'Perfis',
        bosses: 'Encarregados',
        farmsSearchPlaceholder: 'Buscar fazenda...',
        rolesSearchPlaceholder: 'Buscar perfil...',
        bossesSearchPlaceholder: 'Buscar encarregado...',
        selectedCount: 'Selecionados',
        toggleRoleWarning:
          'Desativar este papel não remove o acesso já existente — apenas evita reenviar dados novos para ele.',
        deactivateDialog: {
          title: 'Desativar acesso do usuário?',
          message: 'Ao salvar, este usuário perderá o acesso ao sistema. Deseja continuar?',
          confirm: 'Salvar e desativar acesso',
        },
      },

      // TASK-FE-338 — confirmação ao desativar Proprietário/Funcionário/
      // Fornecedor/Cliente já ativos (generalização do achado F). `{roles}`
      // é substituído pela lista dos papéis afetados (ex.: "Proprietário,
      // Fornecedor").
      roleDeactivateDialog: {
        title: 'Desativar papel(is) selecionado(s)?',
        message:
          'Ao salvar, o(s) seguinte(s) papel(is) será(ão) desativado(s): {roles}. Os dados já vinculados (fazendas, filiais, vendedores, inscrições) serão preservados. Deseja continuar?',
        confirm: 'Salvar e desativar',
      },

      pixTypeOptions: {
        cpfCnpj: 'CPF / CNPJ',
        email: 'E-mail',
        phone: 'Telefone',
        random: 'Chave Aleatória',
      },

      footer: {
        back: 'Voltar',
        next: 'Próximo',
        save: 'Salvar Pessoa',
        saving: 'Salvando...',
        close: 'Fechar',
        stepCounter: {
          label: 'Etapa',
          of: 'de',
        },
      },

      toasts: {
        createdSuccess: 'Pessoa criada com sucesso.',
        updatedSuccess: 'Pessoa atualizada com sucesso.',
        upsertSuccess: 'Pessoa já cadastrada — dados atualizados.',
      },

      unsavedChanges: {
        title: 'Alterações não salvas',
        message: 'Você tem alterações não salvas. Deseja sair sem salvar?',
        confirm: 'Sair sem salvar',
        cancel: 'Ficar',
      },

      validation: {
        nifRequired: 'CPF/CNPJ é obrigatório.',
        nifInvalid: 'CPF/CNPJ inválido — verifique os dígitos.',
        nameRequired: 'Campo obrigatório.',
        nameMaxLength: 'Máximo 120 caracteres.',
        nicknameRequired: 'Campo obrigatório.',
        nicknameMaxLength: 'Máximo 60 caracteres.',
        emailInvalid: 'E-mail inválido.',
        emailRequiredForAccess: 'E-mail é obrigatório para conceder acesso ou cadastrar cliente.',
        cityRequired: 'Selecione uma cidade.',
        addressRequired: 'Campo obrigatório.',
        numberRequired: 'Campo obrigatório.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obrigatório.',
        districtMaxLength: 'Máximo 60 caracteres.',
        functionRequired: 'Selecione a função.',
        birthdayRequired: 'Data de nascimento é obrigatória.',
        farmRequired: 'Selecione a fazenda.',
        percentageRange: 'Percentual deve estar entre 0 e 100.',
        typeRequired: 'Selecione o tipo.',
        finalCustomerRequired: 'Campo obrigatório.',
        taxpayerRequired: 'Campo obrigatório.',
        countryRequired: 'Selecione o país.',
        branchNifRequired: 'CNPJ da filial é obrigatório.',
        branchCityRequired: 'Selecione a cidade da filial.',
        branchAddressRequired: 'Endereço da filial é obrigatório.',
        sellerNameRequired: 'Nome do vendedor é obrigatório.',
        passwordRequired: 'Senha é obrigatória.',
        passwordMin: 'Mínimo 8 caracteres.',
        passwordConfirmationMismatch: 'As senhas não coincidem.',
      },
    },
  },
};
