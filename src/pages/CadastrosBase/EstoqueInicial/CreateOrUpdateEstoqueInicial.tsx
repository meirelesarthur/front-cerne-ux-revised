// src/pages/CadastrosBase/EstoqueInicial/CreateOrUpdateEstoqueInicial.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ESTOQUE INICIAL (OpeningBalance) —
// Cadastros Base. TASK-FE-1043 (execução 026) — Zonas 1-3 (Identificação /
// Quantidades & Valores / Informações Adicionais). Referência UX:
// `ux_root/src/pages/cadastros/estoques-iniciais/EstoqueInicialForm.tsx`
// (commit `24bd916`) — composição visual (3 zonas colapsáveis, campos
// computados com "flash", alerta de duplicidade) adaptada à stack do fork
// (Chakra v3 + TanStack Query + RHF), NUNCA copiada literalmente (o mock/
// `useState` local do UX foi descartado por inteiro).
//
// Mirror mecânico de `Armazem/CreateOrUpdateArmazem.tsx` (farm-scoped, CRUD
// flat, mesmo racional de tenancy — contrato de API §2) para a casca do
// formulário (`FormContainer`/`FormFooter`/guardas `isEmpty`/`dirtyFields`) e
// de `Produtos/Catalogo/CreateOrUpdateProduto.tsx` para os widgets de
// catálogo (`SelectAsyncPaginate`+`Controller`, `NumberInput`+`Controller`).
//
// ZONA 4 ("Classificação"/"Bebida", TASK-FE-1044, aditiva) — condicional a
// `productDetailQuery.data?.requires_coffee_fields` (flag booleano real,
// `TASK-BE-705` ENTREGUE — resolvido pelo `CoffeeKindResolver` no backend,
// servido em `GET /products/{uuid}` E `GET /products/options`). NUNCA
// condicionar por `kind.description`/identidade de Kind — id legado (81) ou
// uuid gerado por migration não é estável entre ambientes; o backend já
// resolve essa heurística e expõe só o booleano. `cultivation_uuid`/`drink`
// já existiam em `OpeningBalancePayload` (TASK-FE-1040) — esta Tarefa
// acrescenta os 2 campos a `OpeningBalanceForm`, a seção condicional abaixo
// e a montagem condicional do payload em `tryPersistOpeningBalance`.
//
// ⚠️ LANDMINE `ERRO-FE-001` (`src/utils/isEmpty.ts`, 6 linhas): `isEmpty(obj)`
// retorna `true` quando `obj` TEM ao menos uma chave — semântica INVERTIDA em
// relação ao nome. Usada em 2 pontos deste arquivo (guarda de `fillForm` e
// guarda de `onSubmit`) — NUNCA remover o `!`.
//
// `product_uuid` — GAP backend `products/options` (contrato de tela §7.2,
// contrato de API §10): endpoint enxuto AINDA NÃO EXISTE. Fallback adotado
// (documentado no contrato, opção 2 de 2): `SelectAsyncPaginate` aponta para
// `listProducts` (paginado, já existe) com `mapOptions` extraindo
// `{uuid, code, description}` — funciona, só mais pesado (payload cheio em
// vez do lookup enxuto). Quando `TASK-BE-705` publicar `products/options`,
// reconciliar SÓ o `service`/`mapOptions` deste Controller — schema/payload
// não mudam.
//
// `has_lot`/`measurement.description` do produto selecionado — NENHUM dos 2
// vem no `OpeningBalanceProductRef`/lookup enxuto (GAP acima). Resolvidos via
// `useSelectedProductDetails` (GET /products/{uuid}, endpoint de DETALHE que
// JÁ EXISTE hoje, ver `useOpeningBalanceForm.tsx`) — fonte real, nunca mock.
//
// Alerta de duplicidade (contrato de tela §6, contrato de API §5) — a
// unicidade (`product_uuid`+`warehouse_uuid`+`provider_lot`+`farm_id`) é uma
// constraint REAL do backend (`Rule::unique`, 422 de validação). DECISÃO
// registrada aqui (documentada no contrato §6 como pendente de ajuste): SÓ a
// ação "Substituir" faria sentido para esse tipo de erro (reenviar o mesmo
// payload como "Adicionar mesmo assim" seria rejeitado de novo pela mesma
// regra) — mas "Substituir" exigiria o backend expor o `uuid` do registro
// conflitante no corpo do 422, o que o contrato de API publicado NÃO
// confirma. Implementado: banner inline (Zona 2) com a mensagem REAL do
// backend + ação única de dispensar — sem fabricar um fluxo de
// "Substituir"/"Adicionar mesmo assim" sobre um contrato de erro não
// confirmado (política SEM MOCK). Ponto de extensão: se o backend passar a
// expor `errors.duplicate_uuid`, plugar a ação "Substituir" aqui.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Alert, Box, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { drinkOptions } from '@/constants/cadastrosBase/openingBalance/options/drink-options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { openingBalanceSchemaResolver } from '@/validations/schemas/OpeningBalance/opening-balance-schema';

