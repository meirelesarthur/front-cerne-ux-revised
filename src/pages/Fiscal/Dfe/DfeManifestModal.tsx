// src/pages/Fiscal/Dfe/DfeManifestModal.tsx
// -----------------------------------------------------------------------------
// Modal de Manifestação SEFAZ (individual/lote) da Dfe — domínio Fiscal,
// execução 044, TASK-DFE-FE-06. `Dialog` v3 (`lazyMount`+`unmountOnExit`),
// mirror `Fiscal/NfeEmitidas/NfeMotivoModal.tsx` (casca do Dialog) +
// `Form id="dfe-manifest-form"` com submit EXTERNO no `Dialog.Footer` (mesmo
// mecanismo de formulário de página, `get_pwa_form_query_pattern`).
//
// Campos: `evento` (`Select`, LOOK-04, `disablePortal` OBRIGATÓRIO dentro de
// Dialog) + `justificativa` (`Textarea`, visível/obrigatória só para
// `evento∈{3,4}`, Yup `.when()` real — `dfeManifestSchemaResolver`,
// TASK-DFE-FE-03).
//
// DIV-03 preservada (`CONTRATO-TELA-DFE-FE.md §6.3`, `dfeManifestEventOptions
// .ts`): o modo LOTE nunca desabilita opções de evento por prazo (CALC-02/03
// só no modo INDIVIDUAL) — mirror exato do legado, NÃO corrigir sem decisão
// do dono.
//
// Mutação: `useRequest` (mirror `get_pwa_mutation_query_pattern`, regra
// "submissão de formulário completo → sempre `useRequest`") — a mensagem de
// sucesso é ESTÁTICA (`text.successMessage`, sem contagem dinâmica), então
// não se aplica a exceção de `useMutation` direto usada em `BuscarDfe.tsx`
// (que precisa do delta sincronizado no próprio toast). `personalizedMessage`
// injeta o texto i18n; `actionSuccess` fecha o modal + notifica o caller.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';

import { useRequest } from '@/hooks/useRequest';

import { isDfeManifestEventDisabled } from '@/utils/dfeManifestEventOptions';

import { DfeManifestEventValue } from '@/constants/Fiscal/dfe/dfe-manifest-event';
import { dfeManifestEventOptions } from '@/constants/Fiscal/dfe/options/dfe-manifest-event-options';
import { queryKey } from '@/constants/query-key';

import { dfeManifestSchemaResolver } from '@/validations/schemas/Fiscal/dfe-manifest-schema';

import { manifestDfes } from '@/services/v2/Fiscal/dfe-service';

import type { LanguageDate } from '@/@types/language';
import type { DfeManifestFormValues, DfeManifestPayload } from '@/@types/v2/Fiscal/dfe';

export interface DfeManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuids selecionados na grid — 1 (individual) ou 2..20 (lote,
   *  `TASK-DFE-FE-05 §rowSelection`). */
  dfeUuids: string[];
  /** `data_emissao` da Dfe individual, para CALC-02/03 (`dfeManifestEventOptions`)
   *  — SÓ relevante/lida no modo individual (DIV-03: lote nunca desabilita). */
  singleDfeDataEmissao?: string;
  languageGB: LanguageDate;
  onSuccess: () => void;
}

const DFE_MANIFEST_FORM_ID = 'dfe-manifest-form';

export function DfeManifestModal({
  isOpen,
  onClose,
  dfeUuids,
  singleDfeDataEmissao,
  languageGB,
  onSuccess,
}: DfeManifestModalProps) {
  const text = languageGB.dfes.dfe.manifest;

  const mode = dfeUuids.length > 1 ? 'lote' : 'individual';

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DfeManifestFormValues>({
    mode: 'onChange',
    resolver: dfeManifestSchemaResolver(languageGB),
    defaultValues: { evento: null, justificativa: '' },
  });

  const eventoSelecionado = watch('evento');
  const mostraJustificativa = eventoSelecionado?.value === 3 || eventoSelecionado?.value === 4;

  // CALC-02/CALC-03 (DIV-03: só no modo individual) — options com `disabled`
  // computado por prazo, mirror `dfeManifestEventOptions.ts`.
  const eventoOptions = useMemo(() => {
    const baseOptions = dfeManifestEventOptions.options(languageGB);
    if (mode !== 'individual' || !singleDfeDataEmissao) return baseOptions;

    return baseOptions.map((option) => ({
      ...option,
      disabled: isDfeManifestEventDisabled(
        option.value as DfeManifestEventValue,
        singleDfeDataEmissao,
        'individual'
      ),
    }));
  }, [languageGB, mode, singleDfeDataEmissao]);

  useEffect(() => {
    if (isOpen) reset({ evento: null, justificativa: '' });
  }, [isOpen]);

  const manifestMutation = useRequest<null>({
    asyncFunction: (payload: DfeManifestPayload) => manifestDfes(payload),
    typesRequest: 'apply',
    entityName: languageGB.dfes.dfe.pluralLabel,
    personalizedMessage: text.successMessage,
    queryKey: queryKey.dfes.dfesList,
    actionSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  function handleClose() {
    reset({ evento: null, justificativa: '' });
    onClose();
  }

  function onSubmit(data: DfeManifestFormValues) {
    if (!data.evento) return;

    manifestMutation.mutate({
      dfe_uuids: dfeUuids,
      evento: data.evento.value,
      // Justificativa só é enviada quando aplicável — o schema já garante
      // presença/tamanho mínimo quando `evento∈{3,4}` (Yup `.when()`).
      justificativa: mostraJustificativa ? data.justificativa : undefined,
    });
  }

  const title =
    mode === 'lote'
      ? text.modalTitleBatch.replace('{{count}}', String(dfeUuids.length))
      : text.modalTitle;

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
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Form id={DFE_MANIFEST_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.description}
                  </Text>

                  <Controller
                    name="evento"
                    control={control}
                    render={({ field: { name, value, onChange } }) => (
                      <Select
                        name={name}
                        label={text.fields.evento}
                        placeholder={text.fields.eventoPlaceholder}
                        value={value}
                        onChange={onChange}
                        options={eventoOptions}
                        error={errors.evento?.message as string | undefined}
                        isRequired
                        disablePortal
                        isDisabled={manifestMutation.isPending}
                        tooltip={mode === 'individual' ? text.deadlineDisabledHint : undefined}
                      />
                    )}
                  />

                  {mostraJustificativa && (
                    <Textarea
                      label={text.fields.justificativa}
                      placeholder={text.fields.justificativaPlaceholder}
                      isRequired
                      error={errors.justificativa?.message}
                      disabled={manifestMutation.isPending}
                      {...register('justificativa')}
                    />
                  )}
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
                title={text.confirmButton}
                type="submit"
                form={DFE_MANIFEST_FORM_ID}
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
