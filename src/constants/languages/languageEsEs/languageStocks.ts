// src/constants/languages/languageEsEs/languageStocks.ts
// Traducción ES-ES del módulo de SALDO DE INVENTARIO (Administrativo — Inventario).

import { ModuleStocks } from '@/@types/language/module-stocks';

export const languageStocks: ModuleStocks = {
  stock: {
    singularLabel: 'Saldo de Inventario',
    pluralLabel: 'Saldos de Inventario',
    list: {
      pageTitle: 'Saldo de Inventario',
      pageSubtitle: 'Consulte el saldo actual de inventario por producto y almacén.',
      report: 'Informe',
      table: {
        product: 'Producto',
        warehouse: 'Almacén',
        quantity: 'Cantidad',
        lot: 'Lote',
        expirationDate: 'Vencimiento',
        averageCost: 'Costo Promedio',
        total: 'Total',
        info: 'Info',
        actions: {
          viewDetail: 'Ver Detalle',
        },
      },
      emptyState: {
        titleEmpty: 'No se encontró saldo de inventario.',
        descriptionEmpty: 'Todavía no hay inventario registrado para la finca activa.',
        titleFiltered: 'No se encontró saldo de inventario.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
      },
    },
    filter: {
      title: 'Filtrar saldo de inventario',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por producto o lote',
      product: 'Producto',
      productPlaceholder: 'Seleccione un producto',
      warehouse: 'Almacén',
      warehousePlaceholder: 'Seleccione un almacén',
    },
    detail: {
      sections: {
        identification: 'Identificación',
        balance: 'Saldo Consolidado',
        lots: 'Lotes',
        addressing: 'Direccionamiento',
      },
      fields: {
        product: 'Producto',
        warehouse: 'Almacén',
        quantity: 'Cantidad',
        total: 'Total',
        addressingType: 'Tipo',
      },
      table: {
        lot: 'Lote',
        providerLot: 'Lote del Proveedor',
        expirationDate: 'Vencimiento',
        quantity: 'Cantidad',
        averageCost: 'Costo Promedio',
        total: 'Total',
      },
      lotsEmpty: {
        title: 'No se encontraron lotes.',
        description: 'Este saldo no tiene lotes individuales registrados.',
      },
      notFound: {
        title: 'Saldo no encontrado.',
        description: 'No hay saldo de inventario para el producto y almacén indicados.',
        back: 'Volver al listado',
      },
      invalidParamsToast: {
        title: 'Parámetros inválidos',
        description: 'Producto y almacén son obligatorios para mostrar el detalle del saldo.',
      },
      noData: 'No disponible',
    },
    report: {
      title: 'Informe de Saldo de Inventario',
      subtitle:
        'Genere un PDF o exporte un XLSX con los filtros actuales — sin filtro, exporta todos los saldos de la finca.',
      exportPdf: 'Generar PDF',
      exportXlsx: 'Exportar XLSX',
      exportPdfError: {
        title: 'Error al generar el PDF',
        description: 'No se pudo generar el informe en PDF. Inténtelo de nuevo.',
      },
      exportXlsxError: {
        title: 'Error al exportar XLSX',
        description: 'No se pudo exportar la hoja de cálculo. Inténtelo de nuevo.',
      },
    },
    consolidation: {
      groupButton: 'Agrupar',
      alertTitle: 'Agrupar Inventario',
      selectAtLeastTwoAlert: 'Seleccione al menos dos elementos.',
      differentUnitAlert: 'Los elementos deben tener la misma unidad de medida.',
      modalTitle: 'Agrupar Inventario',
      modalPrimaryLabel: 'Seleccione el producto que será el principal.',
      confirmButton: 'Agrupar',
      cancelButton: 'Cancelar',
      successToast: 'Inventarios agrupados con éxito.',
      previewErrorTitle: 'No se pudo agrupar',
      previewErrorToast: 'No se pudo cargar la vista previa del agrupamiento. Inténtelo de nuevo.',
      columns: {
        product: 'Producto',
        warehouse: 'Almacén',
        quantity: 'Cantidad',
        lot: 'Lote',
        expirationDate: 'Vencimiento',
      },
    },
  },
};
