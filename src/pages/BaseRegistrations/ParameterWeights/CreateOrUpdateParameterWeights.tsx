// src/pages/BaseRegistrations/ParameterWeights/CreateOrUpdateParameterWeights.tsx
// Tela ÚNICA de criação/edição de Parâmetros / Peso (Cadastros Base →
// Pecuários). Molde estrutural: `CreateOrUpdateDiagnosisPregnancy.tsx`
// (guard de GUID, `fillForm`+`resetForce` via `useCustomFormQueryByGuid`
// INLINE — proibido `useParameterWeights.tsx` — `ButtonSaveAndNext` no
// footer), adaptado: sem `Select` de status (não há `is_enabled` neste
// módulo) e com os 2 blocos condicionais próprios (`code` somente-leitura
// no edit, `employee` read-only condicional no edit, DA-PW-16).
//
// `code` — gerado no servidor (`Repository::nextCode()` sob
// `pg_advisory_xact_lock`), a API NÃO expõe prévia: create fica SEM campo
// (só hint textual); edit exibe o valor já vindo do GET, nunca reenviado no
// payload de nenhum verbo (contrato de API v1.3, DTO/Request confirmados
// por leitura direta — `code` não existe em nenhum dos dois).
//
// `employee` — G3 (decisão do dono): fora do contrato de ESCRITA,
// definitivamente. O Resource de DETALHE devolve `{uuid, name} | null`
// (DA-PW-16) só para leitura; renderiza condicionalmente só quando
// `!== null`, nunca no create (sempre `null` ali), nunca editável.

import { SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { parameterWeightsSchemaResolver } from '@/validations/schemas/BaseRegistrations/parameterWeights-schema';

import {
  createParameterWeight,
  getParameterWeightByUuid,
  updateParameterWeight,
} from '@/services/v2/BaseRegistrations/parameterWeights-service';

import type {
  ParameterWeightData,
  ParameterWeightForm as ParameterWeightFormType,
  ParameterWeightPayload,
} from '@/@types/v2/BaseRegistrations/parameterWeights';

// Faixa 1900–2100 (G1, decisão do dono) — mesmos limites do Yup e do
// `ParameterWeightRequest` real (`after_or_equal:1900-01-01`/
// `before_or_equal:2100-12-31`).
const MIN_DATE = new Date(1900, 0, 1);
const MAX_DATE = new Date(2100, 11, 31);

export default function CreateOrUpdateParameterWeights() {
  const { parameterWeightId } = useParams<{ parameterWeightId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.baseRegistrations.parameterWeight;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) —
  // guarda de GUID inválido também cai em modo create (mirror
  // `CreateOrUpdateDiagnosisPregnancy`), nunca redireciona para a listagem.
  const isEditing = isValidGuid(parameterWeightId);

  const canSave = isEditing ? can('parameter-weight_edit') : can('parameter-weight_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ParameterWeightFormType>({
    mode: 'onChange',
    resolver: parameterWeightsSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: null,
      initial_weight: null,
      final_weight: null,
      description: '',
    },
  });

  function fillForm(data: ParameterWeightData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        date: data.date,
        initial_weight: data.initial_weight,
        final_weight: data.final_weight,
        description: data.description,
      });
    }
  }

  const parameterWeightQuery = useCustomFormQueryByGuid<ParameterWeightData>({
    registrationId: isEditing ? parameterWeightId : undefined,
    queryKey: queryKey.baseRegistrations.parameterWeight,
    asyncFunction: getParameterWeightByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([parameterWeightQuery as any]);

  // `code`/`employee` NÃO são campos RHF (fora do contrato de escrita) — lidos
  // direto do detalhe carregado pelo `GET`, só para exibição condicional.
  const parameterWeightDetail = parameterWeightQuery?.data as ParameterWeightData | undefined;

  const parameterWeightMutation = useRequest({
    asyncFunction: tryPersistParameterWeight,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.parameterWeights,
    queryKey2: queryKey.baseRegistrations.parameterWeight,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistParameterWeight(data: ParameterWeightFormType) {
    if (isEditing && parameterWeightId) {
      // Update envia SÓ o delta de `dirtyFields` — `ParameterWeightRequest`
      // real (api_root) confirma `sometimes` por campo fora do verbo POST,
      // mesma convenção de `updateDiagnosisPregnancy`/`updateCostCenter`.
      const payload: Partial<ParameterWeightPayload> = {};
      if (dirtyFields.date) payload.date = data.date as string;
      // `?? undefined`, NUNCA `|| undefined` — `0` é peso legítimo (item 18/19).
      if (dirtyFields.initial_weight) payload.initial_weight = data.initial_weight ?? undefined;
      if (dirtyFields.final_weight) payload.final_weight = data.final_weight ?? undefined;
      if (dirtyFields.description) payload.description = data.description.trim();
      return await updateParameterWeight(parameterWeightId, payload);
    }

    // CREATE: conjunto completo — Yup já garante que nenhum campo chega
    // `null`/vazio até aqui. SEM `code` (gerado no servidor, imutável).
    const payload: ParameterWeightPayload = {
      date: data.date as string,
      initial_weight: data.initial_weight as number,
      final_weight: data.final_weight as number,
      description: data.description.trim(),
    };
    return await createParameterWeight(payload);
  }

  // Guard EXPLÍCITO — decisão DELIBERADA da Tarefa (mesmo o molde
  // `DiagnosisPregnancy` usando `!isEmpty(dirtyFields)`): `isEmpty()` já
  // causou 9 sintomas catalogados no projeto por seu nome contraintuitivo
  // (`isEmpty(obj)` retorna `true` quando o objeto TEM chaves, ver
  // `ERRO-FE-001` no próprio molde). `Object.keys(dirtyFields).length === 0`
  // é auto-documentado e não depende de decorar a polaridade invertida.
  async function onSubmit(data: ParameterWeightFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await parameterWeightMutation.mutateAsync(data);
  }

  const isSubmitting = parameterWeightMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
          {/* `code` — SEM campo no create (nem readonly vazio, não há valor a
              mostrar: a API não expõe prévia). Só o hint de geração automática. */}
          {!isEditing && (
            <Text fontSize="sm" color="fg.muted" gridColumn="1 / -1">
              {text.form.hints.codeAutoGenerated}
            </Text>
          )}

          {/* `code` — edição: somente-leitura, vindo do GET de detalhe, NUNCA
              reenviado no payload (não é campo RHF). */}
          {isEditing && (
            <Skeleton loading={isLoading} borderRadius="md">
              <Field label={text.form.fields.code}>
                <Text fontSize="md" fontWeight="medium">
                  {parameterWeightDetail?.code ?? ''}
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

          {/* `user` — TASK-PW-FE-05/DA-PW-17: "Responsável" fiel ao
              `_forms.blade.php`, sempre presente, fora do payload (servidor
              resolve `user_id` sozinho), não é campo RHF. Distinto do bloco
              `employee` abaixo (histórico, condicional, só edit).
              CREATE: usuário logado (`useAuth()`, sem chamada de API).
              EDIT: quem cadastrou, vindo do GET de detalhe já carregado.
              `InputReadOnly` já encapsula seu próprio `Skeleton` de loading
              (não duplicar com um wrapper externo). */}
          <InputReadOnly
            label={text.form.fields.responsible}
            value={
              isEditing ? (parameterWeightDetail?.user?.name ?? '—') : (authUser?.username ?? '—')
            }
            loading={isLoading}
          />

          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DateInput
                  label={text.form.fields.date}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  minDate={MIN_DATE}
                  maxDate={MAX_DATE}
                  isRequired
                  disabled={!canSave}
                  error={error?.message}
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="initial_weight"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={field.name}
                  label={text.form.fields.initialWeight}
                  // `?? null`, NUNCA `|| 0` — `0` é peso inicial legítimo
                  // (mesma armadilha antes documentada para o `KgInput`).
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  decimalPlaces={2}
                  isRequired
                  disabled={!canSave}
                  error={error?.message}
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoading} borderRadius="md">
            <Controller
              name="final_weight"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={field.name}
                  label={text.form.fields.finalWeight}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  decimalPlaces={2}
                  isRequired
                  disabled={!canSave}
                  error={error?.message}
                />
              )}
            />
          </Skeleton>

          {/* `employee` — read-only, condicional, SÓ no edit (DA-PW-16):
              53/167 registros reais (32%) têm o dado, nenhum novo terá.
              Nunca um campo editável, nunca presente no create (sempre
              `null` ali — não renderiza nada). */}
          {isEditing && parameterWeightDetail?.employee && (
            <Skeleton loading={isLoading} borderRadius="md">
              <Field label={text.form.fields.employee}>
                <Text fontSize="sm" color="fg.muted">
                  {text.form.hints.employeeHistoric.replace(
                    '{name}',
                    parameterWeightDetail.employee.name
                  )}
                </Text>
              </Field>
            </Skeleton>
          )}
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
