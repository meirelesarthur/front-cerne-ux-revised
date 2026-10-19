// src/pages/Operacional/Pesagem/weighing-form-mapper.ts
// -----------------------------------------------------------------------------
// Mapper PURO form↔payload do CRUD raiz de Pesagem — `mapWeighingDetailToFormValues(detail)`/
// `mapFormValuesToSaveRequest(formValues)` (F-071, TASK-PES-FE-06, contrato-tela-
// lane-c-pesagem-frontend.md §6.7, mirror `sanitario-form-mapper.ts`). Fecha o
// round-trip de edição (cabeçalho + animais + bloco sanitário embutido) que a
// TASK-PES-FE-04/05 deixaram inline em `CreateOrUpdateWeighing.tsx` — EXTRAÍDO
// para este arquivo dedicado nesta Tarefa (Regra "3 arquivos novos" da
// Tarefa), sem mudar nenhum comportamento já entregue (`buildAnimalPayload`/
// `toSavePayload`/`fillForm` das Tarefas anteriores viram
// `buildAnimalPayload`/`mapFormValuesToSaveRequest`/`mapWeighingDetailToFormValues`
// aqui, byte-a-byte na lógica de animais/cabeçalho já validada).
//
// Bloco sanitário embutido — hidratação em modo editar (LIMITAÇÃO HONESTA,
// mesmo padrão já aceito em `sanitario-form-mapper.ts`): `WeighingSanitaryItemDetail`
// (`WeighingResource` real, ver nota de cabeçalho de `CreateOrUpdateWeighing.tsx`/
// TASK-PES-FE-04) só devolve `{uuid, product:{uuid,name}, stock:{uuid},
// quantity, total_quantity, note}` — SEM `warehouse_uuid`/`measurement_uuid`.
// `mapWeighingSanitaryItemsToFormValues` NÃO inventa esses valores (SEM
// MOCK): nascem `null`, o usuário reseleciona Armazém/Un.Medida se quiser
// ALTERAR uma linha existente — a reconciliação por `item_uuid` (round-trip
// completo criar→reabrir→editar/remover→salvar) não depende desses campos
// re-hidratados.
// -----------------------------------------------------------------------------

import { isWeighingAnimalSemId } from '@/utils/weighingAnimalSemId';

import type {
  SaveWeighingRequest,
  WeighingAnimalDetail,
  WeighingAnimalFormValue,
  WeighingAnimalPayload,
  WeighingDetail,
  WeighingFormValues,
  WeighingSanitaryItemDetail,
  WeighingSanitaryItemFormValue,
  WeighingSanitaryItemPayload,
} from '@/@types/v2/Weighing';

/**
 * Hidrata as linhas do bloco de animais a partir do detalhe real (`GET
 * /weighings/{uuid}`). `row_uuid` = `animal.uuid` da LINHA (`AnimalWeighing`,
 * NÃO o uuid do animal em si) — chave de reconciliação do round-trip
 * (contrato-tela §6.7). `animal.animal === null` (relação não carregada,
 * caso defensivo que não deveria ocorrer em produção) vira `animal_uuid:
 * null` — linha honestamente incompleta, SEM MOCK; o usuário reseleciona
 * antes de salvar.
 * @param {WeighingAnimalDetail[]} animals - `WeighingDetail.animals` do backend.
 * @return {WeighingAnimalFormValue[]} Linhas prontas para `useFieldArray`.
 */
export function mapWeighingAnimalsToFormValues(
  animals: WeighingAnimalDetail[]
): WeighingAnimalFormValue[] {
  return animals.map((animal) => ({
    row_uuid: animal.uuid,
    animal_uuid: animal.animal
      ? { label: animal.animal.identification, value: animal.animal.uuid }
      : null,
    weight: animal.weight,
    last_weight: animal.last_weight,
    last_weight_date: animal.last_weight_date,
    has_ultrasound: animal.has_ultrasound,
    // Correção de fidelidade (97-Esteiras/002 execução 002 lane C) —
    // `WeighingAnimalDetail.ultrasound` vem ANINHADO no detalhe
    // (`WeighingResource`), `null` quando a linha não tem exame vinculado;
    // achatado aqui para os 4 campos FLAT do form (mirror
    // `ProcessingAnimalForm.aol/egs/marm/classification`).
    aol: animal.ultrasound?.aol ?? null,
    egs: animal.ultrasound?.egs ?? null,
    marm: animal.ultrasound?.marm ?? null,
    classification: animal.ultrasound?.classification ?? null,
  }));
}

