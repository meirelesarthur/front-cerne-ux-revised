// src/pages/Operacional/VendaAnimais/FinishMovementSale.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Finalizar Venda (Abate)" — TASK-VD-FE-03, contrato de tela
// §8.1. Rota: `/operacional/venda-animais/:saleUuid/finalizar`, gate de rota
// `mov_sale_edit` (transição de ESCRITA, nunca `_view` — mirror
// comentário de `FinishAppropriation` no router).
//
// Mirror `Operacional/Appropriations/FinishAppropriation.tsx`: reaproveita
// LITERALMENTE os MESMOS componentes do form principal (Tarefa 15) —
// `MovementSaleItemsSection`/`MovementSaleItemRow` com
// `lockIdentityFields`/`hideRowActions` (só `carcass_weight`/`performance`
// editáveis por linha) + `MovementSaleCategoriesTab` (preço por categoria,
// SEMPRE editável, mesmo componente — só o fator de conversão muda para 15,
// `KG_TO_ARROBA_SLAUGHTER_FACTOR`, `GAP-VD-04`) + `MovementSaleTotalsBlock`
// (inalterado). `useForm<MovementSaleForm>` — MESMO tipo do form principal,
// hidratado via `mapMovementSaleDetailToFinishFormValues` (`movement-sale-
// finish-mapper.ts`, extraído para reuso, mirror `appropriation-form-
// mapper.ts`).
//
// Guard `canFinish = can('mov_sale_edit') && detail?.status === 'P'`
// (contrato §8.1). Hidratação via `GET /movement-sales/{uuid}/slaughter`
// (`useMovementSaleFinishForm`, 404 se a venda não estiver `status=Pendente`
// — o servidor já aplica o guard, o front só reflete: 404 vira "não
// encontrado"/redireciona, mesmo racional de `notFoundGuard` do form
// principal).
//
// Sem cabeçalho editável reutilizável (diferente de Apontamentos, que tem
// `AppropriationHeaderFields`) — esta tela exibe um RESUMO informativo
// (código/cliente/data/tipo/status), nunca reenviado ao servidor (o payload
// de finalização só carrega `items`/`categories`/totais + o bloco
// financeiro opcional, `MovementSaleSlaughterData` real, ver docblock de
// `movement-sale-finish-mapper.ts`).
//
// TASK-VD-FE-05 (`GAP-VENDAS-FE-04` §1/§2/§3) — CORREÇÃO DE CASCA E BLOCO
// FINANCEIRO. Duas frentes:
//   (a) Casca: `footer` opt-in no `FormContainer` (mirror
//       `CreateOrUpdateMovementSale.tsx:409-431`) — causa raiz do
//       padding/layout quebrado. O botão de submit sai do `<form>` e vira
//       `type="button" onClick={handleSubmit(onSubmit, onInvalid)}`.
//   (b) Bloco financeiro do legado, ausente até aqui: seção "Dados de
//       Pagamento" (`type_payment` → `note` → `has_financial`, posição
//       legada logo após os Totais) + cascata única revelando "Condição de
//       Pagamento - Parcelamento" (`MovementSaleInstallmentsSection`) e
//       "Rateio" (`MovementSaleIncomeAllocation`, ambos da Tarefa 21/
//       TASK-VD-FE-04) quando `has_financial===true` (default SIM, mirror
//       `->value(1)` do legado). `type_payment` é OBRIGATÓRIO e ENVIADO só
//       nesta tela INDIVIDUAL (D1-a/`GAP-VD-14`) — a tela em LOTE
//       (`FinishMovementSaleMany.tsx`) nunca o renderiza (D-LOTE-a).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Badge, Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayReplace,
} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import {
  movementSaleFiscalDocumentOptions,
  movementSaleTypePaymentOptions,
} from '@/constants/GestaoAnimal/MovementSale/options';

import { movementSaleFinishSchemaResolver } from '@/validations/schemas/MovementSales/movement-sale-schema';

import type { Option } from '@/@types/option';
import type {
  MovementSaleDetail,
  MovementSaleForm as MovementSaleFormValues,
} from '@/@types/v2/MovementSales';

