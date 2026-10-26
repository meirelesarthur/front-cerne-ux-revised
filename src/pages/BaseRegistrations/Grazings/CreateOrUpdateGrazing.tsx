// src/pages/BaseRegistrations/Grazings/CreateOrUpdateGrazing.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PASTEJO (Grazing) — Cadastros Base /
// Pecuários (TASK-GZ-FE-02 + TASK-GZ-FE-03). Rotas: /cadastros-base/modulo-pastejo/novo
// (criar) e /cadastros-base/modulo-pastejo/:grazingId (editar, GUID),
// registradas em src/router/index.tsx, ANTES do catch-all
// /cadastros-base/*, guardadas por `grazing_create`/`grazing_edit`
// respectivamente (`Grazing-FrontEnd-contrato.md ## 13`).
//
// Campos de negócio, incluindo o mapa de seleção de piquetes
// (`areas[]`, `GrazingMap.tsx`, TASK-GZ-FE-03):
//   description / fodder_uuid / date / code (readonly) / color /
//   control_productivity / Responsável (readonly) / areas (mapa).
//
// Responsável (TASK-PES-PAS-FE, decisão do dono 2026-10-08 — fidelidade ao
// legado `grazing/_forms.blade.php:26-29`): SOMENTE LEITURA com o nome do
// USUÁRIO. Criação = usuário logado (`useAuth().user`, mesmo padrão de
// `BatchGrazings/CreateBatchGrazing.tsx`); edição = `user` do Resource
// (`GrazingResource.user {uuid,name}`, quem cadastrou). NUNCA vai no payload
// (a API grava `user_id` do autenticado e ignora `employee_uuid`). O select
// de funcionário foi REMOVIDO (o legado nunca teve).
// `areas` está registrado no `useForm` (`defaultValues`) e no schema
// (`grazings-schema.ts`, `min:1`), com um `Controller` que agora plug a
// `<GrazingMap />` de verdade (`field.value`/`field.onChange`) — o submit
// completo (todos os 7 campos) sucede de ponta a ponta desde esta Tarefa.
//
// ⚠️ DIVERGÊNCIA FRENTE AO CONTRATO DE TELA/FICHA (registrada aqui e no
// relato de conclusão): ambos previam `<input type="color">` nativo para
// esta rodada, porque a paleta fechada de 14 cores dependia de `TASK-AR-02`
// (então não publicada). Essa dependência foi resolvida nesta sessão —
// `App\Enums\AreaColor` já existe no backend e `GrazingRequest::rules()`
// (`color`) já valida via `Rule::enum(AreaColor::class)` (confirmado por
// leitura direta do backend). Um color picker livre aceitaria qualquer hex
// e o submit falharia com 422 fora da lista — por isso esta Tarefa
// implementa o seletor de paleta fechada (`grazingColorOptions`,
// `## grazing-color-options.ts`) em vez do `<input type="color">` previsto
// originalmente. Não é uma decisão de produto nova — é a paleta que já
// existe no backend, aplicada aqui para não quebrar o submit.
//
// Molde estrutural: `Fodders/CreateOrUpdateFodders.tsx` (hook
// `useCustomFormQueryByGuid` inline, guard `Object.keys(dirtyFields).length
// === 0` explícito, payload sempre completo) + `AccountingGroupers/
// CreateOrUpdateAccountingGroupers.tsx` (Controller + SelectAsyncPaginate
// para os 2 selects de FK, preview de opção via estado local). `use<Modulo>
// Form.tsx` PROIBIDO no padrão `BaseRegistrations` (severidade) — daí NÃO
// existir um `useGrazingForm.tsx` companheiro deste arquivo.
//
// Guard `onSubmit` — forma EXPLÍCITA (checklist item 2), tabela-verdade
// validada: (1) editar COM alteração → salva; (2) editar SEM alteração →
// só navega (`navigate(-1)`, sem chamar a API); (3) criar → sempre salva.
// Duplo submit bloqueado via `disabled={isSubmitting || isLoading}` no
// botão + `grazingMutation.isPending` como `isSubmitting` (useMutation
// nativo, ver nota abaixo).
//
// ⚠️ NÃO usa `useRequest` (diferente de `Fodders`/`AccountingGroupers`) —
// mesma razão já documentada em `Grazings/index.tsx` para o `deleteMutation`:
// o 422 de `errors.areas` (Área já vinculada a outro Pastejo,
// `Grazing-FrontEnd-contrato.md ## 7.1`) precisa virar `setError('areas',
// ...)` PERTO do placeholder do campo, não um toast genérico solto — o
// `onError` do `useRequest` só lê `message`, nunca `errors`. `useMutation`
// direto + `extractApiErrorMessage` (mesmo util que `useRequest` usa por
// baixo) cobre o fallback genérico sem duplicar a lógica de mensagem.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Button as ChakraButton, Flex, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Field, Form, Input, InputReadOnly, Select, SelectAsyncPaginate } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { controlProductivityOptions } from '@/constants/Grazing/options/control-productivity-options';
import { grazingColorOptions } from '@/constants/Grazing/options/grazing-color-options';
import { queryKey } from '@/constants/query-key';

