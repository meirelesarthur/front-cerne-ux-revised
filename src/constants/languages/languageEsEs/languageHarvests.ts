// src/constants/languages/languageEsEs/languageHarvests.ts
// Traducción ES-ES del módulo de ZAFRAS (Registros Base). "Zafra" es el
// término agrícola estándar en español (LatAm) para campaña/temporada de
// cosecha — equivalente directo de "Safra" (PT-BR) y "Harvest" (EN-US).

import { ModuleHarvests } from '@/@types/language/module-harvests';

export const languageHarvests: ModuleHarvests = {
  harvest: {
    singularLabel: 'Zafra',
    list: {
      pageTitle: 'Zafras',
      pageSubtitle: 'Administre los períodos agrícolas de referencia de la finca.',
      deletedToast: 'Zafra eliminada con éxito',
      table: {
        description: 'Descripción',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        active: 'Estado',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
        weeks: 'Semanas',
        weeksSuffix: 'sem.',
      },
      actions: {
        view: 'Visualizar zafra',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna zafra registrada.',
        descriptionEmpty: 'Comience agregando la primera zafra.',
        titleFiltered: 'Ninguna zafra encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Zafra',
      },
    },
    filter: {
      title: 'Filtrar zafras',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nueva Zafra',
        edit: 'Editar Zafra',
      },
      subtitle: {
        create: 'Registre una nueva zafra para organizar los períodos agrícolas de la finca.',
        edit: 'Actualice los datos de la zafra.',
      },
      steps: { general: "Datos Generales", weeks: "Semanas" },
      stepTitles: { general: "Datos generales de la cosecha", weeks: "Código Visual de Semanas" },
      weeksSubtitle: "Defina los colores de cada semana. Este código se mostrará en calendarios, informes y paneles. Haga clic en las semanas para pintarlas.",
      stepCounter: { label: "Paso", of: "de" },
      fields: {
        description: 'Descripción',
        startDate: 'Fecha de Inicio',
        endDate: 'Fecha de Fin',
        isEnabled: 'Activo',
        herdControl: 'Control de Rebaño',
        autoEvolution: 'Evolución Automática de Rebaño',
        firstMonth: '1º Semestre inicia en',
        secondMonth: '2º Semestre inicia en',
      },
      placeholders: {
        description: 'Ej.: Zafra 2026/2027',
      },
      herdControlOptions: {
        individual: 'Individual',
        lote: 'Lote',
      },
      monthOptions: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ],
      weeks: {
        sectionTitle: 'Semanas de la Zafra',
        sectionHint:
          'Generadas automáticamente a partir del período informado. Haga clic o arrastre sobre las semanas para pintarlas con el color seleccionado.',
        weeksCountSuffix: 'semanas',
        emptyTitle:
          'Ninguna semana generada. Ajuste las fechas de inicio y fin para generar las semanas de la zafra.',
        emptyCta: 'Ir a las fechas',
        toolbarLabel: 'Pintar con:',
        resetCycleButton: 'Reiniciar ciclo de colores',
        resetCycleDialogTitle: '¿Reiniciar ciclo de colores?',
        resetCycleDialogDescription:
          'Esto reemplaza todos los colores pintados manualmente por el ciclo estándar. Esta acción no se puede deshacer.',
        resetCycleDialogConfirm: 'Reiniciar',
        overviewLabel: 'Visión general — cómo aparecerá en los informes y calendarios',
        distributionLabel: 'Distribución:',
        distributionUnitSuffix: 'sem.',
        gridAriaLabelEditable:
          'Grilla de semanas — navegue con las flechas y pinte con Enter o Espacio',
        gridAriaLabelReadOnly: 'Grilla de semanas',
        tileAriaLabel: {
          prefix: 'Semana',
          rangeSeparator: 'a',
          colorPrefix: 'color',
          currentSuffix: 'semana actual',
          paintHint: 'Enter o Espacio pinta con',
        },
        colorLabels: {
          amarelo: 'Amarillo',
          azulClaro: 'Azul claro',
          azulEscuro: 'Azul oscuro',
          azulMarinho: 'Azul marino',
          branco: 'Blanco',
          marrom: 'Marrón',
          palha: 'Paja',
          preto: 'Negro',
          rosa: 'Rosa',
        },
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        startDateRequired: 'La fecha de inicio es obligatoria',
        endDateRequired: 'La fecha de fin es obligatoria',
        dateInvalid: 'Ingrese una fecha válida',
        endDateBeforeStart: 'La fecha de fin debe ser posterior o igual a la de inicio.',
        herdControlRequired: 'Seleccione el control de rebaño',
        monthRange: 'Seleccione un mes válido',
        weeksRequired: 'Genere al menos una semana informando un período válido',
        weekDateRange: 'La fecha de fin de la semana debe ser posterior o igual a la de inicio',
        weekColorInvalid: 'Seleccione un color válido de la paleta',
      },
    },
    detail: {
      weeksReadOnlyHint: 'Código visual de las semanas de la zafra (solo lectura).',
      subtitle: {
        herdControlPrefix: 'Rebaño',
        autoEvolutionPrefix: 'Evolución',
      },
      stats: {
        weeksLabel: 'Semanas',
        herdControlLabel: 'Control de Rebaño',
        autoEvolutionLabel: 'Evolución Automática',
        autoEvolutionEnabled: 'Habilitada',
        autoEvolutionDisabled: 'Deshabilitada',
        durationLabel: 'Duración',
        durationUnit: 'meses',
        currentWeekLabel: 'Semana Vigente',
        currentWeekEmpty: 'Sin semana vigente para hoy',
      },
      generalData: {
        title: 'Datos Generales',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Zafra no encontrada',
        description: 'La zafra solicitada no existe, fue eliminada o pertenece a otra finca.',
        back: 'Volver a Zafras',
      },
    },
  },
};
