// src/pages/Administrativo/Autorizacao/SendForAuthorizationDialog.tsx
// -----------------------------------------------------------------------------
// Execução 081, T-081-FE-06: modal "Enviar para Autorização" do legado (SEC). Lista =
// `eligible_authorizers` do contexto (nível do usuário + 1, ou ele mesmo se a alçada
// cobre); a justificativa digitada na tela é copiada ao abrir (IG11), opcional aqui e
// com limite de 300 do legado; ao enviar, a tela volta para a lista (`onSuccess`).
//
// Dialog "Enviar para Autorização" (ramo 2º nível/ciência, `surf-dialog-04`,
// Administrativo / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-04).
// Acionado pelo botão "Aprovar/Avançar" do container (`AutorizarSolicitacao.tsx`)
// quando `authorization_context.next_status_candidates` inclui `3`
// (Aguardando Aprovação, BR-05) — a decisão de ABRIR este dialog (em vez de
// submeter `acknowledge` direto) é feita pelo CONTAINER a partir do array
// server-side, nunca recalculada aqui.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror estrutural de
// `Solicitacao/RequestQuotationAuthorizerDialog.tsx` (`useMutation` DIRETO +
// `toaster` local, 422 mapeado por campo via `setError`, `Select` comum
// `disablePortal` — não `SelectAsyncPaginate`).
//
// ⚠️ Divergência CONSCIENTE do molde citado (achado §5 do Roteiro Frontend):
// `eligible_authorizers` já vem EMBUTIDO em `authorization_context` (mesma
// query do container, `GET /request-authorizations/{uuid}`) — este Dialog
// NÃO faz uma 2ª chamada (`GET .../eligible-authorizers`, usada pelo molde
// original, que opera sobre OUTRO endpoint/tela). Por isso não há estado de
// loading/erro de carregamento aqui — só o estado real "lista vazia"
// (`emptyEligibleState`, nunca tratado como erro).
//
// Rateio (`classification`/`harvest_uuid`/`categories`/`centers`/
// `category_percent_values`) — quando `requiresRatio` (calculado
// server-side, `authorization_context.requires_ratio_block`), o bloco visual
// (`RequestAuthorizationRatioFieldArray`) é renderizado no CORPO do
// container, não dentro deste Dialog; no submit, este Dialog só chama
// `getRatioPayload()` (closure do container sobre o `ratioForm`
// compartilhado) para obter os 5 campos já "zipados" nos 3 arrays paralelos
// — nenhuma UI de rateio duplicada aqui.
//
// `status` é SEMPRE `3` neste Dialog (BR-05 "enviar para autorização") — o
// schema `acknowledge-schema` é reaproveitado com `status` fixo no
// `defaultValues` (nunca exposto como campo editável), o que faz
// `authorizer_uuid` tornar-se obrigatório e `justify` opcional (mesma regra
// usada pela Action/Form Request reais, `required_if:status,3` /
// `required_unless:status,3`).
//
// `disablePortal` no `Select` — OBRIGATÓRIO dentro de `Dialog.Root`
// (TASK-FE-706/DF-31, mesma nota dos demais Dialogs deste módulo).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, EmptyState, Portal, SimpleGrid, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import sendForAuthorizationFormResolver from '@/validations/schemas/RequestAuthorizations/send-for-authorization-form-schema';

import { acknowledgeRequestAuthorization } from '@/services/v2/RequestAuthorizations/request-authorization-service';

import type { Option } from '@/@types/option';
import type {
  RequestAuthorizationAcknowledgePayload,
  RequestAuthorizationEligibleAuthorizer,
} from '@/@types/v2/RequestAuthorizations';

const STATUS_SEND_FOR_AUTHORIZATION = 3;

export interface SendForAuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da Autorização (rota) — necessário para compor o endpoint. */
  authorizationUuid: string;
  /** `authorization_context.eligible_authorizers` — já embutido na MESMA
   *  query do container, sem 2ª chamada (achado §5 do Roteiro Frontend). */
  eligibleAuthorizers: RequestAuthorizationEligibleAuthorizer[];
  /** `authorization_context.requires_ratio_block` — gate calculado
   *  server-side, nunca recalculado aqui (risco 2 da Tarefa). */
  requiresRatio: boolean;
  /** Zip dos 5 campos de rateio (closure do container sobre o `ratioForm`
   *  compartilhado) — chamado só no submit, valores sempre frescos. */
  getRatioPayload: () => Pick<
    RequestAuthorizationAcknowledgePayload,
    'classification' | 'harvest_uuid' | 'categories' | 'centers' | 'category_percent_values'
  >;
  /** Justificativa já digitada na tela (legado IG11: é copiada para o modal ao abri-lo). */
  initialJustify?: string;
  /** Chamado após o envio (a tela volta para a lista, como o legado). */
  onSuccess?: () => void;
  /** 422 do servidor em `harvest_uuid`/`classification`: o container marca o campo do bloco. */
  onRatioServerError?: (error: unknown) => void;
}

