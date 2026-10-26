// src/pages/CadastrosBase/Rebanho/CreateOrUpdateAnimal.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ANIMAL ("Rebanho" — Cadastros Base /
// Pecuários, execução 027). Rotas: /cadastros-base/rebanho/novo e
// /cadastros-base/rebanho/:animalId (GUID), registradas em `router/index.tsx`
// por TASK-FE-887 — guardadas por `animals_view`.
//
// TASK-FE-882 (esta entrega): casca completa (FormContainer, useForm,
// useAnimalForm/useRequest, `fillAnimalForm` nomeada) + bloco "Fotos" +
// bloco "Dados Básicos". TASK-FE-883 (mesma entrega, MESMO arquivo):
// bloco "Pesos/Valores" (campos calculados). TASK-FE-884/885 EDITAM este
// mesmo arquivo em lotes seguintes, acrescentando os blocos Genealogia/
// Estágio-Reprodutivo/Bezerro e Depreciação — os pontos de inserção estão
// demarcados abaixo com comentário `TASK-FE-884`/`TASK-FE-885`; NÃO recriar
// a casca nessas Tarefas.
//
// Molde MECÂNICO: `Administrativo/Funcoes/CreateOrUpdateFuncao.tsx` (casca:
// `isEditing` por GUID, `useRequest`, `fillForm` nomeada com guarda
// EXPLÍCITA de `dirtyFields`, `InputReadOnly` com preview `useWatch` para
// campo calculado) + `CadastrosBase/CategoriasAnimais/CreateOrUpdateCategoriaAnimal.tsx`
// (selects assíncronos em cascata no domínio Pecuários) +
// `CadastrosBase/Produtos/Catalogo/CreateOrUpdateProduto.tsx` (cascata
// Grupo→Categoria→Classe: reset dos filhos DIRETO no `onChange` do pai,
// NUNCA em `useEffect`) — NÃO copia `CadastrosBase/Pessoas/` (wizard antigo,
// fora de escopo, mandato explícito do Maestro).
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta entrega (ver TASK-FE-882/883):
//
// 1) `fillAnimalForm` é função NOMEADA, guarda EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0 || resetForce` — NUNCA
//    `isEmpty()`/`!isEmpty()` do utilitário mal-nomeado/INVERTIDO
//    (`src/utils/isEmpty.ts` retorna `true` quando o objeto TEM chaves —
//    landmine documentada, 6 recorrências conhecidas de submit descartando
//    edição em silêncio nesta mesma execução).
// 2) Payload sempre FULL-RESOURCE-REPLACE (nunca um delta de `dirtyFields`)
//    — inclui inclusive os campos dos blocos de TASK-FE-884/885 (ainda sem
//    UI própria nesta entrega), como PASSTHROUGH a partir do que `fillForm`
//    hidratou — nunca zera silenciosamente um dado já salvo do servidor só
//    porque o bloco visual ainda não existe.
// 3) `type`/`start_weight` são IMUTÁVEIS após a criação — `type` fica
//    `isDisabled` no modo edição; `start_weight` é sempre `InputReadOnly`
//    (nunca campo RHF, nunca reenviado no payload em nenhum dos 2 verbos).
// 4) Criação em lote (`quantity`, Contrato §5) — Opção B CONFIRMADA pelo dev
//    (`GAP-BE-425`: `StoreAnimalAction` já implementa o bulk-insert de N
//    linhas idênticas, testado). Campo exposto SÓ na criação com
//    `type = "Sem Identificação"`; a semântica de lote é comunicada ao
//    usuário via `helperText` (`text.form.hints.quantityBatch`, template
//    "Serão criados {quantity} animais idênticos...").
// 5) Cascata Espécie→Categoria: trocar Espécie reseta Categoria DIRETO no
//    `onChange` do Controller de Espécie — NUNCA em `useEffect` (evita
//    corrida), NUNCA no `fillForm` (que usa `reset()`, não `setValue`, e não
//    deve marcar `dirtyFields` espúrio). `cacheUniqs`/`findParams` de
//    Categoria amarrados a `specie_uuid` (mirror `CreateOrUpdateProduto.tsx`).
//    TASK-FE-919 (item 4.3/D1) — Raça DEIXOU de fazer parte desta cascata: o
//    legado nunca filtrou `breeds` por Espécie (`AnimalController.php:136-138,
//    369-371`, lista global `Breed::where('is_enabled', true)`), então o
//    Select de Raça não envia mais `specie_uuid` nem é resetado quando a
//    Espécie muda.
// 6) `is_reproductive` da Categoria selecionada é capturado via extensão
//    LOCAL de `Option<string>` no `mapOptions` do Select de Categoria
//    (`CategoryAnimalOptionWithFlag`) e espelhado no campo-sombra
//    `_category_is_reproductive` (`setValue`, não persiste no payload) — o
//    schema (`animal-schema.ts`) já consome esse campo-sombra para os
//    `.when()` do bloco condicional que `TASK-FE-884` vai renderizar.
// 7) Identificação dinâmica (`useFieldArray`) — oculta (com aviso textual)
//    quando `type = "Sem Identificação"` (`replace([])` ao trocar o Tipo,
//    backend atribui "S/ID" automaticamente, RN-1 da Doc Bruta — o front
//    NUNCA hardcoda `id_animal_id`); obrigatória (mín. 1 linha) quando
//    `type = "Individual"` (validado pelo schema). TASK-FE-919 (item 4.5/D5)
//    — cada LINHA agora exige os 2 campos (`identification_type_uuid`/
//    `identification`), fiel ao legado (`_forms.blade.php:302-303`).
//    TASK-FE-919 (item 4.6/D6) — se o Tipo de Identificação escolhido NA
//    LINHA for "Sem Identificação" (`NO_IDENTIFICATION_TYPE_LABEL`, mesmo
//    rótulo usado por `StoreAnimalAction::where('description', 'Sem
//    Identificação')`), o campo Identificação da MESMA linha é
//    auto-preenchido com "S/ID" e travado (`_forms.blade.php:449-460`,
//    `handleIdAnimal()`).
// 8) Upload de foto (`@/components/Form/ImageUpload`) NÃO é campo RHF —
//    estado dedicado `photoFile`/`removePhoto`/`currentPhotoUrl`/
//    `photoError` (mirror `CreateOrUpdateUsuario.tsx`/
//    `CreateOrUpdateFamiliaBens.tsx`); guard de submit ganha o fator
//    adicional `hasPhotoChange` (a foto sozinha não suja `dirtyFields`).
//    `createAnimal`/`updateAnimal` (`animal-service.ts`) passaram a montar
//    `FormData` multipart (method spoofing no update — NUNCA `api.V2.put()`
//    com `FormData`).
// 9) Bloco "Pesos/Valores" (TASK-FE-883) — `value_unitary`/`unity_animal_ua`
//    são SEMPRE `InputReadOnly`, NUNCA `register()`/`Controller` editável,
//    PREVIEW client-side via `useWatch` (mesma técnica de
//    `vl_time_productive` em `CreateOrUpdateFuncao.tsx`, guarda
//    `Number.isFinite` contra NaN/Infinity). `start_weight` NÃO é uma
//    fórmula reativa — é o dado cru vindo do servidor
//    (`AnimalData.start_weight`, guardado em estado dedicado
//    `startWeightDisplay`, populado só em `fillAnimalForm`).
//    `price_arroba_alive` (`GAP-BE-472` `[AVALIADO]`, TASK-FE-905) DEIXOU de
//    ser sempre readonly. TASK-FE-919 (item 4.1) — fidelidade completa ao
//    legado agora: campo RHF real (`Controller`/`MoneyInput`) em AMBOS os
//    modos (criação e edição, o Blade `_forms.blade.php:85` nunca teve
//    `->readonly()`), sincronizado BIDIRECIONALMENTE com `price_kilo_alive`
//    (`main.js:828-846` — Kg→@ `× 30`, @→Kg `÷ 30`, ambos no `onValueChange`),
//    coerência com `UpdateAnimalAction` (GAP-BE-422), que grava o valor do
//    cliente sem recalcular.
//
// 10) Bloco "Genealogia" (Contrato §19, TASK-FE-901) — `mother`/`father`
//     voltaram a ser TEXTO LIVRE (`Input` simples), `GAP-BE-426` REVERTIDO
//     no E2E ("faça como era no legado"). Não usar mais
//     `SelectAsyncPaginate`/`GET /animals/options` para este fluxo — o
//     endpoint permanece no backend (Contrato §19.2), órfão de propósito.
//
// 11) Bloco "Depreciação" (TASK-FE-902) — `vl_depreciated`/`sd_depreciate`
//     são dado CRU do servidor (auditoria/histórico), mirror EXATO de
//     `start_weight` (estado dedicado `vlDepreciatedDisplay`/
//     `sdDepreciateDisplay`, populado só em `fillAnimalForm`), NUNCA campo
//     RHF, NUNCA no payload (o `AnimalRequest::rules()` não os aceita).
//     TASK-FE-919 (item 4.10/D10) — `depreciation` ganhou cálculo
//     automático a partir de `life_bens` (`100 / life_bens`, fiel a
//     `_forms.blade.php:313-322`), disparado no `onValueChange` de
//     `life_bens`, com guarda contra divisão por zero (`life_bens = 0` é
//     valor legítimo, `AnimalRequest::rules()` usa `min:0`, não `gt:0` —
//     o cálculo simplesmente não dispara nesse caso, igual ao legado:
//     `if (lifeBens && lifeBens > 0)`).
//
// 12) Bloco "Bezerro" (TASK-FE-884) — TASK-FE-919 (item 4.8/D8) corrigiu a
//     validação de "tudo-ou-nada" para OBRIGATÓRIO real quando
//     `reproductive_status === Parida (3)`, fiel ao legado
//     (`_forms.blade.php:478-489`, `handlePregnant()`).
//
// ⚠️ `GAP-FE-203` (resolução 2026-08-03) — a premissa original desta entrega
// ("Species/Breed vêm como uuid cru em `AnimalData`, `specie_uuid`/
// `breed_uuid`, SEM relação aninhada como `category`") estava ERRADA: leitura
// direta de `AnimalResource::toArray()` (api_root) confirma que `specie`/
// `breed` vêm ANINHADOS `{uuid, label}`, EXATAMENTE como `category`/
// `categoryMatrix`. Os GETs extras (`getSpecieByUuid`/`getBreedByUuid`,
// `resolveSpecieOption`/`resolveBreedOption`) eram um workaround
// desnecessário sobre uma premissa falsa — `data.specie_uuid` NUNCA existiu
// na resposta real (sempre `undefined`), então o Select de Espécie/Raça
// ficava com o rótulo/valor SEMPRE vazios na edição (bug real, silencioso,
// não pego por `tsc`/`eslint`/`build`). Removido o GET extra — `fillAnimalForm`
// lê `data.specie`/`data.breed` diretamente.
//
// ⚠️ `weight` migrou de `NumberInput`/`allowDot` para `MaskedInput
// kind="weight"` (97-Esteiras/001, Wave 2 — correção KB-06): o campo é
// digitação direta (não right-fill), mesmo contrato de payload (`Number`
// puro). `price_kilo_alive`/`price_arroba_alive` migraram de `MoneyInput`
// para `MaskedInput kind="currency"` — algoritmo idêntico, zero mudança de
// comportamento (moeda já estava correta).
// -----------------------------------------------------------------------------

