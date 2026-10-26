// src/pages/CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO (topo OU descendente) e EDIÇÃO de CENTRO DE CUSTO —
// Cadastros Base. Rotas: /cadastros-base/centros-custo/novo (criar topo,
// TASK-FE-005), /cadastros-base/centros-custo/novo/:parentUuid (criar
// DESCENDENTE, TASK-FE-015 — rota registrada em TASK-FE-016) e
// /cadastros-base/centros-custo/:costCenterId (editar, GUID, TASK-FE-005).
//
// DEC-005/GAP-BE-032 (TASK-FE-015) — 3º modo "criar descendente": o
// Antecessor chega PRÉ-FIXADO por uma consulta PRÓPRIA ao servidor
// (`GET /cost-centers/{parentUuid}`, 2ª chamada a `useCostCenterForm`) e fica
// GENUINAMENTE imutável (`isDisabled`+`isReadOnly`, mesmo mecanismo já usado
// no modo edição) — ao contrário do legado, cujo "parent fixo" era só
// cosmético (`readonly` num `<select>` HTML não trava nada — dossiê
// `00-Documentacao_Bruta/CostCenter/02-criacao-descendentes-legado-vs-regra
// -dev.md` §2.3). `canSave` deixa de ser só permissão global nos 3 modos —
// vira por-ITEM na edição (`can_edit` do próprio registro) e na descendência
// (`can_create_descendant` do antecessor); só o create-de-topo puro ainda usa
// a permissão global + `hasRole("Gestor_Plataf")` (TASK-FE-014). Nenhum campo
// além do próprio Antecessor é ocultado no modo descendente — `type`/
// `allow_pointing`/rateio continuam plenamente aplicáveis. Zero mudança em
// `tryPersistCostCenter`: o branch de CREATE já monta `parent_uuid` a partir
// do form, que chega pré-preenchido pela query nova.
//
// Estrutura mecânica idêntica a CadastrosBase/Perfil/CreateOrUpdatePerfil.tsx
// (único CRUD-por-GUID já migrado pelo pipeline formal neste projeto) — SEM
// abas, já que este formulário não tem sub-recurso em tabs (a seção de
// Rateio abaixo entra condicionada a `type === 'apportioned'` no MESMO
// `useForm`, não em aba separada).
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../CentroCustoCadastro.tsx, commit
// 73b5fa86) COM CORREÇÃO nos pontos em que o mock diverge do contrato real
// da API (tabela de campos de 07-Tarefas_Frontend/03-centro-custo-formulario
// -dados-gerais.md é a fonte da verdade, não o mock):
//   - `type` real tem só 2 valores (produtivo/rateado), não os 3 do mock;
//   - `is_enabled`/`allow_pointing` são booleanos reais no contrato da API —
//     TASK-FE-CC-08 (decisão do dev D2) trocou a apresentação de Switch para
//     `Select` "Sim/Não", mas o DADO continua boolean: `CostCenterForm.
//     is_enabled`/`allow_pointing` (schema Yup) NÃO mudaram de tipo — a
//     conversão string↔boolean acontece só na fronteira do próprio campo
//     (`value`/`onChange` do Controller abaixo), nunca no estado do RHF nem
//     no payload (`tryPersistCostCenter` permanece inalterado);
//   - `parent_uuid` é imutável após criar — desabilitado em edição, nunca
//     enviado no payload de update;
//   - `code`/`class` são gerados 100% no backend — nunca calculados aqui; o
//     "preview" de Classe no create é só uma dica visual da regra real de
//     profundidade (Antecessor selecionado ⇒ Analítico), sempre rotulada
//     como prévia, nunca enviada no payload;
//   - Categorias Financeiras é só-leitura no v1 (dependência de contrato
//     aberta: `category_ids` numérico × `GET /financial-categories` só
//     devolve `uuid` — `category_ids` nunca é enviado);
//   - Rateio (`apportionments`, TASK-FE-004): a Referência UX (mock) NÃO TEM
//     esta seção — `centrosCusto.types.ts`/`CentroCustoCadastro.tsx` do
//     design system não modelam rateio nenhum (busca dedicada nesta rodada
//     confirmou zero ocorrências de "rateio"/"apportion" no acervo UX). Não
//     há, portanto, divergência mock-vs-API a corrigir aqui — é uma seção
//     nova sem precedente visual direto. Adaptação: reproduz a MESMA
//     linguagem visual já estabelecida NESTE arquivo para blocos agrupados
//     (a caixa de Código/Classe e a seção de Categorias Financeiras, ambas
//     `Box` com borda + rótulo + conteúdo) e o MESMO vocabulário de ícones do
//     módulo (`react-icons/fi`, igual a `index.tsx` do grid). Sem precedente
//     de field-array no canão de padrões (`get_pwa_screen_and_router_pattern`
//     / `get_pwa_complex_screen_compositions_pattern` não documentam
//     `useFieldArray`) — usa a API oficial e estável do `react-hook-form`
//     (já dependência do projeto, v7.51.2) diretamente.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  createCostCenter,
  listCostCenterOptions,
  updateCostCenter,
} from '@/services/v2/CostCenters/cost-center-service';
import type { ListCostCentersParams } from '@/services/v2/CostCenters/cost-center-service';

