// src/@types/language/module-grouper-batch/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo Agrupar/Lotes (GrouperBatch — Operacional /
// Pecuária / Transferências, execução 042, TASK-FE-042-301). Fundação da
// feature — a tela em si vem em TASK-FE-042-303/304/305.
//
// `list` mirror `ModuleBatches['batch']['list']` (SEM `status`/`date`, colunas
// desta grid são só código/descrição/total de animais — D-front-1);
// `group` mirror `ModuleStocks['stock']['consolidation']` (padrão "selecionar
// N → Agrupar → prévia → modal com rádio → POST", D-front-2..5); `newBatch`
// mirror `ModuleLoteFazenda['loteFazenda']['newBatch']` (mesmos campos do
// modal "Novo Lote" da feature Lote/Fazenda, service/schema trocados por
// `Batches/`, D-front-6).
//
// O conteúdo mora em src/constants/languages/{idioma}/languageGrouperBatch.ts.
// -----------------------------------------------------------------------------

export interface ModuleGrouperBatch {
  grouperBatch: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        description: string;
        totalAnimals: string;
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        cta: string;
      };
      filter: {
        title: string;
        search: string;
      };
    };
    /**
     * Ação "Agrupar" (SF-008..022) — botão do `HeaderTable`, aviso client-side
     * de seleção mínima (D-front-3), toast de erro da prévia (D-front-4) e o
     * modal `GroupBatchesModal` (D-front-5), TASK-FE-042-303/304.
     */
    group: {
      buttonLabel: string;
      selectAtLeastTwoAlert: string;
      alertTitle: string;
      modalTitle: string;
      modalPrimaryLabel: string;
      columns: {
        code: string;
        description: string;
        totalAnimals: string;
      };
      cancelButton: string;
      confirmButton: string;
      successToast: string;
      previewErrorTitle: string;
      previewErrorToast: string;
    };
    /**
     * Modal "Novo Lote" (SF-023..034) — reusa `createBatch`/`batchSchemaResolver`
     * de `Batches/` (D-front-6), TASK-FE-042-305.
     */
    newBatch: {
      title: string;
      fields: {
        date: string;
        parameterWeight: string;
        specie: string;
        categories: string;
        description: string;
      };
      cancelButton: string;
      submitButton: string;
      createdToast: string;
    };
  };
}
