// src/constants/languages/languageEsEs/languageLoteModuloArea.ts
// Traducción ES-ES del módulo "Lote/Módulo/Área" (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070).

import { ModuleLoteModuloArea } from '@/@types/language/module-lote-modulo-area';

export const languageLoteModuloArea: ModuleLoteModuloArea = {
  loteModuloArea: {
    batchModuleAreaTransfer: {
      singularLabel: 'Lote/Módulo/Área',
      pluralLabel: 'Lote/Módulo/Área',
      list: {
        pageTitle: 'Lote/Módulo/Área',
        table: {
          code: 'Código',
          description: 'Descripción',
          animalsCount: 'Cant. Animales',
          currentLink: 'Vínculo Actual',
          actions: 'Acciones',
          noCurrentLink: '—',
        },
        filter: {
          batch: 'Lote',
          batchPlaceholder: 'Seleccione',
        },
        actions: {
          filter: 'Filtrar',
          clearFilter: 'Limpiar filtro',
          edit: 'Editar/Transferir',
        },
        error: {
          message: 'No fue posible cargar las transferencias de Lote/Módulo/Área.',
          retry: 'Intentar de nuevo',
        },
        emptyState: {
          titleEmpty: 'Ningún lote encontrado.',
          descriptionEmpty: 'Ajuste el filtro o espere nuevos lotes activos.',
        },
      },
      form: {
        title: 'Transferir Lote',
        fields: {
          code: 'Código',
          date: 'Fecha',
          user: 'Responsable',
          batch: 'Lote',
          qtd: 'Cant. Animales',
          area: 'Vínculo Actual',
          areaDestination: 'Área',
          grazingDestination: 'Módulo',
          corralDestination: 'Corral',
        },
        saveButton: 'Guardar',
        cancelButton: 'Cancelar',
        successToast: 'Transferencia realizada con éxito',
        validation: {
          destinationRequired: 'Seleccione Área, Módulo o Corral de destino',
        },
        error: {
          message: 'No fue posible cargar los datos de esta transferencia.',
        },
      },
      cascade: {
        dateInvalidForArea: 'Fecha inválida para el Área seleccionada.',
        dateInvalidForGrazing: 'Fecha inválida para el Módulo seleccionado.',
        dateInvalidForCorral: 'Fecha inválida para el Corral seleccionado.',
        dateInvalidGeneric: 'Fecha inválida para esta transferencia.',
      },
    },
  },
};
