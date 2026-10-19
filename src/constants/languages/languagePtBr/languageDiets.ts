// src/constants/languages/languagePtBr/languageDiets.ts
// Tradução PT-BR do módulo "Dieta" (Diet — Operacional/Pecuária,
// TASK-FE-DIET-01).

import { ModuleDiets } from '@/@types/language/module-diets';

export const languageDiets: ModuleDiets = {
  diet: {
    singularLabel: 'Dieta',
    pluralLabel: 'Dietas',
    list: {
      pageTitle: 'Dieta',
      pageSubtitle: 'Administre as dietas cadastradas.',
      deletedToast: 'Dieta removida com sucesso',
      columns: {
        code: 'Código',
        date: 'Data',
        product: 'Produto',
        objective: 'Objetivo',
        estimatedCost: 'Custo Estimado',
        costPerKg: 'Custo por Kg',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma dieta cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira dieta.',
        titleFiltered: 'Nenhuma dieta encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Dieta',
      },
    },
    filter: {
      title: 'Filtrar dietas',
      search: 'Produto',
      searchPlaceholder: 'Buscar por produto',
      objective: 'Objetivo',
      objectiveAll: 'Todas',
      date: 'Data',
    },
    form: {
      title: {
        create: 'Nova Dieta',
        edit: 'Editar Dieta',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        product: 'Produto',
        quantity: 'Quantidade Referência',
        measurement: 'Unidade',
        objective: 'Objetivo',
        type: 'Tipo',
        observation: 'Observação',
        ingredients: 'Composição',
        ingredientProduct: 'Ingrediente',
        ingredientMeasurement: 'Unidade',
        ingredientDryMatter: 'Matéria Seca (%)',
        ingredientCostValue: 'Custo Unitário',
        ingredientQuantityP: 'Percentual (%)',
        ingredientQuantityU: 'Quantidade',
        ingredientTotal: 'Total',
        addIngredient: 'Adicionar Ingrediente',
        removeIngredient: 'Remover',
      },
      objectiveOptions: {
        adaptation: 'Adaptação',
        growth: 'Crescimento',
        termination: 'Terminação',
      },
      typeOptions: {
        percentage: 'Porcentagem',
        unit: 'Unidade',
      },
      hints: {
        quantityTooltip:
          'Esta é a medida padrão da dieta. Se a dieta foi criada para 1kg, mas você vai produzir 10kg, o sistema multiplicará os ingredientes por 10 automaticamente.',
      },
      validation: {
        productRequired: 'Selecione o produto.',
        measurementRequired: 'Selecione a unidade.',
        dateRequired: 'Informe a data.',
        objectiveRequired: 'Selecione o objetivo.',
        typeRequired: 'Selecione o tipo.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        observationMax: 'A observação deve ter no máximo 1500 caracteres.',
        ingredientsMin: 'Adicione ao menos um ingrediente.',
        ingredientProductRequired: 'Selecione o ingrediente.',
        ingredientMeasurementRequired: 'Selecione a unidade.',
        dryMatterMin: 'Informe um valor maior ou igual a zero.',
        costValueMin: 'Informe um valor maior ou igual a zero.',
        ingredientQuantityMin: 'Informe um valor maior que zero.',
        ingredientsSumMustBe100: 'A soma dos percentuais deve ser igual a 100%.',
      },
    },
  },
};
