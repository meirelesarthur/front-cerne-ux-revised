// src/constants/languages/languageEsEs/languageOpenMovements.ts
// Traducción ES-ES del módulo "Saldo Inicial" (OpenMovement — Registros Base
// / Financiero), ejecución 031. Mirror de
// languagePtBr/languageOpenMovements.ts.

import { ModuleOpenMovements } from '@/@types/language/module-open-movements';

export const languageOpenMovements: ModuleOpenMovements = {
  openMovement: {
    singularLabel: 'Saldo Inicial',
    pluralLabel: 'Saldos Iniciales',
    list: {
      pageTitle: 'Saldo Inicial',
      pageSubtitle: 'Administre los saldos iniciales de las cuentas bancarias.',
      deletedToast: 'Saldo inicial eliminado con éxito',
      table: {
        code: 'Código',
        account: 'Cuenta Bancaria',
        date: 'Fecha',
        value: 'Valor',
        proprietary: 'Propietario',
      },
      actions: {
        view: 'Ver',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún saldo inicial registrado.',
        descriptionEmpty: 'Comience agregando el primer saldo inicial.',
        titleFiltered: 'Ningún saldo inicial encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Saldo Inicial',
      },
      deleteConfirm: {
        title: 'Eliminar saldo inicial',
        description: '¿Está seguro de que desea eliminar este saldo inicial',
      },
    },
    filter: {
      title: 'Filtrar Saldos Iniciales',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      account: 'Cuenta Bancaria',
      accountPlaceholder: 'Buscar cuenta bancaria',
      proprietary: 'Propietario',
      proprietaryPlaceholder: 'Buscar propietario',
    },
    form: {
      title: { create: 'Nuevo Saldo Inicial' },
      subtitle: { create: 'Registre un nuevo saldo inicial de cuenta bancaria.' },
      fields: {
        account: 'Cuenta Bancaria',
        type: 'Tipo',
        typeCategory: 'Tp. Categoría',
        proprietary: 'Propietario Gestor',
        date: 'Fecha Movimiento',
        value: 'Valor R$',
        interest: 'Interés R$',
        document: 'Documento',
        note: 'Historial',
      },
      placeholders: {
        account: 'Buscar cuenta bancaria',
        proprietary: 'Buscar propietario',
        document: 'Número del documento',
        note: 'Observación sobre el movimiento',
      },
      fixedValues: {
        type: 'Entrada',
        typeCategory: 'Saldo Inicial',
      },
      apportionments: {
        sectionTitle: 'Prorrateo',
        sectionHint: 'Distribuya el valor del saldo inicial entre categoría y centro de costo.',
        sumLabel: 'Total prorrateado',
        sumHint: 'la suma difiere del valor informado',
        emptyTitle: 'Ningún ítem de prorrateo agregado. Agregue al menos un ítem.',
        addRowLabel: 'Agregar Ítem',
        removeRowLabel: 'Eliminar ítem',
        fields: {
          category: 'Categoría',
          costCenter: 'Centro de Costo',
          value: 'Valor',
        },
        placeholders: {
          category: 'Buscar categoría',
          costCenter: 'Buscar centro de costo',
        },
        categoryLockedHelper: 'Única categoría aplicable — seleccionada automáticamente.',
      },
      validation: {
        accountRequired: 'Seleccione la cuenta bancaria.',
        dateRequired: 'Informe la fecha del movimiento.',
        valueRequired: 'Informe el valor.',
        valueNotZero: 'El valor del saldo no puede ser 0.',
        documentMaxLength: 'Máximo 100 caracteres.',
        noteMaxLength: 'Máximo 40 caracteres.',
        proprietaryRequired: 'Seleccione el propietario gestor.',
        itemsMinLength: 'Agregue al menos un ítem de prorrateo.',
        itemCategoryRequired: 'Seleccione la categoría.',
        itemCostCenterRequired: 'Seleccione el centro de costo.',
        itemValueRequired: 'Informe el valor del ítem.',
        itemValueMin: 'El valor del ítem debe ser mayor que cero.',
      },
    },
    detail: {
      sections: {
        identification: 'Identificación',
        apportionments: 'Prorrateo',
      },
      fields: {
        account: 'Cuenta Bancaria',
        type: 'Tipo Movimiento',
        typeCategory: 'Tp. Categoría',
        date: 'Fecha Movimiento',
        document: 'Documento',
        value: 'Valor',
        interest: 'Interés',
        note: 'Historial',
        proprietary: 'Propietario Gestor',
      },
      table: {
        category: 'Categoría',
        costCenter: 'Centro de Costo',
        value: 'Valor',
      },
      notFound: {
        title: 'Saldo inicial no encontrado',
        description:
          'El registro puede haber sido eliminado. Vuelva a la lista e intente de nuevo.',
        back: 'Volver',
      },
      noData: 'No Posee',
    },
  },
};
