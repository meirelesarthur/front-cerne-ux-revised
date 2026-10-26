// src/pages/BaseRegistrations/LowReasons/CreateOrUpdateLowReasons.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de MOTIVO DE BAIXA — Cadastros Base /
// Financeiros. Rotas: /cadastros-base/motivos-de-baixa/novo e
// /cadastros-base/motivos-de-baixa/:lowReasonId (GUID), registradas em
// src/router/index.tsx, guardadas por `lowreasons_view`.
//
// Precedente interno `CentroCusto/CreateOrUpdateCentroCusto.tsx` para o bloco
// "Código gerado" (Box com borda + bg.muted, código em fontFamily="mono"),
// SEM o badge/prévia de Classe (não existe neste módulo — LowReason não tem
// hierarquia). `is_enabled`/`do_movement` seguem o padrão de `Especies`
// (Select Chakra, não Switch — catálogo flat simples).
//
// 3 campos editáveis: `description` (obrigatório, máx. 100), `do_movement`
// (boolean, obrigatório) e `is_enabled` (boolean, obrigatório), mais `code`
// exibido SÓ LEITURA na edição (gerado no servidor, DA-LR-16). No CREATE,
// `code` mostra a dica "Gerado automaticamente ao salvar" — NUNCA um valor
// calculado no cliente (sem fórmula client-side segura para o sequencial
// `MAX(code)+1` protegido por `pg_advisory_xact_lock`).
//
// Payload de update COMPLETO (não delta) — por exigência real do backend
// (`LowReasonRequest.rules()` exige os 3 campos sempre presentes no PUT).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
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

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { lowReasonsSchemaResolver } from '@/validations/schemas/BaseRegistrations/lowReasons-schema';

import {
  createLowReason,
  getLowReason,
  updateLowReason,
} from '@/services/v2/BaseRegistrations/lowReasons-service';

import type { Option } from '@/@types/option';
import type {
  LowReasonData,
  LowReasonForm as LowReasonFormType,
  LowReasonPayload,
} from '@/@types/v2/BaseRegistrations/lowReasons';

export default function CreateOrUpdateLowReasons() {
  const { lowReasonId } = useParams<{ lowReasonId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(lowReasonId);

  const text = languageGB.baseRegistrations.lowReason;

  const canSave = isEditing ? can('lowreasons_edit') : can('lowreasons_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<LowReasonFormType>({
    mode: 'onChange',
    resolver: lowReasonsSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      do_movement: false,
      is_enabled: true,
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`. `src/utils/isEmpty.ts:1-6` retorna `true` quando o objeto TEM
  // ao menos uma chave própria (NÃO vazio) e `false` quando é `{}` — nome
  // invertido do que a assinatura sugere. Logo `!isEmpty(dirtyFields)` aqui é
  // `true` quando `dirtyFields` está VAZIO (nada editado ainda) — reset()
  // só roda quando é seguro (sem edição em andamento) ou quando forçado pela
  // carga inicial do hook (`resetForce=true`).
  function fillForm(data: LowReasonData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        code: data.code,
        description: data.description,
        do_movement: !!data.do_movement,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const lowReasonQuery = useCustomFormQueryByGuid<LowReasonData>({
    registrationId: isEditing ? lowReasonId : undefined,
    queryKey: queryKey.baseRegistrations.lowReason,
    asyncFunction: getLowReason,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([lowReasonQuery as any]);
  const lowReasonData = lowReasonQuery.data;

  const lowReasonMutation = useRequest({
    asyncFunction: tryPersistLowReason,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.lowReasons,
    queryKey2: queryKey.baseRegistrations.lowReason,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistLowReason(data: LowReasonFormType) {
    // Payload COMPLETO (description+do_movement+is_enabled SEMPRE presentes)
    // — NÃO delta. `code` NUNCA entra aqui (gerado/imutável no servidor,
    // DA-LR-16) — nem no create nem no update.
    const payload: LowReasonPayload = {
      description: data.description.trim(),
      do_movement: !!data.do_movement,
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && lowReasonId) {
      return await updateLowReason(lowReasonId, payload); // PUT full-resource, SEMPRE os 3 campos
    }

    return await createLowReason(payload);
  }

  // Guard de `onSubmit` — salva quando há alterações reais (edição) ou sempre
  // no create; só volta sem salvar quando editando E nada mudou.
  //
  // `src/utils/isEmpty.ts` é MAL NOMEADA: `isEmpty(obj)` retorna `true` quando
  // `obj` TEM chaves. Logo `isEmpty(dirtyFields)` é `true` quando HÁ alteração
  // real — este arquivo implementa o comportamento CORRETO (verificado
  // mecanicamente contra `isEmpty.ts`).
  async function onSubmit(data: LowReasonFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      await lowReasonMutation.mutateAsync(data); // dirtyFields NÃO vazio -> há alteração real -> salva
    } else if (isEditing) {
      navigate(-1); // dirtyFields vazio -> nada mudou -> só volta, sem chamar a API
    } else {
      await lowReasonMutation.mutateAsync(data); // create -> sempre salva
    }
  }

  const isSubmitting = lowReasonMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Sim/Não, Ativo/Inativo).
  const movementOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.doMovementYes },
    { value: false, label: text.list.table.doMovementNo },
  ];

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  // `code`: real em edição (vindo do backend); no create, dica textual — NUNCA
  // um valor calculado no cliente (sem fórmula client-side segura para o
  // sequencial protegido por pg_advisory_xact_lock, DA-LR-16).
  const displayCode = isEditing ? lowReasonData?.code : text.form.hints.codeGenerated;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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
        {/* Código gerado — real em edição, dica claramente rotulada no create */}
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
              <Text
                fontSize="md"
                fontWeight={isEditing ? 'bold' : 'normal'}
                fontFamily={isEditing ? 'mono' : undefined}
                color={isEditing ? undefined : 'fg.muted'}
              >
                {displayCode}
              </Text>
            </Flex>
          </Skeleton>
        </Box>

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
            name="do_movement"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.doMovement}
                name={name}
                value={movementOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={movementOptions}
                error={error?.message}
                isRequired
                noClearable
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
                value={enabledOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={enabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
