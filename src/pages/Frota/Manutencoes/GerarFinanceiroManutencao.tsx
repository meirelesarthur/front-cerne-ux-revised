// src/pages/Frota/Manutencoes/GerarFinanceiroManutencao.tsx
// -----------------------------------------------------------------------------
// "Gerar Financeiro" — Tarefa 45. Fluxo DESCENDENTE (rota própria, NUNCA um
// Dialog — FID-G3F §0/§4): a partir de uma Manutenção com ≥1 item cujo
// executor é Fornecedor, gera 1 Conta a Pagar por fornecedor, com rateio e
// parcelamento, num ÚNICO `POST` (`providers[]` completo).
//
// Carrega a Manutenção via `getMaintenanceByUuid` (Tarefa 43) e monta 1
// bloco por fornecedor ÚNICO presente nos itens (`items.filter(i =>
// i.provider).map(...)`, deduplicado por `uuid` — NUNCA um catálogo geral
// de fornecedores, mirror `hasProviders`/`AM-05`). `total` de cada bloco é
// PRÉ-PREENCHIDO pela soma de `item.total_amount` dos itens daquele
// fornecedor (melhoria opcional aplicada, ver Tarefa 45 "Nota") — permanece
// editável.
//
// Guard de navegação: `maintenanceId` malformado → lista. Guard de negócio:
// Manutenção sem nenhum item com `provider` → volta para a Visualização com
// toast informativo.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { generateMaintenanceFinancial } from '@/services/v2/Maintenances/maintenance-service';

import type {
  GenerateFinancialForm,
  GenerateFinancialPayload,
  MaintenanceDetail,
} from '@/@types/v2/Maintenances';

import { validateProvidersInstallments } from './generate-financial-validation';
import { GenerateFinancialProviderBlock } from './GenerateFinancialProviderBlock';
import { useMaintenanceDetailQuery } from './useManutencoes';

const MANUTENCOES_LIST_ROUTE = '/frota/manutencoes';

