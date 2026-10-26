// src/pages/CadastrosBase/Autorizadores/CreateOrUpdateAutorizador.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de AUTORIZADOR (RequestAuthorizer) — Cadastros
// Base / Pessoas. SLICE 2 (Lote 06 / esteira 089, Frente C, F-141). Rotas:
// /cadastros-base/autorizadores/novo (criar),
// /cadastros-base/autorizadores/:authorizerId (editar, UUID) — ambas
// registradas nesta MESMA Tarefa em `src/router/index.tsx`.
//
// Molde estrutural — mesma mecânica de CadastrosBase/CentroCusto/
// CreateOrUpdateCentroCusto.tsx (convenção ATUAL de form deste projeto:
// `FormContainer`+footer opt-in, `useCustomFormQueryById`, `useRequest`):
//   1. Array N:N repetível com atributo extra por linha (`apportionments` lá,
//      `farms[]` aqui) via `useFieldArray` + Select por linha.
//   2. Seção condicionada a um campo do MESMO form (`type==='apportioned'`
//      lá, `is_conditional` aqui), com `replace([])` no onChange do campo
//      gatilho para zerar VISUALMENTE o array quando a condição deixa de
//      valer — `rules[]` some da tela E é zerado ao desligar `is_conditional`.
// Casca/submit seguem o "Código Ouro" de `get_pwa_form_query_pattern`
// (`<Form id="authorizer-form">` + `form="authorizer-form"` no botão do
// footer da casca).
//
// Referência UX: UX-GAP declarado (nenhuma página de Autorizadores no design
// system `cerne`) — precedente INTERNO CentroCusto (mesma linguagem visual
// para seções agrupadas: `Box` com borda + rótulo).
//
// ⚠️ Fontes de dados TROCADAS em relação ao commit revertido `99deb566`
// (contrato §7/§10 — NUNCA restaurado por cherry-pick):
//   - Usuário (`user_uuid`): `listUserAuthorizerOptions` — NOVO endpoint
//     tenant-wide `GET /users/authorizer-options` (Opção A, decisão do dono),
//     NÃO `listUsers`/`/users` administrativo (bug de permissão cruzada
//     removido no TASK-FE-918).
//   - Fazenda (`farms[].farm_uuid`): `listFarms()` → `GET /farms/current-tenant`
//     (tenant-scoped, sem permissão cruzada), via `SelectCombobox`
//     (endpoint NÃO paginado — mesma correção documentada no ERRO-02 de
//     Autorizadores, ver cabeçalho de `SelectCombobox.tsx`), NÃO
//     `SelectAsyncPaginate` contra endpoint paginado.
//
// Payload SEMPRE inclui a chave `rules` (nunca omitida) — `[]` explícito
// quando `is_conditional=false` (DA-AU-13/GAP-19, já corrigido no backend).
// Update envia payload COMPLETO (farms[]/rules[] inclusos por completo, sem
// PATCH parcial — `RequestAuthorizerRequest` exige todos os campos, exceto
// `max_value`).
//
// `rules[].value`: SELECT fechado (fix cirúrgico, Lote 06/esteira 089,
// pedido do dono) — mirror do legado (`agro365 RequestPurchase::types()` +
// "Todos"), via `authorizerRuleValueOptions` (REUSA o enum canônico
// `requestPurchaseTypeOptions`, `@/constants/RequestPurchases/options/
// request-purchase-type-options`). O valor salvo/enviado no payload
// continua sendo o CÓDIGO string cru ('all' | 'P' | 'S' | ...), nunca um
// objeto `{label,value}` — o backend valida só `required_with|string`, sem
// enum fechado (contrato §10.4), mas a UI restringe as opções ao vocabulário
// fiel ao legado.
//
// Auto-seed de `rules`: ao LIGAR `is_conditional` com `rules` vazio, 1 linha
// em branco é adicionada automaticamente (`appendRule`) — mirror do legado,
// que já renderiza a 1ª regra (index 0) sem exigir clique em "Adicionar
// Regra +". O botão continua disponível para regras adicionais; no modo
// edição, os `rules` existentes hidratam normalmente via `fillForm` (sem
// duplicar — o seed só corre quando o array está vazio no momento do toggle).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
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
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { KgInput } from '@/components/Form/kgInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { authorizerRuleValueOptions } from '@/constants/cadastrosBase/authorizer/rule-value-options';
import { queryKey } from '@/constants/query-key';

