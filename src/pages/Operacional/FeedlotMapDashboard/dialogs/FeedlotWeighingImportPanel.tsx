// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotWeighingImportPanel.tsx
// -----------------------------------------------------------------------------
// Painel de importação de planilha de pesagem — TASK-FE-042-214. Painel
// toggle DENTRO do diálogo de Pesagem (`TASK-FE-042-213`): baixa o template
// (blob síncrono), sobe a planilha preenchida (multipart), faz o PARSE (sem
// persistir) e hidrata a MESMA tabela via `onWeightsParsed` (reaproveita
// `handleWeightChange`/propagação do pai). Fechar o painel NÃO descarta os
// pesos já hidratados (`SB37`/`S076`) — este componente não guarda estado
// de pesos, só o arquivo selecionado.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import {
  downloadWeighingTemplate,
  parseWeighingSpreadsheet,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { WeighingParseResultItem } from '@/@types/v2/FeedlotMap/weighing';

export interface FeedlotWeighingImportPanelProps {
  corralUuid: string;
  onWeightsParsed: (items: WeighingParseResultItem[]) => void;
}

export function FeedlotWeighingImportPanel({
  corralUuid,
  onWeightsParsed,
}: FeedlotWeighingImportPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.weighingImport;

  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleDownloadTemplate() {
    setIsDownloading(true);
    try {
      const blob = await downloadWeighingTemplate(corralUuid);
      downloadBlob(blob, 'pesagem-modelo.xlsx');
    } catch (error) {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setIsImporting(true);
    try {
      const response = await parseWeighingSpreadsheet(corralUuid, file);
      const items = response.data ?? [];
      onWeightsParsed(items);
      toaster.success({
        title: text.title,
        description: text.successToast.replace('{count}', String(items.length)),
      });
    } catch (error) {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mb={4} bg="bg.subtle">
      <Flex gap={3} align="flex-end" wrap="wrap">
        <Button
          title={text.downloadTemplate}
          variant="outline"
          type="button"
          onClick={handleDownloadTemplate}
          loading={isDownloading}
        />
        <Box flex="1" minW="220px">
          <FileUpload
            label={text.uploadLabel}
            accept=".xls,.xlsx"
            file={file}
            onFileSelected={setFile}
            onRemove={() => setFile(null)}
          />
        </Box>
        <Button
          title={text.importButton}
          type="button"
          onClick={handleImport}
          disabled={!file}
          loading={isImporting}
        />
      </Flex>
    </Box>
  );
}
