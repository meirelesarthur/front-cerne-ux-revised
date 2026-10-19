// src/pages/CadastrosBase/CentroCusto/DetalheCentroCusto.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um CENTRO DE CUSTO — Cadastros Base.
// Rota própria (TASK-FE-CC-09a): /cadastros-base/centros-custo/:costCenterId
// /detalhe, guardada por `costcenters_view` (mesma guarda da listagem/form —
// DEC-005 não criou uma permissão de leitura própria para este módulo). A
// ação "Visualizar" do menu "..." da listagem (TASK-FE-CC-09b, index.tsx) já
// aponta para cá.
//
// Fielmente ao padrão já validado em `Safra/SafraDetalhe.tsx`: rota PRÓPRIA
// (não um modo `readOnly` de `CreateOrUpdateCentroCusto.tsx`), `FormContainer`
// com `headerActions` (badges + botão Editar).
//
// Esteira 061 (correção de reprovação de DESIGN, F-156/F-183): o antigo
// `InfoField` local (label + valor solto, sem caixa) foi substituído por
// `DetailGrid`/`ViewField` (`src/components/Form/`) — HISTÓRICO, revertido
// abaixo.
//
// Correção de nova reprovação AD (revisor Arthur, F-156): "A visualização
// não usa corretamente a variação do componente de input." Padrão CANÔNICO
// obrigatório (DEC-286): mirror ESTRUTURAL de
// `src/pages/CadastrosBase/Produtos/Catalogo/ProdutoDetalhe.tsx` —
// `InputReadOnly` (`@/components/Form/InputReadOnly`) em grade
// `columnsForm`, PROIBIDO `ViewField`/`DetailGrid` (caixas `bg.muted`).
// `DetailPanel` local permanece como agrupador de SEÇÃO (título +
// divisor), mas sem a caixa `bg.muted`/borda — mesmo padrão de
// Bloco 1/Bloco 2 de `ProdutoDetalhe.tsx` — para não haver NENHUMA caixa
// `bg.muted` remanescente na tela. Categorias (badges) e Rateio (%/soma)
// preservados sem alteração de conteúdo/formato, só o container de seção
// mudou de visual.
//
// Dados: `useCostCenterForm` (useCostCenters.tsx, JÁ EXISTE — hook
// INALTERADO, só consumido em modo leitura) — `GET /cost-centers/{uuid}` via
// `getCostCenter`. `fillForm` é um no-op proposital: esta tela não tem
// `useForm`/RHF nenhum, só lê `costCenterQuery.data` diretamente (mesmo
// contrato de hook, uso divergente do formulário — o hook não foi tocado).
//
// Autorização do botão "Editar": DEC-005/GAP-BE-032 — por ITEM
// (`costCenter.can_edit`), a MESMA flag que `CreateOrUpdateCentroCusto.tsx`
// usa para resolver `canSave` em modo edição — nunca a permissão global
// `costcenters_edit` (que nem distingue mais topo de descendente).
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
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { CostCenterDetail } from '@/@types/v2/CostCenters';

import { useCostCenterForm } from './useCostCenters';

const CENTROS_CUSTO_LIST_ROUTE = '/cadastros-base/centros-custo';

// Agrupador de SEÇÃO — mirror EXATO do padrão "Bloco" de
// `ProdutoDetalhe.tsx`/`DetalheEntradaInsumos.tsx` (Box simples + título com
// divisor inferior, SEM caixa `bg.muted`/borda). Correção da reprovação AD
// (revisor Arthur): a caixa `bg.muted` anterior fazia parte da variação de
// componente reprovada; o agrupamento por seção continua existindo, só o
// visual do container mudou.
function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.default"
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

// Tela de leitura — sem `useForm`/RHF. `useCostCenterForm` exige `fillForm`
// no seu contrato (hook compartilhado com o formulário, INALTERADO aqui); o
// dado real é lido direto de `costCenterQuery.data` abaixo. Uma função com
// MENOS parâmetros que o tipo declarado (`(data, resetForce?) => void`) é
// estruturalmente válida em TS — dispensa nomear (e depois silenciar como
// "não usado") os 2 parâmetros que este callback nunca lê.
function noop() {}