import { ElementType, useRef, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormSetValue,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { depreciationTypeOptions } from '@/constants/pecuaria/animal/options/depreciation-type-options';
import { reproductiveStatusOptions } from '@/constants/pecuaria/animal/options/reproductive-status-options';
import { typeOptions } from '@/constants/pecuaria/animal/options/type-options';
import { queryKey } from '@/constants/query-key';

import { animalSchemaResolver } from '@/validations/schemas/CadastrosBase/animal-schema';

import {
  createAnimal,
  updateAnimal,
  verifyAnimalIdentification,
} from '@/services/v2/Animals/animal-service';
import { listBreedOptions } from '@/services/v2/Breeds/breed-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listActiveCategoryMatrices } from '@/services/v2/CategoryMatrices/category-matrix-service';
import { listIdentificationTypeOptions } from '@/services/v2/BaseRegistrations/identificationTypes-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalData, AnimalForm, AnimalPayload } from '@/@types/v2/Animals';
import type { BreedOptionItem } from '@/@types/v2/Breeds/breed';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { CategoryMatrixOptionItem } from '@/@types/v2/CategoryMatrices/category-matrix';
import type { IdentificationTypeOptionItem } from '@/@types/v2/BaseRegistrations/identificationTypes';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

import { useAnimalForm } from './useAnimal';

// `GAP-FE-206` (correção pós-E2E, 2026-08-03) — os 4 selects abaixo
// (Espécie/Categoria/Raça/Tipo de Identificação) migraram do índice
// administrativo GATEADO (`specie_view`/`categoryanimals_view`/
// `breeds_view`/`idanimal_view`) para os endpoints `/options` enxutos (sem
// gate de permissão) — o E2E revelou 403 "Sem opções" para qualquer operador
// de rebanho sem esses 4 privilégios administrativos (`animals_create`/
// `animals_edit` não implica NENHUM deles). Os serviços de índice completo
// (`listSpecies`/`listCategoryAnimals`/`listBreeds`/`listIdentificationTypes`)
// PERMANECEM intactos — ainda usados pelas telas de administração desses
// catálogos.
//
// TASK-BE-930 (fechamento do laço, 2026-08-03) — as 2 limitações reportadas
// na correção anterior foram resolvidas no backend (confirmado por leitura
// direta do `api_root`, NÃO presumido):
// 1) `CategoryAnimalOptionResource` agora expõe `is_reproductive` — a flag
//    volta a vir DIRETO na opção selecionada do Select de Categoria
//    (`mapOptions`, síncrono), como antes da primeira migração. O GET
//    dedicado gateado (`GET /category-animals/{uuid}`,
//    `resolveCategoryAnimalMeta`) foi REMOVIDO deste arquivo — não é mais
//    necessário para a seleção interativa.
// 2) `/breeds/options` e `/category-animals/options` agora aceitam
//    `specie_uuid` (opcional) — a cascata Espécie→Categoria/Raça volta a
//    filtrar SERVER-SIDE (`findParams`/`cacheUniqs` restaurados nos 2
//    Selects).
//
// Única lacuna residual: a HIDRATAÇÃO de `_category_is_reproductive` na
// EDIÇÃO (`fillAnimalForm`) não tem opção selecionada pelo usuário para ler
// `is_reproductive` de dentro — `AnimalResource.category` continua só
// `{uuid, label}` (TASK-FE-884, inalterado). Resolvida chamando o PRÓPRIO
// `/category-animals/options` (já ungated) filtrado por `data.specie.uuid` e
// buscando o `uuid` da categoria salva na lista devolvida — nunca mais o GET
// `/category-animals/{uuid}` gateado.
async function resolveCategoryIsReproductiveForEdit(
  specieUuid: string,
  categoryUuid: string
): Promise<boolean> {
  try {
    const response = await listCategoryAnimalOptions({ specie_uuid: specieUuid });
    const match = response.data.items.find((item) => item.uuid === categoryUuid);
    return !!match?.is_reproductive;
  } catch {
    return false;
  }
}

// Extensão LOCAL de `Option<string>` (checklist item 6) — o `mapOptions` do
// Select de Categoria devolve o objeto inteiro; `SelectAsyncPaginateProps`
// aceita porque o excesso de propriedade só é checado em literais "frescos"
// tipados diretamente contra a assinatura da prop, não contra um tipo
// nomeado como este.
interface CategoryAnimalOptionWithFlag extends Option<string> {
  is_reproductive: boolean;
}

// `GAP-FE-203` — o backend valida por `specie_id`/`category_id`/`breed_id`/
// `identifications.N.id_animal_uuid` (nomes reais de
// `AnimalRequest::rules()`), mas os campos RHF deste form usam nomes
// diferentes (`specie_uuid`/`category_uuid`/`breed_uuid`/
// `identifications.N.identification_type_uuid`, mantidos por estabilidade de
// UI — só o WIRE de envio precisa bater, não o nome do campo no form). Sem
// este mapeamento, um erro 422 do servidor citando `category_id` chamaria
// `setError('category_id', ...)` num campo que não existe no form — o erro
// ficaria "invisível" (nunca aparece embaixo do Select correspondente).
function mapServerFieldToFormField(field: string): string {
  const directMap: Record<string, string> = {
    specie_id: 'specie_uuid',
    category_id: 'category_uuid',
    breed_id: 'breed_uuid',
  };
  if (directMap[field]) return directMap[field];

  const identificationMatch = field.match(/^identifications\.(\d+)\.id_animal_uuid$/);
  if (identificationMatch) {
    return `identifications.${identificationMatch[1]}.identification_type_uuid`;
  }

  return field;
}

// TASK-FE-885 — condição de exibição do bloco Depreciação (categoria
// "Touro"). Sem flag semântica equivalente a `is_reproductive` disponível em
// `CategoryAnimalResource` (`[A CONFIRMAR]` do Contrato §6 item 7,
// confirmado AUSENTE por leitura direta do Resource, TASK-FE-885) — fallback
// por comparação de RÓTULO, mesma fragilidade do legado, mas documentada
// como temporária (recomenda-se Gap para o Arquiteto expor uma flag
// `is_bull`/`allows_depreciation` futuramente). Rótulo EXATO confirmado
// contra `AnimalRequest::BULL_CATEGORY_DESCRIPTION` (api_root, `'Touros/
// Rufiões'`) — NÃO "Touro" como o task-packet original assumia.
const BULL_CATEGORY_LABEL = 'Touros/Rufiões';

// TASK-FE-919 (item 4.6/D6) — auto "S/ID" por linha da tabela de
// Identificação. O legado usa o id físico fixo `6` (`_forms.blade.php:449-
// 460`, `change` em `.id_animals`; `:463-472`, `handleIdAnimal()` no load) —
// UUID inexistente/não-portável no fork multi-tenant, mesmo problema que
// `BULL_CATEGORY_LABEL` já resolve por RÓTULO. Confirmado no backend novo:
// `StoreAnimalAction.php:279` resolve o mesmo tipo por
// `IdentificationType::query()->where('description', 'Sem Identificação')`
// — mesma string usada aqui.
const NO_IDENTIFICATION_TYPE_LABEL = 'Sem Identificação';

export default function CreateOrUpdateAnimal() {
  const { animalId } = useParams<{ animalId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(animalId);

  const text = languageGB.animals.animal;
  const canSave = isEditing ? can('animals_edit') : can('animals_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AnimalForm>({
    mode: 'onChange',
    resolver: animalSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      type: null,
      quantity: null,
      specie_uuid: null,
      category_uuid: null,
      breed_uuid: null,
      entry_date: '',
      birth_date: null,
      identifications: [],
      weight: null,
      price_kilo_alive: null,
      // TASK-FE-919 (item 4.1, `GAP-BE-472` `[AVALIADO]`) — campo RHF real
      // em AMBOS os modos agora; `null` inicial na criação (preenchido
      // pela sincronia bidirecional ao digitar o Kg vivo), hidratado por
      // `fillAnimalForm` na edição.
      price_arroba_alive: null,
      fur_description: '',
      note: '',
      _category_is_reproductive: false,

      // ---- TASK-FE-901 (Genealogia, GAP-BE-426 REVERTIDO — TEXTO LIVRE) ----
      mother: null,
      father: null,
      // ---- FIM TASK-FE-901 ----

      // ---- TASK-FE-884 (Estágio/Status Reprodutivo + Bezerro) ----
      category_matrice_id: null,
      reproductive_status: null,
      birth_forecast: null,
      child: null,
      // ---- FIM TASK-FE-884 ----

      // ---- TASK-FE-885 (Depreciação) ----
      depreciation_type: null,
      vl_acquisition: null,
      residual: null,
      depreciation: null,
      life_bens: null,
      // ---- FIM TASK-FE-885 ----
    },
  });

  const {
    fields: identificationFields,
    append: appendIdentification,
    remove: removeIdentification,
    replace: replaceIdentifications,
  } = useFieldArray({ control, name: 'identifications' });

  // ---- Estado da foto (NÃO é campo RHF — checklist item 8). `photoFile` =
  // arquivo novo selecionado nesta sessão; `removePhoto` = flag local que
  // vira `remove_image=1` no payload; `currentPhotoUrl` = espelho de
  // `data.photo_url` (edição), só para preview; `photoError` = 422 de
  // `photo` interceptado ANTES do loop genérico de `setError` (mirror
  // `CreateOrUpdateUsuario.tsx`). ----
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);

  // Peso de Entrada (TASK-FE-883) — dado CRU do servidor, nunca campo RHF,
  // nunca recalculado no cliente (checklist item 9). Só existe em edição,
  // populado em `fillAnimalForm`.
  const [startWeightDisplay, setStartWeightDisplay] = useState<number | null>(null);

  // Bloco Depreciação (TASK-FE-902) — `vl_depreciated`/`sd_depreciate` são
  // dado CRU do servidor (auditoria/histórico, RN-7), NUNCA campo RHF nem
  // recalculado no cliente — mirror EXATO de `startWeightDisplay` acima.
  // Sempre `null` para animal recém-criado (só populados por um processo de
  // depreciação mensal fora de escopo desta execução, Contrato §19
  // "Achados adicionais"); populados em `fillAnimalForm`.
  const [vlDepreciatedDisplay, setVlDepreciatedDisplay] = useState<number | null>(null);
  const [sdDepreciateDisplay, setSdDepreciateDisplay] = useState<number | null>(null);

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoError(undefined);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setRemovePhoto(true);
    setCurrentPhotoUrl(null);
    setPhotoError(undefined);
  }

  // Checklist item 1 — função NOMEADA, guarda EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0 || resetForce` (NUNCA
  // `isEmpty`/`!isEmpty`).
  async function fillAnimalForm(data: AnimalData, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    // `AnimalResource.category` (nested) é `{uuid, label}` — suficiente para
    // o VALOR do Select (TASK-FE-884), mas ainda não ecoa `is_reproductive`
    // (achado inalterado). A flag é resolvida via `/category-animals/options`
    // (já ungated, TASK-BE-930), filtrado pela Espécie do próprio animal —
    // NUNCA mais o GET `/category-animals/{uuid}` gateado (ver cabeçalho do
    // arquivo). Species/Breed vêm ANINHADOS diretamente em `data.specie`/
    // `data.breed` (GAP-FE-203), sem GET extra.
    const categoryIsReproductive = await resolveCategoryIsReproductiveForEdit(
      data.specie.uuid,
      data.category.uuid
    );

    reset({
      type: typeOptions.getOption(data.type, languageGB),
      // `quantity` nunca vem do servidor (bulk-create só existe no create,
      // Contrato §5) — sempre `null` no reset de edição.
      quantity: null,
      specie_uuid: { label: data.specie.label, value: data.specie.uuid },
      category_uuid: { label: data.category.label, value: data.category.uuid },
      breed_uuid: data.breed ? { label: data.breed.label, value: data.breed.uuid } : null,
      entry_date: data.entry_date,
      birth_date: data.birth_date,
      // `GAP-FE-203` Achado 1/3 — `id_animals[]` (pivot real, `{uuid,
      // description, identification}`), não `identifications[]` com
      // `identification_type_uuid`/`identification_type_label` (chave que
      // nunca existiu na resposta — `data.identifications` era sempre
      // `undefined`, `.map()` estourava `TypeError` ao editar QUALQUER
      // animal existente).
      identifications: data.id_animals.map((item) => ({
        identification_type_uuid: {
          label: item.description,
          value: item.uuid,
        },
        identification: item.identification,
      })),
      weight: data.weight,
      price_kilo_alive: data.price_kilo_alive,
      // TASK-FE-919 (`GAP-BE-472` `[AVALIADO]`) — pré-preenchido com o
      // valor cru do servidor, editável pelo usuário a partir daqui (campo
      // RHF real também na criação, mas esse modo não passa por este
      // `reset`).
      price_arroba_alive: data.price_arroba_alive,
      fur_description: data.fur_description,
      note: data.note,
      // Checklist item 6 — restaura o campo-sombra (TASK-FE-884, achado real:
      // `category.is_reproductive` NÃO existe em `AnimalResource`, diferente
      // do que TASK-882 assumia — resolvido via `/category-animals/options`,
      // ver `resolveCategoryIsReproductiveForEdit` acima).
      _category_is_reproductive: categoryIsReproductive,

      // ---- TASK-FE-901 (Genealogia, `GAP-BE-426` REVERTIDO no E2E —
      // Contrato §19) — `AnimalResource` volta a devolver `mother`/`father`
      // como TEXTO LIVRE cru (string), não mais os objetos aninhados
      // `mother_animal`/`father_animal` da Opção B revertida. ----
      mother: data.mother,
      father: data.father,
      // ---- FIM TASK-FE-901 ----

      // ---- TASK-FE-884 (Estágio/Status Reprodutivo) — `AnimalResource`
      // devolve `categoryMatrix` como objeto ANINHADO já com rótulo pronto
      // (ver nota de reconciliação em `@/@types/v2/Animals`). ----
      category_matrice_id: data.categoryMatrix
        ? { label: data.categoryMatrix.label, value: data.categoryMatrix.uuid }
        : null,
      reproductive_status: data.reproductive_status
        ? reproductiveStatusOptions.getOption(data.reproductive_status, languageGB)
        : null,
      birth_forecast: data.birth_forecast,
      // Bloco Bezerro — SEM hidratação no GET (achado real TASK-FE-884:
      // `AnimalResource` não devolve `child`, o bezerro é uma 2ª linha de
      // `Animal` criada só por `StoreAnimalAction`; `UpdateAnimalAction`
      // nunca processa `child`). O bloco só é renderizado em CRIAÇÃO — ver
      // JSX abaixo — então `null` aqui é sempre correto na edição.
      child: null,
      // ---- FIM TASK-FE-884 ----

      // ---- TASK-FE-885 (Depreciação) — `AnimalResource` devolve o objeto
      // ANINHADO `depreciation` (não campos flat, achado real). ----
      depreciation_type:
        data.depreciation.depreciation_type != null
          ? depreciationTypeOptions.getOption(data.depreciation.depreciation_type, languageGB)
          : null,
      vl_acquisition: data.depreciation.vl_acquisition,
      residual: data.depreciation.residual,
      depreciation: data.depreciation.depreciation,
      life_bens: data.depreciation.life_bens,
      // ---- FIM TASK-FE-885 ----
    });

    // Peso de Entrada — dado cru do servidor (checklist item 9).
    setStartWeightDisplay(data.start_weight);

    // Bloco Depreciação (TASK-FE-902) — `vl_depreciated`/`sd_depreciate`,
    // dado cru do servidor (mirror `startWeightDisplay` acima).
    setVlDepreciatedDisplay(data.depreciation.vl_depreciated);
    setSdDepreciateDisplay(data.depreciation.sd_depreciate);

    // Foto — só sincroniza o preview "atual" quando o usuário ainda não
    // escolheu localmente um arquivo novo nem marcou remoção (mirror
    // `CreateOrUpdateUsuario.tsx`/`CreateOrUpdateFamiliaBens.tsx`).
    // Execução 085: o preview usa `photo_url` (URL absoluta devolvida por
    // `AnimalResource`); `photo` segue sendo o path relativo cru.
    if (!photoFile && !removePhoto) {
      setCurrentPhotoUrl(data.photo_url ?? null);
    }
  }

  const animalQuery = useAnimalForm({
    registrationId: isEditing ? animalId : undefined,
    fillForm: fillAnimalForm,
  });

  const isLoading = isEditing && checkLoadingStatus([animalQuery as any]);

  const animalMutation = useRequest({
    asyncFunction: tryPersistAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.animals.animalsList,
    queryKey2: queryKey.animals.animal,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Checklist item 2 — payload SEMPRE full-resource-replace.
  async function tryPersistAnimal(data: AnimalForm) {
    const isNoId = data.type?.value === 'no_id';

    // Bloco Depreciação (TASK-FE-885) — `vl_residual`/`vl_depreciate`
    // calculados a partir do PRÓPRIO `data` submetido (nunca de um
    // `useWatch` de render, para não depender de timing de re-render no
    // instante do submit). Mesma fórmula do preview `InputReadOnly` (JSX
    // abaixo) — guarda `Number.isFinite` contra `NaN` quando
    // `vl_acquisition`/`residual` não são números válidos (campos
    // opcionais fora do bloco Touro).
    const acquisitionForDepreciation = Number(data.vl_acquisition);
    const residualPercentForDepreciation = Number(data.residual);
    const depreciationVlResidual =
      Number.isFinite(acquisitionForDepreciation) && Number.isFinite(residualPercentForDepreciation)
        ? acquisitionForDepreciation * (residualPercentForDepreciation / 100)
        : null;
    const depreciationVlDepreciate =
      Number.isFinite(acquisitionForDepreciation) && depreciationVlResidual != null
        ? acquisitionForDepreciation - depreciationVlResidual
        : null;

    // Bloco "Pesos/Valores" (`GAP-FE-203` Achado 2) — `price_arroba_alive`/
    // `value_unitary`/`unity_animal_ua` são `required|numeric` em AMBOS os
    // verbos no `AnimalRequest::rules()` real; `TASK-FE-883` os omitia
    // deliberadamente do payload (readonly/preview), causando 422 garantido.
    // Calculados aqui com a MESMA fórmula do preview `InputReadOnly` (JSX
    // abaixo) e SEMPRE enviados — `StoreAnimalAction` recalcula e IGNORA
    // (RN-2/GAP-BE-421, o valor enviado não tem efeito no create, só
    // precisa existir para passar a validação), `UpdateAnimalAction` grava
    // exatamente o que veio (GAP-BE-422).
    const weightForCalc = Number(data.weight);
    const priceKiloAliveForCalc = Number(data.price_kilo_alive);
    // `priceArrobaAliveValue` = fallback recalculado (fórmula do legado,
    // `price_kilo_alive × 30`) — só usado se o campo real vier vazio/NaN.
    const priceArrobaAliveValue = Number.isFinite(priceKiloAliveForCalc)
      ? priceKiloAliveForCalc * 30
      : 0;
    // TASK-FE-919 (item 4.1, `GAP-BE-472` `[AVALIADO]`) — `price_arroba_alive`
    // é campo RHF real em AMBOS os modos agora (criação e edição, mirror do
    // legado, que nunca o travou — `_forms.blade.php:85`, sem `->readonly()`)
    // e sincronizado bidirecionalmente com `price_kilo_alive` no JSX
    // (`main.js:828-846`). É ELE quem vai no payload nos dois verbos;
    // `UpdateAnimalAction` grava exatamente o valor recebido (GAP-BE-422),
    // `StoreAnimalAction` recalcula e ignora (RN-2/GAP-BE-421, só precisa
    // existir para passar a validação). Guarda contra `null`/`NaN` (campo
    // limpo pelo usuário) — cai de volta no valor recalculado, nunca envia
    // um valor inválido.
    const priceArrobaAliveFinal =
      data.price_arroba_alive != null && Number.isFinite(Number(data.price_arroba_alive))
        ? Number(data.price_arroba_alive)
        : priceArrobaAliveValue;
    const valueUnitaryValue =
      Number.isFinite(weightForCalc) && Number.isFinite(priceKiloAliveForCalc)
        ? weightForCalc * priceKiloAliveForCalc
        : 0;
    const unityAnimalUaValue = Number.isFinite(weightForCalc) ? weightForCalc / 450 : 0;

    const payload: AnimalPayload = {
      type: data.type!.value,
      // Checklist item 4 — Opção B (Contrato §5, `GAP-BE-425` CONFIRMADO):
      // só na CRIAÇÃO com `type = "no_id"`; `undefined` em qualquer outro
      // caso (edição nunca envia `quantity`, o bulk-create não se aplica a
      // um registro já existente).
      quantity: !isEditing && isNoId ? (data.quantity ?? 1) : undefined,
      // `GAP-FE-203` Achado 1 — nomes de chave EXATOS de
      // `AnimalRequest::rules()` (`specie_id`/`category_id`/`breed_id`); os
      // campos RHF continuam `specie_uuid`/`category_uuid`/`breed_uuid`
      // (só o WIRE precisa bater, não o nome interno do form).
      specie_id: data.specie_uuid!.value,
      category_id: data.category_uuid!.value,
      breed_id: data.breed_uuid?.value ?? null,
      entry_date: data.entry_date!,
      // TASK-FE-919 (item 4.2/D2) — enviado para QUALQUER `type` (o campo é
      // sempre visível/editável, sem condicional de `type`; `AnimalRequest::
      // rules()` não restringe por tipo). Antes zerava silenciosamente em
      // "Sem Identificação".
      birth_date: data.birth_date ?? null,
      // "Sem Identificação" — array vazio; o backend atribui "S/ID"
      // automaticamente (Doc Bruta RN-1), o front NUNCA hardcoda
      // `id_animal_id` (checklist item 7). `id_animal_uuid` (não
      // `identification_type_uuid`, `GAP-FE-203` Achado 1).
      identifications: isNoId
        ? []
        : data.identifications.map((item) => ({
            id_animal_uuid: item.identification_type_uuid!.value,
            identification: item.identification,
          })),
      weight: data.weight!,
      price_kilo_alive: data.price_kilo_alive!,
      price_arroba_alive: priceArrobaAliveFinal,
      value_unitary: valueUnitaryValue,
      unity_animal_ua: unityAnimalUaValue,
      fur_description: data.fur_description || null,
      note: data.note || null,
      photo: photoFile,
      remove_image: removePhoto,

      // ---- TASK-FE-901 (Genealogia, `GAP-BE-426` REVERTIDO — TEXTO LIVRE,
      // Contrato §19) — `mother`/`father` são strings cruas do `Input`, sem
      // validação de existência (RN-4: o backend resolve o vínculo por
      // busca textual e grava `null` internamente se não achar, mas o
      // texto digitado é sempre gravado). ----
      mother: data.mother || null,
      father: data.father || null,
      // ---- FIM TASK-FE-901 ----

      // ---- TASK-FE-884 (Estágio/Status Reprodutivo + Bezerro) — nomes de
      // chave EXATOS de `AnimalRequest::rules()` (ver nota de reconciliação
      // em `@/@types/v2/Animals`). ----
      category_matrice_id: data.category_matrice_id?.value ?? null,
      reproductive_status: data.reproductive_status?.value ?? null,
      birth_forecast: data.birth_forecast ?? null,
      // Bezerro — só efetivamente processado por `StoreAnimalAction`
      // (`UpdateAnimalAction` não lê `child`, achado real TASK-FE-884) — o
      // bloco só é renderizado (e só pode ter dados) em modo CRIAÇÃO, então
      // `!isEditing` aqui é só uma segunda barreira defensiva, nunca deveria
      // ter efeito prático.
      child:
        !isEditing && data.child
          ? {
              category_uuid: data.child.category_uuid!.value,
              birth_date: data.child.birth_date!,
              weight: data.child.weight!,
              id_animal_uuid: data.child.id_animal_uuid!.value,
              identification: data.child.identification,
            }
          : undefined,
      // ---- FIM TASK-FE-884 ----

      // ---- TASK-FE-885 (Depreciação) — `vl_residual`/`vl_depreciate` são
      // calculados CLIENT-SIDE (mesma fórmula do preview `InputReadOnly`,
      // ver JSX) e ENVIADOS — `Store|UpdateAnimalAction` gravam exatamente
      // o que vier, sem recalcular (achado real, diferente de
      // `price_arroba_alive`/`value_unitary`/`unity_animal_ua`, que NUNCA
      // entram neste payload). Guarda `Number.isFinite` contra NaN quando
      // `vl_acquisition`/`residual` não são números válidos. ----
      depreciation_type: data.depreciation_type?.value ?? null,
      vl_acquisition: data.vl_acquisition ?? null,
      residual: data.residual ?? null,
      depreciation: data.depreciation ?? null,
      life_bens: data.life_bens ?? null,
      vl_residual: depreciationVlResidual,
      vl_depreciate: depreciationVlDepreciate,
      // ---- FIM TASK-FE-885 ----
    };

    try {
      return isEditing && animalId
        ? await updateAnimal(animalId, payload)
        : await createAnimal(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        // `photo` NÃO é campo RHF (checklist item 8) — intercepta ANTES do
        // loop genérico, roteado para `photoError`.
        if (fieldErrors?.photo?.[0]) {
          setPhotoError(fieldErrors.photo[0]);
        }
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (field === 'photo') return;
          if (messages?.[0]) {
            setError(mapServerFieldToFormField(field) as keyof AnimalForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Guard `onSubmit`: `Object.keys(dirtyFields).length === 0` EXPLÍCITO
  // (checklist item 1) + fator adicional `hasPhotoChange` (a foto não é
  // campo RHF, mirror `CreateOrUpdateUsuario.tsx`/`CreateOrUpdateFamiliaBens.tsx`).
  async function onSubmit(data: AnimalForm) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    const hasPhotoChange = !!photoFile || removePhoto;
    if (isEditing && hasNoFormChanges && !hasPhotoChange) {
      navigate(-1);
    } else {
      await animalMutation.mutateAsync(data);
    }
  }

  const isSubmitting = animalMutation.isPending;

  // ---- Cascata Espécie→Categoria→Raça (checklist item 5) ----
  const watchedSpecie = watch('specie_uuid');
  const watchedType = watch('type');
  const watchedNote = watch('note');
  const noteLength = (watchedNote ?? '').length;

  const isNoIdType = watchedType?.value === 'no_id';

  // ---- Bloco "Pesos/Valores" (TASK-FE-883) — preview client-side via
  // `useWatch`, NUNCA campo RHF (checklist item 9). ----
  const watchedWeight = useWatch({ control, name: 'weight' });
  const watchedPriceKiloAlive = useWatch({ control, name: 'price_kilo_alive' });

  const weightNumber = Number(watchedWeight);
  const priceKiloAliveNumber = Number(watchedPriceKiloAlive);

  const valueUnitaryPreview =
    Number.isFinite(weightNumber) && Number.isFinite(priceKiloAliveNumber)
      ? (weightNumber * priceKiloAliveNumber).toFixed(2)
      : undefined;
  const unityAnimalUaPreview = Number.isFinite(weightNumber)
    ? (weightNumber / 450).toFixed(2)
    : undefined;
  // TASK-FE-919 (item 4.1) — `priceArrobaAlivePreview` removido: o campo
  // deixou de ter um modo `InputReadOnly` (era só usado na criação); agora
  // é sempre `Controller` real, sincronizado bidirecionalmente no próprio
  // `onValueChange` dos dois campos (ver JSX abaixo).

  const startWeightPreview =
    isEditing && startWeightDisplay != null ? String(startWeightDisplay) : undefined;

  // ---- Bloco "Estágio/Status Reprodutivo" (TASK-FE-884, Contrato §3.4.5) —
  // condicional a `_category_is_reproductive` (checklist item 6, capturado
  // no Select de Categoria do bloco Dados Básicos). ----
  const watchedCategory = watch('category_uuid');
  const watchedIsReproductive = !!watch('_category_is_reproductive');
  const watchedReproductiveStatus = watch('reproductive_status');
  const isPregnantStatus = watchedReproductiveStatus?.value === 1;

  // ---- Bloco "Bezerro" (TASK-FE-884, Contrato §3.4.6) — condicional a
  // `reproductive_status === Parida (3)` E modo CRIAÇÃO (achado real:
  // `UpdateAnimalAction` não processa `child`, ver nota de reconciliação em
  // `@/@types/v2/Animals`). ----
  const shouldShowChildBlock = !isEditing && watchedReproductiveStatus?.value === 3;

  // ---- Bloco "Depreciação" (TASK-FE-885, Contrato §3.4.7) — condicional a
  // categoria "Touros/Rufiões" (fallback por rótulo, `BULL_CATEGORY_LABEL`
  // no topo do arquivo — sem flag semântica disponível, ver docblock). ----
  const shouldShowDepreciationBlock = watchedCategory?.label === BULL_CATEGORY_LABEL;

  const watchedDepreciationType = watch('depreciation_type');
  const watchedVlAcquisition = useWatch({ control, name: 'vl_acquisition' });
  const watchedResidualPercent = useWatch({ control, name: 'residual' });

  const vlAcquisitionNumber = Number(watchedVlAcquisition);
  const residualPercentNumber = Number(watchedResidualPercent);

  const vlResidualPreviewNumber =
    Number.isFinite(vlAcquisitionNumber) && Number.isFinite(residualPercentNumber)
      ? vlAcquisitionNumber * (residualPercentNumber / 100)
      : undefined;
  const vlDepreciatePreviewNumber =
    Number.isFinite(vlAcquisitionNumber) && vlResidualPreviewNumber !== undefined
      ? vlAcquisitionNumber - vlResidualPreviewNumber
      : undefined;

  const vlResidualPreview =
    vlResidualPreviewNumber !== undefined ? vlResidualPreviewNumber.toFixed(2) : undefined;
  const vlDepreciatePreview =
    vlDepreciatePreviewNumber !== undefined ? vlDepreciatePreviewNumber.toFixed(2) : undefined;

  // TASK-FE-902 — `vl_depreciated`/`sd_depreciate`: dado CRU do servidor
  // (mirror `startWeightPreview` acima), NUNCA calculado no cliente. Sempre
  // "—" para animal recém-criado (campos `null` até um processo de
  // depreciação mensal rodar, fora de escopo desta execução).
  const vlDepreciatedPreview =
    isEditing && vlDepreciatedDisplay != null ? String(vlDepreciatedDisplay) : undefined;
  const sdDepreciatePreview =
    isEditing && sdDepreciateDisplay != null ? String(sdDepreciateDisplay) : undefined;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* ---- Bloco "Fotos" (TASK-FE-882, Contrato §3.4.1) ---- */}
        <Box mb={6}>
          <ImageUpload
            label={text.form.fields.photo}
            currentImageUrl={currentPhotoUrl}
            file={photoFile}
            onFileSelected={handlePhotoSelected}
            onRemove={handleRemovePhoto}
            disabled={!canSave || isLoading}
            error={photoError}
            dropzoneTitle={text.form.image.dropzoneTitle}
            dropzoneDraggingTitle={text.form.image.dropzoneDragging}
            changeLabel={text.form.image.changeLabel}
            removeLabel={text.form.image.removeLabel}
            errorTypeMessage={text.form.image.errorType}
            errorSizeMessage={text.form.image.errorSize}
          />
        </Box>

        {/* ---- Bloco "Dados Básicos" (TASK-FE-882, Contrato §3.4.2) ---- */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                placeholder={text.form.placeholders.type}
                value={value}
                onChange={(opt: Option<'single' | 'no_id'> | null) => {
                  onChange(opt);
                  // Checklist item 3 — `type` imutável na edição (só se
                  // altera na criação, `isDisabled` abaixo bloqueia o resto).
                  if (opt?.value === 'no_id') {
                    // "Sem Identificação" — checklist item 7: limpa o array
                    // (backend atribui "S/ID") e sugere `quantity=1`.
                    // TASK-FE-919 (item 4.2/D2) — `birth_date` NÃO é mais
                    // limpo aqui: o campo fica SEMPRE visível (fidelidade ao
                    // legado, `main.js:813-826` nunca esconde para o valor
                    // atual de `type`) e se aplica aos dois modos.
                    replaceIdentifications([]);
                    setValue('quantity', 1, { shouldDirty: true });
                  } else {
                    setValue('quantity', null, { shouldDirty: true });
                  }
                }}
                options={typeOptions.options(languageGB)}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={isEditing || !canSave}
                loading={isLoading}
              />
            )}
          />

          {/* Checklist item 4 — só na CRIAÇÃO com "Sem Identificação". */}
          {!isEditing && isNoIdType && (
            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields.quantity}
                  helperText={text.form.hints.quantityBatch.replace(
                    '{quantity}',
                    String(field.value ?? 1)
                  )}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={1}
                  decimalPlaces={0}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />
          )}

          <Controller
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                error={errors.specie_uuid?.message as string | undefined}
                service={listSpecieOptions}
                mapOptions={(item: SpecieOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // Checklist item 5 — cascata: trocar a Espécie reseta
                  // Categoria, DIRETO no onChange (nunca useEffect).
                  // TASK-FE-919 (item 4.3/D1) — Raça NÃO é mais resetada
                  // aqui: `breeds/options` deixou de filtrar por Espécie
                  // (`AnimalController.php:136-138,369-371` do legado nunca
                  // filtrou — lista global `Breed::where('is_enabled',
                  // true)`), então a Raça selecionada continua válida
                  // independente da Espécie.
                  setValue('category_uuid', null, { shouldDirty: true });
                  setValue('_category_is_reproductive', false, { shouldDirty: false });
                  // TASK-FE-884/885 — trocar a Espécie zera a Categoria, o
                  // que esconde os blocos Reprodutivo/Bezerro/Depreciação;
                  // limpa o estado deles junto (esconder ≠ preservar estado
                  // indevidamente, mesma disciplina do resto do arquivo).
                  setValue('category_matrice_id', null, { shouldDirty: true });
                  setValue('reproductive_status', null, { shouldDirty: true });
                  setValue('birth_forecast', null, { shouldDirty: true });
                  setValue('child', null, { shouldDirty: true });
                  setValue('depreciation_type', null, { shouldDirty: true });
                  setValue('vl_acquisition', null, { shouldDirty: true });
                  setValue('residual', null, { shouldDirty: true });
                  setValue('depreciation', null, { shouldDirty: true });
                  setValue('life_bens', null, { shouldDirty: true });
                }}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.category}
                placeholder={
                  watchedSpecie ? text.form.placeholders.category : text.form.hints.specieRequired
                }
                error={errors.category_uuid?.message as string | undefined}
                isDisabled={!watchedSpecie || !canSave || isLoading}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem): CategoryAnimalOptionWithFlag => ({
                  label: item.label,
                  value: item.uuid,
                  is_reproductive: item.is_reproductive,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // `TASK-BE-930` — `specie_uuid` RESTAURADO: `/category-
                  // animals/options` volta a filtrar server-side por Espécie.
                  specie_uuid: watchedSpecie?.value,
                })}
                cacheUniqs={[watchedSpecie?.value]}
                value={field.value ?? null}
                onChange={(option: CategoryAnimalOptionWithFlag | null | any) => {
                  field.onChange(option ?? null);
                  // Checklist item 6 — `TASK-BE-930`: `CategoryAnimalOptionResource`
                  // volta a expor `is_reproductive` DIRETO na opção
                  // selecionada — síncrono de novo, sem GET extra.
                  const isReproductive = option?.is_reproductive ?? false;
                  setValue('_category_is_reproductive', isReproductive, {
                    shouldDirty: false,
                  });
                  // TASK-FE-884 — esconder ≠ preservar estado indevidamente:
                  // se a nova categoria NÃO é reprodutiva, limpa o bloco
                  // Reprodutivo/Bezerro para não vazar dado velho caso o
                  // usuário volte a uma categoria reprodutiva depois.
                  if (!isReproductive) {
                    setValue('category_matrice_id', null, { shouldDirty: true });
                    setValue('reproductive_status', null, { shouldDirty: true });
                    setValue('birth_forecast', null, { shouldDirty: true });
                    setValue('child', null, { shouldDirty: true });
                  }
                  // TASK-FE-885 — idem para o bloco Depreciação: some quando
                  // a categoria não é "Touros/Rufiões".
                  if ((option?.label ?? null) !== BULL_CATEGORY_LABEL) {
                    setValue('depreciation_type', null, { shouldDirty: true });
                    setValue('vl_acquisition', null, { shouldDirty: true });
                    setValue('residual', null, { shouldDirty: true });
                    setValue('depreciation', null, { shouldDirty: true });
                    setValue('life_bens', null, { shouldDirty: true });
                  }
                }}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="breed_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.breed}
                placeholder={text.form.placeholders.breed}
                error={errors.breed_uuid?.message as string | undefined}
                isDisabled={!canSave || isLoading}
                service={listBreedOptions}
                mapOptions={(item: BreedOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                // TASK-FE-919 (item 4.3/D1) — Raça deixou de filtrar por
                // Espécie: `AnimalController.php:136-138` (create) e
                // `:369-371` (edit) do legado sempre fazem
                // `Breed::where('is_enabled', true)->orderBy('description')
                // ->get()`, SEM filtro por `specie_id`, nos dois modos.
                // `specie_uuid` REMOVIDO de `findParams` (o backend também
                // está removendo o parâmetro de `breeds/options` em
                // paralelo — este front não depende dele para parar de
                // enviar).
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="entry_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.form.fields.entryDate}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                error={errors.entry_date?.message as string | undefined}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          {/* TASK-FE-919 (item 4.2/D2) — SEMPRE visível, para qualquer
              `type` (fidelidade ao legado: `main.js:813-826` só esconde
              `.single-animal` quando `type == 'batch'`, valor inexistente
              hoje) e NUNCA obrigatório (nem Blade nem `AnimalRequest::
              rules()` novo exigem). Antes só renderizava/exigia quando
              "Individual" — bloqueava submissão válida. */}
          <Controller
            name="birth_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.form.fields.birthDate}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? null)}
                error={errors.birth_date?.message as string | undefined}
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Identificação dinâmica (checklist item 7) — oculta com aviso
            textual quando "Sem Identificação"; repeater obrigatório quando
            "Individual". */}
        {isNoIdType ? (
          <Box
            mt={6}
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            p={4}
          >
            <Text fontSize="sm" color="fg.muted">
              {text.form.identifications.noIdHint}
            </Text>
          </Box>
        ) : (
          <Box mt={6}>
            <IdentificationsSection
              fields={identificationFields}
              control={control}
              errors={errors}
              setValue={setValue}
              onAdd={() =>
                appendIdentification({ identification_type_uuid: null, identification: '' })
              }
              onRemove={removeIdentification}
              canSave={canSave}
              isLoading={!!isLoading}
              text={text.form}
              isEditing={isEditing}
              excludeUuid={isEditing ? animalId : undefined}
            />
          </Box>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="weight"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                allowDot
                name={field.name}
                label={text.form.fields.weight}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                decimalPlaces={2}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="price_kilo_alive"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="currency"
                name={field.name}
                label={text.form.fields.priceKiloAlive}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // TASK-FE-919 (item 4.1) — sincronia BIDIRECIONAL fiel ao
                  // legado (`main.js:838-846`): editar o Kg vivo recalcula
                  // a @ viva (`× 30`), nos dois modos (criação e edição).
                  const kiloNumber = Number(value);
                  if (Number.isFinite(kiloNumber)) {
                    setValue('price_arroba_alive', kiloNumber * 30, { shouldDirty: true });
                  }
                }}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.furDescription}
            maxLength={100}
            {...register('fur_description')}
            error={errors.fur_description?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={text.form.fields.note}
            maxLength={191}
            helperText={errors.note?.message ? undefined : `${noteLength}/191`}
            {...register('note')}
            error={errors.note?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />
        </Box>

        {/* ---- Bloco "Pesos/Valores" (TASK-FE-883, Contrato §3.4.3) —
            `startWeight`/`valueUnitary`/`unityAnimalUa` continuam
            `InputReadOnly`, NUNCA `register()`/`Controller` editável.
            `price_arroba_alive` (TASK-FE-919, item 4.1, `GAP-BE-472`
            `[AVALIADO]`) passou a ser campo RHF real em AMBOS os modos
            (criação e edição) — mirror do legado, que NUNCA o travava
            (`_forms.blade.php:85`, sem `->readonly()`) — e sincronizado
            BIDIRECIONALMENTE com `price_kilo_alive` (`main.js:828-846`),
            coerência com `UpdateAnimalAction` (GAP-BE-422). ---- */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <InputReadOnly
            label={text.form.fields.startWeight}
            value={startWeightPreview ?? text.form.hints.calculatedEmpty}
            loading={isLoading}
          />
          <InputReadOnly
            label={text.form.fields.valueUnitary}
            value={valueUnitaryPreview ?? text.form.hints.calculatedEmpty}
            loading={isLoading}
          />
          <InputReadOnly
            label={text.form.fields.unityAnimalUa}
            value={unityAnimalUaPreview ?? text.form.hints.calculatedEmpty}
            loading={isLoading}
          />
          <Controller
            name="price_arroba_alive"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="currency"
                name={field.name}
                label={text.form.fields.priceArrobaAlive}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // TASK-FE-919 (item 4.1) — sincronia BIDIRECIONAL fiel ao
                  // legado (`main.js:828-836`): editar a @ viva recalcula o
                  // Kg vivo (`÷ 30`), nos dois modos.
                  const arrobaNumber = Number(value);
                  if (Number.isFinite(arrobaNumber)) {
                    setValue('price_kilo_alive', arrobaNumber / 30, { shouldDirty: true });
                  }
                }}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Bloco "Genealogia" (Contrato §19, TASK-FE-901) — SEMPRE
            visível, Mãe/Pai voltam a ser TEXTO LIVRE (`Input` simples), não
            mais `SelectAsyncPaginate` sobre `GET /animals/options`
            (`GAP-BE-426` REVERTIDO no E2E — "faça como era no legado").
            Sem validação de existência (RN-4): o backend tenta casar o
            texto com um animal ativo da mesma fazenda e vincula por baixo;
            se não achar, grava o texto assim mesmo, sem erro. ---- */}
        <Box mt={6}>
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {text.form.sections.genealogy}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Input
              label={text.form.fields.motherAnimal}
              placeholder={text.form.placeholders.motherAnimal}
              maxLength={191}
              {...register('mother')}
              error={errors.mother?.message as string | undefined}
              loading={isLoading}
              disabled={!canSave}
            />

            <Input
              label={text.form.fields.fatherAnimal}
              placeholder={text.form.placeholders.fatherAnimal}
              maxLength={191}
              {...register('father')}
              error={errors.father?.message as string | undefined}
              loading={isLoading}
              disabled={!canSave}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Bloco "Estágio/Status Reprodutivo" (TASK-FE-884, Contrato
            §3.4.5) — condicional a `_category_is_reproductive === true`
            (`TASK-BE-930`: capturado direto do `mapOptions` do Select de
            Categoria na seleção; na edição, `resolveCategoryIsReproductiveForEdit`
            resolve o campo-sombra via `/category-animals/options`). ---- */}
        {watchedIsReproductive && (
          <Box
            mt={6}
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            p={4}
          >
            <Text fontSize="sm" fontWeight="semibold" mb={4}>
              {text.form.sections.reproductiveStatus}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="category_matrice_id"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.categoryMatrice}
                    placeholder={text.form.placeholders.categoryMatrice}
                    error={errors.category_matrice_id?.message as string | undefined}
                    service={listActiveCategoryMatrices}
                    mapOptions={(item: CategoryMatrixOptionItem) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    findParams={() => ({ specie_uuid: watchedSpecie?.value })}
                    cacheUniqs={[watchedSpecie?.value]}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="reproductive_status"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.reproductiveStatus}
                    name={name}
                    placeholder={text.form.placeholders.reproductiveStatus}
                    value={value}
                    onChange={(opt: Option<1 | 2 | 3> | null) => {
                      onChange(opt);
                      // Contrato §3.4.5 — `birth_forecast` só se aplica a
                      // "Prenha" (1). Contrato §3.4.6 — bloco Bezerro só se
                      // aplica a "Parida" (3). Esconder ≠ preservar estado
                      // indevidamente (mesma disciplina do resto do
                      // arquivo) — limpa ao mudar para qualquer outro valor.
                      if (opt?.value !== 1) {
                        setValue('birth_forecast', null, { shouldDirty: true });
                      }
                      if (opt?.value !== 3) {
                        setValue('child', null, { shouldDirty: true });
                      }
                    }}
                    options={reproductiveStatusOptions.options(languageGB)}
                    error={error?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              {isPregnantStatus && (
                <Controller
                  name="birth_forecast"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      label={text.form.fields.birthForecast}
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v ?? null)}
                      error={errors.birth_forecast?.message as string | undefined}
                      isRequired
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              )}
            </SimpleGrid>

            {/* ---- Bloco "Bezerro" (TASK-FE-884, Contrato §3.4.6) —
                condicional (aninhado), 5 campos. Renderizado SÓ em modo
                CRIAÇÃO — achado real: `UpdateAnimalAction` nunca processa
                `child` (o bezerro é uma 2ª linha de `Animal`, criada só por
                `StoreAnimalAction`); mostrar o bloco editável na edição
                seria uma UI desonesta (preenchimento silenciosamente
                ignorado pelo backend). ---- */}
            {shouldShowChildBlock ? (
              <Box mt={6}>
                <Text fontSize="sm" fontWeight="semibold">
                  {text.form.sections.child.title}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={0.5} mb={4}>
                  {text.form.sections.child.hint}
                </Text>
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  {/* TASK-FE-919 (item 4.8/D8) — os 5 campos são OBRIGATÓRIOS
                      neste bloco: ele só renderiza quando
                      `reproductive_status === Parida (3)` (`shouldShowChildBlock`
                      acima), condição idêntica à do `.when()` do schema —
                      fiel ao legado (`handlePregnant()`,
                      `_forms.blade.php:478-489`). `isRequired`/`error`
                      adicionados para dar feedback visual, antes ausente. */}
                  <Controller
                    name="child.category_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.form.fields.childCategory}
                        placeholder={text.form.placeholders.childCategory}
                        error={errors.child?.category_uuid?.message as string | undefined}
                        service={listCategoryAnimalOptions}
                        mapOptions={(item: CategoryAnimalOptionItem) => ({
                          label: item.label,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          // Fix #5 (063-est03-9-reprovacoes, TASK-FE-063-09) —
                          // bloco Bezerro NUNCA restringia por espécie/faixa
                          // etária jovem (achado: `category-animal-service.ts`
                          // documentava isso como "não implementado"). Mirror
                          // exato de `Nascimentos/CreateOrUpdateBirthAnimal.tsx`
                          // (mesmos 2 parâmetros, já existentes na API — sem
                          // mudança de contrato).
                          specie_uuid: watchedSpecie?.value,
                          birth_categories: true,
                        })}
                        cacheUniqs={[watchedSpecie?.value]}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={!canSave || isLoading}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Controller
                    name="child.birth_date"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        label={text.form.fields.childBirthDate}
                        value={field.value ?? null}
                        onChange={(v) => field.onChange(v ?? '')}
                        error={errors.child?.birth_date?.message as string | undefined}
                        isRequired
                        disabled={!canSave || isLoading}
                      />
                    )}
                  />

                  <Controller
                    name="child.weight"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        name={field.name}
                        label={text.form.fields.childWeight}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        min={0}
                        allowDot
                        decimalPlaces={2}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={!canSave || isLoading}
                      />
                    )}
                  />

                  <Controller
                    name="child.id_animal_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.form.fields.childIdentificationType}
                        placeholder={text.form.placeholders.childIdentificationType}
                        error={errors.child?.id_animal_uuid?.message as string | undefined}
                        service={listIdentificationTypeOptions}
                        mapOptions={(item: IdentificationTypeOptionItem) => ({
                          label: item.label,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={!canSave || isLoading}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Input
                    label={text.form.fields.childIdentification}
                    {...register('child.identification')}
                    error={errors.child?.identification?.message as string | undefined}
                    isRequired
                    disabled={!canSave || isLoading}
                  />
                </SimpleGrid>

                {errors.child?.message && (
                  <Text fontSize="xs" color="fg.error" mt={2}>
                    {errors.child.message as string}
                  </Text>
                )}
              </Box>
            ) : (
              isEditing &&
              watchedReproductiveStatus?.value === 3 && (
                <Box mt={6}>
                  <Text fontSize="xs" color="fg.muted">
                    {text.form.sections.child.createOnlyHint}
                  </Text>
                </Box>
              )
            )}
          </Box>
        )}

        {/* ---- Bloco "Depreciação" (TASK-FE-885, Contrato §3.4.7) —
            condicional a categoria "Touros/Rufiões" (fallback por rótulo,
            ver `BULL_CATEGORY_LABEL` no topo do arquivo — sem flag
            semântica disponível em `CategoryAnimalResource`, Gap
            recomendado para o Arquiteto). 7 campos escreváveis CONFIRMADOS
            contra `AnimalRequest::rules()` (api_root) — `vl_residual`/
            `vl_depreciate` calculados client-side e ENVIADOS (não
            recalculados pelo backend, achado real). NENHUM campo duplica a
            feature Depreciação Mensal (irmã desta execução). ---- */}
        {shouldShowDepreciationBlock && (
          <Box
            mt={6}
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            p={4}
          >
            <Text fontSize="sm" fontWeight="semibold" mb={4}>
              {text.form.sections.depreciation}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="depreciation_type"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.depreciationType}
                    name={name}
                    placeholder={text.form.placeholders.depreciationType}
                    value={value}
                    onChange={(opt: Option<0 | 1> | null) => {
                      onChange(opt);
                      // `residual` obrigatório client-side só quando
                      // `depreciation_type === 1` (fiel ao legado,
                      // `animal-schema.ts`) — limpa ao mudar para "0".
                      if (opt?.value !== 1) {
                        setValue('residual', null, { shouldDirty: true });
                      }
                    }}
                    options={depreciationTypeOptions.options(languageGB)}
                    error={error?.message}
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="vl_acquisition"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={text.form.fields.vlAcquisition}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="residual"
                control={control}
                render={({ field, fieldState }) => (
                  <PercentInput
                    name={field.name}
                    label={text.form.fields.residual}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={fieldState.error?.message}
                    isRequired={watchedDepreciationType?.value === 1}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="depreciation"
                control={control}
                render={({ field, fieldState }) => (
                  <PercentInput
                    name={field.name}
                    label={text.form.fields.depreciation}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="life_bens"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.lifeBens}
                    value={field.value ?? null}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // TASK-FE-919 (item 4.10/D10) — `depreciation = 100 /
                      // life_bens`, fiel a `_forms.blade.php:313-322`
                      // (`change` em `#inp-life_bens`: fórmula do código é
                      // `((vl_depreciate / life_bens) / vl_depreciate) *
                      // 100`, que se simplifica algebricamente para
                      // `100 / life_bens`). Guarda `> 0` idêntica ao legado
                      // (`if (lifeBens && lifeBens > 0)`) — `life_bens = 0`
                      // é valor legítimo e comum (`AnimalRequest::rules()`
                      // usa `min:0`, não `gt:0`); sem a guarda o cálculo
                      // produziria `Infinity`/`NaN`. Campo continua editável
                      // manualmente depois (sugestão, não trava).
                      const lifeBensNumber = Number(value);
                      if (Number.isFinite(lifeBensNumber) && lifeBensNumber > 0) {
                        setValue('depreciation', 100 / lifeBensNumber, { shouldDirty: true });
                      }
                    }}
                    min={0}
                    decimalPlaces={0}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>

            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <InputReadOnly
                label={text.form.fields.vlResidual}
                value={vlResidualPreview ?? text.form.hints.calculatedEmpty}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.form.fields.vlDepreciate}
                value={vlDepreciatePreview ?? text.form.hints.calculatedEmpty}
                loading={isLoading}
              />
              {/* TASK-FE-902 — `vl_depreciated`/`sd_depreciate`: dado CRU do
                  servidor (`AnimalResource.depreciation`), readonly, sem
                  fórmula client-side (mirror `startWeight` acima) — sempre
                  "—" para animal recém-criado (processo de depreciação
                  mensal, fora de escopo desta execução). */}
              <InputReadOnly
                label={text.form.fields.vlDepreciated}
                value={vlDepreciatedPreview ?? text.form.hints.calculatedEmpty}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.form.fields.sdDepreciate}
                value={sdDepreciatePreview ?? text.form.hints.calculatedEmpty}
                loading={isLoading}
              />
            </SimpleGrid>
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}

