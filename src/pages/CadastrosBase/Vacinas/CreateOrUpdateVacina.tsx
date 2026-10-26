// src/pages/CadastrosBase/Vacinas/CreateOrUpdateVacina.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de VACINA (mesmo arquivo para os dois casos).
// Rotas: /cadastros-base/vacinas/novo (criar) e /cadastros-base/vacinas/:vaccineId
// (editar, GUID) — ambas registradas em src/router/index.tsx, guardadas por
// `vaccine_view` (autorização real de create/edit é 403 do backend).
//
// INTERSEÇÃO de 2 precedentes:
//   - Estrutura mecânica (guard de GUID, `fillForm` guardado por
//     `!isEmpty(dirtyFields) || resetForce`, SelectAsyncPaginate de Espécie)
//     de CadastrosBase/Racas/CreateOrUpdateRaca.tsx.
//   - Campo `is_enabled` — **Select** Ativo/Inativo (NÃO `Switch`), mirror
//     EXATO de CadastrosBase/CondicoesPagamento/CreateOrUpdateCondicaoPagamento.tsx
//     (padrão consolidado do projeto, GAP-FE-008).
//
// Diferença central de `Breed`: `specie_uuid` é OPCIONAL (D2 do contrato) —
// SEM `required`/`isRequired` em nenhum dos 3 pontos (Controller `rules`,
// prop `isRequired` do SelectAsyncPaginate, schema Yup).
//
// `VaccineRequest::rules()` usa `sometimes` no update — mas o payload de
// escrita aqui é SEMPRE completo (create e update), mesmo comportamento
// prático de `Breed`/`PaymentTerm` (nenhuma tela do projeto envia PATCH
// verdadeiramente parcial hoje).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listSpecies } from '@/services/v2/Species/species-service';
import { createVaccine, updateVaccine } from '@/services/v2/Vaccines/vaccine-service';

import type { Option } from '@/@types/option';
import type { SpeciesListItem } from '@/@types/v2/Species/species';
import type {
  VaccineData,
  VaccineForm as VaccineFormType,
  VaccinePayload,
} from '@/@types/v2/Vaccines';

import { useVaccineForm } from './useVaccines';
import { vaccineSchemaResolver } from './vaccine-schema';

export default function CreateOrUpdateVacina() {
  const { vaccineId } = useParams<{ vaccineId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:vaccineId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(vaccineId);

  // Guard de navegação: um `vaccineId` presente mas que NÃO é um GUID válido
  // (ex.: URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem.
  useEffect(() => {
    if (vaccineId && !isValidGuid(vaccineId)) {
      navigate('/cadastros-base/vacinas', { replace: true });
    }
  }, [vaccineId, navigate]);

  const text = languageGB.vaccines.vaccine;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<VaccineFormType>({
    mode: 'onChange',
    resolver: vaccineSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
    },
  });

  // Guarda por `!isEmpty(dirtyFields) || resetForce` — `src/utils/isEmpty.ts`
  // é MAL NOMEADA (retorna `true` quando o objeto TEM chaves, `false` quando
  // vazio, ERRO-FE-001). `!isEmpty(dirtyFields)` é `true` quando `dirtyFields`
  // está VAZIO (nada editado ainda) — reset() só roda quando é seguro (sem
  // edição em andamento) ou quando forçado pela carga inicial do hook.
  function fillForm(data: VaccineData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
      });
    }
  }

  const vaccineQuery = useVaccineForm({
    registrationId: isEditing ? vaccineId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([vaccineQuery as any]);

  // Sem flags de autorização por item no `VaccineResource` — permissão
  // GLOBAL basta (mesmo padrão de Racas/CreateOrUpdateRaca.tsx).
  const canSave = isEditing ? can('vaccine_edit') : can('vaccine_create');

  const vaccineMutation = useRequest({
    asyncFunction: tryPersistVaccine,
    entityName: text.singularLabel,
    queryKey: queryKey.vaccines.list,
    queryKey2: queryKey.vaccines.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create e update) — `specie_uuid` OPCIONAL (D2),
  // nunca forçado com `!` (diferente de `tryPersistBreed`).
  async function tryPersistVaccine(data: VaccineFormType) {
    const payload: VaccinePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid?.value ?? null,
    };

    if (isEditing && vaccineId) {
      return await updateVaccine(vaccineId, payload);
    }
    return await createVaccine(payload);
  }

  async function onSubmit(data: VaccineFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação, ou edição com alteração real → salva.
      await vaccineMutation.mutateAsync(data);
    }
  }

  const isSubmitting = vaccineMutation.isPending;

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  // `is_enabled` — Select Ativo/Inativo (reaproveita os textos já existentes
  // da listagem — mesmo racional de CreateOrUpdateCondicaoPagamento.tsx).
  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.activeLabel },
    { value: false, label: text.list.table.inactiveLabel },
  ];

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
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
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

        <Box mt={6}>
          <Controller
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                error={errors.specie_uuid?.message as string | undefined}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave}
                // Sem `isRequired`/`rules={{ required: true }}` — D2, campo
                // opcional (diverge de CreateOrUpdateRaca.tsx).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
