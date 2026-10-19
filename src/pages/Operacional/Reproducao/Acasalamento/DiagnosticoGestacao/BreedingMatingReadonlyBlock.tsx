// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/BreedingMatingReadonlyBlock.tsx
// -----------------------------------------------------------------------------
// Bloco `Acasalamento` — parte de `pd-form-main` (PregnancyDiagnosis, F-016,
// 97-Esteiras/001, TASK-BM-FE-08, contrato de tela §6.6, regra 5). Todos os
// campos SOMENTE LEITURA em `DisplayFieldGroup`, mirror
// `DiagnosticoGestacaoDetalhe.tsx`/`AcasalamentoDetalhe.tsx`.
//
// Os dados vêm INTEGRALMENTE de `EP-PD-02.breeding_mating`
// (`PregnancyDiagnosisBreedingMatingBlock`) — NENHUMA request extra ao
// Acasalamento é feita aqui (regra 5 da Tarefa). Nada deste bloco entra no
// payload de `EP-PD-03`.
//
// `Estação de Monta`/`Touro/Sêmen/Embrião`/`Protocolo`/`Lote de Reprodução`
// só aparecem "quando houver estação" — condição aplicada em
// `block.breeding_season !== null` (os 4 campos nascem juntos no servidor
// quando o tipo de reprodução não é Monta Natural, contrato de tela §6.3/§5.2).
// -----------------------------------------------------------------------------

import { Box, Heading, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type { PregnancyDiagnosisBreedingMatingBlock } from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

export interface BreedingMatingReadonlyBlockProps {
  block: PregnancyDiagnosisBreedingMatingBlock | undefined;
  loading: boolean;
  languageGB: LanguageDate;
}

export function BreedingMatingReadonlyBlock({
  block,
  loading,
  languageGB,
}: BreedingMatingReadonlyBlockProps) {
  const text = languageGB.breedingMatings.pregnancyDiagnosis.form.breedingMatingBlock;

  const hasBreedingSeason = !!block?.breeding_season;

  return (
    <Box mt={6}>
      <VStack align="flex-start" gap={3}>
        <Heading as="h3" size="sm" fontWeight="semibold" color="fg.default">
          {text.title}
        </Heading>

        <DisplayFieldGroup
          loading={loading}
          displayFields={[
            { label: text.code, value: block?.code ?? '' },
            { label: text.date, value: block?.date ? formatDate(block.date) : '' },
            { label: text.responsible, value: block?.responsible_name ?? '' },
            { label: text.type, value: block?.type_label ?? '' },
            { label: text.launchType, value: block?.launch_type_label ?? '' },
            ...(hasBreedingSeason
              ? [
                  { label: text.breedingSeason, value: block?.breeding_season?.label ?? '' },
                  { label: text.bullSeedSeason, value: block?.bull_seed_season?.label ?? '—' },
                  { label: text.protocol, value: block?.protocol?.label ?? '—' },
                  { label: text.breedingBatch, value: block?.breeding_batch?.label ?? '—' },
                ]
              : []),
          ]}
        />
      </VStack>
    </Box>
  );
}

export default BreedingMatingReadonlyBlock;
