// src/pages/BaseRegistrations/IssueDfeSyncTimes/CreateOrUpdateIssueDfeSyncTimes.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de SINCRONIZAÇÃO DFE (mesmo arquivo para os
// dois casos, TASK-DFE-FE-02). Rotas: /cadastros-base/sincronizacao-dfe/novo
// (criar) e /cadastros-base/sincronizacao-dfe/:issueDfeSyncTimeId (editar,
// GUID) — ambas registradas em src/router/index.tsx, guardadas por
// `issue-dfe-sync-time_view` (permissão única gating a rota; botões internos
// checam `issue-dfe-sync-time_create`/`_edit` via `usePermissions`, mesmo
// padrão de CategoryProduct/LowReason).
//
// Form de só 2 campos, ambos Selects com particularidades reais:
//   - `issue_uuid` (Emissor elegível) — endpoint `eligible-issuers`
//     NÃO-PAGINADO (DA-DFE-06) → `SelectCombobox` (busca CLIENT-SIDE), NÃO
//     `SelectAsyncPaginate` (achado #1/#2 da Tarefa — a "busca" de um
//     SelectAsyncPaginate contra endpoint não-paginado seria cosmética).
//   - `sync_hour` (Hora da janela 19h-07h) — Select ESTÁTICO Chakra, 13
//     valores HARDCODED (`SYNC_HOUR_OPTIONS`), não vem de nenhum endpoint de
//     opções (achado #4/#5 — `sync_hour_label` do Resource é só para EXIBIÇÃO
//     na grid, TASK-DFE-FE-01).
//
// GUARD vs. PAYLOAD no `onSubmit` (não confundir os dois — armadilha #2 do
// checklist): o GUARD que decide SE dispara a chamada de update usa a forma
// EXPLÍCITA `Object.keys(dirtyFields).length === 0` — NUNCA
// `isEmpty(dirtyFields)`/`!isEmpty(dirtyFields)` (`src/utils/isEmpty.ts` é MAL
// NOMEADA: retorna `true` quando o objeto NÃO está vazio). O PAYLOAD (o QUE
// vai no corpo da requisição) é SEMPRE completo — `issue_uuid`+`sync_hour`
// presentes em toda chamada de create/update, nunca delta de `dirtyFields`
// (`IssueDfeSyncTimeRequest::rules()` é unificado, ambos `required` nos dois
// verbos, DA-DFE-10).
//
// `issue_uuid` — NUNCA `issue_id` cru no payload (DA-DFE-11, Lei de Ferro do
// fork, addendum pós-execução do contrato de API).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { issueDfeSyncTimesSchemaResolver } from '@/validations/schemas/BaseRegistrations/issueDfeSyncTimes-schema';

import {
  createIssueDfeSyncTime,
  getIssueDfeSyncTime,
  listEligibleIssuersForSync,
  updateIssueDfeSyncTime,
} from '@/services/v2/BaseRegistrations/issueDfeSyncTimes-service';

import type { Option } from '@/@types/option';
import type {
  IssueDfeSyncTimeDetail,
  IssueDfeSyncTimeForm as IssueDfeSyncTimeFormType,
  IssueDfeSyncTimePayload,
} from '@/@types/v2/BaseRegistrations/issueDfeSyncTimes';

// Ordem CRONOLÓGICA da janela (19→23, depois 0→7) — não ordem numérica
// crescente 0→23, para o Select ficar legível ao usuário como uma janela
// contínua. Nota de divergência (achado #4 da Tarefa): o TEXTO do contrato
// (DA-DFE-07) diz "janela de 12 valores" — a enumeração REAL (contrato +
// gatilho) é 13 valores (5 + 8). Usado o valor real; divergência reportada
// no laudo de entrega, sem bloquear.
const SYNC_HOUR_OPTIONS: Option<number>[] = [19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7].map(
  (hour) => ({ value: hour, label: `${String(hour).padStart(2, '0')}:00` })
);

