// src/constants/serviceOrders/options/service-order-labor-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do "Tipo" da linha de Mão de Obra da Ordem de Serviço
// (`func_type` no form; `type` no `GET /service-orders/{uuid}`, execução 086) —
// domínio ESTÁTICO 1=Funcionário, 2=Função, 3=Fornecedor (mirror do legado e
// de `ServiceOrderEmployeeRow.type`). Fonte ÚNICA consumida pela aba do form
// (`ServiceOrderLaborTab`), pelo mapper de hidratação e pelo detalhe.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ServiceOrderLaborTypeValue } from '@/@types/v2/ServiceOrders';

export const SERVICE_ORDER_LABOR_TYPE = {
  employee: 1,
  function: 2,
  provider: 3,
} as const satisfies Record<string, ServiceOrderLaborTypeValue>;

const labels = (languageGB: LanguageDate): Map<ServiceOrderLaborTypeValue, string> => {
  const typeOptions = languageGB.serviceOrders.serviceOrder.form.labor.typeOptions;
  return new Map<ServiceOrderLaborTypeValue, string>([
    [SERVICE_ORDER_LABOR_TYPE.employee, typeOptions.employee],
    [SERVICE_ORDER_LABOR_TYPE.function, typeOptions.function],
    [SERVICE_ORDER_LABOR_TYPE.provider, typeOptions.provider],
  ]);
};

const getLabel = (value: ServiceOrderLaborTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? '—';

const getOption = (
  value: ServiceOrderLaborTypeValue,
  languageGB: LanguageDate
): Option<ServiceOrderLaborTypeValue> => ({ value, label: getLabel(value, languageGB) });

const options = (languageGB: LanguageDate): Option<ServiceOrderLaborTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const serviceOrderLaborTypeOptions = { getLabel, getOption, options };
