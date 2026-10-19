// src/constants/languages/languagePtBr/languageGrouperBatch.ts
// Tradução PT-BR do módulo Agrupar/Lotes (GrouperBatch, execução 042,
// TASK-FE-042-301). Mirror `languageBatch` (list) + `languageStocks.consolidation`
// (group) + `languageLoteFazenda.newBatch` (newBatch), i18n isolado (D-front-8
// — não reusa `languageGB.batches.batch.filter`).

import { ModuleGrouperBatch } from '@/@types/language/module-grouper-batch';

export const languageGrouperBatch: ModuleGrouperBatch = {
  grouperBatch: {
    singularLabel: 'Lote',
    pluralLabel: 'Lotes',
    list: {
      pageTitle: 'Agrupar Lotes',
      pageSubtitle: 'Selecione 2 ou mais lotes ativos para agrupar em um lote principal.',
      table: {
        code: 'Código',
        description: 'Descrição',
        totalAnimals: 'Total de Animais',
      },
      emptyState: {
        titleEmpty: 'Nenhum lote ativo cadastrado.',
        titleFiltered: 'Nenhum resultado encontrado.',
        descriptionEmpty: 'Comece adicionando o primeiro lote.',
        descriptionFiltered: 'Tente ajustar ou remover os filtros atuais.',
        cta: 'Novo Lote',
      },
      filter: {
        title: 'Filtrar Lotes',
        search: 'Buscar por descrição',
      },
    },
    group: {
      buttonLabel: 'Agrupar',
      selectAtLeastTwoAlert: 'Selecione ao menos 2 lotes para agrupar.',
      alertTitle: 'Agrupar Lotes',
      modalTitle: 'Agrupar Lotes',
      modalPrimaryLabel: 'Selecione o lote que irá ser o principal.',
      columns: {
        code: 'Código',
        description: 'Descrição',
        totalAnimals: 'Total de Animais',
      },
      cancelButton: 'Cancelar',
      confirmButton: 'Agrupar',
      successToast: 'Lotes agrupados com sucesso',
      previewErrorTitle: 'Agrupar Lotes',
      previewErrorToast: 'Não foi possível carregar os lotes selecionados.',
    },
    newBatch: {
      title: 'Novo Lote',
      fields: {
        date: 'Data',
        parameterWeight: 'Peso',
        specie: 'Espécie',
        categories: 'Categorias',
        description: 'Descrição',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Salvar',
      createdToast: 'Lote criado com sucesso',
    },
  },
};
