// src/constants/languages/languagePtBr/languageEquipmentInventoryReport.ts
// Tradução PT-BR do módulo "Inventário Patrimonial" (relatório de Bens/
// Equipamentos — F-260, esteira 97-Esteiras/075, TASK-INV-FE-01). Mirror
// estrutural do bloco `report` de `languageCostingAnimalReport.ts`. Literais
// PT fiéis ao legado (contrato de tela `## 3`), sem melhoria de redação.

import { ModuleEquipmentInventoryReport } from '@/@types/language/module-equipment-inventory-report';

export const languageEquipmentInventoryReport: ModuleEquipmentInventoryReport = {
  report: {
    pageTitle: 'Inventário Patrimonial',
    pageSubtitle: 'Relatório de bens/equipamentos por família, proprietário gestor e status.',
    fields: {
      family: 'Família',
      proprietary: 'Proprietário Gestor',
      status: 'Status',
      type: 'Tipo de Relatório',
    },
    statusOptions: {
      active: 'Ativo',
      inactive: 'Inativo',
    },
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Baixar Relatório',
    downloadError: 'Não foi possível gerar o relatório.',
    statusRequiredHint: 'Selecione o Status para gerar o relatório.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      statusRequired: 'O Status é obrigatório.',
    },
  },
};
