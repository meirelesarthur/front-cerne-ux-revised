// src/@types/language/module-equipment-inventory-report/index.ts
// Interface de tradução do módulo "Inventário Patrimonial" (relatório de
// Bens/Equipamentos — F-260, esteira 97-Esteiras/075, TASK-INV-FE-01).
// Módulo TOP-LEVEL próprio (mirror `module-costing-animal-report`), tela de
// filtro + 1 download (PDF OU Excel, decidido pelo backend via `type` — NÃO
// 2 botões distintos, diferente de `stockMovementReport`), SEM grid/prévia.
//
// `status` é o ÚNICO campo obrigatório (mirror do contrato de API, `DA-INV-03`)
// — `family`/`proprietary`/`type` são opcionais, por isso `statusRequiredHint`
// + `validation.statusRequired` (mirror `warehouseRequiredHint`/
// `validation.warehouseRequired` de `stockMovementReport`).

export interface ModuleEquipmentInventoryReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      family: string;
      proprietary: string;
      status: string;
      type: string;
    };
    statusOptions: {
      active: string;
      inactive: string;
    };
    typeOptions: {
      pdf: string;
      excel: string;
    };
    downloadButton: string;
    downloadError: string;
    statusRequiredHint: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      statusRequired: string;
    };
  };
}
