// src/constants/languages/languagePtBr/languageAnimalFamilyTreeReport.ts
// Tradução PT-BR do módulo "Registro Genealógico" (relatório de Pecuária —
// esteira 055, F-222, TASK-055-F222-FE-01). Chaves conforme
// `roteiro-front-F222-registro-genealogico.md` §2. Tela "gerar e sair": UM
// único select de Animal, OBRIGATÓRIO (fiel ao legado + validação client
// endurecida, contrato §2).

import { ModuleAnimalFamilyTreeReport } from '@/@types/language/module-animal-family-tree-report';

export const languageAnimalFamilyTreeReport: ModuleAnimalFamilyTreeReport = {
  report: {
    pageTitle: 'Registro Genealógico',
    pageSubtitle: 'Relatório em PDF da árvore genealógica (pedigree) do animal selecionado.',
    filters: {
      animal: 'Animal',
    },
    animalPlaceholder: 'Selecione um animal',
    submitButton: 'Gerar Relatório',
    validation: {
      animalRequired: 'Selecione um animal para gerar o relatório.',
    },
    hint: {
      animalRequired: 'Campo obrigatório.',
    },
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
  },
};
