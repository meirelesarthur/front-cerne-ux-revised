// src/pages/Operacional/Appropriations/tabs/AppropriationLaborTab.tsx
// -----------------------------------------------------------------------------
// Aba "MO/Serviços" (mão de obra "3-em-1": Funcionário/Função/Prestador) —
// TASK-FE-2708. `useFieldArray` de `labor_items`, mirror
// `EquipamentoRateioCentroCustoTab.tsx`/`InvoiceItemsTab.tsx` (linha própria
// + `SelectAsyncPaginate`/`NumberInput`/`Select` + botão remover).
//
// "Executador" muda de catálogo conforme "Tipo" (`LaborType`): `EMPLOYEE`
// (1) → `listEmployees`; `FUNCTION` (2) → `listFunctionOptions`; `PROVIDER`
// (3) → `listProviders`. Ao trocar o "Tipo" de uma linha já preenchida, os 3
// campos `employee_uuid`/`function_uuid`/`provider_uuid` são limpos (só um
// pode estar preenchido — mirror `required_if` do backend).
//
// TASK-FE-686 (AP-30, execução 034, 5ª leva — GAP-BE-650/TASK-BE-1017, JÁ
// ENTREGUE) — o card passa a mudar de LAYOUT conforme "Tipo de Pagamento"
// (`type_payment`), mirror 1:1 do legado (`_card_service.blade.php:21-39` +
// `_services.blade.php:116-145`, toggle client-side de visibilidade):
// - Ordem dos campos passa a espelhar o legado: Tipo → Executador → Un.
//   Medida → Tipo de Pagamento → Qtd/ha → Qtd Total → Vl. Unitário → Vl.
//   Total (era Tipo → Executador → Un. Medida → Qtd/ha → Tipo de Pagamento →
//   Qtd Total).
// - Modo "Qtd/ha" (`Q`, default): mostra Qtd/ha (editável) + Qtd Total
//   (editável); esconde Vl. Unitário/Vl. Total.
// - Modo "Valor" (`V`): esconde Qtd/ha; mostra Qtd Total (editável) + Vl.
//   Unitário (novo `Controller`+`NumberInput`) + Vl. Total (novo
//   `InputReadOnly`, calculado ao vivo).
// - "Qtd Total" (`total_quantity`) deixa de ser só informativa/derivada
//   (TASK-FE-602/AP-03) — passa a ser um `Controller`+`NumberInput`
//   EDITÁVEL, com DEFAULT `= quantity × used_area` (mirror
//   `AppropriationStockTab.tsx`) recalculado ao vivo ENQUANTO o usuário não
//   editar manualmente esta linha (`totalQuantityTouchedRef`, extraído para
//   `LaborItemRow` — 1 componente por linha, mesmo racional de
//   `ProductionItemRow`/`InvoiceItemRow`: `useEffect`/`useRef` por linha
//   violaria as Rules of Hooks dentro do `.map()` do array). Idioma "default
//   sugerido, editável" mirror `InvoiceItemsTab.tsx`
//   (`skipNextTotalFlash`/`isFirstRender`).
// - "Vl. Total" (`total_amount`) NUNCA é campo RHF — é sempre
//   `InputReadOnly` calculado ao vivo (`total_quantity × amount`),
//   recomputado de novo no payload de submit
//   (`CreateOrUpdateAppropriation.tsx`), mirror EXATO do padrão já usado
//   para "V.Total" de Produção (`total`, TASK-FE-660).
// - Contrato de escrita (`AppropriationLaborItemPayload`) ganhou os 3 campos
//   opcionais/aditivos (`total_quantity`/`amount`/`total_amount`, Opção A do
//   Gap — servidor grava cru, sem recomputar).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { Option } from '@/@types/option';
import type { AppropriationForm, LaborTypeValue } from '@/@types/v2/Appropriations';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { MeasurementOption } from '@/@types/v2/Measurements';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface AppropriationLaborTabProps {
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isLoading: boolean;
  canSave: boolean;
  // TASK-FE-610/AP-09 — banner "≥1 item" agora lido de estado do componente
  // pai (setado só no onSubmit), não mais de `errors.labor_items?.message`.
  itemsError: string | null;
  /** TASK-FE-732 (execução 034/035, GAP-BE-655) — `true` só na Finalização
   *  (`FinishAppropriation.tsx`, TASK-FE-737): Tipo/Executador/Un.Medida
   *  (identidade da linha, `_card_service_edit.blade.php:8,16,19`
   *  `->readonly()`) renderizam como `InputReadOnly` em vez do controle
   *  interativo. Qtd/ha, Qtd Total, Vl. Unitário/Total continuam editáveis
   *  nos 2 modos — fora da máscara. Default `false`/`undefined` preserva
   *  `CreateOrUpdateAppropriation.tsx` (create/edit) 100% inalterado. */
  lockIdentityFields?: boolean;
  /** TASK-FE-732 — `true` esconde "+ Adicionar Item" e a lixeira de remover
   *  linha (mirror legado — Finalização não permite incluir/remover item
   *  nesta aba). Default `false`/`undefined` preserva o comportamento
   *  atual. */
  hideRowActions?: boolean;
}

