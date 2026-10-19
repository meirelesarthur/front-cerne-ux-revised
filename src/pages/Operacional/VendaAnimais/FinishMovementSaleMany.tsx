// src/pages/Operacional/VendaAnimais/FinishMovementSaleMany.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Finalizar Vendas em Lote (Abate)" — TASK-VD-FE-03, contrato
// de tela §8.2. Rota: `/operacional/venda-animais/finalizar-lote?ids=`, gate
// de rota `mov_sale_edit` (mirror `/:saleUuid/finalizar`).
//
// UUIDs selecionados chegam via query param `?ids=uuid1,uuid2` — mecanismo de
// NAVEGAÇÃO INTERNA (a SPA não tem `session('data-return')` do legado, nota
// de modernização do contrato §8.2, sem efeito em comportamento de negócio).
//
// Busca as vendas do lote numa ÚNICA chamada real
// (`GET /movement-sales/slaughter-many?sale_uuids[]=...`,
// `useMovementSalesPendingSlaughterMany` — ver achado de fidelidade em
// `movement-sale-service.ts`: diverge da leitura do contrato de
// `Promise.allSettled` por venda, o endpoint real já devolve o lote inteiro).
//
// Reaproveita os MESMOS componentes do form principal — `items[]` ACHATADO de
// TODAS as vendas (`mapMovementSaleDetailsToFinishManyFormValues`,
// `movement-sale-finish-mapper.ts`) com `lockIdentityFields`/`hideRowActions`
// + `MovementSaleCategoriesTab` (fator 15, `carcass_weight`) + `MovementSale
// TotalsBlock`. Submit único para `PUT /movement-sales/slaughter-many` —
// distribuição proporcional por venda é feita PELO SERVIDOR
// (`FinalizeSlaughterManyAction`, `CV6`), nunca reimplementada aqui.
//
// TASK-VD-FE-05 (`GAP-VENDAS-FE-04` §1/§2/§3/§4, D2-a) — CORREÇÃO DE CASCA E
// BLOCO FINANCEIRO. Mesma correção de `FinishMovementSale.tsx` (`footer`
// opt-in + submit externo ao `<form>` + seção "Dados de Pagamento" + cascata
// de Parcelamento/Rateio), com 2 diferenças deliberadas:
//   1. `type_payment` NUNCA é renderizado nem enviado aqui (D-LOTE-a,
//      `GAP-VD-14`) — resolver dedicado `movementSaleFinishManySchemaResolver`
//      (Tarefa 21/TASK-VD-FE-04), que relaxa o campo em vez de exigi-lo
//      (senão o bug de campo obrigatório invisível reaparece nesta tela).
//   2. Rateio/parcelamento são AGREGADOS do lote inteiro (`vlTotal` = soma de
//      todas as vendas selecionadas). O servidor lança os títulos gerados
//      TODOS sob a 1ª venda do lote (`SlaughterMovementSaleController.php:389`)
//      — defeito legado PRESERVADO por decisão explícita do dono (D2-a/
//      DEC-022, `GAP-VENDAS-FE-04` §6.28) — não é bug a "corrigir" depois.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Badge, Box, HStack, SimpleGrid, Text, Wrap } from '@chakra-ui/react';
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayReplace,
} from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { movementSaleFiscalDocumentOptions } from '@/constants/GestaoAnimal/MovementSale/options';

import { movementSaleFinishManySchemaResolver } from '@/validations/schemas/MovementSales/movement-sale-schema';

import type { Option } from '@/@types/option';
import type { MovementSaleForm as MovementSaleFormValues } from '@/@types/v2/MovementSales';

import {
  buildMovementSaleSlaughterManyPayload,
  KG_TO_ARROBA_SLAUGHTER_FACTOR,
  mapMovementSaleDetailsToFinishManyFormValues,
} from './movement-sale-finish-mapper';
import { MovementSaleCategoriesTab } from './MovementSaleCategoriesTab';
import { MovementSaleIncomeAllocation } from './MovementSaleIncomeAllocation';
import { MovementSaleInstallmentsSection } from './MovementSaleInstallmentsSection';
import { MovementSaleItemsSection } from './MovementSaleItemsSection';
import { MovementSaleTotalsBlock } from './MovementSaleTotalsBlock';
import {
  useFinishMovementSaleMany,
  useMovementSalesPendingSlaughterMany,
} from './useMovementSales';

import type { MovementSaleAllocationFieldValues } from './MovementSaleIncomeAllocation';
import type { MovementSaleInstallmentFieldValues } from './MovementSaleInstallmentsSection';

const VENDA_ANIMAIS_LIST_ROUTE = '/operacional/venda-animais';

