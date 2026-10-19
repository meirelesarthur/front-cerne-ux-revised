// src/constants/languages/languagePtBr/languageBatchTransfers.ts
// Tradução PT-BR do módulo TRANSFERÊNCIA ANIMAIS/LOTE (Operacional >
// Pecuária > Transferências, feature `426be835`). Namespace `batchTransfers`
// — LIVRE, sem colisão com `batches` (módulo de Lotes, Cadastros Base).

import { ModuleBatchTransfers } from '@/@types/language/module-batch-transfers';

export const languageBatchTransfers: ModuleBatchTransfers = {
  batchTransfer: {
    singularLabel: 'Transferência de Lote',
    pluralLabel: 'Transferências de Lote',
    list: {
      pageTitle: 'Transferência Animais/Lote',
      pageSubtitle: 'Animais ativos elegíveis para transferência entre lotes.',
      totalCountLabel: 'Quantidade',
      newTransference: 'Nova Transferência',
      table: {
        type: 'Tipo',
        identification: 'Identificação',
        age: 'Idade',
        category: 'Categoria',
        batch: 'Lote',
      },
      typeOptions: {
        batch: 'Lote',
        individual: 'Individual',
      },
      emptyState: {
        title: 'Nenhum registro.',
        description: 'Nenhum animal elegível para transferência foi encontrado.',
      },
      error: {
        title: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar animais elegíveis',
      category: 'Categoria',
      batch: 'Lote',
      identification: 'Identificação',
      identificationHint: 'A busca considera o código exato — não localiza por trecho parcial.',
    },
    form: {
      title: { create: 'Nova Transferência' },
      subtitle: { create: 'Transfira animais de um lote para outro.' },
      fields: {
        code: 'Código',
        date: 'Data',
        user: 'Responsável',
        batchFilter: 'Lote',
        category: 'Categoria',
        minWeight: 'Peso mín.',
        maxWeight: 'Peso máx.',
        newBatch: 'Novo Lote',
      },
      placeholders: {
        minWeight: '350,00',
        maxWeight: '520,00',
        batchFilter: 'Selecione o lote de origem',
        category: 'Selecione as categorias',
        newBatch: 'Selecione o lote de destino',
      },
      validation: {
        dateRequired: 'A data é obrigatória.',
        newBatchRequired: 'O novo lote é obrigatório.',
        atLeastOneAnimal: 'Selecione ao menos um animal para realizar a transferência.',
      },
      warnings: {
        maxWeightLessThanMin: 'O peso máximo deve ser maior que o mínimo.',
        minWeightGreaterThanMax: 'O peso mínimo deve ser menor que o máximo.',
        weighingWarning:
          'Alguns dos animais selecionados podem não ter pesagem registrada para a data da transferência — se algum não tiver, a transferência falhará ao salvar.',
      },
      candidateAnimals: {
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        totalAnimalsLabel: 'Total Animais',
        emptyLabelBatch: 'O lote selecionado não possui animais!',
        emptyLabelCategory: 'As categorias selecionadas não possui animais!',
        errorLabel: 'Erro ao carregar os animais.',
        retryLabel: 'Tentar novamente',
        searchPlaceholder: 'Buscar por identificação',
      },
      footer: {
        total: 'Total',
        weight: 'Peso',
        averageWeight: 'Peso Médio',
        totalUa: 'Total de UA',
        averageUa: 'UA Média',
      },
      toasts: {
        success: 'Transferência realizada com sucesso.',
      },
    },
  },
};