import {
  buildMovementSaleSlaughterPayload,
  KG_TO_ARROBA_SLAUGHTER_FACTOR,
  mapMovementSaleDetailToFinishFormValues,
} from './movement-sale-finish-mapper';
import { MovementSaleCategoriesTab } from './MovementSaleCategoriesTab';
import { MovementSaleIncomeAllocation } from './MovementSaleIncomeAllocation';
import { MovementSaleInstallmentsSection } from './MovementSaleInstallmentsSection';
import { MovementSaleItemsSection } from './MovementSaleItemsSection';
import { MovementSaleTotalsBlock } from './MovementSaleTotalsBlock';
import {
  useFinishMovementSale,
  useMovementSaleFinishForm,
  useMovementSalePaymentTypeOptions,
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
  // GAP-VENDAS-FE-04 §3.13 — default SIM (mirror `->value(1)` legado); o
  // mapper de hidratação reafirma o mesmo default no `reset()`.
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

export default function FinishMovementSale() {
  const { saleUuid } = useParams<{ saleUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movementSales.movementSale;
  const formText = text.form;
  const finishText = text.finish;

  const isValidId = isValidGuid(saleUuid);

  useEffect(() => {
    if (saleUuid && !isValidId) {
      navigate(VENDA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [saleUuid, isValidId, navigate]);

  const [detail, setDetail] = useState<MovementSaleDetail | undefined>(undefined);

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
    resolver: movementSaleFinishSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyDefaultValues,
  });

  function fillForm(data: MovementSaleDetail) {
    setDetail(data);
    reset(mapMovementSaleDetailToFinishFormValues(data, languageGB));
  }

  const saleQuery = useMovementSaleFinishForm({
    registrationId: isValidId ? saleUuid : undefined,
    fillForm,
  });

  const isLoading = checkLoadingStatus([saleQuery as any]);

  // Guard §8.1 — só permite finalizar venda `status==='P'`. 404 do servidor
  // (`GetPendingSlaughterAction`, venda já finalizada/inexistente/outra
  // farm) já cai em `saleQuery.isError`, tratado abaixo.
  const canFinish = can('mov_sale_edit') && detail?.status === 'P';
  const isDisabledField = !canFinish || isLoading;

  const finishMutation = useFinishMovementSale({
    actionSuccess: () => {
      navigate(`/operacional/venda-animais/${saleUuid}`);
    },
  });

  // ---- Bloco financeiro opcional (GAP-VENDAS-FE-04 §3/§4) -----------------
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
    if (!saleUuid) return;
    const payload = buildMovementSaleSlaughterPayload(formValues);
    finishMutation.mutate({ uuid: saleUuid, payload });
  }

  function onInvalid(formErrors: FieldErrors<MovementSaleFormValues>) {
    if (Object.keys(formErrors).length === 0) return;
    toaster.error({
      title: finishText.title,
      description: finishText.invalidFieldsToast,
      duration: 6000,
    });
  }

  const typeSaleLabel = detail?.type_sale_label ?? '—';
  // VD-FE-03 (PARADA-FE-1 aceita, backend TASK-41 ✅) — mesma migração de
  // `CreateOrUpdateMovementSale.tsx`: `type_payment` via
  // `GET /movement-sales/payment-types/options`, catálogo local só como
  // FALLBACK em `isError` (nunca select vazio).
  const typePaymentOptionsQuery = useMovementSalePaymentTypeOptions();
  const typePaymentOptions =
    typePaymentOptionsQuery.data && !typePaymentOptionsQuery.isError
      ? typePaymentOptionsQuery.data.data
      : movementSaleTypePaymentOptions.options(languageGB);
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  if (!isValidId) {
    return null;
  }

  if ((saleQuery as any).isError) {
    return (
      <FormContainer title={finishText.title}>
        <Text color="fg.error">{finishText.notPendingGuard}</Text>
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
      title={finishText.title}
      subtitle={finishText.subtitle}
      headerActions={
        detail ? (
          <Badge colorPalette={detail.status === 'F' ? 'green' : 'orange'} variant="subtle">
            {detail.status_label}
          </Badge>
        ) : undefined
      }
      footer={
        <>
          <Button
            title={finishText.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={finishMutation.isPending}
          />
          {canFinish && (
            <Button
              title={finishText.submit}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={finishMutation.isPending}
              disabled={finishMutation.isPending || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Text fontWeight="semibold" mb={3}>
          {formText.sections.header}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly label={finishText.headerSummary.code} value={detail?.code ?? '—'} />
          <InputReadOnly
            label={finishText.headerSummary.client}
            value={detail?.client?.name ?? '—'}
          />
          <InputReadOnly label={finishText.headerSummary.dtSale} value={detail?.dt_sale ?? '—'} />
          <InputReadOnly label={finishText.headerSummary.typeSale} value={typeSaleLabel} />
        </SimpleGrid>

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
            pricingType={detail?.pricing_type ?? null}
            isDisabled={isDisabledField}
            conversionFactor={KG_TO_ARROBA_SLAUGHTER_FACTOR}
            weightField="carcass_weight"
            priceTimesWeight
          />
        </Box>

        <MovementSaleTotalsBlock control={control} watch={watch} isDisabled={isDisabledField} />

        {/* ---- "Dados de Pagamento" (GAP-VENDAS-FE-04 §2) — posição legada:
            logo após os Totais. Ordem `type_payment` → `note` →
            `has_financial`, fiel a `slaughter.blade.php:142-154`. ---- */}
        <Box mt={8}>
          <Text fontWeight="semibold" mb={3}>
            {formText.financial.paymentSectionTitle}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            {/* D1-a/`GAP-VD-14` — renderizado e OBRIGATÓRIO só nesta tela
                INDIVIDUAL (D-LOTE-a mantém ausente na tela em lote). O
                `value` da `Option` enviado é o código de 2 caracteres
                (`'01'`…`'99'`), nunca o label. Hidratação `null`
                (`GAP-VENDAS-FE-03` — `MovementSaleResource` não expõe o
                campo hoje); o valor não persiste até `GAP-VD-14` fechar do
                lado api (pendência registrada, não regressão do front). */}
            <Controller
              name="type_payment"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={formText.fields.typePayment}
                  placeholder={formText.placeholders.typePayment}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={typePaymentOptions}
                  loading={typePaymentOptionsQuery.isPending}
                  error={errors.type_payment?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                />
              )}
            />

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
                    // limpar os arrays financeiros — evita dado órfão no
                    // payload e reaparecimento de dado obsoleto se o toggle
                    // for religado.
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

        {/* ---- Cascata única (GAP-VENDAS-FE-04 §3.14, mirror
            `handleHasFinancial()`/`#financial` do legado): "Sim" revela AS
            DUAS seções de uma vez. Desmonte real (não `display:none`) —
            contrato do `ToggleSection` do `cerne`. ---- */}
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
