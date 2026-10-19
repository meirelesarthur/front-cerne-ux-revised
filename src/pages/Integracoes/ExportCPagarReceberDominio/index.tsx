// src/pages/Integracoes/ExportCPagarReceberDominio/index.tsx
// -----------------------------------------------------------------------------
// Tela STANDALONE de exportação contábil "Exportar Dados Domínio — Contas a
// Pagar/Receber" (F-118, Integrações, `97-Esteiras/071`, TASK-CPR-FE-04).
// NÃO é CRUD — sem grid/create/edit. É a tela MAIS RICA do lote: form de
// filtro de 11 campos (fazenda, 2 pares de data, proprietário, status,
// centro de custo, tipo OBRIGATÓRIO, categorias multiselect) + botão
// "Exportar Dados" que baixa um `.xlsx` de
// `GET /integrations/exports/expenses-incomes-dominio`. O campo `type`
// (1=Pagar/2=Receber) decide a entidade NO SERVIDOR — a tela é a MESMA
// para os dois.
//
// Molde ESTRUTURAL clonado (adaptado, não copiado) de
// `src/pages/Integracoes/ExportNfseDominio/index.tsx` (canário F-119, mesma
// classe: `FormContainer` com `footer` + `<Form id>` + `SimpleGrid` +
// submit externo via atributo `form`). Precedente de selects async em
// form de filtro (multiselect + extração `.value` no submit + reset por
// fazenda): `src/pages/Financeiro/CashFlow/index.tsx` e
// `src/pages/Financeiro/ContasAPagar/FilterSideExpense.tsx` (mesmos
// services de options já em produção — nenhum service novo duplicado).
//
// Sem query-key/cache do TanStack — export é ação imperativa one-shot
// (Decisão D do contrato de tela).
//
// Permissão `export_expenses_incomes_dominio_view` (slug já semeado no
// backend, DEC-006): o guard de ROTA já barra (TASK-CPR-FE-05), mas a tela
// confere `usePermissions().can(...)` defensivamente.
//
// RISCO 1 (Option {value,label} vs valor cru) — os Controllers guardam o
// Option (`field.value`); a extração `.value`/`.map(o=>o.value)` acontece
// no SERVICE (`export-expenses-incomes-dominio-service.ts`), nunca aqui.
// RISCO 3 (`is_enabled` string) — os selects de centro/categoria passam
// `is_enabled:'true'` STRING (fiel ao contrato desses 2 endpoints); o
// select de proprietário usa `is_enabled: true` BOOLEANO (o service dele é
// tipado como `boolean`, não string — endpoints distintos, contratos
// distintos, ver `proprietary-service.ts`/`cost-center-service.ts`).
// RISCO 4 (reset na troca de fazenda) — `useEffect` em `activeFarmUuid` +
// `cacheUniqs` nos 4 async selects.
//
// Decisão G do contrato (fonte do select "Fazenda", investigação
// não-bloqueante): reusa `listFarms` de
// `src/services/v2/Farms/farm-admin-service.ts` — MESMO service já usado
// como `SelectAsyncPaginate` de fazenda em filtros de outras telas
// (`FilterSideRecebimentos.tsx`, `CreateFarmTransfer.tsx`), `ResponsePagination`-
// compatível, listando as fazendas do tenant ativo (sem cross-tenant).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { parseBlobError } from '@/utils/parseBlobError';

import {
  expenseIncomeStatusOptions,
  expenseIncomeTypeOptions,
} from '@/constants/integracoes/exportExpensesIncomesDominio/options';

import { exportExpensesIncomesDominioSchema } from '@/validations/schemas/Integracoes/exportExpensesIncomesDominio-schema';

import {
  listProprietaries,
  type ListProprietariesParams,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  listCostCenterOptions,
  type ListCostCentersParams,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFarms, type ListFarmsParams } from '@/services/v2/Farms/farm-admin-service';
import {
  listFinancialCategoryOptions,
  type ListFinancialCategoryOptionsParams,
} from '@/services/v2/FinancialCategories/financial-category-service';
import { exportExpensesIncomesDominio } from '@/services/v2/Integrations/export-expenses-incomes-dominio-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FarmDetail } from '@/@types/v2/Farms/farm-admin';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { ExportExpensesIncomesDominioForm } from '@/@types/v2/Integrations/exportExpensesIncomesDominio';