/**
 * Hidrata as linhas do bloco sanitário embutido a partir do detalhe real.
 * `row_uuid` = `item.uuid` (chave de reconciliação — `item_uuid` no payload
 * de update). `warehouse_uuid`/`measurement_uuid` nascem `null` —
 * `WeighingSanitaryItemDetail` não os devolve (limitação honesta, ver
 * cabeçalho do arquivo).
 * @param {WeighingSanitaryItemDetail[]} items - `WeighingDetail.sanitary.items` do backend.
 * @return {WeighingSanitaryItemFormValue[]} Linhas prontas para `useFieldArray`.
 */
export function mapWeighingSanitaryItemsToFormValues(
  items: WeighingSanitaryItemDetail[]
): WeighingSanitaryItemFormValue[] {
  return items.map((item) => ({
    row_uuid: item.uuid,
    warehouse_uuid: null,
    product:
      item.product && item.stock
        ? {
            label: item.product.name,
            value: item.stock.uuid,
            product_uuid: item.product.uuid,
            // Saldo real desconhecido no hidrate (Detail não devolve) — a
            // cascata ao vivo (reabrir/trocar Armazém) é a fonte de verdade
            // se o usuário precisar conferir/alterar o saldo (mirror
            // `sanitario-form-mapper.ts`).
            quantity: 0,
            lot: null,
            measurement: null,
            measurement_second: null,
            factor: null,
            factor_type: null,
          }
        : null,
    // Resolvido pela cascata Produto→Un.Medida (`product_uuid` já disponível
    // acima) — auto-seleciona sozinho quando há 1 única opção (mesmo
    // `useEffect` de `WeighingSanitaryItemRow.tsx`).
    measurement_uuid: null,
    quantity: item.quantity,
    note: item.note ?? '',
  }));
}

/**
 * `mapWeighingDetailToFormValues` — hidrata o `useForm<WeighingFormValues>`
 * inteiro (cabeçalho + animais + bloco sanitário) a partir do detalhe real do
 * backend. Único ponto de montagem do `reset()` de `CreateOrUpdateWeighing.tsx`
 * em modo editar (contrato-tela §6.7).
 * @param {WeighingDetail} detail - Resposta de `GET /weighings/{uuid}`.
 * @return {WeighingFormValues} Valores prontos para `reset()`.
 */
export function mapWeighingDetailToFormValues(detail: WeighingDetail): WeighingFormValues {
  return {
    date: detail.date,
    batch_uuid: detail.batch ? { label: detail.batch.name, value: detail.batch.uuid } : null,
    category_uuid: detail.category
      ? { label: detail.category.name, value: detail.category.uuid }
      : null,
    is_stock: detail.is_stock,
    arroba_value: detail.is_stock ? (detail.arroba_value ?? '') : '',
    animals: mapWeighingAnimalsToFormValues(detail.animals ?? []),
    sanitary: !!detail.sanitary,
    sanitary_items: mapWeighingSanitaryItemsToFormValues(detail.sanitary?.items ?? []),
  };
}

/**
 * Payload de animal (`WeighingAnimalData` backend, `CTR-PES §5.1`). `weight`/
 * `last_weight`/`last_weight_date` são SEMPRE informados pelo cliente — o
 * servidor NUNCA recalcula (CTR-PES §2). `item_uuid` presente só quando a
 * linha já existe (`row_uuid` hidratado por `mapWeighingAnimalsToFormValues`).
 * @param {WeighingAnimalFormValue} animal - Linha do `useFieldArray` de `animals`.
 * @return {WeighingAnimalPayload} Linha pronta para o array `animals` do payload.
 */
