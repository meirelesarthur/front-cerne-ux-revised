// src/constants/languages/languagePtBr/languageClientes.ts
// Tradução PT-BR do módulo "Clientes" (Client — Cadastros Base).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01/02/03) — escrito
// ANTES de `Client-contrato.md`/backend existirem, mirror estrutural de
// `languageProprietarios.ts` (irmão estruturalmente mais próximo). Os
// rótulos do bloco `form.client` (campos de papel fiscais/comerciais) são
// CÓPIA LITERAL de `languagePeople.ts:169-185` (bloco `client.*` do wizard
// de Pessoas), já testados em produção — não reescritos do zero.

import { ModuleClients } from '@/@types/language/module-clients';

export const languageClientes: ModuleClients = {
  client: {
    singularLabel: 'Cliente',
    pluralLabel: 'Clientes',

    list: {
      pageTitle: 'Clientes',
      pageSubtitle: 'Gerencie os clientes cadastrados no tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Cliente',
        nickname: 'Nome Fantasia',
        city: 'Cidade',
        cellphone: 'Celular',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum cliente cadastrado',
        descriptionEmpty: 'Cadastre o primeiro cliente para começar.',
        titleFiltered: 'Nenhum cliente encontrado',
        descriptionFiltered: 'Ajuste os filtros aplicados e tente novamente.',
        cta: 'Novo Cliente',
      },
      deleteDialog: {
        title: 'Excluir Cliente',
        description: 'Tem certeza que deseja excluir o cliente',
        warning: 'Esta ação é permanente e não pode ser desfeita.',
        confirm: 'Excluir',
      },
      deletedToast: 'Cliente excluído com sucesso.',
      error: {
        message: 'Não foi possível carregar os clientes.',
        retry: 'Tentar novamente',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome, nome fantasia ou CPF/CNPJ',
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
        'Existem registros vinculados a este cliente. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        budgets: 'Orçamento(s) vinculado(s)',
        charges: 'Cobrança(s) vinculada(s)',
        ctes: 'CT-e vinculado(s)',
        harvestProducts: 'Produto(s) de Colheita vinculado(s)',
        incomes: 'Receita(s) vinculada(s)',
        moduleWeighings: 'Pesagem(ns) vinculada(s)',
        movementSales: 'Movimentação(ões) de venda vinculada(s)',
        movements: 'Movimentação(ões) financeira(s) vinculada(s)',
        nves: 'NF-e vinculada(s)',
        orders: 'Pedido(s) vinculado(s)',
        saleContracts: 'Contrato(s) de venda vinculado(s)',
        sales: 'Venda(s) vinculada(s)',
        transferAbcBatches: 'Lote(s) de Transferência (ABC) vinculado(s)',
        transfers: 'Transferência(s) vinculada(s)',
      },
    },

    form: {
      title: {
        create: 'Novo Cliente',
        edit: 'Editar Cliente',
      },
      subtitle: {
        create: 'Cadastre um novo cliente.',
        edit: 'Atualize os dados do cliente.',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Nome Fantasia',
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
        partialData: {
          title: 'CEP sem endereço detalhado',
          description: 'Este CEP não tem rua/bairro cadastrados. Preencha manualmente.',
        },
      },
      nifFoundWarning:
        'Pessoa já cadastrada — dados carregados. Salvar irá ATUALIZAR o registro existente.',
      nifFoundWarningEditing:
        'Já existe outra Pessoa cadastrada com este CPF/CNPJ — os dados dela substituíram os deste formulário. Revise antes de salvar.',
      // Cópia literal de `languagePeople.ts:169-185` (bloco `client.*` do
      // wizard, já testado em produção).
      client: {
        cellphone: 'Celular',
        contact: 'Contato',
        contactPhone: 'Telefone do Contato',
        cityRegistration: 'IM do cliente',
        farmName: 'Nome da Fazenda',
        isEnabled: 'Ativo',
        finalCustomer: 'Consumidor Final',
        finalCustomerHint: 'Impacta a tributação na emissão de NF-e.',
        taxpayer: 'Contribuinte',
        taxpayerHint: 'Define se o cliente é contribuinte de ICMS (impacto fiscal).',
        country: 'País',
        idAbroad: 'ID no Exterior',
      },
      stateRegistrations: {
        title: 'IE do cliente',
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
        stateRegistrationInvalid:
          'Inscrição estadual inválida: informe de 2 a 14 dígitos ou ISENTO.',
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
        countryRequired: 'Selecione um país.',
      },
    },

    detail: {
      sections: {
        generalData: 'Dados Gerais',
        address: 'Endereço',
        client: 'Dados do Cliente',
        stateRegistrations: 'IE do cliente',
      },
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Razão Social/Nome',
        nickname: 'Nome Fantasia',
        email: 'E-mail',
        phone: 'Telefone',
        address: 'Endereço',
        number: 'Número',
        district: 'Bairro',
        zipCode: 'CEP',
        city: 'Cidade',
        cellphone: 'Celular',
        contact: 'Contato',
        contactPhone: 'Telefone do Contato',
        cityRegistration: 'IM do cliente',
        farmName: 'Nome da Fazenda',
        finalCustomer: 'Consumidor Final',
        taxpayer: 'Contribuinte',
        country: 'País',
        idAbroad: 'ID no Exterior',
      },
      stateRegistrationsEmpty: 'Nenhuma inscrição estadual cadastrada.',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Cliente não encontrado',
        description: 'O cliente que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
};
