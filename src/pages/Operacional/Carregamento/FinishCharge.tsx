// src/pages/Operacional/Carregamento/FinishCharge.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Finalizar carregamento" — TASK-FE-CG-05 (AM-05), mirror
// estrutural `Appropriations/FinishAppropriation.tsx` (rota própria, reidrata
// o registro inteiro, envia o payload de finalização numa ÚNICA chamada).
//
// Rota: `/operacional/carregamento/:chargeUuid/finalizar`, gate `charge_edit`
// (decisão a do dono, já fechada na camada `api` — `FinishChargeRequest::
// authorize()` reusa o MESMO slug, `ChargeController::middleware()` aplica
// `charge_edit` a `finish`).
//
// Não existe `GET .../finish` dedicado na API nova — reidrata pelo MESMO
// `getCharge`/`useChargeForm` já usado por `CreateOrUpdateCharge.tsx`.
//
// Itens EXISTENTES (`item_uuid` presente) são majoritariamente `InputReadOnly`
// (mirror `_card-item-finish` do legado) — só `quantity_real` é editável;
// não há `useFieldArray` de add/remove aqui (o array é sempre exatamente o
// que veio hidratado, 1:1 com `chargeDetail.items`). Item NOVO é 1 slot
// ÚNICO opcional (`new_item`) — preencher os 3 campos lança 1 item adicional
// na finalização (mirror `FinishChargeRequest`, `item_uuid` ausente ⇒
// `product_uuid`/`quantity`/`amount` obrigatórios).
//
// Guard AM-05 — só permite finalizar um Charge `pendente`; acessar a rota
// diretamente para um Charge já `finalizada` (ação oculta na UI, mas a rota
// em si não tem 403 de servidor) devolve o usuário para a tela de
// edição/visualização (`CreateOrUpdateCharge.tsx`), nunca um formulário
// "finalizável" que na prática o backend rejeitaria (o `FinishChargeAction`
// não impõe status server-side neste endpoint, mas a UX preserva o fluxo
// AM-05→AM-07 do legado).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { normalizeDocument } from '@/utils/cpfCnpj';
import { isValidGuid } from '@/utils/guid';
import { formatPlateIfValid } from '@/utils/masks/plate';

import { columnsForm } from '@/constants/coluns-form';

import { finishChargeSchemaResolver } from '@/validations/schemas/Carregamentos/finish-charge-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStateOptions } from '@/services/v2/States/state-service';

import type { Option } from '@/@types/option';
import type {
  ChargeDetail,
  FinishChargeForm as FinishChargeFormValues,
  FinishChargePayload,
} from '@/@types/v2/Carregamentos';
import type { ProductOption } from '@/@types/v2/Products';

import { useChargeForm, useFinishCharge } from './useCarregamentos';

const defaultValues: FinishChargeFormValues = {
  driver_name: '',
  driver_plate: '',
  driver_uf: null,
  driver_nif: '',
  items: [],
  new_item: { product_uuid: null, quantity: null, amount: null },
};

