// src/constants/languages/languagePtBr/languageMaintenancePreventives.ts
// Tradução PT-BR do módulo Gestão de Frota — Manutenções Preventivas
// (MaintenancePreventive) — domínio próprio, Tarefas 43/44 (esteira 010).

import { ModuleMaintenancePreventives } from '@/@types/language/module-maintenance-preventives';

export const languageMaintenancePreventives: ModuleMaintenancePreventives = {
  maintenancePreventive: {
    singularLabel: 'Manutenção Preventiva',
    pluralLabel: 'Manutenções Preventivas',
    list: {
      pageTitle: 'Manutenções Preventivas',
      pageSubtitle: 'Manutenções preventivas de frota por equipamento.',
      deletedToast: 'Manutenção preventiva removida com sucesso',
      table: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        actions: 'Ações',
      },
      itemsTable: {
        equipment: 'Equipamento',
        date: 'Data Revisão',
        message: 'Serviço',
        hourMeterKm: 'Horímetro/Km',
        note: 'Observação',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      filter: {
        title: 'Filtrar manutenções preventivas',
        equipment: 'Equipamento',
        equipmentPlaceholder: 'Buscar equipamento',
        startDate: 'Dt. início',
        endDate: 'Dt. fim',
      },
      emptyState: {
        title: 'Nenhuma manutenção preventiva cadastrada.',
        description: 'Comece adicionando sua primeira manutenção preventiva.',
        titleFiltered: 'Nenhuma manutenção preventiva encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Nova',
      },
      errorState: {
        title: 'Não foi possível carregar as manutenções preventivas.',
        description: 'Verifique sua conexão e tente novamente.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: {
        create: 'Nova Manutenção Preventiva',
        edit: 'Editar Manutenção Preventiva',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        user: 'Usuário',
      },
      items: {
        title: 'Itens',
        addItem: 'Adicionar Item',
        removeItem: 'Remover',
        emptyRow: 'Nenhum item adicionado.',
        fields: {
          equipment: 'Equipamento',
          message: 'Serviço',
          date: 'Data Revisão',
          hourMeterKm: 'Horímetro/Km',
          note: 'Observação',
        },
        placeholders: {
          equipment: 'Buscar equipamento',
          message: 'Descreva o serviço',
        },
      },
      errors: {
        invalidFields: 'Revise os campos destacados.',
        equipmentRequired: 'Selecione o equipamento.',
        messageRequired: 'Informe o serviço.',
      },
    },
    detail: {
      sections: {
        header: 'Identificação',
        items: 'Itens',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        user: 'Usuário',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        back: 'Voltar',
      },
      notFound: {
        title: 'Manutenção preventiva não encontrada.',
        description: 'Verifique se ela ainda existe.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
