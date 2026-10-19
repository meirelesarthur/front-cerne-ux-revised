// src/constants/languages/languageEsEs/languageAccounts.ts
// Traducción ES-ES del módulo "Contas Bancárias" (Account — Registros Base /
// Financieros, ejecución 025, TASK-FE-561). Etiquetas de campo fieles a
// `Account-FrontEnd-contrato.md §5` — "N.º de Contrato Bancario"/"N.º de
// Convenio Bancario" (columnas eliminadas del esquema en 2025).

import { ModuleAccounts } from '@/@types/language/module-accounts';

export const languageAccounts: ModuleAccounts = {
  account: {
    singularLabel: 'Cuenta Bancaria',
    pluralLabel: 'Cuentas Bancarias',

    list: {
      pageTitle: 'Cuentas Bancarias',
      pageSubtitle:
        'Gestione las cuentas corrientes, de ahorro, inversiones y cajas internas del tenant.',
      columns: {
        description: 'Descripción',
        bank: 'Banco',
        agency: 'Agencia',
        account: 'Cuenta',
        type: 'Tipo',
        limit: 'Límite',
        balance: 'Saldo',
        isEnabled: 'Estado',
        ticket: 'Boleto',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna cuenta bancaria registrada',
        descriptionEmpty: 'Registre la primera cuenta bancaria para comenzar.',
        titleFiltered: 'Ninguna cuenta encontrada',
        descriptionFiltered: 'Intente ajustar los filtros o la búsqueda.',
        cta: 'Agregar Nueva',
      },
      noFarmSelected: {
        title: 'Seleccione una finca',
        description: 'Elija una finca activa para ver las cuentas bancarias del tenant.',
      },
      deleteConfirm: {
        title: 'Eliminar Cuenta Bancaria',
        description: '¿Está seguro de que desea eliminar la cuenta bancaria',
        warning: 'Esta acción no se puede deshacer.',
      },
      deletedToast: 'Cuenta bancaria eliminada con éxito.',
      deleteBlocked: {
        title: 'No es posible eliminar',
        balance: 'Esta cuenta tiene un saldo diferente de cero.',
        dependents: 'Esta cuenta tiene cuentas de inversión vinculadas a ella.',
        hint: 'Esta verificación solo considera las cuentas ya cargadas en la página actual — los vínculos fuera de ella solo aparecen en el error del servidor al intentar eliminar. Regularice el saldo y desvincule las cuentas dependientes antes de eliminar.',
        confirm: 'Entendido',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción, código o banco',
      type: 'Tipo',
      typeAll: 'Todos los tipos',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },

    form: {
      title: {
        create: 'Nueva Cuenta Bancaria',
        edit: 'Editar Cuenta Bancaria',
      },
      subtitle: {
        create: 'Registre una nueva cuenta bancaria.',
        edit: 'Actualice los datos de la cuenta bancaria.',
      },
      sections: {
        general: 'Información General',
        ticket: 'Emisión de Boleto',
        farms: 'Fincas Vinculadas',
      },
      fields: {
        bank: 'Banco',
        agency: 'Agencia',
        account: 'Cuenta',
        type: 'Tipo',
        code: 'Código',
        description: 'Descripción',
        limit: 'Límite',
        balance: 'Saldo',
        isEnabled: 'Activo',
        useCashBook: 'Usa en el Libro de Caja',
        provider: 'Proveedor',
        investmentAccount: 'Cuenta de Inversión Vinculada',
        isTicket: 'Emite Boleto',
        bankContract: 'N.º de Contrato Bancario',
        bankAgreement: 'N.º de Convenio Bancario',
        typeCnab: 'Tipo de Boleto (CNAB)',
        proprietaries: 'Propietarios',
        farms: 'Fincas',
      },
      placeholders: {
        bank: 'Seleccione el banco',
        agency: 'Ej.: 0001',
        account: 'Ej.: 12345-6',
        type: 'Seleccione el tipo',
        code: 'Ej.: 0001',
        description: 'Ej.: Cuenta Corriente Principal',
        provider: 'Seleccione el proveedor',
        investmentAccount: 'Seleccione la cuenta de inversión',
        bankContract: 'Ej.: 12345678',
        bankAgreement: 'Ej.: 12345678',
        typeCnab: 'Seleccione el tipo de CNAB',
      },
      typeOptions: {
        current: 'Corriente',
        savings: 'Ahorro',
        investment: 'Inversión Financiera',
        cashBook: 'Caja Interna',
      },
      cnabOptions: {
        cnab240: 'CNAB240',
        cnab400: 'CNAB400',
      },
      hints: {
        balanceReadOnly: 'Saldo calculado externamente — no editable en este formulario.',
        investmentAccountFilter: 'Solo se muestran cuentas del tipo Inversión Financiera.',
      },
      farms: {
        searchPlaceholder: 'Buscar finca...',
        selectAllLabel: 'Marcar todas',
        deselectAllLabel: 'Desmarcar todas',
        selectedCountLabel: 'Fincas seleccionadas',
        emptyLabel: 'Ninguna finca encontrada.',
        errorLabel: 'Error al cargar las fincas.',
        retryLabel: 'Intentar de nuevo',
      },
      proprietaries: {
        searchPlaceholder: 'Buscar propietario...',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Propietarios seleccionados',
        emptyLabel:
          'Ningún propietario vinculado a las fincas marcadas. Vincule el propietario a la finca en el registro de Propietarios.',
        emptyNoFarmsLabel:
          'Marque al menos una finca arriba para listar los propietarios vinculados a ella.',
        errorLabel: 'Error al cargar los propietarios.',
        retryLabel: 'Intentar de nuevo',
      },
      validation: {
        bankRequired: 'Seleccione el banco.',
        agencyRequired: 'Campo obligatorio.',
        agencyMaxLength: 'Máximo de 6 caracteres.',
        accountRequired: 'Campo obligatorio.',
        accountMaxLength: 'Máximo de 20 caracteres.',
        typeRequired: 'Seleccione el tipo de cuenta.',
        codeRequired: 'Campo obligatorio.',
        codeMaxLength: 'Máximo de 4 caracteres.',
        descriptionRequired: 'Campo obligatorio.',
        descriptionMaxLength: 'Máximo de 40 caracteres.',
        limitRequired: 'Informe el límite.',
        bankContractRequired: 'N.º de Contrato Bancario es obligatorio para cuentas con boleto.',
        bankContractMaxLength: 'Máximo de 8 caracteres.',
        bankAgreementRequired: 'N.º de Convenio Bancario es obligatorio para cuentas con boleto.',
        bankAgreementMaxLength: 'Máximo de 8 caracteres.',
        typeCnabRequired: 'Seleccione el tipo de CNAB para cuentas con boleto.',
        proprietariesRequired: 'Seleccione al menos un propietario para cuentas con boleto.',
      },
      savedToast: 'Cuenta bancaria guardada con éxito.',
    },
  },
};
