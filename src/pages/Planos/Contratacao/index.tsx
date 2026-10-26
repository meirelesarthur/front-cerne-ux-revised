// src/pages/Planos/Contratacao/index.tsx
// -----------------------------------------------------------------------------
// Página "Contratar ou alterar plano" (rota `/planos/contratar`) — configurador no modelo do
// simulador da Eveo: ETAPAS à esquerda (1 Plano e acessos · 2 Módulos adicionais) e RESUMO
// escuro fixo à direita com o total, a comparação entre planos e as ações.
//
// Dados REAIS do catálogo comercial: `catalog.ts` (artifact "Cerne Planos e Precificação"),
// regra de preço em `pricing.ts` (pura e testada). A página só COMPÕE componentes do kit
// (`StepIndicator`, `PlanOptionCard`, `QuantityStepper`, `CheckOptionRow`, `SummaryPanel`,
// `PlanCompareStrip`…) e liga estado + regra.
//
// PENDENTE de backend (placeholders marcados): assinatura atual do contratante
// (`CURRENT_SUBSCRIPTION`), catálogo via API e envio da solicitação ao comercial.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Alert, Box, Flex, Grid, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { CheckOptionRow } from '@/components/ui/CheckOptionRow';
import { Icon } from '@/components/ui/Icon';
import { PlanCompareStrip } from '@/components/ui/PlanCompareStrip';
import { PlanOptionCard } from '@/components/ui/PlanOptionCard';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StepIndicator } from '@/components/ui/StepIndicator';
import {
  SummaryGroup,
  SummaryNote,
  SummaryPanel,
  SummaryRow,
  SummaryTotal,
} from '@/components/ui/SummaryPanel';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { CATALOG, PLAN_DESCRIPTION, type PlanTier } from './catalog';
import {
  annualMonthly,
  annualTotal,
  compareTiers,
  formatBRL,
  isIncluded,
  pruneUnavailable,
  quote,
  RANK,
  toggleModule,
  type Selection,
} from './pricing';

type StepKey = 'plan' | 'modules';
type Billing = 'monthly' | 'annual';

/**
 * PLACEHOLDER — assinatura atual do contratante. Virá de `GET /subscription` quando existir;
 * `null` = contratação nova (sem selo "Plano atual" nem comparação com o atual).
 */
const CURRENT_SUBSCRIPTION: Selection | null = {
  plan: 'Pro',
  users: 3,
  modules: new Set<string>(),
};

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));

