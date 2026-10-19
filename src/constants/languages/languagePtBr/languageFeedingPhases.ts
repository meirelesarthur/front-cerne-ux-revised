// src/constants/languages/languagePtBr/languageFeedingPhases.ts
// Tradução PT-BR do módulo "Fases de Alimentação" (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01). Rótulos
// IDÊNTICOS ao legado (contrato de tela §4): Código/Funcionário
// Responsável/Data/Nome da Fase/Observação (cabeçalho); Ordem/Dieta/Regra
// de Troca/Mínimo/Início/Máximo/Fim (itens); Nome/Dieta/Regra de Troca
// (filtro).

import { ModuleFeedingPhases } from '@/@types/language/module-feeding-phases';

export const languageFeedingPhases: ModuleFeedingPhases = {
  feedingPhase: {
    singularLabel: 'Fase de Alimentação',
    pluralLabel: 'Fases de Alimentação',
    list: {
      pageTitle: 'Fases de Alimentação',
      pageSubtitle: 'Administre as fases de alimentação cadastradas.',
      deletedToast: 'Fase de alimentação removida com sucesso',
      columns: {
        code: 'Código',
        name: 'Nome',
        responsible: 'Funcionário Responsável',
        createdAt: 'Criado',
        updatedAt: 'Atualizado',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma fase de alimentação cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira fase de alimentação.',
        titleFiltered: 'Nenhuma fase de alimentação encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Fase de Alimentação',
      },
    },
    filter: {
      title: 'Filtrar fases de alimentação',
      name: 'Nome',
      namePlaceholder: 'Buscar por nome',
      diet: 'Dieta',
      dietAll: 'Todas',
      changeRule: 'Regra de Troca',
      changeRuleAll: 'Todas',
    },
    form: {
      title: {
        create: 'Nova Fase de Alimentação',
        edit: 'Editar Fase de Alimentação',
      },
      fields: {
        code: 'Código',
        responsible: 'Funcionário Responsável',
        date: 'Data',
        name: 'Nome da Fase',
        observation: 'Observação',
      },
      changeRuleOptions: {
        byDays: 'Por Dias',
        byWeight: 'Por Peso',
      },
      items: {
        title: 'Itens da Fase',
        sequence: 'Ordem',
        diet: 'Dieta',
        changeRule: 'Regra de Troca',
        minimumStart: 'Mínimo/Início',
        maximumEnd: 'Máximo/Fim',
        addItem: 'Adicionar Item',
        removeItem: 'Remover',
      },
      validation: {
        dateRequired: 'Informe a data.',
        nameRequired: 'Informe o nome da fase.',
        nameMax: 'O nome deve ter no máximo 120 caracteres.',
        observationMax: 'A observação deve ter no máximo 1500 caracteres.',
        itemsMin: 'Adicione ao menos um item.',
        itemDietRequired: 'Selecione a dieta.',
        itemChangeRuleRequired: 'Selecione a regra de troca.',
        itemMinimumStartMin: 'Informe um valor inteiro maior ou igual a 1.',
        itemMaximumEndMin: 'Informe um valor inteiro maior ou igual a 1.',
        itemMinimumStartExceedsMaximumEnd: 'O Mínimo/Início não pode ser maior que o Máximo/Fim.',
        itemMinimumStartMustExceedPreviousMaximumEnd:
          'O Mínimo/Início deve ser maior que o Máximo/Fim do item anterior.',
        itemMaximumEndBelowMinimumStart: 'O Máximo/Fim não pode ser menor que o Mínimo/Início.',
        itemMaximumEndMustPrecedeNextMinimumStart:
          'O Máximo/Fim deve ser menor que o Mínimo/Início do próximo item.',
      },
    },
  },
};
