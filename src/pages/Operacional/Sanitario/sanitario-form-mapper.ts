// src/pages/Operacional/Sanitario/sanitario-form-mapper.ts
// -----------------------------------------------------------------------------
// Mapper PURO form↔payload do CRUD raiz de Sanitário — `toFormValues(detail)`/
// `toPayload(formValues)` (F-062, TASK-SAN-FE-05, contrato-tela-lane-c-
// sanitario-frontend.md §6.6, mirror `service-order-form-mapper.ts`/
// `appropriation-form-mapper.ts`). Fecha o round-trip de edição (cabeçalho +
// itens + mão de obra) que a TASK-SAN-FE-03 deixou reservado (`items: []`,
// `labor: []` no `fillForm`).
//
// ACHADO desta Tarefa (leitura direta do código real da API, worktree irmão
// `GB.Cerne.Api`, `app/Http/Requests/Api/V1/SanitaryRequest.php` +
// `app/Actions/Sanitary/UpdateSanitaryAction.php`) — os 2 blocos reconciliam
// de formas DIFERENTES no `update()`, e isso muda o desenho deste mapper:
//
//   - **Itens** (`items.*.uuid`, `SanitaryItemData::$uuid` — `string|Optional`):
//     o backend aceita e USA um `uuid` explícito por linha.
//     `UpdateSanitaryAction::reconcileItems()` faz upsert real: linha COM
//     `uuid` que resolve para um item existente é atualizada in-place
//     (reverte o decremento antigo, redecrementa); linha SEM `uuid` é criada;
//     item existente cujo `uuid` NÃO aparece no payload é removido (reverte
//     o decremento e apaga). Isto é o round-trip por `uuid` de linha real
//     (Regra 4/CTR-SAN §5) — `row_uuid` do form (`SanitaryItemFormValue`)
//     mapeia 1:1 para essa chave `uuid` do payload (o tipo compartilhado
//     `SanitaryItemPayload` em `@/@types/v2/Sanitaries` ainda não declara
//     esse campo — `SanitaryItemSubmitPayload` abaixo é a extensão local
//     mínima, sem reabrir aquele arquivo compartilhado fora do escopo desta
//     Tarefa).
//
//   - **Mão de obra** (`labor.*`, `SanitaryLaborItemData`): a Request NÃO
//     tem `labor.*.uuid` nenhum, e `UpdateSanitaryAction::reconcileLabor()`
//     sempre faz `$sanitary->laborEntries()->delete()` e recria do zero a
//     partir do array recebido (full-replace), nunca upsert por chave. Não
//     existe (nem pode existir) um `row_uuid` de mão de obra no payload —
//     o mapper simplesmente reenvia o array de linhas atual do form a cada
//     submit; uma linha removida no form fica ausente do próximo `PUT` e o
//     servidor a apaga (mesmo resultado funcional da Regra 4, só que via
//     full-replace em vez de upsert por chave — decisão de arquitetura já
//     tomada pelo backend, não desta Tarefa).
//
// LIMITAÇÃO HONESTA de re-hidratação em modo editar (decisão de arquitetura
// desta Tarefa, já antecipada pelo comentário de `SanitaryItemDetail`/
// `SanitaryLaborDetail` em `@/@types/v2/Sanitaries` — "decisão de
// arquitetura da Tarefa 29, não desta [Tarefa 01]"), ATUALIZADA pela
// CORREÇÃO AO VIVO (dono, 2026-08-28, BUG-SAN-EDIT-01): `SanitaryResource`
// real agora devolve `items[].stock.quantity`/`.warehouse`/`.measurement` —
// `toFormValues`/`mapSanitaryItemsToFormValues` abaixo hidratam
// `warehouse_uuid`/`measurement_uuid` (item) e o saldo REAL do produto a
// partir desses campos (fim do fallback hardcoded `quantity: 0`, causa raiz
// do bug "estoque sempre insuficiente ao editar"). O que CONTINUA
// irrecuperável (Resource real não devolve): `cost_center_uuid` do item, e
// `measurement_uuid`/`employee_uuid`/`function_uuid`/`provider_uuid` da
// linha de mão de obra — SEM MOCK, este mapper não inventa esses valores;
// ficam `null` e o usuário precisa reselecioná-los se quiser alterar a
// linha, mesmo padrão já aceito em `service-order-form-mapper.ts`
// (`warehouse_uuid`/`products_warehouse_uuid` sempre `null` no edit, mesmo
// motivo, para os campos que ainda não voltam do servidor). Isto NÃO
// bloqueia o round-trip da Tarefa (criar → reabrir → remover 1 item + 1
// linha de MO → salvar continua funcionando — a reconciliação por `uuid`/
// full-replace não depende desses campos re-hidratados) — fica registrado
// aqui como achado para uma eventual melhoria futura do `SanitaryResource`
// quanto à mão de obra/centro de custo (fora do escopo desta correção).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  SanitaryDetail,
  SanitaryItemDetail,
  SanitaryItemFormValue,
  SanitaryItemPayload,
  SanitaryLaborDetail,
  SanitaryLaborFormValue,
  SanitaryLaborFuncTypeValue,
  SanitaryLaborPayload,
  SanitaryFormValues,
  SaveSanitaryRequest,
} from '@/@types/v2/Sanitaries';

