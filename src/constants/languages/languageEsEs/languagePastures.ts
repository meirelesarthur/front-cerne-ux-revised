// src/constants/languages/languageEsEs/languagePastures.ts
// Traducción ES del módulo OPERACIONAL — Pastagem (Pasture) — dominio
// propio, TASK-PAST-FE-00..08 (execução 041).

import { ModulePastures } from '@/@types/language/module-pastures';

export const languagePastures: ModulePastures = {
  pasture: {
    singularLabel: 'Pastura',
    pluralLabel: 'Pasturas',
    list: {
      pageTitle: 'Pasturas',
      pageSubtitle: 'Registros de costeo de pastura por área/lote/actividad.',
      deletedToast: 'Pastura eliminada con éxito',
      statusLegend: {
        opened: 'Abierto',
        finished: 'Finalizado',
        appropriated: 'Apropiado',
      },
      table: {
        status: 'Estado',
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        warehouse: 'Almacén',
        createdAt: 'Fecha de creación',
      },
      actions: {
        view: 'Ver',
        edit: 'Finalizar/Editar',
        appropriate: 'Apropiar',
        delete: 'Eliminar',
        helpVideo: 'Ayuda (video)',
        helpVideoComingSoon: 'Disponible pronto',
      },
      filter: {
        title: 'Filtrar pasturas',
        requester: 'Solicitante',
        requesterPlaceholder: 'Buscar solicitante',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
      },
      emptyState: {
        title: 'Ninguna pastura registrada.',
        description: 'Empieza agregando tu primera pastura.',
        titleFiltered: 'Ninguna pastura encontrada.',
        descriptionFiltered: 'Intenta ajustar los filtros o limpiar la búsqueda.',
        cta: 'Agregar Nuevo',
      },
    },
    form: {
      title: {
        create: 'Nueva Pastura',
        edit: 'Editar Pastura',
      },
      subtitle: {
        create: 'Registra una nueva pastura.',
        edit: 'Actualiza los datos de la pastura.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        operation: 'Operación',
        activity: 'Actividad',
        area: 'Área',
        grazing: 'Módulo de Pastoreo',
        batch: 'Lote',
        animal: 'Animal',
        inputsWarehouse: 'Almacén de Insumos',
        productionsWarehouse: 'Almacén de Producción',
      },
      placeholders: {
        requester: 'Buscar solicitante',
        operation: 'Buscar operación',
        activity: 'Buscar actividad',
        area: 'Buscar área',
        grazing: 'Buscar módulo de pastoreo',
        batch: 'Buscar lote',
        animal: 'Buscar animal',
        inputsWarehouse: 'Buscar almacén',
        productionsWarehouse: 'Buscar almacén',
      },
      tabs: {
        general: 'General',
        equipments: 'Máq/Implementos',
        services: 'MO/Servicios',
        inputs: 'Productos/Insumos',
        occurrences: 'Ocurrencias',
        productions: 'Producción',
      },
      addItem: '+ Agregar Ítem',
      removeItem: 'Eliminar ítem',
      emptyRow: 'Ningún ítem agregado.',
      errors: {
        invalidFields: 'Hay campos inválidos en el formulario. Revisa las pestañas.',
        areaOrGrazingRequired: 'Informa Área o Módulo de Pastoreo (exclusivo).',
        checkDateUnavailable:
          'Validación automática de fecha no disponible en esta versión (GAP-PAST-FE-01).',
        occurrenceRecommendationRequired:
          'Completa la Recomendación para guardar la ocurrencia (la imagen/diagnóstico no se guardan sin recomendación).',
      },
      equipments: {
        fields: {
          equipment: 'Equipo',
          measurement: 'Unidad',
          startHourMeter: 'Horómetro Inicial',
          endHourMeter: 'Horómetro Final',
          note: 'Observación',
        },
        placeholders: {
          equipment: 'Buscar equipo',
          measurement: 'Buscar unidad',
        },
        readonlyHint: 'Campo bloqueado en edición.',
      },
      services: {
        fields: {
          funcType: 'Tipo',
          executor: 'Ejecutor',
          measurement: 'Unidad',
          quantity: 'Cantidad',
          totalQuantity: 'Cant. Total',
        },
        placeholders: {
          funcType: 'Seleccione el tipo',
          executor: 'Buscar ejecutor',
          measurement: 'Buscar unidad',
        },
        funcTypeOptions: {
          employee: 'Empleado',
          function: 'Función',
          provider: 'Proveedor de Servicio',
        },
        readonlyHint: 'Campo bloqueado en edición.',
      },
      inputs: {
        fields: {
          stock: 'Producto (Stock)',
          measurement: 'Unidad',
          quantity: 'Cantidad',
          quantityUnitary: 'Cant. Unitaria',
          totalQuantity: 'Cant. Total',
        },
        placeholders: {
          stock: 'Buscar producto',
          measurement: 'Buscar unidad',
        },
        readonlyHint: 'Campo bloqueado en edición.',
        stockWarningInsufficient: 'Stock insuficiente para la cantidad informada.',
        stockWarningBelowMinimum: 'Stock por debajo del mínimo recomendado.',
      },
      productions: {
        fields: {
          product: 'Producto',
          measurement: 'Unidad',
          stock: 'Stock',
          quantity: 'Cantidad',
          note: 'Observación',
        },
        placeholders: {
          product: 'Buscar producto',
          measurement: 'Buscar unidad',
        },
        readonlyHint: 'Campo bloqueado en edición.',
        newProductButton: '+ Nuevo Producto',
      },
      occurrences: {
        fields: {
          diagnosis: 'Diagnóstico',
          recommendation: 'Recomendaciones',
          priority: 'Prioridad',
        },
        placeholders: {
          diagnosis: 'Describe el diagnóstico',
          recommendation: 'Describe las recomendaciones',
        },
        priorityOptions: {
          low: 'Baja',
          medium: 'Media',
          high: 'Alta',
        },
        images: {
          title: 'Imágenes',
          addButton: 'Agregar imagen',
          changeButton: 'Cambiar',
          removeButton: 'Eliminar',
          maxHint: 'Hasta 3 imágenes',
        },
      },
    },
    show: {
      title: 'Detalle de la Pastura',
      tabs: {
        services: 'MO/Servicios',
        equipments: 'Máq/Implementos',
        inputs: 'Insumos',
        productions: 'Producción',
        occurrences: 'Ocurrencias',
      },
      emptySection: 'Ningún ítem registrado en esta pestaña.',
      backAction: 'Volver',
      notFound: {
        title: 'Pastura no encontrada.',
        description: 'Verifica el enlace accedido o vuelve al listado.',
        back: 'Volver al listado',
      },
    },
    appropriation: {
      title: 'Apropiación de la Pastura',
      subtitle: 'Define el centro de costo y la clase de cada ítem registrado.',
      headerTitle: 'Datos de la Pastura',
      itemsEmptyHint: 'Sin costos registrados — la pastura fue apropiada automáticamente.',
      fields: {
        costCenter: 'Centro de Costo',
        class: 'Clase',
        vlTime: 'Valor/Hora',
      },
      placeholders: {
        costCenter: 'Seleccione el centro de costo',
      },
      classOptions: {
        custeio: 'Costeo',
        investimento: 'Inversión',
      },
      submit: 'Guardar Apropiación',
      cancel: 'Cancelar',
      back: 'Volver',
      appropriatedToast: 'Pastura apropiada con éxito',
      autoAppropriatedToast: 'Pastura apropiada automáticamente (sin costos registrados)',
    },
  },
};
