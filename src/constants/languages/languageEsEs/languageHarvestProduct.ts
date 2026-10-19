// src/constants/languages/languageEsEs/languageHarvestProduct.ts
// Traducción ES-ES del módulo "Cosecha de Frutas" (HarvestProduct —
// Operacional / Agricultura, F-040, ejecución 040, TASK-FE-1092..1101).

import { ModuleHarvestProduct } from '@/@types/language/module-harvest-product';

export const languageHarvestProduct: ModuleHarvestProduct = {
  singularLabel: 'Cosecha de Frutas',
  pluralLabel: 'Cosecha de Frutas',
  titleModule: 'Cosecha de Frutas',
  createTitle: 'Nueva Cosecha',
  editTitle: 'Editar Cosecha',
  list: {
    table: {
      code: 'Código',
      date: 'Fecha',
      client: 'Cliente',
      area: 'Área',
      product: 'Producto',
      boxesCount: 'Cajas',
      boxTooltipLabel: 'Caja {n} - {amount} Kg',
      totalWeight: 'Peso Total (Kg)',
      actions: 'Acciones',
    },
    actions: {
      view: 'Ver',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    newButton: 'Nueva Cosecha',
    emptyState: {
      titleEmpty: 'Ninguna cosecha registrada.',
      descriptionEmpty: 'Comience registrando una nueva cosecha de frutas.',
      titleFiltered: 'Ningún registro encontrado.',
      descriptionFiltered: 'Intente ajustar los filtros.',
      cta: 'Nueva Cosecha',
    },
    deleteDialog: {
      title: '¿Eliminar cosecha?',
      warning: 'Esta acción no se puede deshacer.',
    },
  },
  filter: {
    title: 'Filtrar Cosecha de Frutas',
    area: 'Área',
    client: 'Cliente',
    dateStart: 'Fecha Inicial',
    dateEnd: 'Fecha Final',
    clearAllFilters: 'Limpiar filtros',
    applyFilters: 'Aplicar filtros',
  },
  form: {
    code: 'Código',
    codeHelper: 'Generado automáticamente al guardar',
    date: 'Fecha',
    area: 'Área',
    client: 'Cliente',
    product: 'Producto',
    plate: 'Placa',
    city: 'Ciudad',
    driverName: 'Nombre del Conductor',
    driverNif: 'CPF/CNPJ del Conductor',
    boxesSectionTitle: 'Cajas',
    boxAmount: 'Peso (Kg)',
    addBoxButton: 'Agregar Caja',
    removeBoxButton: 'Eliminar',
    lookupErrorRetry: 'No fue posible cargar las opciones. Intentar de nuevo.',
    lookupNoResults: 'Ningún resultado para el término buscado.',
    lookupTypeToSearch: 'Escriba al menos 3 caracteres para buscar.',
  },
  validation: {
    dateRequired: 'Informe la fecha',
    areaRequired: 'Informe el área',
    clientRequired: 'Informe el cliente',
    productRequired: 'Informe el producto',
    boxAmountRequired: 'Informe un peso válido',
    boxesMinOne: 'Agregue al menos una caja antes de guardar.',
  },
  toast: {
    createSuccess: 'Registro creado con éxito.',
    updateSuccess: 'Registro actualizado con éxito.',
    deleteSuccess: 'Registro eliminado con éxito.',
    deleteError: 'No fue posible eliminar el registro.',
  },
  detail: {
    title: 'Cosecha de Frutas',
    backButton: 'Volver',
    editButton: 'Editar',
    sections: {
      generalData: 'Datos Generales',
      boxes: 'Cajas',
    },
    table: {
      amount: 'Peso (Kg)',
    },
    notFound: {
      title: 'Cosecha no encontrada.',
      description: 'El registro puede haber sido eliminado o el enlace es incorrecto.',
    },
    invalidParamsToast: {
      title: 'Cosecha de Frutas',
      description: 'Parámetros inválidos para mostrar el detalle.',
    },
  },
};
