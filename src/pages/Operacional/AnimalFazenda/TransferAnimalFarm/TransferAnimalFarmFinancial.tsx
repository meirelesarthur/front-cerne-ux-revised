// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/TransferAnimalFarmFinancial.tsx
// -----------------------------------------------------------------------------
// Tela FINANCEIRA dedicada da Transferência de Animal entre Fazendas
// (97-Esteiras/042, TASK-FE-042-105). Rota
// `/operacional/animal-fazenda/transferencias/:uuid/financeiro`, alcançável
// só via ação de linha "Gerar Financeiro" da listagem (TASK-103, fazenda de
// ORIGEM, `!has_financial`), guardada por
// `<RequirePermission permission="transfer_animal_farms_create">`.
// `GET/POST /transfer-animal-farms/{uuid}/financial`.
//
// Casca `FormContainer` (Voltar + `ButtonSaveAndNext`). Reusa
// `TransferAnimalFarmFinancialFieldsBlock` (de TASK-104 — cabeçalho
// financeiro + parcelas + rateio dobrado entrada/saída), `namePrefix=''`
// (IMPORTADO, nunca duplicado). Sem guarda de status/reentrância no front
// (mirror DIV-006/007 — o servidor não guarda, a tela não deve fingir que
// guarda).
//
// 2 botões de relatório de categorias financeiras (receber/pagar),
// independentes do estado do form — reuso LITERAL de
// `downloadFinancialCategoryTypeReport` (endpoint genérico do domínio
// `FinancialCategory`, mesmo arquivo de service da irmã Lote/Fazenda, §5 do
// contrato-frontend, não duplicar).
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

import { transferAnimalFarmFinancialSchemaResolver } from '@/validations/schemas/Operacional/AnimalFazenda/transferAnimalFarmFinancial-schema';

import { downloadFinancialCategoryTypeReport } from '@/services/v2/LoteFazenda/financialCategoryTypeReport-service';
import {
  getTransferAnimalFarmFinancial,
  saveTransferAnimalFarmFinancial,
} from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

import type { TransferAnimalFarmFinancialForm } from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

import {
  mapTransferAnimalFarmFinancialPayload,
  TransferAnimalFarmFinancialFieldsBlock,
} from './TransferAnimalFarmFinancialFieldsBlock';

export default function TransferAnimalFarmFinancial() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.animalFazenda.transferAnimalFarm;
  const financialText = text.form.fields.financial;

  const canSave = can('transfer_animal_farms_create');

  const detailQuery = useQuery({
    queryKey: [queryKey.animalFazenda.financial, uuid],
    queryFn: () => getTransferAnimalFarmFinancial(uuid as string),
    enabled: !!uuid,
  });
  const item = detailQuery.data?.data;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<TransferAnimalFarmFinancialForm>({
    mode: 'onChange',
    resolver: transferAnimalFarmFinancialSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      vl_total: 0,
      // DIV-07 (063-est03-9-reprovacoes) — default "Dedutível" = Sim.
      fiscal_document: booleanOptions.getOption(true, languageGB),
      proprietary_uuid: null,
      qtd_installments: null,
      first_installment_date: null,
      // DIV-09 (063-est03-9-reprovacoes) — default "intervalo de parcelas" = 30.
      int_installments: 30,
      installments: [],
      income_categories: [],
      expense_categories: [],
      // DIV-08 (063-est03-9-reprovacoes) — bloco "Possui entrada?".
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
    queryKey: queryKey.animalFazenda.transferAnimalFarms,
    queryKey2: queryKey.animalFazenda.financial,
    typesRequest: 'create',
    personalizedMessage: financialText.savedToast,
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function trySaveFinancial(data: TransferAnimalFarmFinancialForm) {
    return await saveTransferAnimalFarmFinancial(
      uuid as string,
      mapTransferAnimalFarmFinancialPayload(data)
    );
  }

  async function onSubmit(data: TransferAnimalFarmFinancialForm) {
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
          <TransferAnimalFarmFinancialFieldsBlock
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