export default function GerarFinanceiroManutencao() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.generateFinancial;

  const detailRoute = `${MANUTENCOES_LIST_ROUTE}/${maintenanceId}/detalhe`;

  useEffect(() => {
    if (!isValidGuid(maintenanceId)) {
      navigate(MANUTENCOES_LIST_ROUTE, { replace: true });
    }
  }, [maintenanceId, navigate]);

  const [maintenance, setMaintenance] = useState<MaintenanceDetail | null>(null);
  const [apportionmentError, setApportionmentError] = useState<string | null>(null);
  const [showInstallmentErrors, setShowInstallmentErrors] = useState(false);
  const redirectedForNoProvidersRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<GenerateFinancialForm>({
    mode: 'onChange',
    defaultValues: { providers: [] },
  });

  // LEI 2 — `fillForm` nomeada com guarda `isEmpty(dirtyFields)`, mirror
  // `get_pwa_form_query_pattern`. Monta 1 bloco por fornecedor ÚNICO
  // presente nos itens (nunca um catálogo geral).
  function fillGenerateFinancialForm(data: MaintenanceDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setMaintenance(data);

      // UT-000684 — despesa já gerada (flag da API; ausência = false):
      // aviso + volta à Visualização, sem montar o formulário.
      if (data.has_financial === true) {
        if (!redirectedForNoProvidersRef.current) {
          redirectedForNoProvidersRef.current = true;
          toaster.warning({ title: text.errors.alreadyGenerated });
          navigate(detailRoute, { replace: true });
        }
        return;
      }

      const providerItems = data.items.filter((item) => item.provider != null);
      if (providerItems.length === 0) {
        if (!redirectedForNoProvidersRef.current) {
          redirectedForNoProvidersRef.current = true;
          toaster.warning({ title: text.errors.noProviderItems });
          navigate(detailRoute, { replace: true });
        }
        return;
      }

      const uniqueProviders = new Map<string, { uuid: string; name: string; total: number }>();
      providerItems.forEach((item) => {
        const provider = item.provider!;
        const current = uniqueProviders.get(provider.uuid);
        uniqueProviders.set(provider.uuid, {
          uuid: provider.uuid,
          name: provider.name,
          total: (current?.total ?? 0) + (item.total_amount ?? 0),
        });
      });

      reset({
        providers: Array.from(uniqueProviders.values()).map((provider) => ({
          provider_uuid: provider.uuid,
          provider_label: provider.name,
          number: '',
          type_title_uuid: null,
          proprietary_uuid: null,
          note: null,
          fiscal_document: false,
          // Melhoria opcional aplicada (Tarefa 45 "Nota") — pré-preenchido
          // pela soma de `total_amount` dos itens do fornecedor,
          // permanece editável.
          total: provider.total || null,
          categories: [{ category_uuid: null, center_uuid: null, value: null }],
          installments: [],
        })),
      });
    }
  }

  const detailQuery = useMaintenanceDetailQuery({
    registrationId: isValidGuid(maintenanceId) ? maintenanceId : undefined,
    fillForm: fillGenerateFinancialForm,
  });

  const generateMutation = useRequest({
    asyncFunction: tryGenerateFinancial,
    entityName: text.pageTitlePrefix,
    queryKey: queryKey.maintenances.maintenance,
    queryKey2: queryKey.maintenances.maintenances,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(detailRoute);
    },
  });

  async function tryGenerateFinancial(data: GenerateFinancialForm) {
    const payload: GenerateFinancialPayload = {
      providers: data.providers.map((provider) => ({
        provider_uuid: provider.provider_uuid,
        number: provider.number.trim(),
        type_title_uuid: provider.type_title_uuid!.value,
        proprietary_uuid: provider.proprietary_uuid!.value,
        note: provider.note?.trim() || undefined,
        fiscal_document: !!provider.fiscal_document,
        total: Number(provider.total ?? 0),
        categories: provider.categories.map((category) => ({
          category_uuid: category.category_uuid!.value,
          center_uuid: category.center_uuid!.value,
          value: Number(category.value ?? 0),
        })),
        installments: provider.installments.map((installment) => ({
          due_date: installment.due_date!,
          value: Number(installment.value ?? 0),
        })),
      })),
    };
    // Submit ÚNICO (`POST` com `providers[]` completo) — nunca N requests
    // separados do front (a atomicidade é do backend, DoD explícito).
    return generateMaintenanceFinancial(maintenanceId!, payload);
  }

  // Fechamento EXATO do rateio (tolerância 0) contra `total` de CADA bloco
  // — bloqueio client ANTES do submit (DoD explícito).
  function validateApportionment(): boolean {
    const providers = getValues('providers');
    const failing = providers.some((provider) => {
      const total = Number(provider.total) || 0;
      const sum = (provider.categories ?? []).reduce(
        (acc, row) => acc + (Number(row?.value) || 0),
        0
      );
      return Math.round(sum * 100) !== Math.round(total * 100);
    });
    if (failing) {
      setApportionmentError(text.errors.apportionmentNotClosed);
      toaster.warning({ title: text.errors.apportionmentNotClosed });
      return false;
    }
    setApportionmentError(null);
    return true;
  }

  // UT-000684 — parcelas obrigatórias (mirror da regra da API): ≥1 parcela por
  // fornecedor, cada uma com vencimento e valor > 0. Bloqueio client ANTES do
  // submit; o erro inline é derivado ao vivo e some quando corrigido.
  function formatInstallmentMessage(issue: {
    reason: 'missing' | 'invalid';
    providerLabel: string;
  }) {
    const template =
      issue.reason === 'missing'
        ? text.errors.installmentsRequired
        : text.errors.installmentsInvalid;
    return template.replace('{provider}', issue.providerLabel);
  }

  function validateInstallments(): boolean {
    const issues = validateProvidersInstallments(getValues('providers'));
    if (issues.length > 0) {
      setShowInstallmentErrors(true);
      toaster.warning({ title: formatInstallmentMessage(issues[0]) });
      return false;
    }
    setShowInstallmentErrors(false);
    return true;
  }

  async function onSubmit(data: GenerateFinancialForm) {
    if (!validateApportionment()) return;
    if (!validateInstallments()) return;
    await generateMutation.mutateAsync(data);
  }

  if (!isValidGuid(maintenanceId)) {
    return null;
  }

  const providerFields = watch('providers') ?? [];
  const installmentIssues = showInstallmentErrors
    ? validateProvidersInstallments(providerFields)
    : [];
  const isDisabled = isSubmitting || generateMutation.isPending;

  return (
    <FormContainer
      title={`${text.pageTitlePrefix} ${maintenance?.code ?? ''}`}
      footer={
        <>
          <Button
            title={text.actions.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(detailRoute)}
          />
          <Button
            title={text.actions.generate}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isDisabled}
            disabled={isDisabled || providerFields.length === 0}
          />
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {apportionmentError && (
          <Box mb={4}>
            <Text color="fg.error" fontSize="sm">
              {apportionmentError}
            </Text>
          </Box>
        )}

        <Flex direction="column" gap={4}>
          {providerFields.map((_, index) => (
            <GenerateFinancialProviderBlock
              key={`${index}-${providerFields[index]?.provider_uuid ?? ''}`}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              installmentsError={
                installmentIssues.find((issue) => issue.providerIndex === index)
                  ? formatInstallmentMessage(
                      installmentIssues.find((issue) => issue.providerIndex === index)!
                    )
                  : null
              }
              isDisabled={isDisabled || (detailQuery as any).isLoading}
            />
          ))}
        </Flex>
      </Box>
    </FormContainer>
  );
}
