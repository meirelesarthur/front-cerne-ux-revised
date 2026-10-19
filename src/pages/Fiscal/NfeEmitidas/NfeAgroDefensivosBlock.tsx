// src/pages/Fiscal/NfeEmitidas/NfeAgroDefensivosBlock.tsx
// -----------------------------------------------------------------------------
// UT-000776 / T-776-FE-05 — bloco "Defensivos agrícolas" da NF-e (grupo `agro`):
// field array `agro_defensivos` no padrão de staging do CIOT do MDF-e
// (campos de staging + lista + lixeira), até 20 linhas, `n_receituario`
// (texto até 30) e `cpf_resp_tec` (`MaskedInput kind="cpf"`, guardado só com dígitos).
// EXCLUSIVO com a guia (P-FE-05): se a guia tem dado, o bloco fica desabilitado com
// aviso; o inverso (guia desabilitada com defensivos) é feito em `CreateOrUpdateNfe`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useFieldArray, useFormState } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { isValidCpf, onlyDigits } from '@/utils/cpfCnpj';
import { formatCpf } from '@/utils/masks/document';

import { NFE_AGRO_DEFENSIVOS_MAX } from '@/validations/schemas/Nfes/nfe-schema';

import type { NfeForm } from '@/@types/v2/Nfes';

import type { Control } from 'react-hook-form';

interface NfeAgroDefensivosBlockProps {
  control: Control<NfeForm>;
  /** `true` quando a guia (tipo/UF/número/série) tem dado — bloqueia o bloco. */
  guideHasData: boolean;
  disabled?: boolean;
}

export function NfeAgroDefensivosBlock({
  control,
  guideHasData,
  disabled = false,
}: NfeAgroDefensivosBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.nfes.nfe.form.agroDefensivos;

  const { fields, append, remove } = useFieldArray({ control, name: 'agro_defensivos' });
  const { errors } = useFormState({ control, name: 'agro_defensivos' });
  const arrayError = errors.agro_defensivos as
    { message?: string; root?: { message?: string } } | undefined;
  const arrayErrorMessage = arrayError?.message ?? arrayError?.root?.message;

  const [receituario, setReceituario] = useState('');
  const [cpf, setCpf] = useState('');
  const [inlineError, setInlineError] = useState<string | undefined>();

  const blocked = disabled || guideHasData;
  const limitReached = fields.length >= NFE_AGRO_DEFENSIVOS_MAX;

  function handleAdd() {
    if (limitReached) {
      setInlineError(text.maxReached);
      return;
    }
    if (!receituario.trim() || !cpf.trim()) {
      setInlineError(text.stagingMessage);
      return;
    }
    if (!isValidCpf(cpf)) {
      setInlineError(text.cpfInvalid);
      return;
    }
    append({ n_receituario: receituario.trim(), cpf_resp_tec: onlyDigits(cpf) });
    setReceituario('');
    setCpf('');
    setInlineError(undefined);
  }

  return (
    <Box
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
      mt={4}
      data-testid="nfe-agro-defensivos"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {guideHasData && (
        <Text role="status" fontSize="sm" color="fg.muted" mb={2}>
          {text.disabledByGuide}
        </Text>
      )}

      {arrayErrorMessage && (
        <Text role="alert" fontSize="sm" color="fg.error" mb={2}>
          {arrayErrorMessage}
        </Text>
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field, index) => {
            const rowErrors = (errors.agro_defensivos as any)?.[index];
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">
                    {field.n_receituario} — {formatCpf(field.cpf_resp_tec)}
                  </Text>
                  {rowErrors?.n_receituario?.message && (
                    <Text role="alert" fontSize="xs" color="fg.error">
                      {rowErrors.n_receituario.message}
                    </Text>
                  )}
                  {rowErrors?.cpf_resp_tec?.message && (
                    <Text role="alert" fontSize="xs" color="fg.error">
                      {rowErrors.cpf_resp_tec.message}
                    </Text>
                  )}
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      {inlineError && (
        <Text role="alert" fontSize="sm" color="fg.error" mb={2}>
          {inlineError}
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} alignItems="flex-end">
        <Input
          label={text.nReceituario}
          name="agro-staging-receituario"
          maxLength={30}
          value={receituario}
          onChange={(event) => setReceituario(event.target.value)}
          disabled={blocked}
        />
        <MaskedInput
          kind="cpf"
          label={text.cpfRespTec}
          name="agro-staging-cpf"
          value={cpf}
          onChange={(event) => setCpf(event.target.value)}
          disabled={blocked}
        />
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={blocked || limitReached}
        />
      </SimpleGrid>
    </Box>
  );
}
