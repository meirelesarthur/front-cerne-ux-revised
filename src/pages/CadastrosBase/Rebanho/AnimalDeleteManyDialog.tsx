// src/pages/CadastrosBase/Rebanho/AnimalDeleteManyDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de ação em lote — Apagar Animais (Tarefa 29, Gestão Animais —
// feature 3596a556, AM-09). A ação mais destrutiva de toda a feature: hard
// delete em cascata sobre ~16 tabelas, sem `deleted_at`, irreversível — por
// isso exige CONFIRMAÇÃO DIGITADA (o usuário precisa escrever literalmente a
// palavra traduzida de `text.list.bulkBar.deleteMany.confirmWord`). Único
// ponto da SPA com essa fricção, fiel ao legado, não invenção desta Tarefa.
//
// `DeleteConfirmDialog` (já usado na exclusão de linha) NÃO SERVE — não tem
// campo de confirmação digitada. Este diálogo usa a composição `Dialog` de
// `@/components/ui/dialog` diretamente. `DeleteConfirmDialog` permanece
// intocado (compartilhado com outras telas).
//
// 095 (DA-05a): a API é "tudo ou nada" — com animal vinculado devolve 422 com
// `errors.blocked_uuids`. O diálogo permanece aberto, lista as identificações
// dos bloqueados e oferece "Desmarcar bloqueados". O toast de erro mostra a
// `message` do envelope (`getBusinessMutationErrorMessage`), nunca um uuid.
//
// `useMutation` DIRETO (não `useRequest`) — mesma razão da Tarefa 28: o toast
// de sucesso usa a contagem REAL do servidor (`data.data.deleted`), que
// diverge de `selectedUuids.length` quando um uuid não resolve sob
// `HasFarmTenantScope` (outra fazenda, ou já excluído em outra aba).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { Dialog } from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';

import {
  extractBlockedUuids,
  getBusinessMutationErrorMessage,
} from '@/utils/extractApiErrorMessage';
import type { BlockedUuids } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { deleteAnimalsMany } from '@/services/v2/Animals/animal-service';

import type { LanguageDate } from '@/@types/language';

// Máximo de identificações listadas no bloco de bloqueados; o restante vira
// "e mais {count} animal(is)".
const MAX_VISIBLE_BLOCKED = 20;

interface AnimalDeleteManyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUuids: string[];
  /** Seleção corrente com identificação — usada para nomear os bloqueados. */
  selectedAnimals: { uuid: string; identification: string }[];
  /** Remove da seleção os uuids bloqueados (o pai atualiza `rowSelection`). */
  onDeselectBlocked: (uuids: string[]) => void;
  languageGB: LanguageDate;
  /** Chamado após sucesso — o pai fecha o diálogo e limpa a seleção. */
  onSuccess: () => void;
}

export function AnimalDeleteManyDialog({
  isOpen,
  onClose,
  selectedUuids,
  selectedAnimals,
  onDeselectBlocked,
  languageGB,
  onSuccess,
}: AnimalDeleteManyDialogProps) {
  const text = languageGB.animals.animal;
  const dialogText = text.dialogs.deleteMany;
  const confirmWord = text.list.bulkBar.deleteMany.confirmWord;
  const queryClient = useQueryClient();

  const [confirmText, setConfirmText] = useState('');
  const [blocked, setBlocked] = useState<BlockedUuids | null>(null);

  // `useDisclosure` já é próprio (não compartilhado com a exclusão de
  // linha) — este `useState` local também é próprio deste diálogo.
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setBlocked(null);
    }
  }, [isOpen]);

  const canConfirm = confirmText.trim().toUpperCase() === confirmWord.toUpperCase();

  const mutation = useMutation({
    mutationFn: (uuids: string[]) => deleteAnimalsMany(uuids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animalsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animal] });
      toaster.success({
        title: text.pluralLabel,
        description: dialogText.successMessage.replace('{count}', String(response.data.deleted)),
        duration: 7000,
      });
      setConfirmText('');
      onSuccess();
    },
    onError: (error) => {
      setBlocked(extractBlockedUuids(error));
      toaster.error({
        title: text.pluralLabel,
        description: getBusinessMutationErrorMessage(error, languageGB),
        duration: 7000,
      });
    },
  });

  function handleClose() {
    setConfirmText('');
    setBlocked(null);
    onClose();
  }

  function handleDeselectBlocked() {
    if (!blocked) return;
    onDeselectBlocked(blocked.uuids);
    setBlocked(null);
    // Sem nenhum animal restante, o diálogo não tem o que apagar: fecha.
    const remaining = selectedUuids.filter((uuid) => !blocked.uuids.includes(uuid));
    if (remaining.length === 0) handleClose();
  }

  // uuid bloqueado fora da página corrente (não esperado) cai no próprio uuid.
  const blockedLabels = (blocked?.uuids ?? []).map(
    (uuid) => selectedAnimals.find((animal) => animal.uuid === uuid)?.identification ?? uuid
  );
  const visibleBlocked = blockedLabels.slice(0, MAX_VISIBLE_BLOCKED);
  const hiddenBlockedCount = blockedLabels.length - visibleBlocked.length;

  function handleConfirm() {
    if (!canConfirm || selectedUuids.length === 0) return;
    mutation.mutate(selectedUuids);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{dialogText.title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <VStack align="stretch" gap={4}>
            <Text>{dialogText.countTemplate.replace('{count}', String(selectedUuids.length))}</Text>

            {/* Aviso de irreversibilidade (`CLM-24`/`SE-06` — sem `deleted_at`,
                sem lixeira, sem desfazer). Padrão visual de alerta da SPA,
                nunca um `<Text color="red">` avulso. */}
            <Text fontSize="sm" color="feedBack.errorMain" fontWeight="medium">
              {dialogText.warning}
            </Text>

            {blocked && (
              <Box
                role="alert"
                bg="feedBack.warn"
                color="feedBack.warnMain"
                borderRadius="md"
                p={3}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {dialogText.blockedTitle}
                </Text>
                <Box as="ul" mt={2} ps={5} fontSize="sm">
                  {visibleBlocked.map((label, index) => (
                    <li key={`${label}-${index}`}>{label}</li>
                  ))}
                </Box>
                {hiddenBlockedCount > 0 && (
                  <Text mt={2} fontSize="sm">
                    {dialogText.blockedMore.replace('{count}', String(hiddenBlockedCount))}
                  </Text>
                )}
                {blocked.truncated && (
                  <Text mt={2} fontSize="sm">
                    {dialogText.blockedTruncated}
                  </Text>
                )}
              </Box>
            )}

            <Input
              name="confirmText"
              label={dialogText.confirmLabel.replace('{word}', confirmWord)}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </VStack>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              onClick={handleClose}
              disabled={mutation.isPending}
            />
          </Dialog.ActionTrigger>
          {blocked && (
            <Button
              title={dialogText.blockedDeselect}
              variant="outline"
              onClick={handleDeselectBlocked}
              disabled={mutation.isPending}
            />
          )}
          <Button
            title={dialogText.submitButton}
            colorPalette="red"
            onClick={handleConfirm}
            loading={mutation.isPending}
            disabled={!canConfirm || selectedUuids.length === 0 || mutation.isPending}
          />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