import type { ModuleCostCenters } from '@/@types/language/module-cost-centers';
import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  CostCenterDetail,
  CostCenterForm as CostCenterFormType,
  CostCenterPayload,
  CostCenterRef,
} from '@/@types/v2/CostCenters';

import { centroCustoSchemaResolver } from './centro-custo-schema';
import { useCostCenterForm } from './useCostCenters';

import { CategoryTreeSelector } from '../PlanAccount/CategoryTreeSelector';
import { useFinancialCategoryTree } from '../PlanAccount/usePlanAccounts';

export default function CreateOrUpdateCentroCusto() {
  const { costCenterId, parentUuid } = useParams<{ costCenterId: string; parentUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasRole } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(costCenterId);

  // DEC-005/TASK-FE-015 — modo "criar descendente": só quando `parentUuid`
  // (rota `/novo/:parentUuid`, TASK-FE-016) é um GUID válido E não estamos em
  // edição. Mutuamente exclusivo de `isEditing` por construção de rota
  // (`/novo/*` e `/:costCenterId` nunca casam ao mesmo tempo) — nunca `true`
  // simultaneamente.
  const isCreatingDescendant = isValidGuid(parentUuid) && !isEditing;

  const text = languageGB.costCenters.costCenter;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<CostCenterFormType>({
    mode: 'onChange',
    resolver: centroCustoSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      allow_pointing: false,
      type: 'productive',
      parent_uuid: null,
      apportionments: [],
      category_uuids: [],
    },
  });

  function fillForm(data: CostCenterDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        condition: String(data.condition) as '1' | '2' | '3',
        is_enabled: !!data.is_enabled,
        allow_pointing: !!data.allow_pointing,
        type: data.type,
        parent_uuid: data.parent
          ? { label: `${data.parent.code} — ${data.parent.description}`, value: data.parent.uuid }
          : null,
        // TASK-FE-004: rateio existente só é populado quando `type` já é
        // 'apportioned' no servidor — o backend só devolve `apportionments`
        // com sentido nesse caso (ver `ApportionmentsSection` para o cache de
        // rótulos `{label, value}` derivado deste mesmo `data.apportionments`).
        apportionments:
          data.type === 'apportioned'
            ? (data.apportionments ?? []).map((item) => ({
                cost_center_uuid: item.uuid,
                percentage: item.percentage,
              }))
            : [],
        // TASK-FE-314 (execução 023, GAP-FE-102 resolvido) — prefill real via
        // `CostCenterResource.categories[].uuid` (leitura já funcionava antes
        // desta Tarefa; só a escrita estava bloqueada). TASK-FE-316 troca só
        // o COMPONENTE visual (árvore em vez de lista chapada) — o RHF
        // continua guardando `string[]` idêntico; o `Set` intermediário que a
        // árvore consome é DERIVADO abaixo via `watch`, não populado aqui.
        category_uuids: (data.categories ?? []).map((category) => category.uuid),
      });
    }
  }

  const costCenterQuery = useCostCenterForm({
    registrationId: isEditing ? costCenterId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([costCenterQuery as any]);
  const costCenterData = costCenterQuery.data;

  // ---- Categorias Financeiras — árvore tri-state (TASK-FE-316, execução
  // 023, refinamento de UX pós-E2E pedido pelo dev) --------------------------
  // Substitui o `CheckboxListField` chapado (TASK-FE-314) por
  // `CategoryTreeSelector` (mesmo componente do Plano de Contas, ESTENDIDO com
  // `searchable`/`selectableGroups`), alimentado por `useFinancialCategoryTree`
  // — árvore inteira cacheada 5min, sem paginação/busca server-side. Única
  // fonte de verdade é o próprio `category_uuids` do RHF — o `Set` selecionado
  // é DERIVADO a cada render (sem `useState` paralelo desincronizável), mesmo
  // padrão já usado em `CreateOrUpdatePlanAccount.tsx`.
  const categoryTreeQuery = useFinancialCategoryTree();

  const watchedCategoryUuids = watch('category_uuids') ?? [];

  const selectedCategoryUuids = useMemo(
    () => new Set(watchedCategoryUuids),
    [watchedCategoryUuids]
  );

  function handleCategoryTreeChange(next: Set<string>) {
    setValue('category_uuids', Array.from(next), { shouldDirty: true, shouldValidate: true });
  }

  // DEC-005/TASK-FE-015 — modo "criar descendente": 2ª chamada ao MESMO hook
  // (`useCostCenterForm`/`useCustomFormQueryByGuid`), buscando o ANTECESSOR
  // via `GET /cost-centers/{parentUuid}` — nunca confiando só em dado de
  // navegação (`location.state`), mesmo racional de por que `isEditing`
  // sempre reconsulta o próprio registro em vez de confiar no que a grid já
  // tinha. `fillParentPreview` é uma função NOMEADA (Lei 2 do
  // `get_pwa_form_query_pattern` continua valendo, mesmo não preenchendo o
  // form inteiro) que escreve em `reset()` — mas só o campo `parent_uuid`,
  // via updater FUNCIONAL que preserva `current` (os demais campos digitados
  // pelo usuário nunca são tocados). Por isso a guarda `!isEmpty(dirtyFields)`
  // de Lei 2 não é necessária aqui: o próprio campo escrito (`parent_uuid`) é
  // sempre `isReadOnly`/`isDisabled` neste modo — o usuário jamais o suja —
  // e um reset repetido (ex.: refetch por refocus) é idempotente.
  const [parentPreview, setParentPreview] = useState<CostCenterDetail | null>(null);

  function fillParentPreview(data: CostCenterDetail) {
    setParentPreview(data);
    reset((current) => ({
      ...current,
      parent_uuid: { label: `${data.code} — ${data.description}`, value: data.uuid },
    }));
  }

  const parentPreviewQuery = useCostCenterForm({
    registrationId: isCreatingDescendant ? parentUuid : undefined,
    fillForm: fillParentPreview,
  });

  const isParentPreviewLoading =
    isCreatingDescendant && checkLoadingStatus([parentPreviewQuery as any]);
  const isParentPreviewError = isCreatingDescendant && !!(parentPreviewQuery as any)?.isError;

  // DEC-005/GAP-BE-032 — autorização por item (tabela de decisão da Tarefa):
  // edição usa `can_edit` do PRÓPRIO registro; descendência usa
  // `can_create_descendant` do ANTECESSOR; só o create-de-topo puro ainda usa
  // a permissão GLOBAL + `hasRole("Gestor_Plataf")` (TASK-FE-014 — sozinha,
  // `costcenters_create` deixou de distinguir topo de descendente desde
  // `GAP-BE-032`). Enquanto a query relevante ainda carrega
  // (`parentPreview`/`costCenterData` undefined/null), a fórmula resolve
  // `false` sem regressão de UX — o botão Salvar já é condicionado também por
  // `disabled={isSubmitting || isLoading}` (existente) e só é renderizado
  // quando `canSave` é `true`.
  const canSave = isEditing
    ? !!costCenterData?.can_edit
    : isCreatingDescendant
      ? !!parentPreview?.can_create_descendant
      : can('costcenters_create') && hasRole('Gestor_Plataf');

  // TASK-FE-004 — Rateio (`apportionments`) sobre o MESMO `useForm` acima
  // (Modelo A "CRUD Simples" continua válido — array é particularidade de
  // campo, não sub-recurso com Grid/rota própria). `replace` some
  // explicitamente usado no onChange de `type` (ver abaixo) para ZERAR o
  // array quando o tipo deixa de ser 'apportioned' (regra da Tarefa: refletir
  // visualmente a limpeza que o backend faz no update, não só esconder).
  const {
    fields: apportionmentFields,
    append: appendApportionment,
    remove: removeApportionment,
    replace: replaceApportionments,
  } = useFieldArray({ control, name: 'apportionments' });

  // Cache de RÓTULOS `{label, value}` para o SelectAsyncPaginate de cada
  // linha — `apportionments.*.cost_center_uuid` guarda só a uuid crua (Lei 2
  // do tipo já fixado em TASK-FE-001: mesmo shape do payload, sem
  // transformação nenhuma no submit). Duas fontes, mescladas:
  //  (1) linhas que já existiam no servidor (edição) — derivado direto de
  //      `costCenterData.apportionments` (code/description já vêm no GET);
  //  (2) linhas novas/alteradas nesta sessão — o próprio SelectAsyncPaginate
  //      devolve `{label, value}` no onChange; guardado aqui só para exibição.
  const serverApportionmentOptions = useMemo(() => {
    const map: Record<string, Option<string>> = {};
    costCenterData?.apportionments?.forEach((item) => {
      map[item.uuid] = { label: `${item.code} — ${item.description}`, value: item.uuid };
    });
    return map;
  }, [costCenterData]);

  const [pickedApportionmentOptions, setPickedApportionmentOptions] = useState<
    Record<string, Option<string>>
  >({});

  const apportionmentOptionsCache: Record<string, Option<string>> = {
    ...serverApportionmentOptions,
    ...pickedApportionmentOptions,
  };

  function handlePickApportionmentOption(option: Option<string>) {
    setPickedApportionmentOptions((prev) => ({ ...prev, [option.value]: option }));
  }

  // Busca de centros de custo p/ cada linha de rateio — mesmo endpoint/query
  // key do campo Antecessor (`listCostCenterOptions`, TASK-FE-972 — repontado
  // do CRUD gateado `listCostCenters` para o lookup enxuto SEM gate), com um
  // filtro client-side de bom senso: em edição, exclui o PRÓPRIO centro da
  // lista de opções (não confirmado se o backend já impede isso — ver
  // Tarefa). Filtrar pós-fetch é o único jeito seguro, já que o endpoint não
  // tem um param de exclusão para confiar. Assinatura ESTREITADA ao que
  // `/cost-centers/options` aceita — nunca envia `only_analytic`/`is_enabled`
  // aqui (o `findParams` do select só manda `search`), preservando "qualquer
  // classe/estado" (TASK-FE-972).
  const listCostCentersForApportionment = useCallback(
    async (
      params: Pick<
        ListCostCentersParams,
        'search' | 'per_page' | 'page' | 'only_analytic' | 'is_enabled'
      >
    ): Promise<ResponsePagination<CostCenterRef[]>> => {
      const response = await listCostCenterOptions(params);
      if (!isEditing || !costCenterId) return response;
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.filter((item) => item.uuid !== costCenterId),
        },
      };
    },
    [isEditing, costCenterId]
  );

  const costCenterMutation = useRequest({
    asyncFunction: tryPersistCostCenter,
    entityName: text.singularLabel,
    queryKey: queryKey.costCenters.list,
    queryKey2: queryKey.costCenters.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistCostCenter(data: CostCenterFormType) {
    const payload: CostCenterPayload = {
      description: data.description.trim(),
      condition: Number(data.condition) as 1 | 2 | 3,
      is_enabled: !!data.is_enabled,
      allow_pointing: !!data.allow_pointing,
      type: data.type,
      // TASK-FE-314 (execução 023, GAP-FE-102 resolvido) — `category_uuids`
      // SEMPRE enviado (mesmo `[]`), nunca omitido por guarda de dirty-field:
      // `UpdateCostCenterAction`/`SyncCostCenterCategoriesAction` rodam
      // incondicionalmente a cada update (mesma semântica documentada para
      // `center_uuids` em `FinancialCategoryRequest`, contrato-irmão) —
      // omitir a chave desvincularia TODAS as categorias já associadas.
      category_uuids: data.category_uuids ?? [],
    };

    // TASK-FE-004: `apportionments` só entra no payload quando `type` for
    // 'apportioned' — quando 'productive', a chave é OMITIDA de propósito
    // (nunca enviada como `[]`): o backend já ressincroniza/limpa os rateios
    // no update sempre que o tipo não é apportioned (`UpdateCostCenterAction`
    // — ver Tarefa), então omitir preserva a semântica de segurança do lote
    // anterior (nunca mandar uma chave que não é dona da tela) sem depender
    // de replicar aqui uma lógica de limpeza que já é 100% do servidor.
    if (data.type === 'apportioned') {
      payload.apportionments = data.apportionments.map((item) => ({
        cost_center_uuid: item.cost_center_uuid,
        percentage: Number(item.percentage),
      }));
    }

    if (isEditing && costCenterId) {
      // `parent_uuid`/`code`/`class` NUNCA no payload de update:
      // `parent_uuid` é `prohibited` no backend (imutável após criar) e
      // `code`/`class` são só saída, gerados 100% no backend.
      return await updateCostCenter(costCenterId, payload);
    }

    // CREATE: Antecessor aceito e opcional (vazio = centro raiz/Sintético).
    payload.parent_uuid = data.parent_uuid?.value ?? null;
    return await createCostCenter(payload);
  }

  async function onSubmit(data: CostCenterFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await costCenterMutation.mutateAsync(data);
    }
  }

  const isSubmitting = costCenterMutation.isPending;

  const conditionOptions: Option<string>[] = useMemo(
    () => [
      { value: '1', label: text.form.conditionOptions.expense },
      { value: '2', label: text.form.conditionOptions.revenue },
      { value: '3', label: text.form.conditionOptions.both },
    ],
    [text]
  );

  // TASK-FE-CC-08 (decisão do dev D2) — opções do `Select` "Sim/Não" para
  // `is_enabled`/`allow_pointing`. Rótulos genéricos (`defaltStrings`), não
  // específicos do módulo — mesmo racional de reaproveitamento já registrado
  // no cabeçalho do arquivo para `typeOptions`.
  const yesNoOptions: Option<string>[] = useMemo(
    () => [
      { value: 'true', label: languageGB.defaltStrings.yes },
      { value: 'false', label: languageGB.defaltStrings.no },
    ],
    [languageGB]
  );

  // Reaproveita as strings de `filter.typeOptions` (mesmo conceito de
  // enumeração — precedente já usado em `_examples/CreateOrUpdateRecurso`,
  // que reaproveita `list.table.active/inactive` dentro do form).
  const typeOptions: Option<string>[] = useMemo(
    () => [
      { value: 'productive', label: text.filter.typeOptions.productive },
      { value: 'apportioned', label: text.filter.typeOptions.apportioned },
    ],
    [text]
  );

  const watchedParentUuid = watch('parent_uuid');
  const watchedDescription = watch('description');
  const watchedType = watch('type');
  const watchedApportionments = watch('apportionments');

  // Indicador de soma dos percentuais — NÃO-BLOQUEANTE (decisão da Tarefa:
  // o backend hoje não valida que a soma feche em 100%, achado do Tester da
  // API registrado como pergunta de produto em aberto). Puramente informativo.
  const totalApportionmentPercentage = (watchedApportionments ?? []).reduce(
    (sum, item) => sum + (Number(item?.percentage) || 0),
    0
  );
  const isApportionmentSumComplete = Math.abs(totalApportionmentPercentage - 100) < 0.001;

  const classLabels = {
    1: text.form.classLabels.synthetic,
    2: text.form.classLabels.analytical,
  } as const;

  // Classe: sempre a REAL do servidor em edição; prévia heurística no
  // create (Antecessor selecionado ⇒ Analítico — mesma regra real de
  // profundidade, só que calculada aqui só para fins de exibição).
  const previewClass: 1 | 2 = watchedParentUuid ? 2 : 1;
  const displayClass = isEditing ? costCenterData?.class : previewClass;
  const displayClassLabel = isEditing ? costCenterData?.class_label : classLabels[previewClass];
  const displayCode = isEditing ? costCenterData?.code : text.form.hints.codeGenerated;

  const descriptionLength = (watchedDescription ?? '').length;

  return (
    <FormContainer
      title={
        isEditing
          ? text.form.title.edit
          : isCreatingDescendant
            ? text.form.title.createDescendant
            : text.form.title.create
      }
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
        {/* Código gerado + Classe — real em edição, prévia claramente rotulada no create */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={isLoading} borderRadius="md">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Flex align="center" gap={3}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {text.form.fields.code}
                </Text>
                <Text fontSize="md" fontWeight="bold" fontFamily="mono">
                  {displayCode}
                </Text>
              </Flex>
              <Flex align="center" gap={2}>
                {displayClass === 1 ? (
                  <Badge bg="classSyntheticBG" color="classSyntheticText" variant="subtle">
                    {displayClassLabel}
                  </Badge>
                ) : (
                  <Badge colorPalette="green" variant="subtle">
                    {displayClassLabel}
                  </Badge>
                )}
                {!isEditing && (
                  <Badge colorPalette="gray" variant="outline">
                    {text.form.hints.classPreviewBadge}
                  </Badge>
                )}
              </Flex>
            </Flex>
          </Skeleton>
        </Box>

        {/* DEC-005/TASK-FE-015 — banner contextual do Antecessor, só no modo
            "criar descendente". Reaproveita o MESMO estilo Box (borda +
            bg.muted) do card Código/Classe acima — nenhuma primitiva nova.
            Loading: Skeleton enquanto a 2ª query carrega. Erro (Decisão 3 da
            Tarefa): bloco inline no lugar do card — `canSave` já resolve
            `false` nesse caso (Salvar fica indisponível sem lógica extra). */}
        {isCreatingDescendant && (
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Skeleton loading={isParentPreviewLoading} borderRadius="md">
              {isParentPreviewError ? (
                <Flex direction="column" gap={0.5}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                    {text.form.parentPreview.errorTitle}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.form.parentPreview.errorDescription}
                  </Text>
                </Flex>
              ) : (
                <Flex align="center" gap={3} wrap="wrap">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {text.form.fields.parentUuid}
                  </Text>
                  <Text fontSize="md" fontWeight="bold">
                    {parentPreview
                      ? `${parentPreview.code} — ${parentPreview.description}`
                      : text.form.parentPreview.loading}
                  </Text>
                </Flex>
              )}
            </Skeleton>
          </Box>
        )}

        {/* Linha 1: Condição | Descrição | Ativo | Apontamento — TASK-FE-CC-08
            sobe a densidade para o preset `columnsForm.fourColumns` (mesmos
            breakpoints de `columnsForm.default` hoje — troca feita pelo NOME
            semântico pedido na Tarefa, sem mudança de comportamento visual
            nesta leva). Mobile (`base`) continua colapsando para 1 coluna. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <Controller
            name="condition"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.condition}
                name={name}
                value={conditionOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                options={conditionOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/40`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          {/* TASK-FE-CC-08 (decisão do dev D2): Switch → `Select` "Sim/Não".
              O DADO permanece boolean — `field.value` aqui É o boolean do RHF
              (schema Yup `is_enabled: yup.boolean().required()` inalterado);
              a conversão para a string 'true'/'false' que o `Select` consome
              acontece só na leitura do `value`/na escrita do `onChange`
              abaixo, nunca sobrevive no estado do formulário. Rótulos
              genéricos `defaltStrings.yes`/`.no` (já usados alhures no
              projeto) — sem chave de i18n nova no módulo. */}
          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={yesNoOptions.find((o) => o.value === (value ? 'true' : 'false')) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value === 'true')}
                options={yesNoOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="allow_pointing"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.allowPointing}
                name={name}
                value={yesNoOptions.find((o) => o.value === (value ? 'true' : 'false')) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value === 'true')}
                options={yesNoOptions}
                error={error?.message}
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Linha 2: Tipo (full width) */}
        <Box mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) => {
                  onChange(opt?.value);
                  // Regra da Tarefa: ao SAIR de 'apportioned', limpar
                  // VISUALMENTE o array (não só ocultar a seção) — o backend
                  // já ressincroniza vazio no update quando o tipo não é
                  // apportioned; a UI reflete isso na hora, não só no reload.
                  if (opt?.value !== 'apportioned') {
                    replaceApportionments([]);
                    setPickedApportionmentOptions({});
                  }
                }}
                options={typeOptions}
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </Box>

        {/* Seção condicional de Rateio (TASK-FE-004) — só quando o Tipo
            acima for 'apportioned'. Sem seção correspondente na Referência UX
            (mock não modela rateio nenhum — ver cabeçalho do arquivo);
            adaptação reproduz a linguagem visual já usada NESTE form para
            blocos agrupados (Box com borda, igual à caixa de Código/Classe e
            à seção de Categorias Financeiras abaixo). */}
        {watchedType === 'apportioned' && (
          <Box mt={6}>
            <ApportionmentsSection
              fields={apportionmentFields}
              control={control}
              errors={errors}
              onAdd={() => appendApportionment({ cost_center_uuid: '', percentage: 0 })}
              onRemove={removeApportionment}
              onPickOption={handlePickApportionmentOption}
              optionsCache={apportionmentOptionsCache}
              listCostCentersForRow={listCostCentersForApportionment}
              canSave={canSave}
              isLoading={isLoading}
              totalPercentage={totalApportionmentPercentage}
              isSumComplete={isApportionmentSumComplete}
              text={text}
            />
          </Box>
        )}

        {/* Linha 3: Antecessor (full width) */}
        <Box mt={6}>
          <Controller
            name="parent_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.parentUuid}
                placeholder={text.form.placeholders.parentUuid}
                tooltip={
                  isEditing
                    ? text.form.hints.parentUuidImmutable
                    : isCreatingDescendant
                      ? text.form.hints.parentUuidFixedDescendant
                      : text.form.hints.parentUuidCreate
                }
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isEditing || isCreatingDescendant || !canSave}
                isReadOnly={isEditing || isCreatingDescendant}
              />
            )}
          />
        </Box>

        {/* Categorias Financeiras vinculadas — árvore tri-state (TASK-FE-316,
            execução 023, substitui o `CheckboxListField` chapado da
            TASK-FE-314 a pedido do dev pós-E2E). Mesmo componente do card de
            Plano de Contas (`CategoryTreeSelector`), ESTENDIDO com
            `searchable` (busca client-side sobre a árvore já carregada,
            preservando o caminho até o nó) e `selectableGroups` (o Sintético/
            grupo também é selecionável como unidade própria, cascateando com
            as folhas — decisão do dev registrada no cabeçalho da Tarefa:
            backend aceita `category_uuids` de qualquer classe/profundidade,
            sem restrição). Sem busca server-side/paginação — a árvore
            inteira já vem numa única resposta cacheada (`useFinancialCategory
            Tree`). */}
        <Box mt={6}>
          <CategoryTreeSelector
            title={text.form.fields.categories}
            tree={categoryTreeQuery.data}
            isLoading={categoryTreeQuery.isLoading || isLoading}
            selected={selectedCategoryUuids}
            onChange={handleCategoryTreeChange}
            readOnly={!canSave}
            languageGB={languageGB}
            searchable
            selectableGroups
            strings={text.form.categoriesTree}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}

