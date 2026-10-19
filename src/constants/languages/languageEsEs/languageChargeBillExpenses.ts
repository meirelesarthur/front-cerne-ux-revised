// src/constants/languages/languageEsEs/languageChargeBillExpenses.ts
// Traducción ES-ES del módulo "Cuentas por Pagar" (ChargeBillExpense —
// Operacional / Agricultura / Carga). Namespace `chargeBillExpenses` —
// LIBRE, sin colisión con `expenses` (dominio Financiero, entidad homónima)
// ni con `chargeBillIncomes` (gemelo).

import { ModuleChargeBillExpenses } from '@/@types/language/module-charge-bill-expenses';

export const languageChargeBillExpenses: ModuleChargeBillExpenses = {
  chargeBillExpense: {
    singularLabel: 'Cuenta por Pagar',
    pluralLabel: 'Cuentas por Pagar',
    titleModule: 'Cuentas por Pagar',
    list: {
      pageTitle: 'Cuentas por Pagar',
      pageSubtitle: 'Gestione las cuentas por pagar de la carga.',
      deletedToast: 'Cuenta por pagar eliminada con éxito.',
      columns: {
        code: 'Código',
        dueDate: 'Fecha Venc.',
        provider: 'Proveedor',
        cultivation: 'Prorrateo Producto',
        amount: 'Valor',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      fallback: {
        provider: 'Todos Asociados',
        cultivation: 'Todos',
      },
      emptyState: {
        titleEmpty: 'Ninguna cuenta por pagar registrada.',
        descriptionEmpty: 'Comience agregando la primera cuenta por pagar.',
        cta: 'Agregar',
      },
      error: {
        message: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
      deleteConfirm: {
        title: 'Confirmar eliminación',
        description: 'Esta cuenta por pagar será eliminada permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
    },
    form: {
      title: {
        create: 'Nueva Cuenta por Pagar',
        edit: 'Editar Cuenta por Pagar',
      },
      fields: {
        code: 'Código',
        dtEmission: 'Fecha Emisión',
        dueDate: 'Fecha Venc.',
        number: 'N. Documento',
        amount: 'Valor',
        provider: 'Proveedor',
        branch: 'Sucursal del Proveedor',
        cultivation: 'Prorrateo Producto',
        description: 'Descripción',
      },
      placeholders: {
        code: 'Generado automáticamente al guardar',
        provider: 'Todos Asociados',
        cultivation: 'Todos',
      },
      hints: {
        branchRequiresProvider: 'Seleccione un proveedor primero',
        providerHasNoBranches: 'Este proveedor no tiene sucursales registradas',
      },
      toasts: {
        createdSuccess: 'Cuenta por pagar creada con éxito.',
        updatedSuccess: 'Cuenta por pagar actualizada con éxito.',
      },
    },
    detail: {
      fields: {
        code: 'Código',
        dtEmission: 'Fecha Emisión',
        dueDate: 'Fecha Venc.',
        number: 'N. Documento',
        amount: 'Valor',
        provider: 'Proveedor',
        cultivation: 'Prorrateo Producto',
        description: 'Descripción',
      },
      actions: {
        edit: 'Editar',
        back: 'Volver',
      },
      notFound: {
        title: 'Cuenta por pagar no encontrada.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
        back: 'Volver',
      },
    },
  },
};
