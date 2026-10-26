// src/pages/CadastrosBase/PlanAccount/CreateOrUpdatePlanAccount.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO (topo OU subconta) e EDIÇÃO de PLANO DE CONTAS — Cadastros
// Base, domínio Financeiro (TASK-PA-03b). Rotas:
//   /cadastros-base/plano-de-contas/novo              (criar topo)
//   /cadastros-base/plano-de-contas/novo/:parentUuid   (criar subconta)
//   /cadastros-base/plano-de-contas/:planAccountId     (editar, GUID)
// registradas em src/router/index.tsx, ANTES do catch-all
// `/cadastros-base/*`, guardadas por `plan-accounts_create`/`plan-accounts_edit`
// (PlanAccountResource não expõe flags por-item — diferente de CostCenter/
// DEC-005 — a permissão global já basta, ver Tarefa §"Tela / Rota").
//
// Estrutura ADAPTADA de CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx
// (precedente direto indicado pela Tarefa) — NÃO copiado 1:1:
//   - SEM seção de Rateio (`apportionments`) — não existe para PlanAccount;
//   - `class`/`code`: card somente-leitura no MESMO padrão exato do
//     precedente — em edição mostra os valores reais do servidor
//     (`class_label`/`code`); em criação mostra a PRÉVIA calculada pelo
//     servidor (`GET /plan-accounts/code-preview`, recarregada a cada troca de
//     Conta-pai, rotulada como prévia e nunca enviada no payload — DA-PA-01);
//   - `category_uuids` — DIFERENTE do CostCenter (que deixou "Categorias
//     Financeiras" só-leitura por dependência de contrato nunca resolvida):
//     aqui é um multi-select REAL (Achado 1 da Tarefa, decisão do dev
//     2026-07-20) — `SelectAsyncPaginate` (`listFinancialCategories`) para
//     ADICIONAR uma categoria por vez + lista de `Badge`s removíveis abaixo,
//     já que não há um componente de "multi-select paginado" pronto no
//     catálogo `@/components/Form/*` (inspecionado nesta rodada);
//   - Exclusão: NÃO implementada nesta tela — decisão do dev (Opção A,
//     "Decisão do Desenvolvedor" da Tarefa) mantém a exclusão 100% na
//     listagem (TASK-PA-03a, `index.tsx`, já entregue com
//     `DeleteConfirmDialog` + `useRequest`/toast genérico); nenhum
//     `DeleteBlockedDialog` dedicado, aqui ou lá;
//   - UPDATE envia só o DELTA necessário: `description`/`condition`/
//     `is_enabled`/`type` SEMPRE (Seção 4 do contrato — `required`/`nullable`,
//     nunca `sometimes`, então precisam estar presentes em toda escrita)
//     + `category_uuids` SÓ quando `dirtyFields.category_uuids` for truthy
//     (Seção 4 — `category_uuids` é o ÚNICO campo `sometimes` do
//     `PlanAccountRequest`; omitir quando o usuário não mexeu na seção evita
//     que uma sessão de edição que só mudou, ex., `is_enabled` acabe
//     ressincronizando/zerando categorias que a Action de update trataria
//     como "enviado vazio = remover todas"). `parent_uuid`/`code`/`class`
//     NUNCA no payload de update (proibido/somente-leitura).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

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