// -----------------------------------------------------------------------------
// ApportionmentsSection (TASK-FE-004) — seção de Rateio, componente-irmão NO
// MESMO ARQUIVO (Arquivos Afetados da Tarefa não lista arquivo novo). Mesma
// organização estrutural da Referência UX (`CategoriasSection` dentro de
// CentroCustoCadastro.tsx do design system) para uma seção agrupada
// condicional dentro do formulário principal — adaptada visualmente ao Box
// com borda já usado NESTE arquivo (caixa de Código/Classe + Categorias
// Financeiras), já que o mock não tem uma seção de Rateio para copiar.
//
// `useFieldArray` fica no componente PAI (não aqui) porque o `replace([])` de
// "trocar type para productive limpa o array" é disparado pelo onChange do
// campo Tipo, que vive fora desta seção (ela nem está montada quando
// `type !== 'apportioned'`) — então `fields/append/remove` chegam via props.
// -----------------------------------------------------------------------------

interface ApportionmentsSectionProps {
  fields: FieldArrayWithId<CostCenterFormType, 'apportionments', 'id'>[];
  control: Control<CostCenterFormType>;
  errors: FieldErrors<CostCenterFormType>;
  onAdd: () => void;
  onRemove: UseFieldArrayRemove;
  onPickOption: (option: Option<string>) => void;
  optionsCache: Record<string, Option<string>>;
  listCostCentersForRow: (
    params: Pick<
      ListCostCentersParams,
      'search' | 'per_page' | 'page' | 'only_analytic' | 'is_enabled'
    >
  ) => Promise<ResponsePagination<CostCenterRef[]>>;
  canSave: boolean;
  isLoading: boolean;
  totalPercentage: number;
  isSumComplete: boolean;
  text: ModuleCostCenters['costCenter'];
}