export default function DetalheCentroCusto() {
  const { costCenterId } = useParams<{ costCenterId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.costCenters.costCenter;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `SafraDetalhe.tsx`/
  // `CreateOrUpdateCentroCusto.tsx`): redireciona para a listagem antes de
  // montar qualquer coisa. `enabled: isValidGuid(...)` dentro do próprio hook
  // já evita a chamada de rede — este efeito só cobre a navegação.
  useEffect(() => {
    if (!isValidGuid(costCenterId)) {
      navigate(CENTROS_CUSTO_LIST_ROUTE, { replace: true });
    }
  }, [costCenterId, navigate]);

  const costCenterQuery = useCostCenterForm({ registrationId: costCenterId, fillForm: noop });

  if (!isValidGuid(costCenterId)) {
    return null;
  }

  const isLoading = checkLoadingStatus([costCenterQuery as any]);
  const costCenter = costCenterQuery.data as CostCenterDetail | undefined;
  const notFound = !isLoading && (costCenterQuery as any).isError;

  const yesLabel = languageGB.defaltStrings.yes;
  const noLabel = languageGB.defaltStrings.no;

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
                onClick={() => navigate(CENTROS_CUSTO_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const parentLabel = costCenter?.parent
    ? `${costCenter.parent.code} — ${costCenter.parent.description}`
    : '—';

  const categories = costCenter?.categories ?? [];
  const apportionments = costCenter?.apportionments ?? [];
  const isApportioned = costCenter?.type === 'apportioned';
  const apportionmentsTotal = apportionments.reduce((sum, item) => sum + (item.percentage || 0), 0);

  return (
    <FormContainer
      title={costCenter?.description ?? text.singularLabel}
      headerActions={
        costCenter && (
          <Flex align="center" gap={3} flexShrink={0}>
            {costCenter.class === 1 ? (
              <Badge bg="classSyntheticBG" color="classSyntheticText" variant="subtle">
                {costCenter.class_label}
              </Badge>
            ) : (
              <Badge colorPalette="green" variant="subtle">
                {costCenter.class_label}
              </Badge>
            )}
            <Badge
              colorPalette={costCenter.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {costCenter.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
            </Badge>
            {costCenter.can_edit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${CENTROS_CUSTO_LIST_ROUTE}/${costCenterId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            {/* Subtítulo — mesmo contorno de `SafraDetalhe.tsx` (`FormContainer.
                subtitle` aceito mas não renderizado no JSX atual do
                componente): código + condição como conteúdo normal do corpo,
                não via a prop `subtitle`. */}
            <Text fontSize="sm" color="fg.muted">
              {costCenter?.code ?? '—'} · {costCenter?.condition_label ?? '—'} ·{' '}
              {costCenter?.type_label ?? '—'}
            </Text>

            <DetailPanel title={text.detail.generalData.title}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InputReadOnly
                  label={text.form.fields.code}
                  value={costCenter?.code ?? '—'}
                  loading={isLoading}
                />
                <InputReadOnly
                  label={text.form.fields.class}
                  value={costCenter?.class_label ?? '—'}
                  loading={isLoading}
                />
                <InputReadOnly
                  label={text.form.fields.condition}
                  value={costCenter?.condition_label ?? '—'}
                  loading={isLoading}
                />
                <InputReadOnly
                  label={text.form.fields.type}
                  value={costCenter?.type_label ?? '—'}
                  loading={isLoading}
                />
                <InputReadOnly
                  label={text.form.fields.parentUuid}
                  value={parentLabel}
                  loading={isLoading}
                />
                <InputReadOnly
                  label={text.form.fields.allowPointing}
                  value={costCenter?.allow_pointing ? yesLabel : noLabel}
                  loading={isLoading}
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.categories.title}>
              {categories.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.categories.empty}
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {categories.map((category) => (
                    <Badge key={category.uuid} colorPalette="gray" variant="subtle">
                      {category.code} — {category.description}
                    </Badge>
                  ))}
                </Flex>
              )}
            </DetailPanel>

            {isApportioned && (
              <DetailPanel title={text.detail.apportionments.title}>
                {apportionments.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted">
                    {text.form.apportionments.emptyTitle}
                  </Text>
                ) : (
                  <Flex direction="column" gap={3}>
                    {apportionments.map((item) => (
                      <Flex key={item.uuid} justify="space-between" align="center" gap={3}>
                        <Text fontSize="sm">
                          {item.code} — {item.description}
                        </Text>
                        <Badge colorPalette="gray" variant="subtle">
                          {item.percentage.toFixed(2)}%
                        </Badge>
                      </Flex>
                    ))}
                    <Flex justify="flex-end" align="center" gap={2} pt={2}>
                      <Text fontSize="sm" color="fg.muted">
                        {text.form.apportionments.sumLabel}:
                      </Text>
                      <Badge
                        colorPalette={
                          Math.abs(apportionmentsTotal - 100) < 0.001 ? 'green' : 'orange'
                        }
                        variant="subtle"
                      >
                        {apportionmentsTotal.toFixed(2)}%
                      </Badge>
                    </Flex>
                  </Flex>
                )}
              </DetailPanel>
            )}
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
