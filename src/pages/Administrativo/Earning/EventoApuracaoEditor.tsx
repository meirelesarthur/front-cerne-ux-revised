// src/pages/Administrativo/Earning/EventoApuracaoEditor.tsx
// -----------------------------------------------------------------------------
// Editor de linhas dinâmicas de EVENTOS da Apuração Mensal (Earning —
// Administrativo, 97-Esteiras/002, Tarefa 08). Mirror ESTRUTURAL de
// `Adiantamento/InstallmentsFieldArray.tsx` (`useFieldArray` + soma reativa
// via `watch`) — referência visual `RepeaterList`/`AllocationEditor`
// (`GB.Cerne.UX`, `GAP-EARNING-FE-01`).
//
// Cada linha: select de evento (`listEvents`, `GET /events` — NÃO
// `/events/options`, ver `GAP-EARNING-FE-04`: o lookup enxuto não expõe
// `condition`, necessário para o sinal da soma de `total`) + valor editável
// SE `method === 1` (Informado) + condição READONLY derivada do evento
// (Diminui/Soma) + botão remover (bloqueado se restar só 1 linha, mirror
// `SRH-10`). Duplicidade de evento entre linhas é validada no schema
// (`earning-schema.ts`), este componente só exibe o erro.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useRef } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, FieldErrors, useController, useFieldArray, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { listEvents } from '@/services/v2/Events/event-service';
import type { ListEventsParams } from '@/services/v2/Events/event-service';

import type { EarningEventFormRow, EarningUpsertForm } from '@/@types/v2/Earnings';
import type { EventListItem } from '@/@types/v2/Events';

export interface EventoApuracaoEditorProps {
  control: Control<EarningUpsertForm>;
  errors: FieldErrors<EarningUpsertForm>;
  disabled?: boolean;
  /**
   * Valores de "Funcionário X Eventos" (`EmployeeEvent`, `useEmployeeEventValueMap`)
   * do funcionário desta apuração, chave = uuid do EVENTO — usado só para
   * pré-popular (readonly) o `value` de linhas método FIXO ao adicionar
   * manualmente (`GAP-EARNING-FE-05` [AVALIADO], Opção A). `undefined`/Map
   * vazio → degrada graciosamente para o comportamento anterior (nasce 0).
   */
  employeeEventValues?: Map<string, number>;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const findEnabledEventsParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_enabled: true as const,
});

interface EventRowProps {
  control: Control<EarningUpsertForm>;
  index: number;
  remove: (index: number) => void;
  disabled: boolean;
  canRemove: boolean;
  otherRowsEventUuids: string[];
  employeeEventValues?: Map<string, number>;
}

