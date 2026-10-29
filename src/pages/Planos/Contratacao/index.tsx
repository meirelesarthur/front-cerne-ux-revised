// src/pages/Planos/Contratacao/index.tsx
// -----------------------------------------------------------------------------
// Página "Contratar ou alterar plano" (rota `/planos/contratar`) — configurador no modelo do
// simulador do documento de precificação: ETAPAS à esquerda (1 Fazenda e plano · 2 Módulos e
// serviços) e RESUMO escuro fixo à direita com o total, a comparação entre planos e as ações.
// A visão "Resumo dos planos" mostra a escada de planos, o preço por faixa, os limites de IA e a
// matriz de módulos (mesma fonte de dados do simulador).
//
// Dados REAIS do catálogo comercial: `catalog.ts` (documento "Precificação do GB Cerne"), regra de
// preço em `pricing.ts` (pura e testada). A página só COMPÕE componentes do kit e liga estado + regra.
//
// PENDENTE de backend (placeholders marcados): assinatura atual do contratante
// (`CURRENT_SUBSCRIPTION`), catálogo via API e envio da solicitação ao comercial.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ReactNode } from 'react';

import { Box, Flex, Grid, Input, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { BandSlider } from '@/components/ui/BandSlider';
import { CheckOptionRow } from '@/components/ui/CheckOptionRow';
import { ChoiceCardGroup } from '@/components/ui/ChoiceCardGroup';
import { DashedActionButton } from '@/components/ui/DashedActionButton';
import { GiaTierCard } from '@/components/ui/GiaTierCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PlanCompareStrip } from '@/components/ui/PlanCompareStrip';
import { PlanOptionCard } from '@/components/ui/PlanOptionCard';
import { PlanTierCard } from '@/components/ui/PlanTierCard';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SimpleTable, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StepIndicator } from '@/components/ui/StepIndicator';
import {
  CONFIGURATOR_HEADER_HEIGHT,
  SummaryGroup,
  SummaryNote,
  SummaryPanel,
  SummaryRow,
  SummaryTotal,
} from '@/components/ui/SummaryPanel';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { CATALOG, PLAN_DESCRIPTION, PLAN_HIGHLIGHTS, type PlanTier, type SizeUnit } from './catalog';
import {
  annualMonthly,
  annualTotal,
  bandIndex,
  compareTiers,
  consultPrice,
  formatBRL,
  giaMinimumPass,
  giaTypicalCost,
  giaWorstCost,
  isIncluded,
  positionToSize,
  pruneUnavailable,
  quote,
  RANK,
  sizeToPosition,
  toggleModule,
  type Selection,
} from './pricing';

type StepKey = 'plan' | 'modules';
type ViewKey = 'simulate' | 'plans';
type Billing = 'monthly' | 'annual';

/**
 * PLACEHOLDER — assinatura atual do contratante. Virá de `GET /subscription` quando existir;
 * `null` = contratação nova (sem selo "Plano atual" nem comparação com o atual).
 */
const CURRENT_SUBSCRIPTION: Selection | null = null;

/** Ícone de cada módulo avulso (papéis de `design/icons.ts`). */
const MODULE_ICON: Record<string, IconName> = {
  dre: 'chart-line',
  ofx: 'bank',
  cte: 'truck',
  dom: 'link',
  orc: 'calculator',
  rep: 'cattle',
  fab: 'factory',
  conf: 'fence',
  bal: 'scale',
  car: 'package-check',
  sup: 'cart',
  ven: 'shopping-bag',
  os: 'wrench',
  pes: 'users',
  doc: 'document',
  ras: 'route',
  emi: 'receipt',
};

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));

const n0 = (v: number) => Math.round(v).toLocaleString('pt-BR');

