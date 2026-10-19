// src/constants/languages/languagePtBr/languageRecentActivities.ts
// Tradução PT-BR do módulo "Atividades Recentes" (UT-000690 / F-349 — Administrativo).

import { ModuleRecentActivities } from '@/@types/language/module-recent-activities';

export const languageRecentActivities: ModuleRecentActivities = {
  recentActivity: {
    singularLabel: 'Atividade recente',
    pluralLabel: 'Atividades recentes',
    titleModule: 'Atividades Recentes',
    list: {
      pageTitle: 'Atividades Recentes',
      pageSubtitle: 'Acompanhe os últimos registros lançados nas fazendas do seu contratante.',
      table: { type: 'Tipo', date: 'Data', status: 'Status', farm: 'Fazenda', actions: 'Ações' },
      actions: {
        open: 'Abrir',
        openUnavailable: 'Este tipo de registro não possui tela de visualização.',
        opening: 'Abrindo...',
      },
      emptyState: {
        titleEmpty: 'Nenhuma atividade recente.',
        descriptionEmpty: 'Os registros lançados nas fazendas aparecerão aqui.',
        titleFiltered: 'Nenhuma atividade encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
      },
      filter: {
        title: 'Filtrar Atividades',
        types: 'Tipo de atividade',
        startDate: 'Data (de)',
        endDate: 'Data (até)',
      },
    },
    types: {
      serviceOrder: 'Ordem de serviço',
      animalBatchTransfer: 'Transferência animal/lote',
      batchAreaTransfer: 'Transferência lote/área',
      separation: 'Apartação',
      deathAnimal: 'Mortes',
      lossAnimal: 'Perdas',
      birthAnimal: 'Nascimentos',
      weaning: 'Desmama',
      weighing: 'Pesagens',
      sanitary: 'Sanitário',
      pasture: 'Pastagens',
      dietBeat: 'Batelada',
      feeding: 'Arraçoamento',
      appropriation: 'Apontamento agrícola',
      marking: 'Marcação',
      breedingMating: 'Acasalamento',
      pregnancyDiagnosis: 'Diagnóstico de gestação',
      supply: 'Abastecimentos',
      maintenance: 'Manutenção',
    },
    status: {
      created: 'Criado em {{date}}',
      updated: 'Editado em {{date}}',
      dateFormat: 'dd/MM/yyyy HH:mm',
    },
    domainStatus: {
      service_order: {
        '1': 'Aberta',
        '2': 'Em Execução',
        '3': 'Concluída',
        '4': 'Avaliado',
        '9': 'Cancelada',
      },
      appropriation: { O: 'Aberto', F: 'Finalizado', A: 'Apropriado' },
      maintenance: { O: 'Aberto', F: 'Finalizado', A: 'Apropriado' },
      pasture: { O: 'Aberto', F: 'Finalizado', A: 'Apropriado' },
      marking: { '1': 'Marcado', '2': 'Previsto', '3': 'Realizado' },
      breeding_mating: { '1': 'Em Andamento', '2': 'Finalizado' },
    },
    validation: {
      endBeforeStart: 'A data final não pode ser anterior à data inicial.',
    },
  },
};
