// src/pages/CadastrosBase/Clientes/ClienteDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura, cards) de um CLIENTE (Client —
// Cadastros Base). TELA NOVA — lote 01/EST-085, passada 2. Rota própria
// `/cadastros-base/clientes/:uuid/detalhe` (registrada em `router/index.tsx`),
// guardada por `clients_view`. A ação "Visualizar" do menu de ações da
// listagem (`index.tsx`) já aponta para cá.
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (herdado de TASK-CL-FE-01/02/03) —
// ver nota de topo de `client-service.ts`/`@types/v2/CadastrosBase/client` —
// esta tela só ESPELHA o shape já assumido pelo formulário
// (`CreateOrUpdateCliente.tsx`), sem inventar campo novo.
//
// Molde estrutural: `BaseRegistrations/Troughs/TroughDetalhe.tsx` /
// `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx` (rota PRÓPRIA, não um
// modo `readOnly` do form; `FormContainer` com `headerActions` [badge Ativo/
// Inativo + botão Editar]; sub-componentes locais `InfoField`/`DetailPanel`).
// `ClientDetail` tem MAIS campos que Trough/CostCenter — organizado em 4
// painéis: Dados Gerais (raiz Person), Endereço, Dados do Cliente (papel
// fiscal/comercial) e IE do cliente (repeater `state_registrations[]`).
//
// Dados: `useClientForm` (`useClientes.tsx`, JÁ EXISTE — hook INALTERADO, só
// consumido em modo leitura) — `GET /clients/{uuid}` via `getClientByUuid`.
// `fillForm` já é NO-OP no próprio hook (ver nota de topo de
// `useClientes.tsx`) — nenhum `useForm`/RHF nesta tela, só lê
// `clientQuery.data` diretamente.
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
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/formatDocument';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { ClientDetail } from '@/@types/v2/CadastrosBase/client';

import { useClientForm } from './useClientes';

const CLIENTES_LIST_ROUTE = '/cadastros-base/clientes';

// Máscara de EXIBIÇÃO de CPF/CNPJ — mesmo helper de `index.tsx` (sem novo
// utilitário criado aqui).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `TroughDetalhe.tsx`/`DetalheCentroCusto.tsx` (tokens Chakra no lugar de
// `style={}` da Referência UX do design system `cerne`).
function InfoField({ label, value }: { label: string; value: ReactNode }) {
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
// `TroughDetalhe.tsx`/`DetalheCentroCusto.tsx`, reaproveitada aqui em modo
// leitura, sem componente novo.
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

export default function ClienteDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.clients.client;

  const canEdit = can('clients_edit');

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `TroughDetalhe.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(CLIENTES_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const clientQuery = useClientForm({ registrationId: uuid });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([clientQuery as any]);
  const client = (clientQuery as any)?.data as ClientDetail | undefined;
  const notFound = !isLoading && (clientQuery as any).isError;

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
                size="sm"
                onClick={() => navigate(CLIENTES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const cityLabel = client?.city
    ? `${client.city.name}${client.city.state ? ` — ${client.city.state.uf}` : ''}`
    : '—';

  const countryLabel = client?.country?.nome ?? (client ? String(client.code_country) : '—');

  const stateRegistrations = client?.state_registrations ?? [];

  return (
    <FormContainer
      title={client?.name ?? text.singularLabel}
      headerActions={
        client && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={client.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {client.is_enabled ? text.list.table.active : text.list.table.inactive}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${CLIENTES_LIST_ROUTE}/${uuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Text fontSize="sm" color="fg.muted">
              {client ? maskNif(client.nif) : '—'}
            </Text>

            <DetailPanel title={text.detail.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.detail.fields.nif}
                  value={client ? maskNif(client.nif) : '—'}
                />
                <InfoField label={text.detail.fields.name} value={client?.name ?? '—'} />
                <InfoField label={text.detail.fields.nickname} value={client?.nickname || '—'} />
                <InfoField label={text.detail.fields.email} value={client?.email || '—'} />
                <InfoField label={text.detail.fields.phone} value={client?.phone || '—'} />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.address}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.address} value={client?.address ?? '—'} />
                <InfoField label={text.detail.fields.number} value={client?.number ?? '—'} />
                <InfoField label={text.detail.fields.district} value={client?.district ?? '—'} />
                <InfoField label={text.detail.fields.zipCode} value={client?.zip_code || '—'} />
                <InfoField label={text.detail.fields.city} value={cityLabel} />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.client}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.cellphone} value={client?.cellphone || '—'} />
                <InfoField label={text.detail.fields.contact} value={client?.contact || '—'} />
                <InfoField
                  label={text.detail.fields.contactPhone}
                  value={client?.contact_phone || '—'}
                />
                <InfoField
                  label={text.detail.fields.cityRegistration}
                  value={client?.city_registration || '—'}
                />
                <InfoField label={text.detail.fields.farmName} value={client?.farm_name || '—'} />
                <InfoField
                  label={text.detail.fields.finalCustomer}
                  value={client ? (client.final_costumer ? yesLabel : noLabel) : '—'}
                />
                <InfoField
                  label={text.detail.fields.taxpayer}
                  value={client ? (client.taxpayer ? yesLabel : noLabel) : '—'}
                />
                <InfoField label={text.detail.fields.country} value={countryLabel} />
                <InfoField label={text.detail.fields.idAbroad} value={client?.id_abroad || '—'} />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.stateRegistrations}>
              {stateRegistrations.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.stateRegistrationsEmpty}
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {stateRegistrations.map((value) => (
                    <Badge key={value} colorPalette="gray" variant="subtle">
                      {value}
                    </Badge>
                  ))}
                </Flex>
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
