// src/pages/Operacional/VendaAnimais/MovementSaleWeighingImportPanel.tsx
// -----------------------------------------------------------------------------
// Painel de Importação de Pesagem — VD-FE-01 (contrato §3.2 FALTA-A,
// SURF-PNL-001/ACT-017/018/019/EP-017/018/EFF-012, `F-034`, `LK-018`). Único
// bloco de UI de Vendas que faltava no fork: baixa um modelo XLSX com os
// animais JÁ selecionados nos itens da venda e sobe a planilha preenchida
// para hidratar `weight_kg` de cada item casado — SEM PERSISTIR no servidor
// (`SE-013`; o peso só grava ao salvar a venda via `store`/`update` já
// existentes).
//
// Adaptação do `FileUpload`/`ImportDialog` do design system `cerne`
// (contrato de tela §2), mesma composição já usada em
// `FeedlotWeighingImportPanel.tsx` (Curral) — semântica DIFERENTE aqui: o
// Curral persiste peso via `weighings-multiple`, Vendas NUNCA persiste
// (`SE-013`), só hidrata o form via `setValue`. Lista de "não-casados"
// mirror o padrão de `rowErrors` do `ImportDialog` (`EarningImportModal.tsx`
// e demais telas de import Excel do fork — `FiAlertTriangle` + `red.500/10`).
//
// Casamento por `animal_uuid` (confirmado contra o backend real,
// `MovementSaleWeighingParseResource`/`ParseWeighingSpreadsheetAction`,
// TASK-VDA-40): o servidor SEMPRE resolve a identificação da planilha para
// `animal_uuid` — nunca devolve `identification` solto — e OMITE (não
// sinaliza erro) as linhas sem casamento (identificação inexistente/
// inativa/de outra fazenda, peso ≤ 0, `CV-022`). Este componente compara os
// `animal_uuid` dos itens do form contra os devolvidos e lista como "não
// encontrado" qualquer item cujo `animal_uuid` não veio na resposta — SEM
// apagar o peso já digitado nesses itens (DoD).
//
// Painel colapsável (`CollapsibleSection`, adaptação `cerne`) — inicia
// FECHADO (mirror `F-034`, "painel inicialmente oculto"); o toggle
// (`ACT-017`) fica sempre disponível, mas o conteúdo interno só habilita com
// `items.length > 0` (DoD "painel habilita só com itens").
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import type { MovementSaleForm, MovementSaleItemForm } from '@/@types/v2/MovementSales';

import {
  useDownloadMovementSaleWeighingTemplate,
  useParseMovementSaleWeighing,
} from './useMovementSales';

import type { UseFormSetValue } from 'react-hook-form';

export interface MovementSaleWeighingImportPanelProps {
  items: MovementSaleItemForm[];
  setValue: UseFormSetValue<MovementSaleForm>;
  isDisabled: boolean;
}

export function MovementSaleWeighingImportPanel({
  items,
  setValue,
  isDisabled,
}: MovementSaleWeighingImportPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale.form.weighingImport;

  const [file, setFile] = useState<File | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const downloadTemplateMutation = useDownloadMovementSaleWeighingTemplate();
  const parseMutation = useParseMovementSaleWeighing();

  const animalUuids = items
    .map((item) => item.animal_uuid?.value)
    .filter((uuid): uuid is string => Boolean(uuid));

  const hasAnimals = animalUuids.length > 0;

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadTemplateMutation.mutateAsync(animalUuids);
      downloadBlob(blob, 'pesagem-modelo-venda.xlsx');
    } catch (error) {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    }
  }

  async function handleImport() {
    if (!file) return;

    try {
      const response = await parseMutation.mutateAsync(file);
      const parsedRows = response.data ?? [];
      const weightByAnimalUuid = new Map(parsedRows.map((row) => [row.animal_uuid, row.weight_kg]));

      let matchedCount = 0;
      const notMatchedLabels: string[] = [];

      items.forEach((item, index) => {
        const animalUuid = item.animal_uuid?.value;
        if (!animalUuid) return;

        const weight = weightByAnimalUuid.get(animalUuid);
        if (weight !== undefined) {
          setValue(`items.${index}.weight_kg`, weight, { shouldValidate: true });
          matchedCount += 1;
        } else {
          notMatchedLabels.push(item.animal_uuid?.label ?? animalUuid);
        }
      });

      setUnmatched(notMatchedLabels);
      setFile(null);

      toaster.success({
        title: text.title,
        description: text.successToast.replace('{count}', String(matchedCount)),
      });
    } catch (error) {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    }
  }

  return (
    <Box mb={4}>
      <CollapsibleSection title={text.title} defaultOpen={false}>
        {!hasAnimals ? (
          <Text fontSize="sm" color="fg.muted">
            {text.emptyHint}
          </Text>
        ) : (
          <Flex direction="column" gap={3}>
            <Flex gap={3} align="flex-end" wrap="wrap">
              <Button
                title={text.downloadTemplate}
                variant="outline"
                type="button"
                onClick={handleDownloadTemplate}
                loading={downloadTemplateMutation.isPending}
                disabled={isDisabled}
              />

              <Box flex="1" minW="220px">
                <FileUpload
                  label={text.uploadLabel}
                  accept=".xls,.xlsx,.csv"
                  file={file}
                  onFileSelected={setFile}
                  onRemove={() => setFile(null)}
                  disabled={isDisabled}
                />
              </Box>

              <Button
                title={text.importButton}
                type="button"
                onClick={handleImport}
                disabled={!file || isDisabled}
                loading={parseMutation.isPending}
              />
            </Flex>

            {unmatched.length > 0 && (
              <Flex
                direction="column"
                gap={2}
                p={4}
                bg="red.500/10"
                border="1px solid"
                borderColor="red.500/30"
                borderRadius="lg"
              >
                <Flex align="center" gap={2}>
                  <Icon as={FiAlertTriangle} color="fg.error" boxSize={4} />
                  <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                    {text.unmatchedTitle}
                  </Text>
                </Flex>
                <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                  {unmatched.map((label, index) => (
                    <Text as="li" key={`${index}-${label}`} fontSize="xs" color="fg.muted">
                      {label}
                    </Text>
                  ))}
                </Box>
                <Text fontSize="xs" color="fg.muted">
                  {text.unmatchedHint}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </CollapsibleSection>
    </Box>
  );
}
