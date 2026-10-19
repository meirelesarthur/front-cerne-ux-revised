// src/pages/Operacional/Reproducao/Acasalamento/acasalamento-form-mapper.ts
// -----------------------------------------------------------------------------
// Mapper puro (sem JSX/hooks) do formulário de Acasalamento — BreedingMating,
// F-016, 97-Esteiras/001, TASK-BM-FE-04 (contrato de tela §6.3, §6.3.4).
//
// Round-trip por `uuid` de linha (regra 10 da Tarefa, §6.3.4): linha COM
// `uuid` → update; linha SEM `uuid` → criação; linha existente ausente do
// payload enviado → exclusão com restauração de estoque (decidido no
// SERVIDOR a partir do array completo — o front sempre envia o array
// INTEIRO desejado, nunca um delta, mirror `LoteReproducao`/`batch_uuids`).
//
// `type` e `protocol_uuid` são IMUTÁVEIS no update (CLM-002) — mas o backend
// exige RESSUBMISSÃO do valor atual (confirma igualdade em `withValidator`,
// não trata ausência como "não alterar", ver GAP-FE-BM-15). Os dois são
// sempre reenviados com o valor REAL hidratado: `type` desde
// `TASK-BM-FE-20`; `protocol_uuid` desde `TASK-BM-FE-18`, que passou a
// hidratar `protocol` (Select do cabeçalho) a partir de
// `data.protocol_reference` (EP-BM-04, GAP-FE-BM-04).
//
// GAP-FE-BM-04 (`04-Gaps_Frontend_UI/`, resolvido por `TASK-BM-FE-18`):
// `BreedingMatingData` (EP-BM-02/04) agora expõe `bull_seed_season`/
// `protocol_reference` — refs `{uuid,label}` reais, mirror de
// `breeding_season`/`breeding_batch`. O sentinela `LOCKED_UNKNOWN_OPTION_VALUE`
// abaixo passa a ser só FALLBACK, usado apenas quando o servidor devolve
// `null` genuíno nesses 2 campos (ex. registro legado sem a FK preenchida) —
// não mais o caminho padrão. Sem valor real nem sentinela, o Select travado
// (`isDisabled`) nunca teria como satisfazer o schema `.required()`.
// -----------------------------------------------------------------------------

import { breedingMatingLaunchTypeOptions } from '@/constants/breedingMating/options/breeding-mating-launch-type-options';
import { breedingMatingTypeOptions } from '@/constants/breedingMating/options/breeding-mating-type-options';
import { inkOptions } from '@/constants/breedingMating/options/ink-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  AnimalOptionRef,
  BreedingMatingData,
  BreedingMatingForm,
  BreedingMatingLockedFields,
  BreedingMatingProtocolAnimalFormValue,
  BreedingMatingProtocolAnimalLine,
  BreedingMatingSimplifiedAnimalFormValue,
  BreedingMatingSimplifiedAnimalLine,
  CreateBreedingMatingRequest,
  CreateOrUpdateBreedingMatingProtocolAnimalPayload,
  CreateOrUpdateBreedingMatingSimplifiedAnimalPayload,
  EntityOptionRef,
  UpdateBreedingMatingRequest,
} from '@/@types/v2/BreedingMating';

