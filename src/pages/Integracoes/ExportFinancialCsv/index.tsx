// src/pages/Integracoes/ExportFinancialCsv/index.tsx
// -----------------------------------------------------------------------------
// Tela STANDALONE de exportação financeira "Exportação CSV → C. Pagas/Recebidas"
// (F-120, Integrações, irmã do canário F-119 `ExportNfseDominio`). NÃO é CRUD —
// sem grid/create/edit/detalhe. Form de filtro de 2 datas obrigatórias
// (`Dt. Início`/`Dt. Fim`, nessa ordem) + botão "Exportar Dados" que baixa
// `dados.csv` de `GET /api/v1/integrations/exports/financial-csv`.
//
// Clone quase 1:1 do canário `src/pages/Integracoes/ExportNfseDominio/index.tsx`
// (contrato de tela §5) — trocam só endpoint, filename (`dados.csv`) e
// permissão (`financial_export`).
//
// Sem query-key/cache do TanStack — export é ação imperativa one-shot
// (Decisão D do contrato de tela).
//
// Permissão `financial_export` (`navigationPermissions.ts:1056`): o guard de
// ROTA já barra (ver `src/router/index.tsx`), mas a tela confere
// `usePermissions().can(...)` defensivamente (desabilita o form/export para
// quem, por alguma via, chegar aqui sem a permissão).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { parseBlobError } from '@/utils/parseBlobError';

import { exportFinancialCsvSchema } from '@/validations/schemas/Integracoes/exportFinancialCsv-schema';

import { exportFinancialCsv } from '@/services/v2/Integrations/export-financial-csv-service';

import type { ExportFinancialCsvForm } from '@/@types/v2/Integrations/exportFinancialCsv';

const defaultValues: ExportFinancialCsvForm = {
  start_date: null,
  end_date: null,
};

export default function ExportFinancialCsv() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const t = languageGB.integrations.exportFinancialCsv;

  // Gate defensivo — a rota (RequirePermission) já bloqueia quem chega sem
  // a permissão; aqui só evitamos disparar a exportação/deixar o form
  // editável caso a permissão seja perdida em runtime (troca de fazenda/
  // sessão desatualizada).
  const canExport = can('financial_export');

  const [isExporting, setIsExporting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<ExportFinancialCsvForm>({
    mode: 'onChange',
    resolver: exportFinancialCsvSchema(languageGB),
    defaultValues,
  });

  async function handleExport(data: ExportFinancialCsvForm) {
    setIsExporting(true);
    try {
      const blob = await exportFinancialCsv({
        start_date: data.start_date!,
        end_date: data.end_date!,
      });
      // Nome fixo — fidelidade ao contrato de tela (Decisão F, §2.3).
      downloadBlob(blob, 'dados.csv');
      toaster.success({
        title: t.toasts.successTitle,
        description: t.toasts.successDescription,
      });
    } catch (error) {
      // `responseType: 'blob'` entrega o corpo de erro (422/401/403) como
      // Blob de JSON — parseBlobError extrai o envelope real (contrato de
      // tela §Leitura do dev, risco 2).
      const parsed = await parseBlobError(error);
      if (parsed.status === 422 && parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          setError(field as keyof ExportFinancialCsvForm, { message: messages?.[0] });
        });
      } else {
        toaster.error({
          title: t.toasts.errorTitle,
          description: parsed.message ?? extractApiErrorMessage(error),
        });
      }
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <FormContainer
      title={t.titleModule}
      footer={
        <Button
          title={t.form.exportButton}
          type="submit"
          form="export-financial-csv-form"
          loading={isExporting}
          disabled={!canExport || !isValid || isExporting}
        />
      }
    >
      <Form id="export-financial-csv-form" onSubmit={handleSubmit(handleExport)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Ordem `start_date` → `end_date` é fidelidade obrigatória
              (contrato de tela §2.1, CL-03/10). */}
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <Field
                label={t.form.startDateLabel}
                errorText={errors.start_date?.message}
                isRequired
              >
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canExport || isExporting}
                />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <Field label={t.form.endDateLabel} errorText={errors.end_date?.message} isRequired>
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canExport || isExporting}
                />
              </Field>
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
