// src/@types/v2/Animals/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de REBANHO (Animal — Cadastros Base / Pecuários, execução
// 027). RECONCILIADO INTEGRALMENTE contra o backend REAL (`GAP-FE-203`,
// resolução 2026-08-03) — leitura direta de `AnimalResource.php`/
// `AnimalRequest.php`/`AnimalIndexRequest.php`/`Store|UpdateAnimalAction.php`/
// `AnimalData.php`/`AnimalFilterData.php` em `api_root`. As Tarefas originais
// (`TASK-FE-880/881/882/883`) assumiram nomes de campo ANTES do backend
// fechar e nunca bateram; `TASK-FE-884/885/886` já haviam corrigido
// Genealogia/Reprodutivo/Bezerro/Depreciação — esta resolução do Gap corrige
// o que sobrava (Dados Básicos/Pesos-Valores/Listagem/Filtro).
//
//   GET    /api/v1/animals            → data: AnimalListItem[], paginação REAL
//                                        (meta), farm-scoped (X-Farm-Id
//                                        OBRIGATÓRIO — diferente dos catálogos
//                                        globais vizinhos: Species/Breed/
//                                        CategoryAnimal/CategoryMatrix/
//                                        IdentificationType). Filtros reais:
//                                        `search`/`category_id`/`batch`
//                                        (`AnimalIndexRequest`), NÃO
//                                        `category_uuid`/`batch_uuid`.
//   GET    /api/v1/animals/{uuid}     → data: AnimalData
//   POST   /api/v1/animals            → payload AnimalPayload
//   PUT    /api/v1/animals/{uuid}     → payload AnimalPayload — `type`/
//                                        `start_weight` IMUTÁVEIS (nunca
//                                        reenviados como editáveis)
//   DELETE /api/v1/animals/{uuid}     → 204; sem guarda de FK confirmada
//                                        (RN-9 legado, Doc Bruta) — `onError`
//                                        genérico
//   GET    /api/v1/animals/download   → blob (planilha-modelo, 4 abas)
//   POST   /api/v1/animals/import     → multipart, resultado AnimalImportResult
//   GET    /api/v1/animals/export     → blob
//
// RECONCILIAÇÃO REAL (`GAP-FE-203`, 2026-08-03) — 4 achados corrigidos aqui:
// 1) Listagem/Detalhe: `AnimalResource` devolve `identification` (string JÁ
//    concatenada, accessor do Model) + `id_animals[]` ({uuid, description,
//    identification}, pivot real) — NUNCA o array `identifications[]` com
//    `identification_type_uuid`/`identification_type_label` que
//    `TASK-FE-880/881` assumiam. `category` é `{uuid, label}`, sem
//    `description`/`is_reproductive`.
// 2) Detalhe: `specie`/`breed` vêm ANINHADOS `{uuid, label}` (mesma forma de
//    `category`/`categoryMatrix`), NÃO como uuid cru (`specie_uuid`/
//    `breed_uuid`) como `CreateOrUpdateAnimal.tsx` assumia (GET extra
//    desnecessário, removido). `photo` (não `photo_url`) — valor é o path
//    relativo cru do disco `public`; VEREDITO do Arquiteto de API
//    (`TASK-BE-893`): permanente, não vai mudar — mesma convenção de
//    `ProfileResource`/`UserResource`/`MeResource` (chave `photo`), front
//    replica o mesmo tratamento (consumo cru, sem montar URL) já usado em
//    `UserForm.photo` — ver nota em `AnimalData.photo` abaixo.
// 3) Escrita: `AnimalRequest::rules()` valida `category_id`/`specie_id`/
//    `breed_id` (chave com sufixo `_id`, valor é uuid) e
//    `identifications.*.id_animal_uuid` — não `category_uuid`/`specie_uuid`/
//    `breed_uuid`/`identification_type_uuid` como `TASK-FE-882` enviava.
// 4) Escrita: `price_arroba_alive`/`value_unitary`/`unity_animal_ua` são
//    `required` em AMBOS os verbos — o front OMITIA os 3 (decisão original
//    "nunca editável, só preview"), causando 422 garantido. Agora enviados
//    CLIENT-SIDE calculados (mesmo padrão já usado para `vl_residual`/
//    `vl_depreciate` — `StoreAnimalAction` sempre recalcula e IGNORA
//    (RN-2/GAP-BE-421), `UpdateAnimalAction` grava exatamente o que veio,
//    sem recalcular, GAP-BE-422).
// 5) Listagem (`TASK-BE-893`, 2026-08-03, fecha `GAP-FE-203`): `batch:
//    {uuid, label} | null` agora existe em `AnimalResource::toArray()` — SÓ
//    no `index()`; `show()` sempre devolve `null` (Lote não é editável neste
//    CRUD, mesma regra do legado). Coluna "Lote" RESTAURADA na grid
//    (`Rebanho/index.tsx`, 7ª coluna) — ver `AnimalListItem.batch`/
//    `AnimalBatchRef`.
//
// Campos MORTOS confirmados pela Doc Bruta — EXCLUÍDOS de todos os tipos
// abaixo (nunca replicar): `sub_category_id`, `productionsystem`,
// `value_average`, `value_residual`, `pregnancy_date`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS
// ============================================

