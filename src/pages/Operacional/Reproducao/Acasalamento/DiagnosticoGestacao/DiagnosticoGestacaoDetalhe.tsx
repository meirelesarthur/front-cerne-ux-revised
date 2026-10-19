// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/DiagnosticoGestacaoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de visualização (somente leitura) de Diagnóstico de Gestação —
// `pd-screen-show`/`pd-list-show-animals` (PregnancyDiagnosis, F-016,
// 97-Esteiras/001, TASK-BM-FE-07, contrato de tela §6.6). Rota ANINHADA
// `.../acasalamento/:breedingMatingUuid/diagnostico-gestacao/:pregnancyDiagnosisUuid`, gate
// `pregnancy-diagnosis_view` (wiring da rota é da TASK-BM-FE-09 — este
// arquivo só declara os 2 params esperados).
//
// Casca `FormContainer` com `headerActions` (`Voltar`) — mirror
// `AcasalamentoDetalhe.tsx` (TASK-BM-FE-06). Bloco `Código`/`Data`/
// `Responsável` (regra 10 da Tarefa), seguido de "Animais" com UM
// `DisplayFieldGroup` POR diagnóstico de animal: `Animal`·`Inseminador`·
// `Técnica DG`·`DG`·`Lote`·`Touro`, 1:1 com o persistido — nunca uma tabela
// agregada aqui (a leitura granular por diagnóstico é o pedido explícito da
// Tarefa).
//
// Não existe modo editar (regra 11) — esta tela nunca abre um formulário de
// edição, mesmo em erro/vazio.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Heading, Icon, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { useDiagnosticoGestacaoDetalhe } from './useDiagnosticosGestacao';

export default function DiagnosticoGestacaoDetalhe() {
  const { breedingMatingUuid, pregnancyDiagnosisUuid: pdUuid } = useParams<{
    breedingMatingUuid: string;
    pregnancyDiagnosisUuid: string;
  }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.breedingMatings.pregnancyDiagnosis;
  const detailText = text.detail;

  const PD_LIST_ROUTE = `/operacional/acasalamento/${breedingMatingUuid}/diagnostico-gestacao`;

  // Guarda de uuid ANTES de renderizar (mirror `AcasalamentoDetalhe.tsx`) —
  // os DOIS uuids da rota precisam ser válidos.
  const hasValidParams = isValidGuid(breedingMatingUuid ?? null) && isValidGuid(pdUuid ?? null);

  useEffect(() => {
    if (!hasValidParams) {
      navigate(PD_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams, navigate, PD_LIST_ROUTE]);

  const detailQuery = useDiagnosticoGestacaoDetalhe(
    hasValidParams ? breedingMatingUuid : undefined,
    hasValidParams ? pdUuid : undefined
  );

  // "carregando": `isPending && isFetching` (V5) — carga inicial (contrato de
  // tela §6.7).
  const isLoading = detailQuery.isPending && detailQuery.isFetching;
  const item = detailQuery.data;

  const isNotFound =
    detailQuery.isError &&
    isAxiosError(detailQuery.error) &&
    detailQuery.error.response?.status === 404;
  const isGenericError = detailQuery.isError && !isNotFound;

  if (!hasValidParams) {
    return null;
  }

  if (isNotFound) {
    return (
      <FormContainer title={detailText.title}>
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
                title={detailText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(PD_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  if (isGenericError) {
    return (
      <FormContainer title={detailText.title}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.error.message}</EmptyState.Title>
              </VStack>
              <Flex gap={3}>
                <Button
                  title={detailText.error.retry}
                  icon={FiRefreshCw as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => detailQuery.refetch()}
                />
                <Button
                  title={detailText.backButton}
                  icon={FiArrowLeft as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(PD_LIST_ROUTE)}
                />
              </Flex>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? detailText.title}
      headerActions={
        <Button
          title={detailText.backButton}
          icon={FiArrowLeft as ElementType}
          variant="outline"
          size="sm"
          onClick={() => navigate(PD_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <DisplayFieldGroup
          loading={isLoading}
          displayFields={[
            { label: detailText.fields.code, value: item?.code ?? '' },
            { label: detailText.fields.date, value: item?.date ? formatDate(item.date) : '' },
            { label: detailText.fields.responsible, value: item?.responsible_name ?? '' },
          ]}
        />

        {/* "Animais" — UM `DisplayFieldGroup` por diagnóstico, 1:1 com o
            persistido (regra 10 da Tarefa). Nenhuma tabela agregada aqui. */}
        <Box mt={6}>
          <Heading as="h3" size="sm" fontWeight="semibold" color="fg.default" mb={3}>
            {text.form.batchFillSection.animals}
          </Heading>

          <VStack align="stretch" gap={4}>
            {(item?.animals ?? []).map((animalLine, index) => (
              <Box key={`${animalLine.animal.uuid}-${index}`}>
                <DisplayFieldGroup
                  loading={isLoading}
                  displayFields={[
                    { label: detailText.animalsTable.animal, value: animalLine.animal.code },
                    {
                      label: detailText.animalsTable.inseminator,
                      value: animalLine.inseminator.label,
                    },
                    { label: detailText.animalsTable.technique, value: animalLine.technique.label },
                    { label: detailText.animalsTable.diagnosis, value: animalLine.diagnosis.label },
                    { label: detailText.animalsTable.batch, value: animalLine.batch?.label ?? '—' },
                    { label: detailText.animalsTable.bull, value: animalLine.bull?.label ?? '—' },
                  ]}
                />
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>
    </FormContainer>
  );
}
