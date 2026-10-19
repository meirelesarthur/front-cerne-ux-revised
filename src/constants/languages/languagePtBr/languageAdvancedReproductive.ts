// src/constants/languages/languagePtBr/languageAdvancedReproductive.ts
// Tradução PT-BR do módulo "Gerenciamento Avançado" (AdvancedReproductive —
// Operacional / Reprodução, F-011, 97-Esteiras/056, TASK-AR-FE-01).

import { ModuleAdvancedReproductive } from '@/@types/language/module-advanced-reproductive';

export const languageAdvancedReproductive: ModuleAdvancedReproductive = {
  advancedReproductive: {
    singularLabel: 'Gerenciamento Avançado',
    pluralLabel: 'Gerenciamento Avançado',
    titleModule: 'Gerenciamento Avançado',
    list: {
      pageTitle: 'Gerenciamento Avançado',
      pageSubtitle: 'Acompanhe o status reprodutivo dos animais em acasalamento.',
      indicators: {
        animalsCount: 'Animais',
        pregnancyRate: 'Taxa de Prenhez',
        birthAnimalsCount: 'Nascimentos',
      },
      table: {
        identification: 'Animal',
        category: 'Categoria',
        breedingMatingType: 'Tipo Acasalamento',
        lastUpdate: 'Última Atualização',
        reproductiveStatus: 'Status',
        actions: 'Ações',
      },
      actions: {
        viewAnimalRecord: 'Ficha Animal',
        viewAnimalRecordSuccessToast: 'Ficha gerada com sucesso.',
        viewAnimalRecordErrorToast: 'Não foi possível gerar a ficha do animal.',
        viewBreedingMating: 'Ver Acasalamento',
        editBreedingMating: 'Editar Acasalamento',
        advanceProtocolStep: 'Próxima Etapa',
        finishBreedingMating: 'Finalizar',
        viewPregnancyDiagnosis: 'Diagnóstico de Gestação',
        deleteBreedingMating: 'Excluir',
        disabledReason: 'Disponível quando esta função for migrada para a nova plataforma',
        deleteDialog: {
          title: 'Excluir acasalamento?',
        },
      },
      filter: {
        title: 'Filtrar Gerenciamento Avançado',
        search: 'Buscar',
        reproductiveStatus: 'Status Reprodutivo',
        breedingBatch: 'Lote de Reprodução',
        breedingSeason: 'Estação de Monta',
        protocol: 'Protocolo',
        bullSeedSeason: 'Touro/Sêmen/Embrião',
      },
      emptyState: {
        titleEmpty: 'Nenhum registro encontrado.',
        descriptionEmpty: 'Não há animais em acasalamento para exibir.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
        clearFiltersCta: 'Limpar filtros',
      },
    },
    reproductiveStatusOptions: {
      pregnant: 'Prenha',
      empty: 'Vazia',
      calved: 'Parida',
    },
  },
};