/**
 * `single` = "Individual" | `no_id` = "Sem Identificação". Ambos persistem
 * `type='single'` no banco legado — a distinção real está em como o pivot de
 * identificação é montado (RN-1/RN-3 da Doc Bruta). IMUTÁVEL após criação
 * (readonly no form de edição, TASK-882).
 */
export type AnimalType = 'single' | 'no_id';

/** 1=Prenha, 2=Vazia, 3=Parida (fábrica `reproductive-status-options.ts`). */
export type AnimalReproductiveStatus = 1 | 2 | 3;

/**
 * `status` (Tarefa 26, FM-04) — `A`=Ativo, `P`=Pendente, `D`=Morto, `L`=Perdido,
 * `S`=Vendido, `R`=Excluído. Fonte: `app/Enums/AnimalStatus.php` (api_root).
 * Fábrica `animal-status-options.ts`.
 */
export type AnimalStatusValue = 'A' | 'P' | 'D' | 'L' | 'S' | 'R';

/**
 * `origin` (Tarefa 26, FM-05) — `B`=Nascimento, `P`=Processamento,
 * `C`=Cadastro. Fonte: `AnimalIndexRequest::rules()` (`in:B,P,C`). Fábrica
 * `animal-origin-options.ts`.
 */
export type AnimalOrigin = 'B' | 'P' | 'C';

/**
 * Bloco Depreciação (§3.4.7) — `depreciation_type` NÃO tem `Rule::enum()` no
 * backend (`AnimalRequest::rules()` valida só `integer`, sem lista fechada)
 * — mas o legado (`_forms.blade.php`, `trad.fb_resid_cv1`/`fb_resid_sv1`) só
 * oferece 2 opções, mesma convenção JÁ CONFIRMADA de
 * `FamilyEquipmentDepreciationType` (`residual` obrigatório só quando
 * `=== 1`, "C/Vl. Residual"). Fábrica `depreciation-type-options.ts`.
 */
export type AnimalDepreciationType = 0 | 1;

// ============================================
// ANIMAL (resposta da API)
// ============================================

/**
 * FK aninhada `{uuid, label}` — leitura direta de `AnimalResource::toArray()`
 * (`GAP-FE-203`, resolução 2026-08-03): o Resource real NÃO ecoa
 * `description`/`is_reproductive` nesta FK (achado que invalidou a premissa
 * de `TASK-FE-882`). `_category_is_reproductive` (bloco Reprodutivo,
 * `animal-schema.ts`) é hidratado por um GET dedicado a `CategoryAnimal` em
 * `fillAnimalForm` (`resolveCategoryAnimalMeta`, já correto desde
 * `TASK-FE-884`) — não depende mais desta interface.
 */
export interface AnimalCategoryRef {
  uuid: string;
  label: string;
}

/**
 * `batch` (`AnimalResource::toArray()`, `TASK-BE-893`) — FK aninhada
 * `{uuid, label}`, mesma forma de `category`/`specie`/`breed`. Exposta SÓ em
 * `index()` (listagem); `show()` sempre devolve `batch: null` — o vínculo com
 * Lote NÃO é editável neste CRUD (mesma regra do legado, `agro365/resources/
 * views/animals/index.blade.php` só EXIBE `$item->batch`, nunca um campo do
 * form). Ausência = `null`, sem texto — quem decide o texto de exibição
 * ("Sem lote") é o front (`table.batchEmpty`, i18n), nunca o backend.
 */
export interface AnimalBatchRef {
  uuid: string;
  label: string;
}

