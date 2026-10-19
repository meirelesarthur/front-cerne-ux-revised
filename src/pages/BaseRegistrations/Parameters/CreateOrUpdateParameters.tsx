// src/pages/BaseRegistrations/Parameters/CreateOrUpdateParameters.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PARÂMETRO — Configurações, execução 031,
// TASK-FE-031-42. Rotas `/configuracoes/parametros/novo` e
// `/configuracoes/parametros/:parameterUuid` (wiring real das rotas é
// TASK-FE-031-43, este arquivo não mexe em router/menu).
//
// Molde estrutural: `Headbands/CreateOrUpdateHeadband.tsx` (casca
// `FormContainer`/rodapé, guarda `onSubmit` `!isEmpty(dirtyFields)`) —
// SEM upload/pivot (Parâmetros não tem sub-entidade, só 4 campos simples).
//
// DESVIO DELIBERADO do texto literal da Tarefa: `useCustomFormQueryByGuid`
// (não `useCustomFormQueryById`, apesar da ficha citar esse nome) — o
// precedente REAL e dominante em todo `CadastrosBase/*`/`BaseRegistrations/*`
// para forms create/edit por GUID é `useCustomFormQueryByGuid`
// (`useCustomFormQueryById`, apesar do nome, só é usado por 4 módulos
// LEGADOS com ID numérico — ver nota de `Funcoes/useFunctions.tsx`). Fonte de
// verdade real > texto genérico da ficha, mesmo racional já registrado nesse
// módulo irmão.
//
// ⚠️ PROTEÇÃO DE NOME RESERVADO (GAP-BE-511-parameters, decisão do dono
// 2026-08-06: [APROVADO — Opção A]): em modo edição, se o parâmetro carregado
// é um dos 5 nomes reservados (`isReservedParameterName`), o campo `Nome`
// renderiza READ-ONLY e fica FORA do `register()` — não só `disabled` (evita
// reenviar `name` inalterado por engano caso o Input disabled ainda produza
// valor no DOM; mirror do padrão já usado em `CreateSaldoInicial.tsx` para os
// campos display-only "Tipo"/"Tp. Categoria"). Em modo CRIAÇÃO o campo é
// sempre editável (o backend rejeita nome duplicado via `unique`).
//
// ⚠️ CORREÇÃO PÓS-E2E (rodada 1, C3 — correcoes-e2e-dev-rodada-1.md): REVISA
// a decisão acima — `value`/`type`/`description` NÃO seguem mais editáveis
// em reservados (a nota antiga acima, "seguem editáveis em qualquer modo",
// está SUPERADA). Reservados agora são SOMENTE VISUALIZAÇÃO na UI: (1) a
// listagem (`index.tsx`) não oferece mais a ação "Editar" para os 5 nomes
// reservados, só "Visualizar"; (2) esta tela, em defesa de profundidade
// contra acesso direto por URL, redireciona para `ParametersDetalhe` assim
// que detecta `isReserved === true` (useEffect abaixo) e desabilita todos os
// campos remanescentes durante o instante entre o carregamento do detalhe e
// o redirecionamento. O backend permanece inalterado (guard de
// `name`/`destroy` já existia, contrato-api-parametros.md).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { parameterTypeOptions } from '@/constants/BaseRegistrations/options/parameter-type-options';
import type { ParameterType } from '@/constants/BaseRegistrations/parameter-type';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { isReservedParameterName } from '@/constants/reserved-parameter-names';

import { parameterSchemaResolver } from '@/validations/schemas/BaseRegistrations/parameter-schema';

import {
  createParameter,
  getParameter,
  updateParameter,
} from '@/services/v2/BaseRegistrations/parameter-service';

import type {
  ParameterDetail,
  ParameterForm as ParameterFormType,
  ParameterPayload,
} from '@/@types/v2/BaseRegistrations/Parameters';

