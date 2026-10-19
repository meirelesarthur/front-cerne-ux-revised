// src/constants/languages/languagePtBr/languageEmployees.ts
// Tradução PT-BR do módulo "Funcionários" (Employee — Cadastros Base).
// TASK-EMP-FE-01: singular/plural (queryKey), opções dos enums PIX/tipo de
// conta e mensagens de validação do schema Yup — esqueleto de `list`/
// `filter`/`form.fields`/`form.user` para `TASK-EMP-FE-02/03/04`.

import { ModuleEmployees } from '@/@types/language/module-employees';

export const languageEmployees: ModuleEmployees = {
  employee: {
    singularLabel: 'Funcionário',
    pluralLabel: 'Funcionários',

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
      pageTitle: 'Funcionários',
      pageSubtitle: 'Gerencie os funcionários cadastrados nesta fazenda.',
      table: {
        document: 'CPF / CNPJ',
        name: 'Funcionário',
        email: 'E-mail',
        phone: 'Telefone',
        office: 'Cargo',
        createdAt: 'Cadastrado em',
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
        titleEmpty: 'Nenhum funcionário cadastrado',
        descriptionEmpty: 'Cadastre o primeiro funcionário para começar.',
        titleFiltered: 'Nenhum funcionário encontrado',
        descriptionFiltered: 'Ajuste os filtros aplicados e tente novamente.',
        cta: 'Novo Funcionário',
      },
      deactivatedToast: 'Funcionário desativado com sucesso.',
      activatedToast: 'Funcionário ativado com sucesso.',
      deactivateDialog: {
        title: 'Desativar Funcionário',
        description: 'Tem certeza que deseja desativar o funcionário',
        warning:
          'O funcionário deixará de aparecer na listagem padrão, mas pode ser reativado depois.',
        confirm: 'Desativar',
      },
      deletedToast: 'Funcionário excluído com sucesso.',
      deleteDialog: {
        title: 'Excluir Funcionário',
        description: 'Tem certeza que deseja excluir o funcionário',
        warning:
          'Esta ação não pode ser desfeita. Funcionário com lançamentos vinculados não pode ser excluído; nesse caso, desative-o.',
        confirm: 'Excluir',
      },
      activateDialog: {
        title: 'Ativar Funcionário',
        description: 'Tem certeza que deseja ativar o funcionário',
        warning:
          'O funcionário voltará a ficar ativo no sistema e poderá ser desativado novamente quando necessário.',
        confirm: 'Ativar',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome ou CPF/CNPJ',
      startDate: 'Cadastrado a partir de',
      endDate: 'Cadastrado até',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },

    form: {
      title: {
        create: 'Novo Funcionário',
        edit: 'Editar Funcionário',
      },
      subtitle: {
        create: 'Cadastre um novo funcionário.',
        edit: 'Atualize os dados do funcionário.',
      },
      employmentSectionTitle: 'Vínculo Empregatício',
      nifFoundWarning:
        'Pessoa já cadastrada — dados carregados. Salvar irá ATUALIZAR o registro existente.',
      nifFoundWarningEditing:
        'Já existe outra Pessoa cadastrada com este CPF/CNPJ — os dados dela substituíram os deste formulário. Revise antes de salvar.',
      nifPermissionDeniedWarning:
        'Sem permissão para consultar o cadastro de pessoas — preencha os dados manualmente.',
      employeeAlreadyExistsRedirectWarning:
        'Funcionário já cadastrado nesta fazenda. Abrindo o cadastro para edição.',
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apelido',
        name: 'Nome Completo',
        email: 'E-mail',
        phone: 'Telefone',
        zipCode: 'CEP',
        address: 'Endereço',
        number: 'Número',
        district: 'Bairro',
        city: 'Cidade',
        office: 'Cargo',
        function: 'Função (CBO)',
        commission: 'Comissão (%)',
        vlTimeProductive: 'Valor Hora Produtiva',
        baseSalary: 'Salário Base',
        goalSalary: 'Salário Meta',
        centerId: 'Centro de Custo',
        birthday: 'Data de Nascimento',
      },
      bank: {
        title: 'Dados Bancários',
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
          title: 'Cidade não identificada',
          description: 'Selecione a cidade manualmente.',
        },
        networkError: {
          title: 'Falha ao buscar o CEP',
          description: 'Não foi possível consultar o ViaCEP agora. Preencha manualmente.',
        },
      },
      user: {
        sectionTitle: 'Acesso ao Sistema',
        createUser: 'Criar Usuário',
        role: 'Perfil de Usuário',
        limitReachedError:
          'O limite de usuários do plano contratado foi atingido. Desmarque esta opção ou entre em contato para ampliar o plano.',
        rolePermissionDenied: 'Você não tem permissão para visualizar perfis de usuário.',
        usersQuotaReached:
          'O limite de usuários do plano contratado foi atingido — não é possível criar um novo acesso.',
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
        emailRequiredForUser: 'E-mail é obrigatório para criar acesso ao sistema.',
        phoneMaxLength: 'Máximo de 15 caracteres.',
        addressRequired: 'Campo obrigatório.',
        addressMaxLength: 'Máximo de 120 caracteres.',
        numberRequired: 'Campo obrigatório.',
        numberMaxLength: 'Máximo de 10 caracteres.',
        districtRequired: 'Campo obrigatório.',
        districtMaxLength: 'Máximo de 60 caracteres.',
        cityRequired: 'Selecione uma cidade.',
        officeMaxLength: 'Máximo de 120 caracteres.',
        functionRequired: 'Selecione a função.',
        birthdayRequired: 'Data de nascimento é obrigatória.',
        birthdayNotFuture: 'Data de nascimento não pode ser futura.',
        baseSalaryRequired: 'Salário base é obrigatório.',
        baseSalaryMin: 'O salário base não pode ser negativo.',
        roleRequired: 'Selecione o perfil de acesso.',
      },
    },
  },
};
