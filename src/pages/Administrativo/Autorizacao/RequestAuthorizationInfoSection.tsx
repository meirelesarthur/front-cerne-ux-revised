// src/pages/Administrativo/Autorizacao/RequestAuthorizationInfoSection.tsx
// -----------------------------------------------------------------------------
// Bloco "Informações da Solicitação" — readonly (Administrativo / Suprimentos,
// esteira 97-Esteiras/038, TASK-AUTH-FE-03). Reusado 1:1 por
// `TASK-AUTH-FE-04` (ramo 2º nível, `surf-form-06`) — nenhum estado interno,
// só props.
//
// Layout label-muted+valor — mirror EXATO de `InfoField`/`RomaneioDetalhe.tsx`/
// `RequestQuotationDetailDialog.tsx` (convenção real já estabelecida no fork
// para blocos de detalhe read-only).
//
// Execução 081, T-081-FE-06 (legado `_forms`/`second`: campos comuns): acrescenta
// "Observação Final" (`finalization_note`); a tela soma os blocos Anexos e
// Movimentações (componentes abaixo e `RequestMovementHistory`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { RequestAuthorizationData } from '@/@types/v2/RequestAuthorizations';

const NO_DATA = '—';

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

export interface RequestAuthorizationInfoSectionProps {
  data: RequestAuthorizationData;
}

export function RequestAuthorizationInfoSection({ data }: RequestAuthorizationInfoSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.info;

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
        {text.title}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <InfoField label={text.code} value={data.code ?? NO_DATA} />
        <InfoField
          label={text.requestDate}
          value={data.request_date ? formatDate(data.request_date) : NO_DATA}
        />
        <InfoField label={text.duration} value={data.duration_label ?? NO_DATA} />
        <InfoField label={text.type} value={data.type_label ?? NO_DATA} />
        <InfoField label={text.priority} value={data.priority_label ?? NO_DATA} />
        <InfoField label={text.nfe} value={data.nfe ?? NO_DATA} />
        <InfoField label={text.requester} value={data.user?.name ?? NO_DATA} />
        <InfoField label={text.responsible} value={data.responsible?.name ?? NO_DATA} />
      </SimpleGrid>

      <Box mt={4}>
        <InfoField label={text.justification} value={data.justification || NO_DATA} />
      </Box>
      <Box mt={4}>
        <InfoField label={text.description} value={data.description || NO_DATA} />
      </Box>
      {!!data.observation && (
        <Box mt={4}>
          <InfoField label={text.observation} value={data.observation} />
        </Box>
      )}
      <Box mt={4}>
        <InfoField label={text.finalizationNote} value={data.finalization_note || NO_DATA} />
      </Box>
    </Box>
  );
}
