import { useEffect } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { finishTransferSchemaResolver } from '@/validations/schemas/Transfers/finish-transfer-schema';

import type {
  TransferFinishDetail,
  TransferFinishForm,
  TransferFinishPayload,
} from '@/@types/v2/Transfers';

import { useFinishTransfer, useTransferFinishForm } from './useRomaneios';

const ROMANEIOS_LIST_ROUTE = '/operacional/romaneios';
const NO_DATA = '—';

export default function FinishRomaneio() {
  const { transferUuid } = useParams<{ transferUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.transfers.transfer;
  const formText = text.form;
  const screenText = text.finish;

  const isValidId = isValidGuid(transferUuid);
  const detailRoute = `${ROMANEIOS_LIST_ROUTE}/${transferUuid}/detalhe`;

  useEffect(() => {
    if (transferUuid && !isValidId) {
      navigate(ROMANEIOS_LIST_ROUTE, { replace: true });
    }
  }, [transferUuid, isValidId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransferFinishForm>({
    mode: 'onChange',
    resolver: finishTransferSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: { items: [] },
  });

  const { fields: itemFields } = useFieldArray({ control, name: 'items' });

  function fillForm(data: TransferFinishDetail) {
    if (data.status !== 'P') {
      navigate(detailRoute, { replace: true });
      return;
    }

    reset({
      items: data.items.map((item) => ({
        uuid: item.uuid,
        product_label: item.product?.description ?? NO_DATA,
        measurement_label: item.measurement?.name ?? NO_DATA,
        quantity: item.quantity,
        delivery_quantity:
          item.delivery_quantity !== null && item.delivery_quantity > 0
            ? item.delivery_quantity
            : item.quantity,
      })),
    });
  }

  const finishQuery = useTransferFinishForm({
    registrationId: isValidId ? transferUuid : undefined,
    fillForm,
  });

  const finishDetail = finishQuery.data as TransferFinishDetail | undefined;
  const isLoading = checkLoadingStatus([finishQuery as any]);

  const canFinish = can('transfers_edit') && finishDetail?.status === 'P';

  const finishMutation = useFinishTransfer({
    actionSuccess: () => navigate(detailRoute),
  });

  const isSubmitting = finishMutation.isPending;

  function onSubmit(data: TransferFinishForm) {
    if (!transferUuid) return;

    const payload: TransferFinishPayload = {
      items: data.items.map((item) => ({
        uuid: item.uuid,
        delivery_quantity: item.delivery_quantity!,
      })),
    };

    finishMutation.mutate({ uuid: transferUuid, payload });
  }

  if (!isValidId) {
    return null;
  }

  return (
    <FormContainer title={screenText.title} subtitle={screenText.subtitle} showDivider>
      <Form noPadding paddingX="5" onSubmit={handleSubmit(onSubmit)}>
        <Text fontWeight="semibold" mb={3}>
          {screenText.itemsSectionTitle}
        </Text>
        {itemFields.map((field, index) => (
          <Box
            key={field.id}
            p={4}
            mb={3}
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            <SimpleGrid columns={columnsForm.default} gap={4}>
              <InputReadOnly
                label={formText.itemRow.fields.product}
                value={watch(`items.${index}.product_label`)}
              />
              <InputReadOnly
                label={formText.itemRow.fields.measurement}
                value={watch(`items.${index}.measurement_label`)}
              />
              <InputReadOnly
                label={formText.itemRow.fields.quantity}
                value={watch(`items.${index}.quantity`).toLocaleString('pt-BR')}
              />
              <Controller
                name={`items.${index}.delivery_quantity`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={screenText.deliveryQuantityLabel}
                    allowDot
                    decimalPlaces={4}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value)}
                    error={errors.items?.[index]?.delivery_quantity?.message as string | undefined}
                    isRequired
                    disabled={!canFinish}
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        ))}

        <FormFooter noPadding>
          <Button
            title={screenText.cancelButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canFinish && (
            <Button
              title={screenText.submitButton}
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </FormFooter>
      </Form>
    </FormContainer>
  );
}
