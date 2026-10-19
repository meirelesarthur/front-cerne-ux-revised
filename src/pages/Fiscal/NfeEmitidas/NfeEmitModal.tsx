// src/pages/Fiscal/NfeEmitidas/NfeEmitModal.tsx
// -----------------------------------------------------------------------------
// Modal de confirmação de Emissão SEFAZ — TASK-FE-036-512 (Onda 1), corrigido
// na Onda 4 (GAP-FE-036-516). Mirror estrutural `NfeMotivoModal.tsx`/
// `GerarDepreciacaoModal.tsx` (Dialog v3 headless + react-hook-form; a
// `mutation` é instanciada no host — `NfeEmissionPanel.tsx` — cujo
// `actionSuccess` fecha este modal).
//
// GAP-FE-036-516 (RESOLVIDO nesta onda) — a Onda 1 exibia Emissor/IE READONLY
// a partir do próprio `NfeDetail` já carregado e enviava `state_registration
// = state_registration_client` (IE do CLIENTE) no `emit`. O backend
// (`TransmitNfeAction::resolveStateRegistrationId`) sempre validou o
// `state_registration` do payload contra `Issuer::stateRegistrations()` — as
// IEs CADASTRADAS DO EMISSOR, nunca do cliente — então aquele payload
// divergia do contrato desde a Onda 1 (ver Gap completo em
// `CORE_WORKSPACE/97-Esteiras/036/CONTRATOS/frontend/nfe-emitidas/
// GAP-FE-036-516-nfe-emissor-ie-cascata-sem-endpoint-options.md`).
//
// Correção: `GET /nfes/issuer-options` (endpoint NOVO, dedicado, SEM o gate
// do CRUD `issue_view`, gate `nfe_view`, farm-scoped — `getNfeIssuerOptions`)
// devolve só os emissores ELEGÍVEIS para emissão, cada um JÁ COM as próprias
// `state_registrations[]` embutidas — dispensa uma 2ª chamada por emissor. O
// select de Emissor popula o select de IE em cascata (options DERIVADAS do
// item selecionado desta lista, nunca hardcode). O emissor já vinculado à
// NF-e (`nfeDetail.issuer`) é pré-selecionado por padrão (mesmo emissor que a
// Onda 1 exibia), e a IE é pré-selecionada quando o emissor tiver só 1
// cadastrada; com 0 IEs cadastradas, o submit fica bloqueado com mensagem
// própria (`noStateRegistrationsForIssuer`), nunca com um formulário
// silenciosamente inválido.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';

import type { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { getNfeIssuerOptions } from '@/services/v2/Fiscal/nfe-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  NfeDetail,
  NfeEmissionResult,
  NfeEmitPayload,
  NfeIssuerOption,
} from '@/@types/v2/Nfes';

export interface NfeEmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfeDetail: NfeDetail;
  languageGB: LanguageDate;
  mutation: ReturnType<typeof useRequest<NfeEmissionResult>>;
  onConfirm: (payload: NfeEmitPayload) => void;
}

interface EmitFormValues {
  issuer_uuid: Option<string> | null;
  state_registration: Option<string> | null;
  series_uuid: Option<string> | null;
}

function issuerOptionLabel(issuer: NfeIssuerOption): string {
  return issuer.razao_social ?? issuer.nome_fantasia ?? issuer.uuid;
}