import { grazingSchemaResolver } from '@/validations/schemas/BaseRegistrations/grazings-schema';

import { listFodders } from '@/services/v2/BaseRegistrations/fodders-service';
import {
  createGrazing,
  getGrazingByUuid,
  updateGrazing,
} from '@/services/v2/BaseRegistrations/grazings-service';

import type { Option } from '@/@types/option';
import type { FodderListItem } from '@/@types/v2/BaseRegistrations/fodders';
import type {
  GrazingData,
  GrazingForm as GrazingFormType,
  GrazingPayload,
} from '@/@types/v2/BaseRegistrations/grazings';

import { GrazingMap } from './GrazingMap';

// Default de criação mirror do legado (Doc Bruta §6, `_forms.blade.php:48`)
// — 1ª cor da paleta que representa o verde-claro histórico do `select2`.
const DEFAULT_GRAZING_COLOR = '#01ff70';

export default function CreateOrUpdateGrazing() {
  const { grazingId } = useParams<{ grazingId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const text = languageGB.baseRegistrations.grazing;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(grazingId);
  const canSave = isEditing ? can('grazing_edit') : can('grazing_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    trigger,
    clearErrors,
    formState: { errors, dirtyFields, isValid },
  } = useForm<GrazingFormType>({
    mode: 'onChange',
    resolver: grazingSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      fodder_uuid: '',
      date: '',
      // `control_productivity`: mirror do default físico da coluna
      // (`default(0)`, migration `add_control_productivity_to_grazings`) —
      // o legado não tinha default explícito no form, mas a coluna sempre
      // nasceu `false`; pré-selecionar evita erro de validação imediato ao
      // abrir o form de criação.
      control_productivity: false,
      color: DEFAULT_GRAZING_COLOR,
      // `areas`: registrado aqui (Lei 2 do checklist, item 2) e no schema
      // (`min:1`) — SEM UI própria nesta Tarefa (`## Controller` abaixo).
      areas: [],
    },
  });

  // `isValid` do RHF nasce `true` no mount, ANTES de rodar a 1ª validação
  // (mirror `BudgetPlanningPredictedReport.tsx`) — força o cálculo real
  // logo na montagem para o botão Salvar já nascer com o estado correto.
  useEffect(() => {
    trigger().then(() => clearErrors());
  }, [trigger, clearErrors]);

  // `color` observado — alimenta a recoloração reativa do `GrazingMap`
  // (Áreas selecionadas assumem a cor ATUAL do form, mirror
  // `maps.js:346-352 changeColor()`, `Grazing-FrontEnd-contrato.md ## 6`).
  // `useWatch` (não `watch()` solto) — evita re-render do form inteiro a
  // cada troca de cor, só o que consome `colorValue` recalcula.
  const colorValue = useWatch({ control, name: 'color' }) || DEFAULT_GRAZING_COLOR;

  // ---- Preview do select assíncrono (FK) ------------------------------
  // `Controller`/RHF só guarda o `uuid` (string) do valor selecionado — o
  // `SelectAsyncPaginate` precisa do par `{label, value}` completo para
  // exibir a opção escolhida. Mesmo racional de `parentOption` em
  // `AccountingGroupers/CreateOrUpdateAccountingGroupers.tsx`.
  const [fodderOption, setFodderOption] = useState<Option<string> | null>(null);

  // Guard EXPLÍCITA (checklist item 2, forma reforçada pelo dono) —
  // `Object.keys(dirtyFields).length === 0`, NUNCA `isEmpty` bare.
  function fillForm(data: GrazingData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        fodder_uuid: data.fodder?.uuid ?? '',
        date: data.date,
        color: data.color,
        control_productivity: !!data.control_productivity,
        // `areas[]` vem do detalhe (`GrazingData.areas`, já criado por
        // TASK-GZ-FE-01) — só os `uuid`; `GrazingMap.tsx` (TASK-GZ-FE-03)
        // usa este array para pré-selecionar as Áreas já vinculadas.
        areas: (data.areas ?? []).map((area) => area.uuid),
      });
      // `reset()` não recalcula `isValid` com resolver assíncrono do RHF —
      // sem isto o botão Salvar poderia ficar travado em modo edição
      // (mirror `BudgetPlanningPredictedReport.tsx`). Defensivo e barato.
      // `clearErrors()` encadeado — `trigger()` sozinho reexibe "X é
      // obrigatório" nos campos vazios de um form intocado (mesmo defeito
      // resolvido em Venda de Animais, UT-000680).
      trigger().then(() => clearErrors());

      if (data.fodder) {
        setFodderOption({ label: data.fodder.description, value: data.fodder.uuid });
      }
    }
  }

  const grazingQuery = useCustomFormQueryByGuid<GrazingData>({
    registrationId: isEditing ? grazingId : undefined,
    queryKey: queryKey.baseRegistrations.grazing,
    asyncFunction: getGrazingByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([grazingQuery as any]);
  const grazingData = (grazingQuery as any)?.data as GrazingData | undefined;

  async function tryPersistGrazing(data: GrazingFormType) {
    // Payload SEMPRE completo (checklist item 3 — `GrazingRequest::rules()`
    // não diferencia por verbo) — mirror exato de
    // `Grazing-FrontEnd-contrato.md ## 5`. `code` NUNCA entra (server-gerado,
    // readonly); `employee_uuid` NUNCA mais é enviado (Responsável é o usuário).
    const payload: GrazingPayload = {
      description: data.description.trim(),
      fodder_uuid: data.fodder_uuid,
      date: data.date,
      color: data.color,
      control_productivity: !!data.control_productivity, // NUNCA `|| false` (item 19)
      areas: data.areas, // uuid[] selecionados no `GrazingMap` (`min:1` garantido pelo Yup antes do submit)
    };

    if (isEditing && grazingId) {
      return await updateGrazing(grazingId, payload);
    }
    return await createGrazing(payload);
  }

  // `useMutation` DIRETO (não `useRequest`) — ver nota de cabeçalho do
  // arquivo: `errors.areas` (422, `Grazing-FrontEnd-contrato.md ## 7.1`)
  // precisa de `setError` dedicado perto do placeholder do campo, não um
  // toast genérico.
  const grazingMutation = useMutation({
    mutationFn: tryPersistGrazing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.grazings] });
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.grazing] });

      toaster.success({
        title: text.singularLabel,
        description: `${text.singularLabel} ${
          isEditing
            ? languageGB.defaltStrings.updateRegister
            : languageGB.defaltStrings.createRegister
        }`,
        duration: 7000,
      });

      navigate(-1);
    },
    onError: (error) => {
      console.error('Grazing persist - error:', error);

      // 422 dedicado — Área já vinculada a outro Pastejo (`## 7.1`). O
      // `GrazingMap` já bloqueia isso PREVENTIVAMENTE via `valid-insert` no
      // clique, mas essa é só UX preventiva — a garantia real é a
      // constraint física + revalidação server-side; uma corrida entre a
      // validação client e outra requisição concorrente ainda pode chegar
      // aqui. Exibido PERTO do campo `areas` (via `setError`), não escondido
      // atrás de um toast solto.
      if (isAxiosError(error) && error.response?.status === 422) {
        const resData = error.response.data as { errors?: Record<string, string[]> };
        const areasError = resData?.errors?.areas;
        if (areasError && areasError.length > 0) {
          setError('areas', { type: 'server', message: areasError[0] });
          return;
        }
      }

      // Fallback genérico — mesmo util que `useRequest` usa por baixo
      // (`extractApiErrorMessage`, prioriza mensagem específica por campo).
      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isSubmitting = grazingMutation.isPending;

  // Guard de `onSubmit` — tabela-verdade validada (checklist item 2):
  // (1) editar COM alteração → salva; (2) editar SEM alteração → só
  // navega; (3) criar → sempre salva. Mirror exato de
  // `Fodders/CreateOrUpdateFodders.tsx`/`AccountingGroupers/
  // CreateOrUpdateAccountingGroupers.tsx`.
  async function onSubmit(data: GrazingFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
      return;
    }
    await grazingMutation.mutateAsync(data); // create sempre salva; edição com alteração real salva
  }

  // Submit inválido silencioso (mirror `FinishProcessing.tsx` `onInvalid`) —
  // sem isto, clicar em Salvar com campos obrigatórios vazios/incorretos não
  // dava nenhum feedback visível além do erro sob o campo.
  function onInvalid() {
    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: text.form.invalidFieldsToast,
      duration: 6000,
    });
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            // Submit EXTERNO (mecanismo "Código Ouro" de
            // `get_pwa_form_query_pattern`) — botão no footer fixo,
            // associado ao `<Form id="grazing-form">` abaixo via atributo
            // HTML `form=`, sem precisar de `onClick={handleSubmit(...)}`
            // direto. Duplo submit bloqueado por `disabled` enquanto
            // `isSubmitting`/`isLoading`.
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="submit"
              form="grazing-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading || !isValid}
            />
          )}
        </>
      }
    >
      <Form id="grazing-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* `code` — readonly, SÓ em modo edição (server-gerado, nunca no
            payload). Mirror da instrução da Tarefa: ausente/placeholder em
            criação, não um bloco "Código gerado" sempre visível como em
            AccountingGroupers. */}
        {isEditing && grazingData?.code && (
          <Box mb={6}>
            <Input
              label={text.form.fields.code}
              value={grazingData.code}
              readOnly
              disabled
              helperText={text.form.hints.codeGenerated}
              loading={isLoading}
            />
          </Box>
        )}

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
            name="fodder_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.fodder}
                placeholder={text.form.placeholders.fodder}
                // `GET /fodders` NÃO filtra por texto no servidor (DA-FD-11)
                // — por isso NENHUM `findParams` é passado aqui: fingir uma
                // busca que o backend ignora silenciosamente seria pior que
                // não ter busca (checklist item 17). O select ainda pagina
                // normalmente (`listFodders` já lê `meta` real).
                service={listFodders}
                mapOptions={(item: FodderListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                // item 16 — `?? null`, NUNCA `?? undefined`.
                value={fodderOption ?? null}
                onChange={(option: any) => {
                  field.onChange(option?.value ?? '');
                  setFodderOption(option ?? null);
                }}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                // item 12 — portal + posição fixa (form com muitos campos).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.date}
                error={error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="control_productivity"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.controlProductivity}
                name={name}
                value={
                  controlProductivityOptions.options(languageGB).find((o) => o.value === value) ??
                  null
                }
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={controlProductivityOptions.options(languageGB)}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          {/* Responsável — SOMENTE LEITURA (legado `_forms.blade.php:26-29`):
              criação = usuário logado; edição/detalhe = `user.name` do Resource. */}
          <InputReadOnly
            label={text.form.fields.responsible}
            value={(isEditing ? grazingData?.user?.name : user?.username) || '—'}
            loading={isLoading}
          />
        </SimpleGrid>

        {/* `color` — paleta FECHADA de 14 (ver nota de cabeçalho do
            arquivo/`grazing-color-options.ts`) — NÃO um `<input
            type="color">` livre. Swatches via `ChakraButton` nativo (NÃO
            `Box as="button"` — a tipagem polimórfica de `Box` não resolve
            `type="button"` corretamente nesta versão do Chakra, mesmo
            precedente documentado em `WeeksCanvas.tsx`; aqui é ainda mais
            crítico, o grid fica DENTRO do `<Form onSubmit>` — um botão sem
            `type="button"` explícito submeteria o form ao clicar numa cor).
            Acessível via teclado nativamente (Tab/Enter/Espaço), `aria-pressed`
            comunica a seleção a leitores de tela. */}
        <Box mt={6}>
          <Controller
            name="color"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Field label={text.form.fields.color} errorText={error?.message} isRequired>
                <Flex wrap="wrap" gap={2} mt={1}>
                  {grazingColorOptions.options(languageGB).map((option) => {
                    const isSelected = field.value === option.value;
                    return (
                      <ChakraButton
                        key={option.value}
                        type="button"
                        variant="plain"
                        aria-label={option.label}
                        aria-pressed={isSelected}
                        title={option.label}
                        onClick={() => canSave && field.onChange(option.value)}
                        disabled={!canSave}
                        boxSize="28px"
                        minW="unset"
                        p={0}
                        borderRadius="md"
                        bg={option.value}
                        border="2px solid"
                        borderColor={isSelected ? 'primaryMain' : 'border.subtle'}
                        boxShadow={
                          isSelected ? '0 0 0 2px var(--chakra-colors-primary-500)' : undefined
                        }
                        cursor={canSave ? 'pointer' : 'not-allowed'}
                        opacity={canSave ? 1 : 0.6}
                        transition="all 0.15s"
                        _hover={
                          canSave ? { borderColor: 'primaryMain', bg: option.value } : undefined
                        }
                      />
                    );
                  })}
                </Flex>
              </Field>
            )}
          />
        </Box>

        {/* `areas` — mapa de seleção de piquetes (`GrazingMap.tsx`,
            TASK-GZ-FE-03). `Controller` já existia (ponto de integração
            deixado pela TASK-GZ-FE-02) — só o `render` foi trocado: em vez
            do placeholder visual, consome `field.value`/`field.onChange`
            de verdade (`uuid[]` selecionados / toggle de seleção). Nenhum
            guard de submit foi alterado — `areas` já entrava no payload
            (`tryPersistGrazing`) e no schema (`min:1`) desde a FE-02. */}
        <Box mt={6}>
          <Controller
            name="areas"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Field label={text.form.fields.areas} errorText={error?.message} isRequired>
                <GrazingMap
                  value={field.value}
                  onChange={field.onChange}
                  color={colorValue}
                  grazingUuid={isEditing ? grazingId : undefined}
                  isDisabled={!canSave}
                />
              </Field>
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
