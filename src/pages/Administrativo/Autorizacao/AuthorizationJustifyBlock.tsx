// src/pages/Administrativo/Autorizacao/AuthorizationJustifyBlock.tsx
// -----------------------------------------------------------------------------
// Bloco "Autorização" do legado (`_forms.blade.php:535-560`, `second.blade.php:430-440`):
// UM campo "Adicionar Comentário/Justificativa" (máximo de 300) que serve ao botão
// "Adicionar Comentário" e às ações Voltar Etapa, Próxima Etapa e Reprovar. O estado
// do texto mora na tela (as ações o leem); aqui só o campo e o comentário avulso.
//
// "Adicionar Comentário" (IG01/IG02): vazio avisa "Informe um comentário"; preenchido
// grava o movimento (`POST comments`), limpa o campo e atualiza a tela.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { commentOnRequestAuthorization } from '@/services/v2/RequestAuthorizations/request-authorization-service';

import { isJustifyFilled } from './authorizationRules';

/** Limite do campo no legado (`maxlength` 300). */
export const JUSTIFY_FIELD_MAX_LENGTH = 300;

export interface AuthorizationJustifyBlockProps {
  authorizationUuid: string;
  value: string;
  onChange: (value: string) => void;
  /** Bloqueia o campo enquanto uma ação está em andamento. */
  disabled?: boolean;
}

export function AuthorizationJustifyBlock({
  authorizationUuid,
  value,
  onChange,
  disabled = false,
}: AuthorizationJustifyBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization;
  const justifyText = text.detail.justify;
  const validationText = text.detail.clientValidation;

  const commentMutation = useRequest({
    asyncFunction: async (payload: { comment: string }) =>
      commentOnRequestAuthorization(authorizationUuid, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestAuthorizations.requestAuthorization,
    typesRequest: 'update',
    personalizedMessage: justifyText.commentToast,
    actionSuccess: () => onChange(''),
  });

  function handleAddComment() {
    if (!isJustifyFilled(value)) {
      toaster.create({
        title: validationText.warningTitle,
        description: validationText.commentRequired,
        type: 'warning',
      });
      return;
    }
    commentMutation.mutate({ comment: value.trim() });
  }

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
        {text.singularLabel}
      </Text>

      <Textarea
        name="request-authorization-justify"
        label={justifyText.label}
        maxLength={JUSTIFY_FIELD_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || commentMutation.isPending}
        isRequired
      />

      <Flex justify="flex-start" mt={3}>
        <Button
          title={justifyText.addComment}
          size="sm"
          variant="outline"
          type="button"
          onClick={handleAddComment}
          loading={commentMutation.isPending}
          disabled={disabled || commentMutation.isPending}
        />
      </Flex>
    </Box>
  );
}
