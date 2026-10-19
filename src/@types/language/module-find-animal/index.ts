// src/@types/language/module-find-animal/index.ts
// Interface de tradução do módulo "Localizar Animal" (FindAnimal — Operacional
// > Pecuária > Manejo, F-042, TASK-FA-FE-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageFindAnimal.ts. Molde estrutural
// DIRETO de `module-transfer-abc-batch/index.ts` (mesmo namespace TOP-LEVEL
// `livestock`, mesma forma de arquivo — um `.ts` por idioma + este contrato
// de tipo).
//
// Esta tela NÃO é um CRUD (contrato de tela §2.1, ADR-FE-01): não há
// `list`/`form.title.create` no sentido de grid — é um localizador (1 campo
// de busca + 1 dossiê condicional em 4 blocos) + 1 ação de transferência de
// lote. Por isso a superfície de chaves é a do contrato §7, não o molde
// completo de CRUD do irmão `transferAbcBatch`.
//
export interface ModuleFindAnimal {
  findAnimal: {
    singularLabel: string;
    pluralLabel: string;
    pageTitle: string;
    filter: {
      animalLabel: string;
      animalPlaceholder: string;
      submit: string;
    };
    panels: {
      animal: string;
      reproductive: string;
      batch: string;
      grazing: string;
      area: string;
      mother: string;
    };
    fields: {
      identification: string;
      category: string;
      age: string;
      weight: string;
      father: string;
      categoryMatrix: string;
      reproductiveStatus: string;
      lastSemen: string;
      currentBatches: string;
      code: string;
      quantityAnimal: string;
      employeeName: string;
      description: string;
      fodder: string;
      totalArea: string;
      recreationArea: string;
      productiveArea: string;
      unproductiveArea: string;
    };
    emptyState: {
      noAnimalSelected: string;
      noBatchLinked: string;
    };
    placeholders: {
      notInformed: string;
      dash: string;
    };
    transfer: {
      label: string;
      placeholder: string;
      submit: string;
      successToast: string;
      validation: {
        batchRequired: string;
      };
    };
    error: {
      message: string;
      notFound: string;
      retry: string;
    };
  };
}
