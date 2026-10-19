// src/pages/Frota/Transferencias/ReceberTransferencia.tsx
// -----------------------------------------------------------------------------
// Tela de RECEBIMENTO de Transferência de Máquinas —
// `/frota/transferencias/:uuid/receber` (TASK-ETR-FE-04, SURF-17/SURF-18).
// Rota própria, NÃO modal — o legado usa URL dedicada com GET+POST e a ação
// carrega upload de arquivo (fid-g3f §3.12, PADRÃO 14 do catálogo genérico
// não se aplica aqui).
//
// Máquinas são LISTA READ-ONLY — nunca select, nunca editável (CL-20).
// Reutiliza `TransferAttachmentsFieldArray`/`TransferAttachmentRow` da
// Tarefa 54 SEM alteração — como esses componentes são tipados contra
// `Control<EquipmentTransferForm>`, o `control` deste formulário (tipado
// `ReceiveEquipmentTransferForm`) é passado por CAST explícito, mirror
// `FarmTransferItemsEditor.tsx:330` (`genericControl`) — mesmo idioma já
// consolidado no repositório para esta exata situação (sub-registro
// compartilhado por dois formulários-pai distintos).
//
// O recebimento MOVE `Equipment.farm_id` (SE-02) — invalidação de cache
// ALÉM da própria transferência: `queryKey.equipments.equipmentsList`
// (listagem/lookup de Máquinas), ponto crítico da feature (fid-g3f §3.6).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Skeleton, Table, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { receiveEquipmentTransfer } from '@/services/v2/EquipmentTransfers/equipment-transfer-service';
import type { ReceiveEquipmentTransferPayload } from '@/services/v2/EquipmentTransfers/equipment-transfer-service';

import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type {
  EquipmentTransferDetail,
  EquipmentTransferForm,
  ReceiveEquipmentTransferForm,
} from '@/@types/v2/EquipmentTransfers';

import { TransferAttachmentsFieldArray } from './TransferAttachmentsFieldArray';
import { useEquipmentTransferDetail } from './useTransferencias';

import type { Control, FieldErrors } from 'react-hook-form';

const TRANSFERENCIAS_LIST_ROUTE = '/frota/transferencias';

const defaultValues: ReceiveEquipmentTransferForm = {
  receipt_date: null,
  employee: null,
  attachments: [],
};