// GAP-FE-BM-04 — sentinela de FALLBACK para os campos travados em edição
// (`bull_seed_season`/`protocol`, via `protocol_reference`) quando o
// servidor devolve `null` genuíno (ex. registro legado sem a FK
// preenchida) — desde `TASK-BM-FE-18`, o caminho padrão é o valor REAL
// hidratado (`data.bull_seed_season`/`data.protocol_reference`). Sem o
// sentinela nesse caso de borda, `optionSchema` (Yup, TASK-BM-FE-02)
// receberia `null` num campo `.required()` e BLOQUEARIA o submit para
// SEMPRE (o campo é `isDisabled`, o usuário nunca teria como corrigir). O
// sentinela satisfaz o `.required()` (é um objeto `Option` não-nulo) sem
// fingir um uuid real. `TASK-BM-FE-18` (Passo 4) removeu a omissão
// defensiva desta chave no payload de update para o caso real reportado
// pelo dono (FKs preenchidas) — no caso de borda em que o servidor ainda
// devolve `null` genuíno, o sentinela passaria a ser reenviado como
// `bull_seed_season_uuid`/`protocol_uuid`, o que falharia `Rule::exists`
// (422 diferente do "obrigatório"). Risco residual de borda, aceito por
// desenho nesta Tarefa (ver `TASK-BM-FE-18`, Cenário 4 do Tester) — não é
// o caminho do relato do dono e depende de confirmação separada do
// `field_matrix`/`locked_fields` desse caso com o Arquiteto de API.
export const LOCKED_UNKNOWN_OPTION_VALUE = '__locked_unknown__';

// ============================================
// Defaults (modo criação)
// ============================================

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDefaultAcasalamentoFormValues(): BreedingMatingForm {
  return {
    code: '',
    date: todayIsoDate(),
    responsible_name: '',
    type: null,
    launch_type: null,
    breeding_season: null,
    bull_seed_season: null,
    protocol: null,
    breeding_batch: null,
    natural: { bull: null, cows: [] },
    protocol_animals: [],
    simplified_animals: [],
    protocol_identification: 'DZERO',
  };
}

// ============================================
// Linhas dinâmicas — defaults de `append()` (TASK-BM-FE-05, `useFieldArray`
// dos subcadastros Protocolo/Simplificado, `sections/ProtocolSection.tsx` e
// `sections/SimplifiedSection.tsx`). `uuid: undefined` sempre — é o
// discriminante de criação do round-trip (regra 8 da Tarefa, §6.3.4):
// nenhuma linha nova nasce com uuid, mesmo que o usuário nunca a edite.
// ============================================

/**
 * Nova linha de `protocol_animals` — C11 (contrato de tela §6.3.2,
 * `_forms.blade.php:967-1018`): ao adicionar, copia `provider`
 * (Inseminador) e `semen_or_embryo` (Sêmen/Embrião) da ÚLTIMA linha
 * existente. Comportamento do legado, não conveniência — reproduzido tal
 * qual, sem tentar "melhorar" (não copia `body_score`). `products` nasce com
 * todos os produtos do protocolo da identificação corrente (UT-000705).
 * @param {BreedingMatingProtocolAnimalFormValue | undefined} previousRow - Última linha do `useFieldArray` no momento do `append()` (`undefined` quando é a primeira linha).
 * @param {Option<string>[]} protocolProducts - Produtos do protocolo da identificação corrente, todos pré-selecionados.
 * @return {BreedingMatingProtocolAnimalFormValue} Valores default da nova linha.
 */
export function buildDefaultProtocolAnimalRow(
  previousRow?: BreedingMatingProtocolAnimalFormValue,
  protocolProducts: Option<string>[] = []
): BreedingMatingProtocolAnimalFormValue {
  return {
    uuid: undefined,
    animal: null,
    time: null,
    body_score: null,
    ink: null,
    eligible: true,
    provider: previousRow?.provider ?? null,
    products: [...protocolProducts],
    semen_or_embryo: previousRow?.semen_or_embryo ?? null,
    batch: null,
  };
}

/**
 * Nova linha de `simplified_animals` — sem cópia da linha anterior (C11 é
 * exclusivo do subcadastro de Protocolo, contrato de tela §6.3.2; o
 * Simplificado não tem paridade equivalente descrita).
 * @return {BreedingMatingSimplifiedAnimalFormValue} Valores default da nova linha.
 */
