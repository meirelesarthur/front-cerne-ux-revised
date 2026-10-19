// src/constants/languages/languageEsEs/languageAccountsPayableReceivableReport.ts
// Traducción ES-ES del módulo "Consolidado (Pagar/Cobrar)" — F-214, esteira
// 97-Esteiras/052. Mirror de
// `languagePtBr/languageAccountsPayableReceivableReport.ts`.

import { ModuleAccountsPayableReceivableReport } from '@/@types/language/module-accounts-payable-receivable-report';

export const languageAccountsPayableReceivableReport: ModuleAccountsPayableReceivableReport = {
  report: {
    pageTitle: 'Consolidado (Pagar/Cobrar)',
    pageSubtitle: 'Informe consolidado de cuentas por pagar y por cobrar, con estado de pago.',
    fields: {
      startEmissionDate: 'Fecha Emisión Inicio',
      endEmissionDate: 'Fecha Emisión Fin',
      startWriteOffDate: 'Fecha Pago Inicio',
      endWriteOffDate: 'Fecha Pago Fin',
      provider: 'Proveedor',
      client: 'Cliente',
      center: 'Centro de Costo',
      account: 'Cuenta',
      category: 'Categoría Financiera',
      status: 'Estado',
      format: 'Formato',
    },
    providerPlaceholder: 'Todos los proveedores',
    clientPlaceholder: 'Todos los clientes',
    centerPlaceholder: 'Todos los centros de costo',
    accountPlaceholder: 'Todas las cuentas',
    categoryPlaceholder: 'Todas las categorías',
    statusOptions: {
      open: 'Abierto',
      partial: 'Parcial',
      settled: 'Liquidado',
      advance: 'Anticipo',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'Ningún elemento encontrado.',
    generateButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      emissionRequired: 'La fecha de emisión es obligatoria.',
      invalidEmissionDateRange:
        'La fecha de emisión fin debe ser igual o posterior a la fecha inicio.',
      invalidWriteOffDateRange:
        'La fecha de pago fin debe ser igual o posterior a la fecha inicio.',
      formatRequired: 'El formato es obligatorio.',
    },
  },
};
