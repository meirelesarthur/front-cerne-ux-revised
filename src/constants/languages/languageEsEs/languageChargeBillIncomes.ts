// src/constants/languages/languageEsEs/languageChargeBillIncomes.ts
// Traducción ES-ES del módulo "Cuentas por Cobrar" (ChargeBillIncome —
// Operacional / Agricultura / Carga). Namespace `chargeBillIncomes` — LIBRE,
// sin colisión con `incomes` (dominio Financiero, entidad homónima).

import { ModuleChargeBillIncomes } from '@/@types/language/module-charge-bill-incomes';

export const languageChargeBillIncomes: ModuleChargeBillIncomes = {
  chargeBillIncome: {
    singularLabel: 'Cuenta por Cobrar',
    pluralLabel: 'Cuentas por Cobrar',
    titleModule: 'Cuentas por Cobrar',
    list: {
      pageTitle: 'Cuentas por Cobrar',
      pageSubtitle: 'Gestione las cuentas por cobrar de la carga.',
      deletedToast: 'Cuenta por cobrar eliminada con éxito.',
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
        titleEmpty: 'Ninguna cuenta por cobrar registrada.',
        descriptionEmpty: 'Comience agregando la primera cuenta por cobrar.',
        cta: 'Agregar',
      },
      error: {
        message: 'No fue posible cargar los datos.',
        retry: 'Intentar de nuevo',
      },
      deleteConfirm: {
        title: 'Confirmar eliminación',
        description: 'Esta cuenta por cobrar será eliminada permanentemente.',
        warning: 'Esta acción no se puede deshacer.',
      },
    },
    form: {
      title: {
        create: 'Nueva Cuenta por Cobrar',
        edit: 'Editar Cuenta por Cobrar',
      },
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
      placeholders: {
        code: 'Generado automáticamente al guardar',
        provider: 'Todos Asociados',
        cultivation: 'Todos',
      },
      toasts: {
        createdSuccess: 'Cuenta por cobrar creada con éxito.',
        updatedSuccess: 'Cuenta por cobrar actualizada con éxito.',
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
        title: 'Cuenta por cobrar no encontrada.',
        description: 'El registro pudo haber sido eliminado o el enlace es incorrecto.',
        back: 'Volver',
      },
    },
  },
};