export function buildDefaultSimplifiedAnimalRow(): BreedingMatingSimplifiedAnimalFormValue {
  return {
    uuid: undefined,
    animal: null,
    warehouse: null,
    product: null,
    measurement: null,
    stock: 0,
    quantity: null,
    provider: null,
  };
}

// ============================================
// Hidratação — `BreedingMatingData` (EP-BM-02 / `EP-BM-04.breeding_mating`) → Form
// ============================================

function mapAnimalOptionRefToOption(ref: AnimalOptionRef): Option<string> {
  return { label: ref.code, value: ref.uuid };
}

function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

function mapEntityOptionRefToOptionOrNull(ref: EntityOptionRef | null): Option<string> | null {
  return ref ? mapEntityOptionRefToOption(ref) : null;
}

function mapProtocolAnimalLineToFormValue(
  line: BreedingMatingProtocolAnimalLine,
  languageGB: LanguageDate
): BreedingMatingProtocolAnimalFormValue {
  return {
    uuid: line.uuid,
    animal: mapAnimalOptionRefToOption(line.animal),
    time: line.time ? line.time.slice(0, 5) : null,
    body_score: mapEntityOptionRefToOptionOrNull(line.body_score),
    ink: line.ink ? inkOptions.getOption(line.ink, languageGB) : null,
    eligible: line.eligible,
    provider: mapEntityOptionRefToOptionOrNull(line.provider),
    products: line.products.map(mapEntityOptionRefToOption),
    semen_or_embryo: mapEntityOptionRefToOptionOrNull(line.semen_or_embryo),
    batch: mapEntityOptionRefToOptionOrNull(line.batch),
  };
}

function mapSimplifiedAnimalLineToFormValue(
  line: BreedingMatingSimplifiedAnimalLine
): BreedingMatingSimplifiedAnimalFormValue {
  return {
    uuid: line.uuid,
    animal: mapAnimalOptionRefToOption(line.animal),
    warehouse: mapEntityOptionRefToOption(line.warehouse),
    product: {
      ...mapEntityOptionRefToOption(line.product),
      stock_uuid: line.product.stock_uuid ?? null,
    },
    measurement: mapEntityOptionRefToOption(line.measurement),
    stock: line.stock,
    quantity: line.quantity,
    provider: mapEntityOptionRefToOptionOrNull(line.provider),
  };
}

/**
 * Hidratação completa de edição — consumida por `fillForm` (Lei 2) em
 * `CreateOrUpdateAcasalamento.tsx`. `bull_seed_season`/`protocol` chegam com
 * o valor REAL hidratado de `data.bull_seed_season`/`data.protocol_reference`
 * (`GAP-FE-BM-04`/`TASK-BM-FE-18`), com o sentinela de trava só como
 * fallback quando o servidor devolve `null` genuíno (CLM-002 — ver
 * cabeçalho do arquivo).
 * @param {BreedingMatingData} data - Registro hidratado (`EP-BM-02`/`EP-BM-04.breeding_mating`).
 * @param {LanguageDate} languageGB - Dicionário ativo, para resolver as `Option` de `type`/`launch_type`/`ink`.
 * @param {BreedingMatingLockedFields | undefined} lockedFields - `locked_fields` do contexto do formulário (`EP-BM-04`), quando disponível.
 * @return {BreedingMatingForm} Valores prontos para `reset()`.
 */
