// src/pages/Administrativo/Solicitacao/RequestQuotationItemsPanel.tsx
// -----------------------------------------------------------------------------
// Quadro "Itens" da aba Cotações (execução 081, T-081-FE-08; contrato LEGADO 05
// P20/P21; API: `PUT request-purchases/{uuid}/quotation-items`, EXEC-API-07).
//
// Legado (`request-quotations/quotation.blade.php:90-125` + `_card-item`):
// solicitação P ou U com item sem produto mostra o aviso "Informe todos os
// produtos para prosseguir com a cotação" e os itens EDITÁVEIS (Produto com
// botão "+" de cadastro, Quantidade, Descrição de até 60 caracteres) com o botão
// "Salvar"; a grade de fornecedores só volta quando todos os itens têm produto.
// A API só grava itens (nunca remove) e só nos status 1 e 2, então a linha não
// tem botão de remover e o quadro não oferece "Adicionar item".
//
// Quem decide se a grade aparece é a aba (`hasItemsWithoutProduct`); este
// componente só edita e salva. Mutação por `useRequest` (toast + invalidação do
// detalhe da solicitação e da grade de cotações). Sem produto, a linha mostra
// o erro de campo obrigatório do servidor (422 por campo: `items.N.*`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Alert, Box, Flex, Icon, IconButton, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiEdit, FiPlus } from 'react-icons/fi';

import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { listProductOptions } from '@/services/v2/Products/product-service';
import { updateQuotationStageItems } from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestItemRow, RequestPurchaseData } from '@/@types/v2/RequestPurchases';
import type {
  QuotationStageItemsForm,
  QuotationStageItemsPayload,
} from '@/@types/v2/RequestQuotations';

import {
  buildStageItemRows,
  buildStageItemsPayload,
  STAGE_ITEM_DESCRIPTION_MAX,
} from './quotationStageItems';

import type { ProductFormModalSavedPayload } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';
import type { Control } from 'react-hook-form';

interface ProductFieldProps {
  control: Control<QuotationStageItemsForm>;
  index: number;
  disabled: boolean;
}