const defaultValues: ExportExpensesIncomesDominioForm = {
  farm: null,
  start_date: null,
  end_date: null,
  start_due_date: null,
  end_due_date: null,
  proprietary_id: null,
  status: null,
  center_id: null,
  type: null,
  categories: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado nos 4 selects async de `FilterSideExpense.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function ExportCPagarReceberDominio() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const t = languageGB.integrations.exportExpensesIncomesDominio;

  // Gate defensivo — a rota (RequirePermission) já bloqueia quem chega sem
  // a permissão; aqui só evitamos disparar a exportação/deixar o form
  // editável caso a permissão seja perdida em runtime.
  const canExport = can('export_expenses_incomes_dominio_view');

  const [isExporting, setIsExporting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isValid },
  } = useForm<ExportExpensesIncomesDominioForm>({
    mode: 'onChange',
    resolver: exportExpensesIncomesDominioSchema(languageGB),
    defaultValues,
  });

  // RISCO 4 (contrato §Riscos/§5) — os 4 selects async são tenant-scoped
  // (`X-Farm-Id`); trocar de fazenda no header global deixa seleções da
  // fazenda ANTERIOR no form → 422. Reseta o form inteiro; `cacheUniqs`
  // abaixo invalida o cache de opções carregadas.
  useEffect(() => {
    reset(defaultValues);
  }, [activeFarmUuid, reset]);

  async function handleExport(data: ExportExpensesIncomesDominioForm) {
    setIsExporting(true);
    try {
      const blob = await exportExpensesIncomesDominio(data);
      // Nome fixo de fallback — o backend prioriza `Content-Disposition`
      // (contrato §2.3); `downloadBlob` não lê o header, mas o nome aqui
      // nunca quebra o download em si.
      downloadBlob(blob, 'exportacao-dominio-contas-a-pagar-receber.xlsx');
      toaster.success({
        title: t.toasts.successTitle,
        description: t.toasts.successDescription,
      });
    } catch (error) {
      // `responseType: 'blob'` entrega o corpo de erro (422/401/403) como
      // Blob de JSON — parseBlobError extrai o envelope real.
      const parsed = await parseBlobError(error);
      if (parsed.status === 422 && parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          setError(field as keyof ExportExpensesIncomesDominioForm, {
            message: messages?.[0],
          });
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

  const isDisabled = !canExport || isExporting;

  return (
    <FormContainer
      title={t.titleModule}
      footer={
        <Button
          title={t.form.exportButton}
          type="submit"
          form="export-cpagar-receber-dominio-form"
          loading={isExporting}
          disabled={!canExport || !isValid || isExporting}
        />
      }
    >
      <Form id="export-cpagar-receber-dominio-form" onSubmit={handleSubmit(handleExport)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {/* Ord. 1 — "Fazenda" (async single, opcional, narrows dentro do
              tenant ativo). Decisão G do contrato: `listFarms`
              (`farm-admin-service.ts`), mesmo service já usado como
              SelectAsyncPaginate de fazenda em outros filtros do projeto. */}
          <Controller
            name="farm"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={t.form.farmLabel}
                error={errors.farm?.message}
                isDisabled={isDisabled}
                cacheUniqs={[activeFarmUuid]}
                service={(params: PaginationQueryParams & ListFarmsParams) => listFarms(params)}
                mapOptions={(item: FarmDetail) => ({ label: item.description, value: item.uuid })}
                findParams={(search) => ({ search: searchOf(search) })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* Ord. 2/3 — "Dt. Emissão Início/Fim" (par 1, opcional). */}
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <Field label={t.form.startDateLabel} errorText={errors.start_date?.message}>
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <Field label={t.form.endDateLabel} errorText={errors.end_date?.message}>
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />

          {/* Ord. 4/5 — "Dt. Venc. Início/Fim" (par 2, opcional). */}
          <Controller
            name="start_due_date"
            control={control}
            render={({ field }) => (
              <Field label={t.form.startDueDateLabel} errorText={errors.start_due_date?.message}>
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />
          <Controller
            name="end_due_date"
            control={control}
            render={({ field }) => (
              <Field label={t.form.endDueDateLabel} errorText={errors.end_due_date?.message}>
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />

          {/* Ord. 6 — "Proprietário Gestor" (async single, opcional).
              `listProprietaries` (paginado, ResponsePagination-compatible) —
              MESMO service já usado como SelectAsyncPaginate em
              `FilterSideExpense.tsx`. `is_enabled` deste endpoint é
              BOOLEANO (contrato do service), não string. */}
          <Controller
            name="proprietary_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={t.form.proprietaryLabel}
                error={errors.proprietary_id?.message}
                isDisabled={isDisabled}
                cacheUniqs={[activeFarmUuid]}
                service={(params: PaginationQueryParams & ListProprietariesParams) =>
                  listProprietaries({ ...params, is_enabled: true })
                }
                mapOptions={(item: ProprietaryListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search) => ({ search: searchOf(search) })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* Ord. 7 — "Status" (estático, 8 opções via fábrica, opcional). */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={t.form.statusLabel}
                error={errors.status?.message}
                isDisabled={isDisabled}
                options={expenseIncomeStatusOptions.options(languageGB)}
                value={field.value ?? null}
                onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* Ord. 8 — "Centro de Custo" (async single, opcional).
              RISCO 3 — `is_enabled:'true'` STRING (contrato deste
              endpoint); `only_analytic` mirror de `class=2 Analítico`
              fiel ao legado (LK-03). */}
          <Controller
            name="center_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={t.form.centerLabel}
                error={errors.center_id?.message}
                isDisabled={isDisabled}
                cacheUniqs={[activeFarmUuid]}
                service={(params: PaginationQueryParams & ListCostCentersParams) =>
                  listCostCenterOptions(params)
                }
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} - ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search) => ({
                  search: searchOf(search),
                  is_enabled: 'true' as const,
                  only_analytic: true,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* Ord. 9 — "Tipo Dados" (estático, 2 opções via fábrica, ÚNICO
              obrigatório — decide Pagar/Receber no servidor). */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={t.form.typeLabel}
                isRequired
                error={errors.type?.message}
                isDisabled={isDisabled}
                options={expenseIncomeTypeOptions.options(languageGB)}
                value={field.value ?? null}
                onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* Ord. 10 — "Categorias" (async MULTISELECT, opcional). RISCO 3 —
              `is_enabled:'true'` STRING; `class:2` mirror `Analítico`
              fiel ao legado (LK-04). Único campo `isMulti` da tela. */}
          <Controller
            name="categories"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={t.form.categoriesLabel}
                error={errors.categories?.message}
                isDisabled={isDisabled}
                isMulti
                cacheUniqs={[activeFarmUuid]}
                service={(params: PaginationQueryParams & ListFinancialCategoryOptionsParams) =>
                  listFinancialCategoryOptions(params)
                }
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: `${item.code} - ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search) => ({
                  search: searchOf(search),
                  is_enabled: 'true' as const,
                  class: 2,
                })}
                value={field.value ?? []}
                onChange={(options: any) => field.onChange(options ?? [])}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