export default function CreateOrUpdateIssueDfeSyncTimes() {
  const { issueDfeSyncTimeId } = useParams<{ issueDfeSyncTimeId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:issueDfeSyncTimeId` — é uma rota irmã distinta registrada em
  // router/index.tsx).
  const isEditing = isValidGuid(issueDfeSyncTimeId);

  // Guard de navegação: um `issueDfeSyncTimeId` presente mas que NÃO é um
  // GUID válido (ex.: URL adulterada manualmente) não deve chegar ao hook de
  // query nem renderizar um form "fantasma" — redireciona para a listagem,
  // mesmo racional de CreateOrUpdateCategoriaProduto.tsx.
  useEffect(() => {
    if (issueDfeSyncTimeId && !isValidGuid(issueDfeSyncTimeId)) {
      navigate('/cadastros-base/sincronizacao-dfe', { replace: true });
    }
  }, [issueDfeSyncTimeId, navigate]);

  const text = languageGB.baseRegistrations.issueDfeSyncTime;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<IssueDfeSyncTimeFormType>({
    mode: 'onChange',
    resolver: issueDfeSyncTimesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      issue_uuid: null,
      sync_hour: null,
    },
  });

  // Reconstrução dos 2 Selects a partir do Resource (uuid+label juntos, sem
  // novo fetch) — mesmo padrão de `fillForm` de CategoriasProduto.
  function fillForm(data: IssueDfeSyncTimeDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        issue_uuid: { label: data.issuer.razao_social, value: data.issuer.uuid },
        sync_hour: SYNC_HOUR_OPTIONS.find((option) => option.value === data.sync_hour) ?? null,
      });
    }
  }

  const issueDfeSyncTimeQuery = useCustomFormQueryByGuid<IssueDfeSyncTimeDetail>({
    registrationId: isEditing ? issueDfeSyncTimeId : undefined,
    queryKey: queryKey.baseRegistrations.issueDfeSyncTime,
    asyncFunction: getIssueDfeSyncTime,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([issueDfeSyncTimeQuery as any]);

  // Select de Emissor elegível — endpoint NÃO-paginado (DA-DFE-06), 1 fetch
  // compartilhado, filtro CLIENT-SIDE dentro do próprio `SelectCombobox`.
  // `GET /issue-dfe-sync-times/eligible-issuers` devolve a Collection inteira
  // (`ListEligibleIssuersForSyncAction`), por isso busca a lista completa UMA
  // VEZ sem parâmetro de busca; o filtro do `SelectCombobox` é client-side.
  const eligibleIssuersQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.issueDfeSyncTimeEligibleIssuers],
    queryFn: async () => {
      const response = await listEligibleIssuersForSync();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
  const issuerOptions: Option<string>[] = (eligibleIssuersQuery.data ?? []).map((issuer) => ({
    label: issuer.razao_social,
    value: issuer.uuid,
  }));

  // Sem flags de autorização por item no Resource — permissão GLOBAL basta
  // (mesmo padrão de CategoryProduct/LowReason).
  const canSave = isEditing ? can('issue-dfe-sync-time_edit') : can('issue-dfe-sync-time_create');

  const issueDfeSyncTimeMutation = useRequest({
    asyncFunction: tryPersistIssueDfeSyncTime,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.issueDfeSyncTimes,
    queryKey2: queryKey.baseRegistrations.issueDfeSyncTime,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload (O QUE vai no corpo da requisição): SEMPRE os 2 campos completos
  // — `issue_uuid` (NUNCA `issue_id`, DA-DFE-11) + `sync_hour` — nunca só o
  // delta de `dirtyFields` (ver cabeçalho do arquivo).
  async function tryPersistIssueDfeSyncTime(data: IssueDfeSyncTimeFormType) {
    const payload: IssueDfeSyncTimePayload = {
      issue_uuid: data.issue_uuid!.value,
      sync_hour: data.sync_hour!.value,
    };

    if (isEditing && issueDfeSyncTimeId) {
      return await updateIssueDfeSyncTime(issueDfeSyncTimeId, payload);
    }
    return await createIssueDfeSyncTime(payload);
  }

  // Guard (DECIDE SE dispara a chamada de update): forma EXPLÍCITA
  // `Object.keys(dirtyFields).length` — PROIBIDO `isEmpty(dirtyFields)`/
  // `!isEmpty(dirtyFields)` nesta Tarefa (ver cabeçalho do arquivo).
  async function onSubmit(data: IssueDfeSyncTimeFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasChanges) {
      navigate(-1); // nada mudou, não chama a API
      return;
    }

    await issueDfeSyncTimeMutation.mutateAsync(data); // cria OU atualiza, payload sempre completo
  }

  const isSubmitting = issueDfeSyncTimeMutation.isPending;

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
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
          <Controller
            name="issue_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectCombobox
                name={field.name}
                label={text.form.fields.issue}
                placeholder={text.form.placeholders.issue}
                error={errors.issue_uuid?.message as string | undefined}
                options={issuerOptions}
                loading={eligibleIssuersQuery.isLoading}
                // Armadilha #16 do checklist: `?? null` NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="sync_hour"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.syncHour}
                name={name}
                value={value ?? null}
                onChange={(option) => onChange(option ?? null)}
                options={SYNC_HOUR_OPTIONS}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={!!isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
