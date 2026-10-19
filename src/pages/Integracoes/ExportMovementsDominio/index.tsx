// src/pages/Integracoes/ExportMovementsDominio/index.tsx
// -----------------------------------------------------------------------------
// Tela STANDALONE de exportação contábil "Movimento Bancário → Domínio"
// (F-116, Integrações, irmã do canário F-119 ExportNfseDominio). NÃO é
// CRUD — sem grid/create/edit/detalhe. Form de filtro de 3 campos
// (`Dt. Início`/`Dt. Fim`/`Tipo Dados`, nessa ordem — fidelidade CLM-03/04)
// + botão "Exportar Dados" que baixa um xlsx de
// `GET /api/v1/integrations/exports/movements-dominio`.
//
// Molde ESTRUTURAL clonado (adaptado) de
// `src/pages/Integracoes/ExportNfseDominio/index.tsx` (canário F-119).
// Delta: +1 campo `type` (SELECT `Option<number>` via fábrica
// `exportMovementsDominioTypeOptions`, 1=Entrada/2=Saída) + nome de arquivo
// que varia por `type` (RN-04, contrato de tela §2.3).
//
// Sem query-key/cache do TanStack — export é ação imperativa one-shot
// (Decisão D do contrato de tela).
//
// Permissão `export_movements_dominios_view` (item de menu `int-exp-bco`
// já wired): o guard de ROTA já barra (ver `src/router/index.tsx`), mas a
// tela confere `usePermissions().can(...)` defensivamente.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { parseBlobError } from '@/utils/parseBlobError';

import { exportMovementsDominioTypeOptions } from '@/constants/integracoes/exportMovementsDominio/options';

import { exportMovementsDominioSchema } from '@/validations/schemas/Integracoes/exportMovementsDominio-schema';

import { exportMovementsDominio } from '@/services/v2/Integrations/export-movements-dominio-service';

import type { ExportMovementsDominioForm } from '@/@types/v2/Integrations/exportMovementsDominio';

const defaultValues: ExportMovementsDominioForm = {
  start_date: null,
  end_date: null,
  type: null,
};

// Grafia legada exata (RN-04, contrato de tela §2.3/§7-F).
function filenameFor(typeValue: number): string {
  return typeValue === 1
    ? 'dados exportacao dominio - entradas.xlsx'
    : 'dados exportacao dominio - saidas.xlsx';
}

export default function ExportMovementsDominio() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const t = languageGB.integrations.exportMovementsDominio;

  // Gate defensivo — a rota (RequirePermission) já bloqueia quem chega sem
  // a permissão; aqui só evitamos disparar a exportação/deixar o form
  // editável caso a permissão seja perdida em runtime (troca de fazenda/
  // sessão desatualizada).
  const canExport = can('export_movements_dominios_view');

  const [isExporting, setIsExporting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<ExportMovementsDominioForm>({
    mode: 'onChange',
    resolver: exportMovementsDominioSchema(languageGB),
    defaultValues,
  });

  async function handleExport(data: ExportMovementsDominioForm) {
    setIsExporting(true);
    try {
      const typeValue = data.type!.value;
      const blob = await exportMovementsDominio({
        start_date: data.start_date!,
        end_date: data.end_date!,
        type: typeValue,
      });
      downloadBlob(blob, filenameFor(typeValue));
      toaster.success({
        title: t.toasts.successTitle,
        description: t.toasts.successDescription,
      });
    } catch (error) {
      // `responseType: 'blob'` entrega o corpo de erro (422/401/403) como
      // Blob de JSON — parseBlobError extrai o envelope real (§Leitura do
      // dev, risco 2 do contrato de tela).
      const parsed = await parseBlobError(error);
      if (parsed.status === 422 && parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          setError(field as keyof ExportMovementsDominioForm, { message: messages?.[0] });
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
          form="export-movements-dominio-form"
          loading={isExporting}
          disabled={!canExport || !isValid || isExporting}
        />
      }
    >
      <Form id="export-movements-dominio-form" onSubmit={handleSubmit(handleExport)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Ordem `start_date` → `end_date` → `type` é fidelidade
              obrigatória (CLM-03/04). */}
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

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label={t.form.typeLabel}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={exportMovementsDominioTypeOptions.options(languageGB)}
                error={errors.type?.message}
                isRequired
                isDisabled={!canExport || isExporting}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
