// src/constants/languages/languagePtBr/languagePlanos.ts
// Tradução PT-BR do módulo PLANOS (PlanRole) — domínio próprio, TASK-FE-2700.

import { ModulePlanos } from '@/@types/language/module-planos';

export const languagePlanos: ModulePlanos = {
  planRole: {
    singularLabel: 'Plano',
    pluralLabel: 'Planos',
    list: {
      pageTitle: 'Planos',
      pageSubtitle: 'Gerencie os planos de assinatura oferecidos aos tenants.',
      deletedToast: 'Plano removido com sucesso',
      table: {
        name: 'Nome',
        price: 'Valor',
        intervalDays: 'Intervalo (dias)',
        mainRole: 'Atribuição Principal',
        segments: 'Segmentos',
        isFree: 'Gratuito',
        farmLimit: 'Limite de Fazendas',
        concurrentUserLimit: 'Limite de Usuários Concorrentes',
        freeLabel: 'Gratuito',
        paidLabel: 'Pago',
        noRole: '—',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        view: 'Visualizar',
      },
      emptyState: {
        title: 'Nenhum plano cadastrado.',
        description: 'Comece adicionando seu primeiro plano.',
        titleFiltered: 'Nenhum plano encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Plano',
      },
      filter: {
        title: 'Filtrar planos',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por nome',
        isFree: 'Gratuito',
        isFreeAll: 'Todos',
        isFreeOptions: {
          free: 'Gratuito',
          paid: 'Pago',
        },
      },
    },
    form: {
      title: {
        create: 'Novo Plano',
        edit: 'Editar Plano',
      },
      subtitle: {
        create: 'Cadastre um novo plano de assinatura.',
        edit: 'Atualize os dados do plano.',
      },
      fields: {
        name: 'Nome',
        price: 'Valor',
        intervalDays: 'Intervalo (dias)',
        farmLimit: 'Limite de Fazendas',
        concurrentUserLimit: 'Limite de Usuários Concorrentes',
        isFree: 'Gratuito',
        animalsLimit: 'Limite de Animais',
        agricultureAreaLimit: 'Limite de Hectares Agricultura',
        fruitgrowingAreaLimit: 'Limite de Hectares Fruticultura',
        mainRole: 'Atribuição Principal',
        additionalRoles: 'Atribuições Adicionais',
        segments: 'Segmento',
        signupLink: 'Link de Cadastro',
      },
      placeholders: {
        name: 'Ex.: Plano Profissional',
      },
      sections: {
        general: 'Dados Gerais',
        limits: 'Limites',
        assignments: 'Atribuição de Perfil',
        signup: 'Link de Cadastro',
      },
      rolesSearchPlaceholder: 'Buscar perfil por nome',
      selectedRolesCountLabel: 'Selecionados',
      segmentsTree: {
        expandAll: 'Expandir Tudo',
        collapseAll: 'Recolher Tudo',
        selectAll: 'Selecionar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Nenhum segmento neste grupo',
        noCategories: 'Nenhum segmento disponível.',
        searchPlaceholder: 'Buscar segmento por código ou descrição',
        noResults: 'Nenhum segmento encontrado para esta busca.',
      },
      copyLinkButton: 'Copiar link de cadastro',
      copyLinkSuccessToast: 'Link de cadastro copiado para a área de transferência',
      validation: {
        nameRequired: 'Nome é obrigatório',
        nameMaxLength: 'Nome deve ter no máximo 50 caracteres',
        priceRequired: 'Valor é obrigatório',
        priceMin: 'Valor deve ser no mínimo 0',
        intervalDaysRequired: 'Intervalo é obrigatório',
        intervalDaysMin: 'Intervalo deve ser no mínimo 1 dia',
        limitMin: 'Valor deve ser no mínimo 1',
        animalsLimitRequired: 'Limite de animais é obrigatório',
        animalsLimitMin: 'Limite de animais deve ser no mínimo 0',
        areaLimitRequired: 'Limite de área é obrigatório',
        areaLimitMin: 'Limite de área deve ser no mínimo 0',
      },
    },
    detail: {
      actions: {
        edit: 'Editar',
      },
      generalData: {
        title: 'Dados Gerais',
      },
      limits: {
        title: 'Limites',
      },
      assignments: {
        title: 'Atribuição de Perfil',
        empty: 'Nenhum perfil vinculado.',
      },
      segments: {
        title: 'Segmentos',
        empty: 'Nenhum segmento vinculado.',
      },
      signup: {
        title: 'Link de Cadastro',
        description: 'Compartilhe este link para um novo tenant se cadastrar direto neste plano.',
      },
      notFound: {
        title: 'Plano não encontrado.',
        description: 'Verifique se ele ainda existe.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
