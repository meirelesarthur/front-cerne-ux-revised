// src/pages/CadastrosBase/Contador/CreateOrUpdateContador.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CONTADOR (Escritório de Contabilidade) —
// Cadastros Base, domínio Fiscal/Contábil (TASK-CT-03b). Rotas:
//   /cadastros-base/contador/novo          (criar, guardada por `ctdr_create`)
//   /cadastros-base/contador/:contadorId   (editar, GUID, guardada por `ctdr_edit`)
// registradas em src/router/index.tsx, ANTES do catch-all `/cadastros-base/*`
// (a rota-base `/cadastros-base/contador` é da Tarefa irmã TASK-CT-03a).
//
// Guard `onSubmit`/`fillForm` EXPLÍCITO (`Object.keys(dirtyFields).length ===
// 0`) — NUNCA `!isEmpty(dirtyFields)` (utilitário mal-nomeado, landmine
// documentada `ERRO-FE-001`; decisão desta Tarefa de escrever a checagem por
// extenso em vez de reaproveitar o utilitário ambíguo).
//
// Payload SEMPRE COMPLETO (12 campos) em create E update — `ContadorRequest`
// usa as MESMAS `rules()` nos dois verbos, sem `sometimes` (diferente de
// `PlanAccount`, que tem 1 campo `sometimes`).
//
// Cidade (`cidade_uuid`): `SelectAsyncPaginate` portalizado, molde byte-a-byte
// de `PlanAccount.parent_uuid` (`CreateOrUpdatePlanAccount.tsx`, linhas
// ~511-546) — guarda o `Option<string>` INTEIRO no RHF (não um campo
// `_label` companion separado — o padrão real já materializado no
// `frontend_root`).
//
// Emissores Fiscais (`issue_uuids`): `CheckboxListField`, molde de
// `operations` em `Atividades/CreateOrUpdateAtividade.tsx` — busca
// CLIENT-SIDE sobre a lista completa de `GET /contadores/issues-elegiveis`
// (o endpoint não pagina/não aceita `search`, ver `useIssuesEligibleChecklist`
// em `useContadores.tsx`), `min:1` obrigatório (Regra de Negócio nº 5).
//
// `auto_send`: `Switch` boolean simples — o legado invertia o rótulo
// (`0=Sim/1=Não`, `agro365/.../contador/_forms.blade.php:63`); o contrato
// (DA-CT-10) já rejeitou replicar essa inversão. `true` = valor físico `1`
// (default da coluna).
//
// Máscaras `cnpj`/`fone`/`cep` — migradas na 97-Esteiras/001 (Wave 0 do
// canário de consolidação de máscara) para `MaskedInput` (kinds `cnpj`,
// `phone`, `cep`), consumindo `src/utils/masks/document.ts`. Substitui a
// combinação anterior (`Input` + `formatDocument`/`formatPhone` manuais para
// `cnpj`/`fone`, `InputMask` + `react-input-mask` para `cep`) — mesmo
// comportamento de digitação/round-trip preservado (byte-a-byte, ver
// `CORE_WORKSPACE/97-Esteiras/001/CONTRATOS/01-MaskedInput-Contrato.md`),
// zero mudança de payload/schema. `languageGB.defaltStrings.masks.cep`
// deixou de ser consumido por esta tela (o algoritmo progressivo de
// `formatCepProgressive` substitui a máscara estática de posição fixa da
// lib removida).
// -----------------------------------------------------------------------------

