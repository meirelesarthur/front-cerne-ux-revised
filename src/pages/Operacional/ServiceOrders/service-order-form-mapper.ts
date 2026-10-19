// src/pages/Operacional/ServiceOrders/service-order-form-mapper.ts
// -----------------------------------------------------------------------------
// TASK-FE-2005 (esteira 038) — mapeamento PURO `ServiceOrderDetail` (resposta
// do backend) → `ServiceOrderForm` (`useForm` do RHF), mirror
// `appropriation-form-mapper.ts`.
//
// Execução 086 (FE-02) — hidratação dos 5 blocos com `{value, label}` a partir
// dos campos novos do `ServiceOrderDetailResource` (DP-1 do dono REVERTEU
// DEC-LOS-03/CLM-034, que preservava a "ambiguidade de reidratação" do legado
// e na SPA virava PERDA DE DADOS: o PUT faz *replace* dos 5 blocos):
//   - Mão de obra: `func_type` = Option a partir de `type` (rótulo traduzido,
//     fábrica `serviceOrderLaborTypeOptions`) + o select do tipo
//     (`employee_uuid`/`function_uuid`/`provider_uuid`) com uuid + `label`.
//   - Insumos: `stock_uuid` com `label` (produto) e o saldo (`stock_quantity`),
//     unidade `measurement_name`, e o Armazém do BLOCO (`products_warehouse_
//     uuid`, UI-only) a partir de `warehouse` — destrava Produto/Unidade.
//   - Equipamentos/Produção/Proteções: `label`/`measurement_name`.
// SEM MOCK: dado ausente (FK órfã → `label: null`) vira rótulo `—` e o uuid
// nulo faz o schema BLOQUEAR o salvar com erro visível na linha (nunca
// descarte silencioso — ver `service-order-payload.ts`).
//
// Limitação declarada: o Armazém de Insumos é UM por bloco no form (R2-05);
// com linhas de armazéns distintos (dado legado) hidrata-se o da 1ª linha — o
// `stock_uuid` de cada linha continua correto e é o que vai ao payload.
// Produção: NÃO existe armazém persistido (tabela `production_service_order`
// sem `warehouse_id`; no legado `_production.blade.php` o "Armazém de produção"
// é um select único SÓ DE UI, para consultar saldo, nunca gravado).
// `productions_warehouse_uuid` é filtro de UI, nasce `null` e NUNCA vai ao
// payload; o usuário reescolhe se quiser ver o "Estoque" da linha.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  ServiceOrderDetail,
  ServiceOrderEmployeeRow,
  ServiceOrderForm,
  ServiceOrderLaborTypeValue,
  ServiceOrderProductRow,
} from '@/@types/v2/ServiceOrders';

import { normalizeTimeToHm } from './service-order-time';

/** Rótulo honesto quando a API não resolveu o nome (FK órfã) — nunca uuid. */
export const SERVICE_ORDER_NO_LABEL = '—';

function toOption(uuid: string | null | undefined, label: string | null | undefined) {
  if (!uuid) return null;
  return { label: label ?? SERVICE_ORDER_NO_LABEL, value: uuid };
}

/**
 * Label da unidade igual ao dos selects de criação (`description || name`).
 * @param {string | null | undefined} description - Descrição ("Quilograma"), se a API enviar.
 * @param {string | null | undefined} name - Nome/sigla ("kg"), fallback.
 * @return {string | null} Label ou `null` sem nenhum dos dois.
 */
export function measurementLabel(
  description: string | null | undefined,
  name: string | null | undefined
): string | null {
  return description || name || null;
}

/**
 * Label do armazém igual ao do select de criação (`SIGLA — descrição`).
 * @param {string | null | undefined} initials - Sigla do armazém, se a API enviar.
 * @param {string | null | undefined} description - Descrição do armazém.
 * @return {string} Label; sem sigla cai na descrição.
 */
export function warehouseLabel(
  initials: string | null | undefined,
  description: string | null | undefined
): string {
  if (!description) return SERVICE_ORDER_NO_LABEL;
  return initials ? `${initials} — ${description}` : description;
}

function mapEmployeeRow(
  item: ServiceOrderEmployeeRow,
  laborTypeOptions: Option<ServiceOrderLaborTypeValue>[]
): ServiceOrderForm['employees'][number] {
  const funcType = item.type
    ? (laborTypeOptions.find((option) => option.value === item.type) ?? null)
    : null;

  return {
    func_type: funcType,
    employee_uuid: item.type === 1 ? toOption(item.employee_uuid, item.label) : null,
    function_uuid: item.type === 2 ? toOption(item.function_uuid, item.label) : null,
    provider_uuid: item.type === 3 ? toOption(item.provider_uuid, item.label) : null,
    note: item.note,
    is_checked: item.is_checked,
  };
}

/** Option da Área igual à do select do cabeçalho (`ServiceOrderHeaderFields`):
 *  `productive_area` embutida alimenta o cálculo Qtd Total = Qtd/ha × área. */
type AreaFormOption = Option<string> & { description: string; productive_area: number };

/** Option do Produto/Estoque + extras lidos pela aba Insumos (mesmo shape da
 *  option vinda de `/stocks/available-options`). */