function EventRow({
  control,
  index,
  remove,
  disabled,
  canRemove,
  otherRowsEventUuids,
  employeeEventValues,
}: EventRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.earnings.earning.form.eventRow;

  // Cache local (`uuid` -> registro completo do `EventListItem`) — o
  // `mapOptions` do `SelectAsyncPaginate` só devolve `{label,value}` ao
  // `onChange`; `method`/`condition`/`condition_label` (necessários aqui)
  // vêm da MESMA resposta que popula o dropdown, sem endpoint novo — mirror
  // `RequisitionItemsEditor.tsx::stockCacheRef`.
  const eventCacheRef = useRef(new Map<string, EventListItem>());

  const { field: eventField, fieldState: eventFieldState } = useController({
    control,
    name: `events.${index}.event`,
  });
  const { field: eventUuidField } = useController({ control, name: `events.${index}.event_uuid` });
  const { field: methodField } = useController({ control, name: `events.${index}.method` });
  const { field: conditionField } = useController({ control, name: `events.${index}.condition` });
  const { field: conditionLabelField } = useController({
    control,
    name: `events.${index}.conditionLabel`,
  });
  const { field: valueField, fieldState: valueFieldState } = useController({
    control,
    name: `events.${index}.value`,
  });
  const { field: isPersistedField } = useController({
    control,
    name: `events.${index}.isPersisted`,
  });

  // UT-000716 item 10 — CORREÇÃO (mirror legado EXATO, `earnings/edit.
  // blade.php:104/250`: Valor é `->readonly($event->method == 2)`, isto é,
  // readonly SÓ quando método é Fixo, EDITÁVEL quando Informado — mesmo em
  // linha pré-existente). `isRowLocked` (linha vinda de uma apuração JÁ
  // persistida, `isPersisted === true` setado em `fillForm`,
  // `CreateOrUpdateEarning.tsx`) trava SÓ a ESTRUTURA — qual evento está
  // selecionado — preservando a "edição PARCIAL de valores" que é o
  // objetivo central desta UT: o usuário pode corrigir o Valor de uma
  // linha já salva, só não pode trocar o Evento dela. Linhas adicionadas
  // manualmente NESTA sessão (`handleAdd`, abaixo, nasce
  // `isPersisted: false`) permanecem totalmente editáveis (evento + valor).
  const isRowLocked = Boolean(isPersistedField.value);
  const isValueEditable = methodField.value === 1;

  const listRowEvents = useCallback(async (params: ListEventsParams) => {
    const response = await listEvents(params);
    response.data.items.forEach((item) => eventCacheRef.current.set(item.uuid, item));
    return response;
  }, []);

  function handleEventChange(option: any) {
    if (option && otherRowsEventUuids.includes(option.value)) {
      toaster.error({
        title: languageGB.earnings.earning.singularLabel,
        description: languageGB.earnings.earning.form.validation.duplicateEvent,
      });
      return;
    }

    eventField.onChange(option ?? null);
    eventUuidField.onChange(option?.value ?? '');

    const event = option ? eventCacheRef.current.get(option.value) : undefined;
    methodField.onChange(event?.method ?? null);
    conditionField.onChange(event?.condition ?? null);
    conditionLabelField.onChange(event?.condition_label ?? '');
    // `method === 0` (Fixo) não tem valor editável pelo usuário. `GAP-EARNING-
    // FE-05` [AVALIADO], Opção A — pré-popula (readonly) com o valor
    // configurado em "Funcionário X Eventos" (`EmployeeEvent`) para este
    // funcionário+evento, mirror do legado (`earnings/create.blade.php`, que
    // sempre carregava `item.value` do vínculo). Sem vínculo configurado →
    // `employeeEventValues?.get` retorna `undefined` → degrada graciosamente
    // para o comportamento anterior (nasce 0, sem crash).
    if (event?.method === 0) {
      const configuredValue = option ? employeeEventValues?.get(option.value) : undefined;
      valueField.onChange(configuredValue ?? valueField.value ?? 0);
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="2" minW="220px">
        <SelectAsyncPaginate
          name={eventField.name}
          label={text.event}
          service={listRowEvents}
          mapOptions={(item: EventListItem) => ({ label: item.name, value: item.uuid })}
          findParams={findEnabledEventsParams}
          value={eventField.value ?? null}
          onChange={(option: any) => handleEventChange(option)}
          error={eventFieldState.error?.message}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isRequired
          isDisabled={disabled || isRowLocked}
        />
      </Box>

      <Box w={{ base: 'full', sm: '160px' }}>
        <InputReadOnly
          name={conditionLabelField.name}
          label={text.condition}
          value={conditionLabelField.value || '—'}
        />
      </Box>

      <Box w={{ base: 'full', sm: '160px' }}>
        {isValueEditable ? (
          <NumberInput
            name={valueField.name}
            label={text.value}
            allowDot
            decimalPlaces={2}
            value={valueField.value ?? null}
            onValueChange={(value) => valueField.onChange(value)}
            error={valueFieldState.error?.message}
            isRequired
            disabled={disabled}
          />
        ) : (
          <InputReadOnly
            name={valueField.name}
            label={text.value}
            value={formatCurrencyBRL(Number(valueField.value) || 0)}
          />
        )}
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeButton}
        </Flex>
        <IconButtonTable
          type="button"
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled || !canRemove}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

export function EventoApuracaoEditor({
  control,
  errors,
  disabled = false,
  employeeEventValues,
}: EventoApuracaoEditorProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.earnings.earning.form.eventRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'events' });

  const arrayError = (errors as any)?.events?.message as string | undefined;

  const watchedEvents = useWatch({ control, name: 'events' }) ?? [];

  // Soma reativa — mirror CV-01 (mesmo sinal usado pelo cálculo de `total`
  // no `CreateOrUpdateEarning.tsx`), só para EXIBIÇÃO do total dos eventos
  // aqui dentro; o total real do formulário é computado no componente PAI.
  const eventsTotal = watchedEvents.reduce((sum: number, row: EarningEventFormRow) => {
    const value = Number(row?.value) || 0;
    const signed = row?.condition === 0 ? -value : value;
    return sum + signed;
  }, 0);

  const handleAdd = useCallback(() => {
    append({
      event: null,
      event_uuid: '',
      value: null,
      method: null,
      condition: null,
      conditionLabel: '',
      // UT-000716 item 10 — linha adicionada manualmente NESTA sessão,
      // sempre totalmente editável (mirror legado).
      isPersisted: false,
    });
  }, [append]);

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {languageGB.earnings.earning.form.sections.events}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.totalLabel}:
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {formatCurrencyBRL(eventsTotal)}
          </Text>
        </Flex>
      </Flex>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const otherRowsEventUuids = watchedEvents
              .filter((_: unknown, otherIndex: number) => otherIndex !== index)
              .map((row: EarningEventFormRow) => row?.event_uuid)
              .filter((uuid: string | undefined): uuid is string => !!uuid);

            return (
              <EventRow
                key={field.id}
                control={control}
                index={index}
                remove={remove}
                disabled={disabled}
                canRemove={fields.length > 1}
                otherRowsEventUuids={otherRowsEventUuids}
                employeeEventValues={employeeEventValues}
              />
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default EventoApuracaoEditor;
