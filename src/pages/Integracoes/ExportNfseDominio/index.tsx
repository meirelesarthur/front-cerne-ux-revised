// src/pages/Integracoes/ExportNfseDominio/index.tsx
// -----------------------------------------------------------------------------
// Tela STANDALONE de exportação contábil "NFS-e → Domínio" (F-119,
// Integrações, CANÁRIO da esteira `97-Esteiras/071`). NÃO é CRUD — sem
// grid/create/edit/detalhe. Form de filtro de 2 datas obrigatórias
// (`Dt. Início`/`Dt. Fim`, nessa ordem — fidelidade `trad.php:408,410`) +
// botão "Exportar Dados" que baixa `nfse.xlsx` de
// `GET /integrations/exports/nfse-dominio`.
//
// Molde ESTRUTURAL clonado (adaptado, não copiado) de
// `src/pages/Administrativo/BaixaEstoque/BaixaEstoqueReport.tsx` (mesma
// classe: `FormContainer` com `footer` + `<Form id>` + `SimpleGrid` +
// `Field`+`DateInput` + submit externo via atributo `form`).
//
// Sem query-key/cache do TanStack — export é ação imperativa one-shot
// (Decisão D do contrato de tela, mesmo precedente de
// `SaldoEstoqueRelatorio.tsx`, que também não registra query-key).
//
// Permissão `export_nfs_dominio_view` (slug legado reusado, DEC-006): o
// guard de ROTA já barra (ver `src/router/index.tsx`), mas a tela confere
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

import { exportNfseDominioSchema } from '@/validations/schemas/Integracoes/exportNfseDominio-schema';

import { exportNfseDominio } from '@/services/v2/Integrations/export-nfse-dominio-service';

import type { ExportNfseDominioForm } from '@/@types/v2/Integrations/exportNfseDominio';

const defaultValues: ExportNfseDominioForm = {
  start_date: null,
  end_date: null,
};

export default function ExportNfseDominio() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const t = languageGB.integrations.exportNfseDominio;

  // Gate defensivo — a rota (RequirePermission) já bloqueia quem chega sem
  // a permissão; aqui só evitamos disparar a exportação/deixar o form
  // editável caso a permissão seja perdida em runtime (troca de fazenda/
  // sessão desatualizada).
  const canExport = can('export_nfs_dominio_view');

  const [isExporting, setIsExporting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<ExportNfseDominioForm>({
    mode: 'onChange',
    resolver: exportNfseDominioSchema(languageGB),
    defaultValues,
  });

  async function handleExport(data: ExportNfseDominioForm) {
    setIsExporting(true);
    try {
      const blob = await exportNfseDominio({
        start_date: data.start_date!,
        end_date: data.end_date!,
      });
      // Nome fixo — fidelidade ao legado (CL-05).
      downloadBlob(blob, 'nfse.xlsx');
      toaster.success({
        title: t.toasts.successTitle,
        description: t.toasts.successDescription,
      });
    } catch (error) {
      // `responseType: 'blob'` entrega o corpo de erro (422/401/403) como
      // Blob de JSON — parseBlobError extrai o envelope real (§Leitura do
      // dev, risco 1 do contrato de tela).
      const parsed = await parseBlobError(error);
      if (parsed.status === 422 && parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          setError(field as keyof ExportNfseDominioForm, { message: messages?.[0] });
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
          form="export-nfse-dominio-form"
          loading={isExporting}
          disabled={!canExport || !isValid || isExporting}
        />
      }
    >
      <Form id="export-nfse-dominio-form" onSubmit={handleSubmit(handleExport)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Ordem `start_date` → `end_date` é fidelidade obrigatória
              (SRF-02/CL-06, `trad.php:408,410`). */}
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