import {
  createRequestAuthorizer,
  updateRequestAuthorizer,
} from '@/services/v2/RequestAuthorizers/request-authorizer-service';
import { listUserAuthorizerOptions } from '@/services/v2/Users/user-service';
import type {
  ListUserAuthorizerOptionsParams,
  UserAuthorizerOptionItem,
} from '@/services/v2/Users/user-service';

import type { ModuleRequestAuthorizers } from '@/@types/language/module-request-authorizers';
import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  RequestAuthorizerData,
  RequestAuthorizerForm as RequestAuthorizerFormType,
  RequestAuthorizerPayload,
} from '@/@types/v2/RequestAuthorizers';

import { requestAuthorizerSchemaResolver } from './authorizer-schema';
import { canAddFarmRow, canRemoveFarmRow, emptyFarmRow } from './farmsRowGuard';
import {
  useFarmsCurrentTenantForAuthorizer,
  useRequestAuthorizerForm,
} from './useRequestAuthorizers';

const LEVEL_OPTIONS: Option<number>[] = [1, 2, 3, 4].map((level) => ({
  value: level,
  label: String(level),
}));

interface CreateOrUpdateAutorizadorProps {
  /**
   * `'view'` = tela Visualizar (rota `.../:authorizerId/visualizar`): campos
   * desabilitados, sem salvar, exige só `request-authorizers_view`.
   */
  mode?: 'view';
}

