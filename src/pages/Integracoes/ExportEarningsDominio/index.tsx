// src/pages/Integracoes/ExportEarningsDominio/index.tsx
// -----------------------------------------------------------------------------
// Tela STANDALONE de exportação contábil "Folha Salarial → Domínio" (F-117,
// Integrações, irmã do canário F-119 ExportNfseDominio). NÃO é CRUD — sem
// grid/create/edit/detalhe. Form de filtro de 2 SELECTS obrigatórios
// (`Ano`/`Mês`, nessa ordem — fidelidade CL-02), ambos pré-selecionados com
// o ano/mês CORRENTE, + botão "Exportar Dados" que baixa
// `exportacao folha salarial dominio.xlsx` (nome fixo, CL-05) de
// `GET /api/v1/integrations/exports/earnings-dominio`.
//
// Molde ESTRUTURAL clonado (adaptado, não copiado) de
// `src/pages/Integracoes/ExportNfseDominio/index.tsx` (canário F-119) +
// `ExportMovementsDominio/index.tsx` (irmã F-116, referência de SELECT via
// fábrica `(languageGB)=>Map`). Delta: os 2 campos são SELECTS (não
// DateInput), com defaults computados de `new Date()` (CL-02) — por isso
// `defaultValues` é montado DENTRO do componente (precisa de `languageGB`
// para o label do mês), diferente do molde de datas que usa constante de
// módulo.
//
// Sem query-key/cache do TanStack — export é ação imperativa one-shot
// (Decisão D do contrato de tela).
//
// Permissão `export_payments_dominio_view` (slug real é `payments`, não
// `earnings` — CL-03/DEC-006; item de menu `int-exp-fol` já wired): o guard
// de ROTA já barra (ver `src/router/index.tsx`), mas a tela confere
// `usePermissions().can(...)` defensivamente (desabilita o form/export para
// quem, por alguma via, chegar aqui sem a permissão).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { parseBlobError } from '@/utils/parseBlobError';

import {
  exportEarningsDominioMonthOptions,
  exportEarningsDominioYearOptions,
} from '@/constants/integracoes/exportEarningsDominio/options';

import { exportEarningsDominioSchema } from '@/validations/schemas/Integracoes/exportEarningsDominio-schema';

import { exportEarningsDominio } from '@/services/v2/Integrations/export-earnings-dominio-service';

import type { ExportEarningsDominioForm } from '@/@types/v2/Integrations/exportEarningsDominio';

// Nome fixo — fidelidade ao legado (CL-05, contrato de tela §2.3/§7-F).
const FILENAME = 'exportacao folha salarial dominio.xlsx';

export default function ExportEarningsDominio() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const t = languageGB.integrations.exportEarningsDominio;

  // Gate defensivo — a rota (RequirePermission) já bloqueia quem chega sem
  // a permissão; aqui só evitamos disparar a exportação/deixar o form
  // editável caso a permissão seja perdida em runtime (troca de fazenda/
  // sessão desatualizada).
  const canExport = can('export_payments_dominio_view');

  const [isExporting, setIsExporting] = useState(false);

  // Defaults = ano/mês CORRENTE, pré-selecionados (CL-02). Computado aqui
  // (não em constante de módulo) porque o label do mês depende de
  // `languageGB`.
  const now = new Date();
  const defaultValues: ExportEarningsDominioForm = {
    year: exportEarningsDominioYearOptions.getOption(now.getFullYear()),
    month: exportEarningsDominioMonthOptions.getOption(now.getMonth() + 1, languageGB),
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<ExportEarningsDominioForm>({
    mode: 'onChange',
    resolver: exportEarningsDominioSchema(languageGB),
    defaultValues,
  });

  async function handleExport(data: ExportEarningsDominioForm) {
    setIsExporting(true);
    try {
      const blob = await exportEarningsDominio({
        year: data.year!.value,
        month: data.month!.value,
      });
      downloadBlob(blob, FILENAME);
      toaster.success({
        title: t.toasts.successTitle,
        description: t.toasts.successDescription,
      });
    } catch (error) {
      // `responseType: 'blob'` entrega o corpo de erro (422/401/403) como
      // Blob de JSON — parseBlobError extrai o envelope real (§Leitura do
      // dev, risco 3 do contrato de tela).
      const parsed = await parseBlobError(error);
      if (parsed.status === 422 && parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          setError(field as keyof ExportEarningsDominioForm, { message: messages?.[0] });
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
          form="export-earnings-dominio-form"
          loading={isExporting}
          disabled={!canExport || !isValid || isExporting}
        />
      }
    >
      <Form id="export-earnings-dominio-form" onSubmit={handleSubmit(handleExport)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Ordem `year` → `month` é fidelidade obrigatória (CL-02). */}
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <Select
                label={t.form.yearLabel}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={exportEarningsDominioYearOptions.options()}
                error={errors.year?.message}
                isRequired
                isDisabled={!canExport || isExporting}
              />
            )}
          />

          <Controller
            name="month"
            control={control}
            render={({ field }) => (
              <Select
                label={t.form.monthLabel}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={exportEarningsDominioMonthOptions.options(languageGB)}
                error={errors.month?.message}
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
