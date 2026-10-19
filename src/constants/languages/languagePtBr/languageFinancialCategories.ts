// src/constants/languages/languagePtBr/languageFinancialCategories.ts
// Tradução PT-BR do módulo de CATEGORIAS FINANCEIRAS (FinancialCategory —
// Cadastros Base / Financeiro), execução 023.

import { ModuleFinancialCategories } from '@/@types/language/module-financial-categories';

export const languageFinancialCategories: ModuleFinancialCategories = {
  financialCategory: {
    singularLabel: 'Categoria Financeira',
    list: {
      pageTitle: 'Categorias Financeiras',
      pageSubtitle: 'Administre a árvore de categorias financeiras do plano de contas.',
      deletedToast: 'Categoria financeira removida com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        typeGrouper: 'Tipo / Agrupador',
        classification: 'Classificação',
        operations: 'Operações',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        addChild: 'Adicionar categoria filha',
        expand: 'Expandir',
        collapse: 'Recolher',
      },
      emptyState: {
        titleEmpty: 'Nenhuma categoria financeira cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira categoria.',
        titleFiltered: 'Nenhuma categoria financeira encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova categoria',
      },
      deleteConfirm: {
        title: 'Excluir categoria financeira',
        description: 'Tem certeza que deseja excluir a categoria',
        warning:
          'Esta ação também excluirá todas as categorias descendentes, caso existam, e não pode ser desfeita.',
      },
      error: {
        message: 'Não foi possível carregar as categorias financeiras.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar categorias financeiras',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição ou código',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      classification: 'Classificação',
      classificationAll: 'Todas',
      classificationOptions: {
        unclassified: 'Não Classificado',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
    },
    form: {
      title: {
        create: 'Nova Categoria Financeira',
        edit: 'Editar Categoria Financeira',
        createChild: 'Nova Categoria Financeira Filha',
      },
      subtitle: {
        create: 'Cadastre uma nova categoria financeira no plano de contas.',
        edit: 'Atualize os dados da categoria financeira.',
        createChild: 'A nova categoria herda Tipo e Agrupador do grupo selecionado.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
        type: 'Tipo',
        grouper: 'Agrupador',
        generatesObligationOrRight: 'Gera obrigação ou direito',
        classification: 'Classificação',
        accountingGrouper: 'Agrupador contábil',
        centers: 'Centros de Custo vinculados',
        parent: 'Grupo pai',
        code: 'Código',
        class: 'Classe',
      },
      placeholders: {
        description: 'Ex.: Combustíveis, Mão de obra direta',
      },
      classificationOptions: {
        unclassified: 'Não Classificado',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente ao salvar',
        classPreviewBadge: 'Prévia',
        typeGrouperInherited: 'Herdado do grupo pai — não editável nesta categoria',
        classificationLockedSynthetic: 'Categorias sintéticas (grupo) não têm classificação',
        lockedByTenantContext:
          'Bloqueado — não editável para usuários vinculados a uma fazenda/tenant',
      },
      parentPreview: {
        loading: 'Carregando grupo pai...',
        errorTitle: 'Não foi possível carregar o grupo pai',
        errorDescription: 'Volte à listagem e tente novamente a partir do grupo desejado.',
      },
      centersTree: {
        expandAll: 'Expandir Tudo',
        collapseAll: 'Recolher Tudo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Nenhum centro de custo neste grupo',
        noCategories: 'Nenhum centro de custo disponível.',
        searchPlaceholder: 'Buscar centro de custo por código ou descrição',
        noResults: 'Nenhum centro de custo encontrado para esta busca.',
        errorLabel: 'Erro ao carregar centros de custo.',
        retryLabel: 'Tentar novamente',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 120 caracteres',
        typeRequired: 'O tipo é obrigatório',
        grouperRequired: 'O agrupador é obrigatório',
        classificationRequired: 'A classificação é obrigatória',
      },
    },
    report: {
      tooltip: 'Imprimir relatório',
      documentTitle: 'Categorias Financeiras',
      columnCode: 'Código',
      columnClass: 'Classe',
      columnType: 'Tipo',
      columnDescription: 'Descrição',
      metaCountSingular: 'categoria financeira',
      metaCountPlural: 'categorias financeiras',
      errorToast: 'Não foi possível gerar o relatório. Tente novamente.',
      popupBlockedToast:
        'O navegador bloqueou a janela de impressão. Libere pop-ups para este site e tente novamente.',
    },
  },
};
