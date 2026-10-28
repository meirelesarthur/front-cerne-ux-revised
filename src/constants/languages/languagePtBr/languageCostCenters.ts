// src/constants/languages/languagePtBr/languageCostCenters.ts
// Tradução PT-BR do módulo de CENTROS DE CUSTO (Cadastros Base).

import { ModuleCostCenters } from '@/@types/language/module-cost-centers';

export const languageCostCenters: ModuleCostCenters = {
  costCenter: {
    singularLabel: 'Centro de Custo',
    list: {
      pageTitle: 'Centros de Custo',
      pageSubtitle: 'Administre os centros de custo utilizados para apropriar receitas e despesas.',
      deletedToast: 'Centro de custo removido com sucesso',
      table: {
        code: 'Código',
        class: 'Classe',
        condition: 'Condição',
        description: 'Descrição',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        createDescendant: 'Cadastrar descendente',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum centro de custo cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro centro de custo.',
        titleEmptyNoCreate: 'Nenhum centro de custo disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há centros de custo vinculados à sua conta. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhum centro de custo encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Centro',
      },
    },
    filter: {
      title: 'Filtrar centros de custo',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código ou descrição',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        productive: 'Produtivo',
        apportioned: 'Rateado',
      },
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Novo Centro de Custo',
        edit: 'Editar Centro de Custo',
        createDescendant: 'Novo Centro de Custo (Descendente)',
      },
      subtitle: {
        create: 'Cadastre um novo centro de custo para apropriar receitas e despesas.',
        edit: 'Atualize os dados do centro de custo.',
        createDescendant:
          'Cadastre um centro de custo analítico vinculado ao antecessor selecionado.',
      },
      sectionData: 'Dados do centro de custo',
      fields: {
        description: 'Descrição',
        condition: 'Condição',
        isEnabled: 'Ativo',
        allowPointing: 'Apontamento',
        type: 'Tipo',
        parentUuid: 'Antecessor',
        code: 'Código',
        class: 'Classe',
        categories: 'Categorias Financeiras',
      },
      placeholders: {
        description: 'Ex.: Administração da Sede',
        parentUuid: 'Buscar por código ou descrição',
      },
      hints: {
        parentUuidImmutable: 'O antecessor não pode ser alterado após a criação.',
        parentUuidCreate:
          'Selecionar um antecessor torna este centro Analítico; deixe em branco para um centro raiz (Sintético).',
        parentUuidFixedDescendant:
          'Este centro será um descendente direto do antecessor selecionado — o vínculo não pode ser alterado.',
        codeGenerated: 'Gerado automaticamente ao salvar',
        classPreviewBadge: 'Prévia',
      },
      conditionOptions: {
        expense: 'Despesa',
        revenue: 'Receita',
        both: 'Ambos',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      categoriesTree: {
        expandAll: 'Expandir Tudo',
        collapseAll: 'Recolher Tudo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Nenhuma categoria neste grupo',
        noCategories: 'Nenhuma categoria financeira disponível.',
        searchPlaceholder: 'Buscar categoria por código ou descrição',
        noResults: 'Nenhuma categoria encontrada para esta busca.',
      },
      apportionments: {
        sectionTitle: 'Rateio',
        sectionHint:
          'Distribua o percentual entre os centros de custo. A soma não precisa fechar em 100% para salvar, mas recomendamos ajustar para 100%.',
        addRowLabel: 'Adicionar linha',
        removeRowLabel: 'Remover linha',
        emptyTitle: 'Nenhum rateio adicionado.',
        fields: {
          costCenter: 'Centro de custo',
          percentage: 'Percentual (%)',
        },
        placeholders: {
          costCenter: 'Buscar por código ou descrição',
        },
        sumLabel: 'Soma atual',
        sumHint: 'recomenda-se 100%',
      },
      parentPreview: {
        loading: 'Carregando antecessor…',
        errorTitle: 'Não foi possível carregar o centro de custo antecessor.',
        errorDescription: 'Verifique se ele ainda existe e está vinculado ao seu tenant.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 40 caracteres',
        conditionRequired: 'Selecione uma condição',
        apportionmentsRequired: 'Adicione ao menos um rateio para o tipo Rateado',
        apportionmentCostCenterRequired: 'Selecione o centro de custo do rateio',
        apportionmentPercentageRequired: 'Informe o percentual do rateio',
        apportionmentPercentageRange: 'O percentual deve estar entre 0 e 100',
      },
    },
    detail: {
      actions: {
        edit: 'Editar',
      },
      generalData: {
        title: 'Dados Gerais',
      },
      categories: {
        title: 'Categorias Financeiras vinculadas',
        empty: 'Nenhuma categoria financeira vinculada.',
      },
      apportionments: {
        title: 'Rateio',
      },
      notFound: {
        title: 'Centro de custo não encontrado.',
        description: 'Verifique se ele ainda existe e está vinculado à sua conta.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