/** Form deste Dialog — `authorizer_uuid` obrigatório (status fixo 3),
 *  `justify` opcional (mirror `RequestQuotationAuthorizerFormValues`). */
interface SendForAuthorizationFormValues {
  status: number;
  authorizer_uuid: Option<string> | null;
  justify: string;
}

export function SendForAuthorizationDialog({
  isOpen,
  onClose,
  authorizationUuid,
  eligibleAuthorizers,
  requiresRatio,
  getRatioPayload,
  initialJustify = '',
  onSuccess,
  onRatioServerError,
}: SendForAuthorizationDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestAuthorizations.requestAuthorization;
  const dialogText = text.sendForAuthorization;

  const { control, register, handleSubmit, reset, setError } =
    useForm<SendForAuthorizationFormValues>({
      resolver: sendForAuthorizationFormResolver(languageGB),
      defaultValues: {
        status: STATUS_SEND_FOR_AUTHORIZATION,
        authorizer_uuid: null,
        justify: initialJustify,
      },
    });

  // Ao abrir, copia a justificativa digitada na tela (legado IG11).
  useEffect(() => {
    if (isOpen) {
      reset({
        status: STATUS_SEND_FOR_AUTHORIZATION,
        authorizer_uuid: null,
        justify: initialJustify,
      });
    }
  }, [isOpen]);

  function handleOpenChange(details: { open: boolean }) {
    if (!details.open) {
      if (sendMutation.isPending) return;
      onClose();
    }
  }

  const eligibleOptions: Option<string>[] = eligibleAuthorizers.map((authorizer) => ({
    label: authorizer.name,
    value: authorizer.uuid,
  }));

  const isListEmpty = eligibleOptions.length === 0;

  // ---- Envio (useMutation DIRETO + toaster local — Pattern 14 regra 5) ----
  const sendMutation = useMutation({
    mutationFn: (payload: RequestAuthorizationAcknowledgePayload) =>
      acknowledgeRequestAuthorization(authorizationUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestAuthorizations.requestAuthorization, authorizationUuid],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestAuthorizations.requestAuthorizationsList],
      });
      toaster.success({
        title: text.singularLabel,
        description: text.detail.actions.updateToast,
        duration: 7000,
      });
      reset({ status: STATUS_SEND_FOR_AUTHORIZATION, authorizer_uuid: null, justify: '' });
      onClose();
      onSuccess?.();
    },
    onError: (error: unknown) => {
      // 422 do backend mapeado por campo (mirror `RequestQuotationAuthorizerDialog.tsx`).
      if (isAxiosError(error) && error.response?.status === 422) {
        const hasRatioError = !!(
          (error.response.data?.errors as Record<string, string[]> | undefined)?.harvest_uuid ||
          (error.response.data?.errors as Record<string, string[]> | undefined)?.classification
        );
        if (hasRatioError) {
          onRatioServerError?.(error);
          onClose();
        }
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0] && (field === 'authorizer_uuid' || field === 'justify')) {
            setError(field as keyof SendForAuthorizationFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }

      const errorMessage =
        isAxiosError(error) && (error.response?.data as { message?: string })?.message
          ? (error.response!.data as { message: string }).message
          : languageGB.common.errorLog.unknownError;

      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  function onSubmit(data: SendForAuthorizationFormValues) {
    if (!data.authorizer_uuid) return; // guarda defensiva — schema já exige

    // D-100-22: Safra e Classificação não bloqueiam o envio (o container omite as vazias).
    const ratioPayload = requiresRatio ? getRatioPayload() : undefined;

    const payload: RequestAuthorizationAcknowledgePayload = {
      status: STATUS_SEND_FOR_AUTHORIZATION,
      authorizer_uuid: data.authorizer_uuid.value,
      justify: data.justify.trim() || undefined,
      ...ratioPayload,
    };

    sendMutation.mutate(payload);
  }

  function handleClose() {
    if (sendMutation.isPending) return;
    onClose();
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange} lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{dialogText.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  {isListEmpty ? (
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <VStack textAlign="center" gap={1}>
                          <EmptyState.Description>
                            {dialogText.emptyEligibleState.description}
                          </EmptyState.Description>
                        </VStack>
                      </EmptyState.Content>
                    </EmptyState.Root>
                  ) : (
                    <Controller
                      name="authorizer_uuid"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Select
                          name={field.name}
                          label={dialogText.authorizerLabel}
                          placeholder={dialogText.authorizerPlaceholder}
                          error={fieldState.error?.message as string | undefined}
                          options={eligibleOptions}
                          value={field.value ?? null}
                          onChange={(option) => field.onChange(option ?? null)}
                          isRequired
                          isDisabled={sendMutation.isPending}
                          disablePortal
                        />
                      )}
                    />
                  )}

                  <Textarea
                    label={dialogText.justifyLabel}
                    maxLength={300}
                    {...register('justify')}
                    disabled={sendMutation.isPending}
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={sendMutation.isPending}
                />
                <Button
                  title={dialogText.sendButton}
                  type="submit"
                  loading={sendMutation.isPending}
                  disabled={sendMutation.isPending || isListEmpty}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
