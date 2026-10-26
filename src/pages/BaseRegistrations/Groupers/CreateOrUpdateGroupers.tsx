// src/pages/BaseRegistrations/Groupers/CreateOrUpdateGroupers.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de AGRUPADOR (Grouper) — Cadastros Base /
// Financeiro. Rotas (TASK-FE-032): /cadastros-base/agrupadores/novo (criar
// raiz OU criar descendente, via `?parentUuid=` opcional na query string —
// mesmo parâmetro que `AgrupadoresList`/index.tsx já usa em
// `handleCreateChild`, TASK-FE-030) e /cadastros-base/agrupadores/:grouperUuid
// (editar, GUID).
//
// 3 FLUXOS DE ENTRADA (TASK-FE-031):
//   1) "Novo Agrupador" (raiz)       — sem `?parentUuid=`; combo Antecessor
//      vazio e HABILITADO; payload de criação OMITE `parent_uuid`.
//   2) "Criar descendente"           — `?parentUuid=<uuid>` presente; combo
//      Antecessor PRÉ-PREENCHIDO (2ª query, `useGrouperForm` reaproveitado
//      como preview) e BLOQUEADO (fiel à intenção original do legado); payload
//      inclui `parent_uuid` = uuid da query string.
//   3) "Editar"                     — todos os campos habilitados, INCLUSIVE
//      Antecessor (diferente de CostCenter: TASK-BE-051 restaura reparenting
//      real no update, D4 do contrato). `code` é sempre somente-leitura,
//      nunca reenviado.
//
// SEMÂNTICA DE 3 ESTADOS de `parent_uuid` no PUT (TASK-BE-051, ponto de maior
// risco da Tarefa) — resolvida via `dirtyFields.parent_uuid` do próprio
// react-hook-form (não precisa de estado paralelo):
//   - Antecessor NÃO tocado pelo usuário (`!dirtyFields.parent_uuid`) → a
//     chave `parent_uuid` NUNCA é atribuída no objeto de payload (omitida de
//     verdade — não `undefined` explícito).
//   - Usuário LIMPOU o combo (quis virar raiz) → `data.parent_uuid` é `null`
//     e `dirtyFields.parent_uuid` é `true` → envia `parent_uuid: null`.
//   - Usuário TROCOU o antecessor → `data.parent_uuid` é o novo uuid e
//     `dirtyFields.parent_uuid` é `true` → envia `parent_uuid: '<uuid>'`.
//
// ⚠️ LANDMINE `ERRO-FE-001` (`src/utils/isEmpty.ts`): `isEmpty(obj)` retorna
// `true` quando `obj` TEM ao menos uma chave — semântica INVERTIDA em relação
// ao nome. Usada em 2 pontos deste arquivo, replicando a POLARIDADE já usada
// em `GruposProduto/CreateOrUpdateGrupoProduto.tsx` (referência explícita da
// Tarefa): aqui `isEmpty(dirtyFields)` é lido como "HÁ mudança" (não "está
// vazio") — ver `fillForm`/`onSubmit` abaixo. NUNCA inverter a leitura.
//
// `code` — somente leitura, exibido SÓ no modo edição (não existe no modo
// criação, é gerado pelo servidor após salvar) — nunca faz parte de
// `GrouperForm`/`GrouperPayload` (TASK-FE-029 já não modela o campo no form).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  createGrouper,
  getGrouper,
  listGroupers,
  updateGrouper,
} from '@/services/v2/Groupers/grouper-service';
import type { ListGroupersParams } from '@/services/v2/Groupers/grouper-service';

import type { Option } from '@/@types/option';
import type {
  GrouperDetail,
  GrouperForm as GrouperFormType,
  GrouperListItem,
  GrouperPayload,
} from '@/@types/v2/Groupers';

import { grouperSchemaResolver } from '@/validations/schemas/BaseRegistrations/grouper-schema';