type StockFormOption = Option<string> & {
  quantity?: number;
  measurement?: Option<string> | null;
};

function mapProductRow(item: ServiceOrderProductRow): ServiceOrderForm['products'][number] {
  const measurement = toOption(
    item.measurement_uuid,
    measurementLabel(item.measurement_description, item.measurement_name)
  );
  const stock = toOption(item.stock_uuid, item.label ?? item.product_description);

  // Extras (`quantity`/`measurement`) alimentam o "Estoque" readonly e o
  // select de unidade da linha, como a option vinda de `/stocks/available-options`.
  const stockOption: StockFormOption | null = stock
    ? {
        ...stock,
        ...(item.stock_quantity !== null && item.stock_quantity !== undefined
          ? { quantity: item.stock_quantity }
          : {}),
        measurement,
      }
    : null;

  return {
    stock_uuid: stockOption,
    measurement_uuid: measurement,
    quantity: item.quantity,
    total_quantity: item.total_quantity,
    note: item.note,
    is_checked: item.is_checked,
  };
}

/**
 * @param {ServiceOrderDetail} data - Detalhe (`ServiceOrderDetailResource`) recebido do backend.
 * @param {Option<number>[]} categoryOptions - Fábrica estática
 *   `getServiceOrderCategoryOptions(languageGB)` — resolve o rótulo traduzido de `category`.
 * @param {Option<ServiceOrderLaborTypeValue>[]} laborTypeOptions - Fábrica
 *   `serviceOrderLaborTypeOptions.options(languageGB)` — rótulo traduzido de `type` da mão de obra.
 * @return {ServiceOrderForm} Valores prontos para `reset()` do `useForm<ServiceOrderForm>`.
 */
export function mapServiceOrderDetailToFormValues(
  data: ServiceOrderDetail,
  categoryOptions: Option<number>[],
  laborTypeOptions: Option<ServiceOrderLaborTypeValue>[]
): ServiceOrderForm {
  const categoryOption = categoryOptions.find((option) => option.value === data.category) ?? null;
  const products = data.products ?? [];
  const areaOption: AreaFormOption | null = data.area
    ? {
        label: data.area.description ?? data.area.name,
        value: data.area.uuid,
        description: data.area.description ?? data.area.name,
        productive_area: Number(data.area.productive_area) || 0,
      }
    : null;
  const productsWarehouse = products.find((item) => item.warehouse)?.warehouse ?? null;

  return {
    code: data.code,
    executor_uuid: data.executor ? { label: data.executor.name, value: data.executor.uuid } : null,
    dt_emission: data.dt_emission,
    execution_date: data.execution_date,
    deadline: data.deadline,
    category: categoryOption,
    operation_uuid: data.operation
      ? { label: data.operation.name, value: data.operation.uuid }
      : null,
    activity_uuid: data.activity ? { label: data.activity.name, value: data.activity.uuid } : null,
    area_uuid: areaOption,
    cultivation_uuid: data.cultivation
      ? { label: data.cultivation.name, value: data.cultivation.uuid }
      : null,
    batch_uuid: data.batch ? { label: data.batch.name, value: data.batch.uuid } : null,
    category_uuid: data.category_animal
      ? { label: data.category_animal.name, value: data.category_animal.uuid }
      : null,
    weather_requirements: data.weather_requirements,
    minimum_temperature: data.minimum_temperature,
    maximum_temperature: data.maximum_temperature,
    // GET devolve `HH:MM:SS`; schema e PUT exigem `HH:MM` (ver `service-order-time.ts`).
    allowed_working_period_start: normalizeTimeToHm(data.allowed_working_period_start),
    allowed_working_period_end: normalizeTimeToHm(data.allowed_working_period_end),
    environmental_restrictions: data.environmental_restrictions,
    legal_compliance: data.legal_compliance,
    service_description: data.service_description,
    expected_result_description: data.expected_result_description,
    success_criteria_description: data.success_criteria_description,
    roadmap_description: data.roadmap_description,
    employees: (data.employees ?? []).map((item) => mapEmployeeRow(item, laborTypeOptions)),
    equipments: (data.equipments ?? []).map((item) => ({
      equipment_uuid: toOption(item.equipment_uuid, item.label),
      note: item.note,
      is_checked: item.is_checked,
    })),
    products_warehouse_uuid: productsWarehouse
      ? {
          label: warehouseLabel(productsWarehouse.initials, productsWarehouse.label),
          value: productsWarehouse.uuid,
        }
      : null,
    products: products.map(mapProductRow),
    // O Resource não expõe armazém por linha de Produção (UI-only) — nasce
    // `null`, ver nota de topo.
    productions_warehouse_uuid: null,
    productions: (data.productions ?? []).map((item) => ({
      product_uuid: toOption(item.product_uuid, item.label),
      measurement_uuid: toOption(
        item.measurement_uuid,
        measurementLabel(item.measurement_description, item.measurement_name)
      ),
      quantity: item.quantity,
      note: item.note,
      is_checked: item.is_checked,
    })),
    protections: (data.protections ?? []).map((item) => ({
      product_uuid: toOption(item.product_uuid, item.label),
      note: item.note,
      is_checked: item.is_checked,
    })),
  };
}
