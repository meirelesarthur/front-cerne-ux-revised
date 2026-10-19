// src/constants/languages/languagePtBr/languageRatingServiceOrders.ts
// Tradução PT-BR do módulo OPERACIONAL — Avaliações de Ordem de Serviço
// (RatingServiceOrder) — domínio próprio, TASK-FE-041-AVL-01 (esteira 041).

import { ModuleRatingServiceOrders } from '@/@types/language/module-rating-service-orders';

export const languageRatingServiceOrders: ModuleRatingServiceOrders = {
  ratingServiceOrder: {
    singularLabel: 'Avaliação',
    pluralLabel: 'Avaliações',
    titleModule: 'Avaliações',
    list: {
      pageTitle: 'Avaliações',
      pageSubtitle: 'Ordens de serviço concluídas aguardando ou já avaliadas.',
      table: {
        code: 'Código',
        status: 'Status',
        dtEmission: 'Dt. Emissão',
        deadline: 'Prazo',
        user: 'Solicitante',
        executor: 'Responsável',
      },
      actions: {
        view: 'Visualizar',
        rate: 'Avaliar',
      },
      filter: {
        title: 'Filtrar avaliações',
        code: 'Código',
        codePlaceholder: 'Buscar por código',
        startDate: 'Dt. início',
        endDate: 'Dt. fim',
      },
      emptyState: {
        title: 'Nenhuma avaliação pendente.',
        description: 'Ordens de serviço concluídas aparecerão aqui para avaliação.',
        titleFiltered: 'Nenhuma avaliação encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
      },
      error: {
        message: 'Não foi possível carregar as avaliações.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: 'Avaliar Ordem de Serviço',
      subtitle: 'Registre a avaliação da execução desta ordem de serviço.',
      sections: {
        context: 'Ordem de Serviço',
        assessment: 'Avaliação',
      },
      fields: {
        assessmentGrade: 'Nota',
        ratingDate: 'Data da Avaliação',
        feedback: 'Feedback',
        recommendations: 'Recomendações',
      },
      placeholders: {
        assessmentGrade: 'Selecione a nota',
      },
      notFound: {
        title: 'Ordem de serviço não disponível.',
        description:
          'Não foi possível carregar esta ordem de serviço. Ela pode não existir mais ou você não tem acesso a ela.',
        back: 'Voltar para a lista',
      },
      readOnly: {
        title: 'Visualizar Ordem de Serviço',
        subtitle:
          'Consulte os dados desta ordem de serviço. A avaliação não está disponível para edição.',
        assessmentPending: 'Esta ordem de serviço ainda não foi avaliada.',
        back: 'Voltar',
      },
      errors: {
        invalidFields: 'Verifique os campos destacados e tente novamente.',
      },
      updatedToast: 'Avaliação registrada com sucesso',
    },
  },
};
