// src/@types/language/module-depreciations/index.ts
// Interface de tradução do módulo de DEPRECIAÇÃO (Depreciation — Cadastros
// Base / Bens-Ativos, execução 027). Arquivo ÚNICO — mirror
// `ModuleDepreciationForecast` (1 tela real, 2 abas Equipamento/Animal
// dentro da MESMA rota, `[DECISÃO DE DESENHO]` §2 do contrato de tela).
//
// `list.equipment` cobre a aba Equipamento (grid read-only completa);
// `list.animal` reaproveita as colunas de valor/competência de
// `list.equipment.table` (mirror §7.2 do contrato — só acrescenta a coluna
// "Animal"). `filter.months.*` alimenta a fábrica
// `depreciationMonthOptions` (§8.3) — as mesmas 12 chaves são usadas pelo
// `Select` do filtro e pelo modal "Gerar" (§9). O conteúdo mora em
// src/constants/languages/{idioma}/languageDepreciations.ts.
// -----------------------------------------------------------------------------

export interface ModuleDepreciations {
  depreciation: {
    singularLabel: string;
    pluralLabel: string;
  };
  list: {
    equipment: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        period: string;
        equipment: string;
        valueToDepreciate: string;
        monthlyDepreciation: string;
        remainingBalance: string;
        processedDate: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    animal: {
      /** Título da rota STANDALONE `/cadastros-base/depreciacao-animal`
       *  (execução 055 — navegação fiel ao legado, item de menu próprio).
       *  Não é usado na aba dentro de `/cadastros-base/depreciacao-mensal`
       *  (mode="both" mantém `equipment.pageTitle` fixo no header). */
      pageTitle: string;
      pageSubtitle: string;
      /** Fidelidade F-030 (execução 055): 8 colunas dedicadas, NA ORDEM e
       *  com os RÓTULOS do Blade legado — NÃO reaproveita
       *  `list.equipment.table` (texto diverge). */
      table: {
        animal: string;
        entryDate: string;
        valueToDepreciate: string;
        processedDate: string;
        month: string;
        year: string;
        monthlyDepreciation: string;
        remainingBalance: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
  };
  tabs: {
    equipment: string;
    animal: string;
  };
  filter: {
    title: string;
    equipment: string;
    equipmentAll: string;
    year: string;
    yearPlaceholder: string;
    month: string;
    monthAll: string;
    /** 12 chaves consumidas pela fábrica `depreciationMonthOptions`
     *  (§8.3 do contrato de tela) — reaproveitadas também pelo modal
     *  "Gerar" (§9). */
    months: {
      january: string;
      february: string;
      march: string;
      april: string;
      may: string;
      june: string;
      july: string;
      august: string;
      september: string;
      october: string;
      november: string;
      december: string;
    };
  };
  generateModal: {
    title: string;
    fields: {
      year: string;
      month: string;
      type: string;
    };
    typeOptions: {
      equipment: string;
      animal: string;
      all: string;
    };
    submit: string;
    successToast: string;
    noEligibleToast: string;
  };
}
