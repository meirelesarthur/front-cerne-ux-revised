// src/constants/languages/languageEsEs/languageSupplyStatusSlas.ts
// Traducción al español del módulo "Parámetros SLA" (SupplyStatusSla —
// Administrativo / Suministros, TASK-FE-SLA-01). Ver
// `@/@types/language/module-supply-status-slas` para el contrato completo.

import { ModuleSupplyStatusSlas } from '@/@types/language/module-supply-status-slas';

export const languageSupplyStatusSlas: ModuleSupplyStatusSlas = {
  supplyStatusSla: {
    singularLabel: 'Parámetro de SLA',
    pluralLabel: 'Parámetros SLA',
    titleModule: 'Parámetros SLA',

    list: {
      pageTitle: 'Parámetros SLA',
      pageSubtitle:
        'Configure el tiempo máximo tolerado, en horas, para cada estado de la solicitud de compra.',
      table: {
        statusLabel: 'Estado',
        maxHours: 'Tiempo máximo (horas)',
        actions: {
          edit: 'Editar',
          save: 'Guardar',
          cancel: 'Cancelar',
        },
      },
      noFarmState: {
        title: 'Seleccione una finca',
        description: 'Seleccione una finca activa para ver los parámetros de SLA.',
      },
      emptyState: {
        title: 'Ningún parámetro encontrado',
        description: 'No hay parámetros de SLA registrados para la finca activa.',
      },
      error: {
        message: 'No fue posible cargar los parámetros de SLA.',
        retry: 'Intentar nuevamente',
      },
      validation: {
        maxHoursRequired: 'El tiempo máximo es obligatorio.',
        maxHoursInvalid: 'El tiempo máximo debe ser un número entero válido.',
        maxHoursMin: 'El tiempo máximo no puede ser negativo.',
      },
      savedToast: '¡SLA Status actualizado con éxito!',
      recordsCount: 'N. Registros: {total}',
      tenantNotice: 'Atención: el tiempo máximo definido aquí vale para todas las fincas del tenant.',
    },
  },
};
