// src/pages/Administrativo/OrdensCompra/PurchaseOrderFlowSettings.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 5 — F0 e F2 do plano) — "Fluxo da ordem de compra":
//   1. diagrama do fluxo: uma linha de etapas por perfil (`StepTrack`, só as
//      etapas que o perfil tem) e as exceções que valem em qualquer perfil (F0);
//   2. perfil do fluxo (Simples, Padrão, Completo) — o escolhido destaca a
//      linha do diagrama;
//   3. categorias no lugar dos 11 tipos (`purchaseOrderCategories.ts`);
//   4. cotação por faixa de valor (limites e quantidade, editáveis);
//   5. aprovação automática até um valor e níveis de alçada.
// Só aparece com `PURCHASE_ORDER_PROTOTYPE`. Nada é gravado: "Salvar" mostra o
// aviso de protótipo. Rota `/administrativo/ordens-de-compra/parametros`.
// -----------------------------------------------------------------------------

import { type ReactNode, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Icon } from '@/components/ui/Icon';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { StepTrack } from '@/components/ui/StepTrack';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { requestPurchaseTypeOptions } from '@/constants/RequestPurchases/options';
import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import type { IconName } from '@/design/icons';

import { PURCHASE_ORDER_CATEGORIES } from '../Solicitacao/prototype/purchaseOrderCategories';
import {
  type PurchaseOrderFlowProfile,
  purchaseOrderSteps,
} from '../Solicitacao/prototype/purchaseOrderSteps';
import { RequestTabHeader } from '../Solicitacao/RequestTabParts';

const PROFILES: PurchaseOrderFlowProfile[] = ['simples', 'padrao', 'completo'];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Box mb={8}>
      <RequestTabHeader title={title} />
      {hint && (
        <Text fontSize="sm" color="fg.muted" mt={-2} mb={4}>
          {hint}
        </Text>
      )}
      {children}
    </Box>
  );
}

