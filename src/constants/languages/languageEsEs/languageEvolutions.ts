// src/constants/languages/languageEsEs/languageEvolutions.ts
// Traducción ES-ES del módulo de EVOLUCIÓN/REBAÑO (Operacional > Pecuaria >
// Transferencias / Informes > Pecuaria). Namespace `evolutions` — LIBRE
// (spa-contract-evolucao-rebanho.md §1).

import { ModuleEvolutions } from '@/@types/language/module-evolutions';

export const languageEvolutions: ModuleEvolutions = {
  evolution: {
    singularLabel: 'Evolución/Rebaño',
    pluralLabel: 'Evoluciones/Rebaño',
    list: {
      pageTitle: 'Evolución/Rebaño',
      pageSubtitle: 'Siga los cambios de categoría de los animales del rebaño.',
      table: {
        animal: 'Animal',
        birthDate: 'Fecha de Nacimiento',
        date: 'Fecha de Evolución',
        categoryOld: 'Categoría Anterior',
        categoryNext: 'Próxima Categoría',
      },
      empty: {
        title: 'Ninguna evolución registrada.',
        description:
          'Las evoluciones se generan automáticamente por el proceso diario del sistema, sin registro manual.',
      },
      emptyFiltered: {
        title: 'Ninguna evolución encontrada.',
        description: 'Intente ajustar los filtros.',
      },
      error: {
        title: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
      report: 'Informe',
    },
    filter: {
      title: 'Filtrar evoluciones',
      animal: 'Animal',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
    },
    report: {
      pageTitle: 'Informe de Evolución de Rebaño',
      pageSubtitle: 'Exporte el informe de evolución de categoría de los animales en PDF o Excel.',
      filter: {
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
        format: 'Formato',
      },
      format: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      downloadButton: 'Generar informe',
      toasts: {
        success: 'Informe generado con éxito.',
        genericError: 'No fue posible generar el informe.',
      },
      hint: {
        datesRequired: 'Informe la fecha inicial y la fecha final para generar el informe.',
      },
    },
  },
};
