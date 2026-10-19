// src/@types/language/module-batches/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo LOTES ANIMAIS (Batch — Cadastros Base /
// Pecuária). Mirror `module-death-losses` (list/form/deleteConfirm) + extras
// próprios do Lote: `statusOptions` (badge da grid, enum `BatchStatus`
// A/P/I/R — consumido por `TASK-FE-1075`), `archiveConfirm` (ação Arquivar,
// M5) e `importExport` (D1 — download de modelo XLSX + import síncrono de 1
// Lote por arquivo, contrato v1.1 §8). Fundação da regeneração das telas
// (TASK-FE-1080/1081), NÃO a tela em si.
//
// Sem campo de Status no FORM (não é input do cliente — `status` nasce
// sempre `'A'`, só muda via Arquirar, contrato v1.1 §3 POST) e sem campo de
// Curral (`corral_uuid` fora da tela por ora, `FeedlotCorral` não migrado,
// contrato v1.1 §5.1) — por isso não há `form.fields.status`/`corral`.
//
// O conteúdo mora em src/constants/languages/{idioma}/languageBatch.ts.
// -----------------------------------------------------------------------------

export interface ModuleBatches {
  batch: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        date: string;
        specie: string;
        categories: string;
        status: string;
        totalAnimals: string;
      };
      actions: {
        edit: string;
        delete: string;
        archive: string;
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        titleEmptyNoCreate: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        descriptionEmptyNoCreate: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
    /** Rótulos do enum `BatchStatus` (A/P/I/R) — badge da grid + textos de confirmação da ação Arquivar. Consumido por `TASK-FE-1075`. */
    statusOptions: {
      active: string;
      pending: string;
      inactive: string;
      archived: string;
    };
    /** Confirmação da ação "Arquivar" (`POST /animal-batches/{uuid}/archive`, M5) — distinta de excluir (não é delete). */
    archiveConfirm: {
      title: string;
      description: string;
      warning: string;
      successToast: string;
    };
    /** Drawer de filtro — hoje só filtra por `description` na tela web (contrato v1.1 §3 lista os filtros por uuid do controller JSON unificado, mas a tela web só expõe descrição). */
    filter: {
      title: string;
      description: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        description: string;
        date: string;
        specie: string;
        /** TASK-FE-1090 — campo "Peso" (`parameter_weight_uuid`), OPCIONAL, fiel ao legado (`_forms.blade.php:20`). */
        parameterWeight: string;
        categories: string;
        /** Bloco de vínculo de Animais (`animal_uuids`, D4) — multi-select + contador ao vivo. */
        animals: string;
        /** Contador ao vivo, ex.: "{count} animal(is) selecionado(s)" — `{count}` é placeholder de interpolação. */
        animalsCounter: string;
      };
      placeholders: {
        description: string;
        specie: string;
        /** TASK-FE-1090 — placeholder do Select de Peso (`SelectAsyncPaginate` sobre `listParameterWeights`). */
        parameterWeight: string;
        categories: string;
        animals: string;
      };
      /** Mensagens de validação Yup — `description`/`date`/`specie_uuid`/`category_uuids` `required` (contrato v1.1 §3); `animal_uuids` é `nullable` (um Lote pode nascer sem animal), sem chave `required` aqui. */
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        dateRequired: string;
        specieRequired: string;
        categoriesRequired: string;
        categoriesMin: string;
      };
      /**
       * TASK-FE-1089 — avisos NÃO-BLOQUEANTES (toast) disparados ANTES de
       * limpar seleção em cascata — mesmo padrão do Executor de
       * `ParameterAnimals` (`warnings.categoryClearedBySpecieChange`):
       * nunca silencioso como o legado.
       */
      warnings: {
        /** Trocar a Espécie com Categorias (e possivelmente Animais) já selecionadas — ambas são limpas juntas (as Categorias deixam de valer para a nova Espécie, os cards de Animais somem com elas). */
        categoriesClearedBySpecieChange: string;
        /** Remover uma Categoria cujo card tinha Animais marcados — o card some e a seleção dele é descartada. */
        animalsClearedByCategoryRemoval: string;
        /** TASK-FE-1090 — trocar o Peso pode tirar animais já selecionados do universo filtrado (o Peso entra em TODAS as chamadas de candidatos, inclusive os já vinculados ao lote em edição) — mesmo tratamento de `categoriesClearedBySpecieChange`/`animalsClearedByCategoryRemoval`, nunca silencioso. */
        animalsClearedByWeightChange: string;
      };
      /**
       * TASK-FE-1089 — 1 card de Animais por Categoria selecionada
       * (`CheckboxListField`, achado 2 do E2E). `totalAnimalsLabel` é o
       * PREFIXO do contador do card — o número exibido é a SOMA de
       * `quantity` dos candidatos selecionados NESTE card (não a contagem
       * de linhas — `selectedCountOverride`), nunca o `selectedValues.length`
       * padrão do componente.
       */
      candidateAnimals: {
        selectAllLabel: string;
        deselectAllLabel: string;
        totalAnimalsLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
        searchPlaceholder: string;
      };
      /**
       * TASK-FE-1089 — rodapé com os 5 índices agregados (achado 3 do E2E),
       * recalculados CLIENT-SIDE a cada mudança de seleção a partir de
       * `BatchCandidateAnimal.quantity/weight/ua` (nunca `/450` — a
       * constante NÃO existe no front, o backend já expõe `ua` por animal
       * pronto para somar).
       */
      footer: {
        totalAnimals: string;
        totalWeight: string;
        averageWeight: string;
        totalUa: string;
        averageUa: string;
      };
    };
    /**
     * Import/Export XLSX (D1, contrato v1.1 §8) — "Baixar modelo" (nunca
     * "Exportar", pois é sempre modelo em branco) + "Importar planilha" (1
     * Lote por arquivo, síncrono). ESTENDIDO em TASK-FE-1082 (mirror
     * `module-animals.excel.import`, adaptado): a etapa `result` é SEMPRE
     * exibida após o import (nunca um toast genérico de sucesso) porque a
     * API responde 201/success:true MESMO quando nenhum animal foi
     * vinculado (identificações não resolvidas) — o campo `message` real da
     * resposta é a ÚNICA pista visível disso e é renderizado literalmente
     * dentro do Alert de resultado; `result.successTitle`/`partialTitle` só
     * rotulam a cor/ícone do Alert conforme `total_animals` do Lote criado,
     * nunca substituem a `message`.
     */
    importExport: {
      downloadTemplate: string;
      downloadTemplateError: string;
      importSpreadsheet: string;
      modalTitle: string;
      modalDescription: string;
      /** Instrução curta sobre o preenchimento das abas "cabecalho"/"animais" do modelo. */
      instructions: string;
      /** Aviso PRÉ-envio (etapa 'upload') — avisa que o Lote pode nascer vazio (D2, sem rollback entre abas). */
      warning: { title: string; description: string };
      fileUpload: {
        label: string;
        hint: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      /** Etapa pós-envio (SEMPRE exibida) — rótulos do Alert de resultado; a `message` da API é exibida à parte, verbatim. */
      result: {
        successTitle: string;
        partialTitle: string;
        codeLabel: string;
        totalAnimalsLabel: string;
      };
      successToast: string;
      errorToast: string;
      cancelButton: string;
      submitButton: string;
      closeButton: string;
    };
    /**
     * Relatório "Performance Animal Individual" (F-234, TASK-FE-PA-01,
     * `GET /batch-profitability-report`) — export PDF (inline) ou Excel
     * (download) sem grid on-screen, mirror `report` de
     * `ModuleBreedingMating['breedingMatings']['pregnancyDiagnosis']`
     * (Vacas Prenhas). Gate OU: `sale`/`(start_date`+`end_date)`.
     */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filters: {
        sale: string;
        batch: string;
        startDate: string;
        endDate: string;
      };
      fields: {
        reportType: string;
      };
      reportTypeOptions: {
        pdf: string;
        excel: string;
      };
      submitButton: string;
      successToast: string;
      errorToast: string;
      hint: {
        /** Exibido enquanto o gate OU (`sale` OU `start_date`+`end_date`) não está satisfeito. */
        saleOrPeriodRequired: string;
      };
    };
  };
}