const LABOR_TYPE_EMPLOYEE = 1;
const LABOR_TYPE_FUNCTION = 2;
const LABOR_TYPE_PROVIDER = 3;

// Extensão local mínima de `SanitaryItemPayload` — só este mapper conhece o
// campo `uuid` (ver nota de cabeçalho). Estruturalmente compatível com
// `SanitaryItemPayload[]` (nenhum campo obrigatório removido, só 1 opcional
// a mais) — `toPayload` devolve `SaveSanitaryRequest` sem cast.
export type SanitaryItemSubmitPayload = SanitaryItemPayload & { uuid?: string };

function funcTypeOption(
  value: SanitaryLaborFuncTypeValue,
  languageGB: LanguageDate
): Option<SanitaryLaborFuncTypeValue> {
  const labels = languageGB.sanitary.sanitary.form.funcTypeOptions;
  const label =
    value === LABOR_TYPE_EMPLOYEE
      ? labels.employee
      : value === LABOR_TYPE_FUNCTION
        ? labels.function
        : labels.provider;
  return { label, value };
}

/**
 * Hidrata as linhas de item de produto a partir do detalhe real (`GET
 * /sanitaries/{uuid}`). `row_uuid` = `item.uuid` real (chave de
 * reconciliação do `update()`, ver cabeçalho do arquivo).
 * `warehouse_uuid`/`measurement_uuid`/o saldo real do produto agora hidratam
 * a partir de `item.stock.warehouse`/`.measurement`/`.quantity` (correção ao
 * vivo, BUG-SAN-EDIT-01) — mesmo shape `{uuid, name}`/`{value,label}` usado
 * no modo criar (`SanitaryItemRow.tsx`, `handleWarehouseChange`/
 * `mapOptions` de Un.Medida), para a cascata funcionar igual nos dois modos.
 * `cost_center_uuid` continua `null` — `SanitaryItemDetail` não o devolve
 * (limitação honesta, ver cabeçalho).
 * @param {SanitaryItemDetail[]} items - `SanitaryDetail.items` do backend.
 * @return {SanitaryItemFormValue[]} Linhas prontas para `useFieldArray`.
 */
