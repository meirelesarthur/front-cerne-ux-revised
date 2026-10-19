// src/constants/languages/languageEsEs/languageRatingServiceOrders.ts
// Traducción ES-ES del módulo OPERACIONAL — Evaluaciones de Orden de
// Servicio (RatingServiceOrder) — dominio propio, TASK-FE-041-AVL-01
// (esteira 041).

import { ModuleRatingServiceOrders } from '@/@types/language/module-rating-service-orders';

export const languageRatingServiceOrders: ModuleRatingServiceOrders = {
  ratingServiceOrder: {
    singularLabel: 'Evaluación',
    pluralLabel: 'Evaluaciones',
    titleModule: 'Evaluaciones',
    list: {
      pageTitle: 'Evaluaciones',
      pageSubtitle: 'Órdenes de servicio concluidas pendientes o ya evaluadas.',
      table: {
        code: 'Código',
        status: 'Estado',
        dtEmission: 'Fecha de Emisión',
        deadline: 'Plazo',
        user: 'Solicitante',
        executor: 'Responsable',
      },
      actions: {
        view: 'Ver',
        rate: 'Evaluar',
      },
      filter: {
        title: 'Filtrar evaluaciones',
        code: 'Código',
        codePlaceholder: 'Buscar por código',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
      },
      emptyState: {
        title: 'Ninguna evaluación pendiente.',
        description: 'Las órdenes de servicio concluidas aparecerán aquí para evaluación.',
        titleFiltered: 'Ninguna evaluación encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
      },
      error: {
        message: 'No fue posible cargar las evaluaciones.',
        retry: 'Intentar de nuevo',
      },
    },
    form: {
      title: 'Evaluar Orden de Servicio',
      subtitle: 'Registre la evaluación de la ejecución de esta orden de servicio.',
      sections: {
        context: 'Orden de Servicio',
        assessment: 'Evaluación',
      },
      fields: {
        assessmentGrade: 'Nota',
        ratingDate: 'Fecha de Evaluación',
        feedback: 'Comentarios',
        recommendations: 'Recomendaciones',
      },
      placeholders: {
        assessmentGrade: 'Seleccione la nota',
      },
      notFound: {
        title: 'Orden de servicio no disponible.',
        description:
          'No se pudo cargar esta orden de servicio. Puede que ya no exista o que no tenga acceso a ella.',
        back: 'Volver a la lista',
      },
      readOnly: {
        title: 'Ver Orden de Servicio',
        subtitle:
          'Consulte los datos de esta orden de servicio. La evaluación no está disponible para edición.',
        assessmentPending: 'Esta orden de servicio aún no fue evaluada.',
        back: 'Volver',
      },
      errors: {
        invalidFields: 'Verifique los campos destacados e intente nuevamente.',
      },
      updatedToast: 'Evaluación registrada con éxito',
    },
  },
};