export default function FinishCharge() {
  const { chargeUuid } = useParams<{ chargeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.carregamentos.charge;
  const formText = text.form;
  const screenText = text.finish;

  const isValidId = isValidGuid(chargeUuid);
  const detailRoute = `/operacional/carregamento/${chargeUuid}`;

  useEffect(() => {
    if (chargeUuid && !isValidId) {
      navigate('/operacional/carregamento', { replace: true });
    }
  }, [chargeUuid, isValidId, navigate]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<FinishChargeFormValues>({
    mode: 'onChange',
    resolver: finishChargeSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues,
  });

  const { fields: itemFields } = useFieldArray({ control, name: 'items' });

  function fillForm(data: ChargeDetail) {
    // AM-05 — só um Charge `pendente` pode ser finalizado. Acessar a rota
    // direto para um já `finalizada` devolve à tela de edição/visualização
    // (ação oculta na UI, mirror da Leitura do dev da Tarefa).
    if (data.status !== 'pendente') {
      navigate(detailRoute, { replace: true });
      return;
    }

    reset({
      driver_name: data.driver_name ?? '',
      driver_plate: formatPlateIfValid(data.driver_plate),
      driver_uf: data.driver_uf ? { label: data.driver_uf, value: data.driver_uf } : null,
      driver_nif: data.driver_nif ?? '',
      items: data.items.map((item) => ({
        item_uuid: item.uuid,
        product_label: item.product?.description ?? '—',
        quantity: item.quantity,
        amount: item.amount,
        // Default sugerido = quantidade prevista (o usuário ajusta se a
        // realizada divergir) — `quantity_real` só é preenchido de verdade
        // pelo servidor após este `finish` (`0` até lá, nunca reaproveitado
        // como default por não ser um valor real ainda).
        quantity_real: item.quantity,
      })),
      new_item: { product_uuid: null, quantity: null, amount: null },
    });
  }

  const chargeQuery = useChargeForm({
    registrationId: isValidId ? (chargeUuid ?? '') : '',
    fillForm,
  });

  const chargeDetail = chargeQuery.data as ChargeDetail | undefined;
  const isLoading = checkLoadingStatus([chargeQuery as any]);

  const canFinish = can('charge_edit') && chargeDetail?.status === 'pendente';

  // ---- Satélite estático de UF (mirror `CreateOrUpdateCharge.tsx`) ---------
  const stateOptionsQuery = useQuery({
    queryKey: ['carregamentos-finish-state-options'],
    queryFn: () => listStateOptions({ per_page: 100 }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const stateCatalogOptions: Option<string>[] = (stateOptionsQuery.data?.data.items ?? []).map(
    (item) => ({ label: item.title, value: item.letter })
  );
  const currentDriverUf = watch('driver_uf');
  const resolvedDriverUf = currentDriverUf
    ? (stateCatalogOptions.find((option) => option.value === currentDriverUf.value) ??
      currentDriverUf)
    : null;

  const finishMutation = useFinishCharge({
    actionSuccess: () => navigate(detailRoute),
  });

  const isSubmitting = finishMutation.isPending;

  function onSubmit(data: FinishChargeFormValues) {
    if (!chargeUuid) return;

    const payload: FinishChargePayload = {
      driver_name: data.driver_name.trim() || null,
      driver_plate: data.driver_plate.trim() || null,
      driver_uf: data.driver_uf?.value ?? null,
      // CL-44/CL-45 (fix crítico, mirror `CreateOrUpdateCharge.tsx`) —
      // persistir `[0-9A-Z]` via `normalizeDocument` (CNPJ alfanumérico).
      driver_nif: normalizeDocument(data.driver_nif) || null,
      items: [
        // Linhas EXISTENTES — só `quantity_real` é enviado (mirror
        // `required_with:items.*.item_uuid`).
        ...data.items.map((item) => ({
          item_uuid: item.item_uuid,
          quantity_real: item.quantity_real!,
        })),
        // Slot de item NOVO — só entra no payload quando `product_uuid` foi
        // preenchido (caso majoritário: nenhum item novo nesta finalização).
        ...(data.new_item.product_uuid
          ? [
              {
                product_uuid: data.new_item.product_uuid.value,
                quantity: data.new_item.quantity!,
                amount: data.new_item.amount!,
              },
            ]
          : []),
      ],
    };

    finishMutation.mutate({ uuid: chargeUuid, payload });
  }

  if (!isValidId) {
    return null;
  }

  return (
    <FormContainer title={screenText.title} subtitle={screenText.subtitle} showDivider>
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={formText.fields.header.driverName}
            {...register('driver_name')}
            error={errors.driver_name?.message}
            maxLength={40}
            loading={isLoading}
            disabled={!canFinish}
          />
          <Controller
            name="driver_plate"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="plate"
                label={formText.fields.header.driverPlate}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                loading={isLoading}
                disabled={!canFinish}
              />
            )}
          />
          <Controller
            name="driver_uf"
            control={control}
            render={({ field: { name, onChange } }) => (
              <Select
                label={formText.fields.header.driverUf}
                name={name}
                value={resolvedDriverUf}
                onChange={(option) => onChange(option ?? null)}
                options={stateCatalogOptions}
                loading={stateOptionsQuery.isLoading}
                isDisabled={!canFinish}
              />
            )}
          />
          {/* FIX (#3, execução 045, mesmo bug de `CreateOrUpdateCharge.tsx`)
              — `Controller` em vez de `{...register('driver_nif')}`: o
              padrão `children` do `InputMask` nunca propagava o `onChange`
              mascarado ao `register`, então `driver_nif` chegava `null` ao
              payload de finalização. */}
          <Controller
            name="driver_nif"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={formText.fields.header.driverNif}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.driver_nif?.message}
                disabled={!canFinish}
              />
            )}
          />
        </SimpleGrid>

        <Text fontWeight="semibold" mb={3} mt={8}>
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
                label={formText.fields.item.product}
                value={watch(`items.${index}.product_label`)}
              />
              <InputReadOnly
                label={formText.fields.item.quantity}
                value={watch(`items.${index}.quantity`).toLocaleString('pt-BR')}
              />
              <InputReadOnly
                label={formText.fields.item.amount}
                value={watch(`items.${index}.amount`).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              />
              <Controller
                name={`items.${index}.quantity_real`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={screenText.quantityRealLabel}
                    allowDot
                    decimalPlaces={4}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value)}
                    error={errors.items?.[index]?.quantity_real?.message as string | undefined}
                    isRequired
                    disabled={!canFinish}
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        ))}

        <Text fontWeight="semibold" mb={1} mt={8}>
          {screenText.newItemSectionTitle}
        </Text>
        <Text fontSize="sm" color="fg.muted" mb={3}>
          {screenText.newItemHint}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={4}>
          <Controller
            name="new_item.product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.item.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canFinish}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
          <Controller
            name="new_item.quantity"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.fields.item.quantity}
                allowDot
                decimalPlaces={4}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={errors.new_item?.quantity?.message as string | undefined}
                disabled={!canFinish}
              />
            )}
          />
          <Controller
            name="new_item.amount"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.fields.item.amount}
                allowDot
                decimalPlaces={4}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={errors.new_item?.amount?.message as string | undefined}
                disabled={!canFinish}
              />
            )}
          />
        </SimpleGrid>

        <FormFooter noPadding>
          <Button
            title={screenText.cancelButton}
            variant="secondary"
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
