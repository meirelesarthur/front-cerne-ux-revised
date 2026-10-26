// src/pages/CadastrosBase/Rebanho/AnimalReproductiveStatusDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de ação em lote — Status Reprodutivo (Tarefa 28, Gestão Animais —
// feature 3596a556, AM-08). Aplica `reproductive_status` em massa aos animais
// selecionados na grid do Rebanho, com as duas datas de gestação quando
// "Prenha" (`CLM-34`, cálculo bidirecional de 280 dias) e a regra `CLM-37`
// (status ≠ Prenha → datas omitidas, o servidor já zera).
//
// `useMutation` DIRETO (não `useRequest`) — decisão deliberada, não desvio: o
// toast de sucesso precisa da contagem REAL devolvida pelo servidor
// (`data.data.updated`), que diverge de `selectedUuids.length` quando um uuid
// não resolve (outra fazenda, ou animal que deixou de ser `ACTIVE` entre o
// carregamento da grid e o clique). `useRequest` resolve a mensagem do toast
// de forma estática no momento da chamada — não há como injetar um valor
// só conhecido na resposta. Mesmo precedente já em produção nesta MESMA tela
// (`VendaAnimaisList.deleteMutation`, `Operacional/VendaAnimais/index.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, parseISO, subDays } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Select } from '@/components/Form/Select';
import { Dialog } from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';

import { reproductiveStatusOptions } from '@/constants/pecuaria/animal/options/reproductive-status-options';
import { queryKey } from '@/constants/query-key';

import { updateAnimalsReproductiveStatusMany } from '@/services/v2/Animals/animal-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  AnimalReproductiveStatus,
  UpdateAnimalsReproductiveStatusManyPayload,
} from '@/@types/v2/Animals';

/**
 * CLM-34 — gestação bovina assumida pelo legado
 * (`update_animal_reproductive_status.blade.php:62-101`). A constante vive
 * só no cliente; nenhum helper do servidor a conhece.
 */
const GESTATION_DAYS = 280;

interface ReproductiveStatusFormValues {
  reproductive_status: Option<AnimalReproductiveStatus> | null;
  /** `yyyy-MM-dd` (valor nativo de `<input type="date">`) ou `''`. */
  pregnancy_date: string;
  birth_forecast: string;
}

const defaultFormValues: ReproductiveStatusFormValues = {
  reproductive_status: null,
  pregnancy_date: '',
  birth_forecast: '',
};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface AnimalReproductiveStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUuids: string[];
  languageGB: LanguageDate;
  /** Chamado após sucesso — o pai fecha o diálogo e limpa a seleção. */
  onSuccess: () => void;
}

export function AnimalReproductiveStatusDialog({
  isOpen,
  onClose,
  selectedUuids,
  languageGB,
  onSuccess,
}: AnimalReproductiveStatusDialogProps) {
  const text = languageGB.animals.animal;
  const dialogText = text.dialogs.reproductiveStatus;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, setValue, watch } = useForm<ReproductiveStatusFormValues>({
    defaultValues: defaultFormValues,
  });

  const watchedStatus = watch('reproductive_status');
  const watchedPregnancyDate = watch('pregnancy_date');
  const watchedBirthForecast = watch('birth_forecast');
  const isPregnant = watchedStatus?.value === 1;

  // Reabrir sempre parte de um estado limpo — é uma ação transitória, não um
  // formulário com dado a re-hidratar.
  useEffect(() => {
    if (!isOpen) return;
    reset(defaultFormValues);
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateAnimalsReproductiveStatusManyPayload) =>
      updateAnimalsReproductiveStatusMany(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animalsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animal] });
      toaster.success({
        title: text.pluralLabel,
        description: dialogText.successMessage.replace('{count}', String(response.data.updated)),
        duration: 7000,
      });
      reset(defaultFormValues);
      onSuccess();
    },
    onError: (error) => {
      toaster.error({
        title: text.pluralLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  function onSubmit(data: ReproductiveStatusFormValues) {
    if (!data.reproductive_status) return;
    const payload: UpdateAnimalsReproductiveStatusManyPayload = {
      uuids: selectedUuids,
      reproductive_status: data.reproductive_status.value,
    };
    // CLM-37/SE-07 — status ≠ Prenha: NÃO enviar as datas (o servidor já as
    // zera; mandar `null`/string vazia arrisca 422 no `date_format`).
    if (data.reproductive_status.value === 1) {
      payload.pregnancy_date = formatDate(data.pregnancy_date);
      payload.birth_forecast = formatDate(data.birth_forecast);
    }
    mutation.mutate(payload);
  }

  const canSubmit =
    !!watchedStatus && (!isPregnant || (!!watchedPregnancyDate && !!watchedBirthForecast));

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{dialogText.title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <form id="animal-reproductive-status-form" onSubmit={handleSubmit(onSubmit)}>
            <VStack align="stretch" gap={4}>
              <Text>
                {dialogText.countTemplate.replace('{count}', String(selectedUuids.length))}
              </Text>

              <Controller
                name="reproductive_status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.form.fields.reproductiveStatus}
                    name={name}
                    placeholder={text.form.placeholders.reproductiveStatus}
                    options={reproductiveStatusOptions.options(languageGB)}
                    value={value}
                    onChange={(opt: Option<AnimalReproductiveStatus> | null) => {
                      onChange(opt);
                      if (opt?.value === 1) {
                        const today = new Date();
                        setValue('pregnancy_date', toDateInputValue(today), {
                          shouldValidate: true,
                        });
                        setValue(
                          'birth_forecast',
                          toDateInputValue(addDays(today, GESTATION_DAYS)),
                          { shouldValidate: true }
                        );
                      } else {
                        setValue('pregnancy_date', '', { shouldValidate: true });
                        setValue('birth_forecast', '', { shouldValidate: true });
                      }
                    }}
                    disablePortal
                    noClearable
                    isRequired
                  />
                )}
              />

              {isPregnant && (
                <>
                  <Controller
                    name="pregnancy_date"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        label={dialogText.pregnancyDate}
                        value={field.value ?? null}
                        onChange={(value) => {
                          field.onChange(value ?? '');
                          if (value) {
                            setValue(
                              'birth_forecast',
                              toDateInputValue(addDays(parseISO(value), GESTATION_DAYS)),
                              { shouldValidate: true }
                            );
                          }
                        }}
                        isRequired
                      />
                    )}
                  />

                  <Controller
                    name="birth_forecast"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        label={dialogText.birthForecast}
                        value={field.value ?? null}
                        onChange={(value) => {
                          field.onChange(value ?? '');
                          if (value) {
                            setValue(
                              'pregnancy_date',
                              toDateInputValue(subDays(parseISO(value), GESTATION_DAYS)),
                              { shouldValidate: true }
                            );
                          }
                        }}
                        isRequired
                      />
                    )}
                  />
                </>
              )}
            </VStack>
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              onClick={onClose}
              disabled={mutation.isPending}
            />
          </Dialog.ActionTrigger>
          <Button
            type="submit"
            form="animal-reproductive-status-form"
            title={dialogText.submitButton}
            loading={mutation.isPending}
            disabled={!canSubmit || mutation.isPending}
          />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
