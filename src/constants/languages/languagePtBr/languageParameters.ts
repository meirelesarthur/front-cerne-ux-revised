// src/constants/languages/languagePtBr/languageParameters.ts
// Tradução PT-BR do módulo de PARÂMETROS (Parameter — Configurações, execução
// 031, TASK-FE-031-40).

import { ModuleParameters } from '@/@types/language/module-parameters';

export const languageParameters: ModuleParameters = {
  parameter: {
    singularLabel: 'Parâmetro',
    pluralLabel: 'Parâmetros',
    type: {
      alphanumeric: 'Alfanumérico',
      numeric: 'Numérico',
      logical: 'Lógico',
    },
    list: {
      pageTitle: 'Parâmetros',
      pageSubtitle: 'Administre os parâmetros técnicos globais do sistema.',
      deletedToast: 'Parâmetro removido com sucesso',
      table: {
        name: 'Nome',
        value: 'Valor',
        type: 'Tipo',
        description: 'Descrição',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      reservedTooltip: 'Parâmetro reservado pelo sistema',
      emptyState: {
        titleEmpty: 'Nenhum parâmetro cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro parâmetro.',
        titleEmptyNoCreate: 'Nenhum parâmetro cadastrado.',
        descriptionEmptyNoCreate: 'Nenhum parâmetro foi cadastrado ainda.',
        titleFiltered: 'Nenhum parâmetro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Parâmetro',
      },
      error: {
        message: 'Não foi possível carregar os parâmetros.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar parâmetros',
      search: 'Nome',
      searchPlaceholder: 'Buscar por nome',
    },
    form: {
      title: {
        create: 'Novo Parâmetro',
        edit: 'Editar Parâmetro',
      },
      subtitle: {
        create: 'Cadastre um novo parâmetro técnico do sistema.',
        edit: 'Atualize os dados do parâmetro.',
      },
      fields: {
        name: 'Nome',
        value: 'Valor',
        type: 'Tipo',
        description: 'Descrição',
      },
      placeholders: {
        name: 'Ex.: CATEGF',
        value: 'Ex.: 1234',
        description: 'Ex.: Máscara de código de Categoria Financeira',
      },
      reservedNameHelper:
        'Nome reservado pelo sistema — usado por outros módulos, não pode ser alterado.',
      validation: {
        nameMaxLength: 'O nome deve ter no máximo 20 caracteres',
        valueMaxLength: 'O valor deve ter no máximo 255 caracteres',
        typeRequired: 'Selecione o tipo',
        descriptionMaxLength: 'A descrição deve ter no máximo 40 caracteres',
      },
    },
    detail: {
      fields: {
        name: 'Nome',
        value: 'Valor',
        description: 'Descrição',
        createdAt: 'Data de Criação',
        updatedAt: 'Data de Atualização',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Parâmetro não encontrado',
        description: 'O parâmetro pode ter sido removido ou o link está incorreto.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