/**
 * Uma linha de `id_animals[]` (`AnimalResource::toArray()`, leitura direta,
 * `GAP-FE-203`) — pivot `animal_id_animal` já resolvido pelo backend.
 * `uuid`/`description` = o `IdentificationType` (tipo da identificação,
 * "Brinco"/"Sem Identificação"/etc.), `identification` = o texto gravado no
 * pivot para ESTE animal. Nome do array no Resource é `id_animals` (o nome
 * físico da tabela legada — a rota do domínio é `/identification-types`, mas
 * a tabela nunca foi renomeada), NÃO `identifications` como `TASK-FE-880/881`
 * haviam assumido.
 */
export interface AnimalIdentificationItem {
  uuid: string;
  description: string;
  identification: string;
}

export interface AnimalListItem {
  uuid: string;
  type: AnimalType;
  category: AnimalCategoryRef;
  /**
   * String JÁ concatenada pelo accessor do Model
   * (`Animal::getIdentificationAttribute()`) — "S/ID" quando o animal não
   * tem nenhum `idAnimals` vinculado. `GAP-FE-203`: o Resource real NUNCA
   * devolve um array `identifications[]` como `TASK-FE-881` assumia — é
   * sempre esta string pronta (mesma chave usada tanto em `index()` quanto
   * `show()`, `AnimalResource` é o mesmo Resource para as duas rotas).
   */
  identification: string;
  /** Pivot real `animal_id_animal` — ver `AnimalIdentificationItem`. Vazio só quando `idAnimals` está vazio (nunca acontece de fato — o backend sempre grava ao menos "S/ID"). */
  id_animals: AnimalIdentificationItem[];
  weight: number;

  /**
   * `TASK-BE-893` (resposta ao Achado 3 de `GAP-FE-203`) — `AnimalResource`
   * passou a expor `batch: {uuid, label} | null` SÓ no `index()` (listagem).
   * `show()` sempre devolve `null` — Lote não é editável neste CRUD, igual
   * ao legado. Coluna "Lote" RESTAURADA na grid (`Rebanho/index.tsx`, 7ª
   * coluna, posição do legado entre Categoria e Peso), com fallback i18n
   * (`table.batchEmpty`) quando `null` — mirror `{{ $item->batch ?? 'Sem
   * lote' }}` de `agro365/resources/views/animals/index.blade.php`.
   */
  batch: AnimalBatchRef | null;

  /**
   * Tarefa 26 (LM-12) — sempre presente, fora de `whenLoaded`
   * (`AnimalResource.php:58`). Fábrica `animal-status-options.ts`.
   */
  status: AnimalStatusValue;
  /**
   * Tarefa 26 (LM-14) — sempre presente, fora de `whenLoaded`
   * (`AnimalResource.php:59`). `null` → coluna exibe `table.reproductiveStatusEmpty`
   * ("N/I", i18n). Fábrica `reproductive-status-options.ts` (já existente).
   */
  reproductive_status: AnimalReproductiveStatus | null;
}

