// src/@types/language/module-animal-family-tree-report/index.ts
// Interface de tradução do módulo "Registro Genealógico" (relatório de
// Pecuária — esteira 055, F-222, TASK-055-F222-FE-01). Mirror estrutural de
// `module-animal-record-report`; tela "gerar e sair" sem prévia on-screen
// (a árvore pedigree é 100% renderizada dentro do PDF pelo backend): só
// filtro + botão + toasts, sem `preview`/`columns`/`rows`/`kpis`.
//
// Diferença do irmão `ModuleAnimalRecordReport`: aqui o filtro `animal` é
// OBRIGATÓRIO, por isso o módulo carrega chaves de validação (`validation`)
// e de dica (`hint`) que aquele não tem.

export interface ModuleAnimalFamilyTreeReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      animal: string;
    };
    animalPlaceholder: string;
    submitButton: string;
    validation: {
      animalRequired: string;
    };
    hint: {
      animalRequired: string;
    };
    successToast: string;
    errorToast: string;
  };
}
