// src/components/DeleteConfirmDialog.tsx
// Componente de diálogo de confirmação de exclusão reutilizável
// Padrão baseado em front-referencia/pages/v2/Master/DocumentationPipelines
//
// Internamente renderiza via `CustomDialog` (EST-07/esteira 006) para herdar
// o footer PADRONIZADO (linha separadora + botões) — 100% da API pública e
// do comportamento visual anteriores (bloco de `tone`, `warningText`,
// `hideQuestionMark`, `loading`, `colorPalette`, textos i18n) preservados.

import { Flex, Icon, Text } from '@chakra-ui/react';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

import { useLanguage } from '@/hooks/useLanguage';

import type { IconType } from 'react-icons';

export type DeleteConfirmDialogTone = 'danger' | 'warning' | 'info';

const toneConfig: Record<DeleteConfirmDialogTone, { icon: IconType; bg: string; color: string }> = {
  danger: { icon: FiAlertTriangle, bg: 'feedBack.error', color: 'feedBack.errorMain' },
  warning: { icon: FiAlertTriangle, bg: 'feedBack.warn', color: 'feedBack.warnMain' },
  info: { icon: FiInfo, bg: 'feedBack.info', color: 'feedBack.infoMain' },
};

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  warningText?: string;
  confirmButtonText?: string;
  /**
   * Rótulo do botão de recusa/cancelamento (default `languageGB.defaltStrings.cancel`).
   * ADITIVO e OPCIONAL — introduzido pelo prompt de recuperação de rascunho
   * (PROC-06, `useFormDraftAutosave`), que precisa de "Descartar" em vez de
   * "Cancelar". 100% retrocompatível: consumidores existentes que não
   * passam a prop mantêm o texto padrão.
   */
  cancelButtonText?: string;
  colorPalette?: string;
  /**
   * Omite o "?" final do corpo (default `false`, preserva 100% do
   * comportamento atual dos consumidores existentes). Uso: variante
   * INFORMATIVA (não é uma pergunta de confirmação) — ex.: diálogo de
   * "exclusão bloqueada" de Contas Bancárias (TASK-FE-564), onde
   * `description` já é uma frase completa e `onConfirm`/`onClose` só
   * fecham o diálogo (não disparam a ação destrutiva).
   */
  hideQuestionMark?: boolean;
  /**
   * Bloco de ícone por tom (círculo colorido + ícone acima do título),
   * fiel ao `ConfirmDialog.tsx` do design system `cerne`. ADITIVO e
   * OPCIONAL — default `undefined` preserva 100% o rendering atual (sem
   * ícone) para quem já usa este diálogo sem a prop.
   */
  tone?: DeleteConfirmDialogTone;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  itemName,
  description,
  warningText,
  confirmButtonText,
  cancelButtonText,
  colorPalette = 'red',
  hideQuestionMark = false,
  tone,
}: DeleteConfirmDialogProps) {
  const { languageGB } = useLanguage();

  const defaultTitle = languageGB.admin?.common?.deleteDialog?.title || 'Confirmar Exclusão';
  const defaultDescription =
    languageGB.admin?.common?.deleteDialog?.description || 'Tem certeza que deseja excluir';
  const defaultWarning =
    languageGB.admin?.common?.deleteDialog?.warning || 'Esta ação não pode ser desfeita.';
  const defaultConfirmButton = languageGB.admin?.common?.deleteDialog?.confirm || 'Excluir';

  // Preserva a guarda original: nenhuma via de fechamento (ESC, clique fora,
  // botão Cancelar) fecha o diálogo enquanto `isLoading` — o `CustomDialog`
  // chama `onClose` diretamente no `onOpenChange`, então a guarda precisa
  // estar no próprio callback repassado a ele.
  const handleClose = () => {
    if (!isLoading) onClose();
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={handleClose}
      preventCloseOnOutside={isLoading}
      size="md"
      minW="min(440px, 92vw)"
      title={
        <>
          {tone && (
            <Flex
              align="center"
              justify="center"
              boxSize="10"
              borderRadius="full"
              bg={toneConfig[tone].bg}
              color={toneConfig[tone].color}
              mb={3}
              aria-hidden="true"
            >
              <Icon as={toneConfig[tone].icon} boxSize={5} />
            </Flex>
          )}
          <Text>{title || defaultTitle}</Text>
        </>
      }
      footer={
        <>
          <Button
            title={cancelButtonText || languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          />
          <Button
            title={confirmButtonText || defaultConfirmButton}
            colorPalette={colorPalette}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          />
        </>
      }
    >
      <Text py={1}>
        {description || defaultDescription}{' '}
        {itemName && (
          <Text as="span" fontWeight="bold">
            {itemName}
          </Text>
        )}
        {!hideQuestionMark && '?'}
      </Text>
      {warningText !== '' && (
        <Text mt={3} fontSize="sm" color="fg.muted">
          {warningText || defaultWarning}
        </Text>
      )}
    </CustomDialog>
  );
}
