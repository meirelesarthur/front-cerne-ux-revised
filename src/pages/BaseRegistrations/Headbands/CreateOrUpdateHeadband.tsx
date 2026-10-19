// src/pages/BaseRegistrations/Headbands/CreateOrUpdateHeadband.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TESTEIRA (Headband) — módulo de menu
// Configurações. TASK-HB-FE-06. Rotas `/configuracoes/testeiras/novo` e
// `/configuracoes/testeiras/:headbandId` (migradas do antigo path em
// Cadastros Base em 97-Esteiras/019, instrução literal do dono 2026-08-05)
// são registradas pela Tarefa irmã `TASK-HB-FE-04` (que depende deste
// arquivo existir para o `lazy import` resolver) — este arquivo NÃO mexe em
// router/menu.
//
// Molde estrutural: `FamilyEquipments/CreateOrUpdateFamilyEquipments.tsx`
// (upload multipart inline + guard `onSubmit` com fator extra de imagem) +
// `DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy.tsx` (casca
// `FormContainer`/rodapé simples, `useCustomFormQueryByGuid` inline).
//
// ⚠️ DECISÕES DE CONTRATO (não reabrir aqui):
//
// 1) SEM remoção de imagem (GAP-HB-03) — a coluna `headbands.image` é
//    `NOT NULL`; toda Testeira sempre tem imagem, só pode ser TROCADA.
//    `ImageUpload` é usado SEM a prop `onRemove` — o próprio componente já
//    não renderiza o botão "Remover" quando a prop é omitida (nota
//    "TASK-FE-811" em `ImageUpload.tsx`). Não existe `removeImage`/estado
//    "sem imagem" em lugar nenhum deste arquivo.
//
// 2) `svg` FORA do `accept` (DA-HB-10, hardening) — diferente de
//    `FamilyEquipments` (que aceita svg), a API de Headband recusa (422).
//
// 3) [REMOVIDO 2026-08-05] Campo "Afiliado (único)" (`partner_uuid`, coluna
//    direta) — existiu neste formulário com semântica TRI-ESTADO
//    (`dirtyFields.partner_uuid` como sinal de "o usuário tocou o campo":
//    omitido preserva, `null` explícito zera, uuid grava; em criação a chave
//    era sempre incluída). Removido por decisão do dono (2026-08-05), após
//    homologação no browser: o dono comparou com o legado e questionou o
//    sentido do campo. Verificação confirmou uma PREMISSA ERRADA deste
//    executor — o formulário legado (`agro365/resources/views/headbands/
//    _forms.blade.php`) NUNCA teve campo de Afiliado único; só existe o
//    multiselect da pivot (`Form::select('partners[]', ...)`, item 4 abaixo).
//    O campo único foi construído em cima dessa premissa incorreta (de que o
//    legado gravava `partner_id` pelo formulário). Backend (coluna
//    `partner_id`, aceite de escrita em `HeadbandRequest`/Actions) segue
//    intocado por este arquivo — remoção de aceitação de escrita é lote
//    PARALELO, outro executor/repositório, fora deste escopo. Quem ler
//    depois: a coluna `partner_id` no banco pode continuar existindo por um
//    tempo sem que este formulário a exponha — não é uma omissão acidental.
//
// 4) `partner_uuids` (pivot N:N, vínculo MÚLTIPLO) — TASK-HB-FE-07. Multiselect
//    via `CheckboxListField` (mirror `Atividades/CreateOrUpdateAtividade.tsx`,
//    campo `operations`), alimentado por `useHeadbandPartnersChecklist`
//    (TASK-HB-FE-05, busca SERVER-SIDE, `per_page` no teto real de 100). A
//    chave é SEMPRE enviada no payload (array, mesmo vazio) — sync explícito
//    da pivot. É o ÚNICO vínculo com Afiliado que este formulário expressa
//    desde a remoção do item 3 (e o único que o legado jamais deixou de ter).
//    `partner_id` (coluna legada única) também nunca é enviado — não existe
//    no `HeadbandPayload` (GAP-UX-HB-01).
//
// 5) `useCustomFormQueryByGuid` INLINE neste arquivo (não em
//    `useHeadbands.tsx`) — divergência deliberada do texto literal da ficha
//    `TASK-HB-FE-06` ("## Hooks → Endpoints" pede um `useHeadbandForm()`
//    companheiro em `useHeadbands.tsx`). Seguido o padrão explícito do
//    task-packet de execução ("useCustomFormQueryByGuid inline") + a
//    concorrência real: `TASK-HB-FE-05` está editando `useHeadbands.tsx`
//    SIMULTANEAMENTE (hook de checklist de Afiliados) — tocar o mesmo arquivo
//    aqui criaria risco de colisão de escrita. Reportado ao Arquiteto para
//    reconciliar a ficha.
//
// 6) 422 de NEGÓCIO (limite de 7 Testeiras por `type`,
//    `Headband-contrato.md ## 6.1`) — `BusinessRuleException` não tem
//    `errors` estruturado (só `message` no envelope), então
//    `extractApiFieldErrorMessage` retorna `undefined` para esse caso. Este
//    arquivo usa `useMutation` DIRETO (não `useRequest` — que só sabe
//    prefixar `"{status} — {message cru do backend}"`) para poder trocar esse
//    caso por uma mensagem AMIGÁVEL e LOCALIZADA
//    (`businessRule.limitReached`, já traduzida PT/EN/ES pela `TASK-HB-FE-02`)
//    em vez do texto cru do backend (que não é traduzido). Qualquer outro 422
//    com `errors` estruturado (ex.: imagem obrigatória ausente na criação)
//    continua caindo em `extractApiFieldErrorMessage`, ANTES desse fallback.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import {
  extractApiErrorMessage,
  extractApiFieldErrorMessage,
} from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { headbandTypeOptions } from '@/constants/BaseRegistrations/options/headband-type-options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { headbandSchemaResolver } from '@/validations/schemas/BaseRegistrations/headband-schema';

