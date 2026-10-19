// src/@types/language/module-depreciation-forecast/index.ts
// Interface de tradução do módulo de PREVISÃO DE DEPRECIAÇÃO
// (DepreciationForecast — Cadastros Base / Bens-Ativos). Tela ÚNICA read-only/
// simulação — sem `list`/`filter` (não há grid/CRUD, TASK-FE-230/231).
//
// `form` cobre o painel de filtros (2 Selects, sem submit); `result` cobre o
// painel de resultado (todos os estados de UI: vazio inicial, vazio de
// negócio 422, erro, sucesso). O conteúdo mora em src/constants/languages/
// {idioma}/languageDepreciationForecast.ts.
// -----------------------------------------------------------------------------

export interface ModuleDepreciationForecast {
  form: {
    /** Título da tela (FormContainer) — fidelidade ao legado ("Previsão de Depreciação"). */
    title: string;
    fields: {
      /** Select "Bem imobilizado" — fidelidade a `trad.iv_bem_imob` do legado. */
      equipment: string;
      /** Select "Tempo de Previsão" — sem chave de idioma no legado, literal. */
      forecastTime: string;
    };
    placeholders: {
      /** Placeholder comum aos 2 Selects — fidelidade a `trad.var_selec`. */
      select: string;
    };
    /**
     * 16 labels estáticos "3 meses".."48 meses" (múltiplos de 3), mirror
     * `DepreciationForecastController::forecastOptions()` do legado. Índice 0
     * = value 1 = "3 meses" … índice 15 = value 16 = "48 meses" (TASK-FE-231
     * monta as `Option<number>` do Select a partir deste array).
     */
    forecastOptions: string[];
  };
  result: {
    table: {
      /** Coluna "Mês/Ano" — literal do legado, sem chave de idioma original. */
      month: string;
      /** Coluna "Vl.p/depreciar" — fidelidade a `trad.dp_vl_deprec`. */
      valueToDepreciate: string;
      /** Coluna "Vl. Dep. Mês" — fidelidade a `trad.dp_deprec_mes`. */
      monthlyDepreciation: string;
      /** Coluna "Sd. á Depreciar" — fidelidade a `trad.dp_sd_deprec`. */
      remainingBalance: string;
      /** 12 abreviações de mês (índice 0 = Jan) usadas para formatar `MMM/AAAA` na célula "Mês/Ano" — sem depender de locale de `Intl`/`date-fns` (nenhum consumidor prévio no projeto). */
      monthAbbreviations: string[];
    };
    empty: {
      /** Estado neutro — nenhum Select preenchido ainda. */
      selectPrompt: string;
      /** Mensagem EXATA do 422 de regra de negócio ("sem depreciação processada") — card informativo, NUNCA toast de erro. */
      noDepreciation: string;
    };
    error: {
      /** Card de erro 404/500/rede — título. */
      title: string;
      /** Card de erro 404/500/rede — descrição genérica. */
      description: string;
      /** Botão "Tentar novamente" (re-executa a query). */
      retry: string;
    };
  };
}
