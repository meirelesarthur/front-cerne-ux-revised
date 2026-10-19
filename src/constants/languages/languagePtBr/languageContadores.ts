// src/constants/languages/languagePtBr/languageContadores.ts
// Tradução PT-BR do módulo CONTADOR (Escritório de Contabilidade — Cadastros
// Base, domínio Fiscal/Contábil).

import { ModuleContadores } from '@/@types/language/module-contadores';

export const languageContadores: ModuleContadores = {
  contador: {
    singularLabel: 'Contador',
    list: {
      pageTitle: 'Contador',
      pageSubtitle: 'Administre os escritórios de contabilidade vinculados à fazenda.',
      deletedToast: 'Contador removido com sucesso',
      table: {
        razaoSocial: 'Razão Social',
        nomeFantasia: 'Nome Fantasia',
        cnpj: 'CNPJ',
        city: 'Cidade',
        fone: 'Telefone',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum contador cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro escritório de contabilidade.',
        titleEmptyNoCreate: 'Nenhum contador disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há contadores vinculados à sua fazenda. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhum contador encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Contador',
      },
      error: {
        message: 'Não foi possível carregar os contadores.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar Contadores',
      search: 'Buscar',
      searchPlaceholder: 'Razão social, nome fantasia ou CNPJ',
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Há registros vinculados a este contador. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        contador_issue: 'Emissor(es) Fiscal(is) vinculado(s)',
        cash_books: 'Livro Caixa vinculado',
        integration_dominios: 'integração Domínio vinculada',
      },
    },
    form: {
      title: { create: 'Novo Contador', edit: 'Editar Contador' },
      subtitle: {
        create: 'Cadastre um novo escritório de contabilidade.',
        edit: 'Atualize os dados do escritório de contabilidade.',
      },
      fields: {
        razaoSocial: 'Razão Social',
        nomeFantasia: 'Nome Fantasia',
        cnpj: 'CPF / CNPJ',
        ie: 'Inscrição Estadual',
        rua: 'Rua',
        numero: 'Número',
        bairro: 'Bairro',
        cep: 'CEP',
        fone: 'Telefone',
        email: 'E-mail',
        cidadeUuid: 'Cidade',
        issueUuids: 'Emissores Fiscais',
        autoSend: 'Envio automático do XML',
      },
      placeholders: {
        razaoSocial: 'Razão social do escritório',
        nomeFantasia: 'Nome fantasia',
        ie: 'Inscrição estadual',
        rua: 'Nome da rua',
        numero: 'Número',
        bairro: 'Bairro',
        email: 'email@exemplo.com',
        cidadeUuid: 'Buscar cidade...',
      },
      issuesField: {
        searchPlaceholder: 'Buscar emissor fiscal...',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Nº de registros selecionados',
        emptyLabel: 'Nenhum emissor fiscal elegível encontrado.',
        errorLabel: 'Erro ao carregar os emissores fiscais.',
        retryLabel: 'Tentar novamente',
      },
      cepAutofill: {
        notFound: {
          title: 'CEP não encontrado',
          description: 'Não localizamos esse CEP. Preencha o endereço manualmente.',
        },
        cityNotResolved: {
          title: 'Cidade não resolvida automaticamente',
          description:
            'Endereço preenchido, mas a cidade não foi identificada — selecione manualmente.',
        },
        networkError: {
          title: 'Falha ao consultar o endereço',
          description:
            'Não foi possível consultar o CEP agora. Preencha o endereço manualmente, se necessário.',
        },
      },
      validation: {
        razaoSocialRequired: 'A razão social é obrigatória',
        razaoSocialMaxLength: 'A razão social deve ter no máximo 80 caracteres',
        nomeFantasiaRequired: 'O nome fantasia é obrigatório',
        nomeFantasiaMaxLength: 'O nome fantasia deve ter no máximo 80 caracteres',
        cnpjRequired: 'O CNPJ é obrigatório',
        ieRequired: 'A inscrição estadual é obrigatória',
        invalidFields: 'Revise os campos destacados.',
        ieMaxLength: 'A inscrição estadual deve ter no máximo 20 caracteres',
        ruaRequired: 'A rua é obrigatória',
        numeroRequired: 'O número é obrigatório',
        bairroRequired: 'O bairro é obrigatório',
        cepRequired: 'O CEP é obrigatório',
        foneRequired: 'O telefone é obrigatório',
        emailRequired: 'O e-mail é obrigatório',
        emailInvalid: 'Informe um e-mail válido',
        cidadeRequired: 'A cidade é obrigatória',
        issuesRequired: 'Selecione ao menos um Emissor Fiscal',
      },
    },
  },
};
