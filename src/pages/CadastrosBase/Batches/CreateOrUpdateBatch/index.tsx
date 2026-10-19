// src/pages/CadastrosBase/Batches/CreateOrUpdateBatch/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de LOTE ANIMAL — Cadastros Base / Pecuária.
// REGENERADA do zero (TASK-FE-1081) — a versão anterior importava
// componentes INEXISTENTES (`@/components` barrel, `InputForm`,
// `SelectAsyncPaginateForm`, `InputDateForm`) e um schema desatualizado em
// `../batch-schema` (descartado — o canônico vive em
// `@/validations/schemas/CadastrosBase/batch-schema.ts`).
//
// Rotas: `/batches/novo` e `/batches/:batchId` (GUID), registradas em
// `src/router/index.tsx` (este arquivo não mexe em rota/menu), guardadas por
// `batch_view`.
//
// Molde estrutural: `Administrativo/Funcoes/CreateOrUpdateFuncao.tsx`
// (isEditing por GUID, `useCustomFormQueryByGuid`, mutação via `useRequest`,
// 422 mapeado por campo via `setError`) + `BaseRegistrations/
// ParameterWeights/CreateOrUpdateParameterWeights.tsx` (InputDate +
// `format`/`parseISO`, `code` somente-leitura no edit, sem campo no create).
//
// Campos, conforme contrato v1.1 §2/§3: `description` (required, max:100),
// `date` (required), `specie_uuid` (required, `SelectAsyncPaginate`),
// `category_uuids` (required, min 1, `SelectAsyncPaginate isMulti`),
// `animal_uuids` (nullable, `SelectAsyncPaginate isMulti`, contador ao vivo).
// **SEM Status, SEM Curral** — `status` nasce sempre `'A'`, só muda via
// Arquivar (fora desta tela); `corral_uuid` fora da tela por ora
// (`FeedlotCorral` não migrado, contrato v1.1 §5.1). `employee_uuid` é campo
// morto na UI legada — não incluído no form (nullable, sem prejuízo).
//
// ---- Categorias: obrigatória na ESCRITA, DERIVADA na LEITURA -------------
// `fillBatchForm` pré-popula Categorias com o valor que `categories` trouxer
// NA LEITURA (derivado no backend a partir dos animais vinculados, contrato
// v1.1 §3) — NUNCA preserva/reconcilia a seleção original do create. Se o
// Lote não tiver animais, `categories` pode vir vazio mesmo tendo
// `category_uuids` gravados — comportamento real, não corrigido aqui.
// PROIBIDA reatividade client-side entre Animais↔Categorias antes de salvar
// (não implementada nesta tela — a derivação é 100% backend, só visível
// depois de salvar e recarregar).
//
// ---- Semântica do PUT sobre os vínculos (sync — confirmado no backend,
// `UpdateAnimalBatchAction::execute`) -----------------------------------
// Chave AUSENTE no payload → preserva o vínculo atual; array VAZIO → esvazia
// o vínculo; array com uuids → substitui o conjunto inteiro. Esta tela
// SEMPRE envia `category_uuids`/`animal_uuids` (nunca omite a chave) —
// decisão consciente: o multi-select é a fonte única da verdade da tela para
// esses 2 vínculos (o usuário vê e controla o conjunto completo a cada
// save), então "0 selecionados" significa "esvaziar", nunca "não mexer".
//
// ---- Confirmações do condutor pós-entrega (2026-08-04) --------------------
// (1) `TASK-BE-958` ENTREGUE — `categories` derivado no `show()` a partir de
//     `animals.category` — é exatamente o valor que `fillBatchForm` usa
//     acima, sem mudança necessária nesta tela.
// (2) `total_animals`/`animals` no `show()` agora só contam/listam animais
//     Ativo/Pendente (correção de fidelidade ao legado, `Batch.php:161-166`
//     do `agro365` — a relação nova não filtrava e foi corrigida). Para
//     Lotes com histórico de animais mortos/vendidos/perdidos, o número é
//     MENOR do que antes — exibido exatamente como a API devolve
//     (`batchDetail?.total_animals`), sem recálculo local.
// (3) `GAP-BE-485` (P0, em correção no momento desta entrega): os 2
//     Controllers deste módulo podem devolver 500 em qualquer request com
//     `X-Farm-Id` (`$request->currentFarm->id` não resolve). Se o teste
//     real bater 500, é esse defeito de backend — não é regressão desta
//     tela, não compensado aqui (sem mock, sem try/catch adicional).
//
// ---- TASK-FE-1089 (3 achados do E2E do dev) --------------------------------
// 1) Categorias filtram por Espécie — `specie_uuid` opcional no
//    `GET /category-animals/options` (mirror EXATO do que TASK-FE-1088 já
//    fez em `ParameterAnimals` — mesmo `findParams`/`cacheUniqs`, mesma
//    decisão de DESABILITAR a Categoria sem Espécie, para as 2 telas
//    ficarem coerentes, conforme pedido do Task-Packet).
// 2) 1 card de Animais POR Categoria selecionada (`CheckboxListField`, com
//    "Marcar/Desmarcar todos" e "Total Animais: N" PRÓPRIOS de cada card) —
//    substitui o campo único "Animais" genérico de antes.
// 3) Rodapé com os 5 índices (Total Animais Lote/Peso Total/Peso Médio/
//    Total UA/UA Média) — SOMADOS CLIENT-SIDE a partir de
//    `BatchCandidateAnimal.quantity/weight/ua` (NUNCA `/450` — a constante
//    não existe neste arquivo; o backend já expõe `ua` por animal pronto
//    para somar, contrato do handover). Denominador das 2 médias é
//    `SUM(quantity)`, nunca a contagem de linhas selecionadas.
//
// Fonte dos candidatos: `GET /animal-batches/candidate-animals` — SEM
// paginação (decisão do dev, maior grupo observado 5.085 animais). 1 único
// fetch por mudança do conjunto de Categorias selecionadas
// (`useBatchCandidateAnimals`), os cards e o rodapé são só FILTRO/SOMA
// client-side sobre esse mesmo array — nunca um fetch por card.
//
// `animal_uuids` deixa de ser `Option<string>[]` (um `SelectAsyncPaginate`
// só) e passa a ser `string[]` PLANO — union de todos os cards (o payload
// NÃO distingue categoria, `batch_animals` não tem essa coluna; o
// agrupamento em cards é 100% derivado client-side de
// `BatchCandidateAnimal.category`, nunca enviado ao backend).
//
// Trocar a Espécie com Categorias/Animais já selecionados E remover uma
// Categoria com Animais marcados: AMBOS avisam (toast) ANTES de limpar —
// nunca silencioso (mesmo padrão do Executor de `ParameterAnimals`,
// TASK-FE-1088, `warnings.categoryClearedBySpecieChange`).
//
// ---- TASK-FE-1090 (achado do E2E do dev — campo "Peso") -------------------
// Campo `parameter_weight_uuid`, OPCIONAL (fiel ao legado,
// `_forms.blade.php:20`, tem opção vazia "Selecione") — NÃO obrigatório no
// schema, envia `null` quando vazio (chave NUNCA omitida do payload,
// `TASK-BE-970` aceita `nullable`). Posicionado na 1ª linha, entre Data e
// Espécie (mesma ordem do legado: Data → Peso → Espécie → Categorias).
//
// Endpoint de opções: NÃO existe `/parameter-weights/options` dedicado no
// fork (confirmado por leitura direta de `routes/api.php`/
// `ParameterWeightController.php`, api_root — só o CRUD paginado
// `apiResource('parameter-weights', ...)`, sem rota `options` registrada).
// Reused em vez disso o service de listagem PAGINADA já existente,
// `listParameterWeights` (`src/services/v2/BaseRegistrations/
// parameterWeights-service.ts`, ✅ CONCLUÍDO desde TASK-PW-FE-01) — mesmo
// padrão já usado por outras telas do próprio fork para alimentar
// `SelectAsyncPaginate` sem endpoint de options dedicado (`listEmployees`,
// `listRoles`, `listProducts`, `listPlanAccounts`); NÃO é um caminho novo,
// nenhuma rota/service nova foi criada.
//
// Refiltra os candidatos de TODOS os cards (`parameter_weight_uuid` entra
// junto de `category_uuids` e do if/else `without_batch`/`batch_uuid`,
// TASK-BE-968 — `useBatchCandidateAnimals`/`useBatches.tsx`) e integra a
// query key (evita a contaminação de cache já tratada hoje na árvore de
// Centros de Custo). Trocar o Peso com Animais já selecionados PODE tirar
// alguns do universo filtrado (o filtro entra também nas chamadas de quem já
// está vinculado ao lote, em edição) — avisa (toast) ANTES de descartar,
// mesmo tratamento de Espécie/Categoria acima, nunca silencioso.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import customToast from '@/utils/custom-toast';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { batchSchemaResolver } from '@/validations/schemas/CadastrosBase/batch-schema';

