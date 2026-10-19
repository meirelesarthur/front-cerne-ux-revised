// src/constants/languages/languagePtBr/languageAnimalRecordReport.ts
// Tradução PT-BR do módulo "Ficha Animal" (relatório de Pecuária — F-225,
// 97-Esteiras/012, Tarefa 47). Chaves conforme
// `frontend-contract-ficha-animal.md` §4/§7. Tela "gerar e sair": os 3
// selects (Categoria/Lote/Animal) são opcionais, placeholder "Todas" mirror
// do legado (default "Todas" do `select2` de Categoria, `LK-01`).

import { ModuleAnimalRecordReport } from '@/@types/language/module-animal-record-report';

export const languageAnimalRecordReport: ModuleAnimalRecordReport = {
  report: {
    pageTitle: 'Ficha Animal',
    pageSubtitle: 'Relatório de ficha individual dos animais da fazenda ativa.',
    filters: {
      category: 'Categoria',
      batch: 'Lote',
      animal: 'Animal',
    },
    filterAllPlaceholder: 'Todas',
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
  },
};