export function mapSanitaryItemsToFormValues(items: SanitaryItemDetail[]): SanitaryItemFormValue[] {
  return items.map((item) => ({
    row_uuid: item.uuid,
    warehouse_uuid: item.stock?.warehouse
      ? { label: item.stock.warehouse.name, value: item.stock.warehouse.uuid }
      : null,
    product:
      item.product && item.stock
        ? {
            label: item.product.name,
            value: item.stock.uuid,
            product_uuid: item.product.uuid,
            // Saldo REAL devolvido pela API (correção ao vivo,
            // BUG-SAN-EDIT-01, `SanitaryResource::toArray()`
            // `items[].stock.quantity`) — antes hardcoded `0`, causa raiz do
            // bug "estoque sempre insuficiente ao editar". A cascata ao vivo
            // (reabrir/trocar Armazém) continua sendo a fonte de verdade se
            // o usuário precisar conferir/alterar o saldo depois de tocar a
            // linha; até lá, "Estoque" exibe este valor real hidratado.
            quantity: item.stock.quantity,
            lot: null,
            measurement: null,
            measurement_second: null,
            factor: null,
            factor_type: null,
          }
        : null,
    // Hidrata do saldo real (`item.stock.measurement`, correção ao vivo,
    // BUG-SAN-EDIT-01) quando devolvido; o `useEffect` de auto-seleção por
    // opção única de `SanitaryItemRow.tsx` (Regra 3 da TASK-SAN-FE-04) só
    // atua quando o campo ainda está vazio, então não sobrescreve este valor.
    measurement_uuid: item.stock?.measurement
      ? { label: item.stock.measurement.name, value: item.stock.measurement.uuid }
      : null,
    quantity: item.quantity,
    cost_center_uuid: null,
    note: item.note ?? '',
  }));
}

/**
 * Hidrata as linhas de mão de obra a partir do detalhe real. SEM `row_uuid`
 * (o bloco não tem identificador de linha — ver cabeçalho do arquivo).
 * `func_type` reidrata com rótulo REAL (`languageGB`); o executor reidrata
 * o nome de `executor.name`; `measurement_uuid` de `measurement`.
 * @param {SanitaryLaborDetail[]} labor - `SanitaryDetail.labor` do backend.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (rótulos de `func_type`).
 * @return {SanitaryLaborFormValue[]} Linhas prontas para `useFieldArray`.
 */
export function mapSanitaryLaborToFormValues(
  labor: SanitaryLaborDetail[],
  languageGB: LanguageDate
): SanitaryLaborFormValue[] {
  return labor.map((item) => {
    const executorOption: Option<string> | null = item.executor_uuid
      ? { label: item.executor?.name ?? '—', value: item.executor_uuid }
      : null;

    return {
      func_type: item.func_type != null ? funcTypeOption(item.func_type, languageGB) : null,
      employee_uuid: item.func_type === LABOR_TYPE_EMPLOYEE ? executorOption : null,
      function_uuid: item.func_type === LABOR_TYPE_FUNCTION ? executorOption : null,
      provider_uuid: item.func_type === LABOR_TYPE_PROVIDER ? executorOption : null,
      measurement_uuid: item.measurement
        ? {
            label: item.measurement.description || item.measurement.name,
            value: item.measurement.uuid,
          }
        : null,
      total_quantity: item.total_quantity,
    };
  });
}

/**
 * `toFormValues` — hidrata o `useForm<SanitaryFormValues>` inteiro
 * (cabeçalho + itens + mão de obra) a partir do detalhe real do backend.
 * Único ponto de montagem do `reset()` de `CreateOrUpdateSanitario.tsx`
 * em modo editar.
 * @param {SanitaryDetail} detail - Resposta de `GET /sanitaries/{uuid}`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {SanitaryFormValues} Valores prontos para `reset()`.
 */
export function toFormValues(detail: SanitaryDetail, languageGB: LanguageDate): SanitaryFormValues {
  return {
    date: detail.date,
    batch_uuid: detail.batch ? { label: detail.batch.name, value: detail.batch.uuid } : null,
    time_control: detail.time_control,
    animal_uuids: (detail.animals ?? []).map((animal) => ({
      label: animal.identification,
      value: animal.uuid,
    })),
    items: mapSanitaryItemsToFormValues(detail.items ?? []),
    labor: mapSanitaryLaborToFormValues(detail.labor ?? [], languageGB),
  };
}

