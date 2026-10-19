// src/constants/languages/languageEsEs/languageDiscountTables.ts
// Traducción ES del módulo "Descuentos/Clasificación" (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-01). Estructura espejo de
// `languagePtBr/languageDiscountTables.ts`.

import { ModuleDiscountTables } from '@/@types/language/module-discount-tables';

export const languageDiscountTables: ModuleDiscountTables = {
  discountTable: {
    titleModule: 'Descuentos/Clasificación',
    singularLabel: 'Tabla de Descuento',
    pluralLabel: 'Tablas de Descuento',
    list: {
      pageTitle: 'Descuentos/Clasificación',
      pageSubtitle: 'Administre las tablas de descuento registradas.',
      deletedToast: 'Tabla de descuento eliminada con éxito',
      columns: {
        code: 'Código',
        name: 'Nombre',
        calculationBase: 'Tipo de Cálculo',
        products: 'Productos',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna tabla de descuento registrada.',
        descriptionEmpty: 'Comience agregando la primera tabla de descuento.',
        titleFiltered: 'Ninguna tabla de descuento encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Tabla de Descuento',
      },
    },
    filter: {
      title: 'Filtrar tablas de descuento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código o nombre',
    },
    form: {
      title: {
        create: 'Nueva Tabla de Descuento',
        edit: 'Editar Tabla de Descuento',
        view: 'Visualizar Tabla de Descuento',
      },
      fields: {
        code: 'Código',
        name: 'Nombre',
        namePlaceholder: 'Descuento Comercial Estándar',
        calculationBase: 'Base de Cálculo',
        status: 'Estado',
      },
      calculationBaseOptions: {
        grossWeight: 'Peso Bruto',
        cumulative: 'Peso Bruto - Descuento Anterior',
      },
      statusOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      products: {
        title: 'Productos',
        addProduct: 'Agregar Producto',
        removeProduct: 'Eliminar producto',
        emptyState: 'Ningún producto agregado',
      },
      picker: {
        title: 'Agregar Producto',
        searchPlaceholder: 'Buscar por descripción o código',
        emptyState: 'Ningún producto elegible',
        alreadyAddedToast: 'Producto ya agregado',
      },
      ruleTypes: {
        impureza: 'Impureza',
        umidade: 'Humedad',
        quebrado: 'Quebrado',
        esverdeado: 'Verdoso',
        avariado: 'Dañado/Averiado',
        taxa_recepcao: 'Tasa de Recepción',
      },
      rules: {
        initialLimitPercent: 'Límite Inicial (%)',
        finalLimitPercent: 'Límite Final (%)',
        discountPercent: 'Descuento (%)',
        addRule: 'Agregar Regla',
        removeRule: 'Eliminar',
        emptyState: 'Ninguna regla agregada en esta pestaña',
      },
      validation: {
        nameRequired: 'Ingrese el nombre.',
        nameMax: 'El nombre debe tener como máximo 181 caracteres.',
        calculationBaseRequired: 'Seleccione la base de cálculo.',
        statusRequired: 'Seleccione el estado.',
        productsMin: 'Agregue al menos un producto.',
        productUuidRequired: 'Seleccione el producto.',
        rulePercentRequired: 'Ingrese un valor entre 0 y 100.',
        rulePercentRange: 'El valor debe estar entre 0 y 100.',
      },
    },
  },
};
