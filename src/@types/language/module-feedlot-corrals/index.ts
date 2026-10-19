// src/@types/language/module-feedlot-corrals/index.ts
// Interface de tradução do módulo OPERACIONAL — tela standalone de Currais
// (FeedlotCorral, F-035, lote 043, TASK-043-CUR-T01 — fundação). O conteúdo
// mora em `src/constants/languages/{idioma}/languageFeedlotCorrals.ts`.
// `singularLabel`/`pluralLabel` alimentam a `queryKey` CANÔNICA
// (`queryKey.feedlotCorrals.*`).
//
// Namespace ADITIVO e SEPARADO de `ModuleFeedlotMap` (`feedlotMap.feedlotMap.
// corral/.status/.batches`) — os componentes desta tela REUSAM as strings de
// `feedlotMap` onde já existem (rótulo de campo/validação dos 13 campos do
// CRUD cru + situação + lotes); este módulo só acrescenta o que É NOVO na
// tela standalone: listagem/filtro/wizard (cascas + setor) e os rótulos por
// VALOR dos 5 enums (`enums.*`, ausentes em `feedlotMap` — lá os selects
// consomem o `label` já traduzido pelo backend via `getFeedlotCorralOptions`).
export interface ModuleFeedlotCorrals {
  feedlotCorral: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        identification: string;
        name: string;
        feedlotSector: string;
        installationType: string;
        areaTotal: string;
        floor: string;
        shading: string;
        trough: string;
        drinkingFountain: string;
        status: string;
        capacity: string;
        animalsCount: string;
        createdAt: string;
      };
      actions: {
        view: string;
        edit: string;
        changeStatus: string;
        history: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Diálogo "Alterar Situação" a partir da lista (T08, SR-R09/F05,
       * IG-013). Aviso de remoção de lotes ANTES do submit quando o status
       * ATUAL é `OC` (ocupado) e o DESTINO é diferente — mirror do efeito
       * real de `UpdateFeedlotCorralStatusAction` (detach de
       * `feedlot_corral_batches` + limpeza de datas/dieta). `{count}` usa
       * `animals_count` (único sinal real disponível no `FeedlotCorralListItem`
       * — a listagem não expõe contagem de lotes, Regra 9/SEM MOCK: não se
       * inventa um número de lotes que a API não devolve aqui). */
      changeStatusDetachConfirm: { title: string; description: string };
    };
    filter: {
      title: string;
      name: string;
      namePlaceholder: string;
      feedlotSector: string;
      feedlotSectorPlaceholder: string;
      status: string;
      statusAll: string;
    };
    /** Tela de Detalhe (T07, `07-Tela-Visualizacao-Curral.md`, SR-R04) — 16
     * cards read-only (CLM-017, `contrato-currais-norm.md`), fiel ao
     * `show.blade.php` legado: SEM `available_at`/`note`/lotes. Mirror
     * estrutural `ModuleFeedlotSectors.feedlotSector.detail`. */
    detail: {
      generalData: { title: string };
      fields: {
        identification: string;
        name: string;
        feedlotSector: string;
        installationType: string;
        status: string;
        width: string;
        length: string;
        areaTotal: string;
        capacity: string;
        coverage: string;
        floor: string;
        shading: string;
        trough: string;
        drinkingFountain: string;
        createdAt: string;
        updatedAt: string;
      };
      actions: { edit: string };
      notFound: { title: string; description: string; back: string };
    };
    /** Tela de Histórico de situação (T09, `09-Tela-Historico-Curral.md`,
     * GAP-API-01) — grid read-only paginada (LM-012..017). O título da tela
     * reusa `list.actions.history` (já existente, botão da listagem); este
     * bloco só acrescenta o que É NOVO: cabeçalhos de coluna e os estados de
     * vazio/erro (skeleton usa o `Table isLoading`, sem texto próprio). */
    history: {
      table: {
        corral: string;
        beforeStatus: string;
        afterStatus: string;
        note: string;
        createdAt: string;
        user: string;
      };
      emptyState: { title: string; description: string };
      error: { message: string; retry: string };
    };
    /** Casca do wizard (T03) — `fields`/`placeholders`/`hints`/`validation` só
     * cobrem o que NÃO existe em `feedlotMap.feedlotMap.corral` (o setor da
     * Etapa 1); os 13 campos do CRUD cru reusam `feedlotMap` diretamente. */
    form: {
      title: { create: string; edit: string };
      fields: { feedlotSector: string };
      placeholders: { feedlotSector: string };
      hints: { identificationGenerated: string };
      validation: { feedlotSectorRequired: string };
    };
    wizard: {
      step1: string;
      step2: string;
      step3: string;
      stepErrors: string;
      /** Orquestração de submit (T06, DEC-043-CURRAIS-FORM §7) — feedback dos
       * passos que NÃO têm uma entidade nomeável própria para o toast padrão
       * de `useRequest` (situação/lotes reusam `feedlotMap.feedlotMap.status/
       * .batches.title` como `entityName`). Cobre só o que é NOVO: bloqueio
       * de permissão cruzada (PARADA-B, residual mesmo após PARADA-API-07) e
       * o toast de reconciliação quando um passo POSTERIOR falha depois do
       * curral já ter sido persistido (sem transação real entre os 3
       * contratos — GAP-API-05 só resolveu a atomicidade do CREATE). */
      submit: {
        situationPermissionDenied: string;
        partialSaveTitle: string;
        partialSaveBatchesDescription: string;
        partialSaveSituationDescription: string;
      };
      /** Etapa 3 (T05, FID-G3F §6/§8) — texto NOVO exclusivo do wizard; os
       * rótulos de campo/duplicidade/capacidade reusam
       * `feedlotMap.feedlotMap.batches.*` (addBatch/removeBatch/empty/
       * capacityWarning/fields.batch), sem duplicar. */
      lots: {
        heading: string;
        description: string;
        /** IG-010/011/PARADA-DEF-D — status ∈ {VS,FE,MA,LI} bloqueia a etapa inteira. */
        blockedHeading: string;
        blockedDescription: string;
        statusBlockedTooltip: string;
        /** IG-004 — recusa adicionar linha nova enquanto a última estiver vazia. */
        addBlockedTitle: string;
        addBlockedDescription: string;
        /** IG-005 — confirmação de remoção de linha. */
        removeConfirmTitle: string;
        removeConfirmDescription: string;
        /** CV-004 (GAP-FE-241-like — `/batches/options` não traz metadados de
         * animais; total real vem de `GET /batches/{uuid}`, `batch_view`). */
        summaryCount: string;
        summaryTotalAnimals: string;
        /** Sub-modal "Novo/Editar Lote" (AC-017/IG-023, PARADA-DEF-C upsert real). */
        batchModal: {
          titleCreate: string;
          titleEdit: string;
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
          updatedToast: string;
        };
      };
    };
    /** Rótulo por VALOR dos 5 enums do formulário — mirror `App\Enums\*`
     * (GB.Cerne.Api). Chaves iguais às de `src/constants/FeedlotCorrals/*`
     * (e `feedlotCorralStatus` de `FeedlotMap`, reusado sem duplicar valores). */
    enums: {
      installationType: { cover: string; uncovered: string };
      status: {
        available: string;
        reserved: string;
        occupied: string;
        maintenance: string;
        cleaning: string;
        sanitaryHold: string;
        closed: string;
      };
      coverage: {
        open: string;
        partiallyCovered: string;
        fullyCovered: string;
        metalShed: string;
        insulatedShed: string;
        thermoacousticRoof: string;
        fiberCementRoof: string;
        clayTileRoof: string;
        tensionedFabricRoof: string;
        shadeNet: string;
      };
      floor: {
        compactedDirt: string;
        concreteFloor: string;
        groovedConcrete: string;
        gravelFloor: string;
        stoneFloor: string;
        sandFloor: string;
        rubberFlooring: string;
        deepBedding: string;
        slattedFloor: string;
      };
      shading: { natural: string; artificial: string; none: string };
    };
  };
}