import { type FocusEvent, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import cleanMask from '@/utils/clean-mask';
import { isValidGuid } from '@/utils/guid';
import { docTypeOfDigits } from '@/utils/masks/document';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
import { createContador, updateContador } from '@/services/v2/Contadores/contador-service';
import { getAddressByCep } from '@/services/viacep';

import type { CityListItem } from '@/@types/v2/Cities';
import type {
  ContadorDetail,
  ContadorForm as ContadorFormType,
  ContadorPayload,
  IssueEligibleRef,
} from '@/@types/v2/Contadores';

import { contadorSchemaResolver } from './contador-schema';
import { useContadorForm, useIssuesEligibleChecklist } from './useContadores';

export default function CreateOrUpdateContador() {
  const { contadorId } = useParams<{ contadorId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(contadorId);

  const text = languageGB.contadores.contador;

  const canSave = isEditing ? can('ctdr_edit') : can('ctdr_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    trigger,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ContadorFormType>({
    mode: 'onChange',
    resolver: contadorSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      ie: '',
      rua: '',
      numero: '',
      bairro: '',
      cep: '',
      fone: '',
      email: '',
      cidade_uuid: null,
      issue_uuids: [],
      // Valor físico DEFAULT da coluna é `1` (true) — Achado 2 da Tarefa,
      // NÃO replicar a inversão de rótulo do legado (`0=Sim/1=Não`).
      auto_send: true,
    },
  });

  // Cache LOCAL de rótulos dos Emissores Fiscais já vinculados — garante que
  // o `CheckboxListField` exiba o NOME certo de um item selecionado mesmo que
  // ele caia fora da lista atual (não deveria acontecer aqui, já que a lista
  // é completa e sem paginação, mas mantém o mesmo cuidado de
  // `selectedOperations` em `Atividade` por segurança/consistência).
  const [selectedIssues, setSelectedIssues] = useState<IssueEligibleRef[]>([]);

  // Busca CLIENT-SIDE sobre a lista completa de elegíveis (o endpoint não
  // pagina/não aceita `search` — ver `useIssuesEligibleChecklist`).
  const [issuesSearch, setIssuesSearch] = useState('');
  const issuesQuery = useIssuesEligibleChecklist();

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`) — NUNCA
  // `!isEmpty(dirtyFields)` (landmine `ERRO-FE-001`, ver cabeçalho do
  // arquivo). `data.city`/`data.issues` convertidos para os shapes do RHF.
  function fillForm(data: ContadorDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        ie: data.ie ?? '',
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cep: data.cep,
        fone: data.fone,
        email: data.email,
        cidade_uuid: data.city ? { label: data.city.title, value: data.city.uuid } : null,
        issue_uuids: (data.issues ?? []).map((issue) => issue.uuid),
        auto_send: !!data.auto_send,
      });
      setSelectedIssues(data.issues ?? []);
    }
  }

  const contadorQuery = useContadorForm({
    registrationId: isEditing ? contadorId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([contadorQuery as any]);

  const contadorMutation = useRequest({
    asyncFunction: tryPersistContador,
    entityName: text.singularLabel,
    queryKey: queryKey.contadores.list,
    queryKey2: queryKey.contadores.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistContador(data: ContadorFormType) {
    // Payload SEMPRE COMPLETO (12 campos) — `ContadorRequest` não tem
    // `sometimes` em nenhuma regra, nem no update (Contador-contrato §4).
    // SEM `tenant_id`/`farm_id` — sempre resolvidos no servidor.
    const payload: ContadorPayload = {
      razao_social: data.razao_social.trim(),
      nome_fantasia: data.nome_fantasia.trim(),
      cnpj: data.cnpj,
      ie: (data.ie ?? '').trim(),
      rua: data.rua.trim(),
      numero: data.numero.trim(),
      bairro: data.bairro.trim(),
      fone: data.fone,
      cep: data.cep,
      email: data.email.trim(),
      cidade_uuid: data.cidade_uuid?.value ?? '',
      issue_uuids: data.issue_uuids,
      auto_send: !!data.auto_send,
    };

    if (isEditing && contadorId) {
      return await updateContador(contadorId, payload);
    }

    return await createContador(payload);
  }

  async function onSubmit(data: ContadorFormType) {
    // Guard EXPLÍCITO — nada mudou numa edição: só navega, sem PUT vazio.
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await contadorMutation.mutateAsync(data);
  }

  const isSubmitting = contadorMutation.isPending;

  // Submit inválido NUNCA pode ser silencioso: mostra toast (1º erro ou
  // mensagem genérica) e leva o foco/scroll ao 1º campo com erro. Campos sem
  // input nativo (`cidade_uuid`, `issue_uuids`) rolam até a legenda/seção.
  function onInvalid(formErrors: FieldErrors<ContadorFormType>) {
    const names = Object.keys(formErrors) as (keyof ContadorFormType)[];
    if (names.length === 0) return;

    const firstMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message: string } =>
        !!fieldError && typeof (fieldError as { message?: unknown }).message === 'string'
    )?.message;

    toaster.create({
      type: 'error',
      title: text.form.validation.invalidFields,
      description: firstMessage,
      duration: 6000,
    });

    try {
      setFocus(names[0]);
    } catch {
      // campo sem ref focável (Controller de Select/Checklist): ignora
    }
    document
      .querySelector<HTMLElement>(`[name="${String(names[0])}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // Autofill de CEP (TASK-CT-FIX-03) — dispara no `onBlur` do campo `cep`,
  // só quando o valor limpo tem exatamente 8 dígitos (não a cada tecla, não
  // com CEP incompleto). Consulta ViaCEP (`rua`/`bairro`) e resolve a Cidade
  // via `GET /cities?iso={ibge}`. Nenhuma falha (CEP não encontrado, cidade
  // não resolvida, rede fora do ar) trava o formulário — só toast + campos
  // ficam disponíveis para preenchimento/seleção manual.
  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = cleanMask(event.target.value ?? '');
    if (digits.length !== 8) return;

    try {
      const address = await getAddressByCep(digits);

      if (!address) {
        toaster.create({
          type: 'warning',
          title: text.form.cepAutofill.notFound.title,
          description: text.form.cepAutofill.notFound.description,
        });
        return;
      }

      setValue('rua', address.logradouro, { shouldDirty: true, shouldValidate: true });
      setValue('bairro', address.bairro, { shouldDirty: true, shouldValidate: true });

      const city = await getCityByIso(Number(address.ibge));

      if (city) {
        setValue(
          'cidade_uuid',
          { label: city.title, value: city.uuid },
          { shouldDirty: true, shouldValidate: true }
        );
      } else {
        toaster.create({
          type: 'warning',
          title: text.form.cepAutofill.cityNotResolved.title,
          description: text.form.cepAutofill.cityNotResolved.description,
        });
      }
    } catch {
      // Rede fora do ar (ViaCEP OU /cities) — nunca propaga exceção não
      // tratada para a árvore React; o autofill é um atalho, nunca pode
      // impedir o preenchimento manual do formulário.
      toaster.create({
        type: 'error',
        title: text.form.cepAutofill.networkError.title,
        description: text.form.cepAutofill.networkError.description,
      });
    }
  }

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
              onClick={handleSubmit(onSubmit, onInvalid)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={text.form.fields.cnpj}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(event);
                  // IE depende do documento (CPF dispensa): revalida cross-field.
                  void trigger('ie');
                }}
                onBlur={field.onBlur}
                error={errors.cnpj?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.razaoSocial}
            placeholder={text.form.placeholders.razaoSocial}
            {...register('razao_social')}
            error={errors.razao_social?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.nomeFantasia}
            placeholder={text.form.placeholders.nomeFantasia}
            {...register('nome_fantasia')}
            error={errors.nome_fantasia?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.ie}
            placeholder={text.form.placeholders.ie}
            {...register('ie')}
            error={errors.ie?.message}
            isRequired={docTypeOfDigits(watch('cnpj') ?? '') !== 'cpf'}
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Input
            label={text.form.fields.email}
            type="email"
            placeholder={text.form.placeholders.email}
            {...register('email')}
            error={errors.email?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="fone"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="phone"
                label={text.form.fields.fone}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.fone?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="cep"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="cep"
                label={text.form.fields.cep}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={(event: FocusEvent<HTMLInputElement>) => {
                  field.onBlur();
                  handleCepBlur(event);
                }}
                error={errors.cep?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.rua}
            placeholder={text.form.placeholders.rua}
            {...register('rua')}
            error={errors.rua?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Input
            label={text.form.fields.numero}
            placeholder={text.form.placeholders.numero}
            {...register('numero')}
            error={errors.numero?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.bairro}
            placeholder={text.form.placeholders.bairro}
            {...register('bairro')}
            error={errors.bairro?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
            <Controller
              name="cidade_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.cidadeUuid}
                  placeholder={text.form.placeholders.cidadeUuid}
                  service={listCityOptions}
                  mapOptions={(city: CityListItem) => ({
                    label: city.title,
                    value: city.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Box>
        </SimpleGrid>

        {/* Envio automático do XML — Switch boolean simples, SEM inverter
            rótulo (Achado 2, DA-CT-10 — o legado invertia 0=Sim/1=Não). */}
        <Box mt={6}>
          <Controller
            name="auto_send"
            control={control}
            render={({ field }) => (
              <Box
                bg="bg.muted"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
                px={4}
                py={3}
                display="inline-flex"
                alignItems="center"
                gap={3}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.autoSend}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.autoSend}
                />
              </Box>
            )}
          />
        </Box>

        {/* Emissores Fiscais (`issue_uuids`) — CheckboxListField, molde de
            `operations` em Atividade, busca CLIENT-SIDE sobre a lista
            completa de elegíveis (endpoint sem paginação/sem `search`). */}
        <Box mt={6}>
          <Controller
            name="issue_uuids"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => {
              const allIssues = issuesQuery.data ?? [];

              const term = issuesSearch.trim().toLowerCase();
              const filteredIssues = term
                ? allIssues.filter(
                    (issue) =>
                      issue.razao_social.toLowerCase().includes(term) ||
                      issue.cpf_cnpj.toLowerCase().includes(term)
                  )
                : allIssues;

              const fetchedUuids = new Set(allIssues.map((issue) => issue.uuid));
              // Emissores já vinculados (edição) que, por algum motivo, não
              // estejam na lista de elegíveis atual — mantidos visíveis e
              // marcados, com o rótulo do cache local (nunca "invisíveis mas
              // selecionados"), mesmo cuidado de `Atividade`.
              const extraSelected = selectedIssues.filter(
                (issue) => value.includes(issue.uuid) && !fetchedUuids.has(issue.uuid)
              );

              const checklistItems: CheckboxListItem<string>[] = [
                ...extraSelected,
                ...filteredIssues,
              ].map((issue) => ({
                value: issue.uuid,
                label: `${issue.razao_social} — ${issue.cpf_cnpj}`,
              }));

              return (
                <>
                  <CheckboxListField<string>
                    label={text.form.fields.issueUuids}
                    items={checklistItems}
                    selectedValues={value}
                    onChange={(values) => {
                      onChange(values);
                      setSelectedIssues((previous) => {
                        const known = new Map(
                          [...previous, ...allIssues].map((issue) => [issue.uuid, issue] as const)
                        );
                        return values
                          .map((uuid) => known.get(uuid))
                          .filter((issue): issue is IssueEligibleRef => !!issue);
                      });
                    }}
                    searchValue={issuesSearch}
                    onSearchChange={setIssuesSearch}
                    searchPlaceholder={text.form.issuesField.searchPlaceholder}
                    selectAllLabel={text.form.issuesField.selectAllLabel}
                    deselectAllLabel={text.form.issuesField.deselectAllLabel}
                    selectedCountLabel={text.form.issuesField.selectedCountLabel}
                    emptyLabel={text.form.issuesField.emptyLabel}
                    errorLabel={text.form.issuesField.errorLabel}
                    retryLabel={text.form.issuesField.retryLabel}
                    isLoading={issuesQuery.isLoading || isLoading}
                    isError={issuesQuery.isError}
                    onRetry={() => issuesQuery.refetch()}
                    isDisabled={!canSave}
                  />
                  {error?.message && (
                    <Text mt={1} fontSize="sm" color="fg.error">
                      {error.message}
                    </Text>
                  )}
                </>
              );
            }}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
