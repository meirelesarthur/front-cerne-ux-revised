// src/pages/Operacional/ServiceOrders/service-order-payload.ts
// -----------------------------------------------------------------------------
// Montagem PURA do payload de `POST`/`PUT /service-orders` a partir do
// `ServiceOrderForm` (extraída de `CreateOrUpdateServiceOrder.tsx`, execução
// 086, FE-02) — testável em round-trip mapper → form → payload.
//
// O `PUT` faz *replace* integral dos 5 blocos. Por isso NENHUMA linha pode ser
// descartada em silêncio (o antigo `.filter(item => item.func_type)` apagava
// toda a mão de obra de uma OS editada): linha incompleta = erro EXPLÍCITO
// (`ServiceOrderIncompleteLineError`, bloco + nº da linha) que a tela mostra e
// que bloqueia o salvar. O schema Yup (`service-order-schema.ts`) já impede o
// caso na validação de campos; este é o cinto de segurança do payload.
// `farm_id`/`service_farm_id`/`user_id` NUNCA entram (DEC-LOS-07).
// -----------------------------------------------------------------------------

import type { ServiceOrderForm, ServiceOrderPayload } from '@/@types/v2/ServiceOrders';

import type { FieldErrors } from 'react-hook-form';

/** Blocos de linha do form (mesma chave do form e do i18n `errors.incompleteLine`). */
export type ServiceOrderLineBlock =
  'employees' | 'equipments' | 'products' | 'productions' | 'protections';

export const SERVICE_ORDER_LINE_BLOCKS: readonly ServiceOrderLineBlock[] = [
  'employees',
  'equipments',
  'products',
  'productions',
  'protections',
];

/** Aba (valor de `Tabs.Root`) de cada bloco de linha. */
export const SERVICE_ORDER_BLOCK_TAB: Record<ServiceOrderLineBlock, '1' | '2' | '3' | '4' | '5'> = {
  employees: '1',
  equipments: '2',
  products: '3',
  productions: '4',
  protections: '5',
};

/** Linha sem a identidade obrigatória — erro explícito (nunca descarte silencioso). */
export class ServiceOrderIncompleteLineError extends Error {
  readonly block: ServiceOrderLineBlock;

  /** Índice 1-based da linha incompleta (o que o usuário vê). */
  readonly line: number;

  constructor(block: ServiceOrderLineBlock, line: number) {
    super(`Linha ${line} incompleta no bloco ${block}`);
    this.name = 'ServiceOrderIncompleteLineError';
    this.block = block;
    this.line = line;
  }
}

/** Bloco + nº (1-based) da linha com erro de validação. */
export interface LineErrorRef {
  block: ServiceOrderLineBlock;
  line: number;
}

/**
 * Primeira linha com erro de validação, na ordem das abas — alimenta a
 * mensagem "complete a linha N" quando o schema bloqueia o submit.
 * @param {FieldErrors<ServiceOrderForm>} errors - `formState.errors` do RHF.
 * @return {LineErrorRef | null} Bloco + linha (1-based), ou `null`.
 */
export function findFirstLineError(errors: FieldErrors<ServiceOrderForm>): LineErrorRef | null {
  for (const block of SERVICE_ORDER_LINE_BLOCKS) {
    const blockErrors = errors[block] as unknown;
    if (!Array.isArray(blockErrors)) continue;
    const index = blockErrors.findIndex((entry) => !!entry);
    if (index >= 0) return { block, line: index + 1 };
  }
  return null;
}

/**
 * @param {ServiceOrderForm} data - Valores do form já validados pelo schema.
 * @return {ServiceOrderPayload} Payload `POST`/`PUT` com os 5 blocos COMPLETOS.
 * @throws {ServiceOrderIncompleteLineError} Se alguma linha não tiver a identidade obrigatória.
 */
export function buildServiceOrderPayload(data: ServiceOrderForm): ServiceOrderPayload {
  return {
    code: data.code!.trim(),
    executor_uuid: data.executor_uuid!.value,
    dt_emission: data.dt_emission!,
    execution_date: data.execution_date!,
    deadline: data.deadline!,
    category: data.category!.value,
    operation_uuid: data.operation_uuid!.value,
    activity_uuid: data.activity_uuid!.value,
    area_uuid: data.area_uuid!.value,
    cultivation_uuid: data.cultivation_uuid?.value ?? undefined,
    batch_uuid: data.batch_uuid?.value ?? undefined,
    category_uuid: data.category_uuid?.value ?? undefined,
    weather_requirements: data.weather_requirements?.trim() || undefined,
    minimum_temperature: data.minimum_temperature ?? undefined,
    maximum_temperature: data.maximum_temperature ?? undefined,
    allowed_working_period_start: data.allowed_working_period_start || undefined,
    allowed_working_period_end: data.allowed_working_period_end || undefined,
    environmental_restrictions: data.environmental_restrictions?.trim() || undefined,
    legal_compliance: data.legal_compliance?.trim() || undefined,
    service_description: data.service_description?.trim() || undefined,
    expected_result_description: data.expected_result_description?.trim() || undefined,
    success_criteria_description: data.success_criteria_description?.trim() || undefined,
    roadmap_description: data.roadmap_description?.trim() || undefined,
    // Mão de obra — só o uuid do `func_type` escolhido vai ao payload
    // (mirror `ServiceOrderEmployeeLineExactlyOneRule`).
    employees: data.employees.map((item, index) => {
      const type = item.func_type?.value;
      const uuid =
        type === 1
          ? item.employee_uuid?.value
          : type === 2
            ? item.function_uuid?.value
            : type === 3
              ? item.provider_uuid?.value
              : undefined;
      if (!uuid) throw new ServiceOrderIncompleteLineError('employees', index + 1);

      return {
        employee_uuid: type === 1 ? uuid : undefined,
        function_uuid: type === 2 ? uuid : undefined,
        provider_uuid: type === 3 ? uuid : undefined,
        note: item.note?.trim() || undefined,
        is_checked: item.is_checked,
      };
    }),
    equipments: data.equipments.map((item, index) => {
      if (!item.equipment_uuid) throw new ServiceOrderIncompleteLineError('equipments', index + 1);
      return {
        equipment_uuid: item.equipment_uuid.value,
        note: item.note?.trim() || undefined,
        is_checked: item.is_checked,
      };
    }),
    // `products_warehouse_uuid` (UI-only) NUNCA vai ao payload.
    products: data.products.map((item, index) => {
      if (!item.stock_uuid || !item.measurement_uuid) {
        throw new ServiceOrderIncompleteLineError('products', index + 1);
      }
      return {
        stock_uuid: item.stock_uuid.value,
        measurement_uuid: item.measurement_uuid.value,
        quantity: Number(item.quantity ?? 0),
        total_quantity: Number(item.total_quantity ?? 0),
        note: item.note?.trim() || undefined,
        is_checked: item.is_checked,
      };
    }),
    productions: data.productions.map((item, index) => {
      if (!item.product_uuid || !item.measurement_uuid) {
        throw new ServiceOrderIncompleteLineError('productions', index + 1);
      }
      return {
        product_uuid: item.product_uuid.value,
        measurement_uuid: item.measurement_uuid.value,
        quantity: Number(item.quantity ?? 0),
        note: item.note?.trim() || undefined,
        is_checked: item.is_checked,
      };
    }),
    protections: data.protections.map((item, index) => {
      if (!item.product_uuid) throw new ServiceOrderIncompleteLineError('protections', index + 1);
      return {
        product_uuid: item.product_uuid.value,
        note: item.note?.trim() || undefined,
        is_checked: item.is_checked,
      };
    }),
  };
}