export default function PurchaseOrderFlowSettings() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const proto = languageGB.requestPurchases.requestPurchase.form.prototype;
  const text = proto.settings;
  const steps = languageGB.requestPurchases.requestPurchase.form.statusBar;

  const [profile, setProfile] = useState<PurchaseOrderFlowProfile>('padrao');
  const [limits, setLimits] = useState<(number | null)[]>([1000, 5000, 50000]);
  const [quotes, setQuotes] = useState<(number | null)[]>([0, 1, 2, 3]);
  const [autoApprove, setAutoApprove] = useState<number | null>(1000);

  const typeLabel = new Map(requestPurchaseTypeOptions.options(languageGB).map((o) => [o.value, o.label]));

  // ---- 1. diagrama: o caminho completo de cada perfil (situação "finalizado").
  // Só as etapas que o perfil tem (as puladas não aparecem).
  const flow = PROFILES.map((key) => ({
    key,
    items: purchaseOrderSteps(requestPurchaseStatus.pedidoFinalizado, key)
      .filter((step) => step.state !== 'skipped')
      .map((step) => ({
        key: step.key,
        label: steps.steps[step.key],
        state: step.state,
      })),
  }));

  const exceptions: { icon: IconName; text: string }[] = [
    { icon: 'close', text: text.exceptions.rejected },
    { icon: 'package-check', text: text.exceptions.partial },
    { icon: 'error', text: text.exceptions.cancel },
    { icon: 'rotate-back', text: text.exceptions.reopen },
  ];

  // ---- 3. categorias
  const categoryColumns: SimpleTableColumn[] = [
    { key: 'category', header: text.categoryColumn },
    { key: 'types', header: text.typesColumn },
  ];
  const categoryRows: SimpleTableRow[] = PURCHASE_ORDER_CATEGORIES.map((category) => ({
    key: category.key,
    cells: {
      category: <Text fontWeight="semibold">{proto.categories.names[category.key]}</Text>,
      types: (
        <Flex gap={2} wrap="wrap">
          {category.types.map((type) => (
            <Box
              key={type}
              as="span"
              px="8px"
              py="2px"
              borderRadius="md"
              bg="semanticNeutral.100"
              fontSize="sm"
              color="strongText"
            >
              {typeLabel.get(type as never) ?? type}
            </Box>
          ))}
        </Flex>
      ),
    },
  }));

  // ---- 4. faixas de cotação
  const money = (value: number | null) => formatCurrencyBRL(value ?? 0);
  const rangeLabel = (index: number) => {
    if (index === 0) return text.upTo.replace('{value}', money(limits.at(0) ?? 0));
    if (index === limits.length) return text.above.replace('{value}', money(limits.at(-1) ?? 0));
    return text.between.replace('{from}', money(limits.at(index - 1) ?? 0)).replace('{to}', money(limits.at(index) ?? 0));
  };
  const quoteColumns: SimpleTableColumn[] = [
    { key: 'range', header: text.rangeColumn },
    { key: 'limit', header: '' },
    { key: 'quotes', header: text.quotesColumn },
  ];
  const quoteRows: SimpleTableRow[] = quotes.map((count, index) => ({
    key: String(index),
    cells: {
      range: <Text fontWeight="medium">{rangeLabel(index)}</Text>,
      limit:
        index < limits.length ? (
          <Box maxW="200px">
            <MaskedInput
              kind="currency"
              name={`limit_${index}`}
              aria-label={rangeLabel(index)}
              value={limits.at(index) ?? null}
              onValueChange={(value) => setLimits((current) => current.map((v, i) => (i === index ? value : v)))}
              min={0}
            />
          </Box>
        ) : null,
      quotes: (
        <Flex align="center" gap={3}>
          <Box w="90px">
            <MaskedInput
              kind="integer"
              name={`quotes_${index}`}
              aria-label={text.quotesColumn}
              value={count}
              onValueChange={(value) => setQuotes((current) => current.map((v, i) => (i === index ? value : v)))}
              min={0}
            />
          </Box>
          {!count && <Text fontSize="sm" color="fg.muted">{text.noQuote}</Text>}
        </Flex>
      ),
    },
  }));

  // ---- 5. alçada
  const levelColumns: SimpleTableColumn[] = [
    { key: 'level', header: text.levelColumn },
    { key: 'who', header: text.whoColumn },
    { key: 'when', header: text.whenColumn },
  ];
  const levelRows: SimpleTableRow[] = (['encarregado', 'diretoria', 'ciencia'] as const).map((key, index) => ({
    key,
    cells: {
      level: <Text fontWeight="semibold">{index + 1}</Text>,
      who: text.levels[key],
      when: <Text color="fg.muted">{text.levelWhen[key]}</Text>,
    },
  }));

  function save() {
    toaster.success({ title: text.toastTitle, description: text.toastDescription });
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <>
          <Button title={languageGB.defaltStrings.cancel} variant="secondary" type="button" onClick={() => navigate(-1)} />
          <Button title={text.save} type="button" onClick={save} />
        </>
      }
    >
      <Flex align="center" gap={2} mb={6} px={4} py={3} borderRadius="lg" bg="secondary" color="green.700">
        <Icon name="info" size="sm" />
        <Text fontSize="sm" fontWeight="medium">
          {text.prototypeNote}
        </Text>
      </Flex>

      <Section title={text.flowTitle} hint={text.flowHint}>
        <Flex direction="column" gap={3}>
          {flow.map((row) => {
            const active = row.key === profile;
            return (
              <Flex
                key={row.key}
                align="center"
                gap={4}
                px={4}
                py={3}
                borderWidth={active ? '2px' : '1px'}
                borderColor={active ? 'green.600' : 'semanticNeutral.200'}
                borderRadius="xl"
                bg="cardBG"
              >
                <Box w="170px" flexShrink={0}>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="semibold" color={active ? 'green.700' : 'strongText'}>
                      {steps.profiles[row.key]}
                    </Text>
                    {active && <StatusTag size="sm" label={text.selected} color="green.600" />}
                  </Flex>
                  <Text fontSize="sm" color="fg.muted">
                    {text.flowCaption[row.key]}
                  </Text>
                </Box>
                <Box flex="1" minW="420px">
                  <StepTrack items={row.items} ariaLabel={`${text.flowTitle}: ${steps.profiles[row.key]}`} />
                </Box>
              </Flex>
            );
          })}
        </Flex>
        <Text fontSize="sm" fontWeight="semibold" mt={5} mb={2}>
          {text.exceptionsTitle}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
          {exceptions.map((item) => (
            <Flex key={item.icon} align="flex-start" gap={2} fontSize="sm" color="strongText">
              <Box color="fg.muted" pt="2px">
                <Icon name={item.icon} size="xs" />
              </Box>
              <Text>{item.text}</Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Section>

      <Section title={text.profileTitle} hint={text.profileHint}>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          {PROFILES.map((key) => {
            const active = key === profile;
            return (
              <Box
                key={key}
                as="button"
                {...({ type: 'button' } as Record<string, string>)}
                onClick={() => setProfile(key)}
                textAlign="left"
                px={4}
                py={4}
                borderWidth={active ? '2px' : '1px'}
                borderColor={active ? 'green.600' : 'semanticNeutral.200'}
                borderRadius="xl"
                bg={active ? 'secondary' : 'cardBG'}
                _hover={{ borderColor: active ? 'green.600' : 'semanticNeutral.300' }}
                aria-pressed={active}
              >
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontWeight="semibold" fontSize="xl" color={active ? 'green.700' : 'strongText'}>
                    {steps.profiles[key]}
                  </Text>
                  {active && <StatusTag size="sm" label={text.selected} color="green.600" />}
                </Flex>
                <Text fontSize="sm" color="fg.muted">
                  {text.profiles[key]}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Section>

      <Section title={text.categoriesTitle} hint={text.categoriesHint}>
        <SimpleTable columns={categoryColumns} rows={categoryRows} ariaLabel={text.categoriesTitle} />
      </Section>

      <Section title={text.quotesTitle} hint={text.quotesHint}>
        <SimpleTable columns={quoteColumns} rows={quoteRows} ariaLabel={text.quotesTitle} />
      </Section>

      <Section title={text.approvalTitle} hint={text.autoApproveHint}>
        <Box maxW="320px" mb={5}>
          <MaskedInput
            kind="currency"
            name="auto_approve"
            label={text.autoApprove}
            value={autoApprove}
            onValueChange={setAutoApprove}
            min={0}
          />
        </Box>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          {text.levelsTitle}
        </Text>
        <SimpleTable columns={levelColumns} rows={levelRows} ariaLabel={text.levelsTitle} />
      </Section>
    </FormContainer>
  );
}