import { listParameterWeights } from '@/services/v2/BaseRegistrations/parameterWeights-service';
import { createBatch, updateBatch } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { ParameterWeightListItem } from '@/@types/v2/BaseRegistrations/parameterWeights';
import type { BatchData, BatchForm } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

import { useBatchCandidateAnimals, useBatchForm } from '../useBatches';

// Forma INTERNA do form (só deste componente) — os Selects de Espécie/
// Categoria trabalham com `Option` (`SelectAsyncPaginate`); `animal_uuids`
// é a union PLANA de uuids marcados em TODOS os cards (TASK-FE-1089, achado
// 2) — o submit converte `category_uuids`/`specie_uuid` para uuid cru,
// `animal_uuids` já nasce no shape do payload.
interface BatchFormValues {
  description: string;
  date: string | null;
  specie_uuid: Option<string> | null;
  /** TASK-FE-1090 — campo "Peso", OPCIONAL (`null` = sem Peso selecionado). */
  parameter_weight_uuid: Option<string> | null;
  category_uuids: Option<string>[];
  animal_uuids: string[];
}

const emptyFormValues: BatchFormValues = {
  description: '',
  date: null,
  specie_uuid: null,
  parameter_weight_uuid: null,
  category_uuids: [],
  animal_uuids: [],
};

