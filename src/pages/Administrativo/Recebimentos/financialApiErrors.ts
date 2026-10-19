// src/pages/Administrativo/Recebimentos/financialApiErrors.ts
// -----------------------------------------------------------------------------
// Mapeia o 422 "flat" da API de Gerar Financeiro (EXEC-API-05 §4: `errors.number`,
// `errors.provider_uuid`, `errors.categories.N.center_uuid`, `errors.date_installments.N`...)
// para os nomes dos campos do formulário, para exibir a mensagem junto de cada campo.
// Chaves sem campo correspondente (ex.: `errors.date_installments` sem índice) ficam
// fora: a mensagem geral já aparece no toast da mutação.
// -----------------------------------------------------------------------------

export interface FormFieldError {
  name: string;
  message: string;
}

const SIMPLE_FIELDS: Record<string, string> = {
  number: 'financial_number',
  type_uuid: 'financial_type_id',
  proprietary_uuid: 'financial_proprietary_id',
  provider_uuid: 'financial_provider_id',
  note: 'financial_note',
  vl_total: 'vl_total',
};

const RATIO_FIELDS = ['category_uuid', 'center_uuid', 'plan_account_uuid', 'value'];

function firstMessage(value: string[] | string | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function mapFinancialApiErrors(
  errors: Record<string, string[] | string> | null | undefined
): FormFieldError[] {
  if (!errors) return [];
  const result: FormFieldError[] = [];

  Object.entries(errors).forEach(([key, raw]) => {
    const message = firstMessage(raw);
    if (!message) return;

    if (SIMPLE_FIELDS[key]) {
      result.push({ name: SIMPLE_FIELDS[key], message });
      return;
    }

    const category = key.match(/^categories\.(\d+)\.(\w+)$/);
    if (category && RATIO_FIELDS.includes(category[2])) {
      result.push({ name: `ratio.${category[1]}.${category[2]}`, message });
      return;
    }

    const due = key.match(/^date_installments\.(\d+)$/);
    if (due) {
      result.push({ name: `installments.${due[1]}.due_date`, message });
      return;
    }

    const value = key.match(/^value_installments\.(\d+)$/);
    if (value) {
      result.push({ name: `installments.${value[1]}.value`, message });
    }
  });

  return result;
}