function StageItemProductField({ control, index, disabled }: ProductFieldProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.requestPurchases.requestPurchase.form;
  const productModal = useDisclosure();
  const [optionsCacheKey, setOptionsCacheKey] = useState(0);

  return (
    <Controller
      name={`items.${index}.product`}
      control={control}
      render={({ field }) => {
        const hasProduct = !!field.value;
        const actionLabel = hasProduct ? text.guards.productEdit : text.guards.productAdd;
        const canManageProduct = can('products_create') || can('products_edit');

        function handleProductSaved(product: ProductFormModalSavedPayload) {
          field.onChange({ label: product.label, value: product.uuid });
          setOptionsCacheKey((key) => key + 1);
        }

        return (
          <>
            <SelectAsyncPaginate
              name={field.name}
              label={text.itemsSection.fields.product}
              service={listProductOptions}
              mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={disabled}
              cacheUniqs={[optionsCacheKey]}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              labelActionTooltip={actionLabel}
              labelAction={
                <IconButton
                  aria-label={actionLabel}
                  variant="ghost"
                  size="2xs"
                  minH="0"
                  h="20px"
                  w="20px"
                  minW="0"
                  p="0"
                  disabled={disabled || !canManageProduct}
                  onClick={productModal.onOpen}
                >
                  <Icon as={hasProduct ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                </IconButton>
              }
            />
            <ProductFormModal
              isOpen={productModal.open}
              onClose={productModal.onClose}
              productUuid={field.value?.value}
              onSaved={handleProductSaved}
            />
          </>
        );
      }}
    />
  );
}

interface RequestQuotationItemsPanelProps {
  requestPurchaseUuid: string;
  items: ReadonlyArray<RequestItemRow>;
  /** `true` = os itens podem ser editados e salvos (P21); `false` = leitura. */
  editable: boolean;
  /** Mostra o aviso de bloqueio (P20) acima dos itens. */
  showBlockedNotice: boolean;
}

export function RequestQuotationItemsPanel({
  requestPurchaseUuid,
  items,
  editable,
  showBlockedNotice,
}: RequestQuotationItemsPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.stage.itemsBlock;
  const requestText = languageGB.requestPurchases.requestPurchase;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { dirtyFields, isSubmitting },
  } = useForm<QuotationStageItemsForm>({
    mode: 'onChange',
    defaultValues: { items: buildStageItemRows(items) },
  });
  const { fields } = useFieldArray({ control, name: 'items' });

  // Lei 2: `fillForm` nomeada, só recarrega se o usuário não estiver editando.
  function fillItemsForm(data: ReadonlyArray<RequestItemRow>, resetForce?: boolean) {
    if (isEmpty(dirtyFields) || resetForce) {
      reset({ items: buildStageItemRows(data) });
    }
  }

  const itemsSignature = items.map((item) => `${item.uuid}:${item.product?.uuid ?? ''}`).join('|');
  useEffect(() => {
    fillItemsForm(items, true);
  }, [itemsSignature]);

  const saveMutation = useRequest<RequestPurchaseData>({
    asyncFunction: async (payload: QuotationStageItemsPayload) =>
      updateQuotationStageItems(requestPurchaseUuid, payload),
    entityName: requestText.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchase,
    queryKey2: queryKey.requestQuotations.requestQuotationsByPurchase,
    queryKey3: queryKey.requestPurchases.inQuotationList,
    typesRequest: 'update',
    personalizedMessage: text.savedToast,
    actionSuccess: () => {},
  });

  async function onSubmit(data: QuotationStageItemsForm) {
    try {
      await saveMutation.mutateAsync(buildStageItemsPayload(data));
    } catch (error: any) {
      // 422 por campo (`items.N.quantity` ...): o toast já foi mostrado pelo hook.
      const errors = error?.response?.data?.errors as Record<string, string[]> | undefined;
      Object.entries(errors ?? {}).forEach(([key, messages]) => {
        if (messages?.[0] && /^items\.\d+\./.test(key)) {
          setError(key as `items.${number}.quantity`, { type: 'server', message: messages[0] });
        }
      });
    }
  }

  const isBusy = isSubmitting || saveMutation.isPending;

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="semibold" mb={3}>
        {text.title}
      </Text>

      {showBlockedNotice && (
        <Alert.Root status="warning" borderRadius="md" mb={4}>
          <Alert.Indicator>
            <Icon as={FiAlertTriangle} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>{text.blockedNotice}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      <form id="quotation-stage-items-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <VStack align="stretch" gap={3}>
          {fields.map((field, index) => (
            <Flex
              key={field.id}
              gap={4}
              wrap="wrap"
              pb={3}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              <Box flex="2" minW="260px">
                <StageItemProductField
                  control={control}
                  index={index}
                  disabled={!editable || isBusy}
                />
              </Box>
              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  rules={{
                    validate: (value) => (value ?? 0) > 0 || text.quantityRequired,
                  }}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      allowDot
                      name={rowField.name}
                      label={text.columns.quantity}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      decimalPlaces={2}
                      min={0}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={!editable || isBusy}
                    />
                  )}
                />
              </Box>
              <Box flex="2" minW="260px">
                <Controller
                  name={`items.${index}.description`}
                  control={control}
                  rules={{ validate: (value) => !!value.trim() || text.descriptionRequired }}
                  render={({ field: rowField, fieldState }) => (
                    <Input
                      label={text.columns.description}
                      name={rowField.name}
                      maxLength={STAGE_ITEM_DESCRIPTION_MAX}
                      value={rowField.value ?? ''}
                      onChange={(event) => rowField.onChange(event.target.value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={!editable || isBusy}
                    />
                  )}
                />
              </Box>
            </Flex>
          ))}
        </VStack>

        {editable && (
          <Flex justify="flex-end" mt={4}>
            <Button
              title={text.saveButton}
              type="submit"
              form="quotation-stage-items-form"
              loading={isBusy}
            />
          </Flex>
        )}
      </form>
    </Box>
  );
}
