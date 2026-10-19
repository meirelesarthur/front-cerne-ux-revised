// src/@types/language/module-advanced-reproductive/index.ts
// Interface de tradução do módulo "Gerenciamento Avançado"
// (AdvancedReproductive — Operacional / Reprodução, F-011, 97-Esteiras/056,
// TASK-AR-FE-01). Mirror da convenção de `module-breeding-seasons`/
// `module-bull-seed-season`/`module-breeding-batch` (instância simples: um
// único arquivo, sem decomposição por tela) — REDUZIDO ao bloco `list`
// (tela 100% LEITURA, sem `detail`/`form`, contrato de tela §6.5). O
// conteúdo mora em
// src/constants/languages/{idioma}/languageAdvancedReproductive.ts.

export interface ModuleAdvancedReproductive {
  advancedReproductive: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      /** 3 `StatCard` (roteiro §"Indicadores") — animals_count/
       *  pregnancy_rate/birth_animals_count, populados do MESMO payload da
       *  listagem (`meta.indicators`, sem segunda chamada). */
      indicators: {
        animalsCount: string;
        pregnancyRate: string;
        birthAnimalsCount: string;
      };
      /** 6 colunas, ORDEM EXATA do contrato (Animal → Categoria → Tipo
       *  Acasalamento → Última Atualização → Status → Ações). */
      table: {
        identification: string;
        category: string;
        breedingMatingType: string;
        lastUpdate: string;
        reproductiveStatus: string;
        actions: string;
      };
      /** 7 ações condicionais por linha (`actions.can_*`) — TODAS
       *  renderizam desabilitadas com tooltip nesta entrega (FUP-AR-05/06,
       *  roteiro §6.7). `disabledReason` é o texto único do tooltip,
       *  compartilhado pelas 7 (mesma mecânica `disabledReason` de
       *  `ContasAPagar`). */
      actions: {
        viewAnimalRecord: string;
        /** Toast de sucesso da entrada secundária AC-02 (Tarefa 48,
         *  ACT-FA225-02) — PDF de um único animal aberto em nova aba. */
        viewAnimalRecordSuccessToast: string;
        /** Toast de erro da mesma ação (fallback quando
         *  `extractApiErrorMessage` não extrai mensagem específica). */
        viewAnimalRecordErrorToast: string;
        viewBreedingMating: string;
        editBreedingMating: string;
        advanceProtocolStep: string;
        finishBreedingMating: string;
        viewPregnancyDiagnosis: string;
        deleteBreedingMating: string;
        disabledReason: string;
        /** `DeleteConfirmDialog` de "Excluir" (EST-03, correção lote 3) —
         *  mirror `languageGB.breedingMatings.breedingMating.list.deleteDialog`,
         *  reduzido a `title` (descrição/aviso usam o default do
         *  componente, mesmo padrão de `Acasalamento/index.tsx`). */
        deleteDialog: {
          title: string;
        };
      };
      /** 6 campos, ORDEM EXATA do contrato (Contrato B, `FilterModalProps<T>`). */
      filter: {
        title: string;
        search: string;
        reproductiveStatus: string;
        breedingBatch: string;
        breedingSeason: string;
        protocol: string;
        bullSeedSeason: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        /** CTA "Limpar filtros" — só quando `filtersApplied>0`; tela é
         *  100% leitura, SEM CTA de criação (roteiro §1). */
        clearFiltersCta: string;
      };
    };
    /** Fábrica `reproductive-status-options.ts` — enum `reproductive_status`
     *  (1=Prenha/2=Vazia/3=Parida, `Animal::statusOptions`, fiel ao legado).
     *  Mirror `languageGB.animals.animal.reproductiveStatusOptions`. */
    reproductiveStatusOptions: {
      pregnant: string;
      empty: string;
      calved: string;
    };
  };
}
