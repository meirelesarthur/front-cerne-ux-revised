// src/constants/languages/languagePtBr/languageProprietarios.ts
// Tradução PT-BR do módulo "Proprietários" (Proprietary — Cadastros Base).
// TASK-PY-FE-01: singular/plural (queryKey) + mensagens de validação do
// schema Yup + esqueleto de list/filter/form (copy completo nas
// TASK-PY-FE-02/03, mesmo padrão incremental de `languageProviders.ts`).

import { ModuleProprietaries } from '@/@types/language/module-proprietaries';

export const languageProprietarios: ModuleProprietaries = {
  proprietary: {
    singularLabel: 'Proprietário',
    pluralLabel: 'Proprietários',

    list: {
      pageTitle: 'Proprietários',
      pageSubtitle: 'Gerencie os proprietários cadastrados no tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Proprietário',
        nickname: 'Apelido',
        city: 'Cidade',
        percentage: 'Participação',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum proprietário cadastrado',
        descriptionEmpty: 'Cadastre o primeiro proprietário para começar.',
        titleFiltered: 'Nenhum proprietário encontrado',
        descriptionFiltered: 'Ajuste os filtros aplicados e tente novamente.',
        cta: 'Novo Proprietário',
      },
      deleteDialog: {
        title: 'Excluir Proprietário',
        description: 'Tem certeza que deseja excluir o proprietário',
        warning: 'Esta ação é permanente e não pode ser desfeita.',
        confirm: 'Excluir',
      },
      deletedToast: 'Proprietário excluído com sucesso.',
      error: {
        message: 'Não foi possível carregar os proprietários.',
        retry: 'Tentar novamente',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome, apelido ou CPF/CNPJ',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },

    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Existem registros vinculados a este proprietário. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        expenses: 'Despesa(s) vinculada(s)',
        incomes: 'Receita(s) vinculada(s)',
        movements: 'Movimentação(ões) financeira(s) vinculada(s)',
        transfers: 'Transferência(s) vinculada(s)',
        areas: 'Área(s) vinculada(s)',
        invoices: 'Nota(s) Fiscal(is) vinculada(s)',
        equipments: 'Equipamento(s) vinculado(s)',
        cashBooks: 'Livro(s) Caixa vinculado(s)',
        inputEntries: 'Entrada(s) de Insumo vinculada(s)',
        sales: 'Venda(s) vinculada(s)',
        tickets: 'Ticket(s) vinculado(s)',
        traceabilityConfigs: 'Configuração(ões) de Rastreabilidade vinculada(s)',
      },
    },

    form: {
      title: {
        create: 'Novo Proprietário',
        edit: 'Editar Proprietário',
      },
      subtitle: {
        create: 'Cadastre um novo proprietário.',
        edit: 'Atualize os dados do proprietário.',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apelido',
        name: 'Razão Social/Nome',
        email: 'E-mail',
        phone: 'Telefone',
        zipCode: 'CEP',
        address: 'Endereço',
        number: 'Número',
        district: 'Bairro',
        city: 'Cidade',
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
      nifFoundWarning:
        'Pessoa já cadastrada — dados carregados. Se ela já for proprietária em outra fazenda, as fazendas e IEs existentes serão mantidas e a fazenda ativa será somada ao salvar.',
      nifFoundWarningEditing:
        'Já existe outra Pessoa cadastrada com este CPF/CNPJ — os dados dela substituíram os deste formulário. Revise antes de salvar.',
      nifAlreadyProprietaryRedirectWarning:
        'Proprietário já cadastrado nesta fazenda. Abrindo o cadastro para edição.',
      nifPermissionDeniedWarning:
        'Sem permissão para consultar o cadastro de pessoas — preencha os dados manualmente.',
      farms: {
        empty: 'Nenhuma fazenda vinculada.',
        add: 'Adicionar Fazenda',
        removeAria: 'Remover fazenda',
        fields: {
          farm: 'Fazenda',
          percentage: 'Participação (%)',
        },
      },
      stateRegistrations: {
        title: 'IE do proprietário',
        empty: 'Nenhuma inscrição estadual cadastrada.',
        add: 'Adicionar Inscrição Estadual',
        removeAria: 'Remover inscrição estadual',
        fields: {
          value: 'IE',
        },
      },
      validation: {
        nifRequired: 'CPF/CNPJ é obrigatório.',
        nifInvalid: 'CPF/CNPJ inválido — confira os dígitos.',
        nameRequired: 'Campo obrigatório.',
        nameMaxLength: 'Máximo de 120 caracteres.',
        nicknameRequired: 'Campo obrigatório.',
        nicknameMaxLength: 'Máximo de 60 caracteres.',
        emailRequired: 'E-mail é obrigatório.',
        emailInvalid: 'E-mail inválido.',
        emailMaxLength: 'Máximo de 89 caracteres.',
        addressRequired: 'Campo obrigatório.',
        addressMaxLength: 'Máximo de 120 caracteres.',
        numberRequired: 'Campo obrigatório.',
        numberMaxLength: 'Máximo de 10 caracteres.',
        districtRequired: 'Campo obrigatório.',
        districtMaxLength: 'Máximo de 60 caracteres.',
        cityRequired: 'Selecione uma cidade.',
        farmRequired: 'Selecione uma fazenda.',
        farmsMinRequired: 'Adicione ao menos uma fazenda.',
        percentageRange: 'Informe uma participação entre 0 e 100.',
      },
    },
  },
};