export function mapBreedingMatingDataToFormValues(
  data: BreedingMatingData,
  languageGB: LanguageDate,
  lockedFields?: BreedingMatingLockedFields
): BreedingMatingForm {
  // GAP-FE-BM-04 — `bull_seed_season_uuid` é travado em edição sempre que
  // `type !== 1` (header table §6.3; `locked_fields` do servidor tem
  // precedência quando presente). `protocol_uuid` é travado em edição
  // SEMPRE (CLM-002) — só é relevante/obrigatório no schema quando
  // `type !== 1 && launch_type === 1` (Protocolo). Desde `TASK-BM-FE-18`,
  // `data.bull_seed_season`/`data.protocol_reference` trazem o valor REAL
  // (`EP-BM-04.breeding_mating`) sempre que o servidor o tiver; o sentinela
  // só entra como fallback quando o valor real vier `null` (dado legado
  // sem a FK preenchida) — sem ele, os dois ficariam `null` num campo
  // `.required()` do schema (TASK-BM-FE-02) enquanto `isDisabled`,
  // bloqueando o submit para sempre nesses modos.
  const isBullSeedSeasonLocked = lockedFields?.bull_seed_season_uuid ?? data.type.value !== 1;
  const isProtocolRelevant = data.type.value !== 1 && data.launch_type.value === 1;

  return {
    code: data.code,
    date: data.date,
    responsible_name: data.responsible_name,
    type: breedingMatingTypeOptions.getOption(data.type.value, languageGB),
    launch_type: breedingMatingLaunchTypeOptions.getOption(data.launch_type.value, languageGB),
    breeding_season: mapEntityOptionRefToOptionOrNull(data.breeding_season),
    bull_seed_season: data.bull_seed_season
      ? mapEntityOptionRefToOption(data.bull_seed_season)
      : isBullSeedSeasonLocked
        ? { label: '—', value: LOCKED_UNKNOWN_OPTION_VALUE }
        : null,
    protocol: data.protocol_reference
      ? mapEntityOptionRefToOption(data.protocol_reference)
      : isProtocolRelevant
        ? { label: '—', value: LOCKED_UNKNOWN_OPTION_VALUE }
        : null,
    breeding_batch: mapEntityOptionRefToOptionOrNull(data.breeding_batch),
    natural: data.natural
      ? {
          bull: mapAnimalOptionRefToOption(data.natural.bull),
          cows: data.natural.cows.map(mapAnimalOptionRefToOption),
        }
      : { bull: null, cows: [] },
    protocol_animals: data.protocol
      ? data.protocol.animals.map((line) => mapProtocolAnimalLineToFormValue(line, languageGB))
      : [],
    simplified_animals: data.simplified
      ? data.simplified.animals.map(mapSimplifiedAnimalLineToFormValue)
      : [],
    protocol_identification: data.last_protocol_identification ?? 'DZERO',
  };
}

// ============================================
// Payload — Form → `CreateBreedingMatingRequest` / `UpdateBreedingMatingRequest`
// ============================================

function mapProtocolAnimalFormValueToPayload(
  row: BreedingMatingProtocolAnimalFormValue
): CreateOrUpdateBreedingMatingProtocolAnimalPayload {
  return {
    uuid: row.uuid,
    animal_uuid: row.animal!.value,
    time: row.time ? row.time.slice(0, 5) : null,
    body_score_uuid: row.body_score?.value ?? null,
    ink: row.ink?.value ?? null,
    eligible: row.eligible,
    provider_uuid: row.provider?.value ?? null,
    product_uuids: row.products.map((product) => product.value),
    seed_uuid: row.semen_or_embryo?.value ?? null,
    batch_uuid: row.batch?.value ?? null,
  };
}

function mapSimplifiedAnimalFormValueToPayload(
  row: BreedingMatingSimplifiedAnimalFormValue
): CreateOrUpdateBreedingMatingSimplifiedAnimalPayload {
  return {
    uuid: row.uuid,
    animal_uuid: row.animal!.value,
    warehouse_uuid: row.warehouse!.value,
    stock_uuid: row.product!.stock_uuid!,
    measurement_uuid: row.measurement!.value,
    quantity: row.quantity!,
    provider_uuid: row.provider?.value ?? null,
  };
}

/**
 * UT-000788 — nunca envia o sentinela `LOCKED_UNKNOWN_OPTION_VALUE` como
 * uuid: ele existe só para a tela/schema; no payload vira `null` (a API
 * aceita `nullable|uuid` no modo Simplificado).
 * @param {Option<string> | null | undefined} option - Opção do formulário.
 * @return {string | null} uuid real ou `null`.
 */
