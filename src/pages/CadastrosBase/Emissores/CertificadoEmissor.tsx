// src/pages/CadastrosBase/Emissores/CertificadoEmissor.tsx
// -----------------------------------------------------------------------------
// Tela DEDICADA (não modal, não aba do form principal) de CERTIFICADO
// DIGITAL A1 do Emissor NFe — execução 023, TASK-FE-324. Rota:
// /cadastros-base/emissores/:issuerUuid/certificado, guardada por
// `issue_edit` NA ROTA INTEIRA (TASK-FE-325) — usuário só com `issue_view`
// não deve nem alcançar esta tela (contrato de backend §8.2/§9).
//
// Referência UX real: `CertificadoEmissor.tsx` (ux_root). Reaproveita o
// `FileUpload` GENÉRICO já existente no fork (`src/components/Form/
// FileUpload.tsx`, TASK-PA-08 — 1º upload de arquivo genérico da SPA), só
// trocando `accept`/`maxSizeMb`/textos — SEM criar um componente novo (já
// existe, mesma composição visual pedida pelo contrato de tela §1).
//
// ⚠️ MAIOR RISCO desta Tarefa (documentado no contrato de tela §3.4/TASK-FE-324
// e endereçado explicitamente aqui): a senha do certificado é WRITE-ONLY
// ABSOLUTO — a API NUNCA devolve a senha nem o binário, em NENHUMA resposta,
// nem no GET do próprio certificado. O campo de senha nasce SEMPRE vazio e
// nunca é populado a partir de uma resposta do servidor — mesmo em
// re-render/erro de submit, `senha` é sempre resetada para `''` após o
// submit (sucesso OU erro).
//
// Segundo risco endereçado: a UX faz um mock de "preview" de dados extraídos
// do .pfx ANTES de salvar (parsing X.509 fake no client) — aqui o preview
// (serial/validade) só existe DEPOIS que o POST responder com sucesso (via
// invalidação de `queryKey.issuers.certificate`, que refetch o GET real), o
// client NUNCA decodifica o .pfx.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  deleteIssuerCertificate,
  storeIssuerCertificate,
} from '@/services/v2/Issuers/issuer-service';

import { useIssuerCertificate } from './useIssuers';