// `show` acrescenta TODOS os campos de escrita/leitura do form (blocos do
// Contrato §3.4).
//
// RECONCILIAÇÃO REAL (TASK-FE-884/885, 2026-08-03) — leitura direta de
// `AnimalResource.php`/`AnimalRequest.php`/`Store|UpdateAnimalAction.php` no
// `api_root` (a Doc Bruta/Contrato tinham vários pontos `[A CONFIRMAR]`,
// agora resolvidos pela evidência do código real do backend já entregue):
//
// 1) Genealogia (§3.4.4) — `GAP-BE-426` REVERTIDO no E2E (Contrato §19,
//    TASK-FE-901): `AnimalResource` voltou a devolver `mother`/`father` como
//    TEXTO LIVRE cru (não mais o objeto aninhado `mother_animal`/
//    `father_animal` via `mom()`/`dad()` que a Opção B introduzira).
//    Escrita usa as mesmas chaves `mother`/`father` (`AnimalRequest::rules()`
//    pós-reversão, `TASK-BE-903`) — sem regra de existência (RN-4, texto
//    livre pode não casar com nenhum animal, o backend resolve o vínculo
//    internamente por busca textual e grava `null` silenciosamente se não
//    achar, mas o texto digitado é sempre gravado).
// 2) Estágio Reprodutivo (§3.4.5) — `AnimalResource` devolve `categoryMatrix:
//    {uuid, label} | null` (aninhado), não `category_matrice_uuid` flat.
//    Escrita usa `category_matrice_id` (valor é uuid, nome da chave preserva
//    o `_id` do legado — mesma convenção de `category_id`/`specie_id`/
//    `breed_id` abaixo).
// 3) Bezerro (§3.4.6) — `AnimalResource` NÃO tem NENHUMA chave `child`: o
//    bezerro é uma segunda LINHA de `Animal` (`animal_mother_id` apontando
//    para o pai), criada só por `StoreAnimalAction::createChildIfComplete()`
//    — `UpdateAnimalAction` não lê nem processa `child` (achado real,
//    confirmado por leitura direta do método, TASK-FE-884). Por isso `child`
//    NÃO existe em `AnimalData` (nada para hidratar no GET) e o bloco
//    Bezerro do formulário só é renderizado em modo CRIAÇÃO
//    (`CreateOrUpdateAnimal.tsx`) — na escrita, a chave correta do campo de
//    tipo de identificação é `child.id_animal_uuid` (`AnimalData.php`/
//    `AnimalRequest::rules()`), não `child.identification_type_uuid`.
// 4) Depreciação (§3.4.7) — `AnimalResource` devolve um objeto ANINHADO
//    `depreciation: {...}` (não campos flat no topo). Contagem de campos
//    CONFIRMADA por `AnimalRequest::rules()` (fonte mais autoritativa que o
//    `_forms.blade.php` legado, que ainda exibia os 2 campos mortos):
//    **7 campos escreváveis** — `depreciation_type`, `vl_acquisition`,
//    `residual`, `depreciation`, `life_bens` (5 inputs reais) +
//    `vl_residual`/`vl_depreciate` (2 calculados CLIENT-SIDE mas ENVIADOS ao
//    servidor — `Store|UpdateAnimalAction` gravam exatamente o que o
//    cliente mandou, "client-supplied, sem recálculo", nunca os recalculam).
//    `vl_depreciated`/`sd_depreciate` são exibidos em LEITURA (auditoria/
//    histórico) mas **NÃO existem em `AnimalRequest::rules()`** — mortos na
//    escrita, GAP-BE-428 confirma que `has_depreciation` não existe. Front
//    NUNCA os edita, só os expõe como leitura opcional se necessário.
//
// `GAP-FE-203` RESOLVIDO (2026-08-03) — Dados Básicos/Pesos-Valores/
// Listagem/Filtro (território de `TASK-FE-880/881/882/883`) reconciliados
// contra o backend real nesta resolução, mesmo padrão de fidelidade já
// aplicado a Genealogia/Reprodutivo/Bezerro/Depreciação por
// `TASK-FE-884/885/886`. Ver `AnimalPayload`/`AnimalData`/`AnimalFilterForm`
// abaixo para o detalhe campo a campo.

export interface AnimalMatrixRef {
  uuid: string;
  label: string;
}

/** Objeto aninhado `depreciation` de `AnimalResource` — leitura completa (9
 * chaves, inclui as 2 mortas na escrita, `vl_depreciated`/`sd_depreciate`,
 * só para eventual exibição/auditoria — NUNCA editadas). */
export interface AnimalDepreciationRef {
  depreciation_type: AnimalDepreciationType | null;
  vl_acquisition: number | null;
  residual: number | null;
  depreciation: number | null;
  vl_depreciated: number | null;
  sd_depreciate: number | null;
  life_bens: number | null;
  vl_residual: number | null;
  vl_depreciate: number | null;
}

export interface AnimalData extends AnimalListItem {
  /**
   * ANINHADO `{uuid, label}` (`GAP-FE-203`) — mesma forma de `category`/
   * `categoryMatrix`, NÃO uma string uuid crua como `TASK-FE-882` assumia.
   * `breed` pode ser `null` só defensivamente (o Resource usa `whenLoaded`);
   * `breed_id` é `required` na escrita, então sempre presente na prática.
   */
  specie: AnimalMatrixRef;
  breed: AnimalMatrixRef | null;
  entry_date: string;
  /** Só relevante quando `type === 'single'` (classe `single-animal` do legado). */
  birth_date: string | null;
  /** READONLY — imutável após criação, nunca reenviado como editável (§3.4.3). */
  start_weight: number;
  price_kilo_alive: number;
  /** READONLY — preview `weight × price_kilo_alive` (§3.4.3). */
  value_unitary: number;
  /** READONLY — preview `weight / 450` (§3.4.3). */
  unity_animal_ua: number;
  /** READONLY — preview `price_kilo_alive × 30` (§3.4.3). */
  price_arroba_alive: number;
  fur_description: string | null;
  note: string | null;
  /**
   * `photo` é o path relativo cru do disco `public` (não usar como `src`).
   * Execução 085: `AnimalResource` passou a devolver `photo_url` (URL
   * absoluta) — é ela que o preview consome.
   */
  photo: string | null;
  /** URL absoluta (APP_URL/storage/<path>) — usar para preview; `photo` permanece o path relativo cru. */
  photo_url?: string | null;