import {
  createPlanAccount,
  listPlanAccountOptions,
  updatePlanAccount,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { Option } from '@/@types/option';
import type {
  PlanAccountDetail,
  PlanAccountForm as PlanAccountFormType,
  PlanAccountPayload,
} from '@/@types/v2/PlanAccounts';

import { CategoryTreeSelector } from './CategoryTreeSelector';
import { planAccountSchemaResolver } from './plan-account-schema';
import {
  useFinancialCategoryTree,
  usePlanAccountCodePreview,
  usePlanAccountForm,
} from './usePlanAccounts';

export default function CreateOrUpdatePlanAccount() {
  const { planAccountId, parentUuid } = useParams<{
    planAccountId: string;
    parentUuid: string;
  }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(planAccountId);

  // Modo "criar subconta": só quando `parentUuid` (rota `/novo/:parentUuid`)
  // é um GUID válido E não estamos em edição — mutuamente exclusivo por
  // construção de rota (mesmo racional de DEC-005/TASK-FE-015 do CostCenter).
  const isCreatingDescendant = isValidGuid(parentUuid) && !isEditing;

  const text = languageGB.planAccounts.planAccount;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<PlanAccountFormType>({
    mode: 'onChange',
    resolver: planAccountSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      type: '',
      parent_uuid: null,
      category_uuids: [],
    },
  });

  function fillForm(data: PlanAccountDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        condition: String(data.condition) as '1' | '2' | '3',
        is_enabled: !!data.is_enabled,
        // O GET já devolve `type` NUMÉRICO (`PlanAccountResource::toArray()`,
        // `$this->type?->value` de um enum int-backed — CAPEX=1/OPEX=2, DA-PA-14)
        // — casa direto com o valor de backing que o form/`typeOptions` usam
        // (TASK-PA-FIX-03: a comparação anterior com 'capex'/'opex' string
        // nunca batia, então o Select vinha sempre vazio em edição).
        type: data.type ?? '',
        parent_uuid: data.parent
          ? { label: `${data.parent.code} — ${data.parent.description}`, value: data.parent.uuid }
          : null,
        category_uuids: (data.categories ?? []).map((category) => ({
          label: `${category.code} — ${category.description}`,
          value: category.uuid,
        })),
      });
    }
  }

  const planAccountQuery = usePlanAccountForm({
    registrationId: isEditing ? planAccountId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([planAccountQuery as any]);
  const planAccountData = planAccountQuery.data;

  // Modo "criar subconta": 2ª chamada ao MESMO hook (`usePlanAccountForm`),
  // buscando o ANTECESSOR via `GET /plan-accounts/{parentUuid}` — mesmo
  // padrão de `parentPreviewQuery` do CostCenter. Só o campo `parent_uuid` é
  // escrito via updater FUNCIONAL (os demais campos digitados pelo usuário
  // nunca são tocados); o próprio campo é sempre `isReadOnly`/`isDisabled`
  // neste modo, então a guarda `!isEmpty(dirtyFields)` de Lei 2 não é
  // necessária aqui (mesmo racional do precedente).
  const [parentPreview, setParentPreview] = useState<PlanAccountDetail | null>(null);

  function fillParentPreview(data: PlanAccountDetail) {
    setParentPreview(data);
    reset((current) => ({
      ...current,
      parent_uuid: { label: `${data.code} — ${data.description}`, value: data.uuid },
    }));
  }

  const parentPreviewQuery = usePlanAccountForm({
    registrationId: isCreatingDescendant ? parentUuid : undefined,
    fillForm: fillParentPreview,
  });

  const isParentPreviewLoading =
    isCreatingDescendant && checkLoadingStatus([parentPreviewQuery as any]);
  const isParentPreviewError = isCreatingDescendant && !!(parentPreviewQuery as any)?.isError;

  // `PlanAccountResource` NÃO expõe flags por-item (`can_edit`/`can_delete`,
  // diferente de `CostCenterResource`/DEC-005 — confirmado na Tarefa, sem
  // base contratual para replicar essa complexidade aqui): autorização só
  // pela permissão GLOBAL, igual ao guard de rota.
  const canSave = isEditing ? can('plan-accounts_edit') : can('plan-accounts_create');

  const planAccountMutation = useRequest({
    asyncFunction: tryPersistPlanAccount,
    entityName: text.singularLabel,
    queryKey: queryKey.planAccounts.list,
    queryKey2: queryKey.planAccounts.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistPlanAccount(data: PlanAccountFormType) {
    // `description`/`condition`/`is_enabled`/`type` são SEMPRE enviados —
    // nenhum é `sometimes` no `PlanAccountRequest` (Seção 4 do contrato),
    // então precisam estar presentes em toda escrita (create OU update).
    // `code`/`class` NUNCA fazem parte deste objeto (DA-PA-01/02).
    const payload: PlanAccountPayload = {
      description: data.description.trim(),
      condition: Number(data.condition) as 1 | 2 | 3,
      is_enabled: !!data.is_enabled,
      // Numérico (TASK-PA-FIX-02) — `Number(...)` é defesa extra caso o
      // Select alguma vez force string; `data.type` já é number ou ''.
      type: data.type ? (Number(data.type) as 1 | 2) : null,
    };

    if (isEditing && planAccountId) {
      // `parent_uuid` NUNCA no payload de update — `prohibited` no backend
      // (imutável após criar, Seção 4). `category_uuids` é o ÚNICO campo
      // `sometimes` do Request — só entra no DELTA quando o usuário de fato
      // mexeu na seção de categorias nesta sessão de edição (`dirtyFields`),
      // preservando o comportamento "não enviado = Action não toca nos
      // vínculos existentes" em vez de arriscar ressincronizar/zerar
      // categorias que ninguém tocou.
      if (showCategories && dirtyFields.category_uuids) {
        payload.category_uuids = (data.category_uuids ?? []).map((category) => category.value);
      }
      return await updatePlanAccount(planAccountId, payload);
    }

    // CREATE: antecessor aceito e opcional (vazio = conta de topo/Sintético);
    // categorias sempre enviadas (vazio quando a seção está oculta) — não há
    // vínculo prévio a preservar num registro que ainda não existe.
    payload.parent_uuid = data.parent_uuid?.value ?? null;
    payload.category_uuids = showCategories
      ? (data.category_uuids ?? []).map((category) => category.value)
      : [];
    return await createPlanAccount(payload);
  }

  async function onSubmit(data: PlanAccountFormType) {
    // Nada mudou numa edição: não há motivo para chamar a API — só volta.
    // (Diferente da checagem inversa: qualquer alteração real SEMPRE
    // persiste via `mutateAsync`, nunca é descartada silenciosamente.)
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    if (!isEditing && isCodePreviewError) return;
    await planAccountMutation.mutateAsync(data);
  }

  const isSubmitting = planAccountMutation.isPending;

  const conditionOptions: Option<string>[] = useMemo(
    () => [
      { value: '1', label: text.filter.conditionOptions.debtor },
      { value: '2', label: text.filter.conditionOptions.creditor },
      { value: '3', label: text.filter.conditionOptions.both },
    ],
    [text]
  );

  // Reaproveita as strings de `filter.typeOptions` (mesmo precedente já
  // documentado em `CreateOrUpdateCentroCusto.tsx`). Value NUMÉRICO — enum
  // int-backed no backend (CAPEX=1/OPEX=2, DA-PA-14, TASK-PA-FIX-02); os
  // rótulos de UI (CAPEX/OPEX) não mudam.
  const typeOptions: Option<number>[] = useMemo(
    () => [
      { value: 1, label: text.filter.typeOptions.capex },
      { value: 2, label: text.filter.typeOptions.opex },
    ],
    [text]
  );

  const watchedParentUuid = watch('parent_uuid');
  const watchedDescription = watch('description');
  const watchedCategoryUuids = watch('category_uuids') ?? [];

  const classLabels = {
    1: text.form.classLabels.synthetic,
    2: text.form.classLabels.analytical,
  } as const;

  const codePreviewQuery = usePlanAccountCodePreview({
    enabled: !isEditing && (!isCreatingDescendant || !!watchedParentUuid?.value),
    parentUuid: watchedParentUuid?.value,
  });
  const codePreview = codePreviewQuery.data;
  const isCodePreviewLoading =
    !isEditing && (codePreviewQuery.isLoading || codePreviewQuery.isFetching);
  const isCodePreviewError = !isEditing && codePreviewQuery.isError;
  const codePreviewErrorMessage = isCodePreviewError
    ? isAxiosError(codePreviewQuery.error) &&
      typeof codePreviewQuery.error.response?.data?.message === 'string'
      ? codePreviewQuery.error.response.data.message
      : languageGB.common.errorLog.unknownError
    : undefined;

  // Classe e código: REAIS do servidor — em edição vêm do registro, em
  // criação da prévia do servidor (nunca enviados no payload — DA-PA-01).
  const displayClass = isEditing ? planAccountData?.class : codePreview?.class;
  const displayClassLabel = isEditing
    ? planAccountData?.class_label
    : codePreview
      ? (codePreview.class_label ?? classLabels[codePreview.class])
      : undefined;
  const displayCode = isEditing
    ? planAccountData?.code
    : (codePreview?.code ?? (isCodePreviewError ? '—' : text.form.hints.codeGenerated));

  const descriptionLength = (watchedDescription ?? '').length;

  // ---- Categorias Financeiras (category_uuids) — árvore tri-state ---------
  // TASK-PA-16 (Opção C do ROTEIRO-05): substitui o picker+badges antigo por
  // uma árvore de 2 níveis (`CategoryTreeSelector`), alimentada por
  // `GET /financial-categories/tree`. Única fonte de verdade é o próprio
  // `category_uuids` do RHF — o `Set` selecionado é DERIVADO a cada render
  // (sem `useState` paralelo desincronizável).
  const categoryTree = useFinancialCategoryTree();

  // Legado: categorias só aparecem quando a conta-pai tem mais de 2 segmentos
  // no código (nível 3+); topo nunca exibe.
  const parentCode = isEditing ? planAccountData?.parent?.code : parentPreview?.code;
  const showCategories = !!parentCode && parentCode.split('.').length > 2;

  const selectedCategoryUuids = useMemo(
    () => new Set(watchedCategoryUuids.map((category) => category.value)),
    [watchedCategoryUuids]
  );

  // Resolve `code`/`description` das folhas já carregadas na árvore, para
  // reconstruir `Option<string>[]` a partir do `Set<string>` de uuids que a
  // árvore devolve (mesmo padrão de label já usado em `fillForm`, acima).
  const categoryLabelByUuid = useMemo(() => {
    const map = new Map<string, string>();
    (categoryTree.data ?? []).forEach((group) => {
      group.children.forEach((leaf) => {
        map.set(leaf.uuid, `${leaf.code} — ${leaf.description}`);
      });
    });
    return map;
  }, [categoryTree.data]);

  // Toda mudança de seleção na árvore (marcar/desmarcar folha, "Marcar
  // Todos"/"Desmarcar Todos") passa por aqui — SEMPRE chama `setValue(...,
  // { shouldDirty: true })`, nunca um caminho que só mexe em estado local
  // (risco maior da Tarefa, blindagem `GAP-PA-02`).
  function handleCategoryTreeChange(next: Set<string>) {
    const options: Option<string>[] = Array.from(next).map((uuid) => ({
      value: uuid,
      label: categoryLabelByUuid.get(uuid) ?? uuid,
    }));
    setValue('category_uuids', options, { shouldDirty: true, shouldValidate: true });
  }

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
              disabled={isSubmitting || isLoading || isCodePreviewError}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Código gerado + Classe — real em edição, prévia do servidor no
            create (DA-PA-01/DA-PA-02, sempre somente-leitura, nunca enviados
            no payload). */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={isLoading || isCodePreviewLoading} borderRadius="md">
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
                <Badge colorPalette={displayClass === 1 ? 'info' : 'green'} variant="subtle">
                  {displayClassLabel}
                </Badge>
                {!isEditing && codePreview && (
                  <Badge colorPalette="gray" variant="outline">
                    {text.form.hints.classPreviewBadge}
                  </Badge>
                )}
              </Flex>
            </Flex>
          </Skeleton>
        </Box>

        {/* Banner contextual do Antecessor, só no modo "criar subconta"
            (mesmo estilo Box do card Código/Classe acima). */}
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

        {/* Linha 1: Condição | Descrição | Ativo */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
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
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/150`}
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
        </SimpleGrid>

        {/* Linha 2: Tipo (opcional, DA-PA-14 — permite limpar para null) */}
        <Box mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<number> | null) => onChange(opt?.value ?? '')}
                options={typeOptions}
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </Box>

        {/* Linha 3: Conta-pai (full width) — sempre bloqueada; subcontas se
            criam pelo "Criar descendente" da listagem. */}
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
                service={listPlanAccountOptions}
                mapOptions={(item: any) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true',
                  class: 1,
                })}
                error={codePreviewErrorMessage}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled
                isReadOnly
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        {/* Categorias Financeiras — árvore tri-state (TASK-PA-16, Opção C do
            ROTEIRO-05), fiel a `CategoryTreeField.tsx` do UX oficial.
            Substitui integralmente o picker+badges antigo (TASK-PA-03b). */}
        {showCategories && (
          <Box mt={6}>
            <CategoryTreeSelector
              title={text.form.fields.categories}
              tree={categoryTree.data}
              isLoading={categoryTree.isLoading}
              selected={selectedCategoryUuids}
              onChange={handleCategoryTreeChange}
              readOnly={!canSave}
              languageGB={languageGB}
            />
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
