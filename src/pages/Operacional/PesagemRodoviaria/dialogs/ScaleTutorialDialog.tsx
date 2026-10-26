// src/pages/Operacional/PesagemRodoviaria/dialogs/ScaleTutorialDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo tutorial de instalação/uso do conector da balança + download do
// binário (FE-DLG-TUTORIAL, TASK-MWG-FE-12, `AC-017`/`AC-011`). Nenhuma
// lógica nova — depende do `useModuleWeighingScale` (`TASK-MWG-FE-04`) só
// para REFLETIR o status de conexão já ativo por outra parte da tela (o
// diálogo NÃO abre conexão própria — mesma regra de "conectar só sob
// demanda" do hook).
//
// Download (`RT-014`, `GET .../connector/download`) — SEM gate de
// permissão (paridade, recurso público de apoio) e SEM envelope
// `ApiResponse` (binário puro) — `<a href>` direto/nova aba, nunca
// `useRequest`.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Text, VStack } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

import { useLanguage } from '@/hooks/useLanguage';

import api from '@/services/api';

import { ScaleConnectionBadge } from '../components/ScaleConnectionBadge';

import type { ModuleWeighingScaleStatus } from '../hooks/useModuleWeighingScale';

export interface ScaleTutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Status ATUAL do `useModuleWeighingScale` já instanciado pela tela que
   *  abriu este diálogo (wizard, `TASK-MWG-FE-05`/`06`) — o diálogo não
   *  cria sua própria conexão. */
  scaleStatus: ModuleWeighingScaleStatus;
}

const CONNECTOR_DOWNLOAD_PATH = '/module-weighings/connector/download';

export function ScaleTutorialDialog({ isOpen, onClose, scaleStatus }: ScaleTutorialDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing.scaleTutorial;
  const connectionText = languageGB.moduleWeighing.moduleWeighing.scaleConnection;

  const downloadUrl = `${api.V2.baseURL.replace(/\/$/, '')}${CONNECTOR_DOWNLOAD_PATH}`;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={text.title}
      footer={
        <Button title={languageGB.defaltStrings.cancel} variant="secondary" onClick={onClose} />
      }
    >
      <VStack align="flex-start" gap={4}>
        <Text>{text.instructions}</Text>

        <VStack align="flex-start" gap={1}>
          <Text fontSize="sm" fontWeight="medium">
            {text.statusLabel}
          </Text>
          <ScaleConnectionBadge
            status={scaleStatus}
            labels={{
              connecting: connectionText.connecting,
              connected: connectionText.connected,
              disconnected: connectionText.disconnected,
            }}
          />
        </VStack>

        {/* `<a href>`/nova aba direto — sem envelope `ApiResponse` (binário
            puro, RT-014), nunca `useRequest`/blob via axios. */}
        <Button
          type="button"
          title={text.downloadButton}
          icon={FiDownload as ElementType}
          variant="outline"
          onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')}
        />
      </VStack>
    </CustomDialog>
  );
}

export default ScaleTutorialDialog;
