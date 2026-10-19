// src/pages/Relatorios/Bens/Inventario/index.tsx
// -----------------------------------------------------------------------------
// Tela "Inventário Patrimonial — Relatório" (F-260, TASK-INV-FE-02, esteira
// 075). Rota `/relatorios/bens/inventario`, materializa o item de menu FILHO
// `rel-ben-inventario`, sob o grupo/submenu `rel-ben` ("Bens / Ativo",
// `navigationTree.ts` — convertido de item-folha para item-pai+filho nesta
// Tarefa).
//
// Mirror ESTRUTURAL DIRETO de `Relatorios/Financeiro/Dre/index.tsx` e
// `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` (casca `FormContainer` +
// footer, `<Form onSubmit={preventDefault}>`, `SimpleGrid
// columns={columnsForm.default}`, download via Blob + `downloadBlob`, erro
// 422-como-Blob tratado via `parseBlobError` — prioriza mensagem de campo
// sobre mensagem genérica).
//
// DIVERGE de `MovimentacaoEstoque` (2 botões/2 endpoints): aqui é 1 ÚNICO
// endpoint (`GET /equipments-inventory-report`) que decide PDF vs. Excel
// pelo MESMO parâmetro `type` que já é um campo de filtro visível — por isso
// **1 único botão** ("Baixar Relatório"), com a extensão do arquivo
// (`.pdf`/`.xlsx`) decidida no PRÓPRIO front a partir do `type` que acabou de
// enviar (contrato de tela `## 3`).
//
// 4 campos de filtro, na ORDEM do contrato de tela: `family` (opcional,
// catálogo global — NÃO reseta por fazenda), `proprietary` (opcional,
// farm-scoped — reseta em `useEffect([activeFarmUuid])`, mirror
// `JurosPagos::proprietary_uuid`/`MovimentacaoEstoque::warehouse`), `status`
// (ÚNICO campo OBRIGATÓRIO — botão desabilitado por `!statusValue`, mesmo
// mecanismo de `warehouseValue` em `MovimentacaoEstoque`), `type` (PDF/Excel,
// default `0`=PDF pré-selecionado).
//
// SEM `start_date`/`end_date` (banidos por `DA-INV-02`), SEM campo "Fazenda"
// (a fazenda ativa vai pelo header `X-Farm-Id` automático do client — NUNCA
// reintroduzir um seletor de fazenda aqui).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { inventarioStatusOptions } from '@/constants/Inventario/inventario-status';

import { equipmentInventoryReportFilterSchemaResolver } from '@/validations/schemas/Inventario/equipment-inventory-report-filter-schema';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import {
  listProprietaryOptions,
  type ProprietaryOption,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  downloadEquipmentInventoryReport,
  type EquipmentInventoryReportParams,
} from '@/services/v2/Relatorios/equipment-inventory-report-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';

interface InventarioReportFilterForm {
  family: Option<string> | null;
  proprietary: Option<string> | null;
  status: 1 | 2 | null;
  type: 0 | 1;
}

const pristineValues: InventarioReportFilterForm = {
  family: null,
  proprietary: null,
  status: null,
  type: 0, // PDF pré-selecionado (mirror índice 0 implícito do legado)
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `JurosPagos/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

// Adapta `listProprietaryOptions` (array direto, sem paginação real — fachada
// mínima já existente) ao contrato `service` de `SelectAsyncPaginate`
// (`ResponsePagination<T>`) — mirror EXATO
// `JurosPagos::listProprietaryOptionsFarmScoped`. `scope: 'farm'` OBRIGATÓRIO
// — filtra pela fazenda ATIVA, não pelo tenant inteiro.
async function listProprietaryOptionsFarmScoped(
  params: ListProprietaryOptionsParams
): Promise<ResponsePagination<ProprietaryOption[]>> {
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export default function InventarioRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.equipmentInventoryReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<InventarioReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: equipmentInventoryReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const statusValue = watch('status');

  // Reset por fazenda ativa — `proprietary` é farm-scoped (`scope=farm`);
  // `family` é catálogo global e NÃO reseta (mirror
  // `MovimentacaoEstoque::products`/`JurosPagos::provider_uuids`).
  useEffect(() => {
    setValue('proprietary', null);
  }, [activeFarmUuid, setValue]);

  const typeOptions: Option<0 | 1>[] = [
    { value: 0, label: text.typeOptions.pdf },
    { value: 1, label: text.typeOptions.excel },
  ];

  function buildParams(data: InventarioReportFilterForm): EquipmentInventoryReportParams {
    return {
      family: data.family?.value || undefined,
      proprietary: data.proprietary?.value || undefined,
      status: data.status!,
      type: data.type || undefined,
    };
  }

  async function handleDownload(data: InventarioReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadEquipmentInventoryReport(buildParams(data));
      // Nome/extensão decididos no PRÓPRIO front pelo `type` que acabou de
      // enviar — o backend decide o BINÁRIO pelo mesmo parâmetro, não é
      // necessário inspecionar `Content-Type` da resposta.
      downloadBlob(
        blob,
        data.type === 1 ? 'inventario-patrimonial.xlsx' : 'inventario-patrimonial.pdf'
      );
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO
      // `Dre`/`MovimentacaoEstoque`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
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
            disabled={!statusValue || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="family"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.family}
                  // ERRO-04 (F-260) — endpoint `/family-equipments/options`
                  // filtra `is_enabled` opt-in (sem o parâmetro devolve
                  // também famílias desabilitadas, que o legado escondia);
                  // mesmo filtro do irmão `DepreciacaoAcumulada` (ERRO-04a).
                  service={(params) =>
                    listFamilyEquipmentOptions({ ...params, is_enabled: 'true' })
                  }
                  mapOptions={(item: FamilyEquipmentOption) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="proprietary"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.proprietary}
                  cacheUniqs={[activeFarmUuid]}
                  service={listProprietaryOptionsFarmScoped}
                  mapOptions={(item: ProprietaryOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.status}
                  name={name}
                  isRequired
                  value={
                    inventarioStatusOptions
                      .options(languageGB)
                      .find((option) => option.value === value) ?? null
                  }
                  onChange={(option: Option<1 | 2> | null) => onChange(option?.value ?? null)}
                  options={inventarioStatusOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.type}
                  name={name}
                  noClearable
                  value={typeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<0 | 1> | null) => onChange(option?.value ?? 0)}
                  options={typeOptions}
                />
              )}
            />
          </SimpleGrid>

          {!statusValue && (
            <Text fontSize="sm" color="fg.muted">
              {text.statusRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
