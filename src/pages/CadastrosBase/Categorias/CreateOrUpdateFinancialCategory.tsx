// src/pages/CadastrosBase/Categorias/CreateOrUpdateFinancialCategory.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO (raiz OU filha de um grupo, `?parentUuid=`) e EDIÇÃO
// de CATEGORIA FINANCEIRA (FinancialCategory) — Cadastros Base / Financeiro.
// TASK-FE-312. Estrutura mecânica idêntica a
// `Agrupadores/CreateOrUpdateAgrupador.tsx`/`CentroCusto/CreateOrUpdateCentroCusto.tsx`.
//
// Rotas (TASK-FE-313): /cadastros-base/categorias/novo?parentUuid=<uuid>
// (criar filho) e /cadastros-base/categorias/novo SEM `?parentUuid` (criar
// RAIZ — TASK-FE-1072, liberado a partir do botão "Novo +" do
// `HeaderTable.tsx`, visível só para `Gestor_Plataf`; GAP-FE-100 fechado) e
// /cadastros-base/categorias/:financialCategoryUuid (editar).
//
// Fidelidade §5/§6.2 do contrato:
//   - §5.1: `code`/`class` só saída, nunca calculados aqui — prévia de classe
//     no create é "Sintético" para RAIZ ou "Analítico" para FILHO
//     (TASK-FE-1072, `previewClass` abaixo) e claramente rotulada como prévia.
//   - §5.2: `classification` fica `disabled` em edição quando o registro é
//     Sintético (`class === 1`) — sempre "Não Classificado" nesse caso.
//   - TASK-FE-1091 (paridade exata com `_forms.blade.php`, condicional por
//     condicional): `type_uuid` e `generates_obligation_or_right` só
//     HERDAM do pai (modo "criar filho") quando HÁ fazenda/tenant
//     (`!isPlatformManager`) — sem fazenda, nascem VAZIOS; `grouper_uuid`
//     herda do pai SEMPRE, independente de fazenda. `type_uuid`/
//     `grouper_uuid`/`generates_obligation_or_right` ficam TRAVADOS
//     (`isTenantContextLocked`) sempre que há fazenda/tenant, em QUALQUER
//     modo (criar filho OU editar) — não só "criar filho". `accounting_
//     grouper_uuid` NUNCA aparece no CREATE (não há `$item` no legado) e só
//     aparece na EDIÇÃO de um item cujo `code` bate `^\d\.\d{2}\.\d{3}$`
//     (3 segmentos) — `showAccountingGrouper` abaixo; a antiga sugestão
//     herdada do pai neste campo foi removida (contradizia a regra).
//   - TASK-FE-1091 — "Antecessor" (`parent_id` do legado) é SEMPRE read-only
//     e agora também aparece na EDIÇÃO (banner com `financialCategoryData
//     .parent`, contrato aditivo TASK-BE-971), não só na criação de filho
//     (banner "Grupo pai" pré-existente, aceito pelo dev como equivalente).
//   - §3.5: `center_uuids` é SEMPRE enviado no update (mesmo vazio) — TASK-
//     FE-315 (GAP-FE-103 resolvido, TASK-BE-350): `FinancialCategoryResource
//     .show()` agora expõe `centers[].uuid/code/description`
//     (`whenLoaded`), então o prefill do `CheckboxListField` de Centros de
//     Custo é real (a partir de `financialCategoryData.centers`) e
//     `center_uuids` entra no payload de create/update sempre, nunca omitido
//     por `dirtyFields` — mesma disciplina já aplicada a `category_uuids` em
//     `CreateOrUpdateCentroCusto.tsx` (TASK-FE-314/GAP-FE-102).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

