// src/constants/languages/languageEsEs/languageInputEntries.ts
// Traducción ES del módulo "Entrada de Insumos" (InputEntry) — dominio
// propio, esteira 037 (TASK-IE-FE-03).

import { ModuleInputEntries } from '@/@types/language/module-input-entries';

export const languageInputEntries: ModuleInputEntries = {
  inputEntry: {
    singularLabel: 'Entrada de Insumo',
    pluralLabel: 'Entradas de Insumos',

    list: {
      pageTitle: 'Entradas de Insumos',
      pageSubtitle: 'Gestione las entradas de insumos y la generación de stock.',
      deletedToast: 'Entrada de insumo eliminada con éxito',
      table: {
        code: 'Código',
        date: 'Fecha',
        farm: 'Finca',
        proprietary: 'Propietario',
        user: 'Responsable',
        totalAmount: 'Vl. Total',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna entrada de insumo registrada.',
        descriptionEmpty: 'Comience agregando su primera entrada de insumo.',
        titleFiltered: 'Ninguna entrada de insumo encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Entrada de Insumo',
      },
    },

    filter: {
      title: 'Filtrar entradas de insumos',
      proprietary: 'Propietario',
      startDate: 'Fecha desde',
      endDate: 'Fecha hasta',
    },

    form: {
      title: {
        create: 'Nueva Entrada de Insumo',
        edit: 'Editar Entrada de Insumo',
      },
      subtitle: {
        create: 'Registre una nueva entrada de insumo.',
        edit: 'Actualice los datos de la entrada de insumo.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        responsible: 'Responsable',
        farm: 'Finca',
        harvest: 'Cosecha',
        proprietary: 'Propietario',
        note: 'Observaciones',

        product: 'Producto',
        measurement: 'Unidad de Medida',
        quantity: 'Cant.',
        unitValue: 'Vl. Unit.',
        totalValue: 'V. Total',
        generateStock: '¿Genera stock?',
        warehouse: 'Almacén',
        appropriationType: 'Tipo de Apropiación',
        providerLot: 'Lote del Proveedor',
        shelfLife: 'Validez',
        // F-084 ítem 3 — la etiqueta real del legado es "Clasificación"
        // (campo interno `cultivation` se mantiene, mirror
        // `Cultivation-contrato.md`).
        cultivation: 'Clasificación',
        category: 'Categoría Financiera',
        center: 'Centro de Costo',
        area: 'Área',
        batch: 'Lote (Rebaño)',

        automaticWriteoff: 'Baja automática',
        account: 'Cuenta Bancaria',
        movementDate: 'Fecha del Movimiento',
        accountBalancePreview: 'Saldo en la fecha',
      },
      placeholders: {
        harvest: 'Busque una cosecha',
        proprietary: 'Busque un propietario',
        product: 'Busque un producto',
        measurement: 'Busque una unidad de medida',
        warehouse: 'Busque un almacén',
        appropriationType: 'Seleccione el tipo de apropiación',
        cultivation: 'Busque un cultivo',
        category: 'Busque una categoría financiera',
        center: 'Busque un centro de costo',
        area: 'Busque un área',
        batch: 'Busque un lote',
        account: 'Busque una cuenta bancaria',
      },
      appropriationTypeOptions: {
        agriculture: 'Agricultura',
        livestock: 'Ganadería',
      },
      sections: {
        items: 'Ítems',
        automaticWriteoff: 'Baja Automática',
      },
      itemRow: {
        addButton: 'Agregar Ítem',
        removeButton: 'Eliminar ítem',
        emptyLabel: 'Ningún ítem agregado todavía.',
      },
      hints: {
        insufficientBalanceWarning: 'La cuenta bancaria no posee saldo suficiente.',
        productLockedWhenSaved: 'Para cambiar el producto, elimine el ítem y agregue otro',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria',
        dateFuture: 'La fecha no puede ser futura',
        itemsRequired: 'Agregue al menos un ítem',
        productRequired: 'El producto es obligatorio',
        measurementRequired: 'La unidad de medida es obligatoria',
        quantityRequired: 'La cantidad es obligatoria',
        quantityMin: 'La cantidad debe ser mayor que 0',
        unitValueRequired: 'El valor unitario es obligatorio',
        warehouseRequiredWhenGenerateStock:
          'El almacén es obligatorio cuando "¿Genera stock?" es Sí',
        appropriationTypeMaxLength: 'El tipo de apropiación debe tener como máximo 10 caracteres',
        providerLotMaxLength: 'El lote del proveedor debe tener como máximo 15 caracteres',
        providerLotRequiredWhenHasLot:
          'El lote del proveedor es obligatorio para productos con lote',
        shelfLifeRequiredWhenHasLot: 'La validez es obligatoria para productos con lote',
        categoryRequired: 'La categoría financiera es obligatoria',
        centerRequired: 'El centro de costo es obligatorio',
        accountRequiredWhenAutomaticWriteoff:
          'La cuenta bancaria es obligatoria cuando la baja automática está habilitada',
        movementDateRequiredWhenAutomaticWriteoff:
          'La fecha del movimiento es obligatoria cuando la baja automática está habilitada',
      },
      errors: {
        invalidFields: 'Verifique los campos destacados antes de guardar.',
      },
    },

    detail: {
      invalidParamsToast: {
        title: 'Entrada de insumo inválida',
        description: 'El identificador informado no es válido.',
      },
      deleteButton: 'Eliminar',
      notInformed: 'No informado',
      notFound: {
        title: 'Entrada de insumo no encontrada',
        description: 'La entrada de insumo solicitada no existe o fue eliminada.',
        back: 'Volver al listado',
      },
      sections: {
        generalData: 'Datos Generales',
      },
      movement: {
        code: 'Código del Movimiento',
        value: 'Valor del Movimiento',
        date: 'Fecha del Movimiento',
        account: 'Cuenta Bancaria',
        empty: 'Ninguna baja automática registrada para esta entrada.',
      },
    },
  },
};
