// src/constants/languages/languageEsEs/languagePlanos.ts
// Traducción ES-ES del módulo PLANOS (PlanRole) — dominio propio, TASK-FE-2700.

import { ModulePlanos } from '@/@types/language/module-planos';

export const languagePlanos: ModulePlanos = {
  planRole: {
    singularLabel: 'Plan',
    pluralLabel: 'Planes',
    list: {
      pageTitle: 'Planes',
      pageSubtitle: 'Gestiona los planes de suscripción ofrecidos a los tenants.',
      deletedToast: 'Plan eliminado con éxito',
      table: {
        name: 'Nombre',
        price: 'Precio',
        intervalDays: 'Intervalo (días)',
        mainRole: 'Asignación Principal',
        segments: 'Segmentos',
        isFree: 'Gratuito',
        farmLimit: 'Límite de Fincas',
        concurrentUserLimit: 'Límite de Usuarios Concurrentes',
        freeLabel: 'Gratuito',
        paidLabel: 'Pago',
        noRole: '—',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        view: 'Ver',
      },
      emptyState: {
        title: 'Ningún plan registrado.',
        description: 'Empieza agregando tu primer plan.',
        titleFiltered: 'Ningún plan encontrado.',
        descriptionFiltered: 'Intenta ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Plan',
      },
      filter: {
        title: 'Filtrar planes',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por nombre',
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
        create: 'Nuevo Plan',
        edit: 'Editar Plan',
      },
      subtitle: {
        create: 'Registra un nuevo plan de suscripción.',
        edit: 'Actualiza los datos del plan.',
      },
      fields: {
        name: 'Nombre',
        price: 'Precio',
        intervalDays: 'Intervalo (días)',
        farmLimit: 'Límite de Fincas',
        concurrentUserLimit: 'Límite de Usuarios Concurrentes',
        isFree: 'Gratuito',
        animalsLimit: 'Límite de Animales',
        agricultureAreaLimit: 'Límite de Hectáreas de Agricultura',
        fruitgrowingAreaLimit: 'Límite de Hectáreas de Fruticultura',
        mainRole: 'Asignación Principal',
        additionalRoles: 'Asignaciones Adicionales',
        segments: 'Segmento',
        signupLink: 'Enlace de Registro',
      },
      placeholders: {
        name: 'Ej.: Plan Profesional',
      },
      sections: {
        general: 'Datos Generales',
        limits: 'Límites',
        assignments: 'Asignación de Perfil',
        signup: 'Enlace de Registro',
      },
      rolesSearchPlaceholder: 'Buscar perfil por nombre',
      selectedRolesCountLabel: 'Seleccionados',
      segmentsTree: {
        expandAll: 'Expandir Todo',
        collapseAll: 'Contraer Todo',
        selectAll: 'Seleccionar Todos',
        deselectAll: 'Deseleccionar Todos',
        emptyGroup: 'Ningún segmento en este grupo',
        noCategories: 'Ningún segmento disponible.',
        searchPlaceholder: 'Buscar segmento por código o descripción',
        noResults: 'Ningún segmento encontrado para esta búsqueda.',
      },
      copyLinkButton: 'Copiar enlace de registro',
      copyLinkSuccessToast: 'Enlace de registro copiado al portapapeles',
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 50 caracteres',
        priceRequired: 'El precio es obligatorio',
        priceMin: 'El precio debe ser como mínimo 0',
        intervalDaysRequired: 'El intervalo es obligatorio',
        intervalDaysMin: 'El intervalo debe ser como mínimo 1 día',
        limitMin: 'El valor debe ser como mínimo 1',
        animalsLimitRequired: 'El límite de animales es obligatorio',
        animalsLimitMin: 'El límite de animales debe ser como mínimo 0',
        areaLimitRequired: 'El límite de área es obligatorio',
        areaLimitMin: 'El límite de área debe ser como mínimo 0',
      },
    },
    detail: {
      actions: {
        edit: 'Editar',
      },
      generalData: {
        title: 'Datos Generales',
      },
      limits: {
        title: 'Límites',
      },
      assignments: {
        title: 'Asignación de Perfil',
        empty: 'Ningún perfil vinculado.',
      },
      segments: {
        title: 'Segmentos',
        empty: 'Ningún segmento vinculado.',
      },
      signup: {
        title: 'Enlace de Registro',
        description:
          'Comparte este enlace para que un nuevo tenant se registre directamente en este plan.',
      },
      notFound: {
        title: 'Plan no encontrado.',
        description: 'Verifica si todavía existe.',
        back: 'Volver al listado',
      },
    },
  },
};
