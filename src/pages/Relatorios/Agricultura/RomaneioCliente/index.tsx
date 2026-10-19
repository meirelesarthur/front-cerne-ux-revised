// src/pages/Relatorios/Agricultura/RomaneioCliente/index.tsx
// -----------------------------------------------------------------------------
// Tela "Romaneio Cliente" (F-332, TASK-058-F332-FE-02, esteira
// 97-Esteiras/058). Rota `/relatorios/agricultura/romaneio-cliente`,
// materializa o item de menu FILHO `rel-agr-romaneio-cliente`, sob o
// grupo/submenu `rel-agr` ("Agricultura", `navigationTree.ts`) — confirmado
// pelo contrato legado §1 ("módulo Relatórios, submenu Agricultura"), NÃO
// Vendas apesar do nome sugerir cliente/venda (FRONT-F332-plano.md, Leitura
// do dev).
//
// Mirror estrutural de `Relatorios/Financeiro/Adiantamento/index.tsx` — a
// MESMA casca (`FormContainer` + `Form` cru + footer com 1 botão Download),
// reduzida a 3 campos (a menor superfície das 6 telas desta esteira):
//   - `clients`   — SINGLE-select opcional (`SelectAsyncPaginate` +
//                   `listClientOptions`, mesmo lookup de `Adiantamento`);
//                   vazio = "Todos" (nenhum filtro de cliente enviado).
//   - `start_date`/`end_date` — `DateInput`, AMBOS obrigatórios,
//                   `end_date >= start_date` (schema).
//
// PDF-ONLY DE PROPÓSITO (contrato legado §1/§9 CL-11/FID-13 do plano de
// API) — SEM Select de formato, SEM grid/prévia on-screen (o legado nunca
// teve tabela nesta tela, só o PDF). `format:'pdf'` é fixo no service, nunca
// exposto no form.
//
// Download via Blob + `downloadBlob`; erro 422-como-Blob tratado via
// `parseBlobError`, prioriza a mensagem específica de `errors` por campo
// sobre o `message` genérico (mirror `Adiantamento`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { transferClienteReportFilterSchemaResolver } from '@/validations/schemas/TransferClienteReport/transfer-cliente-report-filter-schema';

import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { downloadTransferClienteReport } from '@/services/v2/TransferClienteReport/transfer-cliente-report-service';

import type { TransferClienteReportFilterForm } from '@/@types/v2/TransferClienteReport';

function buildPristineValues(): TransferClienteReportFilterForm {
  return {
    clients: null,
    start_date: null,
    end_date: null,
  };
}

export default function RomaneioClienteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.transferClienteReport.report;

  const { control, handleSubmit } = useForm<TransferClienteReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: transferClienteReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(data: TransferClienteReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadTransferClienteReport({
        clients: data.clients?.value || undefined,
        start_date: data.start_date!,
        end_date: data.end_date!,
      });
      downloadBlob(blob, 'romaneio-cliente.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `AdiantamentoRelatorio`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.downloadError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="clients"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
                  service={listClientOptions}
                  mapOptions={(item: ClientOptionItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