export default function CreateOrUpdateGroupers() {
  const { grouperUuid } = useParams<{ grouperUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.groupers.grouper;

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:grouperUuid`). `?parentUuid=` só é relevante no modo criação (rota
  // `/novo`) — mesmo racional de guarda de CreateOrUpdateGrupoProduto.tsx/
  // CreateOrUpdateCentroCusto.tsx.
  const isEditing = isValidGuid(grouperUuid);
  const parentUuidParam = searchParams.get('parentUuid') ?? undefined;
  const isCreatingDescendant = !isEditing && isValidGuid(parentUuidParam);

  // Guard de navegação: um `grouperUuid` presente mas que NÃO é um GUID
  // válido não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo padrão de CreateOrUpdateGrupoProduto/CreateOrUpdateRaca).
  useEffect(() => {
    if (grouperUuid && !isValidGuid(grouperUuid)) {
      navigate('/cadastros-base/agrupadores', { replace: true });
    }
  }, [grouperUuid, navigate]);

  // Permissão GLOBAL (sem flag por item — `GrouperResource`/contrato §7 não
  // expõe `can_edit`/`can_create` por registro, diferente de CostCenter).
  const canSave = isEditing ? can('groupers_edit') : can('groupers_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<GrouperFormType>({
    mode: 'onChange',
    resolver: grouperSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      type: undefined,
      name: '',
      description: '',
      condition: undefined,
      is_enabled: 'true',
      order: 1,
      formula: '',
      // Modo "criar descendente": já nasce com o pai fixo (bloqueado — ver
      // Controller do Antecessor abaixo). Modo raiz/edição: `null` (raiz) até
      // o servidor preencher em edição.
      parent_uuid: isCreatingDescendant ? (parentUuidParam ?? null) : null,
    },
  });

  // ---- Preview do Antecessor (rótulo `código — nome` para o combo) --------
  // Reaproveita o MESMO hook `useGrouperForm` (TASK-FE-029) para buscar o
  // registro do PAI — tanto no modo "criar descendente" (pai fixo vindo da
  // query string) quanto no modo edição (pai atual do registro, que o GET do
  // próprio Grouper não devolve com rótulo, só o `parent_uuid` cru). Mesmo
  // racional do `parentPreviewQuery` de CreateOrUpdateCentroCusto.tsx.
  const [parentPreviewUuid, setParentPreviewUuid] = useState<string | undefined>(
    isCreatingDescendant ? parentUuidParam : undefined
  );
  const [parentOption, setParentOption] = useState<Option<string> | null>(null);

  function fillParentPreview(data: GrouperDetail) {
    // Guarda: se o usuário já tocou o combo nesta sessão (edição, reparenting
    // real), um preview atrasado (corrida de query) NUNCA sobrescreve a
    // escolha do usuário.
    if (!dirtyFields.parent_uuid) {
      setParentOption({ label: `${data.code} — ${data.name}`, value: data.uuid });
    }
  }

  useCustomFormQueryByGuid<GrouperDetail>({
    registrationId: parentPreviewUuid,
    queryKey: queryKey.groupers.detail,
    asyncFunction: getGrouper,
    fillForm: fillParentPreview,
  });

  function fillForm(data: GrouperDetail, resetForce?: boolean) {
    // ⚠️ ERRO-FE-001 — ver nota de cabeçalho do arquivo. `!isEmpty(dirtyFields)`
    // só é `true` quando `dirtyFields` está VAZIO (nenhuma edição do usuário
    // em andamento) — condição em que é seguro sobrescrever o form com o
    // dado do servidor. NUNCA remover o `!`.
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        type: data.type,
        name: data.name,
        description: data.description ?? '',
        condition: data.condition,
        is_enabled: data.is_enabled ? 'true' : 'false',
        order: data.order,
        formula: data.formula ?? '',
        parent_uuid: data.parent_uuid,
      });
      // Dispara a busca de preview do Antecessor ATUAL (rótulo) — só define
      // uma vez (idempotente); se o usuário limpar/trocar depois, o
      // `onChange` do combo já mantém `parentOption` em dia sem depender
      // desta query de novo.
      if (data.parent_uuid) {
        setParentPreviewUuid((prev) => prev ?? (data.parent_uuid as string));
      }
    }
  }

  const grouperQuery = useCustomFormQueryByGuid<GrouperDetail>({
    registrationId: isEditing ? grouperUuid : undefined,
    queryKey: queryKey.groupers.detail,
    asyncFunction: getGrouper,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([grouperQuery as any]);
  const grouperData = grouperQuery.data;

  // Busca de agrupadores p/ o combo Antecessor — mesmo endpoint/query key do
  // modo raiz+busca (`listGroupers`, contrato §6/TASK-BE-052), com um filtro
  // client-side ÓBVIO (Tarefa, "validar apenas o óbvio"): em edição, exclui o
  // PRÓPRIO nó da lista de opções (não pode ser Antecessor de si mesmo). A
  // validação definitiva de ciclo/profundidade (descendentes diretos, 5º
  // nível) é 100% do backend (D4/D6, TASK-BE-051, 422 tratado pelo `onError`
  // genérico do `useRequest` abaixo).
  const listGroupersForParent = useCallback(
    async (params: ListGroupersParams) => {
      const response = await listGroupers(params);
      if (!isEditing || !grouperUuid) return response;
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.filter((item) => item.uuid !== grouperUuid),
        },
      };
    },
    [isEditing, grouperUuid]
  );

  const grouperMutation = useRequest({
    asyncFunction: tryPersistGrouper,
    entityName: text.singularLabel,
    queryKey: queryKey.groupers.list,
    queryKey2: queryKey.groupers.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo (semântica de 3 estados de `parent_uuid`
  // no PUT, TASK-BE-051) — ESTE é o ponto de maior risco de bug da Tarefa.
  async function tryPersistGrouper(data: GrouperFormType) {
    const payload: GrouperPayload = {
      type: data.type as GrouperPayload['type'],
      name: data.name.trim(),
      description: data.description?.trim() || null,
      condition: data.condition as GrouperPayload['condition'],
      is_enabled: data.is_enabled === 'true',
      order: Number(data.order),
      formula: data.formula?.trim() || null,
    };

    if (isEditing && grouperUuid) {
      // Antecessor NÃO tocado → a chave `parent_uuid` NUNCA é atribuída
      // (fica ausente de verdade no objeto/JSON — não `undefined` explícito).
      if (dirtyFields.parent_uuid) {
        // Tocado: `null` (usuário limpou → vira raiz) ou uuid (trocou de
        // pai) — `data.parent_uuid` já carrega o valor certo em ambos os
        // casos.
        payload.parent_uuid = data.parent_uuid ?? null;
      }
      // `code` nunca entra no payload — somente leitura, gerado pelo
      // servidor, não recalculado no update (fidelidade ao legado, D4).
      return await updateGrouper(grouperUuid, payload);
    }

    // CRIAÇÃO: descendente → inclui `parent_uuid` (fixo, vindo da query
    // string); raiz → chave OMITIDA (mesmo comportamento do backend quando
    // ausente no `store()`).
    if (isCreatingDescendant && data.parent_uuid) {
      payload.parent_uuid = data.parent_uuid;
    }
    return await createGrouper(payload);
  }

  // Guard do submit: replica a POLARIDADE de CreateOrUpdateGrupoProduto.tsx
  // (referência explícita da Tarefa) — `isEmpty(dirtyFields)` aqui é lido
  // como "HÁ mudança real" (nome da função é enganoso, ver ERRO-FE-001). Em
  // edição sem nenhum campo tocado, evita um PUT vazio.
  async function onSubmit(data: GrouperFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      await grouperMutation.mutateAsync(data);
      return;
    }

    if (isEditing) {
      navigate(-1);
      return;
    }

    await grouperMutation.mutateAsync(data);
  }

  const isSubmitting = grouperMutation.isPending;

  // Opções fixas do Enum (não vêm de endpoint, Tarefa §Componentes).
  const typeOptions: Option<string>[] = [
    { value: '1', label: text.form.typeOptions.cost },
    { value: '2', label: text.form.typeOptions.revenue },
    { value: '3', label: text.form.typeOptions.depreciation },
    { value: '4', label: text.form.typeOptions.financial },
  ];

  const conditionOptions: Option<string>[] = [
    { value: '1', label: text.form.conditionOptions.category },
    { value: '2', label: text.form.conditionOptions.calculation },
  ];

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.filter.enabledOptions.active },
    { value: 'false', label: text.filter.enabledOptions.inactive },
  ];

  const watchedName = watch('name') ?? '';
  const watchedDescription = watch('description') ?? '';
  const watchedFormula = watch('formula') ?? '';

  return (
    <FormContainer
      title={
        isEditing
          ? text.form.title.edit
          : isCreatingDescendant
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
        {/* Código gerado — somente leitura, SÓ existe no modo edição (não há
            preview no create: é gerado depois de salvar, servidor). */}
        {isEditing && (
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Flex align="center" gap={3}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.list.table.code}
              </Text>
              <Text fontSize="md" fontWeight="bold" fontFamily="mono">
                {grouperData?.code}
              </Text>
            </Flex>
          </Box>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((o) => o.value === String(value)) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt ? Number(opt.value) : undefined)
                }
                options={typeOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="condition"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.condition}
                name={name}
                value={conditionOptions.find((o) => o.value === String(value)) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt ? Number(opt.value) : undefined)
                }
                options={conditionOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt?.value as GrouperFormType['is_enabled'])
                }
                options={enabledOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="order"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.order}
                value={value ?? null}
                onValueChange={(value) => onChange(value)}
                min={1}
                allowDot={false}
                error={error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            helperText={errors.name?.message ? undefined : `${watchedName.length}/60`}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${watchedDescription.length}/50`}
            {...register('description')}
            error={errors.description?.message}
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.formula}
            placeholder={text.form.placeholders.formula}
            helperText={errors.formula?.message ? undefined : `${watchedFormula.length}/191`}
            {...register('formula')}
            error={errors.formula?.message}
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Antecessor (full width) — HABILITADO só em edição (reparenting
            real, D4/TASK-BE-051); BLOQUEADO em QUALQUER modo de criação, raiz
            OU descendente (ERRO-FE-006 — a condição original só cobria o
            modo descendente, deixando "Novo" com o combo habilitado). */}
        <Box mt={6}>
          <Controller
            name="parent_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.parent}
                placeholder={text.form.parentPlaceholder.root}
                service={listGroupersForParent}
                mapOptions={(item: GrouperListItem) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={parentOption}
                onChange={(option: any) => {
                  field.onChange(option?.value ?? null);
                  setParentOption(option ?? null);
                }}
                isDisabled={!isEditing || !canSave}
                isReadOnly={!isEditing}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
