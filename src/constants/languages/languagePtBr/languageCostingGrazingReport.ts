// src/constants/languages/languagePtBr/languageCostingGrazingReport.ts
// Tradução PT-BR do módulo "Custeio/Módulo" (relatório de Pecuária — F-250,
// esteira 97-Esteiras/080, TASK-CM-FE-01). Mirror estrutural do bloco
// `report` de `languageCostingAnimalReport.ts`/`languageCostingBatchReport.ts`.
// `validation.formInvalid` é NOVO (D3, contrato de tela §7/§8) — mensagem do
// toaster `onInvalid`, sem equivalente nos 2 mirrors.

import { ModuleCostingGrazingReport } from '@/@types/language/module-costing-grazing-report';

export const languageCostingGrazingReport: ModuleCostingGrazingReport = {
  report: {
    pageTitle: 'Custeio/Módulo',
    pageSubtitle: 'Relatório de custeio de um módulo de pastejo por período.',
    fields: {
      grazings: 'Módulo',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
    },
    grazingsPlaceholder: 'Selecione o(s) módulo(s) (opcional)',
    periodRequiredHint: 'Informe o período (Data Inicial e Data Final) para gerar o relatório.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Inicial e Data Final) é obrigatório.',
      formInvalid: 'Corrija os campos destacados antes de continuar.',
    },
  },
};
