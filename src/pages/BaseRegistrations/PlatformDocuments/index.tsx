// src/pages/BaseRegistrations/PlatformDocuments/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de Termos e Condições (PlatformDocument) — Cadastros Base /
// Configurações, execução 032, TASK-FE-2501. "Settings-form de registro
// singleton" (mesma família estrutural de `TenantParameters/index.tsx`), MAS
// SEM `react-hook-form`/Lei 2 — não há nenhum campo de texto/select editável
// nesta tela, só 2 seletores de arquivo independentes, cada um com sua
// própria ação de salvar. O `File` staged fica em `useState` local, não em
// RHF (ver "Decisão estrutural", contrato de tela §"Leitura do dev").
//
// Passo UX (contrato de tela §2): UX-GAP declarado — o `cerne` nunca desenhou
// nenhuma tela de gestão de documentos institucionais, só o componente
// `FileUpload.stories.tsx`. Casca adaptada: `FormContainer` (SEM `footer` —
// cada card resolve sua própria ação, ver §4 do contrato), card
// `Box`/`Heading` mirror EXATO de `TenantParameters/index.tsx:143-146`.
//
// 2 cards INDEPENDENTES ("Termos de Uso AGRO365" / "Políticas de Privacidade
// AGRO365") — NÃO abstraídos em componente compartilhado ENTRE MÓDULOS (mesmo
// racional do contrato de API §6), mas extraídos em subcomponente LOCAL
// (`PlatformDocumentCard`, não exportado) para não duplicar ~40 linhas de
// JSX idênticas 2x dentro do MESMO arquivo (recomendação não-bloqueante do
// contrato de tela §4.2).
//
// Catálogo GLOBAL (sem `X-Farm-Id`, sem guard de `hasFarm`) — primeira tela
// "settings-form de registro único" GLOBAL do fork (contrato de tela §3).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Flex, Heading, Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import {
  getPlatformDocuments,
  uploadPrivacyPolicy,
  uploadTermsOfUse,
} from '@/services/v2/BaseRegistrations/platformDocuments-service';

import type { PlatformDocumentEntry } from '@/@types/v2/BaseRegistrations/platformDocuments';

// Subcomponente LOCAL — não exportado, reusado 2x dentro deste arquivo (ver
// cabeçalho). Card com borda/título mirror `TenantParameters/index.tsx`.
interface PlatformDocumentCardProps {
  title: string;
  hint: string;
  entry: PlatformDocumentEntry | undefined;
  loading: boolean;
  stagedFile: File | null;
  onFileSelected: (file: File | null) => void;
  onRemove: () => void;
  onSave: () => void;
  saving: boolean;
  canUpload: boolean;
  emptyStateLabel: string;
  uploadedAtLabel: string;
  uploadedAtWithAuthorLabel: string;
  saveLabel: string;
}

function PlatformDocumentCard({
  title,
  hint,
  entry,
  loading,
  stagedFile,
  onFileSelected,
  onRemove,
  onSave,
  saving,
  canUpload,
  emptyStateLabel,
  uploadedAtLabel,
  uploadedAtWithAuthorLabel,
  saveLabel,
}: PlatformDocumentCardProps) {
  const metadataLabel = entry?.uploaded_at
    ? entry.uploaded_by_name
      ? uploadedAtWithAuthorLabel
          .replace('{date}', formatDate(entry.uploaded_at))
          .replace('{author}', entry.uploaded_by_name)
      : uploadedAtLabel.replace('{date}', formatDate(entry.uploaded_at))
    : emptyStateLabel;

  return (
    <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={4} mb={6}>
      <Heading size="sm" mb={4}>
        {title}
      </Heading>

      {loading ? (
        <Skeleton height="88px" borderRadius="lg" />
      ) : (
        <VStack align="stretch" gap={3}>
          <FileUpload
            hint={hint}
            accept=".pdf"
            maxSizeMb={2}
            file={stagedFile}
            onFileSelected={onFileSelected}
            onRemove={onRemove}
            currentFileUrl={entry?.url}
            currentFileName={entry?.original_filename ?? undefined}
            disabled={!canUpload || saving}
            // AF #36: a API não expõe DELETE para o documento já persistido
            // (só GET + 2 POST dedicados, ver platformDocuments-service.ts) —
            // exibir "Remover" para o arquivo já existente era um botão sem
            // efeito real (onRemove só limpava o `stagedFile`, que já é
            // `null` nesse estado). Só "Substituir" fica disponível até a API
            // ganhar um endpoint de remoção real (GAP-FE-250).
            allowRemoveExisting={false}
          />
          <Text fontSize="sm" color="fg.muted">
            {metadataLabel}
          </Text>
          <Flex justifyContent="flex-end">
            <Button
              title={saveLabel}
              type="button"
              onClick={onSave}
              loading={saving}
              disabled={!stagedFile || saving || !canUpload}
            />
          </Flex>
        </VStack>
      )}
    </Box>
  );
}

