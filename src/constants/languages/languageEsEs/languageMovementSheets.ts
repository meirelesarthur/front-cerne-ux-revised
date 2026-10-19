// src/constants/languages/languageEsEs/languageMovementSheets.ts
// Traducción ES-ES del módulo "Importación de Mov. Bancarios" (Financiero).
//
// Rótulos de columna (decisión 2 — CLM-19 CORREGIDA): el legado intercambiaba
// los encabezados "Responsable"/"Fecha de Emisión" con los datos
// renderizados (el encabezado "Responsable" mostraba la FECHA, el encabezado
// "Fecha de Emisión" mostraba el NOMBRE del usuario). Aquí cada rótulo está
// vinculado al campo correcto — "Fecha de Emisión" → `date`, "Responsable" →
// `user.name`.

import { ModuleMovementSheets } from '@/@types/language/module-movement-sheets';

export const languageMovementSheets: ModuleMovementSheets = {
  movementSheet: {
    singularLabel: 'Importación de Mov. Bancario',
    pluralLabel: 'Importaciones de Mov. Bancarios',
    list: {
      pageTitle: 'Importación de Mov. Bancarios',
      pageSubtitle: 'Consulte los lotes de movimientos bancarios ya importados por planilla.',
      importButtonLabel: 'Importar planilla',
      table: {
        code: 'Código',
        date: 'Fecha de Emisión',
        user: 'Responsable',
        createdAt: 'Importado el',
        actions: {
          viewDetail: 'Ver Detalle',
        },
      },
      emptyState: {
        titleEmpty: 'No se encontró ninguna importación de movimiento bancario.',
        descriptionEmpty: 'Aún no hay lotes importados para la finca activa.',
        titleFiltered: 'No se encontró ninguna importación de movimiento bancario.',
        descriptionFiltered: 'Intente ajustar el período o borrar el filtro.',
      },
    },
    filter: {
      title: 'Filtrar importaciones',
      startDate: 'Fecha de Emisión (desde)',
      endDate: 'Fecha de Emisión (hasta)',
      dateRangeInvalid: 'La fecha final no puede ser anterior a la fecha inicial.',
    },
    importModal: {
      title: 'Importar Mov. Bancarios',
      subtitle: 'Descargue el modelo, complételo y envíe la planilla para registrar un nuevo lote.',
      downloadShortcut: 'Descargar modelo',
      instructions:
        'La planilla tiene 15 columnas (A-O): Cuenta Bancaria, Tipo de Cuenta, Nº Título, Tipo, Propietario Gestor, Vlr Título, Fecha de Emisión, Fecha de Vencimiento, Fecha de Baja, Deducible, Historial, Proveedor, Cliente, Categoría y Centro de Costo. Propietario Gestor es opcional; Proveedor se exige solo para "C. à Pagar" y Cliente solo para "C. à Receber" — las demás columnas son obligatorias en cada línea.',
      warning: {
        title: 'Importación todo-o-nada',
        description:
          'Si alguna línea de la planilla tiene un error, NINGUNA línea se importa — la operación crea y liquida de inmediato un título por cada línea válida, por eso se valida todo antes de guardar cualquier cosa.',
      },
      fileUpload: {
        label: 'Planilla (.xls/.xlsx)',
        hint: 'Archivo .xls o .xlsx de hasta 10MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Quitar archivo',
        errorTypeMessage: 'Tipo de archivo no aceptado. Envíe un archivo .xls o .xlsx.',
        errorSizeMessage: 'El archivo excede el tamaño máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Líneas con error',
      },
      result: {
        importedLabel: 'Movimientos importados',
        movementSheetCodeLabel: 'Código del lote',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Cerrar',
      importSuccessToast: 'Movimientos bancarios importados con éxito',
      downloadTemplateError: 'No fue posible descargar el modelo. Intente nuevamente.',
    },
    detail: {
      sections: {
        identification: 'Identificación',
      },
      fields: {
        code: 'Código',
        date: 'Fecha de Emisión',
        user: 'Responsable',
      },
      notFound: {
        title: 'Importación no encontrada.',
        description: 'No hay importación de movimiento bancario para el identificador informado.',
        back: 'Volver al listado',
      },
      invalidParamsToast: {
        title: 'Parámetros inválidos',
        description: 'El identificador de la importación es inválido para mostrar el detalle.',
      },
      noData: 'No Posee',
      backButton: 'Volver',
    },
  },
};