  // ---- Genealogia (§3.4.4) — TEXTO LIVRE cru, GAP-BE-426 REVERTIDO
  // (Contrato §19, TASK-FE-901/TASK-BE-905) — ver nota de reconciliação
  // acima. ----
  mother: string | null;
  father: string | null;

  // ---- Estágio/Status Reprodutivo (§3.4.5) — nested ----
  categoryMatrix: AnimalMatrixRef | null;
  reproductive_status: AnimalReproductiveStatus | null;
  /** Editável só quando `reproductive_status === 1` (Prenha). */
  birth_forecast: string | null;

  // ---- Depreciação (§3.4.7) — nested, ver nota de reconciliação acima ----
  depreciation: AnimalDepreciationRef;
}

// ============================================
// ENVELOPE PAGINADO (mirror `BreedsListEnvelope`)
// ============================================

export interface AnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface AnimalsListEnvelope {
  success: boolean;
  message: string;
  data: AnimalListItem[];
  errors: Record<string, string[]> | null;
  meta: AnimalsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

// Campos de escrita de `AnimalData`, EXCLUINDO os readonly/calculados — NUNCA
// enviados pelo front (mirror `vl_time_productive` de `FunctionPayload`):
// `start_weight` NUNCA aparece aqui (imutável). `price_arroba_alive`/
// `value_unitary`/`unity_animal_ua` SÃO enviados (ver nota abaixo, `GAP-FE-203`
// Achado 2) apesar de serem campos READONLY na UI — são `required` no
// `AnimalRequest::rules()` em AMBOS os verbos.
export interface AnimalPayload {
  type: AnimalType;
  /**
   * TASK-FE-882 — criação em lote (Contrato §5, Opção B CONFIRMADA pelo dev
   * via `GAP-BE-425`: o backend já implementa bulk-insert de N linhas
   * idênticas em `StoreAnimalAction`, testado). Só enviado na CRIAÇÃO quando
   * `type = "no_id"` — `undefined` em todos os demais casos (edição nunca
   * envia `quantity`, o bulk-create não se aplica a um registro já existente).
   */
  quantity?: number;
  // `GAP-FE-203` Achado 1 — nomes de chave EXATOS de `AnimalRequest::rules()`
  // (`category_id`/`specie_id`/`breed_id`, sufixo `_id` embora o VALOR seja
  // um uuid — mesma convenção de `category_matrice_id`). `TASK-FE-882`
  // enviava `specie_uuid`/`category_uuid`/`breed_uuid`, que o backend real
  // NUNCA aceitou (chave ausente → `Optional`/`null` → 422 "campo
  // obrigatório" nos 3, já que são `required` sem default).
  specie_id: string;
  category_id: string;
  breed_id: string | null;
  entry_date: string;
  birth_date: string | null;
  /** `id_animal_uuid` (não `identification_type_uuid`, `GAP-FE-203` Achado 1 — mesma convenção de `child.id_animal_uuid`, já corrigida em `TASK-FE-884`). */
  identifications: { id_animal_uuid: string; identification: string }[];
  weight: number;
  price_kilo_alive: number;
  /**
   * `GAP-FE-203` Achado 2 — `AnimalRequest::rules()` exige os 3 como
   * `required|numeric` em AMBOS os verbos; `TASK-FE-883` os excluía
   * DELIBERADAMENTE do payload ("preview client-side, nunca editável"), o
   * que causava 422 garantido (chave ausente, campo `required`). Calculados
   * aqui com a MESMA fórmula do preview `InputReadOnly`
   * (`price_kilo_alive × 30`/`weight × price_kilo_alive`/`weight / 450`) e
   * ENVIADOS — mesmo padrão já usado para `vl_residual`/`vl_depreciate`
   * (Bloco Depreciação, `TASK-FE-885`): `StoreAnimalAction` sempre
   * recalcula e IGNORA o valor recebido (RN-2/GAP-BE-421 — o client-supplied
   * aqui não tem efeito no create, mas precisa existir para passar a
   * validação `required`), `UpdateAnimalAction` grava exatamente o que veio,
   * sem recalcular (GAP-BE-422).
   *
   * `GAP-BE-472` `[AVALIADO]` (Contrato §19.3, TASK-FE-905) — na EDIÇÃO este
   * campo volta a ser EDITÁVEL pelo usuário (mirror do legado, coerência com
   * `UpdateAnimalAction`/GAP-BE-422 acima, que já grava o valor do cliente
   * sem recalcular); na CRIAÇÃO continua só o preview calculado
   * (`StoreAnimalAction` sempre recalcula e ignora, RN-2/GAP-BE-421).
   */
  price_arroba_alive: number;
  value_unitary: number;
  unity_animal_ua: number;
  fur_description: string | null;
  note: string | null;
  /**
   * TASK-FE-882 — arquivo novo selecionado nesta sessão (multipart, mirror
   * `MarkerPayload.icon`/`UserPayload.photo`). `undefined`/`null` preserva a
   * foto atual no servidor (nunca reenviada); o service (`animal-service.ts`)
   * monta o `FormData` a partir daqui.
   */
  photo?: File | null;
  /** Remove a foto atual (mirror comportamento do legado — remove o arquivo antigo do storage). */
  remove_image?: boolean;

