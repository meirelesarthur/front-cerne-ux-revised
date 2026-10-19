// src/constants/languages/languageEsEs/languageAdvances.ts
// Traducción ES del módulo de ADELANTO SALARIAL (Administrativo).
// TASK-FE-adiant-salarial (97-Esteiras/034) — CRUD núcleo (D2: dimensión
// financiera fuera de alcance, sin términos financieros aquí).

import { ModuleAdvances } from '@/@types/language/module-advances';

export const languageAdvances: ModuleAdvances = {
  advance: {
    singularLabel: 'Adelanto Salarial',
    pluralLabel: 'Adelantos Salariales',
    list: {
      pageTitle: 'Adelantos Salariales',
      pageSubtitle: 'Administre los adelantos salariales otorgados a los empleados.',
      deletedToast: 'Adelanto eliminado con éxito',
      table: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
        actions: 'Acciones',
      },
      actions: {
        view: 'Ver adelanto',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún adelanto registrado.',
        descriptionEmpty: 'Comience agregando el primer adelanto salarial.',
        titleFiltered: 'Ningún adelanto encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Adelanto',
      },
      filter: {
        employee: 'Empleado',
      },
    },
    detail: {
      generalData: {
        title: 'Datos Generales',
      },
      fields: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
      },
      installments: {
        title: 'Prorrateo del Anticipo',
        month: 'Mes',
        value: 'Valor',
        empty: 'Ninguna cuota vinculada.',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Adelanto no encontrado',
        description: 'El adelanto solicitado no existe, fue eliminado o pertenece a otra finca.',
        back: 'Volver a Adelantos',
      },
    },
    form: {
      title: {
        create: 'Nuevo Adelanto Salarial',
        edit: 'Editar Adelanto Salarial',
      },
      fields: {
        employee: 'Empleado',
        event: 'Evento',
        date: 'Fecha',
        amount: 'Valor',
        installments: 'Prorrateo del Anticipo',
        financialType: 'Tipo de Título',
        provider: 'Proveedor',
        proprietary: 'Propietario',
        number: 'Número',
        note: 'Observación',
        fiscalDocument: 'Nota Fiscal',
        hasInput: '¿Tiene Entrada?',
        inputDate: 'Fecha de la Entrada',
        inputValue: 'Valor de la Entrada',
        financialCategory: 'Categoría Financiera',
        costCenter: 'Centro de Costo',
        apportionmentValue: 'Valor',
        apportionmentPercent: '%',
        dueDate: 'Vencimiento',
        hasFinancial: '¿Generar Financiero?',
      },
      installmentRow: {
        month: 'Mes',
        value: 'Valor',
        addButton: 'Agregar cuota',
        removeButton: 'Eliminar cuota',
        emptyLabel: 'Ninguna cuota agregada.',
        sumBadgeLabel: 'Suma de las cuotas',
      },
      sections: {
        financial: 'Generar Financiero',
        financialInstallments: 'Cuotas Financieras',
        apportionment: 'Prorrateo por Categoría',
        installmentGenerator: 'Generar Cuotas',
      },
      installmentGenerator: {
        count: 'Cant. Cuotas',
        firstDueDate: '1er Vencimiento',
        intervalDays: 'Intervalo (días)',
        generateButton: 'Generar Cuotas',
        overwriteConfirm: 'Esto reemplaza las cuotas actuales. ¿Continuar?',
      },
      financialInstallmentRow: {
        addButton: 'Agregar cuota financiera',
        removeButton: 'Eliminar cuota financiera',
        emptyLabel: 'Ninguna cuota financiera agregada.',
        sumBadgeLabel: 'Suma de las cuotas financieras',
      },
      apportionmentRow: {
        addButton: 'Agregar categoría',
        removeButton: 'Eliminar categoría',
        emptyLabel: 'Ninguna categoría agregada al prorrateo.',
        sumBadgeLabel: 'Suma del prorrateo',
      },
      validation: {
        employeeRequired: 'Seleccione el empleado',
        eventRequired: 'Seleccione el evento',
        dateRequired: 'La fecha es obligatoria',
        amountRequired: 'Ingrese un valor válido',
        installmentsRequired: 'Agregue al menos una cuota',
        installmentsSum: 'La suma de las cuotas debe ser igual al valor total del adelanto',
        installmentMonthRequired: 'Ingrese el mes de la cuota',
        installmentValueRequired: 'Ingrese un valor válido para la cuota',
        financialInstallmentsSum:
          'La suma de las cuotas financieras debe ser igual al valor total del adelanto',
        apportionmentSum:
          'La suma del prorrateo por categoría debe ser igual al valor total del adelanto',
        typeRequired: 'Seleccione el tipo de título',
        fiscalDocumentRequired: 'Indique si es nota fiscal',
        financialCategoryRequired: 'Seleccione la categoría financiera',
        costCenterRequired: 'Seleccione el centro de costo',
        dueDateRequired: 'Ingrese el vencimiento de la cuota financiera',
        financialValueRequired: 'Ingrese un valor válido para la cuota financiera',
        inputDateRequired: 'Ingrese la fecha de la entrada',
        inputValueRequired: 'Ingrese un valor válido para la entrada',
      },
    },
  },
};
