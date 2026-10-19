// src/components/Form/FileUpload.tsx
// -----------------------------------------------------------------------------
// Upload de arquivo GENÉRICO (não-imagem), single-file — TASK-PA-08 (Plano de
// Contas: import Excel).
//
// 1º upload de arquivo genérico da SPA — mesma linhagem de
// `src/components/Form/ImageUpload.tsx` (que já adaptou o `FileUpload.tsx` do
// design system `cerne`, `ux_root`/`components/ui/FileUpload.tsx`, para o
// campo `image` de Família de Bens), MAS sem preview de imagem: mostra um
// chip com ícone de arquivo + nome + tamanho + ações de trocar/remover.
// Ícone de dropzone genérico (`FiFileText`), mesma linguagem visual (borda
// tracejada, drag states, erro `role="alert"`), tokens da SPA
// (`bg.muted`/`border.subtle`/`fg.muted`/`fg.error`) — adaptação, não cópia
// do kit próprio do `cerne` (tokens `t.*`).
//
// Validação client-side ANTES de aceitar o arquivo (extensão + tamanho) —
// espelha o limite REAL do backend (`ImportPlanAccountRequest::rules()`,
// `mimes:xlsx` + `max:10240` KB = 10MB), mesma disciplina de `ImageUpload.tsx`
// (feedback imediato sem round-trip).
//
// Zero string hardcoded (checklist item 9): todos os textos visíveis são
// props opcionais — o caller (`PlanAccountImportModal.tsx`) sempre passa via
// `languageGB.planAccounts.planAccount.excel.import.*`. Os defaults abaixo só
// existem para o componente não quebrar caso um consumidor futuro esqueça de
// passá-los — nunca renderizados em produção neste módulo.
//
// EXTENSÃO ADITIVA (TASK-FE-432, Afiliados/Partner) — props NOVAS opcionais
// `currentFileUrl`/`currentFileName`, mirror `ImageUpload.currentImageUrl`
// (`Fazendas/steps/StepIdentificacao.tsx`). Introduz um 3º estado visual
// ("arquivo já existente", edição de Afiliado com `contract_file` != null):
// quando `currentFileUrl` está presente E nenhum `file` novo foi selecionado
// nesta sessão, mostra um chip com o nome do arquivo atual (link para
// abrir/baixar) + botões "Substituir" (`replaceLabel`, abre o mesmo picker de
// `openPicker()`) e "Remover" (`removeLabel`, chama o MESMO `onRemove()` — o
// caller decide se marca `remove_contract_file: true` ou limpa o vínculo,
// conforme seu próprio estado local). 100% retrocompatível: o único
// consumidor existente (`PlanAccountImportModal.tsx`) não passa
// `currentFileUrl`, então `hasExistingFile` é sempre `false` e o componente
// se comporta EXATAMENTE como antes.
// -----------------------------------------------------------------------------

import { useId, useRef, useState } from 'react';

import { Box, Flex, Icon, Link, Text } from '@chakra-ui/react';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { IconButtonTable } from '@/components/IconButtonTable';

import { Field } from './Field';

