// src/pages/Financeiro/OfxImport/Reconciliation/BulkInvestmentBanner.tsx
// -----------------------------------------------------------------------------
// Banner + modal "Aplicações e Resgates em Lote" (SURF-063) da Conciliação
// Bancária da Importação OFX (F-114, 97-Esteiras/064, TASK-064-OFX-FE-02).
// Mirror do legado `#btn-bulk-investments` (SR-BTN-02/ACT-10) — dispara N
// `POST /api/v1/movements` sequenciais (reuso INTEGRAL, `type_category`
// fixo `'T'`, transferência entre a conta bancária do OFX e a conta de
// investimento vinculada, `Account.investment_account`), um por transação
// `INVESTMENT` ainda sem `Movement` casado (`pending_investments`).
//
// ADAPTAÇÃO ADITIVA (declarada, não é bug nem invenção): o contrato legado
// (LAC-02) não documenta os campos exatos do modal de lote — só o efeito
// observável ("N POSTs sequenciais, `type_category='T'`"). A API MIGRADA
// (`MovementRequest::rules()`, leitura direta) exige `allocations[]`
// (`min:1`, `category_uuid`+`center_uuid` obrigatórios) e `proprietary_uuid`
// em QUALQUER `POST /movements`, inclusive transferências — não há como
// disparar os N POSTs sem esses 3 campos. Este modal pede Categoria+Centro
// de Custo+Proprietário UMA VEZ (aplicados a TODAS as N transações do
// lote, cada uma virando 1 linha de rateio 100%) — é a MENOR extensão de UI
// que satisfaz a validação real do servidor, sem fabricar um default
// silencioso.
//
// Sem sucesso parcial mascarado (DoD da Tarefa): o loop PARA no primeiro
// erro e reporta quantas transações foram aplicadas ANTES da falha — nunca
// tenta continuar "pulando" a que falhou.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Alert, Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { createMovement } from '@/services/v2/Movements/movement-service';

// Import cruzado por caminho relativo (mirror `NewMovementModal.tsx`), 3
// níveis daqui até `CadastrosBase/`.

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { OfxReconciliationItem } from '@/@types/v2/Financeiro/ofxImport/reconciliation';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { MovementPayload } from '@/@types/v2/Movements';

import { useProprietariesList } from '../../../CadastrosBase/ContasBancarias/useAccounts';

