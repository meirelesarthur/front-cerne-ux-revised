// src/constants/languages/languageEsEs/languageDepreciations.ts
// Traducción ES-ES del módulo de DEPRECIACIÓN (Depreciation — Cadastros
// Base / Bens-Ativos, execução 027). Módulo TOP-LEVEL, misma convención
// flat de `costCenters`/`markers`/`depreciationForecasts` (no anidado bajo
// un paraguas "cadastrosBase"). Fuente: Depreciation-Frontend-Contrato.md
// §8.3/§9/§10.

import { ModuleDepreciations } from '@/@types/language/module-depreciations';

export const languageDepreciations: ModuleDepreciations = {
  depreciation: {
    singularLabel: 'Depreciación',
    pluralLabel: 'Depreciaciones',
  },
  list: {
    equipment: {
      pageTitle: 'Depreciación Mensual',
      pageSubtitle: 'Gestione los registros de depreciación de equipos.',
      table: {
        period: 'Período',
        equipment: 'Equipo',
        valueToDepreciate: 'Valor a Depreciar',
        monthlyDepreciation: 'Depreciación del Mes',
        remainingBalance: 'Saldo a Depreciar',
        processedDate: 'Procesado el',
      },
      emptyState: {
        titleEmpty: 'Sin registros de depreciación',
        descriptionEmpty: 'Aún no se ha generado ninguna depreciación.',
        titleFiltered: 'No se encontraron resultados',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
      },
      error: {
        message: 'No fue posible cargar los registros de depreciación.',
        retry: 'Intentar de nuevo',
      },
    },
    animal: {
      pageTitle: 'Depreciación Animal',
      pageSubtitle: 'Gestione los registros de depreciación de animales.',
      table: {
        animal: 'Animal',
        entryDate: 'Fecha de Ingreso',
        valueToDepreciate: 'Vl. a depreciar',
        processedDate: 'Fecha de Procesamiento',
        month: 'Mes',
        year: 'Año',
        monthlyDepreciation: 'Vl. Depr. Mes',
        remainingBalance: 'Sdo. a Depreciar',
      },
      emptyState: {
        titleEmpty: 'Sin registros de depreciación',
        descriptionEmpty: 'Aún no se ha generado ninguna depreciación.',
        titleFiltered: 'No se encontraron resultados',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
      },
      error: {
        message: 'No fue posible cargar los registros de depreciación.',
        retry: 'Intentar de nuevo',
      },
    },
  },
  tabs: {
    equipment: 'Equipo',
    animal: 'Animal',
  },
  filter: {
    title: 'Filtrar Depreciación',
    equipment: 'Equipo',
    equipmentAll: 'Todos',
    year: 'Año',
    yearPlaceholder: 'ej.: 2026',
    month: 'Mes',
    monthAll: 'Todos',
    months: {
      january: 'Enero',
      february: 'Febrero',
      march: 'Marzo',
      april: 'Abril',
      may: 'Mayo',
      june: 'Junio',
      july: 'Julio',
      august: 'Agosto',
      september: 'Septiembre',
      october: 'Octubre',
      november: 'Noviembre',
      december: 'Diciembre',
    },
  },
  generateModal: {
    title: 'Generar Depreciación',
    fields: {
      year: 'Año',
      month: 'Mes',
      type: 'Tipo',
    },
    typeOptions: {
      equipment: 'Equipo',
      animal: 'Animal',
      all: 'Ambos',
    },
    submit: 'Generar',
    successToast: 'Depreciación generada con éxito.',
    noEligibleToast: 'Ningún registro elegible para depreciación en el período informado.',
  },
};