  // Genealogia (§3.4.4) — GAP-BE-426 REVERTIDO (Contrato §19,
  // TASK-FE-901/TASK-BE-903): `mother`/`father` voltam a ser TEXTO LIVRE
  // (`string`), sem regra de existência — o backend tenta casar o texto com
  // um animal ativo da mesma fazenda e vincula por baixo; se não achar,
  // grava o texto assim mesmo, sem erro (RN-4, fallback silencioso).
  mother: string | null;
  father: string | null;

  /** `category_matrice_id` (não `category_matrice_uuid`) — valor é uuid, nome
   * da chave preserva o `_id` do legado (mesma convenção de `category_id`/
   * `specie_id`/`breed_id`, fora do escopo desta Tarefa — ver Gap). */
  category_matrice_id: string | null;
  reproductive_status: AnimalReproductiveStatus | null;
  birth_forecast: string | null;

  /**
   * Bloco Bezerro — só efetivamente processado por `StoreAnimalAction`
   * (`UpdateAnimalAction` não lê `child`, achado real TASK-FE-884) — por
   * isso o formulário só renderiza este bloco em modo CRIAÇÃO. Chave do
   * tipo de identificação é `id_animal_uuid` (não `identification_type_uuid`).
   */
  child?: {
    category_uuid: string;
    birth_date: string;
    weight: number;
    id_animal_uuid: string;
    identification: string;
  };

  // Bloco Depreciação (§3.4.7) — 7 campos escreváveis confirmados contra
  // `AnimalRequest::rules()` (ver nota de reconciliação). `vl_residual`/
  // `vl_depreciate` são calculados CLIENT-SIDE mas ENVIADOS ao servidor
  // (`Store|UpdateAnimalAction` gravam exatamente o que veio, sem
  // recalcular) — por isso aparecem aqui, DIFERENTE de
  // `price_arroba_alive`/`value_unitary`/`unity_animal_ua` (Bloco
  // Pesos/Valores, fora do escopo desta Tarefa).
  depreciation_type: AnimalDepreciationType | null;
  vl_acquisition: number | null;
  residual: number | null;
  depreciation: number | null;
  life_bens: number | null;
  vl_residual: number | null;
  vl_depreciate: number | null;
}

// ============================================
// REACT HOOK FORM (TASK-FE-882..885)
// ============================================

export interface AnimalIdentificationFieldArrayItem {
  identification_type_uuid: Option<string> | null;
  identification: string;
}

export interface AnimalForm {
  type: Option<AnimalType> | null;
  /**
   * TASK-FE-882 — criação em lote (Contrato §5, Opção B). Só renderizado/
   * editável quando `type.value === 'no_id'` E `!isEditing`; `null` fora
   * dessa condição. Ver `AnimalPayload.quantity`.
   */
  quantity: number | null;
  specie_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  breed_uuid: Option<string> | null;
  entry_date: string | null;
  birth_date: string | null;
  /** `useFieldArray` (react-hook-form) — mirror `Pessoas`/`Armazem`/`CentroCusto`. */
  identifications: AnimalIdentificationFieldArrayItem[];
  weight: number | null;
  price_kilo_alive: number | null;
  /**
   * `GAP-BE-472` `[AVALIADO]` (Contrato §19.3, TASK-FE-905) — na CRIAÇÃO
   * NÃO é campo RHF (preview `InputReadOnly` via `useWatch`, mirror
   * `value_unitary`/`unity_animal_ua`); na EDIÇÃO vira campo RHF real
   * (`register`/`Controller`), pré-preenchido com `data.price_arroba_alive`
   * e editável — `UpdateAnimalAction` grava exatamente o valor enviado, sem
   * recalcular (GAP-BE-422).
   */
  price_arroba_alive: number | null;
  fur_description: string | null;
  note: string | null;

