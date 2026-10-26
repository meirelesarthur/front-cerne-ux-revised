// src/pages/BaseRegistrations/BodyScores/CreateOrUpdateBodyScore.tsx
// Tela ÚNICA de criação/edição de Escore Corporal (Cadastros Base → Pecuários).
// Mirror estrutural de `BaseRegistrations/DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy.tsx`;
// campo de Espécie mirror `CadastrosBase/Racas/CreateOrUpdateRaca.tsx`
// (`SelectAsyncPaginate` portalizada).
//
// ORDEM DOS CAMPOS (decisão do dono, fiel ao Blade legado `_forms.blade.php`,
// ver ficha TASK-BS-FE-03): Espécie (topo) → Descrição → Habilitado — INVERSO
// do layout visual de `CreateOrUpdateRaca.tsx` (que põe a Espécie por último).
//
// Rótulo/valores de `is_enabled` = "Habilitado"/"Sim"/"Não" (GAP-BS-FE-01
// [AVALIADO] — decisão do dono; i18n já criado em TASK-BS-FE-01/FE-02) — NÃO
// "Status"/"Ativo"/"Inativo". Widget = `Select` (não `Switch`), fiel ao
// `<select>` real do Blade legado (mirror `CreateOrUpdateDiagnosisPregnancy.tsx`).
// Reaproveita os textos já existentes da listagem (`list.table.yes`/`no`) —
// mesmo racional de `CreateOrUpdateDiagnosisPregnancy.tsx` (evita duplicar
// chave de i18n para o mesmo par de rótulos).
//
// PAYLOAD (create/update) — VERIFICADO por leitura direta de
// `api_root/app/Http/Requests/Api/V1/BodyScoreRequest.php` (não assumido):
// `rules()` NÃO diferencia store/update por método (só `authorize()` o faz) —
// `description` e `is_enabled` são `required` em AMBOS os verbos (`specie_uuid`
// é `nullable`, mas client-required por fidelidade ao Blade — ver schema de
// TASK-BS-FE-01). Mesmo desenho de `BreedRequest` (precedente mais próximo,
// mesma FK), NÃO o de `DiagnosisPregnancyRequest` (que aceita `sometimes`
// pós-TASK-04). Por isso `tryPersistBodyScore` envia o payload COMPLETO em
// ambos os modos (create/update) — mirror `tryPersistBreed`, nunca um delta de
// `dirtyFields`.

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

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { bodyScoreSchemaResolver } from '@/validations/schemas/BaseRegistrations/bodyScore-schema';

import {
  createBodyScore,
  getBodyScoreByUuid,
  updateBodyScore,
} from '@/services/v2/BaseRegistrations/bodyScore-service';
import { listSpecies } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type {
  BodyScoreData,
  BodyScoreForm as BodyScoreFormType,
  BodyScorePayload,
} from '@/@types/v2/BaseRegistrations/bodyScore';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

export default function CreateOrUpdateBodyScore() {
  const { bodyScoreId } = useParams<{ bodyScoreId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.bodyScore;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(bodyScoreId);

  // Guard de navegação: um `bodyScoreId` presente mas que NÃO é um GUID válido
  // (ex.: URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de `CreateOrUpdateRaca.tsx:86-90`.
  useEffect(() => {
    if (bodyScoreId && !isValidGuid(bodyScoreId)) {
      navigate('/cadastros-base/escore-corporal', { replace: true });
    }
  }, [bodyScoreId, navigate]);

  const canSave = isEditing ? can('bodys_edit') : can('bodys_create');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<BodyScoreFormType>({
    mode: 'onChange',
    resolver: bodyScoreSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
    },
  });

  function fillForm(data: BodyScoreData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
      });
    }
  }

  const bodyScoreQuery = useCustomFormQueryByGuid<BodyScoreData>({
    registrationId: isEditing ? bodyScoreId : undefined,
    queryKey: queryKey.baseRegistrations.bodyScore,
    asyncFunction: getBodyScoreByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([bodyScoreQuery as any]);

  const bodyScoreMutation = useRequest({
    asyncFunction: tryPersistBodyScore,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.bodyScores,
    queryKey2: queryKey.baseRegistrations.bodyScore,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo: payload SEMPRE completo (create e
  // update) — `BodyScoreRequest::rules()` exige `description`/`is_enabled`
  // em AMBOS os verbos, sem suporte a PATCH parcial (confirmado por leitura
  // direta do Request real, não assumido).
  async function tryPersistBodyScore(data: BodyScoreFormType) {
    const payload: BodyScorePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid?.value ?? null,
    };

    if (isEditing && bodyScoreId) {
      return await updateBodyScore(bodyScoreId, payload);
    }
    return await createBodyScore(payload);
  }

  // "editar sem alterar nada = Cancelar" (só volta sem salvar quando NADA
  // mudou). ERRO-FE-001: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna `true`
  // quando o objeto TEM alguma chave própria; a guarda correta é
  // `!isEmpty(dirtyFields)` (mesma correção de `CreateOrUpdateDiagnosisPregnancy.tsx`/
  // `CreateOrUpdateRaca.tsx`), nunca a forma sem `!`.
  async function onSubmit(data: BodyScoreFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await bodyScoreMutation.mutateAsync(data);
    }
  }

  const isSubmitting = bodyScoreMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Sim/Não) — mesmo
  // racional de `CreateOrUpdateDiagnosisPregnancy.tsx` (evita duplicar chave
  // de i18n para o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.yes },
    { value: false, label: text.list.table.no },
  ];

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
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <Box mb={6}>
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
                isRequired
                isDisabled={!canSave || isLoading}
                // Portaliza no <body> — mesmo fix de `FilterSideRacas.tsx`/
                // `CreateOrUpdateRaca.tsx` (TASK-BREED-FORM-SELECT-PORTAL):
                // sem `position="fixed"` direto na prop de estilo (cai no
                // default "absolute" do SelectAsyncPaginate).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* TASK-BS-FE-04 (ajuste de homologação): `description` é NUMÉRICA
              (dígitos + separador decimal ".", fiel ao `<input type="number"
              step="0.25">` do Blade legado — Doc Bruta §6, item 2). Payload
              continua STRING (backend `varchar(100)`), então NÃO usamos o
              `NumberInput` canônico (`components/Form/NumberInput.tsx`) — o
              mascaramento fill-da-direita dele (estilo moeda: dígitos
              acumulam da direita, `value`/`onValueChange` são `number`) não
              corresponde à digitação livre da esquerda-pra-direita de um
              `<input type="number">` real, e forçaria uma conversão
              number→string com perda (ex.: zeros à esquerda). Em vez disso,
              `Controller` filtra a entrada a `[0-9.]` a cada tecla (bloqueia
              letra/caractere especial na origem) — o schema Yup
              (`bodyScore-schema.ts`) valida o formato final
              (`^\d+(\.\d+)?$`), cobrindo casos que o filtro por si só não
              cobre (ex.: múltiplos pontos). */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                label={text.form.fields.description}
                placeholder={text.form.placeholders.description}
                name={field.name}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value.replace(/[^0-9.]/g, ''))}
                onBlur={field.onBlur}
                inputMode="decimal"
                error={errors.description?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
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
                value={statusOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions}
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