const emptyDefaultValues: MovementSaleFormValues = {
  code: '',
  dt_sale: '',
  seller_uuid: null,
  batch_sale: false,
  batch_uuid: null,
  client_uuid: null,
  type_sale: null,
  pricing_type: null,
  chave: null,
  number: null,
  serie: null,
  type_payment: null,
  gtas: '',
  note: '',
  // GAP-VENDAS-FE-04 §3.13/D2-a — default SIM também no lote.
  has_financial: true,
  fiscal_document: true,
  financial_allocations: [],
  financial_installments: [],
  items: [],
  categories: [],
  average_weight_kg: null,
  total_products: 0,
  freight: 0,
  other_values: 0,
  discount: 0,
  total: 0,
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export default function FinishMovementSaleMany() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movementSales.movementSale;
  const formText = text.form;
  const finishManyText = text.finishMany;

  const saleUuids = useMemo(() => {
    const raw = searchParams.get('ids') ?? '';
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => isValidGuid(value));
  }, [searchParams]);

  useEffect(() => {
    if (saleUuids.length === 0) {
      toaster.warning({ title: finishManyText.title, description: finishManyText.noIdsGuard });
      navigate(VENDA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [saleUuids.length]);

  const canFinish = can('mov_sale_edit');

  const salesQuery = useMovementSalesPendingSlaughterMany(saleUuids);
  const details = salesQuery.data ?? [];

  const [hydrated, setHydrated] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovementSaleFormValues>({
    mode: 'onChange',
    resolver: movementSaleFinishManySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyDefaultValues,
  });

  useEffect(() => {
    if (!hydrated && details.length > 0) {
      reset(mapMovementSaleDetailsToFinishManyFormValues(details, languageGB));
      setHydrated(true);
    }
  }, [details, hydrated, reset]);

  const isLoading = salesQuery.isLoading;
  const isDisabledField = !canFinish || isLoading;

  const finishManyMutation = useFinishMovementSaleMany({
    actionSuccess: () => {
      navigate(VENDA_ANIMAIS_LIST_ROUTE);
    },
  });

  // ---- Bloco financeiro opcional (GAP-VENDAS-FE-04 §3/§4, agregado do
  // lote inteiro — D2-a) --------------------------------------------------
  const allocationsArray = useFieldArray({ control, name: 'financial_allocations' });
  const installmentsArray = useFieldArray({ control, name: 'financial_installments' });

  const hasFinancial = watch('has_financial');

  const watchedCategories = watch('categories') ?? [];
  const totalProducts = watchedCategories.reduce(
    (sum, category) => sum + (Number(category?.value_total) || 0),
    0
  );
  const freight = Number(watch('freight')) || 0;
  const otherValues = Number(watch('other_values')) || 0;
  const discount = Number(watch('discount')) || 0;
  const vlTotal = round(totalProducts + freight + otherValues - discount, 2);

  // Sincroniza `total`/`total_products` do form com o total recalculado —
  // alimenta `ctx.parent.total` do schema (financeiro). O payload de escrita
  // recalcula os totais do zero; este campo serve só à validação.
  // Mirror CreateOrUpdateMovementSale.tsx:476-496.
  useEffect(() => {
    setValue('total_products', round(totalProducts, 2));
    setValue('total', vlTotal, { shouldValidate: true });
  }, [totalProducts, vlTotal, setValue]);

  function onSubmit(formValues: MovementSaleFormValues) {
    const payload = buildMovementSaleSlaughterManyPayload(saleUuids, formValues);
    finishManyMutation.mutate(payload);
  }

  function onInvalid(formErrors: FieldErrors<MovementSaleFormValues>) {
    if (Object.keys(formErrors).length === 0) return;
    toaster.error({
      title: finishManyText.title,
      description: text.finish.invalidFieldsToast,
      duration: 6000,
    });
  }

  const pricingType = details[0]?.pricing_type ?? null;
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  if (saleUuids.length === 0) {
    return null;
  }

  if (salesQuery.isError) {
    return (
      <FormContainer title={finishManyText.title}>
        <Text color="fg.error">{finishManyText.loadErrorToast}</Text>
        <Box mt={4}>
          <Button
            title={text.detail.backButton}
            variant="outline"
            onClick={() => navigate(VENDA_ANIMAIS_LIST_ROUTE)}
          />
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={finishManyText.title}
      subtitle={finishManyText.subtitleTemplate.replace('{count}', String(saleUuids.length))}
      footer={
        <>
          <Button
            title={finishManyText.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={finishManyMutation.isPending}
          />
          {canFinish && (
            <Button
              title={finishManyText.submit}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={finishManyMutation.isPending}
              disabled={finishManyMutation.isPending || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Text fontWeight="semibold" mb={3}>
          {formText.sections.header}
        </Text>
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {finishManyText.salesIncludedLabel}
          </Text>
          <Wrap>
            {details.map((detail) => (
              <HStack key={detail.uuid} gap={1}>
                <Badge colorPalette="orange" variant="subtle">
                  {detail.code}
                </Badge>
              </HStack>
            ))}
          </Wrap>
        </Box>

        <Box mt={8}>
          <MovementSaleItemsSection
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isDisabled={isDisabledField}
            lockIdentityFields
            hideRowActions
          />
        </Box>

        <Box mt={8}>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            {text.form.categoriesTab.title}
          </Text>
          <MovementSaleCategoriesTab
            control={control}
            watch={watch}
            setValue={setValue}
            pricingType={pricingType}
            isDisabled={isDisabledField}
            conversionFactor={KG_TO_ARROBA_SLAUGHTER_FACTOR}
            weightField="carcass_weight"
            priceTimesWeight
          />
        </Box>

        <MovementSaleTotalsBlock control={control} watch={watch} isDisabled={isDisabledField} />

        {/* ---- "Dados de Pagamento" (GAP-VENDAS-FE-04 §2/D-LOTE-a) — SEM
            `type_payment` (assimetria legada real: `updateMany()` omite o
            campo por construção; a tela legada de lote renderiza um campo
            morto sem efeito nenhum — reproduzi-lo seria pior que omiti-lo).
            Ordem `note` → `has_financial`. ---- */}
        <Box mt={8}>
          <Text fontWeight="semibold" mb={3}>
            {formText.financial.paymentSectionTitle}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Textarea
              label={formText.fields.note}
              {...register('note')}
              error={errors.note?.message}
              disabled={isDisabledField}
            />

            <Controller
              name="has_financial"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={formText.fields.hasFinancial}
                  name={name}
                  value={booleanOptions.find((option) => option.value === !!value) ?? null}
                  onChange={(option: Option<boolean> | null) => {
                    const nextValue = !!option?.value;
                    onChange(nextValue);
                    // GAP-VENDAS-FE-04 §3.15 — mirror da decisão registrada em
                    // `FarmTransferFinancialSection.tsx:10-12`: ao desligar,
                    // limpar os arrays financeiros.
                    if (!nextValue) {
                      allocationsArray.replace([]);
                      installmentsArray.replace([]);
                    }
                  }}
                  options={booleanOptions}
                  isRequired
                  isDisabled={isDisabledField}
                  noClearable
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Cascata única (mirror `FinishMovementSale.tsx`/legado
            `handleHasFinancial()`) — rateio/parcelamento AGREGADOS do lote
            inteiro. Os títulos gerados nascem TODOS sob a 1ª venda do lote
            (`SlaughterMovementSaleController.php:389`) — defeito legado
            PRESERVADO por decisão explícita do dono (D2-a/DEC-022,
            `GAP-VENDAS-FE-04` §6.28); não tentar ratear por venda. ---- */}
        {hasFinancial && (
          <>
            {/* UT-000719 (D-097-12) — Documento Fiscal (Sim/Não, default Sim),
                acima do parcelamento (legado `income_form.blade.php:45`). */}
            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <Controller
                name="fiscal_document"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.fiscalDocument}
                    name={name}
                    value={movementSaleFiscalDocumentOptions.getOption(value, languageGB)}
                    onChange={(option: Option<boolean> | null) => onChange(!!option?.value)}
                    options={movementSaleFiscalDocumentOptions.options(languageGB)}
                    error={errors.fiscal_document?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    noClearable
                  />
                )}
              />
            </SimpleGrid>

            <Box mt={6}>
              <MovementSaleInstallmentsSection
                control={control}
                fields={installmentsArray.fields}
                append={
                  installmentsArray.append as unknown as UseFieldArrayAppend<
                    MovementSaleInstallmentFieldValues,
                    'financial_installments'
                  >
                }
                remove={installmentsArray.remove}
                replace={
                  installmentsArray.replace as unknown as UseFieldArrayReplace<
                    MovementSaleInstallmentFieldValues,
                    'financial_installments'
                  >
                }
                vlTotal={vlTotal}
                errors={errors}
                languageGB={languageGB}
                disabled={isDisabledField}
              />
            </Box>

            <Box mt={6}>
              <MovementSaleIncomeAllocation
                control={control}
                fields={allocationsArray.fields}
                append={
                  allocationsArray.append as unknown as UseFieldArrayAppend<
                    MovementSaleAllocationFieldValues,
                    'financial_allocations'
                  >
                }
                remove={allocationsArray.remove}
                setValue={setValue}
                vlTotal={vlTotal}
                errors={errors}
                languageGB={languageGB}
                disabled={isDisabledField}
              />
            </Box>
          </>
        )}
      </Form>
    </FormContainer>
  );
}
