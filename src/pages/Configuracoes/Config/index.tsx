// src/pages/Configuracoes/Config/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de Configuração (settings singleton de plataforma) — execução
// 032, TASK-FE-2601. SEM create/edit por rota (não existe "novo" nem
// `:uuid`) — 1 formulário sempre visível que carrega o registro singleton
// (`GET /config`) e salva (`PUT /config`) no mesmo lugar (contrato de tela
// `contrato-front-configuracao.md` §3/§4).
//
// Passo UX (UX-GAP #1, contrato §2): nenhuma tela de "settings singleton de
// plataforma" no design system `cerne` — composição adaptada de
// `PerfilUsuario.tsx`/Regra C (`FormContainer` + `CollapsibleSection` para
// "single-page denso com muitos campos"), mirror mecânico da casca real já
// em produção em `TenantParameters/index.tsx` (mesmo padrão de settings-form
// singular: `useCustomFormQuery` SEM ID de contexto + `useRequest`
// `typesRequest: 'update'` sempre).
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — nome INVERTIDO (retorna
// `true` quando HÁ chaves). Guard usado aqui é o padrão CORRIGIDO
// (`!isEmpty(dirtyFields)`), mesmo de `TenantParameters/index.tsx`/
// `CreateOrUpdateEstoqueInicial.tsx` — NÃO o snippet literal do contrato de
// tela §4.1 (que omite o `!`, provável cópia sem o `!` do próprio protótipo
// de fluxo — o guard sem `!` sobrescreveria edições do usuário em
// andamento).
//
// Segredos Mercado Pago (UX-GAP #2, contrato §4.2) — write-only de verdade:
// `ConfigData` (GET) NUNCA tem o valor bruto, só os 2 booleanos
// `*_configurado`. Os 2 campos do form SEMPRE nascem `''`, independente do
// valor real existir no backend; `placeholder` dinâmico comunica o estado.
// Ao salvar, o campo só entra no payload se `dirtyFields` sinalizar que o
// USUÁRIO digitou algo nesta sessão (nunca os outros 13 campos, sempre
// enviados completos — o backend `ConfigRequest::rules()` exige todos em
// toda PUT).
//
// Selects "Afiliado padrão"/"Plano padrão" (contrato §7.4, achado técnico
// aceito): `GET /partners`/`GET /plan-roles` são endpoints GATEADOS
// (`partners_view`/`plan_view`) — usuário com `config_edit` mas sem essas 2
// permissões vê o mesmo toast "Sem permissão" já tratado genericamente pelo
// `SelectAsyncPaginate` (não é bug desta Tarefa).
//
// Label dos selects "Afiliado padrão"/"Plano padrão" (UT-101): `ConfigResource`
// expõe `afiliado_padrao_nome`/`plano_padrao_nome` além dos uuids; o Option
// inicial hidrata com `{ label: nome ?? uuid, value: uuid }` (uuid só como
// fallback quando o nome vier null) — ver `lookupOption.ts`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputMask } from '@/components/Form/InputMask';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { QueryErrorState } from '@/components/QueryErrorState';
import { PasswordInput } from '@/components/ui/password-input';

import { useCustomFormQuery } from '@/hooks/useCustomFormQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';
import { formatCnpj } from '@/utils/masks/document';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { configSchemaResolver } from '@/validations/schemas/Configuracoes/config-schema';

import { listPartners } from '@/services/v2/Afiliados/partner-service';
import { getConfig, updateConfig } from '@/services/v2/Configuracoes/Config/config-service';
import { listPlanRoles } from '@/services/v2/Planos/planRole-service';

import type { Option } from '@/@types/option';
import type { PartnerListItem } from '@/@types/v2/Afiliados';
import type {
  ConfigData,
  ConfigForm as ConfigFormType,
  ConfigPayload,
} from '@/@types/v2/Configuracoes/config';
import type { PlanRoleListItem } from '@/@types/v2/Planos';

import { partnerLabel, planRoleLabel, toLookupOption } from './lookupOption';
import { VideoIntroUploadSection } from './VideoIntroUploadSection';

import type { UseQueryResult } from '@tanstack/react-query';

export default function Config() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.configuracoes.config;

  const canEdit = can('config_edit');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ConfigFormType>({
    mode: 'onChange',
    resolver: configSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      contrato_certificado: null,
      mercadopago_access_token: '',
      mercadopago_public_key: '',
      afiliado_padrao_uuid: null,
      plano_padrao_uuid: null,
      resp_cnpj: '',
      resp_nome: '',
      resp_email: '',
      resp_fone: '',
    },
  });

  // Lei 2 (⚠️ ver LANDMINE no cabeçalho do arquivo) — `!isEmpty(dirtyFields)`
  // é o guard CORRETO: só sobrescreve o form com o dado do servidor quando
  // NENHUMA edição do usuário está em andamento.
  function fillConfigForm(data: ConfigData) {
    if (!isEmpty(dirtyFields)) {
      reset({
        dias_teste: data.dias_teste,
        dias_alerta_pagamento: data.dias_alerta_pagamento,
        dias_assinar_contrato: data.dias_assinar_contrato,
        contrato_certificado: data.contrato_certificado
          ? { label: text.booleanOptions.yes, value: true }
          : { label: text.booleanOptions.no, value: false },
        minutos_online: data.minutos_online,
        dias_alerta_vencimento_certificado: data.dias_alerta_vencimento_certificado,
        // Segredos Mercado Pago — NUNCA populados a partir do GET (write-only,
        // §4.2). O booleano `*_configurado` só controla o `placeholder`
        // (ver `secretPlaceholder` abaixo), nunca o valor do campo.
        mercadopago_access_token: '',
        mercadopago_public_key: '',
        afiliado_padrao_uuid: toLookupOption(
          data.afiliado_padrao_uuid,
          data.afiliado_padrao_nome
            ? partnerLabel(data.afiliado_padrao_apelido, data.afiliado_padrao_nome)
            : null
        ),
        plano_padrao_uuid: toLookupOption(
          data.plano_padrao_uuid,
          data.plano_padrao_nome
            ? planRoleLabel(data.plano_padrao_nome, data.plano_padrao_preco)
            : null
        ),
        whatsapp_link_suporte: data.whatsapp_link_suporte,
        resp_cnpj: data.resp_cnpj ? formatCnpj(data.resp_cnpj) : '',
        resp_nome: data.resp_nome ?? '',
        resp_email: data.resp_email ?? '',
        resp_fone: data.resp_fone ?? '',
      });
    }
  }

  // `useCustomFormQuery` anota o retorno como `Response<TData>` (conveniência
  // de uso mais comum), mas o objeto real em runtime É o `UseQueryResult` do
  // TanStack Query — cast explícito para acessar `isError`/`isPending`/
  // `refetch`/`data` com segurança de tipo (mirror do `as any` já usado por
  // `checkLoadingStatus([query as any])` em `TenantParameters/index.tsx`,
  // só que tipado em vez de `any` solto).
  const configQuery = useCustomFormQuery<ConfigData>({
    asyncFunction: getConfig,
    queryKey: queryKey.configuracoes.config,
    fillForm: fillConfigForm,
    enabled: can('config_view'),
  }) as unknown as UseQueryResult<ConfigData>;
  const isLoading = checkLoadingStatus([configQuery]);

  const configMutation = useRequest({
    asyncFunction: tryPersistConfig,
    entityName: text.singularLabel,
    queryKey: queryKey.configuracoes.config,
    typesRequest: 'update',
    personalizedMessage: text.saveSuccessToast,
    actionSuccess: () => {},
  });

  async function tryPersistConfig(data: ConfigFormType) {
    const payload: ConfigPayload = {
      dias_teste: data.dias_teste,
      dias_alerta_pagamento: data.dias_alerta_pagamento,
      dias_assinar_contrato: data.dias_assinar_contrato,
      contrato_certificado: !!data.contrato_certificado?.value,
      minutos_online: data.minutos_online,
      dias_alerta_vencimento_certificado: data.dias_alerta_vencimento_certificado,
      afiliado_padrao_uuid: data.afiliado_padrao_uuid?.value ?? null,
      plano_padrao_uuid: data.plano_padrao_uuid?.value ?? null,
      whatsapp_link_suporte: data.whatsapp_link_suporte,
      resp_cnpj: data.resp_cnpj || null,
      resp_nome: data.resp_nome || null,
      resp_email: data.resp_email || null,
      resp_fone: data.resp_fone || null,
    };

    // Segredos Mercado Pago — SÓ entram no payload se o USUÁRIO digitou algo
    // nesta sessão (`dirtyFields`), nunca os outros 13 campos acima (sempre
    // completos). Omitir preserva o valor atual no backend (write-only, §4.2).
    if (dirtyFields.mercadopago_access_token && data.mercadopago_access_token) {
      payload.mercadopago_access_token = data.mercadopago_access_token;
    }
    if (dirtyFields.mercadopago_public_key && data.mercadopago_public_key) {
      payload.mercadopago_public_key = data.mercadopago_public_key;
    }

    return await updateConfig(payload);
  }

  async function onSubmit(data: ConfigFormType) {
    if (!isEmpty(dirtyFields)) return; // nada mudou — evita PUT vazio
    await configMutation.mutateAsync(data);
  }

  const booleanOptions: Option<boolean>[] = [
    { value: true, label: text.booleanOptions.yes },
    { value: false, label: text.booleanOptions.no },
  ];

  // Placeholder dinâmico dos segredos MP (§4.2) — comunica estado sem expor
  // valor. Resolvido do ÚLTIMO `configQuery.data` conhecido (nunca do form).
  const accessTokenPlaceholder = configQuery.data?.mercadopago_access_token_configurado
    ? text.secretPlaceholder.configured
    : text.secretPlaceholder.empty;
  const publicKeyPlaceholder = configQuery.data?.mercadopago_public_key_configurado
    ? text.secretPlaceholder.configured
    : text.secretPlaceholder.empty;

  const isFieldDisabled = !canEdit || isLoading;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        canEdit ? (
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form="config-form"
            loading={configMutation.isPending}
            disabled={configMutation.isPending || isLoading}
          />
        ) : undefined
      }
    >
      {configQuery.isError ? (
        <QueryErrorState
          error={configQuery.error}
          message={languageGB.common.errorLog.unknownError}
          retryLabel={languageGB.defaltStrings.tryAgain}
          onRetry={() => configQuery.refetch()}
          isRetrying={configQuery.isFetching}
        />
      ) : (
        <Form id="config-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          {!canEdit && (
            <Box
              mb={6}
              px={4}
              py={3}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="md"
              bg="bg.subtle"
            >
              {text.readOnlyNotice}
            </Box>
          )}

          {/* ── SEÇÃO 1 — PRAZOS E PARÂMETROS OPERACIONAIS ────────────────── */}
          <CollapsibleSection title={text.sections.operational} fieldCount={6} defaultOpen>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="dias_teste"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.fields.diasTeste}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isFieldDisabled}
                    />
                  )}
                />
              </Skeleton>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="dias_alerta_pagamento"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.fields.diasAlertaPagamento}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isFieldDisabled}
                    />
                  )}
                />
              </Skeleton>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="dias_assinar_contrato"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.fields.diasAssinarContrato}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isFieldDisabled}
                    />
                  )}
                />
              </Skeleton>
              <Controller
                name="contrato_certificado"
                control={control}
                render={({ field }) => (
                  <Select
                    label={text.fields.contratoCertificado}
                    name={field.name}
                    value={field.value ?? null}
                    onChange={(opt: Option<boolean> | null) => field.onChange(opt)}
                    options={booleanOptions}
                    error={errors.contrato_certificado?.message as string | undefined}
                    noClearable
                    isRequired
                    isDisabled={isFieldDisabled}
                    loading={isLoading}
                  />
                )}
              />
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="minutos_online"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.fields.minutosOnline}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isFieldDisabled}
                    />
                  )}
                />
              </Skeleton>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="dias_alerta_vencimento_certificado"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.fields.diasAlertaVencimentoCertificado}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isFieldDisabled}
                    />
                  )}
                />
              </Skeleton>
            </SimpleGrid>
          </CollapsibleSection>

          {/* ── SEÇÃO 2 — MERCADO PAGO (segredos write-only, §4.2) ────────── */}
          <CollapsibleSection title={text.sections.mercadoPago} fieldCount={2} defaultOpen>
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="mercadopago_public_key"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      label={text.fields.mercadopagoPublicKey}
                      errorText={fieldState.error?.message}
                    >
                      <PasswordInput
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={publicKeyPlaceholder}
                        disabled={isFieldDisabled}
                        maxLength={100}
                      />
                    </Field>
                  )}
                />
              </Skeleton>
              <Skeleton loading={isLoading} borderRadius="md">
                <Controller
                  name="mercadopago_access_token"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      label={text.fields.mercadopagoAccessToken}
                      errorText={fieldState.error?.message}
                    >
                      <PasswordInput
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={accessTokenPlaceholder}
                        disabled={isFieldDisabled}
                        maxLength={100}
                      />
                    </Field>
                  )}
                />
              </Skeleton>
            </SimpleGrid>
          </CollapsibleSection>

          {/* ── SEÇÃO 3 — AUTO-CADASTRO (selects gateados, §7.4) ──────────── */}
          <CollapsibleSection title={text.sections.signup} fieldCount={2} defaultOpen>
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <Controller
                name="afiliado_padrao_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.afiliadoPadrao}
                    service={listPartners}
                    mapOptions={(item: PartnerListItem) => ({
                      label: partnerLabel(item.person.nickname, item.person.name),
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={isFieldDisabled}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
              <Controller
                name="plano_padrao_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.planoPadrao}
                    service={listPlanRoles}
                    mapOptions={(item: PlanRoleListItem) => ({
                      label: planRoleLabel(item.name, item.price),
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={isFieldDisabled}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ── SEÇÃO 4 — SUPORTE E RESPONSÁVEL TÉCNICO ───────────────────── */}
          <CollapsibleSection title={text.sections.support} fieldCount={5} defaultOpen>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="whatsapp_link_suporte"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    name={field.name}
                    label={text.fields.whatsappLinkSuporte}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    isRequired
                    disabled={isFieldDisabled}
                    loading={isLoading}
                    maxLength={255}
                  />
                )}
              />
              <Controller
                name="resp_cnpj"
                control={control}
                render={({ field, fieldState }) => (
                  <MaskedInput
                    kind="cnpj"
                    name={field.name}
                    label={text.fields.respCnpj}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={isFieldDisabled}
                  />
                )}
              />
              <Controller
                name="resp_nome"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    name={field.name}
                    label={text.fields.respNome}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={isFieldDisabled}
                    loading={isLoading}
                    maxLength={50}
                  />
                )}
              />
              <Controller
                name="resp_email"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    name={field.name}
                    label={text.fields.respEmail}
                    type="email"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={isFieldDisabled}
                    loading={isLoading}
                    maxLength={80}
                  />
                )}
              />
              <Controller
                name="resp_fone"
                control={control}
                render={({ field, fieldState }) => (
                  <InputMask
                    name={field.name}
                    label={text.fields.respFone}
                    mask={languageGB.defaltStrings.masks.mobileNumber}
                    maskPlaceholder={null}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={isFieldDisabled}
                  />
                )}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ── SEÇÃO 5 — VÍDEO INSTITUCIONAL (upload dedicado, TASK-FE-2602) ── */}
          <CollapsibleSection title={text.sections.videoIntro} fieldCount={1} defaultOpen>
            <VideoIntroUploadSection
              videoIntroUrl={configQuery.data?.video_intro_url ?? null}
              disabled={!canEdit || isLoading}
            />
          </CollapsibleSection>
        </Form>
      )}
    </FormContainer>
  );
}
