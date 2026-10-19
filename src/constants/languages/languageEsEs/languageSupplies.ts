// src/constants/languages/languageEsEs/languageSupplies.ts
// Traducción ES-ES — módulo Gestión de Flota — Abastecimientos (Supply) —
// dominio propio, Tareas 40/41 (esteira 009).

import { ModuleSupplies } from '@/@types/language/module-supplies';

export const languageSupplies: ModuleSupplies = {
  supply: {
    singularLabel: 'Abastecimiento',
    pluralLabel: 'Abastecimientos',
    list: {
      pageTitle: 'Abastecimientos',
      pageSubtitle: 'Abastecimientos de flota por equipo, con consumo de stock.',
      deletedToast: 'Abastecimiento eliminado con éxito',
      table: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        createdAt: 'Fecha de Creación',
        actions: 'Acciones',
      },
      itemsTable: {
        equipment: 'Equipo',
        warehouse: 'Almacén',
        product: 'Producto',
        measurement: 'Unidad',
        hourMeter: 'Horómetro',
        mileage: 'Km',
        quantity: 'Cantidad',
        amount: 'Valor Unitario',
        totalAmount: 'Valor Total',
        note: 'Observación',
        responsible: 'Responsable',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      filter: {
        title: 'Filtrar abastecimientos',
        equipment: 'Equipo',
        equipmentPlaceholder: 'Buscar equipo',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
      },
      emptyState: {
        title: 'Ningún abastecimiento registrado.',
        description: 'Comience agregando su primer abastecimiento.',
        titleFiltered: 'Ningún abastecimiento encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Nuevo',
      },
      errorState: {
        title: 'No fue posible cargar los abastecimientos.',
        description: 'Verifique su conexión e intente nuevamente.',
        retry: 'Intentar nuevamente',
      },
    },
    form: {
      title: {
        create: 'Nuevo Abastecimiento',
        edit: 'Editar Abastecimiento',
      },
      subtitle: {
        create: 'Registre un nuevo abastecimiento de flota.',
        edit: 'Actualice los datos del abastecimiento.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        requester: 'Solicitante',
        user: 'Usuario',
      },
      items: {
        title: 'Ítems',
        addItem: 'Agregar Ítem',
        removeItem: 'Eliminar',
        emptyRow: 'Ningún ítem agregado.',
        fields: {
          equipment: 'Equipo',
          hourMeter: 'Horómetro',
          mileage: 'Km',
          warehouse: 'Almacén',
          product: 'Producto',
          measurement: 'Unidad',
          quantity: 'Cantidad',
          stock: 'Stock',
          responsible: 'Responsable',
          note: 'Observación',
        },
        placeholders: {
          equipment: 'Buscar equipo',
          warehouse: 'Buscar almacén',
          product: 'Buscar producto',
          measurement: 'Seleccione la unidad',
          responsible: 'Buscar responsable',
        },
      },
      stockExceedsDialog: {
        title: 'Atención',
        intro: 'La cantidad informada es mayor que la cantidad en stock.',
        informedQuantityLabel: 'Cantidad Informada',
        stockQuantityLabel: 'Cantidad en Stock',
        confirm: 'Cerrar',
      },
      errors: {
        invalidFields: 'Revise los campos destacados.',
      },
    },
    detail: {
      title: 'Abastecimiento',
      sections: {
        header: 'Identificación',
        items: 'Ítems',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        back: 'Volver',
      },
      notFound: {
        title: 'Abastecimiento no encontrado.',
        description: 'Verifique si todavía existe.',
        back: 'Volver al listado',
      },
    },
  },
};
