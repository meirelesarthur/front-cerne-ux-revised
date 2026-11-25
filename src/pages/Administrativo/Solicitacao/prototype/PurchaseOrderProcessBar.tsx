// src/pages/Administrativo/Solicitacao/prototype/PurchaseOrderProcessBar.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (só com `PURCHASE_ORDER_PROTOTYPE`) — faixa do topo da Ordem de
// compra: as ETAPAS do processo (`StepTrack`, regra em `purchaseOrderSteps.ts`,
// com as puladas pelo perfil de fluxo esmaecidas) e, à direita, FORNECEDOR
// (cotação aprovada), COMPRADOR e PREVISÃO DE ENTREGA (a mais tarde entre os
// itens; selo "Atrasada" quando vencida e "Alterar" com justificativa, que no
// protótipo muda só esta tela). Fases F1, F2 e F3 do plano. Os campos
// `flow_profile`, `winning_provider`, `buyer` e `delivery_forecast` ainda não
// existem na API: vêm dos dados de demonstração
// (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Input } from '@/components/Form/Input';
import { Textarea } from '@/components/Form/Textarea';
import { StatusTag } from '@/components/ui/StatusTag';
import { StepTrack, type StepTrackItem } from '@/components/ui/StepTrack';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { purchaseOrderSteps } from './purchaseOrderSteps';
import { isDeliveryLate, type PurchaseOrderPrototypeFields } from './prototypeFields';

interface PurchaseOrderProcessBarProps {
  data: RequestPurchaseData & PurchaseOrderPrototypeFields;
  /** Permite "Alterar" a previsão (fora da visualização somente leitura). */
  canChangeForecast?: boolean;
}

function PartyLabel({ children }: { children: string }) {
  return (
    <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="0.05em">
      {children}
    </Text>
  );
}

function Party({ label, value, empty }: { label: string; value?: string | null; empty: string }) {
  return (
    <Box minW={0}>
      <PartyLabel>{label}</PartyLabel>
      <Text
        fontSize="base"
        fontWeight={value ? 'semibold' : 'medium'}
        color={value ? 'strongText' : 'fg.muted'}
        lineClamp="1"
        title={value ?? undefined}
      >
        {value || empty}
      </Text>
    </Box>
  );
}

export function PurchaseOrderProcessBar({ data, canChangeForecast = false }: PurchaseOrderProcessBarProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.statusBar;
  const forecastText = languageGB.requestPurchases.requestPurchase.form.prototype.forecast;
  const profile = data.flow_profile ?? 'padrao';

  // Protótipo: a alteração vale só nesta tela (não há API para gravar).
  const [forecast, setForecast] = useState<string | null>(data.delivery_forecast ?? null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [justification, setJustification] = useState('');
  const late = isDeliveryLate(forecast, data.status);

  const items: StepTrackItem[] = purchaseOrderSteps(data.status, profile, data.cancelled_at_step).map(
    (step) => ({
      key: step.key,
      label: text.steps[step.key],
      state: step.state,
      hint:
        step.state === 'skipped'
          ? text.stepSkipped.replace('{profile}', text.profiles[profile])
          : undefined,
    })
  );

  function openDialog() {
    setNewDate(forecast?.slice(0, 10) ?? '');
    setJustification('');
    setDialogOpen(true);
  }

  function confirmChange() {
    setForecast(newDate);
    setDialogOpen(false);
    toaster.success({ title: forecastText.toastTitle, description: forecastText.toastDescription });
  }

  return (
    <Flex
      gap={6}
      align="center"
      wrap={{ base: 'wrap', lg: 'nowrap' }}
      mb={6}
      px={5}
      py={4}
      borderWidth="1px"
      borderColor="semanticNeutral.200"
      borderRadius="xl"
      bg="cardBG"
    >
      <Box flex="1" minW="420px">
        <StepTrack items={items} ariaLabel={text.stepsAriaLabel} />
      </Box>
      <Flex
        gap={6}
        flexShrink={0}
        pl={{ base: 0, lg: 6 }}
        borderLeftWidth={{ base: 0, lg: '1px' }}
        borderColor="semanticNeutral.200"
        w={{ base: 'full', lg: 'auto' }}
        maxW={{ lg: '560px' }}
      >
        <Party label={text.provider} value={data.winning_provider?.name} empty={text.notDefined} />
        <Party label={text.buyer} value={data.buyer?.name} empty={text.notDefined} />
        <Box minW={0}>
          <PartyLabel>{forecastText.label}</PartyLabel>
          <Flex align="center" gap={2} wrap="wrap">
            <Text
              fontSize="base"
              fontWeight={forecast ? 'semibold' : 'medium'}
              color={late ? 'red.600' : forecast ? 'strongText' : 'fg.muted'}
              whiteSpace="nowrap"
            >
              {forecast ? formatDate(forecast) : text.notDefined}
            </Text>
            {late && <StatusTag size="sm" label={forecastText.late} color="red.600" />}
            {canChangeForecast && (
              <Box
                as="button"
                {...({ type: 'button' } as Record<string, string>)}
                onClick={openDialog}
                fontSize="sm"
                fontWeight="semibold"
                color="green.700"
                _hover={{ textDecoration: 'underline' }}
              >
                {forecastText.change}
              </Box>
            )}
          </Flex>
        </Box>
      </Flex>

      <CustomDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        title={forecastText.dialogTitle}
        size="sm"
        footer={
          <Flex gap={3}>
            <Button
              title={forecastText.cancel}
              variant="secondary"
              type="button"
              onClick={() => setDialogOpen(false)}
            />
            <Button
              title={forecastText.confirm}
              type="button"
              onClick={confirmChange}
              disabled={!newDate || !justification.trim()}
            />
          </Flex>
        }
      >
        <Flex direction="column" gap={4}>
          <Input
            label={forecastText.newDate}
            type="date"
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            isRequired
          />
          <Textarea
            name="forecast_justification"
            label={forecastText.justification}
            placeholder={forecastText.justificationPlaceholder}
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            rows={3}
            isRequired
          />
        </Flex>
      </CustomDialog>
    </Flex>
  );
}
