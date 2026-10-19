// src/pages/Operacional/DeathAnimals/DetalheDeathAnimal.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma MORTE (DeathAnimal) — Operacional/
// Pecuária. Rota própria: `/operacional/mortes/:deathAnimalUuid/detalhe`,
// guardada por `death_animals_view` (TASK-DA-FE-01). A ação "Visualizar" do
// menu "..." da listagem (index.tsx) já aponta para cá.
//
// Mirror `FeedlotYards/DetalheFeedlotYard.tsx` (sibling estrutural PRIMÁRIO):
// `FormContainer` com `headerActions` (botão Editar) e sub-componente local
// `InfoField` (label + valor). Exibe TODOS os campos do Resource, incluindo
// foto (se houver) e "Funcionário Responsável" (`user.name`).
//
// Dados: `useDeathAnimalForm` (`useDeathAnimals.tsx`, JÁ EXISTE — hook
// INALTERADO, só consumido em modo leitura) — `GET /death-animals/{uuid}`
// via `getDeathAnimal`. `fillForm` é um no-op proposital: esta tela não tem
// `useForm`/RHF nenhum, só lê `deathAnimalQuery.data` diretamente.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Image,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
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

import type { DeathAnimalDetail } from '@/@types/v2/DeathAnimals';

import { useDeathAnimalForm } from './useDeathAnimals';

const DEATH_ANIMALS_LIST_ROUTE = '/operacional/mortes';

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheFeedlotYard.tsx`.
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

// `useDeathAnimalForm` exige `fillForm` no seu contrato (hook compartilhado
// com o formulário, INALTERADO aqui); o dado real é lido direto de
// `deathAnimalQuery.data` abaixo — mesmo racional de `DetalheFeedlotYard.tsx`.
function noop() {}

export default function DetalheDeathAnimal() {
  const { deathAnimalUuid } = useParams<{ deathAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.deathAnimals.deathAnimal;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheFeedlotYard.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(deathAnimalUuid)) {
      navigate(DEATH_ANIMALS_LIST_ROUTE, { replace: true });
    }
  }, [deathAnimalUuid, navigate]);

  const deathAnimalQuery = useDeathAnimalForm({ registrationId: deathAnimalUuid, fillForm: noop });

  if (!isValidGuid(deathAnimalUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([deathAnimalQuery as any]);
  const deathAnimal = deathAnimalQuery.data as DeathAnimalDetail | undefined;
  const notFound = !isLoading && (deathAnimalQuery as any).isError;

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
                onClick={() => navigate(DEATH_ANIMALS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={deathAnimal?.code ?? text.singularLabel}
      headerActions={
        deathAnimal &&
        can('death_animals_edit') && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.detail.actions.edit}
              icon={FiEdit as ElementType}
              onClick={() => navigate(`${DEATH_ANIMALS_LIST_ROUTE}/${deathAnimalUuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            {deathAnimal?.photo_url && (
              <Image
                src={deathAnimal.photo_url}
                alt={text.detail.fields.code}
                boxSize="24"
                borderRadius="md"
                objectFit="cover"
                border="1px solid"
                borderColor="border.subtle"
              />
            )}

            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
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
                {text.detail.generalData.title}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={deathAnimal?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.date}
                  value={deathAnimal ? formatDate(deathAnimal.date) : '—'}
                />
                <InfoField
                  label={text.detail.fields.userName}
                  value={deathAnimal?.user?.name ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.batch}
                  value={deathAnimal?.batch?.description ?? text.detail.fields.batchEmpty}
                />
                <InfoField
                  label={text.detail.fields.animal}
                  value={deathAnimal?.animal?.identification ?? text.detail.fields.animalEmpty}
                />
                <InfoField
                  label={text.detail.fields.cause}
                  value={deathAnimal?.cause.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.note}
                  value={deathAnimal?.note || text.detail.fields.noteEmpty}
                />
              </SimpleGrid>
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
