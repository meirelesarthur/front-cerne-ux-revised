// src/@types/language/module-harvests/index.ts
// Interface de tradução do módulo de SAFRAS (Harvest — Cadastros Base).
// Espelha a convenção do módulo de Centros de Custo (module-cost-centers). O
// conteúdo mora em src/constants/languages/{idioma}/languageHarvests.ts.
//
// TASK-FE-007 (grid) cobre list + filter. TASK-FE-008 (formulário de
// cadastro/edição — campos centrais) adiciona a seção `form`. TASK-FE-009
// acrescenta `form.weeks` (seção de Semanas — geração + paleta de cores) e as
// 3 mensagens de validação por semana, sem alterar o que já existia aqui.
// TASK-FE-010 acrescenta a seção `detail` (tela de Detalhe read-only) —
// reaproveita deliberadamente vários rótulos já existentes em `form.fields`/
// `form.weeks`/`list.table` (ver SafraDetalhe.tsx) em vez de duplicá-los;
// `detail` guarda só o que é genuinamente novo dessa tela.

export interface ModuleHarvests {
  harvest: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        startDate: string;
        endDate: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
        weeks: string;
        /** Abreviação exibida junto à contagem — ex.: "52 sem." (PT/ES) / "52 wks" (EN). */
        weeksSuffix: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /**
     * Formulário de criação/edição — campos centrais (TASK-FE-008). A seção
     * de Semanas (TASK-FE-009) acrescenta chaves aqui, não substitui.
     */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      steps: { general: string; weeks: string };
      stepTitles: { general: string; weeks: string };
      weeksSubtitle: string;
      stepCounter: { label: string; of: string };
      fields: {
        description: string;
        startDate: string;
        endDate: string;
        isEnabled: string;
        herdControl: string;
        autoEvolution: string;
        firstMonth: string;
        secondMonth: string;
      };
      placeholders: {
        description: string;
      };
      /** Rótulos batendo com `HarvestHerdControl::label()` do backend (2 valores reais). */
      herdControlOptions: {
        individual: string;
        lote: string;
      };
      /** Nomes de mês por extenso — índice 0 = Janeiro .. índice 11 = Dezembro. */
      monthOptions: string[];
      /**
       * Seção "Semanas" (TASK-FE-009) — geração algorítmica + grade de
       * pintura (`WeeksCanvas`). Os RÓTULOS das 9 cores da paleta fechada
       * (`safra-weeks.ts::WEEK_COLOR_PALETTE`) moram aqui (conteúdo i18n),
       * não no módulo de algoritmo (que só guarda hex/borda/abreviação —
       * identidade de dado, não texto de idioma).
       */
      weeks: {
        sectionTitle: string;
        sectionHint: string;
        /** Sufixo após a contagem — ex.: "12 semanas" (PT/ES) / "12 weeks" (EN). */
        weeksCountSuffix: string;
        emptyTitle: string;
        emptyCta: string;
        toolbarLabel: string;
        resetCycleButton: string;
        resetCycleDialogTitle: string;
        resetCycleDialogDescription: string;
        resetCycleDialogConfirm: string;
        overviewLabel: string;
        distributionLabel: string;
        /** Sufixo por cor na distribuição — ex.: "Amarelo: 5 sem.". */
        distributionUnitSuffix: string;
        gridAriaLabelEditable: string;
        gridAriaLabelReadOnly: string;
        /** Fragmentos combinados em código para montar o `aria-label` de cada tile (sem mecanismo de template no projeto — ver `WeeksCanvas.tsx`). */
        tileAriaLabel: {
          prefix: string;
          rangeSeparator: string;
          colorPrefix: string;
          currentSuffix: string;
          paintHint: string;
        };
        /** Rótulos das 9 cores da paleta fechada — chave camelCase da `WeekColorKey` (ex.: `azul-claro` → `azulClaro`). */
        colorLabels: {
          amarelo: string;
          azulClaro: string;
          azulEscuro: string;
          azulMarinho: string;
          branco: string;
          marrom: string;
          palha: string;
          preto: string;
          rosa: string;
        };
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        startDateRequired: string;
        endDateRequired: string;
        dateInvalid: string;
        endDateBeforeStart: string;
        herdControlRequired: string;
        monthRange: string;
        /** Array `weeks` vazio (datas ainda não válidas) — rede de segurança, não esperado no uso normal. */
        weeksRequired: string;
        /** `weeks[i].end_date < weeks[i].start_date` — não alcançável via UI (geração algorítmica), só defesa em profundidade. */
        weekDateRange: string;
        /** `weeks[i].color` fora da paleta fechada de 9 — não alcançável via UI (seletor de swatches fechado), só defesa em profundidade. */
        weekColorInvalid: string;
      };
    };
    /**
     * Tela de Detalhe (TASK-FE-010) — read-only. `startDate`/`endDate`/
     * `firstMonth`/`secondMonth`/`herdControl`/`autoEvolution` (rótulos de
     * campo) e `activeLabel`/`inactiveLabel` (badge de status) são lidos de
     * `form.fields`/`list.table` — não duplicados aqui.
     */
    detail: {
      /** Dica exibida no `WeeksCanvas` em modo leitura — substitui o hint padrão do form (que fala em "clique ou arraste", inaplicável aqui). */
      weeksReadOnlyHint: string;
      subtitle: {
        /** Prefixo do rótulo de controle de rebanho no subtítulo do cabeçalho (ex.: "Rebanho: Individual"). */
        herdControlPrefix: string;
        /** Prefixo do rótulo de evolução automática no subtítulo do cabeçalho (ex.: "Evolução: Habilitada"). */
        autoEvolutionPrefix: string;
      };
      stats: {
        weeksLabel: string;
        herdControlLabel: string;
        autoEvolutionLabel: string;
        autoEvolutionEnabled: string;
        autoEvolutionDisabled: string;
        durationLabel: string;
        /** Unidade da duração aproximada — ex.: "~8 meses". */
        durationUnit: string;
        currentWeekLabel: string;
        /** 404 esperado de `weeks/current` — texto neutro, nunca toast de erro. */
        currentWeekEmpty: string;
      };
      generalData: {
        title: string;
      };
      actions: {
        edit: string;
      };
      /** uuid válido mas safra não encontrada (outro tenant/excluída) — card de erro com ação de recuperação. */
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
