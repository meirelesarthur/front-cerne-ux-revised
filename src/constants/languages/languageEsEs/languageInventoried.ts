// src/constants/languages/languageEsEs/languageInventoried.ts
// Traducción al español (ES) del módulo INVENTARIADO (Operacional →
// Pecuaria → Inventariado, F-041, ejecución CORE_WORKSPACE/97-Esteiras/060).
// Mirror de languagePtBr/languageInventoried.ts — mismas claves, misma estructura.

import { ModuleInventoried } from '@/@types/language/module-inventoried';

export const languageInventoried: ModuleInventoried = {
  inventoried: {
    singularLabel: 'Inventariado',
    pluralLabel: 'Inventariados',
    list: {
      pageTitle: 'Inventariado',
      pageSubtitle: 'Consulte los inventarios de animales importados por planilla.',
      table: {
        date: 'Fecha',
        animalsCount: 'Cantidad de Animales',
        inBatch: 'En Lote',
        outOfBatch: 'Fuera del Lote',
        missing: 'Faltantes en la Planilla',
        actions: 'Acción',
      },
      actions: {
        view: 'Visualizar',
        report: 'Informe',
        delete: 'Eliminar',
      },
      emptyState: {
        title: 'No se encontró ningún inventario.',
        description: 'Todavía no hay inventarios importados para la finca activa.',
      },
      deletedToast: 'Inventario eliminado con éxito',
      deleteDialog: {
        description: '¿Está seguro de que desea eliminar el inventario',
        warning:
          'Esta eliminación quita el inventario y todos los animales vinculados a él. Es una operación sin retorno.',
      },
      importButtonLabel: 'Importar/Exportar',
    },
    importModal: {
      title: 'Importar Inventariado',
      subtitle:
        'Descargue la plantilla, complétela y envíe la planilla para crear un nuevo inventario.',
      downloadShortcut: 'Descargar',
      instructions:
        'La planilla tiene 2 columnas: Lote y Animal. Cada fila informa un animal y el lote en el que fue encontrado durante el conteo. La importación crea 1 nuevo inventario — no sustituye ni elimina ningún inventario existente.',
      fileUpload: {
        label: 'Planilla (.xls o .xlsx)',
        hint: 'Archivo .xls o .xlsx de hasta 10MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Quitar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un archivo .xls o .xlsx.',
        errorSizeMessage: 'El archivo supera el tamaño máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Filas con error',
      },
      result: {
        title: 'Inventario creado con éxito',
        animalsCountLabel: 'Cantidad de Animales',
        inBatchLabel: 'En Lote',
        outOfBatchLabel: 'Fuera del Lote',
        missingLabel: 'Faltantes en la Planilla',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
      successToast: 'Inventario importado con éxito',
      downloadTemplateError: 'No fue posible descargar la plantilla. Intente nuevamente.',
    },
    detail: {
      pageTitle: 'Inventariado',
      back: 'Volver',
      header: {
        date: 'Fecha',
        responsible: 'Responsable',
      },
      animals: {
        title: 'Animales',
        batch: 'Lote',
        animal: 'Animal',
        status: 'Estado',
        noBatch: 'No Posee',
      },
      statusLabels: {
        inBatch: 'En Lote',
        outOfBatch: 'Fuera del Lote',
        missing: 'Faltantes en la Planilla',
      },
      notFound: {
        title: 'Inventario no encontrado.',
        description: 'No hay inventario para el identificador informado.',
      },
      noData: '—',
    },
    report: {
      popupBlocked:
        'No fue posible abrir el informe. Verifique el bloqueador de ventanas emergentes del navegador.',
      error: 'No fue posible generar el informe. Intente nuevamente.',
    },
  },
};