export default function PlatformDocuments() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.platformDocuments;

  const canUpload = can('terms_create');

  const query = useQuery({
    queryKey: [queryKey.baseRegistrations.platformDocuments],
    queryFn: () => getPlatformDocuments().then((r) => r.data),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [termsOfUseFile, setTermsOfUseFile] = useState<File | null>(null);
  const [privacyPolicyFile, setPrivacyPolicyFile] = useState<File | null>(null);

  const uploadTermsOfUseMutation = useRequest({
    asyncFunction: uploadTermsOfUse,
    entityName: text.cards.termsOfUse.title,
    queryKey: queryKey.baseRegistrations.platformDocuments,
    typesRequest: 'update',
    actionSuccess: () => setTermsOfUseFile(null),
  });

  const uploadPrivacyPolicyMutation = useRequest({
    asyncFunction: uploadPrivacyPolicy,
    entityName: text.cards.privacyPolicy.title,
    queryKey: queryKey.baseRegistrations.platformDocuments,
    typesRequest: 'update',
    actionSuccess: () => setPrivacyPolicyFile(null),
  });

  return (
    <FormContainer title={text.page.title} subtitle={text.page.subtitle} showDivider>
      {query.isError ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.errors.loadFailed.title}</EmptyState.Title>
              <EmptyState.Description>{text.errors.loadFailed.description}</EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <PlatformDocumentCard
            title={text.cards.termsOfUse.title}
            hint={text.cards.termsOfUse.uploadHint}
            entry={query.data?.terms_of_use}
            loading={query.isPending}
            stagedFile={termsOfUseFile}
            onFileSelected={setTermsOfUseFile}
            onRemove={() => setTermsOfUseFile(null)}
            onSave={() => termsOfUseFile && uploadTermsOfUseMutation.mutate(termsOfUseFile)}
            saving={uploadTermsOfUseMutation.isPending}
            canUpload={canUpload}
            emptyStateLabel={text.cards.termsOfUse.emptyState}
            uploadedAtLabel={text.cards.termsOfUse.uploadedAt}
            uploadedAtWithAuthorLabel={text.cards.termsOfUse.uploadedAtWithAuthor}
            saveLabel={languageGB.defaltStrings.save}
          />
          <PlatformDocumentCard
            title={text.cards.privacyPolicy.title}
            hint={text.cards.privacyPolicy.uploadHint}
            entry={query.data?.privacy_policy}
            loading={query.isPending}
            stagedFile={privacyPolicyFile}
            onFileSelected={setPrivacyPolicyFile}
            onRemove={() => setPrivacyPolicyFile(null)}
            onSave={() =>
              privacyPolicyFile && uploadPrivacyPolicyMutation.mutate(privacyPolicyFile)
            }
            saving={uploadPrivacyPolicyMutation.isPending}
            canUpload={canUpload}
            emptyStateLabel={text.cards.privacyPolicy.emptyState}
            uploadedAtLabel={text.cards.privacyPolicy.uploadedAt}
            uploadedAtWithAuthorLabel={text.cards.privacyPolicy.uploadedAtWithAuthor}
            saveLabel={languageGB.defaltStrings.save}
          />
        </>
      )}
    </FormContainer>
  );
}
