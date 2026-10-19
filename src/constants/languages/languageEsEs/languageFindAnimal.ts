// src/constants/languages/languageEsEs/languageFindAnimal.ts
// Tradução ES-ES do módulo "Localizar Animal" (FindAnimal — Operacional >
// Pecuária > Manejo, F-042, TASK-FA-FE-01). Ver `languagePtBr/languageFindAnimal.ts`
// para a origem/fidelidade dos valores pt-BR (legado); esta coluna é NOVA por
// necessidade da Lei 10 (a SPA é trilíngue), não mudança de comportamento.

import { ModuleFindAnimal } from '@/@types/language/module-find-animal';

export const languageFindAnimal: ModuleFindAnimal = {
  findAnimal: {
    singularLabel: 'Localizar Animal',
    pluralLabel: 'Localizar Animal',
    pageTitle: 'Localizar Animal',
    filter: {
      animalLabel: 'Animal',
      animalPlaceholder: 'Seleccione el animal',
      submit: 'Filtrar',
    },
    panels: {
      animal: 'Animal',
      reproductive: 'Reproductivo',
      batch: 'Lote',
      grazing: 'Módulo',
      area: 'Área',
      mother: 'Madre',
    },
    fields: {
      identification: 'Identificación',
      category: 'Categoría',
      age: 'Edad',
      weight: 'Peso Actual',
      father: 'Id Padre',
      categoryMatrix: 'Estado Reproductivo',
      reproductiveStatus: 'Estado Reproductivo',
      lastSemen: 'Último Semen',
      currentBatches: 'Lote Actual',
      code: 'Código',
      quantityAnimal: 'Cant. Animales',
      employeeName: 'Responsable',
      description: 'Descripción',
      fodder: 'Forraje',
      totalArea: 'Área Total',
      recreationArea: 'Área de Recreación',
      productiveArea: 'Área Productiva',
      unproductiveArea: 'Área Improductiva',
    },
    emptyState: {
      noAnimalSelected: 'Ningún animal seleccionado.',
      noBatchLinked: '¡El animal no está vinculado a ningún lote!',
    },
    placeholders: {
      notInformed: 'No Informado',
      dash: '--',
    },
    transfer: {
      label: 'Transferir a Lote',
      placeholder: 'Seleccione',
      submit: 'Guardar',
      successToast: 'Animal transferido de lote con éxito.',
      validation: {
        batchRequired: 'Seleccione un lote para la transferencia.',
      },
    },
    error: {
      message: 'No fue posible cargar la información del animal.',
      notFound: 'Animal no encontrado.',
      retry: 'Intentar de nuevo',
    },
  },
};