export default function ContratacaoPlano() {
  const { languageGB } = useLanguage();
  const text = languageGB.subscription;

  const [view, setView] = useState<ViewKey>('simulate');
  const [step, setStep] = useState<StepKey>('plan');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [selection, setSelection] = useState<Selection>(
    CURRENT_SUBSCRIPTION ?? { plan: 'Pro', users: 5, modules: new Set<string>(), unit: 'cab', size: 1200, consult: 'none' }
  );
  const [note, setNote] = useState('');
  // Módulo que só existe em plano acima e puxou o plano para cima: desmarcá-lo volta ao plano anterior.
  const [planUndo, setPlanUndo] = useState<{ plan: PlanTier; key: string } | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const tagline: Record<PlanTier, string> = {
    Pro: text.plan.taglinePro,
    Deluxe: text.plan.taglineDeluxe,
    Enterprise: text.plan.taglineEnterprise,
  };

  // ---- Derivados ----
  const unitInfo = CATALOG.sizeUnits[selection.unit];
  const band = bandIndex(selection.unit, selection.size);
  const open = band === 4;
  const current = quote(selection.plan, selection);
  const { quotes, cheapest } = useMemo(() => compareTiers(selection), [selection]);
  const annual = billing === 'annual';
  const monthShown = annual ? annualMonthly(current.month) : current.month;
  const consultMonth = consultPrice(selection.consult);
  const consultOption = CATALOG.consult.find((c) => c.key === selection.consult)!;
  const giaWindow = CATALOG.gia.tiers[selection.plan].window;
  const giaTypical = giaTypicalCost(selection.plan, selection.users);
  const giaWorst = giaWorstCost(selection.plan, selection.users);
  const giaMin = giaMinimumPass(selection.plan, selection.users);
  const includedModules = CATALOG.modules.filter((m) => isIncluded(selection.plan, m));
  const currentQuote = CURRENT_SUBSCRIPTION ? quote(CURRENT_SUBSCRIPTION.plan, CURRENT_SUBSCRIPTION) : null;
  const deltaVsCurrent = currentQuote ? current.month - currentQuote.month : null;
  const seatsIncluded = CATALOG.seatsIncluded[selection.plan];
  const seatsLabel = (tier: PlanTier) =>
    CATALOG.seatsIncluded[tier] === Infinity
      ? text.plan.accessesUnlimited
      : fill(text.plan.accessesIncluded, { n: CATALOG.seatsIncluded[tier] });

  const bandText = (i: number, unit: SizeUnit = selection.unit) => {
    const info = CATALOG.sizeUnits[unit];
    return i < 4
      ? fill(text.size.bandUpTo, { n: i + 1, lim: n0(info.limits[i]), word: info.word })
      : fill(text.size.bandAbove, { lim: n0(info.limits[3]), word: info.word });
  };

  // Sugestão: plano mais barato que atende a mesma configuração
  const suggestion =
    !note && cheapest.tier !== selection.plan && cheapest.month < current.month
      ? fill(
          RANK[cheapest.tier] > RANK[selection.plan] ? text.messages.upgradeCheaper : text.messages.otherCheaper,
          { plan: cheapest.tier, v: formatBRL(current.month - cheapest.month) }
        )
      : !note && open
        ? text.messages.band5
        : '';

  // ---- Ações ----
  function choosePlan(plan: PlanTier) {
    setPlanUndo(null);
    const { selection: next, removed } = pruneUnavailable({ ...selection, plan });
    setSelection(next);
    setNote(
      removed.length
        ? fill(text.messages.moduleRemoved, { module: removed[0].name, plan: removed[0].includedIn })
        : ''
    );
  }

  function onToggleModule(key: string, checked: boolean) {
    if (!checked && planUndo?.key === key) {
      const modules = new Set(selection.modules);
      modules.delete(key);
      setSelection({ ...selection, plan: planUndo.plan, modules });
      setPlanUndo(null);
      setNote('');
      return;
    }
    const result = toggleModule(selection, key, checked);
    if (result.adjustedTo) setPlanUndo({ plan: selection.plan, key });
    setSelection(result.selection);
    setNote(
      result.adjustedTo
        ? fill(text.messages.moduleRequires, { module: result.module.name, plan: result.adjustedTo })
        : ''
    );
  }

  function changeUnit(unit: SizeUnit) {
    if (unit === selection.unit) return;
    // mantém a posição na régua (a faixa) ao trocar de medida
    const position = sizeToPosition(selection.unit, selection.size);
    setSelection((s) => ({ ...s, unit, size: positionToSize(unit, position) }));
  }

  const summaryText = () =>
    [
      'GB Cerne · proposta',
      `${text.summary.size}: ${n0(selection.size)} ${unitInfo.word} (${bandText(band)})`,
      `${text.summary.plan} ${selection.plan}: ${formatBRL(current.base)}${open ? '+' : ''}${text.plan.perMonth}`,
      `${text.summary.accesses}: ${selection.users} (${seatsIncluded === Infinity ? text.plan.accessesUnlimited : `${seatsIncluded} ${text.summary.includedInPlan.toLowerCase()}`}${
        current.extraSeats
          ? `, ${current.extraSeats} ${text.summary.extras.toLowerCase()} × ${formatBRL(CATALOG.extraSeatPrice[selection.plan])} = ${formatBRL(current.seatsTotal)}`
          : ''
      })`,
      `${text.summary.modules}: ${
        current.addedModules.length
          ? current.addedModules.map((m) => `${m.name} (+${formatBRL(m.price ?? 0)})`).join('; ')
          : text.summary.none
      }`,
      `Software: ${formatBRL(current.month)}${text.plan.perMonth}${
        annual ? ` · ${formatBRL(annualTotal(current.month))} / ano` : ` · ${formatBRL(current.month * 12)} / ano`
      }`,
      `${text.summary.ai}: ${CATALOG.gia.tiers[selection.plan].level} · ${fill(text.summary.aiValue, { n: giaWindow })}`,
      consultMonth
        ? `${fill(text.consult.summaryName, { name: consultOption.name })}: ${formatBRL(consultMonth)}${text.plan.perMonth} · ${text.summary.totalWithConsult} ${formatBRL((annual ? annualMonthly(current.month) : current.month) + consultMonth)}${text.plan.perMonth}`
        : `${text.summary.consult}: ${text.consult.none}`,
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

  // ---- Etapa 1: tamanho, plano, acessos e cobrança ----
  const limits = unitInfo.limits;
  const sliderTicks = [0, ...limits, unitInfo.max].map((v, i, arr) => (i === 0 ? '0' : i === arr.length - 1 ? `${n0(v)}+` : n0(v)));
  const planStep = (
    <>
      <FieldRow icon="map" title={text.size.title} hint={text.size.hint} wide>
        <Flex align="center" gap="12px" wrap="wrap" mb="6px">
          <SegmentedControl<SizeUnit>
            value={selection.unit}
            onChange={changeUnit}
            ariaLabel={text.size.unitLabel}
            options={[
              { key: 'cab', label: text.size.cab },
              { key: 'ha', label: text.size.ha },
            ]}
          />
          <Flex align="center" gap="6px">
            <Input
              type="number"
              min={1}
              max={500000}
              w="120px"
              aria-label={text.size.quantity}
              value={selection.size}
              onChange={(e) => {
                const v = Math.max(1, Math.min(500000, Math.round(Number(e.target.value) || 1)));
                setSelection((s) => ({ ...s, size: v }));
              }}
            />
            <Text fontSize="base" color="fg.muted">
              {unitInfo.short}
            </Text>
          </Flex>
        </Flex>
        <BandSlider
          ariaLabel={fill(text.size.scale, { word: unitInfo.word })}
          value={sizeToPosition(selection.unit, selection.size)}
          onChange={(p) => setSelection((s) => ({ ...s, size: positionToSize(s.unit, p) }))}
          ticks={sliderTicks}
          bandLabels={[0, 1, 2, 3, 4].map((i) => fill(text.size.band, { n: i + 1 }))}
          activeBand={band}
        />
        <Text fontSize="base" color="fg.muted" mt="4px">
          <b>{bandText(band)}</b>
          {open ? text.size.band5Note : ''}
        </Text>
      </FieldRow>

      <FieldRow icon="blocks" title={text.plan.title} hint={text.plan.hint} wide>
        <Grid role="radiogroup" aria-label={text.plan.title} templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }} gap="8px">
          {CATALOG.tiers.map((tier) => (
            <PlanOptionCard
              key={tier}
              name={tier}
              price={`${formatBRL(CATALOG.bandPrice[tier][band])}${open ? '+' : ''}`}
              priceSuffix={text.plan.perMonth}
              description={`${seatsLabel(tier)} · ${tagline[tier]}`}
              accent={CATALOG.accent[tier]}
              selected={selection.plan === tier}
              onSelect={() => choosePlan(tier)}
              badge={CURRENT_SUBSCRIPTION?.plan === tier ? text.plan.current : undefined}
            />
          ))}
        </Grid>
      </FieldRow>

      <FieldRow icon="users" title={text.accesses.title} hint={text.accesses.hint}>
        <QuantityStepper
          value={selection.users}
          onChange={(users) => setSelection((s) => ({ ...s, users }))}
          labels={{ decrease: text.accesses.decrease, increase: text.accesses.increase, input: text.accesses.quantity }}
        />
        <Text fontSize="base" color="fg.muted" mt="8px">
          {seatsIncluded === Infinity
            ? fill(text.accesses.infoUnlimited, { plan: selection.plan })
            : fill(text.accesses.info, {
                inc: seatsIncluded,
                plan: selection.plan,
                price: formatBRL(CATALOG.extraSeatPrice[selection.plan]),
              })}
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

      <Box pt={5}>
        <Button title={text.nav.next} onClick={() => setStep('modules')} w="full" />
      </Box>
    </>
  );

  // ---- Etapa 2: módulos e GB Consult ----
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
                // o módulo que puxou o plano pode ser desmarcado (volta ao plano anterior)
                const undoable = planUndo?.key === m.key && included;
                return (
                  <CheckOptionRow
                    key={m.key}
                    id={`module-${m.key}`}
                    label={m.name}
                    description={m.description}
                    icon={MODULE_ICON[m.key]}
                    checked={included || selection.modules.has(m.key)}
                    locked={included && !undoable}
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

      <Box mt={6} pt={4} borderTopWidth="1px" borderColor="border.muted">
        <Flex align="center" gap="8px">
          <Text fontSize="md" fontWeight="semibold">
            {text.consult.title}
          </Text>
          <Box as="span" px="8px" py="2px" borderRadius="full" bg="semanticNeutral.100" color="fg.muted" fontSize="xs" fontWeight="semibold">
            {text.consult.optional}
          </Box>
        </Flex>
        <Text fontSize="base" color="fg.muted" mb={3}>
          {text.consult.hint}
        </Text>
        <ChoiceCardGroup
          ariaLabel={text.consult.title}
          value={selection.consult}
          onChange={(consult) => setSelection((s) => ({ ...s, consult }))}
          options={CATALOG.consult.map((c) => ({
            key: c.key,
            title: c.key === 'none' ? text.consult.none : c.name,
            value: c.price ? `${formatBRL(c.price)}${text.consult.perMonth}` : text.consult.softwareOnly,
            description: c.description,
          }))}
        />
      </Box>

      <Flex justify="flex-start" pt={5}>
        <Button title={text.nav.back} variant="secondary" onClick={() => setStep('plan')} />
      </Flex>
    </>
  );

  // ---- Resumo escuro ----
  const summary = (
    <SummaryPanel title={text.summary.title} icon="receipt">
      <SummaryGroup title={text.summary.plan}>
        <SummaryRow label={text.summary.size} value={`${n0(selection.size)} ${unitInfo.short}`} />
        <SummaryRow label={text.summary.band} value={open ? text.summary.bandOpen : String(band + 1)} />
        <SummaryRow label={text.summary.plan} value={selection.plan} />
        <SummaryRow label={text.summary.baseValue} value={`${formatBRL(current.base)}${open ? '+' : ''}`} />
        <SummaryRow
          label={text.summary.ai}
          value={fill(text.summary.aiValue, { n: CATALOG.gia.tiers[selection.plan].window })}
        />
        <SummaryNote>{PLAN_DESCRIPTION[selection.plan]}</SummaryNote>
      </SummaryGroup>

      <SummaryGroup title={text.summary.accesses}>
        <SummaryRow label={text.summary.contracted} value={String(selection.users)} />
        <SummaryRow label={text.summary.includedInPlan} value={seatsIncluded === Infinity ? text.overview.unlimitedShort : String(seatsIncluded)} tone="included" />
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

      <SummaryGroup title={text.gia.worstTitle}>
        <SummaryRow label={text.gia.worstWindow} value={fill(text.gia.worstWindowValue, { n: giaWindow, p: selection.users })} />
        <SummaryRow label={text.gia.typicalCost} value={formatBRL(giaTypical)} />
        <SummaryRow label={text.gia.worstCost} value={formatBRL(giaWorst)} />
        <SummaryNote>
          {fill(text.gia.worstNote, {
            u: CATALOG.gia.typicalPerDay,
            pct: Math.round((giaTypical / current.month) * 100),
            w: CATALOG.gia.worstPerDay,
            min: formatBRL(giaMin),
          })}
        </SummaryNote>
      </SummaryGroup>

      <SummaryGroup title={text.summary.consult}>
        {consultMonth ? (
          <>
            <SummaryRow label={fill(text.consult.summaryName, { name: consultOption.name })} value={`+ ${formatBRL(consultMonth)}`} tone="added" />
            <SummaryNote>
              {consultOption.description}. {text.consult.note}
            </SummaryNote>
          </>
        ) : (
          <SummaryNote>{text.consult.noneSelected}</SummaryNote>
        )}
      </SummaryGroup>

      <SummaryTotal
        label={fill(annual ? text.summary.totalAnnual : text.summary.totalMonth, { plan: selection.plan })}
        value={`${formatBRL(monthShown)}${open ? '+' : ''}`}
        hint={
          annual
            ? fill(text.summary.annualInstead, { a: formatBRL(annualTotal(current.month)), b: formatBRL(current.month * 12) })
            : fill(text.summary.perYear, { v: formatBRL(current.month * 12) })
        }
      />
      {consultMonth > 0 && (
        <SummaryRow
          label={fill(text.consult.withService, { name: consultOption.name })}
          value={`${formatBRL(monthShown + consultMonth)}${open ? '+' : ''}${text.plan.perMonth}`}
          tone="added"
        />
      )}

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
        <Box borderLeftWidth="3px" borderLeftColor="summaryAccent" bg="summaryNoteBG" color="summaryText" borderRadius="0 10px 10px 0" px="12px" py="8px" fontSize="base">
          {note || suggestion}
        </Box>
      )}

      <Flex direction="column" gap="6px">
        <Text fontSize="sm" color="summaryFaint">
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
        <DashedActionButton label={text.summary.copy} onClick={copySummary} />
      </Flex>
    </SummaryPanel>
  );

  // ---- Visão "Resumo dos planos" ----
  const ov = text.overview;
  const priceRange = (tier: PlanTier) => {
    const p = CATALOG.bandPrice[tier];
    return fill(tier === 'Enterprise' ? ov.priceRangeOpen : ov.priceRange, { a: n0(p[0]), b: n0(p[4]) });
  };
  const chipsFor = (tier: PlanTier) => {
    const acts = CATALOG.activitiesIncluded[tier];
    const seats = CATALOG.seatsIncluded[tier];
    return [
      acts === 'todas' ? ov.allActivities : fill(acts === 1 ? ov.activities : ov.activitiesPlural, { n: acts }),
      seats === Infinity ? ov.unlimited : fill(ov.accesses, { n: seats }),
      ...(CATALOG.extraSeatPrice[tier] ? [fill(ov.extraSeat, { n: CATALOG.extraSeatPrice[tier] })] : []),
    ];
  };
  const addonLinesFor = (tier: PlanTier) =>
    CATALOG.tiers
      .filter((t) => RANK[t] > RANK[tier])
      .map((t) => {
        const prices = CATALOG.modules.filter((m) => m.includedIn === t && m.price !== null).map((m) => m.price as number);
        // avulsos "do plano t": inclui os de planos intermediários que também ficam abaixo de t
        const upTo = CATALOG.modules.filter((m) => RANK[m.includedIn] <= RANK[t] && RANK[m.includedIn] > RANK[tier] && m.price !== null).map((m) => m.price as number);
        const set = upTo.length ? upTo : prices;
        return fill(ov.addonLine, { plan: t, a: Math.min(...set), b: Math.max(...set) });
      });

  const bandRows: SimpleTableRow[] = [0, 1, 2, 3, 4].map((i) => ({
    key: `band-${i}`,
    cells: {
      band: <b>{fill(text.size.band, { n: i + 1 })}</b>,
      cab: i < 4 ? n0(CATALOG.sizeUnits.cab.limits[i]) : fill(ov.above, { n: n0(CATALOG.sizeUnits.cab.limits[3]) }),
      ha: i < 4 ? n0(CATALOG.sizeUnits.ha.limits[i]) : fill(ov.above, { n: n0(CATALOG.sizeUnits.ha.limits[3]) }),
      Pro: n0(CATALOG.bandPrice.Pro[i]),
      Deluxe: n0(CATALOG.bandPrice.Deluxe[i]),
      Enterprise: `${n0(CATALOG.bandPrice.Enterprise[i])}${i === 4 ? '+' : ''}`,
    },
  }));

  const dot = <Box as="span" display="inline-block" boxSize="12px" borderRadius="full" bg="green.600" aria-label={ov.legendIncluded} />;
  const ring = <Box as="span" display="inline-block" boxSize="12px" borderRadius="full" borderWidth="2px" borderColor="addonText" aria-label={ov.legendAddon} />;
  const na = <Text as="span" color="fg.muted" aria-label={ov.legendNa}>—</Text>;
  const matrixCell = (tier: PlanTier, m: (typeof CATALOG.modules)[number]) =>
    RANK[tier] >= RANK[m.includedIn] ? dot : m.price === null ? na : ring;

  const matrixRows: SimpleTableRow[] = [
    { key: 'g-base', kind: 'group', label: ov.groupBase },
    { key: 'base-fin', cells: { module: ov.baseFinance, Pro: dot, Deluxe: dot, Enterprise: dot } },
    { key: 'base-rep', cells: { module: ov.baseReports, Pro: dot, Deluxe: dot, Enterprise: dot } },
  ];
  let lastGroup = '';
  CATALOG.modules.forEach((m) => {
    const g = m.includedIn === 'Deluxe' ? ov.groupDeluxe : m.includedIn === 'Enterprise' ? ov.groupEnterprise : text.modules.groupAny;
    if (g !== lastGroup) {
      matrixRows.push({ key: `g-${g}`, kind: 'group', label: g });
      lastGroup = g;
    }
    matrixRows.push({
      key: m.key,
      cells: {
        module: (
          <Flex wrap="wrap" gap="4px 10px" align="center">
            <span>{m.name}</span>
            {m.price !== null && (
              <Box as="span" px="7px" py="2px" borderRadius="full" bg="addonSoftBG" color="addonText" fontSize="xs" fontWeight="semibold">
                {fill(ov.addonPrice, { n: m.price })}
              </Box>
            )}
          </Flex>
        ),
        Pro: matrixCell('Pro', m),
        Deluxe: matrixCell('Deluxe', m),
        Enterprise: matrixCell('Enterprise', m),
      },
    });
  });
  matrixRows.push(
    { key: 'g-seats', kind: 'group', label: ov.groupSeats },
    {
      key: 'seats',
      cells: {
        module: ov.rowSeats,
        ...Object.fromEntries(CATALOG.tiers.map((t) => [t, CATALOG.seatsIncluded[t] === Infinity ? ov.unlimitedShort : CATALOG.seatsIncluded[t]])),
      },
    },
    {
      key: 'extra',
      cells: {
        module: ov.rowExtra,
        ...Object.fromEntries(CATALOG.tiers.map((t) => [t, CATALOG.extraSeatPrice[t] ? `+${CATALOG.extraSeatPrice[t]}` : na])),
      },
    },
    {
      key: 'acts',
      cells: {
        module: ov.rowActivities,
        ...Object.fromEntries(CATALOG.tiers.map((t) => [t, CATALOG.activitiesIncluded[t] === 'todas' ? ov.allShort : CATALOG.activitiesIncluded[t]])),
      },
    }
  );

  const planCol = (tier: PlanTier) => ({ key: tier, header: <PlanChip tier={tier} />, align: 'center' as const });

  const overview = (
    <Flex direction="column" gap={6}>
      <Box>
        <Text fontSize="xl" fontWeight="bold" color="strongText">
          {ov.title}
        </Text>
        <Text fontSize="base" color="fg.muted" mt="6px" maxW="72ch" lineHeight="1.5">
          {ov.subtitle}
        </Text>
      </Box>

      <Box borderWidth="1.5px" borderStyle="dashed" borderColor="green.600" borderRadius="xl" px={5} py={4} bg="selectedBG">
        <Box as="span" px="9px" py="3px" borderRadius="full" bg="selectedChipBG" color="selectedText" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.06em">
          {ov.entryTag}
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="selectedText" mt="8px">
          {ov.entryTitle}
        </Text>
        <Text fontSize="base" color="fg.muted" mt="4px">
          {ov.entryBody}
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }} gap={3} alignItems="stretch">
        {CATALOG.tiers.map((tier) => {
          const hl = PLAN_HIGHLIGHTS[tier];
          const lines = addonLinesFor(tier);
          return (
            <PlanTierCard
              key={tier}
              name={tier}
              tagline={tagline[tier]}
              accent={CATALOG.accent[tier]}
              priceRange={priceRange(tier)}
              priceNote={tier === 'Enterprise' ? ov.priceNoteOpen : text.plan.perMonthRange}
              chips={chipsFor(tier)}
              listLabel={hl.inherits ? fill(ov.inheritsList, { plan: hl.inherits }) : ov.baseList}
              items={hl.items}
              addonsLabel={lines.length ? ov.addonsAvailable : ov.addonsNone}
              addonLines={lines.length ? lines : [ov.addonsAll]}
              addonsAllIncluded={lines.length === 0}
            />
          );
        })}
      </Grid>

      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          {ov.priceTableTitle}
        </Text>
        <SimpleTable
          ariaLabel={ov.priceTableTitle}
          columns={[
            { key: 'band', header: ov.colBand },
            { key: 'cab', header: ov.colCab, align: 'right' },
            { key: 'ha', header: ov.colHa, align: 'right' },
            ...CATALOG.tiers.map(planCol).map((c) => ({ ...c, align: 'right' as const })),
          ]}
          rows={bandRows}
        />
        <Text fontSize="sm" color="fg.muted" mt="6px">
          {ov.priceTableNote}
        </Text>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          {text.gia.overviewTitle}
        </Text>
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }} gap="12px" alignItems="stretch">
          {CATALOG.tiers.map((tier) => {
            const g = CATALOG.gia.tiers[tier];
            const statusLabel = { available: text.gia.statusAvailable, build: text.gia.statusBuild, decide: text.gia.statusDecide } as const;
            return (
              <GiaTierCard
                key={tier}
                name={g.level}
                tag={fill(text.gia.includedIn, { plan: tier })}
                accent={CATALOG.accent[tier]}
                inheritsLabel={g.inherits ? fill(text.gia.inherits, { name: g.inherits }) : undefined}
                metrics={[
                  { label: text.gia.window, value: fill(text.gia.windowValue, { n: g.window }) },
                  { label: text.gia.economy, value: fill(text.gia.economyValue, { n: g.economy }) },
                  { label: text.gia.extraPack, value: fill(text.gia.extraPackValue, { p: formatBRL(CATALOG.gia.extraPackPrice), n: n0(CATALOG.gia.extraPackMessages) }) },
                ]}
                capabilities={g.capabilities.map((cap) => ({ title: cap.title, text: cap.text, tone: cap.status, statusLabel: statusLabel[cap.status] }))}
              />
            );
          })}
        </Grid>
        <Text fontSize="sm" color="fg.muted" mt="6px">
          {text.gia.overviewNote}
        </Text>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          {ov.matrixTitle}
        </Text>
        <Flex wrap="wrap" gap="6px 20px" fontSize="sm" color="fg.muted" mb={2}>
          <Flex align="center" gap="7px">{dot}{ov.legendIncluded}</Flex>
          <Flex align="center" gap="7px">{ring}{ov.legendAddon}</Flex>
          <Flex align="center" gap="7px">{na}{ov.legendNa}</Flex>
        </Flex>
        <SimpleTable
          ariaLabel={ov.matrixTitle}
          columns={[{ key: 'module', header: ov.colModule }, ...CATALOG.tiers.map(planCol)]}
          rows={matrixRows}
        />
      </Box>
    </Flex>
  );

  return (
    <FormContainer
      fullBleed
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      headerActions={
        <SegmentedControl<ViewKey>
          value={view}
          onChange={setView}
          ariaLabel={text.view.label}
          options={[
            { key: 'simulate', label: text.view.simulate },
            { key: 'plans', label: text.view.plans },
          ]}
        />
      }
      footer={
        view === 'simulate' ? (
          <Flex align="center" gap="10px" w="full" color="fg.muted" fontSize="base">
            <Icon name="info" size="sm" />
            <Text as="span">{text.simulationNotice}</Text>
          </Flex>
        ) : undefined
      }
    >
      <Grid templateColumns={{ base: '1fr', lg: view === 'simulate' ? 'minmax(0, 1fr) 360px' : 'minmax(0, 1fr)' }} height="100%" minH={0}>
        <Flex direction="column" minW={0} minH={0} h="full">
          {view === 'simulate' && (
            // faixa dos passos: mesma altura do título do resumo e ocupando toda a largura da área branca
            <Flex align="center" justify="center" h={CONFIGURATOR_HEADER_HEIGHT} px={{ base: 4, md: 7 }} flexShrink={0} bg="cardBG" borderBottomWidth="1px" borderColor="border.muted">
              <StepIndicator<StepKey>
                ariaLabel={text.steps.label}
                value={step}
                onChange={setStep}
                steps={[
                  { key: 'plan', label: text.steps.plan },
                  { key: 'modules', label: text.steps.modules },
                ]}
              />
            </Flex>
          )}
          <Box flex="1" minH={0} px={{ base: 4, md: 7 }} py={5} overflowY="auto">
            {view === 'plans' ? overview : step === 'plan' ? planStep : modulesStep}
          </Box>
        </Flex>
        {view === 'simulate' && (
          <Box overflowY="auto" minH={0}>
            {summary}
          </Box>
        )}
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

/** Selo com o nome do plano na cor do catálogo. */
function PlanChip({ tier }: { tier: PlanTier }) {
  return (
    <Box as="span" px="9px" py="4px" borderRadius="full" fontSize="xs" fontWeight="semibold" color="onPlan" style={{ background: CATALOG.accent[tier] }}>
      {tier}
    </Box>
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
  icon: IconName;
  title: string;
  hint: string;
  wide?: boolean;
  children: ReactNode;
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
