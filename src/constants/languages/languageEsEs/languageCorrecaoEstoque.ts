// src/constants/languages/languageEsEs/languageCorrecaoEstoque.ts
// Traducción ES-ES del módulo de CORRECCIÓN DE INVENTARIO (Administrativo — Inventario).

import { ModuleCorrecaoEstoque } from '@/@types/language/module-correcao-estoque';

export const languageCorrecaoEstoque: ModuleCorrecaoEstoque = {
  stockCorrection: {
    singularLabel: 'Corrección de Inventario',
    pluralLabel: 'Correcciones de Inventario',
    list: {
      pageTitle: 'Corrección de Inventario',
      pageSubtitle: 'Consulte e importe correcciones manuales de inventario mediante planilla.',
      table: {
        code: 'Código',
        date: 'Fecha',
        user: 'Responsable',
        createdAt: 'Registrado el',
        actions: {
          viewDetail: 'Ver Detalle',
          delete: 'Eliminar',
        },
      },
      emptyState: {
        titleEmpty: 'Ninguna corrección de inventario encontrada.',
        descriptionEmpty: 'Aún no hay correcciones importadas para la finca activa.',
        titleFiltered: 'Ninguna corrección de inventario encontrada.',
        descriptionFiltered: 'Intente ajustar el período o borrar el filtro.',
      },
      deletedToast: 'Corrección de inventario eliminada con éxito',
      deleteDialog: {
        description: '¿Está seguro de que desea eliminar la corrección de inventario',
        warning:
          'Esta eliminación revierte el efecto de esta corrección en el saldo de inventario y recalcula el costo promedio de todos los productos de la finca. Es una operación sin vuelta atrás y puede impactar informes financieros ya emitidos.',
      },
    },
    filter: {
      title: 'Filtrar correcciones de inventario',
      startDate: 'Fecha de registro (desde)',
      endDate: 'Fecha de registro (hasta)',
      dateRangeInvalid: 'La fecha final no puede ser anterior a la fecha inicial.',
    },
    importModal: {
      menuButtonLabel: 'Importar planilla',
      title: 'Importar Corrección de Inventario',
      subtitle:
        'Descargue el modelo, complételo y envíe la planilla para registrar una nueva corrección.',
      downloadShortcut: 'Descargar modelo',
      instructions:
        'La planilla tiene 5 columnas: Almacén, Producto, Lote, Cant. Total y Nuevo Costo Promedio. Lote y Nuevo Costo Promedio son opcionales en cada línea — las demás columnas son obligatorias.',
      warning: {
        title: 'Recálculo del costo promedio de la finca',
        description:
          'La importación recalcula el costo promedio de todo el inventario de la finca activa y puede tardar algunos segundos en catálogos grandes de productos. Esta corrección es siempre un registro NUEVO — no sustituye ni elimina ninguna corrección existente.',
      },
      fileUpload: {
        label: 'Planilla (.xlsx)',
        hint: 'Archivo .xlsx de hasta 10MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un archivo .xlsx.',
        errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Líneas con error',
      },
      result: {
        codeLabel: 'Código generado',
        rowsProcessedLabel: 'Líneas procesadas',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
      importSuccessToast: 'Corrección de inventario importada con éxito',
      downloadTemplateError: 'No fue posible descargar el modelo. Intente nuevamente.',
    },
    detail: {
      sections: {
        identification: 'Identificación',
        items: 'Ítems Corregidos',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        user: 'Responsable',
        product: 'Producto',
        warehouse: 'Almacén',
        lot: 'Lote',
        quantity: 'Cantidad Corregida',
        differenceQuantity: 'Diferencia',
        averageCost: 'Costo Promedio',
        averageCostValue: 'Valor',
      },
      table: {
        product: 'Producto',
        warehouse: 'Almacén',
        lot: 'Lote',
        quantity: 'Cantidad Corregida',
        differenceQuantity: 'Diferencia',
        averageCost: 'Costo Promedio',
        averageCostValue: 'Valor',
      },
      itemsEmpty: {
        title: 'Ningún ítem encontrado.',
        description: 'Esta corrección no posee ítems registrados.',
      },
      notFound: {
        title: 'Corrección no encontrada.',
        description: 'No hay corrección de inventario para el identificador informado.',
        back: 'Volver al listado',
      },
      invalidParamsToast: {
        title: 'Parámetros inválidos',
        description: 'El identificador de la corrección es inválido para mostrar el detalle.',
      },
      noData: 'No Posee',
      backButton: 'Volver',
    },
  },
};