// TASK-FE-1083 corrigiu `batch-service.ts` na origem (`createBatch`/
// `updateBatch` já devolvem `Response<BatchData>` de verdade) — sem
// necessidade de adapter/cast aqui, `tryPersistBatch` chama o service direto.

export default function CreateOrUpdateBatch() {
  const { batchId } = useParams<{ batchId: string }>();
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.batches.batch;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(batchId);

  const canSave = isEditing ? can('batch_edit') : can('batch_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<BatchFormValues>({
    mode: 'onChange',
    resolver: batchSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  // `categories`/`animals` vêm DERIVADOS da leitura (contrato v1.1 §3) — o
  // `reset` reflete exatamente o que a API devolveu, sem reconciliar com a
  // seleção original do create. `animal_uuids` agora é `string[]` PLANO
  // (TASK-FE-1089) — só extrai o `uuid`, o agrupamento por card é derivado
  // depois, client-side, de `BatchCandidateAnimal.category`.
  function fillBatchForm(data: BatchData, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        description: data.description,
        date: data.date ?? null,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie_uuid }
          : null,
        // TASK-FE-1090 — pré-preenche o Peso a partir do que o `show`
        // devolveu (objeto aninhado `parameter_weight`, TASK-BE-970); `null`
        // quando o Lote não tem Peso associado (campo opcional).
        parameter_weight_uuid: data.parameter_weight
          ? { label: data.parameter_weight.description, value: data.parameter_weight.uuid }
          : null,
        category_uuids: (data.categories ?? []).map((category) => ({
          label: category.description,
          value: category.uuid,
        })),
        animal_uuids: (data.animals ?? []).map((animal) => animal.uuid),
      });
      // Sincroniza a referência do aviso de descarte por troca de Peso
      // (abaixo) com o valor recém-carregado — o reset de `fillBatchForm`
      // (carga inicial de edição) NUNCA é "o usuário trocou o Peso", então
      // nunca deve disparar o toast/poda de `animal_uuids`.
      appliedParameterWeightUuidRef.current = data.parameter_weight_uuid ?? undefined;
    }
  }

  const batchQuery = useBatchForm({
    registrationId: isEditing ? batchId : undefined,
    fillForm: fillBatchForm,
  });

  const isLoading = isEditing && checkLoadingStatus([batchQuery as any]);

  // `code`/`total_animals` NÃO são campos RHF (fora do contrato de escrita) —
  // lidos direto do detalhe carregado pelo `GET`, só para exibição.
  const batchDetail = batchQuery?.data as BatchData | undefined;

  // TASK-FE-1089 — Espécie/Categorias observadas para (a) filtrar a
  // Categoria por `specie_uuid` e (b) disparar/realimentar o fetch único de
  // candidatos (`useBatchCandidateAnimals`), do qual TODOS os cards e o
  // rodapé derivam por filtro/soma client-side.
  const watchedSpecie = useWatch({ control, name: 'specie_uuid' });
  const watchedCategories = useWatch({ control, name: 'category_uuids' }) ?? [];
  const selectedCategoryUuids = watchedCategories.map((category) => category.value);

  // TASK-FE-1090 — Peso observado para (a) refiltrar os candidatos de TODOS
  // os cards e (b) avisar antes de descartar Animais já selecionados que
  // saírem do universo filtrado. `appliedParameterWeightUuidRef` guarda o
  // último valor de Peso já "processado" pelo efeito de poda abaixo —
  // sincronizado em `fillBatchForm` (carga inicial/reset NUNCA dispara o
  // aviso) e atualizado pelo próprio efeito a cada troca real do usuário.
  const watchedParameterWeight = useWatch({ control, name: 'parameter_weight_uuid' });
  const appliedParameterWeightUuidRef = useRef<string | undefined>(
    watchedParameterWeight?.value ?? undefined
  );

  // Animais selecionados — union PLANA de todos os cards (contador do
  // rodapé, achado 3). `useWatch` (não acesso a API interna do RHF) —
  // mirror `CreateOrUpdateFuncao.tsx` (preview de `vl_time_productive`).
  const watchedAnimalUuids = useWatch({ control, name: 'animal_uuids' }) ?? [];

  // Busca dentro de CADA card — controlada LOCALMENTE (client-side puro,
  // `CheckboxListField` nunca decide sozinho): `candidate-animals` já
  // devolve TODOS os candidatos das categorias selecionadas de uma vez
  // (sem paginação), então a busca por card é só um `.filter()` sobre o
  // array já carregado, sem round-trip novo por card.
  const [cardSearch, setCardSearch] = useState<Record<string, string>>({});

  // Fonte ÚNICA dos candidatos (achado 2/3) — NUNCA `without_batch`+
  // `batch_uuid` na MESMA chamada (o backend empilha os dois em AND, sempre
  // vazio — `whereHas`/`doesntHave` são mutuamente exclusivos). Em CRIAÇÃO,
  // `useBatchCandidateAnimals` manda só `without_batch: true` (só animais
  // livres). Em EDIÇÃO, faz 2 chamadas SEPARADAS (`batch_uuid` sozinho +
  // `without_batch` sozinho) e une por `uuid` — o card de uma categoria já
  // vinculada ao Lote passa a oferecer TANTO os animais já vinculados A
  // ESTE lote QUANTO os livres (decisão do condutor: a impossibilidade de
  // unir os dois é acidente da mecânica de render do legado — ver nota
  // completa em `useBatches.tsx`/`useBatchCandidateAnimals` — não regra de
  // negócio). Só os já-vinculados vêm pré-selecionados (via `animal_uuids`
  // populado por `fillBatchForm`/`data.animals`, independente desta query).
  const candidatesQuery = useBatchCandidateAnimals({
    categoryUuids: selectedCategoryUuids,
    batchUuid: isEditing ? batchId : undefined,
    // TASK-FE-1090 — Peso entra em TODAS as chamadas de candidatos (junto de
    // `category_uuids` e do if/else acima), MESMO nome do filtro de
    // `TASK-BE-968` — e na query key do hook (evita cache contaminado).
    parameterWeightUuid: watchedParameterWeight?.value,
  });
  const candidates = candidatesQuery.data ?? [];

  // TASK-FE-1090 (escopo item 3) — trocar o Peso pode tirar Animais já
  // selecionados do universo filtrado (o Peso agora entra também nas
  // chamadas de quem já está vinculado ao lote, em edição). Só dispara
  // quando o PESO realmente mudou por ação do usuário (nunca no reset
  // inicial de `fillBatchForm`, sincronizado acima) e só depois que o novo
  // conjunto de candidatos já assentou (`!candidatesQuery.isFetching`) —
  // nunca compara contra o array da busca ANTERIOR ainda em voo. Mesmo
  // tratamento (toast ANTES de descartar) de Espécie/Categoria acima.
  useEffect(() => {
    const currentParameterWeightUuid = watchedParameterWeight?.value;
    if (appliedParameterWeightUuidRef.current === currentParameterWeightUuid) return;
    if (candidatesQuery.isFetching) return;

    appliedParameterWeightUuidRef.current = currentParameterWeightUuid;

    const currentAnimalUuids = getValues('animal_uuids') ?? [];
    if (currentAnimalUuids.length === 0) return;

    const validCandidateUuids = new Set(candidates.map((candidate) => candidate.uuid));
    const remainingAnimalUuids = currentAnimalUuids.filter((uuid) => validCandidateUuids.has(uuid));

    if (remainingAnimalUuids.length !== currentAnimalUuids.length) {
      toaster.create(
        customToast({
          status: 'warning',
          description: text.form.warnings.animalsClearedByWeightChange,
        })
      );
      setValue('animal_uuids', remainingAnimalUuids, { shouldDirty: true });
    }
  }, [watchedParameterWeight?.value, candidatesQuery.isFetching]);

  // ---- Rodapé — 5 índices (achado 3), 100% CLIENT-SIDE ---------------------
  // `SUM(quantity)`/`SUM(weight)`/`SUM(ua)` dos candidatos SELECIONADOS —
  // NUNCA a contagem de linhas (`quantity > 1` existe de verdade) e NUNCA
  // `/450` (a constante não existe neste arquivo — `ua` já vem pronto por
  // animal do backend para somar). Arredondamento só na EXIBIÇÃO
  // (`.toFixed(2)`), nunca antes de somar.
  const selectedCandidates = candidates.filter((candidate) =>
    watchedAnimalUuids.includes(candidate.uuid)
  );
  const totalAnimalsLote = selectedCandidates.reduce(
    (sum, candidate) => sum + candidate.quantity,
    0
  );
  const totalWeightLote = selectedCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  const totalUaLote = selectedCandidates.reduce((sum, candidate) => sum + candidate.ua, 0);
  // Denominador das 2 médias é `SUM(quantity)` (`totalAnimalsLote`), NUNCA
  // `selectedCandidates.length` (linhas) — contrato do handover.
  const averageWeightLote = totalAnimalsLote > 0 ? totalWeightLote / totalAnimalsLote : 0;
  const averageUaLote = totalAnimalsLote > 0 ? totalUaLote / totalAnimalsLote : 0;

  const batchMutation = useRequest({
    asyncFunction: tryPersistBatch,
    entityName: text.singularLabel,
    queryKey: queryKey.batches.list,
    queryKey2: queryKey.batches.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistBatch(data: BatchFormValues) {
    // Payload FULL-RESOURCE sempre (mirror `CreateOrUpdateFuncao.tsx`) —
    // `AnimalBatchRequest::rules()` exige `description`/`date`/`specie_uuid`/
    // `category_uuids` em AMBOS os verbos (store×update idênticas, contrato
    // v1.1 §3). `category_uuids`/`animal_uuids` SEMPRE enviados (nunca a
    // chave omitida) — o multi-select é a fonte única da verdade da tela
    // para os 2 vínculos (ver nota de topo sobre semântica do `sync()`).
    const payload: BatchForm = {
      description: data.description.trim(),
      date: data.date as string,
      // Schema Yup já garante `specie_uuid` preenchido antes do `onSubmit`
      // disparar a mutação — non-null assertion segura aqui.
      specie_uuid: data.specie_uuid!.value,
      // TASK-FE-1090 — `parameter_weight_uuid` é OPCIONAL: `null` quando o
      // Select está vazio, NUNCA a chave omitida (o backend aceita
      // `nullable`, `TASK-BE-970`) — mesma decisão de sempre enviar
      // `category_uuids`/`animal_uuids` abaixo, aplicada aqui a um campo
      // simples (não um vínculo array, mas o mesmo racional de "o form é a
      // fonte única da verdade a cada save").
      parameter_weight_uuid: data.parameter_weight_uuid?.value ?? null,
      category_uuids: data.category_uuids.map((option) => option.value),
      // `animal_uuids` já nasce `string[]` PLANO (TASK-FE-1089) — union de
      // todos os cards, sem estrutura por categoria (payload não distingue
      // categoria, `batch_animals` não tem essa coluna).
      animal_uuids: data.animal_uuids,
    };

    try {
      return isEditing && batchId
        ? await updateBatch(batchId, payload)
        : await createBatch(payload);
    } catch (error: any) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `CreateOrUpdateFuncao.tsx`/`CreateOrUpdateAtividade.tsx`.
      if (error?.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof BatchFormValues, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Guarda EXPLÍCITA — `Object.keys(dirtyFields).length === 0`, NUNCA
  // `isEmpty`/`!isEmpty` (utilitário INVERTIDO, `ERRO-FE-001` — retorna
  // `true` quando o objeto TEM chaves; eliminado nesta regeneração).
  async function onSubmit(data: BatchFormValues) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await batchMutation.mutateAsync(data);
  }

  const isSubmitting = batchMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
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
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* `code` — gerado pelo backend, NUNCA editável (contrato v1.1 §3
              RN-1). SEM campo no create (a API não expõe prévia); no edit,
              somente-leitura, vindo do GET, nunca reenviado no payload. */}
          {isEditing && (
            <Skeleton loading={isLoading} borderRadius="md">
              <Field label={text.form.fields.code}>
                <Text fontSize="md" fontWeight="medium">
                  {batchDetail?.code ?? ''}
                </Text>
              </Field>
            </Skeleton>
          )}

          <Skeleton loading={isLoading} borderRadius="md">
            <Input
              label={text.form.fields.description}
              placeholder={text.form.placeholders.description}
              {...register('description')}
              error={errors.description?.message}
              isRequired
              disabled={!canSave}
            />
          </Skeleton>

          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DateInput
                  label={text.form.fields.date}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  isRequired
                  disabled={!canSave}
                  error={error?.message}
                />
              )}
            />
          </Skeleton>

          {/* TASK-FE-1090 — campo "Peso" (`parameter_weight_uuid`), OPCIONAL
              (sem `isRequired`, mirror fiel ao legado que tem opção vazia
              "Selecione"). Posicionado logo após Data, antes de Espécie —
              mesma ordem do form legado (`_forms.blade.php:99-114`, Data →
              Peso → Espécie). Endpoint de opções dedicado NÃO existe no
              fork (só o CRUD paginado `/parameter-weights`) — reusa
              `listParameterWeights`, já existente (TASK-PW-FE-01), mesmo
              padrão de outras telas do fork sem `/options` dedicado. */}
          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="parameter_weight_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.parameterWeight}
                  placeholder={text.form.placeholders.parameterWeight}
                  service={listParameterWeights}
                  mapOptions={(item: ParameterWeightListItem) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  // `?? null` NUNCA `?? undefined` — mantém o Select
                  // CONTROLADO (mesma correção de `specie_uuid` abaixo).
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isReadOnly={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="specie_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.specie}
                  placeholder={text.form.placeholders.specie}
                  service={listSpecieOptions}
                  mapOptions={(item: SpecieOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  // `?? null` NUNCA `?? undefined` — mantém o Select
                  // CONTROLADO (mesma correção documentada em
                  // `CreateOrUpdateFuncao.tsx`).
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    const isSameSpecie = option?.value === field.value?.value;
                    field.onChange(option ?? null);
                    if (!isSameSpecie) {
                      // TASK-FE-1089 (escopo item 2) — trocar a Espécie
                      // invalida as Categorias já selecionadas (elas podem
                      // não pertencer mais à nova Espécie) E, em cascata, os
                      // cards de Animais (que existem só enquanto a
                      // categoria-mãe está selecionada). O legado zera tudo
                      // EM SILÊNCIO — aqui avisamos ANTES de limpar, mesmo
                      // padrão do Executor de `ParameterAnimals`
                      // (TASK-FE-1088, toast ANTES do `setValue`), para as 2
                      // telas ficarem coerentes.
                      const previousCategories = getValues('category_uuids');
                      const previousAnimals = getValues('animal_uuids');
                      if (
                        (previousCategories?.length ?? 0) > 0 ||
                        (previousAnimals?.length ?? 0) > 0
                      ) {
                        toaster.create(
                          customToast({
                            status: 'warning',
                            description: text.form.warnings.categoriesClearedBySpecieChange,
                          })
                        );
                      }
                      setValue('category_uuids', [], { shouldDirty: true });
                      setValue('animal_uuids', [], { shouldDirty: true });
                    }
                  }}
                  error={error?.message}
                  isRequired
                  isReadOnly={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoading} borderRadius="md" gridColumn="1 / -1">
            <Controller
              name="category_uuids"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.categories}
                  placeholder={
                    watchedSpecie
                      ? text.form.placeholders.categories
                      : text.form.placeholders.specie
                  }
                  service={listCategoryAnimalOptions}
                  mapOptions={(item: CategoryAnimalOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    // Achado 1 (TASK-FE-1089) — `GET /category-animals/
                    // options?specie_uuid=` já existe, parâmetro OPCIONAL
                    // (mesma decisão de `ParameterAnimals`, TASK-FE-1088):
                    // sem Espécie, `watchedSpecie?.value` é `undefined` e o
                    // comportamento antigo (lista completa) é preservado —
                    // mas a Categoria fica DESABILITADA nesse meio-tempo
                    // (`isReadOnly` abaixo), então essa lista completa nunca
                    // chega a ser exibida.
                    specie_uuid: watchedSpecie?.value,
                  })}
                  cacheUniqs={[watchedSpecie?.value]}
                  value={field.value ?? []}
                  onChange={(options: any) => {
                    const newOptions: Option<string>[] = options ?? [];
                    const previousOptions = field.value ?? [];
                    const removedCategoryUuids = previousOptions
                      .filter(
                        (previous: Option<string>) =>
                          !newOptions.some((next) => next.value === previous.value)
                      )
                      .map((previous: Option<string>) => previous.value);

                    // TASK-FE-1089 (escopo item 3) — remover uma Categoria
                    // faz o card dela DESAPARECER; se havia Animais
                    // marcados nesse card, avisamos (toast) ANTES de
                    // descartá-los da seleção — `candidates` aqui ainda
                    // reflete o conjunto de Categorias ANTERIOR (o fetch só
                    // reage depois que `field.onChange` abaixo atualizar
                    // `category_uuids`).
                    if (removedCategoryUuids.length > 0) {
                      const currentAnimalUuids = getValues('animal_uuids') ?? [];
                      const animalsToRemove = candidates
                        .filter(
                          (candidate) =>
                            removedCategoryUuids.includes(candidate.category.uuid) &&
                            currentAnimalUuids.includes(candidate.uuid)
                        )
                        .map((candidate) => candidate.uuid);

                      if (animalsToRemove.length > 0) {
                        toaster.create(
                          customToast({
                            status: 'warning',
                            description: text.form.warnings.animalsClearedByCategoryRemoval,
                          })
                        );
                        setValue(
                          'animal_uuids',
                          currentAnimalUuids.filter((uuid) => !animalsToRemove.includes(uuid)),
                          { shouldDirty: true }
                        );
                      }
                    }

                    field.onChange(newOptions);
                  }}
                  error={error?.message}
                  isRequired
                  // Decisão declarada (mirror EXATO de `ParameterAnimals`,
                  // TASK-FE-1088) — sem Espécie selecionada, a Categoria
                  // fica DESABILITADA (não apenas com lista vazia). O
                  // Task-Packet pediu para as 2 telas ficarem coerentes.
                  isReadOnly={!watchedSpecie || !canSave}
                  isMulti
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Skeleton>

          {/* Achado 2 (TASK-FE-1089) — 1 card de Animais POR Categoria
              selecionada. Fonte única: `candidates` (1 fetch, todas as
              Categorias selecionadas de uma vez) — cada card filtra
              `candidates` pela sua própria `category.uuid`, nunca um fetch
              por card. `Controller` sobre `animal_uuids` (union PLANA) —
              cada card lê/escreve só o subconjunto que pertence à sua
              Categoria, preservando a seleção dos demais cards. */}
          {selectedCategoryUuids.length > 0 && (
            <Controller
              name="animal_uuids"
              control={control}
              render={({ field }) => (
                <Flex direction="column" gap={4} gridColumn="1 / -1">
                  {watchedCategories.map((category) => {
                    const categoryCandidates = candidates.filter(
                      (candidate) => candidate.category.uuid === category.value
                    );
                    const categoryCandidateUuids = categoryCandidates.map(
                      (candidate) => candidate.uuid
                    );
                    const cardSelectedValues = (field.value ?? []).filter((uuid) =>
                      categoryCandidateUuids.includes(uuid)
                    );
                    const searchText = (cardSearch[category.value] ?? '').toLowerCase();
                    const visibleItems = categoryCandidates
                      .filter((candidate) =>
                        candidate.identification.toLowerCase().includes(searchText)
                      )
                      .map((candidate) => ({
                        value: candidate.uuid,
                        label: candidate.identification,
                      }));
                    // "Total Animais: N" do card = SUM(quantity) dos
                    // candidatos SELECIONADOS neste card — NUNCA a contagem
                    // de linhas (`selectedCountOverride`, ver
                    // `CheckboxListField`).
                    const totalAnimalsCard = categoryCandidates
                      .filter((candidate) => cardSelectedValues.includes(candidate.uuid))
                      .reduce((sum, candidate) => sum + candidate.quantity, 0);

                    return (
                      <Box key={category.value}>
                        <CheckboxListField
                          label={category.label}
                          items={visibleItems}
                          selectedValues={cardSelectedValues}
                          onChange={(newCardValues) => {
                            // "Marcar/Desmarcar todos" opera SÓ sobre os
                            // candidatos deste card (`items` acima já é
                            // escopado à Categoria) — mescla de volta na
                            // union plana preservando a seleção dos OUTROS
                            // cards (achado 2, escopo item 3).
                            const otherCardsSelection = (field.value ?? []).filter(
                              (uuid) => !categoryCandidateUuids.includes(uuid)
                            );
                            field.onChange([...otherCardsSelection, ...newCardValues]);
                          }}
                          searchValue={cardSearch[category.value] ?? ''}
                          onSearchChange={(value) =>
                            setCardSearch((previous) => ({ ...previous, [category.value]: value }))
                          }
                          searchPlaceholder={text.form.candidateAnimals.searchPlaceholder}
                          selectAllLabel={text.form.candidateAnimals.selectAllLabel}
                          deselectAllLabel={text.form.candidateAnimals.deselectAllLabel}
                          selectedCountLabel={text.form.candidateAnimals.totalAnimalsLabel}
                          selectedCountOverride={totalAnimalsCard}
                          emptyLabel={text.form.candidateAnimals.emptyLabel}
                          isLoading={candidatesQuery.isLoading}
                          isError={candidatesQuery.isError}
                          errorLabel={text.form.candidateAnimals.errorLabel}
                          onRetry={() => candidatesQuery.refetch()}
                          retryLabel={text.form.candidateAnimals.retryLabel}
                          isDisabled={!canSave}
                        />
                      </Box>
                    );
                  })}
                </Flex>
              )}
            />
          )}

          {/* Achado 3 (TASK-FE-1089) — rodapé com os 5 índices, recalculados
              a cada mudança de seleção (`selectedCandidates` acima). Só
              exibido quando há ao menos 1 Categoria selecionada (antes
              disso não há candidato nenhum carregado). */}
          {selectedCategoryUuids.length > 0 && (
            <SimpleGrid
              columns={{ base: 1, sm: 2, lg: 5 }}
              gap={4}
              gridColumn="1 / -1"
              paddingTop={2}
              borderTop="1px solid"
              borderColor="borderGrid"
            >
              <InputReadOnly
                label={text.form.footer.totalAnimals}
                value={String(totalAnimalsLote)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.totalWeight}
                value={totalWeightLote.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.averageWeight}
                value={averageWeightLote.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.totalUa}
                value={totalUaLote.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.averageUa}
                value={averageUaLote.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
            </SimpleGrid>
          )}
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
