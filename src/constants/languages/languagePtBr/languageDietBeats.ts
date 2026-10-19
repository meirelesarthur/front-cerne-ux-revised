// src/constants/languages/languagePtBr/languageDietBeats.ts
// Tradução PT-BR do módulo "Batida" (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-04).

import { ModuleDietBeats } from '@/@types/language/module-diet-beats';

export const languageDietBeats: ModuleDietBeats = {
  dietBeat: {
    singularLabel: 'Batida',
    pluralLabel: 'Batidas',
    list: {
      pageTitle: 'Batida',
      pageSubtitle: 'Administre as batidas de dieta registradas.',
      deletedToast: 'Batida removida com sucesso',
      columns: {
        code: 'Código',
        date: 'Data',
        diet: 'Dieta',
        equipment: 'Vagão',
        user: 'Operador',
        total: 'Total',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma batida cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira batida.',
        titleFiltered: 'Nenhuma batida encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Batida',
      },
    },
    filter: {
      title: 'Filtrar batidas',
      equipment: 'Vagão',
      equipmentPlaceholder: 'Buscar por vagão',
      diet: 'Dieta',
      dietPlaceholder: 'Buscar por dieta',
      date: 'Data',
    },
    form: {
      title: {
        create: 'Nova Batida',
        edit: 'Editar Batida',
      },
      fields: {
        header: {
          code: 'Código',
          responsible: 'Operador',
          equipment: 'Vagão',
          diet: 'Dieta',
          measurement: 'Unidade',
          quantity: 'Quantidade Produzida',
          date: 'Data',
        },
        item: {
          product: 'Ingrediente',
          measurement: 'Unidade',
          stock: 'Armazém',
          stockAvailable: 'Saldo Disponível',
          dryMatter: 'Matéria Seca (%)',
          costValue: 'Custo Unitário',
          quantityPlanned: 'Quantidade Prevista',
          quantityRealized: 'Quantidade Realizada',
          percentage: 'Percentual (%)',
          difference: 'Diferença',
          total: 'Total',
          sectionTitle: 'Itens da Batida',
          insufficientStock: 'A quantidade realizada não pode exceder o saldo disponível.',
          emptyUntilDiet: 'Selecione uma dieta para gerar os itens.',
        },
      },
      hints: {
        quantityTooltip: 'Informe a quantidade total produzida nesta batida.',
      },
      validation: {
        equipmentRequired: 'Selecione o vagão.',
        dietRequired: 'Selecione a dieta.',
        measurementRequired: 'Selecione a unidade.',
        dateRequired: 'Informe a data.',
        quantityRequired: 'Informe a quantidade.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        itemStockRequired: 'Selecione o armazém de origem.',
        itemQuantityRealizedRequired: 'Informe a quantidade realizada.',
        itemQuantityRealizedMin: 'Informe uma quantidade maior que zero.',
        itemsMin: 'Selecione uma dieta com ao menos um ingrediente.',
        numberType: 'Informe um número válido.',
      },
    },
  },
};