export interface FileUploadProps {
  label?: string;
  /** Texto de dica (formatos/tamanho aceitos) — exibido abaixo do campo. */
  hint?: string;
  error?: string;
  /** Mirror da extensão aceita pela API — ex.: ".xlsx". */
  accept?: string;
  /** Mirror do `max:10240` (KB) da API — em MB (default 10, Seção 11.9.2 do contrato). */
  maxSizeMb?: number;
  /** Arquivo selecionado nesta sessão (ainda não enviado). */
  file?: File | null;
  onFileSelected: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
  /** URL do arquivo JÁ EXISTENTE (edição) — mirror `ImageUpload.currentImageUrl`. Ignorado quando `file` (novo) está presente. */
  currentFileUrl?: string | null;
  /** Nome de exibição do arquivo já existente (ex.: "contrato.pdf") — se ausente, extraído do último segmento de `currentFileUrl`. */
  currentFileName?: string;
  /**
   * Controla se o botão "Remover" aparece no 3º estado (arquivo JÁ existente
   * no servidor, sem `file` novo selecionado). Default `true` (comportamento
   * histórico, mantido para os consumidores já existentes de
   * `currentFileUrl`). Passe `false` quando o backend NÃO expõe uma forma de
   * remover o arquivo persistido (só substituição via novo upload) — nesse
   * caso exibir "Remover" seria uma ação sem efeito real (AF #36, Termos e
   * Condições: o botão aparecia mas nada acontecia, pois `onRemove` só
   * limpava um `file` staged que já era `null` nesse estado). Quando `false`,
   * só "Substituir" (`replaceLabel`) fica disponível para o arquivo existente
   * — arquivo novo staged (1º/2º estado) continua removível normalmente.
   */
  allowRemoveExisting?: boolean;
  /** Textos i18n (sempre fornecidos pelo caller — ver nota de cabeçalho). */
  dropzoneTitle?: string;
  dropzoneDraggingTitle?: string;
  changeLabel?: string;
  removeLabel?: string;
  /** Rótulo do botão que abre o picker quando já existe um arquivo no servidor (3º estado, TASK-FE-432). */
  replaceLabel?: string;
  /** Rótulo/prefixo do chip do arquivo já existente (ex.: "Contrato atual"). */
  existingFileLabel?: string;
  errorTypeMessage?: string;
  errorSizeMessage?: string;
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.substring(path.lastIndexOf('/') + 1) || url;
  } catch {
    return url.substring(url.lastIndexOf('/') + 1) || url;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  label,
  hint,
  error,
  accept = '.xlsx',
  maxSizeMb = 10,
  file,
  onFileSelected,
  onRemove,
  disabled = false,
  currentFileUrl,
  currentFileName,
  allowRemoveExisting = true,
  dropzoneTitle = 'Drag a file or click to select',
  dropzoneDraggingTitle = 'Drop the file here',
  changeLabel = 'Change file',
  removeLabel = 'Remove file',
  replaceLabel = 'Replace file',
  existingFileLabel = 'Current file',
  errorTypeMessage = 'File type not accepted.',
  errorSizeMessage = 'File exceeds the maximum size.',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | undefined>(undefined);
  const errorId = useId();

  const displayError = error || clientError;
  const hasFile = !!file;
  // 3º estado (TASK-FE-432) — arquivo já existente no servidor, SEM arquivo
  // novo selecionado nesta sessão. `hasFile` sempre vence (arquivo novo
  // recém-escolhido tem prioridade visual sobre o existente).
  const hasExistingFile = !hasFile && !!currentFileUrl;

  function acceptedExtensions(): string[] {
    return accept.split(',').map((entry) => entry.trim().toLowerCase());
  }

  function isAcceptedType(candidate: File): boolean {
    const exts = acceptedExtensions();
    if (exts.length === 0) return true;
    // ADITIVO (esteira 038, Baixa de Estoque — bloco de anexos genérico, sem
    // restrição de tipo no legado/backend, só `max:10240` KB) — `accept="*"`
    // aceita QUALQUER tipo de arquivo. 100% retrocompatível: nenhum dos ~15
    // consumidores existentes passa `"*"` (todos usam extensão concreta,
    // ex.: ".xlsx"), então este ramo nunca era alcançável antes.
    if (exts.includes('*')) return true;
    return exts.some((ext) => {
      if (ext.startsWith('.')) return candidate.name.toLowerCase().endsWith(ext);
      if (ext.endsWith('/*')) return candidate.type.startsWith(ext.replace('/*', '/'));
      return candidate.type === ext;
    });
  }

  function validateAndSelect(candidate: File) {
    if (!isAcceptedType(candidate)) {
      setClientError(errorTypeMessage);
      return;
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      setClientError(errorSizeMessage);
      return;
    }
    setClientError(undefined);
    onFileSelected(candidate);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) validateAndSelect(selected);
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) validateAndSelect(dropped);
  }

  function handleRemoveClick() {
    setClientError(undefined);
    onRemove();
  }

  return (
    <Field label={label} helperText={hint} errorText={displayError}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {hasFile ? (
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          bg="bg.subtle"
        >
          <Icon as={FiFileText} boxSize={5} color="fg.muted" flexShrink={0} />
          <Flex direction="column" flex={1} minW={0} gap={0}>
            <Text fontSize="sm" fontWeight="medium" lineClamp="1" title={file?.name}>
              {file?.name}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {file ? formatFileSize(file.size) : ''}
            </Text>
          </Flex>
          <Flex gap={2} flexShrink={0}>
            <Button
              title={changeLabel}
              variant="outline"
              onClick={openPicker}
              disabled={disabled}
            />
            {/* Ícone-somente (mirror `IconButtonTable` já usado no módulo, ex.
                `ChargeDocumentsModal.tsx` linha do `FiTrash2`, e do `IconButton`
                do FileUpload de referência em `cerne`) — TASK-PA-CG-045-FIX-B:
                o antigo `Button` title+icon (`FiX` `fontSize="2xl"` colado ao
                rótulo "Remover arquivo") não tinha largura previsível; em
                idiomas com rótulo mais longo o X ultrapassava a borda
                arredondada do chip. Ícone-only tem footprint fixo e nunca
                depende do tamanho da tradução. */}
            <IconButtonTable
              aria-label={removeLabel}
              mensegerTooltip={removeLabel}
              variant="ghost"
              color="red.500"
              size="sm"
              onClick={handleRemoveClick}
              disabled={disabled}
            >
              <Icon as={FiX} />
            </IconButtonTable>
          </Flex>
        </Flex>
      ) : hasExistingFile ? (
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          bg="bg.subtle"
        >
          <Icon as={FiFileText} boxSize={5} color="fg.muted" flexShrink={0} />
          <Flex direction="column" flex={1} minW={0} gap={0}>
            <Text fontSize="xs" color="fg.muted">
              {existingFileLabel}
            </Text>
            <Link
              href={currentFileUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              fontWeight="medium"
              lineClamp={1}
              title={
                currentFileName ?? (currentFileUrl ? fileNameFromUrl(currentFileUrl) : undefined)
              }
            >
              {currentFileName ?? (currentFileUrl ? fileNameFromUrl(currentFileUrl) : '')}
            </Link>
          </Flex>
          <Flex gap={2} flexShrink={0}>
            <Button
              title={replaceLabel}
              variant="outline"
              onClick={openPicker}
              disabled={disabled}
            />
            {/* Ícone-somente — mesma correção do chip "arquivo novo" acima
                (TASK-PA-CG-045-FIX-B). Condicionado a `allowRemoveExisting`
                (AF #36, Termos e Condições): quando o backend não expõe
                DELETE para o arquivo já persistido, exibir "Remover" aqui
                seria um botão sem efeito real — só "Substituir" fica
                disponível nesse caso. */}
            {allowRemoveExisting && (
              <IconButtonTable
                aria-label={removeLabel}
                mensegerTooltip={removeLabel}
                variant="ghost"
                color="red.500"
                size="sm"
                onClick={handleRemoveClick}
                disabled={disabled}
              >
                <Icon as={FiX} />
              </IconButtonTable>
            )}
          </Flex>
        </Flex>
      ) : (
        <Box
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label ?? dropzoneTitle}
          aria-disabled={disabled}
          aria-describedby={displayError ? errorId : undefined}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          px={4}
          py={6}
          border="1.5px dashed"
          borderColor={displayError ? 'fg.error' : dragOver ? 'brandColorText' : 'border.subtle'}
          borderRadius="lg"
          bg={dragOver ? 'bg.muted' : disabled ? 'bg.disabled' : 'bg.subtle'}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.6 : 1}
          transition="border-color 0.2s, background 0.2s"
        >
          <Icon as={dragOver ? FiUpload : FiFileText} boxSize={6} color="fg.muted" />
          <Text fontSize="sm" fontWeight="medium" color="fg.default" textAlign="center">
            {dragOver ? dropzoneDraggingTitle : dropzoneTitle}
          </Text>
        </Box>
      )}

      {displayError && (
        <Text id={errorId} role="alert" aria-live="polite" fontSize="xs" color="fg.error" mt={1}>
          {displayError}
        </Text>
      )}
    </Field>
  );
}
