// src/constants/languages/languagePtBr/languageDepreciations.ts
// Tradução PT-BR do módulo de DEPRECIAÇÃO (Depreciation — Cadastros Base /
// Bens-Ativos, execução 027). Módulo TOP-LEVEL, mesma convenção flat de
// `costCenters`/`markers`/`depreciationForecasts` (não aninhado sob um
// guarda-chuva "cadastrosBase"). Fonte: Depreciation-Frontend-Contrato.md
// §8.3/§9/§10.

import { ModuleDepreciations } from '@/@types/language/module-depreciations';

export const languageDepreciations: ModuleDepreciations = {
  depreciation: {
    singularLabel: 'Depreciação',
    pluralLabel: 'Depreciações',
  },
  list: {
    equipment: {
      pageTitle: 'Depreciação Mensal',
      pageSubtitle: 'Gerencie os registros de depreciação de equipamentos.',
      table: {
        period: 'Competência',
        equipment: 'Equipamento',
        valueToDepreciate: 'Valor a Depreciar',
        monthlyDepreciation: 'Depreciação do Mês',
        remainingBalance: 'Saldo a Depreciar',
        processedDate: 'Processado em',
      },
      emptyState: {
        titleEmpty: 'Nenhum registro de depreciação',
        descriptionEmpty: 'Nenhuma depreciação foi gerada ainda.',
        titleFiltered: 'Nenhum resultado encontrado',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
      },
      error: {
        message: 'Não foi possível carregar os registros de depreciação.',
        retry: 'Tentar novamente',
      },
    },
    animal: {
      pageTitle: 'Depreciação Animal',
      pageSubtitle: 'Gerencie os registros de depreciação de animais.',
      table: {
        animal: 'Animal',
        entryDate: 'Data de Entrada',
        valueToDepreciate: 'Vl.p/depreciar',
        processedDate: 'Dt. Processamento',
        month: 'Mês',
        year: 'Ano',
        monthlyDepreciation: 'Vl. Dep. Mês',
        remainingBalance: 'Sd. á Depreciar',
      },
      emptyState: {
        titleEmpty: 'Nenhum registro de depreciação',
        descriptionEmpty: 'Nenhuma depreciação foi gerada ainda.',
        titleFiltered: 'Nenhum resultado encontrado',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
      },
      error: {
        message: 'Não foi possível carregar os registros de depreciação.',
        retry: 'Tentar novamente',
      },
    },
  },
  tabs: {
    equipment: 'Equipamento',
    animal: 'Animal',
  },
  filter: {
    title: 'Filtrar Depreciação',
    equipment: 'Equipamento',
    equipmentAll: 'Todos',
    year: 'Ano',
    yearPlaceholder: 'ex.: 2026',
    month: 'Mês',
    monthAll: 'Todos',
    months: {
      january: 'Janeiro',
      february: 'Fevereiro',
      march: 'Março',
      april: 'Abril',
      may: 'Maio',
      june: 'Junho',
      july: 'Julho',
      august: 'Agosto',
      september: 'Setembro',
      october: 'Outubro',
      november: 'Novembro',
      december: 'Dezembro',
    },
  },
  generateModal: {
    title: 'Gerar Depreciação',
    fields: {
      year: 'Ano',
      month: 'Mês',
      type: 'Tipo',
    },
    typeOptions: {
      equipment: 'Equipamento',
      animal: 'Animal',
      all: 'Ambos',
    },
    submit: 'Gerar',
    successToast: 'Depreciação gerada com sucesso.',
    noEligibleToast: 'Nenhum registro elegível para depreciação na competência informada.',
  },
};
