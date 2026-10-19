// src/@types/v2/Sanitaries/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do CRUD RAIZ de Sanitário (Sanitary Record — Operacional > Pecuária >
// Manejo, F-062, TASK-SAN-FE-01). Consome os 12 endpoints NOVOS
// `SanitaryRecordController` (`/sanitaries*`, plural) — CTR-SAN
// (CONTRATO_AUTOAPROVADO, Tester ✅), NÃO os 4 endpoints singulares
// `/sanitary/*` de `SanitaryController` (execução 039, cascata embutida em
// Processamento, `src/@types/v2/Sanitary/` — INTOCADO, ver ADR-FE-SAN-00 do
// contrato de tela §2.1).
//
// Diretório `Sanitaries` (plural) — única disambiguação real de nome desta
// fatia; página/i18n/query-key usam `sanitary` normalmente (sem colisão).
//
// Envelope `ApiResponse {success,message,data,errors,meta}`, `uuid` sempre,
// `id` nunca.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---------------------------------------------------------------------------
// Listagem (`EP-SAN-01`) — `GAP-FE-SAN-01` FECHADO pela TASK-SAN-FE-02: o
// default proposto (Código/Data/Lote/Responsável) foi CONFIRMADO contra o
// código real de `SanitaryListResource` (leitura direta do worktree da API,
// `app/Http/Resources/V1/SanitaryListResource.php`) e DIVERGE — o Resource
// real é deliberadamente enxuto (comentário do próprio arquivo: a query de
// listagem, `SanitaryRepository::listWithFilters()`, NÃO eager-carrega
// `batch`/`user` — mirror da guarda anti-N+1 de `PastureResource`) e devolve
// SOMENTE `uuid`/`code`/`date`/`time_control`/`created_at`. `batch`/
// `responsible` NÃO existem na resposta desta listagem (só no detalhe,
// `SanitaryResource`, fora do escopo desta Tarefa) — ver Histórico da
// TASK-SAN-FE-02 para a divergência completa e o registro em
// `04-Gaps_Frontend_UI/GAP-FE-SAN-01-colunas-da-listagem-sem-manifesto.md`.
// `SanitaryPersonRef`/`SanitaryBatchRef` permanecem — ainda usados por
// `SanitaryDetail` abaixo (EP-SAN-02, fora do escopo desta Tarefa).
// ---------------------------------------------------------------------------
export interface SanitaryPersonRef {
  uuid: string;
  name: string;
}

export interface SanitaryBatchRef {
  uuid: string;
  /** Chave real do Resource é `name` (`SanitaryResource`/`SanitaryListResource` — TASK-SAN-FE-03, correção; NÃO `description`). */
  name: string;
}

export interface SanitaryListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  /** Controla a visibilidade do bloco de Mão de Obra no formulário (IG-09) — único campo de negócio adicional real da listagem. */
  time_control: boolean;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Detalhe (`EP-SAN-02`) — CORRIGIDO pela TASK-SAN-FE-03 por leitura DIRETA do
