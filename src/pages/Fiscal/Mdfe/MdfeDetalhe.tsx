// src/pages/Fiscal/Mdfe/MdfeDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de MDFe — TASK-MDFE-FE-09
// (`CONTRATO-FRONT-MDFE.md §8`). Mirror ESTRUTURAL de `NfeEmitidas/
// NfeDetalhe.tsx` — bloco read-only, SEM `useForm`, via `useQuery` DIRETO
// (`getMdfe`), mirror `FD071..FD085`. Substitui a rota `/visualizar`
// (`TASK-MDFE-FE-01`/`CreateOrUpdateMdfe.tsx`, que até aqui reusava o
// próprio formulário com campos desabilitados como stand-in — Onda 1) por
// uma tela de leitura DEDICADA.
//
// FD081 (`data_prevista_entrega`) — GAP DE CONTRATO já documentado no
// contrato bruto ("Não consta do fillable Mdfe"): o `MdfeData` real
// (`app/Http/Resources/V1/MdfeResource.php`) não expõe este campo — omitido
// aqui (SEM MOCK, nunca inventar um campo que a API não devolve). FD071
// ("data de venda") é satisfeita por `created_at` (mesmo `default` descrito
// no contrato bruto: "item.created_at Y-m-d").
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

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
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import {
  isMdfeEditable,
  mdfeEstadoColor,
  mdfeEstadoOptions,
} from '@/constants/Fiscal/mdfe-estado-options';
import { queryKey } from '@/constants/query-key';

import { getMdfe } from '@/services/v2/Fiscal/mdfe-service';

import type { MdfeData, MdfeEquipmentRef } from '@/@types/v2/Fiscal/Mdfe';

import { MdfeEmissionPanel } from './MdfeEmissionPanel';

const MDFE_LIST_ROUTE = '/fiscal/mdfe-lista';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function equipmentLabel(equipment: MdfeEquipmentRef | null, noData: string): string {
  if (!equipment) return noData;
  return `${equipment.code} — ${equipment.description}`;
}

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

export default function MdfeDetalhe() {
  const { mdfeUuid } = useParams<{ mdfeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.mdfes.mdfe;
  const detailText = text.detail;
  const noData = '—';

  if (!isValidGuid(mdfeUuid)) {
    navigate(MDFE_LIST_ROUTE, { replace: true });
    return null;
  }

  const detailQuery = useQuery<MdfeData>({
    queryKey: [queryKey.mdfes.mdfe, mdfeUuid],
    queryFn: async () => {
      // `isValidGuid` (acima) já garante `mdfeUuid` presente e bem formado
      // antes deste ponto — a asserção só documenta o narrowing para o TS
      // (`isValidGuid` não é um type predicate, mirror `NfeDetalhe.tsx`).
      const response = await getMdfe(mdfeUuid as string);
      return response.data;
    },
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;
  const canEdit = can('mdfe_edit') && !!item && isMdfeEditable(item.estado);

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
                <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={detailText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(MDFE_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? `${text.singularLabel} #${item.mdfe_numero}` : text.singularLabel}
      headerActions={
        item &&
        canEdit && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={detailText.actions.edit}
              icon={FiEdit as ElementType}
              size="sm"
              onClick={() => navigate(`${MDFE_LIST_ROUTE}/${mdfeUuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Badge colorPalette={item ? mdfeEstadoColor[item.estado] : 'gray'} variant="subtle">
            {mdfeEstadoOptions.getLabel(item?.estado, languageGB)}
          </Badge>
        </Skeleton>

        {/* Painel de Emissão SEFAZ (TASK-MDFE-FE-09, Emitir ligado na
            execução 045) — número/chave/protocolo/data de envio + ações
            Emitir/Cancelar/Baixar XML (ver docblock de
            `MdfeEmissionPanel.tsx`). */}
        {item && !isLoading && <MdfeEmissionPanel mdfeDetail={item} />}

        <Flex direction="column" gap={6} mt={6}>
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
              {detailText.sections.header}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={detailText.fields.dataEmissao}
                value={item ? formatDate(item.created_at, 'dd/MM/yyyy') : noData}
              />
              <InfoField
                label={text.form.fields.valorCarga}
                value={item ? formatCurrencyBRL(item.valor_carga) : noData}
              />
              <InfoField
                label={text.form.fields.quantidadeCarga}
                value={item ? formatQuantity(item.quantidade_carga) : noData}
              />
              <InfoField label={text.form.fields.ufInicio} value={item?.uf_inicio ?? noData} />
              <InfoField label={text.form.fields.ufFim} value={item?.uf_fim ?? noData} />
              <InfoField
                label={text.form.fields.produtoPredNome}
                value={item?.produto_pred_nome ?? noData}
              />
              <InfoField
                label={text.form.fields.veiculoTracao}
                value={equipmentLabel(item?.veiculo_tracao ?? null, noData)}
              />
              {item?.veiculo_reboque && (
                <InfoField
                  label={text.form.fields.veiculoReboque}
                  value={equipmentLabel(item.veiculo_reboque, noData)}
                />
              )}
              {item?.veiculo_reboque2 && (
                <InfoField
                  label={text.form.fields.veiculoReboque2}
                  value={equipmentLabel(item.veiculo_reboque2, noData)}
                />
              )}
              {item?.veiculo_reboque3 && (
                <InfoField
                  label={text.form.fields.veiculoReboque3}
                  value={equipmentLabel(item.veiculo_reboque3, noData)}
                />
              )}
              <InfoField
                label={text.form.fields.condutorNome}
                value={item?.condutor_nome ?? noData}
              />
              <InfoField
                label={text.form.fields.condutorCpf}
                value={item?.condutor_cpf ?? noData}
              />
              <InfoField
                label={text.form.fields.infoComplementar}
                value={item?.info_complementar ?? noData}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
