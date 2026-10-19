// src/constants/languages/languageEsEs/languageEquipmentInventoryReport.ts
// Traducción ES del módulo "Inventario Patrimonial" (informe de Bienes/
// Equipos — F-260, esteira 97-Esteiras/075, TASK-INV-FE-01). Mirror de
// `languagePtBr/languageEquipmentInventoryReport.ts`.

import { ModuleEquipmentInventoryReport } from '@/@types/language/module-equipment-inventory-report';

export const languageEquipmentInventoryReport: ModuleEquipmentInventoryReport = {
  report: {
    pageTitle: 'Inventario Patrimonial',
    pageSubtitle: 'Informe de bienes/equipos por familia, propietario gestor y estado.',
    fields: {
      family: 'Familia',
      proprietary: 'Propietario Gestor',
      status: 'Estado',
      type: 'Tipo de Informe',
    },
    statusOptions: {
      active: 'Activo',
      inactive: 'Inactivo',
    },
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadError: 'No fue posible generar el informe.',
    statusRequiredHint: 'Seleccione el Estado para generar el informe.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      statusRequired: 'El Estado es obligatorio.',
    },
  },
};