// -----------------------------------------------------------------------------
// IdentificationsSection — bloco de identificação dinâmica (`useFieldArray`),
// componente-irmão NO MESMO ARQUIVO (mirror `ApportionmentsSection` de
// `CreateOrUpdateCentroCusto.tsx`). `useFieldArray` fica no componente PAI
// (não aqui) porque o `replace([])` de "trocar type para no_id limpa o
// array" é disparado pelo onChange do campo Tipo, que vive fora desta seção.
// -----------------------------------------------------------------------------

interface IdentificationsSectionProps {
  fields: FieldArrayWithId<AnimalForm, 'identifications', 'id'>[];
  control: Control<AnimalForm>;
  errors: FieldErrors<AnimalForm>;
  setValue: UseFormSetValue<AnimalForm>;
  onAdd: () => void;
  onRemove: UseFieldArrayRemove;
  canSave: boolean;
  isLoading: boolean;
  text: LanguageDate['animals']['animal']['form'];
  // TASK-FE-931 — `exclude_uuid` do `GET /animals/verify-identification` só
  // é enviado na EDIÇÃO (Animal-contrato.md §21.5), para o próprio animal
  // não acusar duplicata de si mesmo.
  isEditing: boolean;
  excludeUuid?: string;
}

function IdentificationsSection({
  fields,
  control,
  errors,
  setValue,
  onAdd,
  onRemove,
  canSave,
  isLoading,
  text,
  isEditing,
  excludeUuid,
}: IdentificationsSectionProps) {
  const identificationsText = text.identifications;
  const isDisabled = !canSave || isLoading;
  // Erro de nível de ARRAY (ex.: `.min(1)` — obrigatório quando
  // `type = "Individual"`) — `errors.identifications` é `Merge<FieldError,
  // ...[]>` no react-hook-form: tem `.message` próprio E é indexável por linha.
  const arrayError = errors.identifications?.message;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {identificationsText.sectionTitle}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={0.5}>
          {identificationsText.sectionHint}
        </Text>
      </Box>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || identificationsText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <IdentificationRow
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              isDisabled={isDisabled}
              onRemove={onRemove}
              text={text}
              identificationsText={identificationsText}
              isEditing={isEditing}
              excludeUuid={excludeUuid}
            />
          ))}
        </Flex>
      )}

      <Button
        title={identificationsText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        onClick={onAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// IdentificationRow — linha individual da tabela de Identificação, componente
// PRÓPRIO (não inline no `.map()`) para poder usar `useWatch` com ordem de
// hooks ESTÁVEL por instância (TASK-FE-919, item 4.6/D6): cada linha precisa
// observar o PRÓPRIO Tipo de Identificação para saber se é "Sem
// Identificação" e, nesse caso, auto-preencher/travar o campo Identificação
// ao lado — fiel a `_forms.blade.php:449-460` (`change` em `.id_animals`) e
// `:463-472` (`handleIdAnimal()`, mesmo tratamento no load inicial).
// -----------------------------------------------------------------------------

interface IdentificationRowProps {
  index: number;
  control: Control<AnimalForm>;
  setValue: UseFormSetValue<AnimalForm>;
  isDisabled: boolean;
  onRemove: UseFieldArrayRemove;
  text: LanguageDate['animals']['animal']['form'];
  identificationsText: LanguageDate['animals']['animal']['form']['identifications'];
  // TASK-FE-931 — Animal-contrato.md §21.
  isEditing: boolean;
  excludeUuid?: string;
}

function IdentificationRow({
  index,
  control,
  setValue,
  isDisabled,
  onRemove,
  text,
  identificationsText,
  isEditing,
  excludeUuid,
}: IdentificationRowProps) {
  const watchedRowType = useWatch({
    control,
    name: `identifications.${index}.identification_type_uuid`,
  });
  const isNoIdRow =
    (watchedRowType as Option<string> | null)?.label === NO_IDENTIFICATION_TYPE_LABEL;

  // TASK-FE-931 — guarda "só consulte se o valor MUDOU", mirror do mesmo
  // padrão de `handleNifBlur` (`CreateOrUpdateCliente.tsx`/
  // `CreateOrUpdateUsuario.tsx`, `originalNifDigitsRef`): evita round-trip
  // repetido quando o usuário só entra e sai do campo sem digitar nada novo.
  // `useRef` por instância de linha — estável porque `IdentificationRow` é
  // montado 1x por `field.id` (key estável do `useFieldArray`).
  const lastCheckedRef = useRef<string>('');

  // Aviso NÃO-BLOQUEANTE (toast), Animal-contrato.md §21.6 — nunca
  // `setError`/`clearErrors`, o campo permanece válido e submissível mesmo
  // com `exists: true`. Early-return espelha o do backend (§21.1/21.8):
  // vazio ou "S/ID" nunca dispara a chamada; linha "Sem Identificação"
  // (`isNoIdRow`, campo travado com "S/ID" automático) também não.
  async function handleIdentificationBlur(rawValue: string) {
    const value = (rawValue ?? '').trim();
    if (!value || value === 'S/ID' || isNoIdRow) return;
    if (value === lastCheckedRef.current) return;
    lastCheckedRef.current = value;

    try {
      const result = await verifyAnimalIdentification({
        identification: value,
        exclude_uuid: isEditing ? excludeUuid : undefined,
      });
      if (result.exists) {
        toaster.create({
          type: 'warning',
          title: identificationsText.duplicateWarningTitle,
          description: identificationsText.duplicateWarningDescription.replace(
            '{{identification}}',
            result.identification
          ),
        });
      }
    } catch {
      // Falha de rede/servidor no aviso não deve travar o preenchimento do
      // formulário — é só uma checagem prévia informativa (§21.6), nunca
      // parte do caminho crítico de submit.
    }
  }

  return (
    <Flex gap={3} align="flex-end" wrap="wrap">
      <Box flex="1" minW="240px">
        <Controller
          name={`identifications.${index}.identification_type_uuid`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <SelectAsyncPaginate
              name={rowField.name}
              label={text.fields.identificationType}
              placeholder={text.placeholders.identificationType}
              service={listIdentificationTypeOptions}
              mapOptions={(item: IdentificationTypeOptionItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={rowField.value ?? null}
              onChange={(option: any) => {
                rowField.onChange(option ?? null);
                // Fiel ao legado: zera SEMPRE o campo Identificação desta
                // linha e, se o novo tipo for "Sem Identificação", auto-
                // preenche "S/ID" (o Input ao lado trava via `isNoIdRow`).
                const isNewNoIdRow = (option?.label ?? null) === NO_IDENTIFICATION_TYPE_LABEL;
                setValue(`identifications.${index}.identification`, isNewNoIdRow ? 'S/ID' : '', {
                  shouldDirty: true,
                });
              }}
              error={fieldState.error?.message}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Box>

      <Box flex="1" minW="200px">
        <Controller
          name={`identifications.${index}.identification`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              name={rowField.name}
              label={text.fields.identification}
              placeholder={text.placeholders.identification}
              value={rowField.value ?? ''}
              onChange={rowField.onChange}
              onBlur={() => {
                rowField.onBlur();
                handleIdentificationBlur(rowField.value ?? '');
              }}
              error={fieldState.error?.message}
              isRequired
              disabled={isDisabled || isNoIdRow}
            />
          )}
        />
      </Box>

      <IconButtonTable
        aria-label={identificationsText.removeRowLabel}
        mensegerTooltip={identificationsText.removeRowLabel}
        size="sm"
        color="red.500"
        variant="ghost"
        disabled={isDisabled}
        onClick={() => onRemove(index)}
      >
        <Icon as={FiTrash2} />
      </IconButtonTable>
    </Flex>
  );
}
