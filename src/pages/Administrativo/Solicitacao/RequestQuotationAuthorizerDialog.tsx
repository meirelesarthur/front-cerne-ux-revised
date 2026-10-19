// src/pages/Administrativo/Solicitacao/RequestQuotationAuthorizerDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Enviar para Autorização" (Dimensão B — RequestPurchase/RequestQuotation,
// Administrativo/Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-07).
// Substitui o STUB `handleSendForAuthorization` de `RequestQuotationTab.tsx`
// (TASK-CQ-FE-03, AM-12) — acionável a partir do menu de ações de QUALQUER
// cotação da aba (`canEdit`, sem condição extra de `status` — mesma condição
// já aplicada no card).
//
// ⚠️ FRONTEIRA DE MÓDULO (mesma já registrada no service): a ação opera sobre
// a `RequestPurchase` PAI, não sobre a `RequestQuotation` individual que
// disparou o menu — `GET/POST .../eligible-authorizers`/`.../send-for-
// authorization` são rotas de `RequestPurchaseController`
// (`02-roteiro-api-cotacoes.md` §8.1). Por isso este Dialog só recebe
// `requestPurchaseUuid` como prop (mesmo já injetado na aba inteira) — a
// cotação específica que originou o clique é irrelevante para o payload.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror estrutural de
// `RequestQuotationSavingDialog.tsx` (`useMutation` DIRETO + `toaster` local,
// 422 mapeado por campo via `setError`).
//
// Campo `authorizer_uuid` — `Select` comum + `useQuery` (NÃO
// `SelectAsyncPaginate`): `GET /request-purchases/{uuid}/eligible-authorizers`
// devolve uma Collection SEM paginação (`ApiResponse::success`, não
// `::paginated`) — mesma disciplina já aplicada a `branch_uuid` em
// `RequestQuotationFormDialog.tsx` ("Select comum + useQuery, nunca
// SelectAsyncPaginate" quando não existe endpoint paginado/buscável).
//
// ⚠️ O FRONT NUNCA REPLICA a lógica condicional de elegibilidade (CL-043,
// motor server-side: farm/`is_conditional`/`RuleType`/exclusão de quem já
// aprovou) — só consome a lista já filtrada devolvida pelo backend. Lista
// vazia é um estado REAL da API (nenhum autorizador elegível agora), tratado
// como estado de UI honesto (`emptyEligibleState`), nunca como erro.
//
// Submit → `POST .../send-for-authorization` (`sendForAuthorization`,
// TASK-CQ-FE-07) — promove o `status` da `RequestPurchase` (3 ou 4, CL-044,
// 100% server-side). `onSuccess` invalida a grade de cotações da aba + o hub
// + o DETALHE da `RequestPurchase` (badge de status/barra de trâmite da tela
// única depende desse detalhe, `queryKey.requestPurchases.requestPurchase`,
// mesma chave de `useCustomFormQueryByGuid` em `CreateOrUpdateSolicitacao.tsx`).
//
// ⚠️ Fronteira de escopo desta Tarefa (achado que reduz escopo, registrado —
// não inventado em silêncio): o roteiro frontend §4.1 também cita este mesmo
// Dialog sendo aberto "ao final do fluxo 'Salvar e Enviar para Autorização'"
// (AM-10, CL-042 — botão na barra de trâmite de `CreateOrUpdateSolicitacao.tsx`
// que primeiro salva a justificativa de cotação via `await` real e só então
// abre este Dialog). O task-packet desta Tarefa (TASK-CQ-FE-07) listou como
// arquivos-alvo APENAS este Dialog + o service de `RequestPurchase` — o
// wiring do lado `CreateOrUpdateSolicitacao.tsx` ficou para depois. Este
// componente já nasceu pronto para ser reaproveitado por aquele fluxo (única
// dependência é `requestPurchaseUuid`), e o encadeamento foi fechado por
// `TASK-CQ-FE-14`: `quotationJustificationMutation.actionSuccess` abre uma
// instância PRÓPRIA deste MESMO Dialog (não recriado) depois do sucesso real
// da justificativa — mesma disciplina "erro dá toast e NÃO avança" do
// `useRequest`. A ação "Enviar para Autorização" (AM-12) do card continua
// abrindo a instância interna de `RequestQuotationTab.tsx` (TASK-CQ-FE-07,
// inalterada).
//
// `disablePortal` no `Select` — OBRIGATÓRIO dentro de `Dialog.Root`
// (TASK-FE-706/DF-31, mesma nota dos demais Dialogs deste módulo).
// -----------------------------------------------------------------------------

import { Dialog, EmptyState, Icon, Portal, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import requestQuotationAuthorizerSchemaResolver from '@/validations/schemas/RequestQuotations/request-quotation-authorizer-schema';

import type { RequestAuthorizerOptionItem } from '@/services/v2/RequestAuthorizers/request-authorizer-service';
import {
  getEligibleAuthorizers,
  sendForAuthorization,
} from '@/services/v2/RequestPurchases/request-purchase-service';
import type { SendForAuthorizationPayload } from '@/services/v2/RequestPurchases/request-purchase-service';

import type { Option } from '@/@types/option';

export interface RequestQuotationAuthorizerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** UUID da `RequestPurchase` PAI — endpoints de elegibilidade/envio operam
   *  sobre ela, não sobre uma `RequestQuotation` individual (ver cabeçalho
   *  do arquivo). */
  requestPurchaseUuid: string;
}

/** Form deste Dialog — único campo, mapeamento 1:1 com o payload real
 *  (`authorizer_uuid`), mesma técnica de `RequestQuotationSavingForm`. */
interface RequestQuotationAuthorizerFormValues {
  authorizer_uuid: Option<string> | null;
}

export function RequestQuotationAuthorizerDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
}: RequestQuotationAuthorizerDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestQuotations.requestQuotation;
  const authorizerText = text.authorizer;

  const { control, handleSubmit, reset, setError } = useForm<RequestQuotationAuthorizerFormValues>({
    resolver: requestQuotationAuthorizerSchemaResolver(languageGB),
    defaultValues: { authorizer_uuid: null },
  });

  // Reset defensivo a cada abertura — mesma disciplina de
  // `RequestQuotationFormDialog.tsx`/`RequestQuotationSavingDialog.tsx`
  // (`unmountOnExit` na casca já garante form novo, este reset é redundante
  // de propósito, sem custo).
  function handleOpenChange(details: { open: boolean }) {
    if (!details.open) {
      if (sendMutation.isPending) return;
      onClose();
    }
  }

  // ---- Lista de elegíveis (CL-043, motor 100% server-side) --------------
  const eligibleQuery = useQuery({
    queryKey: [queryKey.requestPurchases.eligibleAuthorizers, requestPurchaseUuid],
    queryFn: async () => (await getEligibleAuthorizers(requestPurchaseUuid)).data ?? [],
    enabled: isOpen && !!requestPurchaseUuid,
  });

  const eligibleOptions: Option<string>[] = (eligibleQuery.data ?? []).map(
    (authorizer: RequestAuthorizerOptionItem) => ({
      label: authorizer.user.name,
      value: authorizer.uuid,
    })
  );

  const isListEmpty = eligibleQuery.isSuccess && eligibleOptions.length === 0;

  // ---- Envio (useMutation DIRETO + toaster local — Pattern 14 regra 5) --
  const sendMutation = useMutation({
    mutationFn: (payload: SendForAuthorizationPayload) =>
      sendForAuthorization(requestPurchaseUuid, payload),
    onSuccess: () => {
      // Invalida a grade da aba + o hub + o DETALHE da RequestPurchase (a
      // badge de status/barra de trâmite da tela única depende dele — o
      // `send` promove o status server-side, CL-044).
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestQuotations.requestQuotationsByPurchase, requestPurchaseUuid],
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.requestPurchases.requestPurchasesList] });
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestPurchases.requestPurchase, requestPurchaseUuid],
      });
      toaster.success({
        title: text.singularLabel,
        description: authorizerText.sentToast,
        duration: 7000,
      });
      reset({ authorizer_uuid: null });
      onClose();
    },
    onError: (error: unknown) => {
      // 422 do backend mapeado por campo (mirror
      // `RequestQuotationSavingDialog.tsx`) — inclui violações de
      // `RequestPurchaseSendForAuthorizationRequest::rules()`
      // (`authorizer_uuid`: required/uuid/exists), mensagem literal do
      // backend, NUNCA hardcoded aqui.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof RequestQuotationAuthorizerFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }

      const errorMessage =
        isAxiosError(error) && (error.response?.data as { message?: string })?.message
          ? (error.response!.data as { message: string }).message
          : authorizerText.errorFallback;

      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  function onSubmit(data: RequestQuotationAuthorizerFormValues) {
    if (!data.authorizer_uuid) return; // guarda defensiva — schema já exige

    const payload: SendForAuthorizationPayload = {
      authorizer_uuid: data.authorizer_uuid.value,
    };

    sendMutation.mutate(payload);
  }

  function handleClose() {
    if (sendMutation.isPending) return;
    onClose();
  }

  const isSubmitDisabled =
    sendMutation.isPending || eligibleQuery.isError || isListEmpty || eligibleQuery.isPending;

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
              <Dialog.Title>{authorizerText.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                {eligibleQuery.isError ? (
                  // Falha ao carregar a lista de elegíveis — mirror EXATO do
                  // estado de erro de `RequestQuotationDetailDialog.tsx`
                  // (EmptyState + retry), distinto do estado "lista vazia"
                  // abaixo (ambos são estados REAIS da API, nunca confundidos).
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                      </EmptyState.Indicator>
                      <VStack textAlign="center" gap={1}>
                        <EmptyState.Title>{authorizerText.loadErrorState.title}</EmptyState.Title>
                        <EmptyState.Description>
                          {authorizerText.loadErrorState.description}
                        </EmptyState.Description>
                      </VStack>
                      <Button
                        title={authorizerText.loadErrorState.retry}
                        variant="outline"
                        size="sm"
                        onClick={() => eligibleQuery.refetch()}
                      />
                    </EmptyState.Content>
                  </EmptyState.Root>
                ) : (
                  <SimpleGrid columns={1} gap={2}>
                    {/* Campo único — authorizer_uuid, required, Select comum
                        + useQuery (lista SEM paginação/busca, CL-043). */}
                    <Controller
                      name="authorizer_uuid"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Select
                          name={field.name}
                          label={authorizerText.fields.authorizer}
                          placeholder={authorizerText.placeholders.authorizer}
                          error={fieldState.error?.message as string | undefined}
                          options={eligibleOptions}
                          value={field.value ?? null}
                          onChange={(option) => field.onChange(option ?? null)}
                          isRequired
                          isDisabled={sendMutation.isPending || isListEmpty}
                          loading={eligibleQuery.isFetching}
                          disablePortal
                        />
                      )}
                    />

                    {isListEmpty && (
                      <Text fontSize="sm" color="fg.muted">
                        {authorizerText.emptyEligibleState.description}
                      </Text>
                    )}
                  </SimpleGrid>
                )}
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
                  title={authorizerText.sendButton}
                  type="submit"
                  loading={sendMutation.isPending}
                  disabled={isSubmitDisabled}
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