// código real (`GB.Cerne.Api/app/Http/Resources/V1/SanitaryResource.php`,
// worktree irmão), como a Tarefa determinou (mesmo padrão de correção já
// aplicado pela TASK-SAN-FE-02 para `SanitaryListResource`). O shape
// assumido pela TASK-SAN-FE-01 DIVERGIA em pontos materiais:
//
//   - Campo do responsável é `user` (não `responsible`) — mesma chave do
//     Model/relação Eloquent (`{uuid, name}`).
//   - `batch`/`user` usam a chave `name` (não `description`).
//   - Item (`items[]`) NÃO tem `lot`/`cost_center` — o Resource real devolve
//     `{uuid, product:{uuid,name}, stock:{uuid,quantity,warehouse,measurement},
//     quantity, total_quantity, note}`. `stock_uuid` vem ANINHADO em
//     `stock.uuid`, não como campo solto.
//   - Mão de obra (`labor[]`) NÃO tem `uuid` (nenhum identificador de linha)
//     nem `measurement`; `executor` é uma STRING (`executor_uuid`), não um
//     objeto `{uuid, name}`.
//
// `SanitaryRepository::findByUuidOrFail()` faz eager-load INCONDICIONAL de
// `batch`/`user`/`items.product`/`items.stock`/`items.stock.warehouse`/
// `items.measurement`/`sanitaryAnimals`/
// `laborEntries.{employee,function,provider}` — as 5 chaves (`batch`, `user`,
// `items`, `animals`, `labor`) estão SEMPRE presentes na resposta (arrays
// podem vir vazios; `labor` nunca fica ausente, mesmo com `time_control`
// `false` — o Resource não filtra por esse campo).
//
// CORREÇÃO AO VIVO (dono, 2026-08-28, BUG-SAN-EDIT-01): `items[].stock` agora
// também embute `quantity` (saldo real), `warehouse` e `measurement` — antes
// só devolvia `{uuid}`, e o front caía num fallback hardcoded `quantity: 0`
// ao hidratar o campo de produto em modo editar (`sanitario-form-mapper.ts`),
// causa raiz do bug "estoque sempre insuficiente ao editar". Isso RESOLVE a
// parte de `warehouse_uuid`/`measurement_uuid` (item) do impacto que a
// TASK-SAN-FE-03 tinha registrado abaixo para as Tarefas 28/29 — só
// `cost_center_uuid` (item) e a hidratação de mão de obra
// (`measurement_uuid`/`employee_uuid`/`function_uuid`/`provider_uuid`)
// continuam sem dado equivalente no Resource real e seguem `null` no mapper.
// `SanitaryItemDetail`/`SanitaryLaborDetail` abaixo refletem SÓ o que o
// servidor real devolve.
// ---------------------------------------------------------------------------
export interface SanitaryItemDetail {
  uuid: string;
  product: { uuid: string; name: string } | null;
  /**
   * Linha de `Stock` (produto+armazém+lote) — `quantity`/`warehouse`/
   * `measurement` hidratam a cascata Armazém/Estoque/UM em modo editar
   * (correção ao vivo, BUG-SAN-EDIT-01); `measurement` vem de
   * `item.measurement` no backend (UM do item, não do `Stock`), mas chega
   * aninhado aqui em `stock.measurement` (mesmo formato usado no modo criar,
   * ver `sanitario-form-mapper.ts`). Sem `lot` (não devolvido).
   */
  stock: {
    uuid: string;
    quantity: number;
    warehouse: { uuid: string; name: string } | null;
    measurement: { uuid: string; name: string } | null;
  } | null;
  /** Dose por animal — único campo editável de quantidade (FI-06). */
  quantity: number;
  /** Total calculado no servidor (`quantity × nº animais`) — somente leitura (FI-07, `DECISAO_DE_ESCOPO`). */
  total_quantity: number;
  note: string | null;
}

/** `func_type` (`SanitaryLaborItemData` backend) — 1=Funcionário, 2=Função, 3=Fornecedor (FS-01). */
export type SanitaryLaborFuncTypeValue = 1 | 2 | 3;

export interface SanitaryLaborDetail {
  /**
   * SEM identificador de linha — `SanitaryResource::toArray()` real não expõe
   * `uuid` por entrada de `laborEntries` (round-trip por posição seria
   * necessário aqui, divergindo da estratégia por `row_uuid` do resto do
   * form; decisão de arquitetura da Tarefa 29, não desta).
   */
  func_type: SanitaryLaborFuncTypeValue | null;
  /** uuid FLAT do executor (funcionário/função/fornecedor conforme `func_type`) — NÃO um objeto `{uuid, name}`. */
  executor_uuid: string | null;
  executor?: { uuid: string; name: string } | null;
  measurement?: { uuid: string; name: string; description: string | null } | null;
  total_quantity: number;
  /**
   * Calculado 100% no servidor a partir do cadastro do executor — nunca
   * digitado nem editável no cliente (CTR-SAN §4.1). Exposto SÓ na
   * visualização/detalhe (`san-screen-show`), NUNCA no form de criação/edição
   * (Regra 3 da Tarefa).
   */
  amount: number;
}