export default function CreateOrUpdateAutorizador({ mode }: CreateOrUpdateAutorizadorProps = {}) {
  const { authorizerId } = useParams<{ authorizerId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  // FIX P1 (esteira 089, achado do Tester — rede real): `activeFarmUuid`
  // represa `useRequestAuthorizerForm` até o boot de auth resolver o
  // `X-Farm-Id` (ver cabeçalho de useRequestAuthorizers.tsx) — `GET
  // /request-authorizers/{uuid}` está no mesmo bloco `farm.context` ESTRITO
  // do `index`.
  const { user, activeFarmUuid } = useAuth();

  // "novo" não é GUID — mesmo guard de navegação de CentroCusto/Perfil.
  const isEditing = isValidGuid(authorizerId);
  const text = languageGB.requestAuthorizers.requestAuthorizer;

  // Sem `can_edit` por-item no Resource (diferente de Centro de Custo) —
  // `RequestAuthorizerResource` não expõe esse campo (lido no backend nesta
  // execução): canSave é só a permissão RBAC global por verbo.
  const isViewMode = mode === 'view';
  const canSave = isViewMode
    ? false
    : isEditing
      ? can('request-authorizers_edit')
      : can('request-authorizers_create');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<RequestAuthorizerFormType>({
    mode: 'onChange',
    resolver: requestAuthorizerSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      user_uuid: null,
      max_value: null,
      is_active: true,
      number_quotes: 1,
      expense_organizer: false,
      is_conditional: false,
      // Mesmo racional do precedente: 1 linha vazia já visível na criação (o
      // usuário precisa vincular ao menos 1 fazenda — mínimo 1, ver schema).
      farms: [emptyFarmRow()],
      rules: [],
    },
  });

  // ✅ Lei 2 — função nomeada com guarda de dirtyFields.
  function fillForm(data: RequestAuthorizerData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        user_uuid: { label: data.user.name, value: data.user.uuid },
        max_value: data.max_value,
        is_active: !!data.is_active,
        number_quotes: data.number_quotes,
        expense_organizer: !!data.expense_organizer,
        is_conditional: !!data.is_conditional,
        farms: data.farms.map((farm) => ({ farm_uuid: farm.farm_uuid, level: farm.level })),
        rules: data.is_conditional
          ? data.rules.map((rule) => ({
              type: rule.type,
              value: rule.value,
              apply_on: rule.apply_on as 'A' | 'D' | '',
            }))
          : [],
      });
    }
  }

  const requestAuthorizerQuery = useRequestAuthorizerForm({
    registrationId: isEditing ? authorizerId : undefined,
    fillForm,
    activeFarmUuid,
  });

  const isLoading = isEditing && checkLoadingStatus([requestAuthorizerQuery as any]);
  const requestAuthorizerData = requestAuthorizerQuery.data;

  // Campos READ-ONLY (display-only, fora do payload): "Responsável" — quem
  // cadastrou/mantém (`auth`, setado server-side, `auth_id = Auth::id()` na
  // Action, nunca enviado pelo front); criação exibe o usuário logado.
  const responsibleDisplay = isEditing
    ? (requestAuthorizerData?.auth?.name ?? '')
    : (user?.username ?? '');

  const dateDisplay = isEditing
    ? requestAuthorizerData?.updated_at
      ? formatDate(requestAuthorizerData.updated_at, 'dd/MM/yyyy HH:mm:ss')
      : ''
    : formatDate(new Date());

  // Fazendas do TENANT CORRENTE (§7.1 do contrato) — 1 fetch compartilhado
  // por TODAS as linhas de `farms[]` (nenhuma linha faz fetch própria).
  const farmsQuery = useFarmsCurrentTenantForAuthorizer();

  const farmOptions: Option<string>[] = useMemo(
    () => (farmsQuery.data ?? []).map((farm) => ({ label: farm.description, value: farm.uuid })),
    [farmsQuery.data]
  );

  // Fallback de RÓTULO de borda: só entra em jogo se uma fazenda já
  // vinculada em `RequestAuthorizerData` não estiver mais em `farmOptions`
  // (ex.: saiu do tenant depois de vinculada) — nunca oferecida como opção
  // nova selecionável, só resolve o texto exibido no `SelectCombobox`.
  const farmLabelFallback = useMemo(() => {
    const map: Record<string, string> = {};
    requestAuthorizerData?.farms?.forEach((farm) => {
      map[farm.farm_uuid] = farm.name;
    });
    return map;
  }, [requestAuthorizerData]);

  const {
    fields: farmFields,
    append: appendFarm,
    remove: removeFarm,
  } = useFieldArray({ control, name: 'farms' });

  // `rules` — `useFieldArray` no componente PAI (não na seção) porque o
  // `replace([])` de "desligar is_conditional zera o array" é disparado pelo
  // onChange do Switch, que vive fora da seção (ela nem está montada quando
  // `is_conditional === false`) — mesmo racional de `apportionments` em
  // CreateOrUpdateCentroCusto.tsx.
  const {
    fields: ruleFields,
    append: appendRule,
    remove: removeRule,
    replace: replaceRules,
  } = useFieldArray({ control, name: 'rules' });

  const requestAuthorizerMutation = useRequest({
    asyncFunction: tryPersistRequestAuthorizer,
    entityName: text.singularLabel,
    queryKey: queryKey.requestAuthorizers.list,
    queryKey2: queryKey.requestAuthorizers.detail,
    typesRequest: isEditing ? 'update' : 'create',
    // Mensagens de sucesso do legado ("Registro criado/atualizado com sucesso.").
    personalizedMessage: isEditing ? text.list.updatedToast : text.list.createdToast,
    // Legado volta à lista depois de salvar (PAR-47).
    actionSuccess: () => {
      navigate('/cadastros-base/autorizadores');
    },
  });

  async function tryPersistRequestAuthorizer(data: RequestAuthorizerFormType) {
    const payload: RequestAuthorizerPayload = {
      user_uuid: data.user_uuid!.value,
      max_value: data.max_value,
      is_active: !!data.is_active,
      number_quotes: Number(data.number_quotes),
      expense_organizer: !!data.expense_organizer,
      is_conditional: !!data.is_conditional,
      farms: data.farms.map((farm) => ({
        farm_uuid: farm.farm_uuid,
        level: Number(farm.level),
      })),
      // NUNCA omitir a chave `rules` — `[]` explícito quando is_conditional
      // for false (DA-AU-13/GAP-19, mirror do backend já corrigido).
      rules: data.is_conditional
        ? data.rules.map((rule) => ({
            type: rule.type,
            value: rule.value,
            apply_on: rule.apply_on as 'A' | 'D',
          }))
        : [],
    };

    if (isEditing && authorizerId) {
      return await updateRequestAuthorizer(authorizerId, payload);
    }

    return await createRequestAuthorizer(payload);
  }

  // Salvar em edição grava SEMPRE, mesmo sem alteração (legado, PAR-48).
  async function onSubmit(data: RequestAuthorizerFormType) {
    await requestAuthorizerMutation.mutateAsync(data);
  }

  // ---- Tabela Fazendas: regras do legado (PAR-32/33) ------------------------
  const [farmToRemove, setFarmToRemove] = useState<number | null>(null);

  function handleAddFarm() {
    if (!canAddFarmRow(getValues('farms') ?? [])) {
      toaster.warning({ description: text.form.farms.incompleteRow });
      return;
    }
    appendFarm(emptyFarmRow());
  }

  function handleRequestRemoveFarm(index: number) {
    if (!canRemoveFarmRow(farmFields.length)) {
      toaster.warning({ description: text.form.farms.minOneItem });
      return;
    }
    setFarmToRemove(index);
  }

  function handleConfirmRemoveFarm() {
    if (farmToRemove !== null) removeFarm(farmToRemove);
    setFarmToRemove(null);
  }

  const isSubmitting = requestAuthorizerMutation.isPending;

  // §7.2 — lookup tenant-wide `GET /users/authorizer-options`, NUNCA
  // `/users` administrativo (bug TASK-FE-918).
  const listUsersForSelect = async (
    params: ListUserAuthorizerOptionsParams
  ): Promise<ResponsePagination<UserAuthorizerOptionItem[]>> => {
    return await listUserAuthorizerOptions(params);
  };

  const isConditional = watch('is_conditional');

  const ruleTypeOptions: Option<string>[] = useMemo(
    () => [{ value: 'tipo_chamado', label: text.form.rules.typeOptions.requestPurchase }],
    [text]
  );

  const applyOnOptions: Option<string>[] = useMemo(
    () => [
      { value: 'A', label: text.form.rules.applyOnOptions.before },
      { value: 'D', label: text.form.rules.applyOnOptions.after },
    ],
    [text]
  );

  // Fix cirúrgico (Lote 06/esteira 089): `rules[].value` vira Select fechado
  // — REUSA `requestPurchaseTypeOptions` + "Todos" (ver cabeçalho do arquivo).
  const ruleValueOptions: Option<string>[] = useMemo(
    () => authorizerRuleValueOptions.options(languageGB),
    [languageGB]
  );

  return (
    <FormContainer
      title={
        isViewMode
          ? text.form.title.view
          : isEditing
            ? text.form.title.edit
            : text.form.title.create
      }
      subtitle={
        isViewMode
          ? text.form.subtitle.view
          : isEditing
            ? text.form.subtitle.edit
            : text.form.subtitle.create
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
              type="submit"
              form="authorizer-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form id="authorizer-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6}>
          <Controller
            name="user_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <Box gridColumn={{ base: 'span 1', sm: 'span 2' }}>
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.userUuid}
                  placeholder={text.form.placeholders.userUuid}
                  service={listUsersForSelect}
                  mapOptions={(item: UserAuthorizerOptionItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={!canSave || isLoading}
                />
              </Box>
            )}
          />

          <Controller
            name="max_value"
            control={control}
            render={({ field, fieldState }) => (
              <KgInput
                name={field.name}
                label={text.form.fields.maxValue}
                helperText={fieldState.error?.message ? undefined : text.form.hints.maxValue}
                value={field.value === null || field.value === undefined ? '' : field.value}
                onChange={(_event, maskedValue, floatValue) =>
                  field.onChange(maskedValue === '' ? null : floatValue)
                }
                prefix="R$ "
                allowDot
                decimalPlaces={2}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="number_quotes"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.numberQuotes}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={1}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={6} mt={6}>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isActive}
                </Text>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isActive}
                />
              </Flex>
            )}
          />

          <Controller
            name="expense_organizer"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.expenseOrganizer}
                </Text>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.expenseOrganizer}
                />
              </Flex>
            )}
          />

          <Controller
            name="is_conditional"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isConditional}
                </Text>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => {
                    field.onChange(d.checked);
                    // Regra da Tarefa (DA-AU-13/GAP-19): ao DESLIGAR o
                    // toggle, zerar VISUALMENTE `rules[]` (não só ocultar a
                    // seção) — o backend já ressincroniza `[]` no update
                    // quando is_conditional=false; a UI reflete isso na hora.
                    if (!d.checked) {
                      replaceRules([]);
                      return;
                    }
                    // Fix cirúrgico (Lote 06/esteira 089): ao LIGAR com
                    // `rules` vazio, semear 1 linha em branco (mirror do
                    // legado, que já renderiza a 1ª regra sem clique) — só
                    // quando vazio, para não duplicar hidratação de edição.
                    if (ruleFields.length === 0) {
                      appendRule({ type: 'tipo_chamado', value: '', apply_on: '' });
                    }
                  }}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isConditional}
                />
              </Flex>
            )}
          />
        </SimpleGrid>

        {/* Read-only display: "Responsável"/"Data" — nunca no payload nem no schema. */}
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={6} mt={6}>
          <InputReadOnly
            name="auth"
            label={text.form.fields.responsible}
            value={responsibleDisplay}
            loading={!!isLoading}
          />
          <InputReadOnly
            name="last_update"
            label={isEditing ? text.form.fields.lastUpdate : text.form.fields.creationDate}
            value={dateDisplay}
            loading={!!isLoading}
          />
        </SimpleGrid>

        {/* Ordem: quando is_conditional=true, Regras vem ANTES de Fazendas. */}
        {isConditional && (
          <Box mt={6}>
            <RulesSection
              fields={ruleFields}
              control={control}
              errors={errors}
              onAdd={() => appendRule({ type: 'tipo_chamado', value: '', apply_on: '' })}
              onRemove={removeRule}
              canSave={canSave}
              isLoading={!!isLoading}
              typeOptions={ruleTypeOptions}
              valueOptions={ruleValueOptions}
              applyOnOptions={applyOnOptions}
              text={text}
            />
          </Box>
        )}

        {/* Seção repetível de Fazendas — sempre visível, mínimo 1 linha
            (validação client-side espelhando farms.min(1) do backend). */}
        <Box mt={6}>
          <FarmsSection
            fields={farmFields}
            control={control}
            errors={errors}
            onAdd={handleAddFarm}
            onRemove={handleRequestRemoveFarm}
            options={farmOptions}
            labelFallback={farmLabelFallback}
            farmsLoading={farmsQuery.isPending}
            canSave={canSave}
            isLoading={!!isLoading}
            text={text}
          />
        </Box>
      </Form>

      <DeleteConfirmDialog
        isOpen={farmToRemove !== null}
        onClose={() => setFarmToRemove(null)}
        onConfirm={handleConfirmRemoveFarm}
        title={text.form.farms.removeConfirm.title}
        description={text.form.farms.removeConfirm.text}
        hideQuestionMark
        warningText=""
        tone="warning"
      />
    </FormContainer>
  );
}

