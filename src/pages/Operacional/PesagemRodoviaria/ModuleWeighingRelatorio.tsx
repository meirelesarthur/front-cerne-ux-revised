// src/pages/Operacional/PesagemRodoviaria/ModuleWeighingRelatorio.tsx
// -----------------------------------------------------------------------------
// FE-SCR-06 (Relatório) — Pesagem Rodoviária (ModuleWeighing, TASK-MWG-FE-09,
// retrabalho de padrão TASK-MWG-FE-10, export Excel TASK-MWG-FE-11) — 2
// rotas, MESMO componente: `/operacional/pesagem-rodoviaria/relatorio`
// (entrada original) e `/relatorios/agricultura/pesagem-rodoviaria` (entrada
// adicionada em ajuste pós-entrega). Filtros (`FM-006..FM-012`) + geração
// síncrona de PDF/Excel (`GAP-PES-04`).
//
// Casca mirror ESTRUTURAL das telas irmãs já homologadas do lote 075
// (`Relatorios/Agricultura/PrevisaoAreaReceita/index.tsx`,
// `Relatorios/Pecuaria/CusteioAnimal/index.tsx`): `FormContainer` COM
// `footer=` (branch `hasFooter`, dá o padding às bordas) + `<Form
// onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.default}`
// (7 campos) — SEM `VStack align="stretch"` cru (esticava o botão em
// full-width, achado do dono). 2 handlers manuais independentes
// (`handleExportPdf`/`handleExportXlsx`), 2 `useState` de loading,
// `try/catch/finally` + `parseBlobError` — mirror EXATO de `CusteioAnimal`,
// substituindo o antigo `ModuleWeighingReportButton` (`useMutation`).
//
// `report_type` ('pdf'|'excel') é o parâmetro de FORMATO enviado ao
// endpoint — reconciliado com o api-architect para NÃO colidir com `type`,
// que é o filtro de DOMÍNIO "Venda/Saída" já existente
// (`ModuleWeighingReportFilterRequest.type`, DV-006 preservado: enviado como
// número real, incluindo `0`, nunca `|| undefined`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import {
  getModuleWeighingReportPdf,
  getModuleWeighingReportXlsx,
} from '@/services/v2/ModuleWeighing/module-weighing-service';

import type { ModuleWeighingReportFilterRequest } from '@/@types/v2/ModuleWeighing/module-weighing';

import {
  ModuleWeighingReportFilters,
  useModuleWeighingReportFilterForm,
} from './relatorio/ModuleWeighingReportFilters';

import type { ModuleWeighingReportFilterValues } from './relatorio/ModuleWeighingReportFilters';

export default function ModuleWeighingRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing.report;

  const form = useModuleWeighingReportFilterForm();
  const { handleSubmit } = form;

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  function buildFilter(data: ModuleWeighingReportFilterValues): ModuleWeighingReportFilterRequest {
    return {
      start_date: data.startDate ?? undefined,
      end_date: data.endDate ?? undefined,
      // `type` enviado como número real (incluindo `0`) — nunca `|| undefined`
      // (DV-006: isso zeraria o filtro "Venda/Saída").
      type: data.type?.value as ModuleWeighingReportFilterRequest['type'],
      category:
        (data.category?.value as ModuleWeighingReportFilterRequest['category']) ?? undefined,
      warehouse_uuid: data.warehouse?.value ?? undefined,
      product_uuid: data.product?.value ?? undefined,
      client_uuid: data.client?.value ?? undefined,
    };
  }

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO de `CusteioAnimal/index.tsx`).
  async function reportErrorDescription(error: unknown): Promise<string> {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    return fieldMessage ?? parsed.message ?? text.toasts.generateError;
  }

  async function handleExportPdf(data: ModuleWeighingReportFilterValues) {
    setIsExportingPdf(true);
    try {
      const blob = await getModuleWeighingReportPdf(buildFilter(data));
      downloadBlob(blob, 'pesagem-rodoviaria-relatorio.pdf');
      toaster.success({
        title: languageGB.moduleWeighing.moduleWeighing.singularLabel,
        description: text.toasts.success,
      });
    } catch (error) {
      toaster.error({
        title: languageGB.moduleWeighing.moduleWeighing.singularLabel,
        description: await reportErrorDescription(error),
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: ModuleWeighingReportFilterValues) {
    setIsExportingXlsx(true);
    try {
      const blob = await getModuleWeighingReportXlsx(buildFilter(data));
      downloadBlob(blob, 'pesagem-rodoviaria-relatorio.xlsx');
      toaster.success({
        title: languageGB.moduleWeighing.moduleWeighing.singularLabel,
        description: text.toasts.success,
      });
    } catch (error) {
      toaster.error({
        title: languageGB.moduleWeighing.moduleWeighing.singularLabel,
        description: await reportErrorDescription(error),
      });
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.exportPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <ModuleWeighingReportFilters form={form} />
        </SimpleGrid>
        {/* Rótulo da coluna de peso do relatório (GAP-PES-04) é resolvido
            inteiramente pelo template PDF do backend — a única fonte de
            verdade do texto no front, para eventual uso futuro em tela, é
            `languageGB.moduleWeighing.moduleWeighing.report.columns.grossOrNetLabel`. */}
      </Form>
    </FormContainer>
  );
}