const LABOR_TYPE_EMPLOYEE = 1;
const LABOR_TYPE_FUNCTION = 2;
const LABOR_TYPE_PROVIDER = 3;

export function AppropriationLaborTab({
  control,
  watch,
  setValue,
  isLoading,
  canSave,
  itemsError,
  lockIdentityFields = false,
  hideRowActions = false,
}: AppropriationLaborTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'labor_items' });

  const isDisabled = !canSave || isLoading;

  const typeOptions: Option<LaborTypeValue>[] = [
    { value: LABOR_TYPE_EMPLOYEE, label: formText.labor.typeOptions.employee },
    { value: LABOR_TYPE_FUNCTION, label: formText.labor.typeOptions.function },
    { value: LABOR_TYPE_PROVIDER, label: formText.labor.typeOptions.provider },
  ];

  const paymentOptions: Option<'Q' | 'V'>[] = [
    { value: 'Q', label: formText.labor.paymentOptions.quantityPerHectare },
    { value: 'V', label: formText.labor.paymentOptions.value },
  ];

  function handleAdd() {
    append({
      type: null,
      employee_uuid: null,
      function_uuid: null,
      provider_uuid: null,
      measurement_uuid: null,
      quantity: null,
      type_payment: paymentOptions[0],
      // GAP-BE-650/TASK-FE-686 (AP-30) — shape completo desde a criação da
      // linha (mirror EXATO de `handleAdd` de Produção, `amount`/`total`).
      total_quantity: null,
      amount: null,
      total_amount: null,
    });
  }

  return (
    <Box pt={4}>
      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <LaborItemRow
              key={field.id}
              index={index}
              control={control}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              typeOptions={typeOptions}
              paymentOptions={paymentOptions}
              lockIdentityFields={lockIdentityFields}
              hideRowActions={hideRowActions}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      {!hideRowActions && (
        <Button
          title={formText.addItem}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isDisabled}
        />
      )}
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (1 componente por linha, mirror
// `ProductionItemRow`/`InvoiceItemRow`) para permitir o `useEffect`/`useRef`
// do default de "Qtd Total" sem violar Rules of Hooks dentro do `.map()`.
// -----------------------------------------------------------------------------

interface LaborItemRowProps {
  index: number;
  control: Control<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isDisabled: boolean;
  typeOptions: Option<LaborTypeValue>[];
  paymentOptions: Option<'Q' | 'V'>[];
  lockIdentityFields: boolean;
  hideRowActions: boolean;
  onRemove: () => void;
}

function LaborItemRow({
  index,
  control,
  watch,
  setValue,
  isDisabled,
  typeOptions,
  paymentOptions,
  lockIdentityFields,
  hideRowActions,
  onRemove,
}: LaborItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const rowType = watch(`labor_items.${index}.type`)?.value;
  const paymentType = watch(`labor_items.${index}.type_payment`)?.value;
  const isValuePayment = paymentType === 'V';

  const quantity = Number(watch(`labor_items.${index}.quantity`)) || 0;
  const usedArea = Number(watch('used_area')) || 0;
  const totalQuantity = Number(watch(`labor_items.${index}.total_quantity`)) || 0;
  const amount = Number(watch(`labor_items.${index}.amount`)) || 0;
  const liveTotalAmount = totalQuantity * amount;

  // GAP-BE-650/TASK-FE-686 (AP-30) — "Qtd Total" (`total_quantity`) ganha
  // DEFAULT `= quantity × used_area` recalculado ao vivo, mas para de
  // recalcular assim que o usuário editar manualmente ESTA linha (evita
  // sobrescrever edição manual a cada keystroke de "Qtd/ha"), mirror do
  // idioma "default sugerido, editável" já usado em `InvoiceItemsTab.tsx`
  // (`skipNextTotalFlash`/`isFirstRender`). `isFirstRender` também evita
  // sobrescrever o valor reidratado em modo edição no mount.
  const totalQuantityTouchedRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (totalQuantityTouchedRef.current) {
      return;
    }
    // TASK-FE-770 — no modo "Valor", "Qtd/ha" (`quantity`) fica oculto e
    // permanece 0; recalcular `total_quantity = quantity × usedArea` aqui
    // zeraria o valor hidratado/digitado manualmente. Só o modo "Qtd/ha"
    // recebe este default recomputado (TASK-FE-686/AP-30 preservado).
    if (isValuePayment) {
      return;
    }
    setValue(`labor_items.${index}.total_quantity`, quantity * usedArea, {
      shouldValidate: false,
    });
  }, [quantity, usedArea, isValuePayment]);

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        {/* Tipo — TASK-FE-732 (GAP-BE-655): identidade da linha, trava como
            `InputReadOnly` na Finalização (`lockIdentityFields=true`,
            mirror `_card_service_edit.blade.php:8` `->readonly()`). */}
        <Controller
          name={`labor_items.${index}.type`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.labor.fields.type}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <Select
                label={formText.labor.fields.type}
                placeholder={formText.labor.placeholders.type}
                name={rowField.name}
                value={rowField.value}
                onChange={(option: Option<LaborTypeValue> | null) => {
                  rowField.onChange(option ?? null);
                  setValue(`labor_items.${index}.employee_uuid`, null);
                  setValue(`labor_items.${index}.function_uuid`, null);
                  setValue(`labor_items.${index}.provider_uuid`, null);
                }}
                options={typeOptions}
                isRequired
                isDisabled={isDisabled}
              />
            )
          }
        />

        {rowType === LABOR_TYPE_EMPLOYEE && (
          <Controller
            name={`labor_items.${index}.employee_uuid`}
            control={control}
            render={({ field: rowField }) =>
              lockIdentityFields ? (
                <InputReadOnly
                  label={formText.labor.fields.executor}
                  value={rowField.value?.label ?? '—'}
                />
              ) : (
                <SelectAsyncPaginate
                  name={rowField.name}
                  label={formText.labor.fields.executor}
                  placeholder={formText.labor.placeholders.executor}
                  service={listEmployees}
                  mapOptions={(item: EmployeeListItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={rowField.value ?? undefined}
                  onChange={(option: any) => rowField.onChange(option ?? null)}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )
            }
          />
        )}

        {rowType === LABOR_TYPE_FUNCTION && (
          <Controller
            name={`labor_items.${index}.function_uuid`}
            control={control}
            render={({ field: rowField }) =>
              lockIdentityFields ? (
                <InputReadOnly
                  label={formText.labor.fields.executor}
                  value={rowField.value?.label ?? '—'}
                />
              ) : (
                <SelectAsyncPaginate
                  name={rowField.name}
                  label={formText.labor.fields.executor}
                  placeholder={formText.labor.placeholders.executor}
                  service={listFunctionOptions}
                  mapOptions={(item: FunctionOption) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={rowField.value ?? undefined}
                  onChange={(option: any) => rowField.onChange(option ?? null)}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )
            }
          />
        )}

        {rowType === LABOR_TYPE_PROVIDER && (
          <Controller
            name={`labor_items.${index}.provider_uuid`}
            control={control}
            render={({ field: rowField }) =>
              lockIdentityFields ? (
                <InputReadOnly
                  label={formText.labor.fields.executor}
                  value={rowField.value?.label ?? '—'}
                />
              ) : (
                <SelectAsyncPaginate
                  name={rowField.name}
                  label={formText.labor.fields.executor}
                  placeholder={formText.labor.placeholders.executor}
                  service={listProviders}
                  mapOptions={(item: ProviderListItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={rowField.value ?? undefined}
                  onChange={(option: any) => rowField.onChange(option ?? null)}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )
            }
          />
        )}

        {/* Un. Medida — TASK-FE-664/AP-25 (GAP-BE-643). Posicionado
            IMEDIATAMENTE depois de "Executador" (mirror legado,
            `_card_service.blade.php:14-19`: Tipo → Executador → Un.
            Medida → Tipo de Pagamento → Qtd/ha). Catálogo GENÉRICO
            (`listMeasurementOptions`, sem filtro) — confirmado pelo
            Arquiteto API: este item NÃO tem produto associado, "não
            restringir" é a fidelidade correta (diferente de
            AP-18/24/DF-26). TASK-FE-732 — trava como `InputReadOnly` na
            Finalização (identidade da linha, mirror `_card_service_edit.
            blade.php:19` `->readonly()`). */}
        <Controller
          name={`labor_items.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.labor.fields.measurement}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={rowField.name}
                label={formText.labor.fields.measurement}
                placeholder={formText.labor.placeholders.measurement}
                service={listMeasurementOptions}
                mapOptions={(item: MeasurementOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={rowField.value ?? undefined}
                onChange={(option: any) => rowField.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />

        {/* TASK-FE-686/AP-30 — "Tipo de Pagamento" reposicionado para ANTES
            de "Qtd/ha" (mirror legado, `_card_service.blade.php:22-27`:
            Un. Medida → Tipo de Pagamento → Qtd/ha → Qtd Total → Vl.
            Unitário → Vl. Total). */}
        <Controller
          name={`labor_items.${index}.type_payment`}
          control={control}
          render={({ field: rowField }) => (
            <Select
              label={formText.labor.fields.typePayment}
              name={rowField.name}
              value={rowField.value}
              onChange={(option) => rowField.onChange(option ?? paymentOptions[0])}
              options={paymentOptions}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />

        {/* "Qtd/ha" — só no modo "Qtd/ha" (`Q`), mirror legado (toggle
            `.func-type-payment` de `_services.blade.php:116-145`: modo
            "Valor" esconde `service-quantity`). */}
        {!isValuePayment && (
          <Controller
            name={`labor_items.${index}.quantity`}
            control={control}
            render={({ field: rowField }) => (
              <NumberInput
                name={rowField.name}
                label={formText.labor.fields.quantity}
                allowDot
                decimalPlaces={2}
                value={rowField.value ?? null}
                onValueChange={(value) => rowField.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />
        )}

        {/* "Qtd Total" — TASK-FE-686/AP-30 (GAP-BE-650): deixou de ser
            `InputReadOnly` derivada de tela — agora EDITÁVEL, DEFAULT
            `= quantity × used_area` (recalculado ao vivo até o usuário
            editar manualmente, ver `useEffect` acima), sobrescrevível.
            Visível nos 2 modos (mirror legado, sempre mostrada). */}
        <Controller
          name={`labor_items.${index}.total_quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.labor.fields.totalQuantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => {
                totalQuantityTouchedRef.current = true;
                rowField.onChange(value);
              }}
              disabled={isDisabled}
            />
          )}
        />

        {/* "Vl. Unitário"/"Vl. Total" — só no modo "Valor" (`V`), mirror
            legado (toggle mostra `service-amount`+`service-total-amount`
            só quando `typePayment === 'V'`). "Vl. Total" NUNCA é campo
            RHF — `InputReadOnly` calculado ao vivo (`total_quantity ×
            amount`), mirror EXATO de "V.Total" de Produção
            (`AppropriationProductionTab.tsx`, TASK-FE-660). */}
        {isValuePayment && (
          <>
            <Controller
              name={`labor_items.${index}.amount`}
              control={control}
              render={({ field: rowField }) => (
                <NumberInput
                  name={rowField.name}
                  label={formText.labor.fields.amount}
                  allowDot
                  decimalPlaces={2}
                  value={rowField.value ?? null}
                  onValueChange={(value) => rowField.onChange(value)}
                  disabled={isDisabled}
                />
              )}
            />

            <InputReadOnly
              label={formText.labor.fields.totalAmount}
              value={liveTotalAmount.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
          </>
        )}
      </SimpleGrid>

      {!hideRowActions && (
        <Flex justify="flex-end" mt={3}>
          <IconButtonTable
            aria-label={formText.removeItem}
            mensegerTooltip={formText.removeItem}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      )}
    </Box>
  );
}