export interface SanitaryAnimalDetail {
  uuid: string;
  identification: string;
}

export interface SanitaryDetail {
  uuid: string;
  code: string;
  date: string;
  time_control: boolean;
  /** Chave real do Resource é `user`, não `responsible` (TASK-SAN-FE-03, correção). */
  user: SanitaryPersonRef | null;
  /** `batch.name`, não `batch.description` (TASK-SAN-FE-03, correção). */
  batch: SanitaryBatchRef | null;
  animals: SanitaryAnimalDetail[];
  items: SanitaryItemDetail[];
  /** Sempre presente (eager-load incondicional) — pode vir `[]` mesmo com `time_control=true` se não houver linhas cadastradas. */
  labor: SanitaryLaborDetail[];
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Contexto de formulário — `code` é SEMPRE gerado atomicamente dentro de
// `POST /sanitaries` (`pg_advisory_xact_lock`, CTR-SAN §4 `nextCode()`), sem
// endpoint de pré-visualização entre os 12 `EP-SAN-*` (`CONTRATO_AUTOAPROVADO`,
// Tester ✅ — nenhum deles devolve `next_code`) — mesma decisão já aplicada a
// `Weaning` (`code` em branco + hint "Gerado ao salvar",
// `languageWeaning.form.hints.codeGeneratedOnSave`, mirror direto aqui em
// `languageSanitary.form.hints.codeGeneratedOnSave`). `next_code` fica SEMPRE
// `null` pré-submit — isto NÃO é uma integração pendente/mock (Regra "SEM
// MOCK"), é fidelidade ao contrato de API já testado: não existe endpoint a
// chamar. `lookups` documenta que Lote/Animal/Funcionário/Função/Fornecedor
// são resolvidos por SERVIÇOS JÁ EXISTENTES reusados fora deste módulo
// (contrato-tela §5.4: `GET /animals/options?batch_uuid=`,
// `GET /employees/options`, `GET /functions/options`,
// `GET /providers/options`) — nunca chamados por `sanitaries-service.ts`
// (ver `getSanitaryFormContext` no service, função client-side, sem rede).
// ---------------------------------------------------------------------------
export interface SanitaryFormContext {
  next_code: null;
  lookups: {
    animals: 'GET /animals/options?batch_uuid=';
    employees: 'GET /employees/options';
    functions: 'GET /functions/options';
    providers: 'GET /providers/options';
  };
}

// ---------------------------------------------------------------------------
// Form values (react-hook-form, `Option<T>` para os Selects) — round-trip por
// `row_uuid` de linha (`useFieldArray`), melhoria aceita (CTR-SAN §5), NÃO
// por posição (legado FI-11/OQ-07, campo morto/`old_sanitaries[]`).
// ---------------------------------------------------------------------------
export interface SanitaryStockFieldOption extends Option<string> {
  /** uuid do PRODUTO puro (cascata de Un.Medida, `EP-SAN-12`) — NUNCA confundir com `value` (uuid do `Stock`, vira `stock_uuid` no submit). */
  product_uuid: string;
  quantity: number;
  lot: string | null;
  measurement?: { uuid: string; name: string; description: string } | null;
  measurement_second?: { uuid: string; name: string; description: string } | null;
  factor?: number | null;
  factor_type?: 'M' | 'D' | null;
}

export interface SanitaryItemFormValue {
  /** `useFieldArray` id da linha já existente — presente = update, ausente = criação (round-trip por uuid, CTR-SAN §5). */
  row_uuid?: string;
  warehouse_uuid: Option<string> | null;
  /** Opção = linha de `Stock` (produto+lote), mirror `FeedlotCorralSanitaryStockOption`. */
  product: SanitaryStockFieldOption | null;
  measurement_uuid: Option<string> | null;
  quantity: number | '';
  cost_center_uuid: Option<string> | null;
  note: string;
}

/**
 * Payload de item (`SanitaryItemData` backend, CTR-SAN §3). `stock_uuid`
 * identifica a linha física de estoque (produto+armazém+lote) — NÃO existe
 * campo "produto" puro solto no payload. **NÃO tem `total_quantity`** — o
 * servidor calcula (`quantity × nº animais`), Regra 2 da Tarefa.
 */
export interface SanitaryItemPayload {
  warehouse_uuid: string;
  product_uuid: string;
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  cost_center_uuid?: string;
  note?: string | null;
}

export interface SanitaryLaborFormValue {
  row_uuid?: string;
  func_type: Option<SanitaryLaborFuncTypeValue> | null;
  employee_uuid: Option<string> | null;
  function_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  total_quantity: number | '';
}

/**
 * Payload de mão de obra (`SanitaryLaborItemData` backend, CTR-SAN §3).
 * **NÃO tem `amount`** — nunca digitado nem calculado no cliente (Regra 3 da
 * Tarefa; CTR-SAN §4.1, servidor lê de `Employee.vl_time_productive`/
 * `Functions.vl_time_productive`/`Provider.hour_value`).
 */
export interface SanitaryLaborPayload {
  func_type: SanitaryLaborFuncTypeValue;
  executor_uuid: string;
  measurement_uuid: string;
  total_quantity: number;
}

/**
 * Payload de submit (`SanitaryData` backend, CTR-SAN §3, `EP-SAN-03`/
 * `EP-SAN-04`). `labor` é OMITIDO (chave ausente), NÃO `[]` vazio, quando
 * `time_control=false` — mirror `Optional` do backend (Regra 4 da Tarefa).
 */
export interface SaveSanitaryRequest {
  batch_uuid: string;
  date: string;
  time_control: boolean;
  animal_uuids: string[];
  items: SanitaryItemPayload[];
  labor?: SanitaryLaborPayload[];
}

/**
 * Valores do `useForm<SanitaryFormValues>` da casca `CreateOrUpdateSanitario.tsx`
 * (TASK-SAN-FE-03) — `san-form-main`. `code`/`responsible_name` NÃO são
 * campos deste tipo (Regras 1/2 da Tarefa: sempre `InputReadOnly`, nunca no
 * payload, nunca no estado do RHF — só props de display resolvidas fora do
 * form). `items`/`labor` já reservam o shape que as Tarefas 28/29 vão
 * popular via `useFieldArray` — esta Tarefa só garante que o array exista
 * com o formato certo para o schema Yup (`sanitary-schema.ts`) validar.
 */
export interface SanitaryFormValues {
  date: string | null;
  batch_uuid: Option<string> | null;
  time_control: boolean;
  animal_uuids: Option<string>[];
  items: SanitaryItemFormValue[];
  labor: SanitaryLaborFormValue[];
  /**
   * Só usado por `CreateSanitariesMultipleDialog.tsx` (TASK-SAN-FE-07,
   * ADR-FE-SAN-01, contrato-tela §6.7) — Lotes selecionados no `SelectMulti`
   * de agregação de animais elegíveis. Campo OPCIONAL e ausente/`undefined`
   * na casca `CreateOrUpdateSanitario.tsx` (create/edit, TASK-SAN-FE-03) —
   * adicionado aqui (em vez de um tipo de form values próprio) para permitir
   * reuso 1:1 de `SanitaryItemsSection`/`SanitaryItemRow` (`Control<SanitaryFormValues>`)
   * pelo diálogo, sem duplicar aqueles componentes (Regra 3 da Tarefa 31).
   */
  batch_uuids?: Option<string>[];
}

export interface SanitaryFilterRequest {
  batch_uuid?: string;
  user_uuid?: string;
}

/**
 * Filtro da listagem (`san-filter-form`, TASK-SAN-FE-02) — `SanitaryFilterRequest`
 * + companions DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
 * (`batch_label`/`user_label`), mirror `WeaningFilterForm`/`WeaningFilterRequest`.
 * Nunca enviados ao servidor — o service só lê `batch_uuid`/`user_uuid`.
 */
export interface SanitaryFilterForm extends SanitaryFilterRequest {
  batch_label?: string;
  user_label?: string;
}

// ---------------------------------------------------------------------------
// Criação múltipla (`EP-SAN-06`, `storeMultiple`, ADR-FE-SAN-01) — mirror
// ESTRUTURAL de `@types/v2/FeedlotMap/sanitary.ts` (`SaveMultipleSanitariesRequest`/
// `SanitaryItemPayload` daquele módulo já NÃO têm `cost_center_uuid`, Regra
// da Tarefa confirma essa ausência — nenhuma mudança de shape necessária ali).
//
// ADAPTAÇÃO desta fatia (raiz de Sanitário, NÃO o diálogo do Mapa de
// Confinamento): o fluxo agrega animais de 1+ LOTES (`contrato-tela §6.7`,
// `SelectMulti` de Lotes → união client-side dos elegíveis) e o servidor faz
// fan-out em N `Sanitary` (1 por lote distinto dos animais selecionados,
// `CTR-SAN §4` `CreateSanitaryRecordAction`) — por isso **`batch_uuid` NÃO
// entra no payload** (o servidor deriva o lote de cada animal, não o
// cliente). `date` é obrigatório (campo sempre presente na entidade, FD-02).
//
// CORREÇÃO da TASK-SAN-FE-07 (leitura DIRETA do código real da API, worktree
// irmão `GB.Cerne.Api` — `app/Http/Requests/Api/V1/SanitaryMultipleRequest.php`
// + `app/Actions/Sanitary/StoreSanitaryMultipleAction.php`, exigida pelo
// task-packet desta Tarefa antes de codar):
//
//   - `time_control` **É obrigatório** no Form Request real
//     (`'time_control' => ['required', 'boolean']`) — a nota "NUNCA é
//     enviado" desta fundação (TASK-SAN-FE-01) estava incompleta: o campo
//     PRECISA estar presente no payload (chave sempre enviada), só o VALOR
//     é sempre fixo `false` (mirror "Sem bloco de mão de obra" do
//     contrato-tela §6.7 — a Tarefa 31 fixa `time_control: false` no
//     payload, nunca omite a chave).
//   - Resposta real de `SanitaryRecordController::storeMultiple()`:
//     `ApiResponse::created(SanitaryResource::collection($sanitaries), ...)`
//     — `data` é um array de `SanitaryResource` (MESMO shape de
//     `SanitaryDetail`, usado pelo detalhe `GET /sanitaries/{uuid}`), NÃO o
//     objeto `{sanitaries, warnings}` que esta fundação especulava (cópia
//     estrutural equivocada de um contrato ainda não lido byte-a-byte). Não
//     existe campo `warnings` na resposta real — `SaveMultipleSanitariesResponseData`
//     foi removida; o service tipa o retorno direto como `SanitaryDetail[]`.
// ---------------------------------------------------------------------------
export interface SanitaryMultipleItemPayload {
  warehouse_uuid: string;
  product_uuid: string;
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  note?: string | null;
}

export interface SaveMultipleSanitariesRequest {
  date: string;
  /** Sempre `false` (mirror "Sem bloco de mão de obra" do contrato-tela §6.7) — a CHAVE é obrigatória no Form Request real, só o valor é fixo. */
  time_control: boolean;
  animal_uuids: string[];
  items: SanitaryMultipleItemPayload[];
}