// -----------------------------------------------------------------------------
// FarmsSection — seção repetível de fazendas + nível, componente-irmão NO
// MESMO ARQUIVO (mesma organização estrutural de `ApportionmentsSection` em
// CreateOrUpdateCentroCusto.tsx). `useFieldArray` fica no componente PAI
// (fields/append/remove chegam via props).
// -----------------------------------------------------------------------------

interface FarmsSectionProps {
  fields: FieldArrayWithId<RequestAuthorizerFormType, 'farms', 'id'>[];
  control: Control<RequestAuthorizerFormType>;
  errors: FieldErrors<RequestAuthorizerFormType>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Fazendas do tenant corrente — 1 fetch compartilhado no componente pai, não 1 por linha. */
  options: Option<string>[];
  /** Fallback de borda: rótulo de fazenda vinculada fora de `options`. */
  labelFallback: Record<string, string>;
  farmsLoading: boolean;
  canSave: boolean;
  isLoading: boolean;
  text: ModuleRequestAuthorizers['requestAuthorizer'];
}

function FarmsSection({
  fields,
  control,
  errors,
  onAdd,
  onRemove,
  options,
  labelFallback,
  farmsLoading,
  canSave,
  isLoading,
  text,
}: FarmsSectionProps) {
  const farmsText = text.form.farms;
  const isDisabled = !canSave || isLoading;
  const arrayError = (errors.farms as unknown as { message?: string } | undefined)?.message;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {farmsText.sectionTitle}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={0.5}>
          {farmsText.sectionHint}
        </Text>
      </Box>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || farmsText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="240px">
                <Controller
                  name={`farms.${index}.farm_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => {
                    const selectedOption =
                      options.find((option) => option.value === rowField.value) ??
                      (rowField.value && labelFallback[rowField.value]
                        ? { label: labelFallback[rowField.value], value: rowField.value }
                        : null);

                    return (
                      <SelectCombobox
                        name={rowField.name}
                        label={farmsText.fields.farm}
                        placeholder={farmsText.placeholders.farm}
                        options={options}
                        value={selectedOption}
                        onChange={(option) => rowField.onChange(option?.value ?? '')}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={isDisabled}
                        loading={farmsLoading}
                      />
                    );
                  }}
                />
              </Box>

              <Box w={{ base: 'full', sm: '140px' }}>
                <Controller
                  name={`farms.${index}.level`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <Select
                      name={rowField.name}
                      label={farmsText.fields.level}
                      value={LEVEL_OPTIONS.find((o) => o.value === rowField.value) ?? null}
                      onChange={(opt: Option<number> | null) =>
                        rowField.onChange(opt?.value ?? null)
                      }
                      options={LEVEL_OPTIONS}
                      placeholder={farmsText.levelPlaceholder}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={farmsText.removeRowLabel}
                mensegerTooltip={farmsText.removeRowLabel}
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
        title={farmsText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// RulesSection — seção repetível de regras condicionais, só montada quando
// `is_conditional === true`. `useFieldArray` fica no componente PAI (o
// `replace([])` de "desligar zera o array" é disparado pelo onChange do
// Switch `is_conditional`, que vive fora desta seção).
// -----------------------------------------------------------------------------

interface RulesSectionProps {
  fields: FieldArrayWithId<RequestAuthorizerFormType, 'rules', 'id'>[];
  control: Control<RequestAuthorizerFormType>;
  errors: FieldErrors<RequestAuthorizerFormType>;
  onAdd: () => void;
  onRemove: UseFieldArrayRemove;
  canSave: boolean;
  isLoading: boolean;
  typeOptions: Option<string>[];
  /** Opções fechadas de `rules[].value` — `requestPurchaseTypeOptions` + "Todos" (fix cirúrgico). */
  valueOptions: Option<string>[];
  applyOnOptions: Option<string>[];
  text: ModuleRequestAuthorizers['requestAuthorizer'];
}

function RulesSection({
  fields,
  control,
  errors,
  onAdd,
  onRemove,
  canSave,
  isLoading,
  typeOptions,
  valueOptions,
  applyOnOptions,
  text,
}: RulesSectionProps) {
  const rulesText = text.form.rules;
  const isDisabled = !canSave || isLoading;
  const arrayError = (errors.rules as unknown as { message?: string } | undefined)?.message;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {rulesText.sectionTitle}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={0.5}>
          {rulesText.sectionHint}
        </Text>
      </Box>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || rulesText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Controller
                  name={`rules.${index}.type`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <Select
                      name={rowField.name}
                      label={rulesText.fields.type}
                      value={typeOptions.find((o) => o.value === rowField.value) ?? null}
                      onChange={(opt: Option<string> | null) => rowField.onChange(opt?.value ?? '')}
                      options={typeOptions}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="200px">
                <Controller
                  name={`rules.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <Select
                      name={rowField.name}
                      label={rulesText.fields.value}
                      placeholder={rulesText.placeholders.value}
                      value={valueOptions.find((o) => o.value === rowField.value) ?? null}
                      onChange={(opt: Option<string> | null) => rowField.onChange(opt?.value ?? '')}
                      options={valueOptions}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`rules.${index}.apply_on`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <Select
                      name={rowField.name}
                      label={rulesText.fields.applyOn}
                      value={applyOnOptions.find((o) => o.value === rowField.value) ?? null}
                      onChange={(opt: Option<string> | null) => rowField.onChange(opt?.value ?? '')}
                      options={applyOnOptions}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={rulesText.removeRowLabel}
                mensegerTooltip={rulesText.removeRowLabel}
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
        title={rulesText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