/**
 * `stock_uuid`/`product_uuid` do payload — a opção selecionada no Select de
 * Produto É a linha de `Stock` (`item.product.value`), `product_uuid` vem
 * do campo próprio da opção decorada (NUNCA confundir os dois, contrato-
 * tela §5.1). `uuid` só entra quando a linha já existe (`row_uuid`
 * hidratado por `toFormValues`) — chave de reconciliação real do
 * `UpdateSanitaryAction` (ver cabeçalho do arquivo); linha nova (`append`
 * do `SanitaryItemsSection`) nunca tem `row_uuid`, então nunca envia `uuid`.
 * `total_quantity` do item NUNCA é enviado — o servidor calcula (Regra 6
 * da TASK-SAN-FE-04, preservada aqui).
 * @param {SanitaryItemFormValue} item - Linha do `useFieldArray` de `items`.
 * @return {SanitaryItemSubmitPayload} Linha pronta para o array `items` do payload.
 */
function mapSanitaryItemFormValueToPayload(item: SanitaryItemFormValue): SanitaryItemSubmitPayload {
  return {
    ...(item.row_uuid ? { uuid: item.row_uuid } : {}),
    warehouse_uuid: item.warehouse_uuid!.value,
    product_uuid: item.product!.product_uuid,
    stock_uuid: item.product!.value,
    measurement_uuid: item.measurement_uuid!.value,
    quantity: Number(item.quantity),
    ...(item.cost_center_uuid ? { cost_center_uuid: item.cost_center_uuid.value } : {}),
    ...(item.note ? { note: item.note } : {}),
  };
}

/**
 * `executor_uuid` do payload — exatamente 1 dos 3 campos de executor está
 * preenchido por linha (invariante já validada pelo schema Yup,
 * `laborItemSchema` de `sanitaries-schema.ts`); este mapper só resolve qual
 * deles enviar. Sem `amount` (Regra 2/CTR-SAN §4.1 — nunca calculado no
 * cliente) e sem `uuid` (o bloco não tem identidade de linha no payload,
 * ver cabeçalho do arquivo).
 * @param {SanitaryLaborFormValue} item - Linha do `useFieldArray` de `labor`.
 * @return {SanitaryLaborPayload} Linha pronta para o array `labor` do payload.
 */
function mapSanitaryLaborFormValueToPayload(item: SanitaryLaborFormValue): SanitaryLaborPayload {
  const executorUuid =
    item.employee_uuid?.value ?? item.function_uuid?.value ?? item.provider_uuid?.value ?? '';

  return {
    func_type: item.func_type!.value,
    executor_uuid: executorUuid,
    measurement_uuid: item.measurement_uuid!.value,
    total_quantity: Number(item.total_quantity),
  };
}

/**
 * `toPayload` — única fonte de verdade do form→payload de Sanitário
 * (`SaveSanitaryRequest`, CTR-SAN §3). `labor` só entra no objeto (chave
 * presente) quando `time_control=true` — quando `false`, a chave fica
 * AUSENTE mesmo que existam linhas residuais no form state (Regra 3 da
 * Tarefa; o `SanitaryLaborSection` some da tela mas não apaga o
 * `useFieldArray`, ver `SanitaryLaborSection.tsx`) — este `toPayload` é
 * quem poda antes de montar o objeto final.
 * @param {SanitaryFormValues} data - Valores atuais do `useForm<SanitaryFormValues>`.
 * @return {SaveSanitaryRequest} Payload pronto para `createSanitary`/`updateSanitary`.
 */
export function toPayload(data: SanitaryFormValues): SaveSanitaryRequest {
  return {
    batch_uuid: data.batch_uuid!.value,
    date: data.date!,
    time_control: data.time_control,
    animal_uuids: data.animal_uuids.map((option) => option.value),
    items: data.items.map(mapSanitaryItemFormValueToPayload),
    ...(data.time_control ? { labor: data.labor.map(mapSanitaryLaborFormValueToPayload) } : {}),
  };
}

export default { toFormValues, toPayload };
