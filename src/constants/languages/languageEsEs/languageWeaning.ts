// src/constants/languages/languageEsEs/languageWeaning.ts
// Traducción ES-ES del módulo de DESTETE (Operacional > Pecuária > Manejo).
// Namespace `weaning` — LIBRE (`02-arquitetura-frontend-desmama.md`).

import { ModuleWeaning } from '@/@types/language/module-weaning';

export const languageWeaning: ModuleWeaning = {
  weaning: {
    singularLabel: 'Destete',
    pluralLabel: 'Destetes',
    list: {
      pageTitle: 'Destete',
      pageSubtitle: 'Gestione los destetes de la finca.',
      deletedToast: 'Destete eliminado con éxito.',
      table: {
        code: 'Código',
        date: 'Fecha',
        type: 'Tipo',
        batch: 'Lote',
        responsible: 'Responsable',
        status: 'Procesamiento',
      },
      status: {
        pending: 'Pendiente',
        finished: 'Finalizado',
        none: '—',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
        editDisabledTooltip: 'Este destete ya tiene procesamiento finalizado y no puede editarse.',
        deleteDisabledTooltip:
          'Este destete ya tiene procesamiento finalizado y no puede eliminarse.',
      },
      emptyState: {
        titleEmpty: 'Ningún destete registrado.',
        descriptionEmpty: 'Comience agregando el primer destete.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
      },
      error: {
        message: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar destetes',
      responsible: 'Responsable',
    },
    deleteDialog: {
      title: 'Confirmar eliminación',
      descriptionTemplate:
        'El destete {code} será eliminado permanentemente. Esta acción no se puede deshacer.',
    },
    type: {
      recria: 'Recría',
      venda: 'Venta',
    },
    form: {
      title: {
        create: 'Nuevo Destete',
        edit: 'Editar Destete',
        view: 'Visualizar Destete',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        type: 'Tipo',
        batch: 'Lote',
        transferBatch: 'Lote (transferencia)',
        responsible: 'Responsable',
        animals: 'Animales (madres)',
      },
      placeholders: {
        type: 'Seleccione el tipo',
        batch: 'Seleccione el lote',
        transferBatch: 'Seleccione el lote de transferencia',
        animals: 'Busque las madres por identificación',
      },
      hints: {
        codeGeneratedOnSave: 'Generado al guardar',
        selectBatchFirst: 'Seleccione el lote primero',
      },
      validation: {
        transferSameAsOrigin: 'El lote de transferencia debe ser diferente del lote de origen.',
      },
      buttons: {
        back: 'Volver',
        edit: 'Editar',
      },
      finishedProcessingTooltip:
        'Este destete ya tiene procesamiento finalizado y ya no puede editarse.',
    },
    report: {
      headerButtonLabel: 'Informe',
      title: 'Informe de Destetes',
      pageSubtitle: 'Filtre el período y el formato para generar el informe.',
      fields: {
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
        format: 'Formato',
      },
      format: {
        pdf: 'PDF',
        xlsx: 'Excel (XLSX)',
      },
      submitButton: 'Exportar',
      cancelButton: 'Cancelar',
      errorToast: 'No fue posible generar el informe.',
      downloadSuccess: 'Informe generado con éxito.',
    },
  },
};