  /**
   * Genealogia (§3.4.4) — `GAP-BE-426` REVERTIDO no E2E (Contrato §19,
   * TASK-FE-901): TEXTO LIVRE (`Input` simples), não mais
   * `SelectAsyncPaginate` sobre `GET /animals/options`. Nomes de campo
   * alinhados à chave real pós-reversão de `AnimalRequest::rules()`
   * (`mother`/`father`, `TASK-BE-903`).
   */
  mother: string | null;
  father: string | null;

  /** `category_matrice_id` (alinhado à chave real, TASK-FE-884). */
  category_matrice_id: Option<string> | null;
  reproductive_status: Option<AnimalReproductiveStatus> | null;
  birth_forecast: string | null;

  /**
   * Campo-sombra (NÃO enviado no payload) — setado via `setValue` quando a
   * Categoria muda, carrega a flag `is_reproductive` da opção selecionada
   * (`mapOptions` estende o objeto). Consultado pelo `.when()` do Yup para
   * validar `category_matrice_id`/`reproductive_status` condicionalmente
   * (Yup não acessa direto um campo derivado de opção externa) — ver
   * `animal-schema.ts`.
   */
  _category_is_reproductive?: boolean;

  /**
   * Bloco Bezerro — renderizado SÓ em modo CRIAÇÃO (achado TASK-FE-884:
   * `UpdateAnimalAction` não processa `child`, ver nota no topo do arquivo).
   * `id_animal_uuid` (alinhado à chave real, não `identification_type_uuid`).
   */
  child?: {
    category_uuid: Option<string> | null;
    birth_date: string | null;
    weight: number | null;
    id_animal_uuid: Option<string> | null;
    identification: string;
  } | null;