function ApportionmentsSection({
  fields,
  control,
  errors,
  onAdd,
  onRemove,
  onPickOption,
  optionsCache,
  listCostCentersForRow,
  canSave,
  isLoading,
  totalPercentage,
  isSumComplete,
  text,
}: ApportionmentsSectionProps) {
  const apportionmentsText = text.form.apportionments;
  const isDisabled = !canSave || isLoading;
  // Erro de nível de ARRAY (ex.: `.min(1)` — array vazio com type
  // apportioned) — `errors.apportionments` é `Merge<FieldError, ...[]>` no
  // react-hook-form: tem `.message` próprio E é indexável por linha.
  const arrayError = errors.apportionments?.message;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {apportionmentsText.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {apportionmentsText.sectionHint}
          </Text>
        </Box>

        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {apportionmentsText.sumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {totalPercentage.toFixed(2)}%
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({apportionmentsText.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || apportionmentsText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="240px">
                <Controller
                  name={`apportionments.${index}.cost_center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={apportionmentsText.fields.costCenter}
                      placeholder={apportionmentsText.placeholders.costCenter}
                      service={listCostCentersForRow}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={rowField.value ? optionsCache[rowField.value] : undefined}
                      onChange={(option: any) => {
                        rowField.onChange(option?.value ?? '');
                        if (option) onPickOption(option);
                      }}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`apportionments.${index}.percentage`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={apportionmentsText.fields.percentage}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      min={0}
                      max={100}
                      allowDot
                      decimalPlaces={2}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={apportionmentsText.removeRowLabel}
                mensegerTooltip={apportionmentsText.removeRowLabel}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => onRemove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={apportionmentsText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        onClick={onAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
