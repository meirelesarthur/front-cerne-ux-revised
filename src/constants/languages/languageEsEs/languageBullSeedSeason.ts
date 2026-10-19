// src/constants/languages/languageEsEs/languageBullSeedSeason.ts
// Traducción ES-ES del módulo "Toros/Semen/Embrión" (BullSeedSeason —
// Operacional / Reproducción, 97-Esteiras/005, Tarea 24).

import { ModuleBullSeedSeason } from '@/@types/language/module-bull-seed-season';

export const languageBullSeedSeason: ModuleBullSeedSeason = {
  bullSeedSeason: {
    singularLabel: 'Toros/Semen/Embrión',
    pluralLabel: 'Toros/Semen/Embrión',
    titleModule: 'Toros/Semen/Embrión',
    list: {
      pageTitle: 'Toros/Semen/Embrión',
      pageSubtitle: 'Administre los registros de toros, semen y embriones.',
      deletedToast: 'Registro eliminado con éxito',
      newButton: 'Nuevo',
      table: {
        code: 'Código',
        date: 'Fecha',
        breedingSeason: 'Estación de Monta',
        responsible: 'Responsable',
        description: 'Descripción',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún registro registrado.',
        descriptionEmpty: 'Comience registrando un nuevo registro.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar el período.',
        cta: 'Nuevo',
      },
      filter: {
        title: 'Filtrar Toros/Semen/Embrión',
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
      },
      deleteDialog: {
        title: '¿Eliminar este registro de Toros/Semen/Embrión?',
        description: 'será eliminado permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
    },
    detail: {
      title: 'Toros/Semen/Embrión',
      backButton: 'Volver',
      editButton: 'Editar',
      deleteButton: 'Eliminar',
      sections: {
        generalData: 'Datos Generales',
        animals: 'Animales',
        products: 'Productos',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        description: 'Descripción',
        breedingSeason: 'Estación de Monta',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
      },
      animalsEmpty: 'Ningún animal vinculado.',
      productsEmpty: 'Ningún producto vinculado.',
      productsTable: {
        product: 'Producto',
        warehouse: 'Almacén',
        quantity: 'Cantidad',
        measurement: 'UM',
        noWarehouse: '—',
      },
      notFound: {
        title: 'Registro no encontrado.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
      },
      invalidParamsToast: {
        title: 'Toros/Semen/Embrión',
        description: 'Parámetros inválidos para mostrar el detalle.',
      },
    },
    form: {
      title: {
        create: 'Nuevo Toros/Semen/Embrión',
        edit: 'Editar Toros/Semen/Embrión',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        description: 'Descripción',
        breedingSeason: 'Estación de Monta',
      },
      animals: {
        sectionTitle: 'Animales',
        animalLabel: 'Animal',
        addButton: 'Agregar Animal',
        removeButton: 'Eliminar',
        emptyState: 'Ningún animal agregado.',
      },
      products: {
        sectionTitle: 'Productos',
        warehouseLabel: 'Almacén',
        productLabel: 'Producto',
        quantityLabel: 'Cantidad',
        measurementLabel: 'UM',
        stockLabel: 'Existencia',
        addButton: 'Agregar Producto',
        removeButton: 'Eliminar',
        emptyState: 'Ningún producto agregado.',
      },
      validation: {
        dateRequired: 'Indique la fecha',
        descriptionRequired: 'Indique la descripción',
        breedingSeasonRequired: 'Indique la Estación de Monta',
        animalRequired: 'Seleccione un animal',
        productRequired: 'Seleccione un producto',
        quantityRequired: 'Indique la cantidad',
        quantityMin: 'La cantidad no puede ser negativa',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Hay cambios no guardados en este formulario que se perderán',
        confirmButton: 'Salir sin guardar',
      },
    },
  },
};
