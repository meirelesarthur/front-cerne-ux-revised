// src/pages/Operacional/LoteFazenda/TransferBatchFarms/TransferBatchFarmFinancial.tsx
// -----------------------------------------------------------------------------
// Tela FINANCEIRA da Transferência de Lote entre Fazendas (SCR-FIN,
// 97-Esteiras/041, TASK-FE-041-LF-02). Rota
// `/operacional/lote-fazenda/transferencias/:uuid/financeiro`, alcançável só
// via ACT-11 (Gerar Financeiro — grid, fazenda de ORIGEM, `!has_financial`),
// guardada por `<RequirePermission permission="transfer_batch_farms_create">`.
// `GET/POST /transfer-batch-farms/{uuid}/financial`.
//
// Casca `FormContainer` (Voltar=ACT-13, Salvar=ACT-14). Reusa
// `TransferBatchFarmFinancialFieldsBlock.tsx` (cabeçalho financeiro +
// parcelas + rateio dobrado entrada/saída — TASK-FE-041-LF-06, extraído
// desta tela para ser IMPORTÁVEL também pelo `create`, `namePrefix`
// omitido aqui = comportamento IDÊNTICO ao anterior à extração).
// Fechamento (INT-17): a soma de CADA rateio precisa bater com `vl_total`
// antes do submit (client-side, fonte final é o 422 do backend).
//
// ACT-15/16 (R-29, TASK-FE-041-LF-04) — 2 botões de relatório de categorias
// financeiras (receber/pagar), independentes do estado do form (funcionam
// mesmo se o financeiro já tiver sido gerado antes).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiFileText } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { transferBatchFarmFinancialSchemaResolver } from '@/validations/schemas/LoteFazenda/transferBatchFarmFinancial-schema';

import { downloadFinancialCategoryTypeReport } from '@/services/v2/LoteFazenda/financialCategoryTypeReport-service';
import {
  getTransferBatchFarmFinancial,
  saveTransferBatchFarmFinancial,
} from '@/services/v2/LoteFazenda/transferBatchFarm-service';

import type { TransferBatchFarmFinancialForm } from '@/@types/v2/LoteFazenda/transferBatchFarm';

import {
  mapTransferBatchFarmFinancialPayload,
  TransferBatchFarmFinancialFieldsBlock,
} from './TransferBatchFarmFinancialFieldsBlock';

export default function TransferBatchFarmFinancial() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.loteFazenda.transferBatchFarm;
  const financialText = text.form.fields.financial;

  const canSave = can('transfer_batch_farms_create');

  const detailQuery = useQuery({
    queryKey: [queryKey.loteFazenda.financial, uuid],
    queryFn: () => getTransferBatchFarmFinancial(uuid as string),
    enabled: !!uuid,
  });
  const item = detailQuery.data?.data;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<TransferBatchFarmFinancialForm>({
    mode: 'onChange',
    resolver: transferBatchFarmFinancialSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      vl_total: 0,
      // Item 6 (reprovação AD F-022) — default "Dedutível" = Sim (mirror
      // legado `fiscal_document` select 0/1, default 1).
      fiscal_document: booleanOptions.getOption(true, languageGB),
      proprietary_uuid: null,
      qtd_installments: null,
      first_installment_date: null,
      int_installments: null,
      installments: [],
      income_categories: [],
      expense_categories: [],
      // Item 4 (reprovação AD F-022) — bloco "Possui entrada?" front-only
      // (mirror `transfer_form.blade.php`, nunca vai ao payload).
      has_input: null,
      input_date: null,
      input_value: null,
    },
  });

  const installmentsArray = useFieldArray({ control, name: 'installments' });
  const incomeArray = useFieldArray({ control, name: 'income_categories' });
  const expenseArray = useFieldArray({ control, name: 'expense_categories' });

  const financialMutation = useRequest({
    asyncFunction: trySaveFinancial,
    entityName: text.singularLabel,
    queryKey: queryKey.loteFazenda.transferBatchFarms,
    queryKey2: queryKey.loteFazenda.financial,
    typesRequest: 'create',
    personalizedMessage: financialText.savedToast,
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function trySaveFinancial(data: TransferBatchFarmFinancialForm) {
    return await saveTransferBatchFarmFinancial(
      uuid as string,
      mapTransferBatchFarmFinancialPayload(data)
    );
  }

  async function onSubmit(data: TransferBatchFarmFinancialForm) {
    await financialMutation.mutateAsync(data);
  }

  async function handleDownloadReport(type: 1 | 2) {
    try {
      const blob = await downloadFinancialCategoryTypeReport({ type });
      const win = window.open(URL.createObjectURL(blob), '_blank');
      if (!win) {
        toaster.error({
          title: text.singularLabel,
          description: financialText.reportPopupBlockedToast,
        });
      }
    } catch {
      toaster.error({ title: text.singularLabel, description: financialText.reportErrorToast });
    }
  }

  const isDisabled = !canSave;
  const submitting = isSubmitting || financialMutation.isPending;
  const alreadyGenerated = !!item?.has_financial;

  return (
    <FormContainer
      title={text.singularLabel}
      footer={
        <>
          <Button
            title={financialText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && !alreadyGenerated && (
            <ButtonSaveAndNext
              create
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={submitting}
              disabled={submitting}
            />
          )}
        </>
      }
    >
      <Box mb={4} display="flex" gap={3} flexWrap="wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={FiFileText as ElementType}
          title={financialText.reportReceivableButton}
          onClick={() => handleDownloadReport(2)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={FiFileText as ElementType}
          title={financialText.reportPayableButton}
          onClick={() => handleDownloadReport(1)}
        />
      </Box>

      {item && (
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
          <InputReadOnly label={text.form.fields.header.code} value={item.code} />
          <InputReadOnly
            label={text.form.fields.header.batch}
            value={item.batch?.description ?? '—'}
          />
          <InputReadOnly
            label={text.list.columns.farmFrom}
            value={item.farm_from?.description ?? '—'}
          />
          <InputReadOnly
            label={text.list.columns.farmTo}
            value={item.farm_to?.description ?? '—'}
          />
        </SimpleGrid>
      )}

      {alreadyGenerated ? (
        <Text fontSize="sm" color="fg.muted">
          {financialText.savedToast}
        </Text>
      ) : (
        <Form noPadding onSubmit={handleSubmit(onSubmit)}>
          <TransferBatchFarmFinancialFieldsBlock
            control={control}
            errors={errors}
            languageGB={languageGB}
            isDisabled={isDisabled}
            setValue={setValue}
            installmentsArray={installmentsArray}
            incomeArray={incomeArray}
            expenseArray={expenseArray}
          />
        </Form>
      )}
    </FormContainer>
  );
}