import { Badge, Box, Flex, SimpleGrid, Text, Wrap } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listAccountingGroupers } from '@/services/v2/AccountingGroupers/accounting-grouper-service';
import { listCategoryTypes } from '@/services/v2/CategoryTypes/category-type-service';
import {
  createFinancialCategory,
  updateFinancialCategory,
} from '@/services/v2/FinancialCategories/financial-category-service';
import { listGrouperOptions } from '@/services/v2/Groupers/grouper-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { AccountingGrouperListItem } from '@/@types/v2/AccountingGroupers';
import type { CategoryTypeRef } from '@/@types/v2/CategoryTypes';
import type {
  FinancialCategoryClassification,
  FinancialCategoryDetail,
  FinancialCategoryForm as FinancialCategoryFormType,
  FinancialCategoryPayload,
} from '@/@types/v2/FinancialCategories';
import type { GrouperListItem } from '@/@types/v2/Groupers';

import { financialCategorySchemaResolver } from './financial-category-schema';
import { useFinancialCategoryForm } from './useFinancialCategories';

interface ListAccountingGroupersForSelectParams extends PaginationQueryParams {
  search?: string;
}

import { useCostCenterTree } from '../CentroCusto/useCostCenters';
import { CategoryTreeSelector } from '../PlanAccount/CategoryTreeSelector';

