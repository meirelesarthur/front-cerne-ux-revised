// src/pages/CadastrosBase/SaldoInicial/SaldoInicialDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um SALDO INICIAL (OpenMovement) —
// Cadastros Base / Financeiros, execução 031, TASK-FE-031-38. Rota:
// /cadastros-base/saldo-inicial/:openMovementUuid/detalhe (guardada por
// `open-movements_view`, wiring real da rota é este mesmo arquivo de
// Tarefa — ver `src/router/index.tsx`). SEM Edição (contrato §2).
//
// Mirror nomenclatura/estrutural de `EstoqueInicial/EstoqueInicialDetalhe.tsx`
// (`FormContainer` + Chakra). "Tipo Movimento"/"Tp. Categoria" são
// DISPLAY-ONLY (o `OpenMovementResource` não expõe `type`/`type_category` —
// fixados pela Action, contrato de API §6/§9/§11) — mesmos valores fixos do
// formulário de criação (`text.form.fixedValues`).
//
// Bloco Rateio SEMPRE renderizado (tabela Categoria/Centro de Custo/Valor) —
// o print de referência foi cortado antes de rolar até esse bloco (achado do
// Documentor); o `show.blade.php` real sempre exibe porque o rateio é
// obrigatório na criação (contrato §8). NÃO replicar o corte do print como
// ausência de UI.
//
// Esteira 061 (correção de reprovação de DESIGN, F-183 ponto 2): o antigo
// `InfoField` local (label + valor solto, sem caixa) foi substituído por
// `DetailGrid`/`ViewField` (`src/components/Form/`) na seção Identificação —
// HISTÓRICO, revertido abaixo.
//
// Correção de nova reprovação AD (revisor Arthur, F-183): "a visualização
// não segue o estilo correto do input de visualização". Padrão CANÔNICO
// obrigatório (DEC-286): mirror ESTRUTURAL de
// `src/pages/CadastrosBase/Produtos/Catalogo/ProdutoDetalhe.tsx` —
// `InputReadOnly` (`@/components/Form/InputReadOnly`) em grade
// `columnsForm.default`, PROIBIDO `ViewField`/`DetailGrid` (caixas
// `bg.muted`). Bloco Rateio (`Table`) segue inalterado; title fallback
// (`item?.code ? ... : text.singularLabel`) preservado — já sem null (uso de
// `item?.code`, encadeamento opcional).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getOpenMovement } from '@/services/v2/OpenMovements/open-movement-service';

const SALDO_INICIAL_LIST_ROUTE = '/cadastros-base/saldo-inicial';

function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SaldoInicialDetalhe() {
  const { openMovementUuid } = useParams<{ openMovementUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.openMovements.openMovement;
  const noData = text.detail.noData;

  // Guard de navegação — uuid mal formado não deve chegar à query.
  useEffect(() => {
    if (!isValidGuid(openMovementUuid)) {
      navigate(SALDO_INICIAL_LIST_ROUTE, { replace: true });
    }
  }, [openMovementUuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.openMovements.detail, openMovementUuid],
    queryFn: async () => {
      const response = await getOpenMovement(openMovementUuid as string);
      return response.data;
    },
    enabled: isValidGuid(openMovementUuid),
    retry: false,
  });

  if (!isValidGuid(openMovementUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  // Estado: 404 (registro não encontrado / excluído)
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
                onClick={() => navigate(SALDO_INICIAL_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={item?.code ? `${item.code} — ${text.singularLabel}` : text.singularLabel}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item?.account
              ? `${item.account.bank} — ${item.account.agency}/${item.account.account}`
              : text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Identificação ---- */}
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
              {text.detail.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                label={text.detail.fields.account}
                value={
                  item?.account
                    ? `${item.account.bank} — ${item.account.agency}/${item.account.account}`
                    : noData
                }
                loading={isLoading}
              />
              {/* Display-only — `OpenMovementResource` não expõe `type`/
                  `type_category` (fixados pela Action, contrato de API
                  §6/§9/§11); mesmos valores fixos do formulário de criação. */}
              <InputReadOnly
                label={text.detail.fields.type}
                value={text.form.fixedValues.type}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.typeCategory}
                value={text.form.fixedValues.typeCategory}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.date}
                value={item ? formatDate(item.date) : noData}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.document}
                value={item?.document || noData}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.value}
                value={item !== undefined ? formatCurrencyBRL(item.value) : noData}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.interest}
                value={item !== undefined ? formatCurrencyBRL(item.interest) : noData}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.note}
                value={item?.note || noData}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.proprietary}
                value={item?.proprietary?.name || noData}
                loading={isLoading}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Rateio (SEMPRE renderizada, contrato §8) ---- */}
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
              {text.detail.sections.apportionments}
            </Text>
            <Skeleton loading={isLoading}>
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>{text.detail.table.category}</Table.ColumnHeader>
                    <Table.ColumnHeader>{text.detail.table.costCenter}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">
                      {text.detail.table.value}
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {(item?.items ?? []).map((row, index) => (
                    <Table.Row
                      key={`${row.financial_category.uuid}-${row.cost_center?.uuid ?? 'sem-centro-custo'}-${index}`}
                    >
                      <Table.Cell>
                        {row.financial_category.code} — {row.financial_category.description}
                      </Table.Cell>
                      <Table.Cell>
                        {row.cost_center
                          ? `${row.cost_center.code} — ${row.cost_center.description}`
                          : noData}
                      </Table.Cell>
                      <Table.Cell textAlign="end">{formatCurrencyBRL(row.value)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Skeleton>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
