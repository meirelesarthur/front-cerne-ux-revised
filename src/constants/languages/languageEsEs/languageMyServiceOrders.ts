// src/constants/languages/languageEsEs/languageMyServiceOrders.ts
// Traducción ES-ES del módulo OPERACIONAL — Mis OS (MyServiceOrder) —
// dominio propio, esteira 063 (TASK-MOS-FE-01).

import { ModuleMyServiceOrders } from '@/@types/language/module-my-service-orders';

export const languageMyServiceOrders: ModuleMyServiceOrders = {
  myServiceOrder: {
    singularLabel: 'Mi OS',
    pluralLabel: 'Mis OS',
    list: {
      pageTitle: 'Mis OS',
      pageSubtitle: 'Órdenes de servicio bajo su responsabilidad de ejecución.',
      table: {
        status: 'Estado',
        code: 'Código',
        dtEmission: 'Fecha de Emisión',
        deadline: 'Plazo',
        user: 'Solicitante',
        executor: 'Responsable',
      },
      actions: {
        view: 'Ver',
        execute: 'Ejecutar',
      },
      filter: {
        title: 'Filtrar Mis OS',
        code: 'Código',
        codePlaceholder: 'Buscar por código',
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
        paginationQuantity: 'Elementos por página',
      },
      emptyState: {
        title: 'No se encontró ninguna OS.',
        description: 'Las órdenes de servicio bajo su responsabilidad aparecerán aquí.',
        titleFiltered: 'No se encontró ninguna OS.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
      },
      error: {
        message: 'No fue posible cargar las órdenes de servicio.',
        retry: 'Intentar de nuevo',
      },
    },
    form: {
      title: 'Ejecutar Orden de Servicio',
      subtitle: 'Registre la ejecución de esta orden de servicio.',
      sections: {
        execution: 'Ejecución',
        labor: 'Mano de obra',
        equipment: 'Maq/Implementos',
        products: 'Insumos',
        productions: 'Producción',
        protections: 'Protecciones(EPP)',
        attachments: 'Evidencias',
      },
      readonly: {
        sections: {
          identification: 'Identificación de la OS',
          serviceType: 'Tipo de servicio',
          execution: 'Ejecución',
          conditions: 'Condiciones y Restricciones',
          instructions: 'Instrucciones Detalladas',
          safety: 'Seguridad y Sostenibilidad',
        },
        fields: {
          code: 'Código',
          user: 'Solicitante',
          executor: 'Encargado',
          dtEmission: 'Fecha de Emisión',
          executionDate: 'Fecha de Ejecución',
          deadline: 'Plazo Final',
          serviceFarm: 'Finca',
          category: 'Uso',
          operation: 'Operación',
          activity: 'Actividad',
          area: 'Área',
          cultivation: 'Cultivo/Variedad',
          batch: 'Lote',
          categoryAnimal: 'Categoría',
          weatherRequirements: 'Requisitos Climáticos',
          minimumTemperature: 'Temperatura Mínima(C°)',
          maximumTemperature: 'Temperatura Máxima(C°)',
          allowedWorkingPeriodStart: 'Horario de Ejecución Permitido(Inicio)',
          allowedWorkingPeriodEnd: 'Horario de Ejecución Permitido(Final)',
          serviceDescription: 'Descripción del Servicio',
          expectedResultDescription: 'Resultado Esperado',
          successCriteriaDescription: 'Criterios de Éxito',
          roadmapDescription: 'Hoja de Ruta/Planificación',
          environmentalRestrictions: 'Restricciones Ambientales',
          legalCompliance: 'Cumplimiento Legal',
        },
      },
      fields: {
        status: 'Estado',
        executionStartDate: 'Fecha Inicio',
        executionEndDate: 'Fecha Conclusión',
        executionProblems: 'Problemas Encontrados',
        correctiveActions: 'Acciones correctivas',
        attachmentFile: 'Archivo',
        attachmentName: 'Nombre del adjunto',
      },
      placeholders: {
        status: 'Seleccione el estado',
      },
      checklist: {
        itemLabel: 'Ítem',
        isChecked: 'Concluido',
        emptyRow: 'Ningún elemento registrado en esta sección.',
      },
      attachmentRow: {
        addButton: 'Agregar adjunto',
        removeButton: 'Eliminar',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDragging: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        clearFileLabel: 'Eliminar archivo',
        replaceLabel: 'Reemplazar',
        existingFileLabel: 'Archivo ya enviado',
        hint: 'PDF, imagen (JPG, PNG, GIF), Word, Excel, CSV o TXT — hasta 10 MB.',
        errorType: 'Tipo de archivo no aceptado. Envíe PDF, imagen, Word, Excel, CSV o TXT.',
        errorSize: 'El archivo debe tener como máximo 10 MB.',
        defaultName: 'Nombre del adjunto',
        nameRequired: 'Ingrese un nombre para el adjunto.',
      },
      updatedToast: 'Ejecución registrada con éxito',
      notFound: {
        title: 'OS no disponible.',
        description:
          'No se pudo cargar esta orden de servicio. Puede que ya no exista o que no esté bajo su responsabilidad.',
        back: 'Volver al listado',
      },
      readOnly: {
        title: 'Ver Orden de Servicio',
        subtitle:
          'Consulte esta orden de servicio. La ejecución no está disponible en su estado actual.',
        statusLabel: 'Estado',
        back: 'Volver',
      },
      executionEndDateRequiredWhenCompleted: 'Obligatorio cuando el estado es "Concluida".',
    },
  },
};
