// src/constants/languages/languageEsEs/languageContracts.ts
// Traducción es-ES del módulo "Gestión de Contratos" (Contract — Financiero,
// esteira 97-Esteiras/023, TASK-CTR-FE-02). Ver
// `@/@types/language/module-contracts` para el contrato completo.

import { ModuleContracts } from '@/@types/language/module-contracts';

export const languageContracts: ModuleContracts = {
  contract: {
    singularLabel: 'Contrato',
    pluralLabel: 'Contratos',
    titleModule: 'Contratos',

    list: {
      pageTitle: 'Contratos',
      pageSubtitle: 'Gestione los contratos de la finca.',
      table: {
        code: 'Código',
        number: 'Número',
        provider: 'Proveedor',
        employee: 'Responsable',
        date: 'Fecha',
        expirationDate: 'Fecha de Vencimiento',
        installments: 'Cuotas',
        quantity: 'Cantidad',
        amount: 'Valor',
        actions: {
          edit: 'Editar',
          delete: 'Eliminar',
        },
      },
      emptyState: {
        titleEmpty: 'Ningún contrato registrado',
        titleFiltered: 'Ningún contrato encontrado',
        descriptionEmpty: 'Registre el primer Contrato.',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
        cta: 'Nuevo Contrato',
      },
      deletedToast: 'Contrato eliminado con éxito.',
    },

    filter: {
      title: 'Filtrar Contratos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por número',
      provider: 'Proveedor',
      employee: 'Responsable',
    },

    form: {
      title: {
        create: 'Nuevo Contrato',
        edit: 'Editar Contrato',
      },
      subtitle: {
        create: 'Registre un nuevo contrato.',
        edit: 'Actualice los datos del contrato.',
      },
      fields: {
        provider: 'Proveedor',
        employee: 'Responsable',
        number: 'Número',
        date: 'Fecha',
        expirationDate: 'Fecha de Vencimiento',
        installments: 'Cuotas',
        quantity: 'Cantidad',
        unitValueSc: 'Valor Unitario (sc)',
        amount: 'Valor',
      },
      placeholders: {
        provider: 'Busque un proveedor',
        employee: 'Busque un responsable',
        number: 'Número del contrato',
      },
      validation: {
        providerRequired: 'Proveedor es obligatorio',
        employeeRequired: 'Responsable es obligatorio',
        numberRequired: 'Número es obligatorio',
        numberMaxLength: 'Número debe tener máximo 50 caracteres',
        dateRequired: 'Fecha es obligatoria',
        expirationDateRequired: 'Fecha de Vencimiento es obligatoria',
        installmentsRequired: 'Cuotas es obligatorio',
        installmentsMin: 'Cuotas debe ser mayor que cero',
        quantityRequired: 'Cantidad es obligatoria',
        quantityMin: 'Cantidad debe ser mayor que cero',
        unitValueScRequired: 'Valor Unitario (sc) es obligatorio',
        unitValueScMin: 'Valor Unitario (sc) debe ser mayor que cero',
        itemsMinOne: 'Agregue al menos un ítem',
        itemWarehouseRequired: 'Almacén es obligatorio',
        itemProductRequired: 'Producto es obligatorio',
        itemQuantityRequired: 'Cantidad es obligatoria',
        itemQuantityMin: 'Cantidad debe ser mayor que cero',
      },
      itemsSection: {
        title: 'Insumos',
        addButton: '+ Agregar Insumo',
        emptyState: 'Ningún insumo agregado',
        fields: {
          warehouse: 'Almacén',
          product: 'Producto',
          quantity: 'Cantidad',
        },
        removeButton: 'Eliminar',
      },
    },
  },
};