import {
  createHeadband,
  getHeadbandByUuid,
  updateHeadband,
} from '@/services/v2/BaseRegistrations/headband-service';

import type { Option } from '@/@types/option';
import type {
  HeadbandData,
  HeadbandForm as HeadbandFormType,
  HeadbandPartnerRef,
  HeadbandPayload,
  HeadbandTypeSlug,
} from '@/@types/v2/BaseRegistrations/headband';

import { useHeadbandPartnersChecklist } from './useHeadbandPartnersChecklist';

export default function CreateOrUpdateHeadband() {
  const { headbandId } = useParams<{ headbandId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(headbandId);

  const canSave = isEditing ? can('headbands_edit') : can('headbands_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<HeadbandFormType>({
    mode: 'onChange',
    resolver: headbandSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      link: '',
      position: null,
      type: null,
      // Vínculo N:N (pivot) — TASK-HB-FE-07, ver nota de cabeçalho item 4.
      partner_uuids: [],
    },
  });

  // ---- Estado da imagem (NÃO é campo RHF — mirror exato de
  // `CreateOrUpdateFamilyEquipments.tsx`, sem `removeImage`: não existe fluxo
  // de remoção neste contrato, ver nota de cabeçalho item 1).
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  function handleFileSelected(file: File | null) {
    setImageFile(file);
  }

  // Vínculo N:N (pivot, "Afiliados vinculados") — cache LOCAL dos RÓTULOS dos
  // Afiliados já vinculados (mirror `selectedOperations`/`ActivityOperationRef`
  // de Atividades), para o `CheckboxListField` exibir corretamente mesmo se
  // caírem fora do lote/busca atual do `useHeadbandPartnersChecklist` na
  // edição. Ver nota de cabeçalho item 4.
  const [selectedPartners, setSelectedPartners] = useState<HeadbandPartnerRef[]>([]);
  const [partnersSearch, setPartnersSearch] = useState('');
  const partnersQuery = useHeadbandPartnersChecklist({ search: partnersSearch });

  function fillForm(data: HeadbandData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        link: data.link,
        position: data.position,
        type: data.type,
        // Acompanha o que já está vinculado (pivot) — ver nota de cabeçalho
        // item 4.
        partner_uuids: data.partners.map((partner) => partner.uuid),
      });

      setSelectedPartners(data.partners);
    }

    // Imagem não é campo RHF — só sincroniza o preview "atual" quando o
    // usuário ainda não escolheu localmente um arquivo novo (evita clobar uma
    // seleção em andamento caso o hook refaça o fetch em background).
    if (!imageFile) {
      setCurrentImageUrl(data.image_url);
    }
  }

  // `useCustomFormQueryByGuid` INLINE — ver nota de cabeçalho item 5.
  const headbandQuery = useCustomFormQueryByGuid<HeadbandData>({
    registrationId: isEditing ? headbandId : undefined,
    queryKey: queryKey.baseRegistrations.headband,
    asyncFunction: getHeadbandByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([headbandQuery as any]);

  async function tryPersistHeadband(data: HeadbandFormType) {
    // Payload sempre FULL-RESOURCE para os campos simples (mirror
    // `FamilyEquipment` — o backend não diferencia por verbo além de
    // `required`/`sometimes`).
    const payload: HeadbandPayload = {
      description: data.description.trim(),
      link: data.link.trim(),
      position: data.position!,
      type: data.type!,
    };

    // Imagem — só anexa um arquivo NOVO; sem `image`, o backend preserva a
    // imagem atual no update (nunca remove, GAP-HB-03).
    if (imageFile) {
      payload.image = imageFile;
    }

    // `partner_uuids` — SEMPRE enviado (array, mesmo vazio) — sync explícito
    // da pivot `headband_partner` (ver nota de cabeçalho item 4).
    payload.partner_uuids = data.partner_uuids;

    if (isEditing && headbandId) {
      // Update via POST + `_method=PUT` (method spoofing) — o service já
      // implementa isso.
      return await updateHeadband(headbandId, payload);
    }

    return await createHeadband(payload);
  }

  // `useMutation` DIRETO (não `useRequest`) — ver nota de cabeçalho item 6
  // sobre o tratamento dedicado do 422 de negócio (limite de 7 por `type`).
  const headbandMutation = useMutation({
    mutationFn: tryPersistHeadband,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.headbands] });
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.headband] });

      toaster.success({
        title: languageGB.baseRegistrations.headband.singularLabel,
        description: `${languageGB.baseRegistrations.headband.singularLabel} ${
          isEditing
            ? languageGB.defaltStrings.updateRegister
            : languageGB.defaltStrings.createRegister
        }`,
        duration: 7000,
      });

      navigate(-1);
    },
    onError: (error) => {
      console.error('Headband persist - error:', error);

      // 1ª prioridade — 422/400 com `errors` estruturado por campo (ex.:
      // "A descrição é obrigatória.", "A imagem é obrigatória." na criação).
      const fieldMessage = extractApiFieldErrorMessage(error);

      // 2ª prioridade — 422 de NEGÓCIO sem `errors` estruturado (limite de 7
      // por `type`, `Headband-contrato.md ## 6.1`) → mensagem amigável e
      // LOCALIZADA, não o texto cru do backend (ver nota de cabeçalho item 6).
      const isBusinessRuleError =
        isAxiosError(error) &&
        (error.response?.status === 422 || error.response?.status === 400) &&
        !fieldMessage;

      const errorMessage =
        fieldMessage ??
        (isBusinessRuleError
          ? languageGB.baseRegistrations.headband.form.businessRule.limitReached
          : extractApiErrorMessage(error)) ??
        languageGB.common.errorLog.unknownError;

      toaster.error({
        title: languageGB.baseRegistrations.headband.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isSubmitting = headbandMutation.isPending;

  const hasImageChange = !!imageFile;

  // Guard `onSubmit` — fórmula VERIFICADA como correta (família
  // CentroCusto/Safra/Armazem, `!isEmpty(dirtyFields)`) + fator adicional
  // `!hasImageChange` (a imagem não é campo RHF, então uma troca só de
  // imagem não suja `dirtyFields`) — mirror exato de
  // `FamilyEquipments/CreateOrUpdateFamilyEquipments.tsx`.
  async function onSubmit(data: HeadbandFormType) {
    if (isEditing && !isEmpty(dirtyFields) && !hasImageChange) {
      navigate(-1);
    } else {
      await headbandMutation.mutateAsync(data);
    }
  }

  const typeOptions = headbandTypeOptions.options(languageGB);

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.baseRegistrations.headband.form.title.edit
          : languageGB.baseRegistrations.headband.form.title.create
      }
      subtitle={
        isEditing
          ? languageGB.baseRegistrations.headband.form.subtitle.edit
          : languageGB.baseRegistrations.headband.form.subtitle.create
      }
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
          <Input
            label={languageGB.baseRegistrations.headband.form.fields.description}
            placeholder={languageGB.baseRegistrations.headband.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={languageGB.baseRegistrations.headband.form.fields.link}
            placeholder={languageGB.baseRegistrations.headband.form.placeholders.link}
            {...register('link')}
            error={errors.link?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="position"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={languageGB.baseRegistrations.headband.form.fields.position}
                placeholder={languageGB.baseRegistrations.headband.form.placeholders.position}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={1}
                max={127}
                decimalPlaces={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={languageGB.baseRegistrations.headband.form.fields.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<HeadbandTypeSlug> | null) => onChange(opt?.value ?? null)}
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Vínculo N:N (pivot "headband_partner") — "Afiliados vinculados",
            TASK-HB-FE-07. Fora do `SimpleGrid` de colunas curtas (célula
            própria de largura total, mirror `Atividades/
            CreateOrUpdateAtividade.tsx`, campo `operations`) — o checklist
            precisa de espaço horizontal para rótulo + busca. Único vínculo
            com Afiliado que este formulário expressa (ver nota de cabeçalho
            item 3 sobre a remoção do campo "Afiliado (único)"). */}
        <Box mt={6}>
          <Controller
            name="partner_uuids"
            control={control}
            render={({ field: { value, onChange } }) => {
              const fetchedItems = partnersQuery.data?.data.items ?? [];
              const fetchedUuids = new Set(fetchedItems.map((partner) => partner.uuid));
              // Afiliados já vinculados (edição) que caíram fora do
              // lote/busca atual — mantidos visíveis e marcados, com o
              // rótulo do cache local (nunca "invisíveis mas selecionados").
              const extraSelected = selectedPartners.filter(
                (partner) => value.includes(partner.uuid) && !fetchedUuids.has(partner.uuid)
              );
              const checklistItems: CheckboxListItem<string>[] = [
                ...extraSelected,
                ...fetchedItems.map((partner) => ({
                  uuid: partner.uuid,
                  name: partner.person.name,
                })),
              ].map((partner) => ({ value: partner.uuid, label: partner.name }));

              return (
                <CheckboxListField<string>
                  label={languageGB.baseRegistrations.headband.form.fields.partners}
                  items={checklistItems}
                  selectedValues={value}
                  onChange={(values) => {
                    onChange(values);
                    // Sincroniza o cache de rótulos: soma o que já se
                    // conhecia (`selectedPartners` + lote atual) e mantém só
                    // o que segue selecionado.
                    setSelectedPartners((previous) => {
                      const known = new Map(
                        [
                          ...previous,
                          ...fetchedItems.map((partner) => ({
                            uuid: partner.uuid,
                            name: partner.person.name,
                          })),
                        ].map((partner) => [partner.uuid, partner] as const)
                      );
                      return values
                        .map((uuid) => known.get(uuid))
                        .filter((partner): partner is HeadbandPartnerRef => !!partner);
                    });
                  }}
                  searchValue={partnersSearch}
                  onSearchChange={setPartnersSearch}
                  searchPlaceholder={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.searchPlaceholder
                  }
                  selectAllLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.selectAllLabel
                  }
                  deselectAllLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.deselectAllLabel
                  }
                  selectedCountLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.selectedCountLabel
                  }
                  emptyLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.emptyLabel
                  }
                  errorLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.errorLabel
                  }
                  retryLabel={
                    languageGB.baseRegistrations.headband.form.partnersChecklist.retryLabel
                  }
                  isLoading={partnersQuery.isLoading || isLoading}
                  isError={partnersQuery.isError}
                  onRetry={() => partnersQuery.refetch()}
                  isDisabled={!canSave}
                />
              );
            }}
          />
        </Box>

        <Box mt={6}>
          <ImageUpload
            label={languageGB.baseRegistrations.headband.form.fields.image}
            hint={`${languageGB.baseRegistrations.headband.form.hints.imageAccepted} ${languageGB.baseRegistrations.headband.form.hints.imageMaxSize}`}
            accept="image/jpeg,image/png,image/jpg,image/gif"
            maxSizeMb={2}
            currentImageUrl={currentImageUrl}
            file={imageFile}
            onFileSelected={handleFileSelected}
            disabled={!canSave || isLoading}
            dropzoneTitle={languageGB.baseRegistrations.headband.form.image.dropzoneTitle}
            dropzoneDraggingTitle={
              languageGB.baseRegistrations.headband.form.image.dropzoneDragging
            }
            changeLabel={languageGB.baseRegistrations.headband.form.image.changeLabel}
            errorTypeMessage={languageGB.baseRegistrations.headband.form.image.errorType}
            errorSizeMessage={languageGB.baseRegistrations.headband.form.image.errorSize}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