export function NfeEmitModal({
  isOpen,
  onClose,
  nfeDetail,
  languageGB,
  mutation,
  onConfirm,
}: NfeEmitModalProps) {
  const text = languageGB.nfes.nfe.emission;
  const modalText = text.emitModal;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmitFormValues>({
    mode: 'onChange',
    defaultValues: { issuer_uuid: null, state_registration: null, series_uuid: null },
  });

  // GAP-FE-036-516 — lista de emissores elegíveis (cada um já com as
  // próprias `state_registrations[]`), endpoint dedicado sem o gate do CRUD
  // `issue_view`. Só busca com o modal aberto — mesmo racional de
  // `providerBranchesQuery` em `CreateOrUpdateExpense.tsx` (query dedicada,
  // cache próprio via TanStack Query).
  const issuerOptionsQuery = useQuery({
    queryKey: [queryKey.nfes.issuerOptions],
    queryFn: async () => (await getNfeIssuerOptions()).data,
    enabled: isOpen,
  });

  const issuerOptions: Option<string>[] = (issuerOptionsQuery.data ?? []).map((issuer) => ({
    label: issuerOptionLabel(issuer),
    value: issuer.uuid,
  }));

  const watchedIssuerUuid = watch('issuer_uuid')?.value;
  const watchedStateRegistration = watch('state_registration');

  const selectedIssuer = issuerOptionsQuery.data?.find(
    (issuer) => issuer.uuid === watchedIssuerUuid
  );
  const stateRegistrationOptions: Option<string>[] = (
    selectedIssuer?.state_registrations ?? []
  ).map((registration) => ({ label: registration, value: registration }));
  const issuerHasNoStateRegistrations =
    !!watchedIssuerUuid && stateRegistrationOptions.length === 0;

  // UT-000780 (D-101-02): série escolhida na emissão — só as ATIVAS do emissor
  // selecionado (a API já filtra); a padrão vem pré-selecionada.
  const watchedSeries = watch('series_uuid');
  const seriesOptions: Option<string>[] = (selectedIssuer?.series ?? []).map((item) => ({
    label: String(item.serie),
    value: item.uuid,
  }));
  const issuerHasNoSeries = !!watchedIssuerUuid && seriesOptions.length === 0;

  // Reabertura do modal — form nasce limpo a cada vez (o componente NÃO
  // desmonta entre aberturas, `Dialog` só controla o `Content` via
  // `unmountOnExit`; sem este reset, os valores da última emissão vazariam
  // para a próxima abertura, mirror `NfeMotivoModal.handleClose`).
  const hasAutoSelectedIssuerRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      reset({ issuer_uuid: null, state_registration: null, series_uuid: null });
      hasAutoSelectedIssuerRef.current = false;
    }
  }, [isOpen, reset]);

  // Pré-seleciona o emissor já vinculado à NF-e (mesmo emissor que a Onda 1
  // exibia read-only) SE ele estiver entre os elegíveis retornados — nunca
  // força um emissor fora da lista (SEM MOCK). Só roda 1x por abertura.
  useEffect(() => {
    if (
      isOpen &&
      !hasAutoSelectedIssuerRef.current &&
      issuerOptionsQuery.data &&
      nfeDetail.issuer?.uuid
    ) {
      const match = issuerOptionsQuery.data.find(
        (issuer) => issuer.uuid === nfeDetail.issuer?.uuid
      );
      if (match) {
        setValue('issuer_uuid', { label: issuerOptionLabel(match), value: match.uuid });
      }
      hasAutoSelectedIssuerRef.current = true;
    }
  }, [isOpen, issuerOptionsQuery.data, nfeDetail.issuer?.uuid, setValue]);

  // Cascata Emissor→IE — cada troca de emissor RECALCULA a IE a partir das
  // `state_registrations[]` do item selecionado: pré-seleciona quando há
  // exatamente 1, limpa quando há 0 ou mais de 1 (o usuário escolhe). Nunca
  // herda a IE de um emissor anterior.
  useEffect(() => {
    if (!watchedIssuerUuid) {
      setValue('state_registration', null);
      setValue('series_uuid', null);
      return;
    }
    const issuer = issuerOptionsQuery.data?.find((item) => item.uuid === watchedIssuerUuid);
    const registrations = issuer?.state_registrations ?? [];
    if (registrations.length === 1) {
      setValue('state_registration', { label: registrations[0], value: registrations[0] });
    } else {
      setValue('state_registration', null);
    }
    // Série: pré-seleciona a padrão (ou a única); reset a cada troca de emissor.
    const series = issuer?.series ?? [];
    const preferred =
      series.find((item) => item.is_default) ?? (series.length === 1 ? series[0] : null);
    setValue(
      'series_uuid',
      preferred ? { label: String(preferred.serie), value: preferred.uuid } : null
    );
    // Deps intencionalmente só `watchedIssuerUuid` — a cascata só deve
    // recalcular a IE quando o EMISSOR muda, nunca quando `issuerOptionsQuery.data`
    // é recriado pelo TanStack Query (mesma referência lógica) ou `setValue` (estável).
  }, [watchedIssuerUuid]);

  function submit(data: EmitFormValues) {
    if (!data.issuer_uuid?.value || !data.state_registration?.value || !data.series_uuid?.value) {
      return;
    }
    onConfirm({
      issuer_uuid: data.issuer_uuid.value,
      state_registration: data.state_registration.value,
      series_uuid: data.series_uuid.value,
    });
  }

  function handleClose() {
    reset({ issuer_uuid: null, state_registration: null, series_uuid: null });
    onClose();
  }

  // D4 (UB12-10) — emissor que exige IBS/CBS + item sem CST IBS/CBS/cClassTrib: avisa e bloqueia.
  // Exceção da NT: finnfe 2/4 referenciando nota anterior a 2027 (a API é a autoridade).
  const finnfe = Number(nfeDetail.finnfe);
  const detailItems = nfeDetail.items ?? [];
  const itemLabel = (item: (typeof detailItems)[number], index: number) =>
    `${index + 1} — ${item.product?.description ?? item.uuid}`;
  const ibsCbsExempt = finnfe === 2 || finnfe === 4;
  const ibsCbsMissingItems =
    selectedIssuer?.requires_ibscbs && !ibsCbsExempt
      ? detailItems.flatMap((item, index) =>
          item.cst_ibs_cbs?.trim() && item.c_class_trib?.trim() ? [] : [itemLabel(item, index)]
        )
      : [];

  // D2 (VC02-50 / 1194) — devolução de SAÍDA cuja chave de origem é do próprio emissor: aviso,
  // sem bloqueio (a SEFAZ decide). Ignora NFA (série 890-899, chave traz o CNPJ da SEFAZ).
  const issuerDocument = (selectedIssuer?.document ?? '').replace(/\D/g, '');
  const ownKeyItems =
    finnfe === 4 && Number(nfeDetail.tipo) === 1 && issuerDocument
      ? detailItems.flatMap((item, index) => {
          const key = (item.ref_access_key ?? '').replace(/\D/g, '');
          const nfaSeries = Number(key.substring(22, 25));
          const isNfa = nfaSeries >= 890 && nfaSeries <= 899;
          return key.length === 44 && !isNfa && key.substring(6, 20) === issuerDocument
            ? [itemLabel(item, index)]
            : [];
        })
      : [];

  const hasNoIssuersAvailable = issuerOptionsQuery.isSuccess && issuerOptions.length === 0;

  const isConfirmDisabled =
    mutation.isPending ||
    issuerOptionsQuery.isLoading ||
    issuerOptionsQuery.isError ||
    !watchedIssuerUuid ||
    !watchedStateRegistration?.value ||
    issuerHasNoStateRegistrations ||
    !watchedSeries?.value ||
    issuerHasNoSeries ||
    ibsCbsMissingItems.length > 0;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) handleClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{modalText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" color="fg.muted">
                  {modalText.description}
                </Text>

                {issuerOptionsQuery.isError && (
                  <Text fontSize="sm" color="fg.error">
                    {modalText.loadIssuersError}
                  </Text>
                )}

                {hasNoIssuersAvailable && (
                  <Text fontSize="sm" color="fg.error">
                    {modalText.noIssuersAvailable}
                  </Text>
                )}

                {ibsCbsMissingItems.length > 0 && (
                  <VStack align="stretch" gap={1} role="alert" data-testid="ibscbs-warning">
                    <Text fontSize="sm" color="fg.error" fontWeight="semibold">
                      {modalText.ibsCbsMissingTitle}
                    </Text>
                    {ibsCbsMissingItems.map((label) => (
                      <Text key={label} fontSize="sm" color="fg.error">
                        {label}
                      </Text>
                    ))}
                    <Text fontSize="xs" color="fg.muted">
                      {modalText.ibsCbsMissingHint}
                    </Text>
                  </VStack>
                )}

                {ownKeyItems.length > 0 && (
                  <VStack align="stretch" gap={1} role="status" data-testid="own-key-warning">
                    <Text fontSize="sm" color="fg.warning" fontWeight="semibold">
                      {modalText.ownIssuerKeyWarningTitle}
                    </Text>
                    {ownKeyItems.map((label) => (
                      <Text key={label} fontSize="sm" color="fg.warning">
                        {label}
                      </Text>
                    ))}
                    <Text fontSize="xs" color="fg.muted">
                      {modalText.ownIssuerKeyWarningHint}
                    </Text>
                  </VStack>
                )}

                <Controller
                  name="issuer_uuid"
                  control={control}
                  rules={{ required: modalText.issuerRequired }}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={modalText.issuerLabel}
                      placeholder={modalText.issuerPlaceholder}
                      name={name}
                      value={value}
                      onChange={onChange}
                      options={issuerOptions}
                      error={errors.issuer_uuid?.message}
                      isRequired
                      isDisabled={mutation.isPending || issuerOptionsQuery.isLoading}
                      loading={issuerOptionsQuery.isLoading}
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="state_registration"
                  control={control}
                  rules={{ required: modalText.stateRegistrationRequired }}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={modalText.stateRegistrationLabel}
                      placeholder={modalText.stateRegistrationPlaceholder}
                      helperText={
                        issuerHasNoStateRegistrations
                          ? modalText.noStateRegistrationsForIssuer
                          : undefined
                      }
                      name={name}
                      value={value}
                      onChange={onChange}
                      options={stateRegistrationOptions}
                      error={errors.state_registration?.message}
                      isRequired
                      isDisabled={
                        mutation.isPending || !watchedIssuerUuid || issuerHasNoStateRegistrations
                      }
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="series_uuid"
                  control={control}
                  rules={{ required: modalText.seriesRequired }}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={modalText.seriesLabel}
                      placeholder={modalText.seriesPlaceholder}
                      helperText={issuerHasNoSeries ? modalText.noSeriesForIssuer : undefined}
                      name={name}
                      value={value}
                      onChange={onChange}
                      options={seriesOptions}
                      error={errors.series_uuid?.message}
                      isRequired
                      noClearable
                      isDisabled={mutation.isPending || !watchedIssuerUuid || issuerHasNoSeries}
                      disablePortal
                    />
                  )}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="outline"
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
              />
              <Button
                title={modalText.confirmButton}
                type="button"
                onClick={handleSubmit(submit)}
                loading={mutation.isPending}
                disabled={isConfirmDisabled}
              />
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
