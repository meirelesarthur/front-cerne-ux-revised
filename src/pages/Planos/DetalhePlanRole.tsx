// src/pages/Planos/DetalhePlanRole.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de um PLANO (PlanRole) — TASK-FE-2703.
// NOVA (não existe hoje nenhum modo leitura de `PlanRole`). Mesmo padrão já
// validado em `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx`/
// `Safra/SafraDetalhe.tsx`: rota PRÓPRIA (não um modo `readOnly` de
// `CreateOrUpdatePlanRole.tsx`), `FormContainer` com `headerActions` (badge
// Gratuito/Pago + botão Editar) e sub-componentes locais `InfoField`/
// `DetailPanel` (label + valor / painel agrupado) para os blocos de leitura.
//
// Dados: `usePlanRoleForm` (`usePlanRole.tsx`, JÁ EXISTE — hook INALTERADO,
// só consumido em modo leitura) — `GET /plan-roles/{uuid}` via `getPlanRole`.
// `fillForm` é um no-op proposital: esta tela não tem `useForm`/RHF nenhum,
// só lê `planRoleQuery.data` diretamente.
//
// GAP-FE-233 RESOLVIDO — `PlanRoleResource` eager-loada `role`/`role_uuids`;
// esta tela mostra `role.name`/a contagem de `role_uuids` como TEXTO de
// leitura (sem mudança de comportamento, só o nome do campo no Resource).
//
// ⚠️ GAP-FE-234 — link de cadastro sem destino público definido no stack
// novo. Default: `SIGNUP_BASE_URL` (env var, `src/config/env.ts`) + parâmetro
// `plano_id={uuid}` (nome mantido por familiaridade com o legado, valor
// corrigido para uuid — Lei GB 10). Botão "Copiar link de cadastro" fica
// visualmente completo mesmo com a env var vazia (mostra link relativo).
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiCopy, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { SIGNUP_BASE_URL } from '@/config/env';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import type { PlanRoleDetail } from '@/@types/v2/Planos';

import { usePlanRoleForm } from './usePlanRole';

const PLANOS_LIST_ROUTE = '/planos';

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheCentroCusto.tsx`/`SafraDetalhe.tsx` (tokens Chakra, sem componente
// novo de UI).
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

// Painel agrupado com borda/rótulo — mesma linguagem visual de
// `DetalheCentroCusto.tsx` (reaproveitada aqui em modo leitura, sem
// componente novo).
function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

// Tela de leitura — sem `useForm`/RHF. `usePlanRoleForm` exige `fillForm` no
// seu contrato (hook compartilhado com o formulário, INALTERADO aqui); o
// dado real é lido direto de `planRoleQuery.data` abaixo.
function noop() {}

export default function DetalhePlanRole() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.planos.planRole;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo, mesmo racional de `DetalheCentroCusto.tsx`.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(PLANOS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const planRoleQuery = usePlanRoleForm({ registrationId: uuid, fillForm: noop });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([planRoleQuery as any]);
  const planRole = planRoleQuery.data as PlanRoleDetail | undefined;
  const notFound = !isLoading && (planRoleQuery as any).isError;

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(PLANOS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // GAP-FE-234 — URL montada a partir da env var (vazia = link relativo,
  // nunca quebra a tela) + `plano_id={uuid}` (Lei GB 10 — uuid, nunca id).
  const signupLink = `${SIGNUP_BASE_URL}?plano_id=${planRole?.uuid ?? ''}`;

  async function handleCopySignupLink() {
    try {
      await navigator.clipboard.writeText(signupLink);
      toaster.success({
        title: text.singularLabel,
        description: text.form.copyLinkSuccessToast,
        duration: 5000,
      });
    } catch {
      // Ambiente sem `navigator.clipboard` (HTTP não-seguro/permissão
      // negada) — sem crash, sem toast de sucesso enganoso. Mesma
      // degradação honesta pedida pela regra "SEM MOCK".
    }
  }

  const mainRoleLabel = planRole?.role?.name || text.detail.assignments.empty;
  const additionalRolesCount = planRole?.role_uuids?.length ?? 0;
  const segmentUuids = planRole?.segment_uuids ?? [];

  return (
    <FormContainer
      title={planRole?.name ?? text.singularLabel}
      headerActions={
        planRole && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={planRole.is_free ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {planRole.is_free ? text.list.table.freeLabel : text.list.table.paidLabel}
            </Badge>
            {can('plan_edit') && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${PLANOS_LIST_ROUTE}/${uuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <DetailPanel title={text.detail.generalData.title}>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={6}>
                <InfoField label={text.form.fields.name} value={planRole?.name ?? '—'} />
                <InfoField
                  label={text.form.fields.price}
                  value={planRole ? `R$ ${planRole.price.toFixed(2)}` : '—'}
                />
                <InfoField
                  label={text.form.fields.intervalDays}
                  value={planRole ? String(planRole.interval_days) : '—'}
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.limits.title}>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={6}>
                <InfoField
                  label={text.form.fields.animalsLimit}
                  value={planRole ? String(planRole.animals_limit) : '—'}
                />
                <InfoField
                  label={text.form.fields.agricultureAreaLimit}
                  value={planRole ? planRole.agriculture_area_limit.toFixed(2) : '—'}
                />
                <InfoField
                  label={text.form.fields.fruitgrowingAreaLimit}
                  value={planRole ? planRole.fruitgrowing_area_limit.toFixed(2) : '—'}
                />
                <InfoField
                  label={text.form.fields.farmLimit}
                  value={planRole?.farm_limit != null ? String(planRole.farm_limit) : '—'}
                />
                <InfoField
                  label={text.form.fields.concurrentUserLimit}
                  value={
                    planRole?.concurrent_user_limit != null
                      ? String(planRole.concurrent_user_limit)
                      : '—'
                  }
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.assignments.title}>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={6}>
                <InfoField label={text.form.fields.mainRole} value={mainRoleLabel} />
                <InfoField
                  label={text.form.fields.additionalRoles}
                  value={
                    additionalRolesCount > 0
                      ? String(additionalRolesCount)
                      : text.detail.assignments.empty
                  }
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.segments.title}>
              {segmentUuids.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.segments.empty}
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {segmentUuids.map((segmentUuid) => (
                    <Badge key={segmentUuid} colorPalette="gray" variant="subtle">
                      {segmentUuid}
                    </Badge>
                  ))}
                </Flex>
              )}
            </DetailPanel>

            <DetailPanel title={text.detail.signup.title}>
              <Text fontSize="sm" color="fg.muted" mb={3}>
                {text.detail.signup.description}
              </Text>
              <Flex gap={2} align="flex-end" wrap="wrap">
                <Box flex="1" minW="240px">
                  <Input
                    label={text.form.fields.signupLink}
                    value={signupLink}
                    readOnly
                    onChange={() => {}}
                  />
                </Box>
                <Button
                  title={text.form.copyLinkButton}
                  icon={FiCopy as ElementType}
                  variant="outline"
                  onClick={handleCopySignupLink}
                  aria-label={text.form.copyLinkButton}
                />
              </Flex>
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