export default function ReceberTransferencia() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.equipmentTransfers.equipmentTransfer;
  const receiveText = text.receive;
  const validUuid = isValidGuid(uuid);
  const canReceive = can('equipment-transfer_create');

  // Guarda de rota — efeito colateral em `useEffect`, nunca um early
  // `return` antes dos hooks abaixo (Regra dos Hooks).
  useEffect(() => {
    if (!validUuid) {
      navigate(TRANSFERENCIAS_LIST_ROUTE, { replace: true });
    }
  }, [validUuid, navigate]);

  const [detail, setDetail] = useState<EquipmentTransferDetail | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<ReceiveEquipmentTransferForm>({
    mode: 'onChange',
    defaultValues,
  });

  // LEI 2 — `fillForm` nomeada com guarda `isEmpty(dirtyFields)` (mirror
  // `CreateOrUpdateAbastecimento.fillSupplyForm`), `resetForce=true` na
  // carga inicial (`useCustomFormQueryByGuid` sempre chama assim).
  function fillReceiveForm(data: EquipmentTransferDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetail(data);
      reset({
        receipt_date: data.receipt_date,
        employee: data.employee ? { value: data.employee.uuid, label: data.employee.name } : null,
        attachments: [],
      });
    }
  }

  // Mesmo cast de tipo documentado em `useEquipmentTransferDetail`
  // (`Response<TData>` não declara `isError`/`isLoading`/`refetch`).
  const detailQuery = useEquipmentTransferDetail({
    uuid: validUuid ? uuid : undefined,
    fillForm: fillReceiveForm,
  }) as any;

  const isLoadingDetail = checkLoadingStatus([detailQuery]);
  const isErrorState = !isLoadingDetail && detailQuery.isError;

  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const receiveMutation = useRequest({
    asyncFunction: tryReceiveEquipmentTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.equipmentTransfers.equipmentTransfers,
    queryKey2: queryKey.equipmentTransfers.equipmentTransfer,
    // SE-02 — o recebimento move `Equipment.farm_id`: invalida TAMBÉM a
    // listagem/lookup de Máquinas (fid-g3f §3.6/FE-16), não só a
    // transferência.
    queryKey3: queryKey.equipments.equipmentsList,
    typesRequest: 'apply',
    personalizedMessage: receiveText.successMessage,
    actionSuccess: () => navigate(TRANSFERENCIAS_LIST_ROUTE),
  });

  async function tryReceiveEquipmentTransfer(data: ReceiveEquipmentTransferForm) {
    if (!uuid) throw new Error('uuid inválido');
    const payload: ReceiveEquipmentTransferPayload = {
      employee_uuid: data.employee!.value,
      receipt_date: data.receipt_date!,
      attachments: data.attachments.filter((attachment) => !!attachment.file),
    };
    return receiveEquipmentTransfer(uuid, payload);
  }

  async function onSubmit(data: ReceiveEquipmentTransferForm) {
    await receiveMutation.mutateAsync(data);
  }

  const isSaving = isSubmitting || receiveMutation.isPending;

  // Reutilização SEM alteração dos componentes de anexo da Tarefa 54
  // (tipados `Control<EquipmentTransferForm>`) — cast de tipo, mirror
  // `FarmTransferItemsEditor.tsx` (`control as unknown as Control<...>`).
  const attachmentsControl = control as unknown as Control<EquipmentTransferForm>;
  const attachmentsErrors = errors as unknown as FieldErrors<EquipmentTransferForm>;

  if (!validUuid) {
    return null;
  }

  if (isErrorState) {
    return (
      <FormContainer title={receiveText.pageTitle}>
        <Box px={{ base: 4, md: 10 }} pb={8}>
          <EmptyState
            variant="error"
            message={text.list.emptyState.titleError}
            description={text.list.emptyState.descriptionError}
            onRetry={() => detailQuery.refetch()}
            retryLabel={text.list.emptyState.retry}
          />
        </Box>
      </FormContainer>
    );
  }

  return (
    <>
      <FormContainer
        title={receiveText.pageTitle}
        subtitle={receiveText.pageSubtitle}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(TRANSFERENCIAS_LIST_ROUTE)}
            />
            {canReceive && (
              // `ButtonSaveAndNext` ignora `children` (renderiza sempre
              // `languageGB.defaltStrings.save` — componente global
              // compartilhado por ~51 pontos de uso, fora de escopo desta
              // Tarefa). `receiveText.submit` fica reservado para outro
              // consumidor futuro que aceite rótulo customizado.
              <ButtonSaveAndNext
                create={false}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving}
              />
            )}
          </>
        }
      >
        <Form id="equipment-transfer-receive-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <Skeleton loading={isLoadingDetail}>
            {/* Cabeçalho READ-ONLY — código, responsável, data, fazendas */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={6}>
              <InputReadOnly label={text.list.table.code} value={detail?.code ?? '—'} />
              <InputReadOnly
                label={text.list.table.responsible}
                value={detail?.user?.name ?? '—'}
              />
              <InputReadOnly
                label={text.list.table.date}
                value={detail?.date ? formatDate(detail.date) : '—'}
              />
              <InputReadOnly
                label={text.list.table.farmOrigin}
                value={detail?.farm?.description ?? '—'}
              />
              <InputReadOnly
                label={text.list.table.farmDestination}
                value={detail?.farm_out?.description ?? '—'}
              />
            </SimpleGrid>

            {/* Máquinas — LISTA READ-ONLY, NUNCA select (CL-20) */}
            <Box mt={6}>
              <Text fontSize="md" fontWeight="semibold" color="fg.default" mb={3}>
                {text.list.table.equipments}
              </Text>
              {(detail?.equipments ?? []).length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  —
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Body>
                      {(detail?.equipments ?? []).map((equipment) => (
                        <Table.Row key={equipment.uuid}>
                          <Table.Cell>{equipment.description}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Box>
          </Skeleton>

          {/* Campos editáveis do recebimento */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={6} mt={6}>
            <Controller
              name="receipt_date"
              control={control}
              rules={{ required: receiveText.fields.receiptDateRequired }}
              render={({ field: { value, onChange } }) => (
                <Field
                  label={receiveText.fields.receiptDate}
                  isRequired
                  errorText={errors.receipt_date?.message as string | undefined}
                >
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={!canReceive || isSaving}
                  />
                </Field>
              )}
            />

            <Controller
              name="employee"
              control={control}
              rules={{ required: receiveText.fields.employeeRequired }}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={receiveText.fields.employee}
                  error={errors.employee?.message as string | undefined}
                  service={listEmployeeOptions}
                  mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={!canReceive || isSaving}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>

          {/* Anexos — reutiliza a Tarefa 54 SEM alteração (0 linhas iniciais,
              descarte de linhas sem `file`, sem `accept`/`maxSizeMb`) */}
          <Box mt={2}>
            <TransferAttachmentsFieldArray
              control={attachmentsControl}
              errors={attachmentsErrors}
              isDisabled={!canReceive || isSaving}
            />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={text.form.unsavedChangesDialog.title}
        description={text.form.unsavedChangesDialog.description}
        confirmButtonText={text.form.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