  depreciation_type: Option<AnimalDepreciationType> | null;
  vl_acquisition: number | null;
  residual: number | null;
  depreciation: number | null;
  life_bens: number | null;
}

// ============================================
// FILTRO (drawer da listagem — 3 campos, `AnimalIndexRequest::rules()`)
// ============================================

export interface AnimalFilterForm {
  /** Busca por identificação (placeholder "Pesquisar Id Animal") — não é busca genérica. */
  search?: string;
  /** `GAP-FE-203` Achado 4 — nome real do filtro é `category_id` (`AnimalIndexRequest`/`AnimalFilterData`), não `category_uuid` como `TASK-FE-881` enviava (query param nunca batia, filtro nunca funcionou de fato). */
  category_id?: string;
  /** DISPLAY-ONLY — re-hidrata o label do `SelectAsyncPaginate` de Categoria. Nunca enviado à API. */
  category_label?: string;
  /** `GAP-FE-203` Achado 4 — nome real é `batch` (não `batch_uuid`); aceita um uuid de lote OU o literal `"0"` (sentinela "Sem lote", `ListBatchOptionsAction` já emite esse uuid sintético). */
  batch?: string;
  /** DISPLAY-ONLY — re-hidrata o label do `SelectAsyncPaginate` de Lote. Nunca enviado à API. */
  batch_label?: string;
  /** Tarefa 26 (FM-04) — default `'A'` aplicado pelo backend quando ausente; o drawer envia explicitamente. */
  status?: string;
  /** Tarefa 26 (FM-05). */
  origin?: string;
  /** Tarefa 26 (FM-06) — reusa `AnimalReproductiveStatus` (1|2|3). */
  reproductive_status?: number;
}

// ============================================
// OPTIONS (Mãe/Pai, TASK-FE-884/886) — `GET /animals/options`
// ============================================

/** `AnimalOptionResource` (api_root) — uuid+label (`label` = `identification`). */
export interface AnimalOptionListItem {
  uuid: string;
  label: string;
  /** Só vem com `with_last_weighing=true` (select de animal da Pesagem). Última
   *  pesagem por maior data, fallback peso/data de entrada. `null` = animal S/ID. */
  last_weight?: number | null;
  /** Idem `last_weight` — formato `Y-m-d`. */
  last_weight_date?: string | null;
}

/** PAGINADO de verdade (não FLAT) — `animals` tem 146.496 linhas reais,
 * `ListAnimalOptionsAction`/`AnimalRepository::listOptions()` (mirror
 * `cost-centers/options`, per_page default 10, máx 100). */
export interface AnimalOptionsListEnvelope {
  success: boolean;
  message: string;
  data: AnimalOptionListItem[];
  errors: Record<string, string[]> | null;
  meta: AnimalsApiPaginationMeta | null;
}

// ============================================
// IMPORT (Excel, TASK-FE-886)
// ============================================

// Reconciliado contra `AnimalImportResultData.php`/`ImportAnimalsAction`
// (api_root) — ABORT-ALL (mirror `PlanAccountImportModal`, NÃO
// `OpeningBalanceImportModal`): linha inválida → 422 com `errors.rows:
// string[]`, NADA é gravado. Sucesso (200) devolve só as 2 contagens —
// NUNCA `imported`/`errors` (shape do rascunho original de TASK-FE-880,
// mirror errado de `OpeningBalanceImportResult`, corrigido aqui).
export interface AnimalImportResult {
  created: number;
  children_created: number;
}

// ============================================
// AÇÕES EM LOTE (Tarefas 28/29/30, Gestão Animais — feature 3596a556)
// ============================================

/**
 * Payload de `PATCH /animals/reproductive-status-many` (Tarefa 28, AM-08).
 * Tipo PRÓPRIO — NÃO herda de `AnimalPayload`: `pregnancy_date` está listado
 * entre os campos "mortos" do CRUD (topo do arquivo), mas é vivo e obrigatório
 * aqui quando `reproductive_status === 1` (`Rule::requiredIf` do backend).
 * Datas em `dd/MM/yyyy` (`AnimalReproductiveStatusManyRequest` valida
 * `date_format:d/m/Y`) — o service converte, nunca ISO.
 */
export interface UpdateAnimalsReproductiveStatusManyPayload {
  uuids: string[];
  reproductive_status: AnimalReproductiveStatus;
  /** Obrigatório quando `reproductive_status === 1`; omitido nos demais casos. */
  pregnancy_date?: string;
  /** Obrigatório quando `reproductive_status === 1`; omitido nos demais casos. */
  birth_forecast?: string;
}

/** Resposta de `updateAnimalsReproductiveStatusMany` — contagem real do servidor. */
export interface UpdateAnimalsReproductiveStatusManyResult {
  updated: number;
}

/** Resposta de `deleteAnimalsMany` (`DELETE /animals/delete-many`, Tarefa 29, AM-09). */
export interface DeleteAnimalsManyResult {
  deleted: number;
}

/**
 * `errors` do 422 de `DELETE /animals/delete-many` (095, DA-05a): tudo ou nada;
 * `blocked_uuids` traz só uuids do pedido (máx. 500) e `blocked_uuids_truncated`
 * indica que há mais bloqueados que o limite.
 */
export interface DeleteAnimalsManyBlockedErrors {
  blocked_uuids: string[];
  blocked_uuids_truncated: boolean;
}

/**
 * Payload de `POST /animals/batch-transfer` (Tarefa 30, AM-05). Endpoint
 * COMPARTILHADO com a feature Animais/Lote (`426be835`, `DEC-028`) — não
 * duplicar. Enviar SÓ a chave do modo em uso: `batch_uuid` quando
 * `same_batch === true`; `batch_uuids` (alinhado por índice a `animal_uuids`,
 * `withValidator` do backend casa por posição) quando `false`.
 */
export interface TransferAnimalsBatchPayload {
  animal_uuids: string[];
  same_batch: boolean;
  batch_uuid?: string;
  batch_uuids?: string[];
}