function buildAnimalPayload(animal: WeighingAnimalFormValue): WeighingAnimalPayload {
  // Animal S/ID (legado `Admin/WeighingController.php:225-226`): os campos
  // ficam vazios na tela e a API (a8a5435f9) aceita a linha SEM `last_weight`
  // e `last_weight_date`, gravando 0 + hoje como o legado. Por isso as chaves
  // são OMITIDAS quando vazias (nunca `0`/data da pesagem inventados pelo
  // front). Animal S/ID com valor gravado (edição) segue enviando o gravado.
  const semId = isWeighingAnimalSemId(animal.animal_uuid);
  const lastWeightEmpty = animal.last_weight === '' || animal.last_weight == null;
  const lastWeightDateEmpty = !animal.last_weight_date;
  return {
    animal_uuid: animal.animal_uuid!.value,
    weight: Number(animal.weight),
    ...(semId && lastWeightEmpty ? {} : { last_weight: Number(animal.last_weight) }),
    ...(semId && lastWeightDateEmpty
      ? {}
      : { last_weight_date: animal.last_weight_date as string }),
    has_ultrasound: animal.has_ultrasound,
    // Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror
    // `FinishProcessing.tsx` (`buildFinishProcessingPayload`): chave AUSENTE
    // (não `null`) quando o valor não foi preenchido — `WeighingAnimalItemData`
    // é `Optional` no backend, `required` só quando `has_ultrasound=true`
    // (`WeighingRequest::guardUltrasoundFields()`).
    ...(animal.aol != null ? { aol: animal.aol } : {}),
    ...(animal.egs != null ? { egs: animal.egs } : {}),
    ...(animal.marm != null ? { marm: animal.marm } : {}),
    ...(animal.classification ? { classification: animal.classification } : {}),
    item_uuid: animal.row_uuid,
  };
}

/**
 * Payload de item sanitário (`WeighingSanitaryItemData` backend, `CTR-PES
 * §4`). **Sem** `cost_center_uuid`/`total_quantity` (Regra 1/6 da Tarefa) —
 * `stock_uuid` identifica a linha física de estoque (`product.value`),
 * `product_uuid` vem do campo próprio da opção decorada (nunca confundir os
 * dois, contrato-tela §5.1). `item_uuid` presente só quando a linha já existe.
 * @param {WeighingSanitaryItemFormValue} item - Linha do `useFieldArray` de `sanitary_items`.
 * @return {WeighingSanitaryItemPayload} Linha pronta para o array `items` do `sanitary_data`.
 */
function buildSanitaryItemPayload(
  item: WeighingSanitaryItemFormValue
): WeighingSanitaryItemPayload {
  return {
    warehouse_uuid: item.warehouse_uuid!.value,
    product_uuid: item.product!.product_uuid,
    stock_uuid: item.product!.value,
    measurement_uuid: item.measurement_uuid!.value,
    quantity: Number(item.quantity),
    note: item.note || null,
    item_uuid: item.row_uuid,
  };
}

/**
 * `mapFormValuesToSaveRequest` — única fonte de verdade do form→payload de
 * Pesagem (`SaveWeighingRequest`, CTR-PES §4). `sanitary_data` só entra no
 * objeto (chave presente) quando `sanitary=true` — quando `false`, a chave
 * fica AUSENTE mesmo que existam linhas residuais no form state (Regra 4 da
 * Tarefa; `WeighingSanitarySection` some da tela mas não apaga o
 * `useFieldArray`) — esta função é quem poda antes de montar o objeto final.
 * `sanitary_data.date` espelha a MESMA data do cabeçalho — não é campo
 * próprio (Regra 3 da Tarefa/contrato-tela §2.2).
 * @param {WeighingFormValues} data - Valores atuais do `useForm<WeighingFormValues>`.
 * @return {SaveWeighingRequest} Payload pronto para `createWeighing`/`updateWeighing`.
 */
export function mapFormValuesToSaveRequest(data: WeighingFormValues): SaveWeighingRequest {
  const payload: SaveWeighingRequest = {
    date: data.date as string,
    is_stock: data.is_stock,
    animals: data.animals.map(buildAnimalPayload),
    sanitary: data.sanitary,
  };

  if (data.batch_uuid) payload.batch_uuid = data.batch_uuid.value;
  if (data.category_uuid) payload.category_uuid = data.category_uuid.value;
  if (data.is_stock && data.arroba_value !== '') {
    payload.arroba_value = Number(data.arroba_value);
  }

  if (data.sanitary) {
    payload.sanitary_data = {
      date: data.date as string,
      items: data.sanitary_items.map(buildSanitaryItemPayload),
    };
  }

  return payload;
}

export default { mapWeighingDetailToFormValues, mapFormValuesToSaveRequest };