function toPayloadUuid(option: Option<string> | null | undefined): string | null {
  const value = option?.value;
  return value && value !== LOCKED_UNKNOWN_OPTION_VALUE ? value : null;
}

/**
 * Base comum de create/update — decide os 3 blocos mutuamente exclusivos
 * pela MESMA regra de seleção de seção do contrato de tela §6.3 (nunca
 * hardcoda `field_matrix`; só espelha `type`/`launch_type` já validados
 * pelo schema/servidor).
 * @param {BreedingMatingForm} data - Valores atuais do formulário.
 * @return {CreateBreedingMatingRequest} Payload completo (shape de criação).
 */
function buildBasePayload(data: BreedingMatingForm): CreateBreedingMatingRequest {
  const isNatural = data.type?.value === 1;
  const isSimplified = data.launch_type?.value === 2;
  const isProtocol = !isNatural && !isSimplified;

  return {
    date: data.date,
    type: data.type!.value,
    launch_type: data.launch_type!.value,
    breeding_season_uuid: data.breeding_season?.value ?? null,
    bull_seed_season_uuid: toPayloadUuid(data.bull_seed_season),
    protocol_uuid: toPayloadUuid(data.protocol),
    breeding_batch_uuid: data.breeding_batch?.value ?? null,
    natural: isNatural
      ? {
          bull_uuid: data.natural.bull!.value,
          cow_uuids: data.natural.cows.map((cow) => cow.value),
        }
      : null,
    protocol_animals: isProtocol
      ? data.protocol_animals.map(mapProtocolAnimalFormValueToPayload)
      : null,
    simplified_animals: isSimplified
      ? data.simplified_animals.map(mapSimplifiedAnimalFormValueToPayload)
      : null,
    protocol_identification: isProtocol ? data.protocol_identification : null,
  };
}

/**
 * Monta o payload de criação (`POST /breeding-matings`, `EP-BM-05`).
 * @param {BreedingMatingForm} data - Valores atuais do formulário.
 * @return {CreateBreedingMatingRequest} Payload completo, com os 3 blocos
 * mutuamente exclusivos (`natural`/`protocol_animals`/`simplified_animals`).
 */
export function mapFormValuesToCreatePayload(
  data: BreedingMatingForm
): CreateBreedingMatingRequest {
  return buildBasePayload(data);
}

/**
 * Monta o payload de edição (`PUT /breeding-matings/{uuid}`, `EP-BM-06`).
 * `type`/`protocol_uuid`/`bull_seed_season_uuid` são sempre RESSUBMETIDOS
 * com o valor atual (CLM-002/GAP-FE-BM-15 — o backend confirma imutabilidade
 * em `withValidator`, não trata ausência como "não alterar"). As mitigações
 * defensivas que omitiam `bull_seed_season_uuid` (GAP-FE-BM-04) e
 * `protocol_uuid` (GAP-FE-BM-15, Passo 2) do payload foram REMOVIDAS por
 * `TASK-BM-FE-18` — eram a causa raiz do 422 `"obrigatório"` reportado pelo
 * dono, agora que `mapBreedingMatingDataToFormValues` hidrata os 2 campos
 * com o valor REAL (`EP-BM-04.breeding_mating.bull_seed_season`/
 * `protocol_reference`). Sem nenhuma chave a omitir, o payload de update é
 * hoje idêntico ao de criação — mantido como função própria para o nome
 * continuar documentando a intenção e por segurança de futura divergência.
 * @param {BreedingMatingForm} data - Valores atuais do formulário.
 * @return {UpdateBreedingMatingRequest} Payload de update completo, com todos os campos reenviados.
 */
export function mapFormValuesToUpdatePayload(
  data: BreedingMatingForm
): UpdateBreedingMatingRequest {
  return buildBasePayload(data);
}