export default function CertificadoEmissor() {
  const { issuerUuid } = useParams<{ issuerUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.issuers.issuer.certificate;

  const isValidIssuer = isValidGuid(issuerUuid);

  const certificateQuery = useIssuerCertificate(issuerUuid);

  // Estado do upload — NÃO campos RHF (form de 1 arquivo + 1 senha, sem
  // necessidade de react-hook-form). `senha` SEMPRE reiniciada para '' após
  // submit, sucesso OU erro (write-only absoluto, ver nota de cabeçalho).
  const [file, setFile] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const {
    open: isRemoveConfirmOpen,
    onOpen: onOpenRemoveConfirm,
    onClose: onCloseRemoveConfirm,
  } = useDisclosure();

  const uploadMutation = useRequest({
    asyncFunction: async () => {
      if (!issuerUuid) throw new Error('uuid inválido');
      if (!file) throw new Error(text.upload.fileRequired);
      return await storeIssuerCertificate(issuerUuid, { arquivo: file, senha_certificado: senha });
    },
    entityName: languageGB.issuers.issuer.singularLabel,
    queryKey: queryKey.issuers.certificate,
    queryKey2: queryKey.issuers.detail,
    typesRequest: 'update',
    personalizedMessage: text.successUpload,
    actionSuccess: () => {
      setFile(null);
      setSenha('');
      setFormError(undefined);
    },
  });

  const removeMutation = useRequest({
    asyncFunction: async () => {
      if (!issuerUuid) throw new Error('uuid inválido');
      return await deleteIssuerCertificate(issuerUuid);
    },
    entityName: languageGB.issuers.issuer.singularLabel,
    queryKey: queryKey.issuers.certificate,
    queryKey2: queryKey.issuers.detail,
    typesRequest: 'update',
    personalizedMessage: text.successRemove,
    actionSuccess: () => {
      onCloseRemoveConfirm();
    },
  });

  function handleSubmit() {
    if (!file) {
      setFormError(text.upload.fileRequired);
      return;
    }
    if (!senha) {
      setFormError(text.upload.passwordRequired);
      return;
    }
    setFormError(undefined);
    uploadMutation.mutate(undefined);
  }

  const isSubmitting = uploadMutation.isPending;
  const isRemoving = removeMutation.isPending;

  const certificate = certificateQuery.data;
  const hasCertificate = !!certificate;

  const badgeInfo = (() => {
    if (!certificate) return null;
    if (certificate.days_until_expiration < 0) {
      return { label: text.statusCard.badgeExpired, colorPalette: 'red' };
    }
    if (certificate.days_until_expiration <= 30) {
      return { label: text.statusCard.badgeExpiringSoon, colorPalette: 'orange' };
    }
    return { label: text.statusCard.badgeValid, colorPalette: 'green' };
  })();

  return (
    <FormContainer title={text.title} showDivider isWidthFull={false}>
      <VStack align="stretch" gap={8}>
        {/* ---- Card de status atual — NUNCA exibe senha/binário --------------- */}
        <Box border="1px solid" borderColor="borderGrid" borderRadius="md" p={5}>
          <Text fontWeight="semibold" mb={3}>
            {text.statusCard.title}
          </Text>

          {certificateQuery.isLoading ? (
            <Text fontSize="sm" color="fg.muted">
              …
            </Text>
          ) : !hasCertificate ? (
            <Text fontSize="sm" color="fg.muted">
              {text.statusCard.notConfigured}
            </Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {badgeInfo && (
                <Box>
                  <Badge colorPalette={badgeInfo.colorPalette} variant="subtle" py={1} px={3}>
                    {badgeInfo.label}
                  </Badge>
                </Box>
              )}
              <Flex justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {text.statusCard.serial}
                </Text>
                <Text fontSize="sm">{certificate?.serial}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {text.statusCard.validFrom}
                </Text>
                <Text fontSize="sm">{certificate?.valid_from}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {text.statusCard.validTo}
                </Text>
                <Text fontSize="sm">{certificate?.valid_to}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {text.statusCard.daysRemaining}
                </Text>
                <Text fontSize="sm">{certificate?.days_until_expiration}</Text>
              </Flex>
            </VStack>
          )}
        </Box>

        {/* ---- Upload de novo certificado ------------------------------------ */}
        <Box>
          <Text fontWeight="semibold" mb={3}>
            {text.upload.title}
          </Text>

          <VStack align="stretch" gap={4}>
            <FileUpload
              label={undefined}
              accept=".pfx,.p12,application/x-pkcs12"
              maxSizeMb={5}
              file={file}
              onFileSelected={(selected) => {
                setFile(selected);
                setFormError(undefined);
              }}
              onRemove={() => setFile(null)}
              disabled={isSubmitting}
              dropzoneTitle={text.upload.dropzoneTitle}
              dropzoneDraggingTitle={text.upload.dropzoneDragging}
              changeLabel={text.upload.changeLabel}
              errorTypeMessage={text.upload.errorType}
              errorSizeMessage={text.upload.errorSize}
            />

            {/* Senha SEMPRE nasce vazia — write-only absoluto, nunca
                pré-populada a partir de nenhuma resposta do servidor. */}
            <Input
              label={text.upload.passwordLabel}
              placeholder={text.upload.passwordPlaceholder}
              type="password"
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value);
                setFormError(undefined);
              }}
              disabled={isSubmitting}
              autoComplete="new-password"
            />

            {formError && (
              <Text role="alert" fontSize="xs" color="fg.error">
                {formError}
              </Text>
            )}
          </VStack>
        </Box>

        <FormFooter noPadding>
          <Button title={text.backToList} variant="outline" onClick={() => navigate(-1)} />
          <Button
            title={text.upload.submitLabel}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !isValidIssuer}
          />
          {hasCertificate && (
            <Button
              title={text.remove.button}
              variant="outline_danger"
              onClick={onOpenRemoveConfirm}
              disabled={isSubmitting || isRemoving}
            />
          )}
        </FormFooter>
      </VStack>

      <DeleteConfirmDialog
        isOpen={isRemoveConfirmOpen}
        onClose={onCloseRemoveConfirm}
        onConfirm={() => removeMutation.mutate(undefined)}
        isLoading={isRemoving}
        title={text.remove.confirmTitle}
        confirmButtonText={text.remove.confirmButton}
      />
    </FormContainer>
  );
}
