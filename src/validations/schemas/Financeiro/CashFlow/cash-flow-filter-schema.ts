// src/validations/schemas/Financeiro/CashFlow/cash-flow-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Fluxo Bancário" (F-107,
// esteira 070, TASK-CF-FE-01). PERMISSIVO — mirror `DIV-03` (F-107 frontend
// contract §3.4): `accounts[]`/`start_date`/`end_date` SEM `.required()`,
// diferente de `RelatorioConsolidado`/`PartidaDobrada`
// (`account-reconciliation-report-filter-schema.ts`, que EXIGE o par de
// datas via `hasValidRange`). O botão "Filtrar" fica sempre habilitado
// (TASK-CF-FE-02) — não copiar o `hasValidRange` desses 2 vizinhos.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { GUID_REGEX } from '@/utils/guid';

import type { LanguageDate } from '@/@types/language';

export const cashFlowFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.financial.cashFlow;

  return yup.object({
    // `accounts` é `Option<string>[]` no form (SelectAsyncPaginate isMulti guarda
    // objetos `{ value, label }`, e `toRequestFilter` extrai `option.value`).
    // Validar o `value` do Option como uuid — NÃO o elemento inteiro como string.
    // Bug corrigido (lote 070, 2026-09-02): o schema declarava
    // `.of(yup.string().uuid())`, que rejeitava os objetos Option ao selecionar
    // contas → `handleSubmit` não chamava `handleFiltrar` e o "Filtrar" virava
    // no-op silencioso. Só quebrava COM contas selecionadas (array vazio passava).
    accounts: yup
      .array()
      .of(
        yup.object({
          value: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).required(),
          label: yup.string(),
        })
      )
      .default([]),
    period: yup
      .mixed<'diary' | 'monthly' | 'yearly'>()
      .oneOf(['diary', 'monthly', 'yearly'])
      .default('diary'),
    type: yup
      .mixed<'synthetic' | 'analytical'>()
      .oneOf(['synthetic', 'analytical'])
      .default('synthetic'),
    // OPCIONAL — DIV-03: ausência de datas é consulta válida (resultado vazio,
    // nunca 422). Não copiar `.required()` dos vizinhos de relatório export.
    start_date: yup.string().trim().nullable(),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .test('end-after-start', messages.filter.endAfterStartError, (value, ctx) => {
        const start = (ctx.parent as { start_date?: string | null }).start_date;
        if (!value || !start) return true;
        return value >= start;
      }),
  });
};

export const cashFlowFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cashFlowFilterSchema(languageGB)) as any;

export default cashFlowFilterSchemaResolver;
