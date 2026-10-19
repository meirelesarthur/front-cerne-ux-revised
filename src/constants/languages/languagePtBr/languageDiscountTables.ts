// src/constants/languages/languagePtBr/languageDiscountTables.ts
// Tradução PT-BR do módulo "Descontos/Classificação" (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-01). Rótulos IDÊNTICOS ao
// legado (contrato de tela §4): Código/Nome/Base de Cálculo/Status
// (cabeçalho); Impureza/Umidade/Quebrado/Esverdeado/Avariado-Ardidos/Taxa de
// Recepção (abas de regra); Limite Inicial (%)/Limite Final (%)/Desconto (%)
// (linha de regra); Buscar (filtro).

import { ModuleDiscountTables } from '@/@types/language/module-discount-tables';

export const languageDiscountTables: ModuleDiscountTables = {
  discountTable: {
    titleModule: 'Descontos/Classificação',
    singularLabel: 'Tabela de Desconto',
    pluralLabel: 'Tabelas de Desconto',
    list: {
      pageTitle: 'Descontos/Classificação',
      pageSubtitle: 'Administre as tabelas de desconto cadastradas.',
      deletedToast: 'Tabela de desconto removida com sucesso',
      columns: {
        code: 'Código',
        name: 'Nome',
        calculationBase: 'Tipo de Cálculo',
        products: 'Produtos',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma tabela de desconto cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira tabela de desconto.',
        titleFiltered: 'Nenhuma tabela de desconto encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Tabela de Desconto',
      },
    },
    filter: {
      title: 'Filtrar tabelas de desconto',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código ou nome',
    },
    form: {
      title: {
        create: 'Nova Tabela de Desconto',
        edit: 'Editar Tabela de Desconto',
        view: 'Visualizar Tabela de Desconto',
      },
      fields: {
        code: 'Código',
        name: 'Nome',
        namePlaceholder: 'Desconto Comercial Padrão',
        calculationBase: 'Base de Cálculo',
        status: 'Status',
      },
      calculationBaseOptions: {
        grossWeight: 'Peso Bruto',
        cumulative: 'Peso Bruto - Desconto Anterior',
      },
      statusOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      products: {
        title: 'Produtos',
        addProduct: 'Adicionar Produto',
        removeProduct: 'Remover produto',
        emptyState: 'Nenhum produto adicionado',
      },
      picker: {
        title: 'Adicionar Produto',
        searchPlaceholder: 'Buscar por descrição ou código',
        emptyState: 'Nenhum produto elegível',
        alreadyAddedToast: 'Produto já adicionado',
      },
      ruleTypes: {
        impureza: 'Impureza',
        umidade: 'Umidade',
        quebrado: 'Quebrado',
        esverdeado: 'Esverdeado',
        avariado: 'Avariado/Ardidos',
        taxa_recepcao: 'Taxa de Recepção',
      },
      rules: {
        initialLimitPercent: 'Limite Inicial (%)',
        finalLimitPercent: 'Limite Final (%)',
        discountPercent: 'Desconto (%)',
        addRule: 'Adicionar Regra',
        removeRule: 'Remover',
        emptyState: 'Nenhuma regra adicionada nesta aba',
      },
      validation: {
        nameRequired: 'Informe o nome.',
        nameMax: 'O nome deve ter no máximo 181 caracteres.',
        calculationBaseRequired: 'Selecione a base de cálculo.',
        statusRequired: 'Selecione o status.',
        productsMin: 'Adicione ao menos um produto.',
        productUuidRequired: 'Selecione o produto.',
        rulePercentRequired: 'Informe um valor entre 0 e 100.',
        rulePercentRange: 'O valor deve estar entre 0 e 100.',
      },
    },
  },
};
