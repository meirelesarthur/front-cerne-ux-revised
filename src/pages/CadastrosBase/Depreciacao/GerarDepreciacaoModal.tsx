// src/pages/CadastrosBase/Depreciacao/GerarDepreciacaoModal.tsx
// -----------------------------------------------------------------------------
// Modal "Gerar Depreciação" (Depreciation — execução 027, TASK-FE-846),
// aberto pelo botão "Gerar" do `HeaderTable.tsx` (TASK-FE-845). Única ação de
// ESCRITA de todo o módulo — `year`/`month` (obrigatórios) + `type`
// (Equipamento/Animal/Ambos, default = domínio da aba ativa no momento em
// que o modal abriu, prop `defaultType`).
//
// Casca `Dialog` v3 headless mirror `DeleteConfirmDialog.tsx`/
// `ModalAction/index.tsx` (mesmos `@ts-ignore` de tipos ainda incompatíveis
// da versão instalada), adaptada para FORMULÁRIO em vez de confirmação
// simples: `<Form noPadding>` envolve `Dialog.Body` (campos) + `Dialog.Footer`
// (Cancelar/Gerar), `handleSubmit(onSubmit)` no `onSubmit` do `<form>`.
//
// `Select` de `month`/`type` usa `disablePortal` (`Form/Select.tsx`, "use
// quando o Select está dentro de modais/dialogs") — 1ª vez que este projeto
// usa a prop, necessária aqui porque o menu portalizado no <body> escaparia
// da pilha de empilhamento (z-index) do `Dialog`.
//
// A mutação (`useGenerateDepreciation`, TASK-FE-843) é instanciada no
// `index.tsx` e recebida via prop `mutation` — decisão já sinalizada na
// Tarefa ("evita recriar o hook a cada abertura do modal — preferível"), e
// necessária porque o `onSuccess` fecha o modal via `onClose` do PRÓPRIO
// `index.tsx` (estado do `useDisclosure` mora lá).
//
// 422 de regra de negócio (competência atual/futura, já gerado — contrato de
// API §4c) NÃO é tratado aqui — cai no `onError` padrão do `useRequest`
// (toast com a `message` do backend, ver `useGenerateDepreciation`). O modal
// só fecha/reseta no `actionSuccess` da mutação (via `unmountOnExit`, um
// novo form nasce a cada abertura com `defaultType` corrente) — nunca
// otimisticamente.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { depreciationMonthOptions } from '@/constants/Depreciations/options/depreciation-month-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import { depreciationGenerateType } from '@/@types/v2/Depreciations';
import type {
  DepreciationGeneratePayload,
  DepreciationGenerateType,
} from '@/@types/v2/Depreciations';

import type { useGenerateDepreciation } from './useDepreciacao';

export interface GerarDepreciacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Domínio da aba ativa no `index.tsx` no momento em que o modal abriu. */
  defaultType: DepreciationGenerateType;
  languageGB: LanguageDate;
  /** Instanciada no `index.tsx` (TASK-FE-843) — evita recriar o hook a cada
   *  abertura do modal (comentário da Tarefa). */
  mutation: ReturnType<typeof useGenerateDepreciation>;
}

interface GerarDepreciacaoFormValues {
  year?: string;
  month: Option<number> | null;
  type: Option<DepreciationGenerateType> | null;
}

export function GerarDepreciacaoModal({
  isOpen,
  onClose,
  defaultType,
  languageGB,
  mutation,
}: GerarDepreciacaoModalProps) {
  const text = languageGB.depreciations.generateModal;

  const typeOptions: Option<DepreciationGenerateType>[] = [
    { value: depreciationGenerateType.equipment, label: text.typeOptions.equipment },
    { value: depreciationGenerateType.animal, label: text.typeOptions.animal },
    { value: depreciationGenerateType.all, label: text.typeOptions.all },
  ];

  function buildDefaultValues(): GerarDepreciacaoFormValues {
    return {
      year: '',
      month: null,
      type: typeOptions.find((option) => option.value === defaultType) ?? typeOptions[0],
    };
  }

  const { control, register, handleSubmit, reset, watch } = useForm<GerarDepreciacaoFormValues>({
    defaultValues: buildDefaultValues(),
  });

  // Ressincroniza `type` com o domínio da aba ativa a cada (re)abertura —
  // `unmountOnExit` na casca do `Dialog` já garante um form novo a cada
  // abertura, mas o reset explícito é defensivo (mesma cautela do
  // `FilterSideDepreciacao`, TASK-FE-844 — deps SOMENTE `[isOpen]`).
  useEffect(() => {
    if (!isOpen) return;

    reset(buildDefaultValues());
  }, [isOpen]);

  // Validação client-side MÍNIMA (DoD) — `year`/`month`/`type` obrigatórios;
  // sem `errors.field.message` dedicado (nenhuma chave de i18n nova prevista
  // pelo contrato para isto) — o botão de submit fica desabilitado até os 3
  // estarem preenchidos, e o `onSubmit` reforça a guarda (defesa contra
  // Enter em um input com o botão desabilitado).
  const yearValue = watch('year');
  const monthValue = watch('month');
  const typeValue = watch('type');
  const canSubmit = !!yearValue && !!monthValue && !!typeValue;

  function onSubmit(data: GerarDepreciacaoFormValues) {
    if (!data.year || !data.month || !data.type) return;

    const payload: DepreciationGeneratePayload = {
      year: Number(data.year),
      month: data.month.value,
      type: data.type.value,
    };

    mutation.mutate(payload);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) onClose();
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

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Input
                    label={text.fields.year}
                    placeholder="ex.: 2026"
                    type="number"
                    isRequired
                    disabled={mutation.isPending}
                    {...register('year')}
                  />

                  <Controller
                    name="month"
                    control={control}
                    render={({ field: { name, value, onChange } }) => (
                      <Select
                        label={text.fields.month}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={depreciationMonthOptions.options(languageGB)}
                        isRequired
                        isDisabled={mutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="type"
                    control={control}
                    render={({ field: { name, value, onChange } }) => (
                      <Select
                        label={text.fields.type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={typeOptions}
                        isRequired
                        isDisabled={mutation.isPending}
                        noClearable
                        disablePortal
                      />
                    )}
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={mutation.isPending}
                />
                <Button
                  title={text.submit}
                  type="submit"
                  loading={mutation.isPending}
                  disabled={!canSubmit}
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