function findParamsFromSearch(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

// UT-000753 (b) — mirror `MovementAllocationEditor.tsx`/
// `ExpenseApportionmentTab.tsx:405-408`: o select de Centro de Custo deste
// modal NUNCA pode listar Sintéticos (class=1) nem desativados (legado
// `agro365 Admin/OfxImportController.php:303-307`, `class=2` + ativos).
function findCostCenterParams(search: string | { search: string }) {
  return {
    search: typeof search === 'string' ? search : search.search,
    only_analytic: true,
    is_enabled: 'true' as const,
  };
}

export interface BulkInvestmentBannerProps {
  pendingInvestments: OfxReconciliationItem[];
  accountUuid: string;
  accountLabel: string;
  investmentAccountUuid: string | null;
  investmentAccountLabel: string | null;
  onSuccess: () => void;
}

export function BulkInvestmentBanner({
  pendingInvestments,
  accountUuid,
  accountLabel,
  investmentAccountUuid,
  investmentAccountLabel,
  onSuccess,
}: BulkInvestmentBannerProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.ofxImports.ofxImport.reconciliation.investmentBanner;

  const [isOpen, setIsOpen] = useState(false);
  const [categoryOption, setCategoryOption] = useState<Option<string> | null>(null);
  const [centerOption, setCenterOption] = useState<Option<string> | null>(null);
  const [proprietaryOption, setProprietaryOption] = useState<Option<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  // UT-000739 — escopo FAZENDA (não tenant): mesmo mirror aplicado em
  // `NewMovementModal.tsx` (legado `OfxImportController.php:319-325`,
  // `farm_proprietary`). `activeFarmUuid` entra na `queryKey` do hook
  // (`useAccounts.tsx`), refazendo o fetch sozinho na troca de fazenda.
  const proprietariesQuery = useProprietariesList(activeFarmUuid ?? undefined);
  const proprietaryOptions = (proprietariesQuery.data ?? []).map((option) => ({
    label: option.label,
    value: option.uuid,
  }));

  if (pendingInvestments.length === 0) return null;

  function handleOpen() {
    setCategoryOption(null);
    setCenterOption(null);
    setProprietaryOption(null);
    setAppliedCount(0);
    setIsOpen(true);
  }

  async function handleConfirm() {
    if (!investmentAccountUuid || !categoryOption || !centerOption || !proprietaryOption) return;

    setIsSubmitting(true);
    setAppliedCount(0);
    let applied = 0;

    try {
      for (const item of pendingInvestments) {
        const payload: MovementPayload = {
          date: item.date,
          type: item.type,
          type_category: 'T',
          account_uuid: accountUuid,
          destination_account_uuid: investmentAccountUuid,
          farm_uuid: null,
          proprietary_uuid: proprietaryOption.value,
          client_uuid: null,
          provider_uuid: null,
          value: Number(item.value),
          document: null,
          note: (item.memo || '').slice(0, 40),
          fiscal_document: false,
          generates_obligation: false,
          allocations: [
            {
              category_uuid: categoryOption.value,
              center_uuid: centerOption.value,
              plan_account_uuid: null,
              harvest_uuid: null,
              value: Number(item.value),
            },
          ],
        };
        // eslint-disable-next-line no-await-in-loop -- lote SEQUENCIAL
        // (mirror legado ACT-10: "N POSTs sequenciais, não em transação
        // única") — precisa parar no 1º erro, não pode ser Promise.all.
        await createMovement(payload);
        applied += 1;
        setAppliedCount(applied);
      }

      toaster.success({ title: text.title, description: text.successToast, duration: 7000 });
      setIsOpen(false);
      onSuccess();
    } catch {
      toaster.error({
        title: text.title,
        description: `${applied}/${pendingInvestments.length} ${text.partialErrorToast}`,
        duration: 9000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const canConfirm =
    !!investmentAccountUuid && !!categoryOption && !!centerOption && !!proprietaryOption;

  return (
    <>
      <Alert.Root status="info" borderRadius="md" mb={4}>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{text.title}</Alert.Title>
          <Alert.Description>{text.description}</Alert.Description>
        </Alert.Content>
        <Button title={text.cta} size="sm" onClick={handleOpen} />
      </Alert.Root>

      <CustomDialog
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title={text.modalTitle}
        size="xl"
        maxH="85vh"
        scrollableBody
        preventCloseOnOutside={isSubmitting}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            />
            <Button
              title={
                isSubmitting
                  ? `${text.confirmButton} (${appliedCount}/${pendingInvestments.length})`
                  : text.confirmButton
              }
              type="button"
              onClick={handleConfirm}
              loading={isSubmitting}
              disabled={!canConfirm || isSubmitting}
            />
          </>
        }
      >
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.modalDescription}
        </Text>

        {!investmentAccountUuid ? (
          <Alert.Root status="warning" borderRadius="md" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{text.missingInvestmentAccount}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
            <InputReadOnly
              label={languageGB.movements.movement.form.fields.account}
              value={accountLabel}
            />

            <InputReadOnly
              label={languageGB.movements.movement.form.fields.destinationAccount}
              value={investmentAccountLabel ?? ''}
            />

            <SelectCombobox
              name="proprietary_uuid"
              label={languageGB.movements.movement.form.fields.proprietary}
              options={proprietaryOptions}
              loading={proprietariesQuery.isLoading}
              value={proprietaryOption}
              onChange={(option) => setProprietaryOption(option ?? null)}
              isRequired
              disabled={isSubmitting}
            />

            <SelectAsyncPaginate
              name="category_uuid"
              label={languageGB.movements.movement.form.allocations.fields.category}
              service={listFinancialCategoryOptions}
              mapOptions={(item: FinancialCategoryOption) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={findParamsFromSearch}
              value={categoryOption ?? undefined}
              onChange={(option: any) => setCategoryOption(option ?? null)}
              isRequired
              isDisabled={isSubmitting}
            />

            <SelectAsyncPaginate
              name="center_uuid"
              label={languageGB.movements.movement.form.allocations.fields.center}
              service={listCostCenterOptions}
              mapOptions={(item: CostCenterRef) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={findCostCenterParams}
              value={centerOption ?? undefined}
              onChange={(option: any) => setCenterOption(option ?? null)}
              isRequired
              isDisabled={isSubmitting}
            />
          </SimpleGrid>
        )}

        <Box border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
          <Flex direction="column">
            {pendingInvestments.map((item, index) => (
              <Flex
                key={item.fit_id}
                align="center"
                gap={4}
                p={3}
                borderBottomWidth="1px"
                borderColor="border.subtle"
                bg={isSubmitting && index < appliedCount ? 'bg.subtle' : undefined}
              >
                <Text fontSize="sm" flex="1" lineClamp="1">
                  {item.memo}
                </Text>
                <Text fontSize="sm" color="fg.muted" minW="100px">
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" minW="120px" textAlign="right">
                  {Number(item.value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </CustomDialog>
    </>
  );
}