export default function CreateOrUpdateFinancialCategory() {
  const { financialCategoryUuid } = useParams<{ financialCategoryUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasRole } = usePermissions();

  const text = languageGB.financialCategories.financialCategory;

  const isEditing = isValidGuid(financialCategoryUuid);
  const parentUuidParam = searchParams.get('parentUuid') ?? undefined;
  const isCreatingChild = !isEditing && isValidGuid(parentUuidParam);
  // TASK-FE-1072 (GAP-FE-100 fechado) — criar RAIZ é entrada LEGÍTIMA quando
  // não há `?parentUuid` NENHUM na URL (vindo do botão "Novo +" do
  // `HeaderTable.tsx`, só visível para `Gestor_Plataf`). Só é erro quando um
  // `parentUuid` FOI informado mas é inválido — aí sim expulsa.
  const isCreatingRoot = !isEditing && !parentUuidParam;

  useEffect(() => {
    if (!isEditing && !isCreatingChild && !isCreatingRoot) {
      navigate('/cadastros-base/categorias', { replace: true });
    }
  }, [isEditing, isCreatingChild, isCreatingRoot, navigate]);

  const canSave = isEditing ? can('financialcategories_edit') : can('financialcategories_create');

  // TASK-FE-1087 (complemento) — legado (`_forms.blade.php:53`) trava o
  // select `centers[]` com `readonly(session()->has('farm') ||
  // session()->has('tenant'))`: SÓ fica editável quando NENHUM dos dois
  // existe. Neste fork, todo usuário além de `Gestor_Plataf` está SEMPRE
  // ligado a um tenant (mesmo sem fazenda selecionada) — `Gestor_Plataf` é o
  // único papel sem farm/tenant, mesmo sinal já usado para a MESMA fronteira
  // plataforma-vs-tenant em `HeaderTable.tsx` deste módulo (`can(
  // 'financialcategories_create') && hasRole('Gestor_Plataf')`, botão "Novo
  // +" de raiz) e do de Centro de Custo (`!hasRole('Gestor_Plataf')`,
  // DEC-005/GAP-BE-032) — reaproveitado aqui em vez de inventar heurística
  // nova de `X-Farm-Id`/`activeFarmUuid` (que ficaria `false` para um tenant
  // sem fazenda ainda selecionada, deixando o campo destravado num caso que
  // o legado trava).
  const isPlatformManager = hasRole('Gestor_Plataf');

  // TASK-FE-1091 — legado (`_forms.blade.php:19,35,45`) trava Tipo/Gera
  // obrigação ou direito/Agrupador com o MESMO `readonly(session()->has(
  // 'farm') || session()->has('tenant'))` do Centro de Custo acima — em
  // QUALQUER modo (criar filho OU editar), não só "criar filho" como a
  // versão anterior deste arquivo fazia (por isso o Tipo/Gera obrigação/
  // Agrupador ficavam destravados ao EDITAR uma categoria com fazenda
  // ativa — defeito relatado pelo dev no E2E). Mesmo sinal `isPlatformManager`
  // já usado acima.
  const isTenantContextLocked = !isPlatformManager;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FinancialCategoryFormType>({
    mode: 'onChange',
    resolver: financialCategorySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      type_uuid: null,
      grouper_uuid: null,
      generates_obligation_or_right: false,
      classification: undefined,
      center_uuids: [],
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce` (ERRO-FE-001: `isEmpty` retorna `true` quando HÁ chaves —
  // aqui lido como "nenhuma edição em andamento", NUNCA remover o `!`).
  function fillForm(data: FinancialCategoryDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        type_uuid: data.type ? { label: data.type.description, value: data.type.uuid } : null,
        grouper_uuid: data.grouper ? { label: data.grouper.name, value: data.grouper.uuid } : null,
        generates_obligation_or_right: !!data.generates_obligation_or_right,
        classification: data.classification ?? undefined,
        // TASK-FE-315 (GAP-FE-103 resolvido) — prefill real via
        // `centers[].uuid` (mesmo padrão de `category_uuids` em
        // `CreateOrUpdateCentroCusto.tsx`, TASK-FE-314). TASK-FE-317 troca só
        // o COMPONENTE visual (árvore em vez de lista chapada) — o RHF
        // continua guardando `string[]` idêntico; o `Set` intermediário que a
        // árvore consome é DERIVADO no `Controller` abaixo, não populado aqui.
        center_uuids: (data.centers ?? []).map((center) => center.uuid),
      });
    }
  }

  const financialCategoryQuery = useFinancialCategoryForm({
    registrationId: isEditing ? financialCategoryUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([financialCategoryQuery as any]);
  const financialCategoryData = financialCategoryQuery.data;

  // Busca de agrupadores contábeis p/ o combo Agrupador Contábil. `listAccountingGroupers`
  // (service) NÃO pagina — devolve o array completo (mesmo racional documentado em
  // `AgrupadoresContabeis/CreateOrUpdateAgrupadorContabil.tsx`). Este adaptador constrói
  // o shape `ResponsePagination` exigido pelo `service` do `SelectAsyncPaginate`
  // (paginação CLIENT-SIDE sobre o array já carregado — catálogo financeiro pequeno;
  // não é mock, é o mesmo dado real da API, só paginado no cliente para caber no
  // contrato do componente).
  const listAccountingGroupersForSelect = useCallback(
    async (
      params: ListAccountingGroupersForSelectParams
    ): Promise<ResponsePagination<AccountingGrouperListItem[]>> => {
      const all = await listAccountingGroupers({ search: params.search });

      const perPage = params.per_page ?? all.length ?? 1;
      const page = params.page ?? 1;
      const start = (page - 1) * perPage;
      const pageItems = all.slice(start, start + perPage);

      return {
        success: true,
        data: {
          items: pageItems,
          pagination: {
            total: all.length,
            count: pageItems.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.max(1, Math.ceil(all.length / perPage)),
          },
        },
      };
    },
    []
  );

  // ---- Preview do grupo PAI (modo "criar filho", contrato §5.4) ----------
  const [parentPreview, setParentPreview] = useState<FinancialCategoryDetail | null>(null);

  function fillParentPreview(data: FinancialCategoryDetail) {
    setParentPreview(data);
    reset((current) => ({
      ...current,
      // TASK-FE-1091 (`_forms.blade.php:18`) — Tipo só herda do pai quando HÁ
      // fazenda/tenant (`isTenantContextLocked`); SEM fazenda/tenant nasce
      // VAZIO ("Selecione"), nunca copia o Tipo do grupo pai — é o campo que
      // fica EDITÁVEL nesse cenário (`isTenantContextLocked` abaixo também
      // controla o travamento do Select).
      type_uuid:
        isTenantContextLocked && data.type
          ? { label: data.type.description, value: data.type.uuid }
          : current.type_uuid,
      // `_forms.blade.php:43` — Agrupador herda do pai SEMPRE, com ou sem
      // fazenda/tenant (só o travamento do campo depende do contexto).
      grouper_uuid: data.grouper
        ? { label: data.grouper.name, value: data.grouper.uuid }
        : current.grouper_uuid,
      // `_forms.blade.php:34` — Gera obrigação ou direito segue a MESMA regra
      // do Tipo: só herda do pai com fazenda/tenant; sem fazenda mantém o
      // default (`false`, "vazio" para um boolean).
      generates_obligation_or_right: isTenantContextLocked
        ? !!data.generates_obligation_or_right
        : current.generates_obligation_or_right,
      // UT-000762 — "Classificação" vem PRÉ-SELECIONADA com o valor do pai no
      // create-FILHO (aceite literal da UT), mesmo mecanismo de
      // `grouper_uuid` acima: herda SEMPRE, com ou sem fazenda/tenant (não é
      // gateada por `isTenantContextLocked`). O campo continua EDITÁVEL — só
      // pré-popula o valor inicial do form; `isClassificationLocked` (abaixo)
      // continua restrito a edição de item Sintético, inalterado. Se o pai
      // vier sem `classification`, mantém o valor atual do form (não força).
      classification: data.classification ?? current.classification,
      // Agrupador Contábil NÃO é mais sugerido a partir do pai — o campo
      // nunca aparece no CREATE (`showAccountingGrouper` abaixo), então
      // pré-popular aqui seria trabalho morto (TASK-FE-1091 remove o §5.3
      // antigo, que contradizia a regra do legado de "só aparece
      // editando item existente").
      // ERRO-FE-031 — Centros de Custo do pai NÃO entram mais no
      // `center_uuids` do form-state do filho (ver `tryPersistFinancialCategory`
      // acima): a exibição no create-filho passa a ler direto de
      // `parentPreview.centers` (lista read-only abaixo), e o `center_uuids`
      // do RHF não é enviado nesse modo — manter o campo em `[]` (default)
      // evita confundir com um valor que nunca é submetido.
    }));
  }

  const parentPreviewQuery = useFinancialCategoryForm({
    registrationId: isCreatingChild ? parentUuidParam : undefined,
    fillForm: fillParentPreview,
  });

  const isParentPreviewLoading = isCreatingChild && checkLoadingStatus([parentPreviewQuery as any]);
  const isParentPreviewError = isCreatingChild && !!(parentPreviewQuery as any)?.isError;

  // ---- Centros de Custo — árvore tri-state (TASK-FE-317, execução 023;
  // TASK-FE-1087 inverte o contrato de seleção; TASK-FE-1091 UNIFICA a
  // fonte de dados — ver ADENDO ao Task-Packet) --------------------------
  // `CategoryTreeSelector` (mesmo componente do Plano de Contas/Centro de
  // Custo). O dev respondeu à pergunta pendente sobre qual árvore o campo
  // deveria exibir COM fazenda/tenant: replicar o legado
  // (`_forms.blade.php:53`) — SÓ os 22 nós de TOPO, SEMPRE, com ou sem
  // fazenda/tenant. `onlyTopLevel: true` deixa de ser exclusivo do
  // `isPlatformManager` — agora é INCONDICIONAL; só o `readOnly` (abaixo)
  // continua gateado por `isPlatformManager`.
  //
  // `useCostCenterTree({ onlyTopLevel: true })`: `only_top_level=true`
  // (backend, opt-in) devolve só os 22 nós `class=1`/Sintéticos GLOBAIS
  // (`tenant_id NULL`), sem `children` — LISTA PLANA em ambos os ramos.
  // `selectableGroups=true` (incondicional agora) faz o uuid do PRÓPRIO nó
  // de topo entrar no `Set` selecionado — sem isso, os poucos vínculos que
  // por acaso caem num nó de topo (raro) não apareceriam marcados nem para
  // o Gestor_Plataf. Sem `children`, "Expandir Tudo" perde sentido em
  // QUALQUER ramo (`showExpandCollapse={false}`, incondicional) e
  // `emptyGroup` seria enganoso (`hideEmptyGroupLabel`, incondicional).
  //
  // ⚠️ SALVAGUARDA (dev, ADENDO) — com fazenda/tenant o campo continua
  // `readOnly` (só `isPlatformManager` edita), e a maioria dos vínculos
  // REAIS é profunda (69.735 dos 83.462 medidos no legado são categoria de
  // tenant → centro do próprio tenant em nível profundo): esses uuids NÃO
  // estarão entre os 22 nós de topo exibidos, então o card provavelmente
  // aparecerá com NENHUM checkbox marcado para quem tem fazenda ativa —
  // exatamente como no legado (a lista curta faz o campo "parecer vazio"
  // mesmo tendo vínculos). Isso é intencional, não compensar com badge/
  // texto explicativo (decisão do dev, ciente da consequência).
  //
  // O que NÃO pode regredir: o PAYLOAD continua reenviando os uuids
  // pré-existentes fora da lista de 22 — `fillForm` (acima) popula
  // `center_uuids` a partir de `financialCategoryData.centers[].uuid` (o
  // Resource da PRÓPRIA categoria, não da árvore), e
  // `tryPersistFinancialCategory` (abaixo) envia `data.center_uuids ?? []`
  // tal como está no RHF — o `Controller` deste campo é `readOnly` quando
  // há fazenda/tenant, então `onChange` nunca dispara e o valor carregado
  // por `fillForm` chega intacto ao payload, mesmo que a árvore de 22 nós
  // não renderize esses uuids como marcados. `CategoryTreeSelector` só
  // decide o que MOSTRA marcado a partir dos nós que ele PRÓPRIO recebe
  // (`tree`); não filtra nem descarta o `selected`/`value` do RHF.
  //
  // `useCostCenterTree()` é COMPARTILHADO com `CentroCusto/useCostCenters
  // .tsx`; a query-key inclui o valor de `onlyTopLevel` (agora sempre
  // `true` aqui), sem colisão com a variante `false` usada em outras telas.
  const costCenterTreeQuery = useCostCenterTree({ onlyTopLevel: true });

  const financialCategoryMutation = useRequest({
    asyncFunction: tryPersistFinancialCategory,
    entityName: text.singularLabel,
    queryKey: queryKey.financialCategories.list,
    queryKey2: queryKey.financialCategories.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFinancialCategory(data: FinancialCategoryFormType) {
    const payload: FinancialCategoryPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      type_uuid: data.type_uuid?.value ?? '',
      grouper_uuid: data.grouper_uuid?.value ?? '',
      generates_obligation_or_right: !!data.generates_obligation_or_right,
      classification: data.classification as FinancialCategoryClassification,
    };

    // ERRO-FE-031 — no create-FILHO, `center_uuids` NUNCA vai no payload: os
    // centros exibidos vêm do grupo pai (`parentPreview.centers`, sintéticos
    // GLOBAIS, `tenant_id NULL`) e o backend (`StoreFinancialCategoryAction`)
    // já os HERDA sozinho no store. Enviar esses uuids sintéticos em
    // `center_uuids` disparava 422 (`FinancialCategoryRequest` rejeitava
    // sintético/global) — omitir a chave elimina o erro na origem. Em
    // RAIZ/EDIÇÃO o envio incondicional (TASK-FE-315/GAP-FE-103) é mantido
    // sem alteração.
    if (!isCreatingChild) {
      payload.center_uuids = data.center_uuids ?? [];
    }

    if (isEditing && financialCategoryUuid) {
      // `parent_uuid`/`code`/`class` nunca no payload de update.
      return await updateFinancialCategory(financialCategoryUuid, payload);
    }

    // CREATE — "criar filho" (`parentUuid` já validado pelo guard de
    // navegação acima) OU "criar raiz" (TASK-FE-1072): `parent_uuid: null`
    // explícito, aceito pelo backend (`FinancialCategoryRequest.parent_uuid`
    // é `nullable`) — nunca omite a chave para não confundir com "sem
    // alteração" em nenhum ponto do fluxo.
    payload.parent_uuid = isCreatingChild ? parentUuidParam : null;
    return await createFinancialCategory(payload);
  }

  // Mapeia 422 por campo (contrato — "422 mapeado por campo via errors do
  // RHF") ALÉM do toast genérico já exibido pelo `onError` do `useRequest`
  // (que já roda antes deste catch, via `mutateAsync` rejeitando na sequência).
  function applyServerFieldErrors(error: unknown) {
    if (!isAxiosError(error) || error.response?.status !== 422) return;
    const backendErrors = (error.response.data as any)?.errors as
      Record<string, string[]> | undefined;
    if (!backendErrors) return;

    const knownFields: Record<string, keyof FinancialCategoryFormType> = {
      description: 'description',
      type_uuid: 'type_uuid',
      grouper_uuid: 'grouper_uuid',
      classification: 'classification',
      is_enabled: 'is_enabled',
      generates_obligation_or_right: 'generates_obligation_or_right',
    };

    Object.entries(backendErrors).forEach(([field, messages]) => {
      const rhfField = knownFields[field];
      if (rhfField && messages[0]) {
        setError(rhfField, { type: 'server', message: messages[0] });
      }
    });
  }

  // Guard do submit — POLARIDADE de `isEmpty` (ERRO-FE-001): aqui
  // `isEmpty(dirtyFields)` é lido como "HÁ mudança real" (mesmo racional de
  // `CreateOrUpdateAgrupador.tsx`).
  async function onSubmit(data: FinancialCategoryFormType) {
    try {
      if (isEditing && isEmpty(dirtyFields)) {
        await financialCategoryMutation.mutateAsync(data);
        return;
      }
      if (isEditing) {
        navigate(-1);
        return;
      }
      await financialCategoryMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error);
    }
  }

  const isSubmitting = financialCategoryMutation.isPending;

  const classificationOptions: Option<FinancialCategoryClassification>[] = [
    { value: 'N', label: text.form.classificationOptions.unclassified },
    { value: 'C', label: text.form.classificationOptions.capex },
    { value: 'O', label: text.form.classificationOptions.opex },
  ];

  // §5.2 — `classification` travado quando o registro em EDIÇÃO é Sintético
  // (grupo, `class === 1`) — o servidor já entrega o valor real preenchido
  // ("Não Classificado"). No CREATE (raiz ou filho) o campo nunca trava: a
  // TASK-FE-1072 não pediu seletor/trava de `classification` para o caso
  // raiz, só corrigiu a EXIBIÇÃO da classe (badge abaixo) para não mentir.
  const isClassificationLocked = isEditing && financialCategoryData?.class === 1;

  // TASK-FE-1072 — prévia de `class` no CREATE: raiz nasce Sintética
  // (`class=1`, `GenerateFinancialCategoryCodeAction::generateForRoot()`),
  // filha nasce Analítica (`class=2`, único caso possível antes desta
  // tarefa). Só exibição — nada disso é enviado no payload.
  const previewClass = isCreatingRoot ? 1 : 2;

  // TASK-FE-1091 (`_forms.blade.php:56`) — Agrupador Contábil só aparece
  // editando um item (nunca no CREATE, não há `$item`) cujo `code` bate
  // EXATAMENTE 3 segmentos (`\d.\d{2}.\d{3}`, ex. "1.01.003"). Código de 4
  // segmentos (folha analítica, ex. "1.01.003.0001") NÃO deve mostrar o
  // campo — `$` ancora o fim da string, então "1.01.003.0001" não bate.
  const accountingGrouperCodeRegex = /^\d\.\d{2}\.\d{3}$/;
  const showAccountingGrouper =
    isEditing &&
    !!financialCategoryData?.code &&
    accountingGrouperCodeRegex.test(financialCategoryData.code);

  return (
    <FormContainer
      title={
        isEditing
          ? text.form.title.edit
          : isCreatingChild
            ? text.form.title.createChild
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
        {/* Código/Classe — real em edição; prévia no create (TASK-FE-1072:
            Sintético para raiz, Analítico para filho — `previewClass`
            acima), nunca mais fixa em "Analítico" (GAP-FE-100 fechado). */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
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
                {isEditing ? financialCategoryData?.code : text.form.hints.codeGenerated}
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Badge
                colorPalette={
                  (isEditing ? financialCategoryData?.class : previewClass) === 1 ? 'info' : 'green'
                }
                variant="subtle"
              >
                {isEditing
                  ? financialCategoryData?.class_label
                  : previewClass === 1
                    ? text.form.classLabels.synthetic
                    : text.form.classLabels.analytical}
              </Badge>
              {!isEditing && (
                <Badge colorPalette="gray" variant="outline">
                  {text.form.hints.classPreviewBadge}
                </Badge>
              )}
            </Flex>
          </Flex>
        </Box>

        {/* Banner do grupo pai — só no modo "criar filho". */}
        {isCreatingChild && (
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
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
                  {text.form.fields.parent}
                </Text>
                <Text fontSize="md" fontWeight="bold">
                  {parentPreview
                    ? `${parentPreview.code} — ${parentPreview.description}`
                    : isParentPreviewLoading
                      ? text.form.parentPreview.loading
                      : ''}
                </Text>
              </Flex>
            )}
          </Box>
        )}

        {/* TASK-FE-1091 — "Antecessor" (`parent_id` do legado, SEMPRE
            read-only, `_forms.blade.php`) na EDIÇÃO. Contrato aditivo
            TASK-BE-971: `FinancialCategoryDetail.parent` ({uuid, code,
            description} | null) — categoria raiz não tem pai, então o
            banner só aparece quando `financialCategoryData.parent` existe.
            Mesmo estilo visual do banner "Grupo pai" acima (criação de
            filho, já aceito pelo dev como equivalente) — este é o
            equivalente para a EDIÇÃO. */}
        {isEditing && financialCategoryData?.parent && (
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Flex align="center" gap={3} wrap="wrap">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.form.fields.parent}
              </Text>
              <Text fontSize="md" fontWeight="bold">
                {`${financialCategoryData.parent.code} — ${financialCategoryData.parent.description}`}
              </Text>
            </Flex>
          </Box>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Flex>
            )}
          />

          <Controller
            name="generates_obligation_or_right"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.generatesObligationOrRight}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  // TASK-FE-1091 (`_forms.blade.php:35`) — travado com
                  // fazenda/tenant, em QUALQUER modo (criar filho OU editar).
                  disabled={!canSave || isLoading || isTenantContextLocked}
                  aria-label={text.form.fields.generatesObligationOrRight}
                />
              </Flex>
            )}
          />

          <Controller
            name="classification"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.classification}
                name={name}
                value={classificationOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<FinancialCategoryClassification> | null) =>
                  onChange(opt?.value)
                }
                options={classificationOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave || isClassificationLocked}
                tooltip={
                  isClassificationLocked ? text.form.hints.classificationLockedSynthetic : undefined
                }
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="type_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.type}
                service={listCategoryTypes}
                mapOptions={(item: CategoryTypeRef) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                // TASK-FE-1091 (`_forms.blade.php:18,19`) — travado com
                // fazenda/tenant, em QUALQUER modo (criar filho OU editar).
                // Hint diferencia: "criar filho" mostra o texto de herança
                // (o valor VEIO do pai); editar mostra o texto genérico de
                // bloqueio (o valor é da PRÓPRIA categoria, não herdado).
                tooltip={
                  isTenantContextLocked
                    ? isCreatingChild
                      ? text.form.hints.typeGrouperInherited
                      : text.form.hints.lockedByTenantContext
                    : undefined
                }
                isDisabled={isTenantContextLocked || !canSave}
                isReadOnly={isTenantContextLocked}
              />
            )}
          />

          <Controller
            name="grouper_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.grouper}
                // TASK-FE-974 — repontado de `listGroupers` (CRUD gateado por
                // `groupers_view`) para `listGrouperOptions`
                // (`/groupers/options`, SEM gate) — mesmo shape
                // `GrouperListItem`, `mapOptions` inalterado.
                service={listGrouperOptions}
                mapOptions={(item: GrouperListItem) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                // TASK-FE-1091 (`_forms.blade.php:44,45`) — travado com
                // fazenda/tenant, em QUALQUER modo (criar filho OU editar).
                // `required` no schema Yup permanece incondicional (Regra —
                // ver nota no schema): com fazenda o campo é sempre
                // pré-preenchido (herdado do pai OU já salvo em edição) antes
                // de ficar travado, então nunca chega vazio ao submit; sem
                // fazenda o usuário PRECISA escolher, mesma exigência.
                tooltip={
                  isTenantContextLocked
                    ? isCreatingChild
                      ? text.form.hints.typeGrouperInherited
                      : text.form.hints.lockedByTenantContext
                    : undefined
                }
                isDisabled={isTenantContextLocked || !canSave}
                isReadOnly={isTenantContextLocked}
              />
            )}
          />

          {/* TASK-FE-1091 (`_forms.blade.php:56`) — só aparece editando um
              item existente cujo `code` tem exatamente 3 segmentos
              (`showAccountingGrouper`, ver cálculo acima). Nunca aparece no
              CREATE (raiz ou filho) nem editando um item de 4 segmentos
              (folha analítica, ex. "1.01.003.0001"). */}
          {showAccountingGrouper && (
            <Controller
              name="accounting_grouper_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.accountingGrouper}
                  service={listAccountingGroupersForSelect}
                  mapOptions={(item: AccountingGrouperListItem) => ({
                    label: `${item.code} — ${item.name}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={!canSave}
                />
              )}
            />
          )}
        </SimpleGrid>

        {/* Centros de Custo vinculados.
            ERRO-FE-031 — no create-FILHO, a árvore editável
            (`CategoryTreeSelector`, TASK-FE-317) é SUBSTITUÍDA por uma lista
            read-only montada direto de `parentPreview.centers`: os centros
            do grupo pai são SINTÉTICOS GLOBAIS (`tenant_id NULL`) e o
            `CategoryTreeSelector` só marca FOLHAS (`selectableGroups`
            ausente) — o grupo sintético herdado nunca aparecia selecionado
            na árvore de folhas, mesmo travada. Exibir a lista plana de
            `parentPreview.centers` (o que o backend de fato herda no store,
            `StoreFinancialCategoryAction`) resolve a exibição sem depender
            da árvore. Em RAIZ/EDIÇÃO o `CategoryTreeSelector` segue
            INALTERADO (TASK-FE-317/TASK-FE-315). */}
        <Box mt={6}>
          {isCreatingChild ? (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                {text.form.fields.centers}
              </Text>
              {isParentPreviewLoading ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.form.parentPreview.loading}
                </Text>
              ) : (parentPreview?.centers ?? []).length > 0 ? (
                <Wrap gap={2}>
                  {(parentPreview?.centers ?? []).map((center) => (
                    <Badge key={center.uuid} colorPalette="gray" variant="subtle">
                      {center.code} — {center.description}
                    </Badge>
                  ))}
                </Wrap>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  {text.form.centersTree.noCategories}
                </Text>
              )}
              <Text fontSize="sm" color="fg.muted" mt={2}>
                {text.form.hints.typeGrouperInherited}
              </Text>
            </Box>
          ) : (
            <Controller
              name="center_uuids"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CategoryTreeSelector
                  title={text.form.fields.centers}
                  tree={costCenterTreeQuery.data}
                  isLoading={costCenterTreeQuery.isLoading || isLoading}
                  selected={new Set(value)}
                  onChange={(next) => onChange(Array.from(next))}
                  readOnly={!canSave}
                  languageGB={languageGB}
                  searchable
                  strings={text.form.centersTree}
                  isError={costCenterTreeQuery.isError}
                  onRetry={() => costCenterTreeQuery.refetch()}
                />
              )}
            />
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
