// src/pages/Fiscal/CteManifestacao/ManifestarDesacordoDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Manifestar desacordo" (CteManifestacao — domínio Fiscal, execução
// 045, Onda 2, TASK-CTE-FE-13, `E18 POST /cte-manifestacoes/{uuid}/
// manifestar`, S45-S47, D27-D29). Padrão 14 (`get_pwa_complex_screen_
// compositions_pattern`) — Dialog v3 completo, mirror ESTRUTURAL
// `Fiscal/Dfe/DfeManifestModal.tsx` (mesmo domínio, mesmo tipo de ação),
// simplificado: único campo visível é `justificativa` — `evento` é fixo `1`
// (LK22, único evento suportado pelo domínio, `App\Enums\CteManifestaTipo`),
// enviado implicitamente no submit, nunca exposto como Select.
//
// Mutação: `useRequest` (mirror `get_pwa_mutation_query_pattern`, regra
// "submissão de formulário completo → sempre `useRequest`") — a mensagem de
// sucesso é ESTÁTICA (`text.successMessage`, mirror `ApiResponse::success`
// do backend: "Desacordo manifestado com sucesso."), sem contagem dinâmica.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Textarea } from '@/components/Form/Textarea';

import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { cteManifestacaoDesacordoSchemaResolver } from '@/validations/schemas/Fiscal/cte-manifestacao-desacordo-schema';

import { manifestarDesacordo } from '@/services/v2/Fiscal/cte-manifestacao-service';

import type { LanguageDate } from '@/@types/language';
import type { ManifestarDesacordoFormValues } from '@/@types/v2/Fiscal/cteManifestacao';

export interface ManifestarDesacordoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid da `ManifestaCte` selecionada na grid — `null` enquanto fechado
   *  (limpo pelo caller ao fechar, mirror `DeleteConfirmDialog`/`toDelete`). */
  manifestacaoUuid: string | null;
  languageGB: LanguageDate;
}

const MANIFESTAR_FORM_ID = 'cte-manifestacao-desacordo-form';

export function ManifestarDesacordoDialog({
  isOpen,
  onClose,
  manifestacaoUuid,
  languageGB,
}: ManifestarDesacordoDialogProps) {
  const text = languageGB.cteManifestacoes.cteManifestacao.manifestarDialog;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManifestarDesacordoFormValues>({
    mode: 'onChange',
    resolver: cteManifestacaoDesacordoSchemaResolver(languageGB),
    defaultValues: { justificativa: '' },
  });

  useEffect(() => {
    if (isOpen) reset({ justificativa: '' });
  }, [isOpen]);

  // Lei 3 — wrapper nomeado: `evento` fixo `1` enviado implicitamente, nunca
  // exposto como Select (LK22, única opção suportada pelo domínio).
  async function tryManifestarDesacordo(data: ManifestarDesacordoFormValues) {
    if (!manifestacaoUuid) return undefined;
    return manifestarDesacordo(manifestacaoUuid, { evento: 1, justificativa: data.justificativa });
  }

  const manifestMutation = useRequest({
    asyncFunction: tryManifestarDesacordo,
    typesRequest: 'apply',
    entityName: languageGB.cteManifestacoes.cteManifestacao.singularLabel,
    personalizedMessage: text.successMessage,
    queryKey: queryKey.cteManifestacoes.cteManifestacoesList,
    actionSuccess: () => {
      handleClose();
    },
  });

  function handleClose() {
    reset({ justificativa: '' });
    onClose();
  }

  function onSubmit(data: ManifestarDesacordoFormValues) {
    manifestMutation.mutate(data);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !manifestMutation.isPending) handleClose();
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
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Form id={MANIFESTAR_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.description}
                  </Text>

                  <Textarea
                    label={text.justificativa}
                    placeholder={text.justificativaPlaceholder}
                    isRequired
                    error={errors.justificativa?.message}
                    disabled={manifestMutation.isPending}
                    {...register('justificativa')}
                  />
                </VStack>
              </Form>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={manifestMutation.isPending}
              />
              <Button
                title={text.submitButton}
                type="submit"
                form={MANIFESTAR_FORM_ID}
                loading={manifestMutation.isPending}
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

export default ManifestarDesacordoDialog;