import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import {
  createOpeningBalance,
  updateOpeningBalance,
} from '@/services/v2/OpeningBalances/opening-balance-service';
import { listProducts } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type {
  OpeningBalanceDetail,
  OpeningBalanceForm as OpeningBalanceFormType,
  OpeningBalancePayload,
} from '@/@types/v2/OpeningBalances';
import type { ProductListItem } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { useOpeningBalanceForm, useSelectedProductDetails } from './useOpeningBalanceForm';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

// Catálogo de Armazém é um lookup FLAT (`GET /warehouses/options`, `meta`
// sempre `null`, poucas dezenas por fazenda) — `pageSize` maior que o volume
// real evita uma 2ª página fantasma (`items.length === pageSize`), mesmo
// truque de `FLAT_CATALOG_PAGE_SIZE` em `CreateOrUpdateProduto.tsx` (não
// importado de lá — mesma razão documentada naquele arquivo: não acoplar 2
// telas por uma constante trivial).
const FLAT_CATALOG_PAGE_SIZE = 200;

export default function CreateOrUpdateEstoqueInicial() {
  const { openingBalanceId } = useParams<{ openingBalanceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(openingBalanceId);

  const text = languageGB.openingBalances.openingBalance;
  const formText = text.form;

  const canSave = isEditing ? can('openingbalances_edit') : can('openingbalances_create');

  // Sinais derivados do PRODUTO selecionado (não campos próprios do
  // OpeningBalance) — inicializados no `fillOpeningBalanceForm` (edição) e
  // sobrescritos pela fonte real assim que `useSelectedProductDetails`
  // resolve (criação E edição, ver cabeçalho do arquivo).
  const [measurementDescription, setMeasurementDescription] = useState('');
  const [hasLot, setHasLot] = useState(false);
  const [duplicateErrorMessage, setDuplicateErrorMessage] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, dirtyFields },
  } = useForm<OpeningBalanceFormType>({
    mode: 'onChange',
    resolver: openingBalanceSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    // `has_lot` é propriedade do PRODUTO, não um campo irmão do form —
    // injetado via contexto do Yup (ver cabeçalho de `opening-balance-schema.ts`).
    context: { hasLot },
    defaultValues: {
      product_uuid: null,
      warehouse_uuid: null,
      quantity: null,
      amount: null,
      provider_lot: null,
      expiration_date: null,
      cultivation_uuid: null,
      drink: null,
    },
  });

  const productOption = watch('product_uuid');
  const quantityValue = watch('quantity');
  const amountValue = watch('amount');
  const productUuid = productOption?.value;

  // ⚠️ ERRO-FE-001 — `!isEmpty(dirtyFields)` só é `true` quando `dirtyFields`
  // está VAZIO (nenhuma edição do usuário em andamento) — condição em que é
  // seguro sobrescrever o form com o dado do servidor. NUNCA remover o `!`.
  function fillOpeningBalanceForm(data: OpeningBalanceDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // `product.measurement` aninhado (TASK-BE-742, correção de fidelidade —
      // o campo achatado `measurement_description` nunca existiu no Resource
      // real; o `?? ''` cobre só a defesa do Resource contra produto sem
      // medida associada, não o caminho normal).
      setMeasurementDescription(data.product.measurement?.description ?? '');
      // Sinal inicial (heurística: registro já tem lote informado) — até o
      // enriquecimento real (`useSelectedProductDetails`) resolver, ver abaixo.
      setHasLot(!!data.provider_lot);
      reset({
        product_uuid: {
          label: `${data.product.code} — ${data.product.description}`,
          value: data.product.uuid,
        },
        warehouse_uuid: {
          label: `${data.warehouse.initials} — ${data.warehouse.description}`,
          value: data.warehouse.uuid,
        },
        quantity: Number(data.quantity),
        amount: Number(data.amount),
        provider_lot: data.provider_lot ?? null,
        expiration_date: data.expiration_date ?? null,
        // Zona 4 (TASK-FE-1044) — hidrata só se o registro já tinha
        // Classificação/Bebida (produto de Café já persistido). `cultivation`
        // usa a chave real `name` (ver correção do tipo, não `description`).
        cultivation_uuid: data.cultivation
          ? { label: data.cultivation.name, value: data.cultivation.uuid }
          : null,
        drink:
          data.drink != null
            ? (drinkOptions.options(languageGB).find((option) => option.value === data.drink) ??
              null)
            : null,
      });
    }
  }

  const openingBalanceQuery = useOpeningBalanceForm({
    registrationId: isEditing ? openingBalanceId : undefined,
    fillForm: fillOpeningBalanceForm,
  });

  const isLoading = isEditing && checkLoadingStatus([openingBalanceQuery as any]);

  // Enriquecimento REAL do produto selecionado (has_lot/measurement) — GAP
  // `products/options`, ver cabeçalho do arquivo. Dispara em criação e edição.
  const productDetailQuery = useSelectedProductDetails(productUuid);

  useEffect(() => {
    if (productDetailQuery.data) {
      setMeasurementDescription(productDetailQuery.data.measurement.description);
      setHasLot(!!productDetailQuery.data.has_lot);
    }
  }, [productDetailQuery.data]);

  // Zona 4 (TASK-FE-1044) — gate EXCLUSIVO pelo flag booleano real
  // (`ProductData.requires_coffee_fields`, `TASK-BE-705` entregue, resolvido
  // pelo `CoffeeKindResolver` no backend). NUNCA inferir de
  // `kind`/`kind.description` — identidade de Kind (id legado ou uuid gerado
  // por migration) não é estável entre ambientes.
  const requiresCoffeeFields = !!productDetailQuery.data?.requires_coffee_fields;

  // Revalida Lote/Validade assim que o gate `has_lot` muda de estado — evita
  // um erro "invisível" (só apareceria no submit) quando o usuário troca para
  // um produto com lote e ainda não tocou nos campos da Zona 3.
  useEffect(() => {
    trigger(['provider_lot', 'expiration_date']);
  }, [hasLot, trigger]);

  // "Flash" visual dos campos computados (Valor Total/Custo Médio) ao
  // recalcular — mirror UX (`key` trocando + `@keyframes`), adaptado ao
  // idioma de animação JÁ USADO neste fork (`animation`+`css` inline, ver
  // `components/cards/ActivePentestsSeverityCard/index.tsx`) — este projeto
  // não tem um token de transição equivalente a `t.transition.*` do UX
  // (`src/theme.ts` não declara nenhum), então a duração literal ("0.3s")
  // aqui é o MESMO padrão já estabelecido no fork para animações pontuais
  // deste tipo, não um hardcode novo introduzido por esta Tarefa.
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [quantityValue, amountValue]);

  const quantityNumber = quantityValue ?? 0;
  const amountNumber = amountValue ?? 0;
  const totalAmountComputed = quantityNumber * amountNumber;
  const averageCostComputed = quantityNumber > 0 ? totalAmountComputed / quantityNumber : 0;

  function formatCurrencyDisplay(value: number, decimalPlaces: number): string {
    const [integerPart, decimalPart] = value.toFixed(decimalPlaces).split('.');
    const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimalPart ? `R$ ${grouped},${decimalPart}` : `R$ ${grouped}`;
  }

  async function tryPersistOpeningBalance(data: OpeningBalanceFormType) {
    // `farm_id` NUNCA no payload (header `X-Farm-Id`/contexto, mesmo padrão
    // de Warehouse). `total_amount`/`average_cost` NUNCA enviados calculados
    // pelo client — RN-03/RN-05 é responsabilidade do servidor (contrato §6).
    const payload: OpeningBalancePayload = {
      product_uuid: data.product_uuid!.value,
      warehouse_uuid: data.warehouse_uuid!.value,
      quantity: Number(data.quantity),
      amount: Number(data.amount),
      provider_lot: data.provider_lot?.trim() || undefined,
      expiration_date: data.expiration_date || undefined,
      // Zona 4 (TASK-FE-1044) — só monta se o produto atual exige os campos
      // de Café (`requiresCoffeeFields`); evita enviar valores residuais do
      // form (ex.: usuário trocou de um produto de Café para outro) quando a
      // seção está oculta.
      ...(requiresCoffeeFields
        ? {
            cultivation_uuid: data.cultivation_uuid?.value || undefined,
            drink: data.drink?.value ?? undefined,
          }
        : {}),
    };

    if (isEditing && openingBalanceId) {
      return await updateOpeningBalance(openingBalanceId, payload);
    }
    return await createOpeningBalance(payload);
  }

  // Mutation bespoke (NÃO `useRequest` genérico) — mirror
  // `PlanAccountImportModal.tsx` (Roteiro da Tarefa, achado registrado no
  // contrato §6): `useRequest.onError` é FIXO (só toast da `resData.message`)
  // e não permite diferenciar o 422 de duplicidade para acionar o banner
  // inline em vez do toast genérico.
  const openingBalanceMutation = useMutation({
    mutationFn: tryPersistOpeningBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.openingBalances.openingBalancesList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.openingBalances.openingBalance] });
      toaster.success({
        title: text.singularLabel,
        description: isEditing
          ? languageGB.defaltStrings.updateRegister
          : languageGB.defaltStrings.createRegister,
        duration: 7000,
      });
      navigate(-1);
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : null;
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const validationErrors = resData?.errors as Record<string, string[]> | undefined;

      // Duplicidade real (Rule::unique product_uuid+warehouse_uuid+provider_lot,
      // contrato API §5) — ver decisão registrada no cabeçalho do arquivo.
      const isDuplicateError =
        status === 422 &&
        !!validationErrors &&
        (Object.prototype.hasOwnProperty.call(validationErrors, 'product_uuid') ||
          Object.prototype.hasOwnProperty.call(validationErrors, 'warehouse_uuid'));

      if (isDuplicateError) {
        setDuplicateErrorMessage(
          validationErrors?.product_uuid?.[0] ??
            validationErrors?.warehouse_uuid?.[0] ??
            formText.duplicateAlert.title
        );
        return;
      }

      toaster.error({
        title: text.singularLabel,
        description: extractApiFieldErrorMessage(error) ?? resData?.message ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = openingBalanceMutation.isPending;

  // ⚠️ ERRO-FE-001 — mesma armadilha, `!isEmpty(dirtyFields)` (o `!` é
  // OBRIGATÓRIO): em edição, se NADA mudou, só volta pra lista sem chamar a
  // mutação (evita um PUT vazio).
  async function onSubmit(data: OpeningBalanceFormType) {
    setDuplicateErrorMessage(null);
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await openingBalanceMutation.mutateAsync(data);
    }
  }

  // Cobre o formulário INTEIRO (não há abas nesta tela, mas as 3 Zonas são
  // colapsáveis — um erro numa seção que o usuário colapsou manualmente
  // ficaria invisível sem este aviso, mesma classe de armadilha do
  // `onInvalid` cross-tab do Produto).
  function onInvalid(formErrors: typeof errors) {
    if (Object.keys(formErrors).length === 0) return;
    toaster.error({
      title: text.singularLabel,
      description: formText.errors.invalidFields,
      duration: 6000,
    });
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ── ZONA 1 — IDENTIFICAÇÃO ─────────────────────────────────────── */}
        <CollapsibleSection title={formText.sections.identification} fieldCount={3} defaultOpen>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="product_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.product}
                  placeholder={formText.placeholders.product}
                  error={errors.product_uuid?.message as string | undefined}
                  service={listProducts}
                  mapOptions={(item: ProductListItem) => ({
                    label: item.code ? `${item.code} — ${item.description}` : item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    if (!option) {
                      setMeasurementDescription('');
                      setHasLot(false);
                    }
                  }}
                  isRequired
                  // Fidelidade de INTENÇÃO (não do bug) — o legado tenta
                  // `<select readonly>` na edição sem efeito real (Doc Bruta
                  // §16 achado 5); o fork trava de fato via `isDisabled`.
                  isDisabled={isEditing || !canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="warehouse_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.warehouse}
                  placeholder={formText.placeholders.warehouse}
                  error={errors.warehouse_uuid?.message as string | undefined}
                  service={listWarehouseOptions}
                  pageSize={FLAT_CATALOG_PAGE_SIZE}
                  mapOptions={(item: WarehouseOption) => ({
                    label: `${item.initials} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={!canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <InputReadOnly
              label={formText.fields.measurement}
              value={measurementDescription || '—'}
              helperText={formText.hints.measurementAutoFilled}
              loading={isLoading || productDetailQuery.isLoading}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ── ZONA 2 — QUANTIDADES & VALORES ────────────────────────────── */}
        <CollapsibleSection title={formText.sections.quantitiesValues} fieldCount={4} defaultOpen>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.quantity}
                  allowDot
                  decimalPlaces={3}
                  max={99999999.99}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.amount}
                  allowDot
                  decimalPlaces={3}
                  max={999999999.999}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Box
              key={`total-amount-${flashKey}`}
              css={{
                animation: 'openingBalanceFlash 0.3s ease',
                '@keyframes openingBalanceFlash': {
                  '0%': { backgroundColor: 'var(--chakra-colors-green-100)' },
                  '100%': { backgroundColor: 'transparent' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animationDuration: '0.01ms',
                },
              }}
              borderRadius="md"
            >
              <InputReadOnly
                label={formText.fields.totalAmount}
                value={formatCurrencyDisplay(totalAmountComputed, 2)}
                helperText={formText.hints.totalAmountFormula}
              />
            </Box>
            <Box
              key={`average-cost-${flashKey}`}
              css={{
                animation: 'openingBalanceFlash 0.3s ease',
                '@keyframes openingBalanceFlash': {
                  '0%': { backgroundColor: 'var(--chakra-colors-green-100)' },
                  '100%': { backgroundColor: 'transparent' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animationDuration: '0.01ms',
                },
              }}
              borderRadius="md"
            >
              <InputReadOnly
                label={formText.fields.averageCost}
                value={formatCurrencyDisplay(averageCostComputed, 4)}
                helperText={formText.hints.averageCostFormula}
              />
            </Box>
          </SimpleGrid>

          {duplicateErrorMessage && (
            <Alert.Root status="warning" mt={6} borderRadius="md">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{formText.duplicateAlert.title}</Alert.Title>
                <Alert.Description>{duplicateErrorMessage}</Alert.Description>
              </Alert.Content>
              <Button
                title={formText.duplicateAlert.dismissAction}
                variant="outline"
                onClick={() => setDuplicateErrorMessage(null)}
                type="button"
              />
            </Alert.Root>
          )}
        </CollapsibleSection>

        {/* ── ZONA 3 — INFORMAÇÕES ADICIONAIS (condicional a has_lot) ───── */}
        {hasLot && (
          <CollapsibleSection title={formText.sections.additionalInfo} fieldCount={2} defaultOpen>
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <Input
                label={formText.fields.providerLot}
                placeholder={formText.placeholders.providerLot}
                maxLength={15}
                {...register('provider_lot')}
                error={errors.provider_lot?.message}
                isRequired
                disabled={!canSave || isLoading}
              />

              <Box>
                <Box mb={1} fontSize="sm" fontWeight="medium">
                  {formText.fields.expirationDate}
                </Box>
                <Controller
                  name="expiration_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
                {errors.expiration_date?.message && (
                  <Box color="fg.error" fontSize="xs" mt={1}>
                    {errors.expiration_date.message}
                  </Box>
                )}
              </Box>
            </SimpleGrid>
          </CollapsibleSection>
        )}

        {/* ── ZONA 4 — INFORMAÇÕES DO CAFÉ (condicional a requires_coffee_fields) ── */}
        {requiresCoffeeFields && (
          <CollapsibleSection
            title={formText.sections.coffeeInfo}
            fieldCount={2}
            defaultOpen={false}
          >
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <Controller
                name="cultivation_uuid"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.classification}
                    placeholder={formText.placeholders.classification}
                    error={fieldState.error?.message as string | undefined}
                    service={listCultivationOptions}
                    pageSize={FLAT_CATALOG_PAGE_SIZE}
                    mapOptions={(item: CultivationOption) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="drink"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    name={name}
                    label={formText.fields.drink}
                    value={
                      drinkOptions
                        .options(languageGB)
                        .find((option) => option.value === value?.value) ?? null
                    }
                    onChange={(option) => onChange(option ?? null)}
                    options={drinkOptions.options(languageGB)}
                    error={error?.message}
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>
          </CollapsibleSection>
        )}
      </Form>
    </FormContainer>
  );
}