export default function ContratacaoPlano() {
  const { languageGB } = useLanguage();
  const text = languageGB.subscription;

  const [step, setStep] = useState<StepKey>('plan');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [selection, setSelection] = useState<Selection>(
    CURRENT_SUBSCRIPTION ?? { plan: 'Pro', users: 5, modules: new Set<string>() }
  );
  const [note, setNote] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);

  const tagline: Record<PlanTier, string> = {
    Pro: text.plan.taglinePro,
    Deluxe: text.plan.taglineDeluxe,
    Enterprise: text.plan.taglineEnterprise,
  };

  // ---- Derivados ----
  const current = quote(selection.plan, selection);
  const { quotes, cheapest } = useMemo(() => compareTiers(selection), [selection]);
  const annual = billing === 'annual';
  const monthShown = annual ? annualMonthly(current.month) : current.month;
  const includedModules = CATALOG.modules.filter((m) => isIncluded(selection.plan, m));
  const currentQuote = CURRENT_SUBSCRIPTION ? quote(CURRENT_SUBSCRIPTION.plan, CURRENT_SUBSCRIPTION) : null;
  const deltaVsCurrent = currentQuote ? current.month - currentQuote.month : null;

  // Sugestão: plano mais barato que atende a mesma configuração
  const suggestion =
    !note && cheapest.tier !== selection.plan && cheapest.month < current.month
      ? fill(
          RANK[cheapest.tier] > RANK[selection.plan] ? text.messages.upgradeCheaper : text.messages.otherCheaper,
          { plan: cheapest.tier, v: formatBRL(current.month - cheapest.month) }
        )
      : '';

  // ---- Ações ----
  function choosePlan(plan: PlanTier) {
    const { selection: next, removed } = pruneUnavailable({ ...selection, plan });
    setSelection(next);
    setNote(
      removed.length
        ? fill(text.messages.moduleRemoved, { module: removed[0].name, plan: removed[0].includedIn })
        : ''
    );
  }

  function onToggleModule(key: string, checked: boolean) {
    const result = toggleModule(selection, key, checked);
    setSelection(result.selection);
    setNote(
      result.adjustedTo
        ? fill(text.messages.moduleRequires, { module: result.module.name, plan: result.adjustedTo })
        : ''
    );
  }

  const summaryText = () =>
    [
      'GB Cerne · proposta',
      `${text.summary.plan} ${selection.plan}: ${formatBRL(current.base)}${text.plan.perMonth}`,
      `${text.summary.accesses}: ${selection.users} (${CATALOG.seatsIncluded[selection.plan]} ${text.summary.includedInPlan.toLowerCase()}${
        current.extraSeats
          ? `, ${current.extraSeats} ${text.summary.extras.toLowerCase()} × ${formatBRL(CATALOG.extraSeatPrice[selection.plan])} = ${formatBRL(current.seatsTotal)}`
          : ''
      })`,
      `${text.summary.modules}: ${
        current.addedModules.length
          ? current.addedModules.map((m) => `${m.name} (+${formatBRL(m.price ?? 0)})`).join('; ')
          : text.summary.none
      }`,
      `Total: ${formatBRL(current.month)}${text.plan.perMonth}${
        annual ? ` · ${formatBRL(annualTotal(current.month))} / ano` : ` · ${formatBRL(current.month * 12)} / ano`
      }`,
    ].join('\n');

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText());
      toaster.success({ title: text.summary.copied });
    } catch {
      toaster.error({ title: text.summary.copyError });
    }
  }

  function sendRequest() {
    setRequestOpen(false);
    toaster.success({ title: text.request.done, description: text.request.devNotice, duration: 8000 });
  }

  const requestLabel = !CURRENT_SUBSCRIPTION
    ? text.summary.requestNew
    : RANK[selection.plan] > RANK[CURRENT_SUBSCRIPTION.plan]
      ? text.summary.requestUpgrade
      : text.summary.requestChange;

  // ---- Etapa 1: plano, cobrança e acessos ----
  const planStep = (
    <>
      <FieldRow icon="blocks" title={text.plan.title} hint={text.plan.hint} wide>
        <Grid role="radiogroup" aria-label={text.plan.title} templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }} gap="8px">
          {CATALOG.tiers.map((tier) => (
            <PlanOptionCard
              key={tier}
              name={tier}
              price={formatBRL(CATALOG.basePrice[tier])}
              priceSuffix={text.plan.perMonth}
              description={`${fill(text.plan.accessesIncluded, { n: CATALOG.seatsIncluded[tier] })} · ${tagline[tier]}`}
              accent={CATALOG.accent[tier]}
              selected={selection.plan === tier}
              onSelect={() => choosePlan(tier)}
              badge={CURRENT_SUBSCRIPTION?.plan === tier ? text.plan.current : undefined}
            />
          ))}
        </Grid>
        <Text fontSize="base" color="fg.muted" mt="12px" lineHeight="1.5">
          <b>{selection.plan}:</b> {PLAN_DESCRIPTION[selection.plan]}
        </Text>
      </FieldRow>

      <FieldRow icon="calendar" title={text.billing.title} hint={text.billing.hint}>
        <SegmentedControl<Billing>
          value={billing}
          onChange={setBilling}
          ariaLabel={text.billing.title}
          options={[
            { key: 'monthly', label: text.billing.monthly },
            { key: 'annual', label: text.billing.annual },
          ]}
        />
      </FieldRow>

      <FieldRow icon="users" title={text.accesses.title} hint={text.accesses.hint}>
        <QuantityStepper
          value={selection.users}
          onChange={(users) => setSelection((s) => ({ ...s, users }))}
          labels={{ decrease: text.accesses.decrease, increase: text.accesses.increase, input: text.accesses.quantity }}
        />
        <Text fontSize="base" color="fg.muted" mt="8px">
          {fill(text.accesses.info, {
            inc: CATALOG.seatsIncluded[selection.plan],
            plan: selection.plan,
            price: formatBRL(CATALOG.extraSeatPrice[selection.plan]),
          })}
        </Text>
      </FieldRow>

      <Flex justify="flex-end" pt={5}>
        <Button title={text.nav.next} onClick={() => setStep('modules')} />
      </Flex>
    </>
  );

  // ---- Etapa 2: módulos ----
  const groupLabel = (includedIn: string) =>
    includedIn === 'Deluxe' ? text.modules.groupDeluxe : includedIn === 'Enterprise' ? text.modules.groupEnterprise : text.modules.groupAny;

  const moduleGroups = CATALOG.modules.reduce<{ label: string; items: typeof CATALOG.modules }[]>((acc, m) => {
    const label = groupLabel(m.includedIn);
    const last = acc[acc.length - 1];
    if (last && last.label === label) last.items.push(m);
    else acc.push({ label, items: [m] });
    return acc;
  }, []);

  const modulesStep = (
    <>
      <Box py={4} borderBottomWidth="1px" borderColor="border.muted">
        <Text fontSize="md" fontWeight="semibold">
          {text.modules.title}
        </Text>
        <Text fontSize="base" color="fg.muted">
          {text.modules.hint}
        </Text>
      </Box>
      <Flex direction="column" gap="6px" pt={3}>
        {moduleGroups.map((group) => (
          <Box key={group.label}>
            <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em" mt="10px" mb="6px">
              {group.label}
            </Text>
            <Flex direction="column" gap="6px">
              {group.items.map((m) => {
                const included = isIncluded(selection.plan, m);
                return (
                  <CheckOptionRow
                    key={m.key}
                    id={`module-${m.key}`}
                    label={m.name}
                    description={m.description}
                    checked={included || selection.modules.has(m.key)}
                    locked={included}
                    trailing={
                      included
                        ? text.modules.included
                        : m.price === null
                          ? fill(text.modules.onlyFrom, { plan: m.includedIn })
                          : `+ ${formatBRL(m.price)}`
                    }
                    onChange={(checked) => onToggleModule(m.key, checked)}
                  />
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>
      <Flex justify="flex-start" pt={5}>
        <Button title={text.nav.back} variant="secondary" onClick={() => setStep('plan')} />
      </Flex>
    </>
  );

  // ---- Resumo escuro ----
  const summary = (
    <SummaryPanel title={text.summary.title} icon="receipt">
      <SummaryGroup title={text.summary.plan}>
        <SummaryRow label={text.summary.plan} value={selection.plan} />
        <SummaryRow label={text.summary.baseValue} value={formatBRL(current.base)} />
      </SummaryGroup>

      <SummaryGroup title={text.summary.accesses}>
        <SummaryRow label={text.summary.contracted} value={String(selection.users)} />
        <SummaryRow label={text.summary.includedInPlan} value={String(CATALOG.seatsIncluded[selection.plan])} tone="included" />
        {current.extraSeats > 0 ? (
          <SummaryRow
            label={`${text.summary.extras}: ${current.extraSeats} × ${formatBRL(CATALOG.extraSeatPrice[selection.plan])}`}
            value={`+ ${formatBRL(current.seatsTotal)}`}
            tone="added"
          />
        ) : (
          <SummaryRow label={text.summary.extras} value={text.summary.none} />
        )}
        <SummaryNote>{text.summary.seatsNote}</SummaryNote>
      </SummaryGroup>

      <SummaryGroup title={text.summary.modules}>
        {current.addedModules.length > 0 ? (
          current.addedModules.map((m) => (
            <SummaryRow key={m.key} label={m.name} value={`+ ${formatBRL(m.price ?? 0)}`} tone="added" />
          ))
        ) : (
          <SummaryNote>{text.summary.noModules}</SummaryNote>
        )}
        {includedModules.length > 0 && (
          <SummaryNote>
            {fill(text.summary.alreadyIncluded, { plan: selection.plan })}: {includedModules.map((m) => m.name).join(' · ')}
          </SummaryNote>
        )}
      </SummaryGroup>

      <SummaryTotal
        label={fill(annual ? text.summary.totalAnnual : text.summary.totalMonth, { plan: selection.plan })}
        value={formatBRL(monthShown)}
        hint={
          annual
            ? fill(text.summary.annualInstead, { a: formatBRL(annualTotal(current.month)), b: formatBRL(current.month * 12) })
            : fill(text.summary.perYear, { v: formatBRL(current.month * 12) })
        }
      />

      {deltaVsCurrent !== null && (
        <SummaryRow
          label={text.summary.vsCurrent}
          value={
            deltaVsCurrent === 0
              ? text.summary.sameAsCurrent
              : `${deltaVsCurrent > 0 ? '+' : '−'} ${formatBRL(Math.abs(deltaVsCurrent))}${text.plan.perMonth}`
          }
          tone={deltaVsCurrent > 0 ? 'added' : 'included'}
        />
      )}

      {(note || suggestion) && (
        <Box borderLeftWidth="3px" borderLeftColor="#10b981" bg="rgba(16,185,129,0.14)" color="#d7ece0" borderRadius="0 10px 10px 0" px="12px" py="8px" fontSize="base">
          {note || suggestion}
        </Box>
      )}

      <Flex direction="column" gap="6px">
        <Text fontSize="sm" color="#7da893">
          {text.summary.compare}
        </Text>
        <PlanCompareStrip
          labels={{ cheapest: text.summary.cheapest, unavailable: text.summary.unavailable }}
          onSelect={(key) => choosePlan(key as PlanTier)}
          items={quotes.map((q) => ({
            key: q.tier,
            label: q.tier,
            value: q.valid ? formatBRL(q.month) : null,
            accent: CATALOG.accent[q.tier],
            current: q.tier === selection.plan,
            best: q.valid && q.tier === cheapest.tier,
          }))}
        />
      </Flex>

      <Flex direction="column" gap="8px" pt="4px">
        <Button title={requestLabel} onClick={() => setRequestOpen(true)} />
        <Button title={text.summary.copy} variant="secondary" onClick={copySummary} />
      </Flex>
    </SummaryPanel>
  );

  return (
    <FormContainer fullBleed title={text.pageTitle} subtitle={text.pageSubtitle}>
      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 360px' }} height="100%" minH={0}>
        <Box px={{ base: 4, md: 7 }} py={5} overflowY="auto" minW={0}>
          <Alert.Root status="info" borderRadius="lg" mb={5}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{text.simulationNotice}</Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <Box mb={4}>
            <StepIndicator<StepKey>
              ariaLabel={text.steps.label}
              value={step}
              onChange={setStep}
              steps={[
                { key: 'plan', label: text.steps.plan },
                { key: 'modules', label: text.steps.modules },
              ]}
            />
          </Box>

          {step === 'plan' ? planStep : modulesStep}
        </Box>
        <Box overflowY="auto" minH={0}>
          {summary}
        </Box>
      </Grid>

      <DeleteConfirmDialog
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        onConfirm={sendRequest}
        title={text.request.title}
        description={text.request.body}
        hideQuestionMark
        warningText={text.request.devNotice}
        tone="info"
        confirmButtonText={text.request.confirm}
      />
    </FormContainer>
  );
}

/** Linha de configuração: ícone + título/dica à esquerda, controle à direita (ou largura total). */
function FieldRow({
  icon,
  title,
  hint,
  wide = false,
  children,
}: {
  icon: 'blocks' | 'calendar' | 'users';
  title: string;
  hint: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Grid
      templateColumns={{ base: '1fr', md: wide ? '1fr' : 'minmax(0, 0.85fr) minmax(0, 1.15fr)' }}
      gap="18px 24px"
      alignItems="center"
      py={5}
      borderBottomWidth="1px"
      borderColor="border.muted"
    >
      <Flex gap="14px" align="center" minW={0}>
        <Flex align="center" justify="center" flexShrink={0} boxSize="44px" borderRadius="xl" bg="semanticNeutral.100" borderWidth="1px" borderColor="semanticNeutral.200" color="green.600">
          <Icon name={icon} size={20} />
        </Flex>
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            {title}
          </Text>
          <Text fontSize="base" color="fg.muted" lineHeight="1.4">
            {hint}
          </Text>
        </Box>
      </Flex>
      <Box minW={0}>{children}</Box>
    </Grid>
  );
}