export default function CreateOrUpdateParameters() {
  const { parameterUuid } = useParams<{ parameterUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.parameters.parameter;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(parameterUuid);

  const canSave = isEditing ? can('parameters_edit') : can('parameters_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ParameterFormType>({
    mode: 'onChange',
    resolver: parameterSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      value: '',
      type: null,
      description: '',
    },
  });

  function fillForm(data: ParameterDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        name: data.name,
        value: data.value,
        type: data.type,
        description: data.description ?? '',
      });
    }
  }

  const parameterQuery = useCustomFormQueryByGuid<ParameterDetail>({
    registrationId: isEditing ? parameterUuid : undefined,
    queryKey: queryKey.parameters.detail,
    asyncFunction: getParameter,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([parameterQuery as any]);

  // Só é conhecido depois que o detalhe carrega — em criação nunca é reservado.
  const loadedParameter = (parameterQuery as any)?.data as ParameterDetail | undefined;
  const isReserved =
    isEditing && loadedParameter ? isReservedParameterName(loadedParameter.name) : false;

  // Correção C3 — defesa em profundidade: reservados são SOMENTE
  // VISUALIZAÇÃO (a listagem já não oferece mais o link "Editar" para eles,
  // ver `index.tsx`); se este componente for alcançado mesmo assim (URL
  // digitada direto), redireciona para o Detalhe assim que o parâmetro
  // carrega e se confirma reservado — nunca deixa o formulário de edição
  // "aberto" para um reservado.
  useEffect(() => {
    if (isReserved && parameterUuid) {
      navigate(`/configuracoes/parametros/${parameterUuid}/detalhe`, { replace: true });
    }
  }, [isReserved, parameterUuid, navigate]);

  async function tryPersistParameter(data: ParameterFormType) {
    if (isEditing && parameterUuid) {
      // CORREÇÃO PÓS-E2E (rodada 1, C2 — correcoes-e2e-dev-rodada-1.md):
      // `ParameterRequest::rules()` (backend) exige `name`/`value`/`type`
      // como `required` também no UPDATE (não é validação "parcial" —
      // confirmado por leitura direta do Form Request) — o payload
      // condicionado a `dirtyFields.*` OMITIA esses campos sempre que o
      // usuário não tocava neles (ex.: editar só o Valor), causando 422
      // "O campo name é obrigatório" mesmo com um nome válido já carregado.
      // Envia SEMPRE `value`/`type`/`description` (valores atuais do form,
      // já carregados por `fillForm`) e `name` SEMPRE que NÃO reservado — o
      // lock de nome (fora do `register()`) vale SÓ para os 5 reservados
      // (GAP-BE-511-parameters, Opção A); `description` continua opcional
      // no backend (`nullable`), mas reenviá-la sempre é inofensivo.
      const payload: Partial<ParameterPayload> = {
        value: data.value.trim(),
        type: data.type!,
        description: data.description?.trim() || null,
      };

      if (!isReserved) {
        payload.name = data.name.trim();
      }

      return await updateParameter(parameterUuid, payload);
    }

    const payload: ParameterPayload = {
      name: data.name.trim(),
      value: data.value.trim(),
      type: data.type!,
      description: data.description?.trim() || null,
    };

    return await createParameter(payload);
  }

  const parameterMutation = useRequest({
    asyncFunction: tryPersistParameter,
    entityName: text.singularLabel,
    queryKey: queryKey.parameters.list,
    queryKey2: queryKey.parameters.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  const isSubmitting = parameterMutation.isPending;

  // Guard `onSubmit` — fórmula VERIFICADA como correta (família
  // CentroCusto/Safra/Perfil/Headband), `!isEmpty(dirtyFields)`: nada mudou
  // → só volta, sem chamar a API.
  async function onSubmit(data: ParameterFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await parameterMutation.mutateAsync(data);
    }
  }

  const typeOptions = parameterTypeOptions.options(languageGB);

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
          {canSave && !isReserved && (
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
          {isReserved ? (
            // Display-only — fora do `register()`, nunca vai ao payload (ver
            // `tryPersistParameter` acima; dupla garantia, não só a UI).
            // Mirror `CreateSaldoInicial.tsx` ("Tipo"/"Tp. Categoria").
            <Input
              label={text.form.fields.name}
              name="name_display"
              value={loadedParameter?.name ?? ''}
              tooltip={text.form.reservedNameHelper}
              disabled
              readOnly
            />
          ) : (
            <Input
              label={text.form.fields.name}
              placeholder={text.form.placeholders.name}
              {...register('name')}
              error={errors.name?.message}
              isRequired
              maxLength={20}
              loading={isLoading}
              disabled={!canSave}
            />
          )}

          <Input
            label={text.form.fields.value}
            placeholder={text.form.placeholders.value}
            {...register('value')}
            error={errors.value?.message}
            isRequired
            maxLength={255}
            loading={isLoading}
            // Correção C3 — desabilitado também quando reservado (defesa em
            // profundidade, ver nota de cabeçalho: reservados são SOMENTE
            // VISUALIZAÇÃO, o `useEffect` acima já redireciona para o
            // Detalhe; este `disabled` cobre só o instante entre carregar o
            // dado e o redirecionamento efetivar).
            disabled={!canSave || isReserved}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: { value: ParameterType } | null) => onChange(opt?.value ?? null)}
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave || isReserved}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            maxLength={40}
            loading={isLoading}
            disabled={!canSave || isReserved}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
