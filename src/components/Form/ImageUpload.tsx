// src/components/Form/ImageUpload.tsx
// -----------------------------------------------------------------------------
// Upload de imagem SINGLE-FILE com preview/trocar/remover — TASK-FE-FE-02
// (Família de Bens: campo `image`, upload multipart inline).
//
// Sem precedente single-image no catálogo real do projeto (`Perfil` não tem
// avatar; `Branding` é um serviço com endpoint DEDICADO, não um componente de
// tela — ver `src/services/v2/Branding/branding-service.ts`). Adaptado da
// dropzone `src/components/ui/FileUpload.tsx` do design system `cerne`
// (`ux_root`, commit `73b5fa86`) — mesma linguagem visual (ícone de upload,
// borda tracejada, mensagens de tipo/tamanho aceitos, erro `role="alert"`),
// SIMPLIFICADO para 1 arquivo (o `cerne` é multi-arquivo, `files:
// UploadedFile[]` — não reaproveitável 1:1 para o campo `image` deste
// contrato). Tokens da SPA (`bg.muted`/`border.subtle`/`fg.muted`/`fg.error`),
// não os tokens `t.*` do `cerne` — adaptação, não cópia.
//
// Validação client-side ANTES de aceitar o arquivo (tipo + tamanho) — mesmos
// limites do backend (`mimes:jpeg,png,jpg,gif,svg`, `max:2048` = 2MB,
// `FamilyEquipmentRequest::rules()`), para feedback imediato sem round-trip.
//
// Zero string hardcoded (checklist item 9): todos os textos visíveis são
// props opcionais — o caller (`CreateOrUpdateFamiliaBens.tsx`) sempre passa
// os textos via `languageGB.familyEquipments.familyEquipment.form.image.*`.
// Os defaults abaixo só existem para o componente não quebrar caso um
// consumidor futuro esqueça de passá-los — nunca renderizados em produção
// neste módulo.
//
// TASK-FE-811 (Usuários, Execução 027) — `onRemove` tornado OPCIONAL. O DTO
// `photo` de User (`UserRequest::rules()`) não tem `remove_photo`/
// `remove_image` — diferente de Marker/FamilyEquipment, a API não tem como
// limpar uma foto já definida por este endpoint. Ativar o botão "Remover"
// mesmo assim criaria uma falsa promessa: o clique zeraria só o preview
// local, mas o `photo` full-resource-replace nunca é enviado quando
// `photoFile` é `null` (preserva a foto atual no servidor) — ao recarregar o
// formulário, a foto "removida" reapareceria, uma inconsistência de UX que o
// contrato de tela pediu para EVITAR (§3.4.2: "sem fluxo de remoção
// funcional"). Quando o caller não passa `onRemove`, o botão "Remover"
// simplesmente não é renderizado (só "Trocar") — os 3 callers existentes
// (Marker/FamilyEquipment/Fazenda) continuam passando `onRemove` normalmente,
// comportamento deles inalterado.
// -----------------------------------------------------------------------------

import { useEffect, useId, useRef, useState } from 'react';

import { Box, Flex, Icon, Image, Text } from '@chakra-ui/react';
import { FiImage, FiUpload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ImageEditorDialog, type ImageEditorStrings } from '@/components/ui/ImageEditorDialog';

import { useLanguage } from '@/hooks/useLanguage';

import { Field } from './Field';

export interface ImageUploadProps {
  label?: string;
  /** Texto de dica (formatos/tamanho aceitos) — exibido abaixo do campo. */
  hint?: string;
  error?: string;
  /** Indicador visual de obrigatoriedade (asterisco no label), mirror `Field.isRequired` — TASK-FE-712/AP-38. */
  isRequired?: boolean;
  /** Mirror do `mimes` aceito pela API — ex.: "image/jpeg,image/png,image/jpg,image/gif,image/svg+xml". */
  accept?: string;
  /** Mirror do `max:2048` (KB) da API — em MB (default 2). */
  maxSizeMb?: number;
  /** `image_url` do Resource, em edição — mostrado quando nenhum `file` novo foi escolhido. */
  currentImageUrl?: string | null;
  /** Arquivo novo selecionado nesta sessão (ainda não enviado). */
  file?: File | null;
  onFileSelected: (file: File | null) => void;
  /**
   * Seta a flag `removeImage`/`remove_image` no form pai — limpa preview
   * local e imagem atual. OPCIONAL (TASK-FE-811): quando omitido, o botão
   * "Remover" não é renderizado — uso em telas cujo DTO não suporta limpar a
   * imagem (ver nota de cabeçalho do arquivo).
   */
  onRemove?: () => void;
  disabled?: boolean;
  /** Textos i18n (sempre fornecidos pelo caller — ver nota de cabeçalho). */
  dropzoneTitle?: string;
  dropzoneDraggingTitle?: string;
  changeLabel?: string;
  removeLabel?: string;
  errorTypeMessage?: string;
  errorSizeMessage?: string;
  /** Placeholder quando a imagem atual falha ao carregar (default: `defaltStrings.noPhoto`). */
  noImageLabel?: string;
  /**
   * Textos da modal "Editar imagem" (recorte/escala/rotação). Quando informado, clicar na área de
   * upload ou em "Trocar" abre a modal em vez do seletor de arquivos do sistema; o resultado
   * (PNG recortado) passa pela mesma validação de tipo/tamanho.
   */
  editor?: ImageEditorStrings;
}

export function ImageUpload({
  label,
  hint,
  error,
  isRequired,
  accept = 'image/jpeg,image/png,image/jpg,image/gif,image/svg+xml',
  maxSizeMb = 2,
  currentImageUrl,
  file,
  onFileSelected,
  onRemove,
  disabled = false,
  dropzoneTitle = 'Drag an image or click to select',
  dropzoneDraggingTitle = 'Drop the image here',
  changeLabel = 'Change image',
  removeLabel = 'Remove image',
  errorTypeMessage = 'File type not accepted.',
  errorSizeMessage = 'File exceeds the maximum size.',
  noImageLabel,
  editor,
}: ImageUploadProps) {
  const { languageGB } = useLanguage();
  const [imageFailed, setImageFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | undefined>(undefined);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const errorId = useId();
  const [editorOpen, setEditorOpen] = useState(false);

  // Preview do arquivo novo (objectURL) — revogado em cleanup para não
  // vazar memória (mesma disciplina documentada na dropzone do `cerne`).
  useEffect(() => {
    if (!file) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayError = error || clientError;
  const previewSrc = file ? localPreviewUrl : currentImageUrl;

  // Reseta o estado de falha sempre que a fonte da imagem muda.
  useEffect(() => {
    setImageFailed(false);
  }, [previewSrc]);

  const hasImage = !!previewSrc;

  function acceptedExtensions(): string[] {
    return accept.split(',').map((entry) => entry.trim().toLowerCase());
  }

  function isAcceptedType(candidate: File): boolean {
    const exts = acceptedExtensions();
    if (exts.length === 0) return true;
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
    if (disabled) return;
    if (editor) setEditorOpen(true);
    else inputRef.current?.click();
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
    onRemove?.();
  }

  const fileSizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(2).replace('.', ',')} MB` : null;

  return (
    <Field label={label} errorText={displayError} isRequired={isRequired}>
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

      {/* Metade da largura em telas largas (campo de logo/foto não precisa de linha inteira). */}
      <Box w="full" maxW={{ base: 'full', lg: '50%' }}>
        {hasImage ? (
          // Visualização (edição de cadastro já existente ou arquivo recém-escolhido)
          <Flex
            align="center"
            gap={4}
            p={4}
            borderWidth="1px"
            borderColor={displayError ? 'fg.error' : 'border.subtle'}
            borderRadius="xl"
            bg="bg.subtle"
            opacity={disabled ? 0.6 : 1}
          >
            {imageFailed ? (
              <Flex
                role="img"
                aria-label={noImageLabel ?? languageGB.defaltStrings.noPhoto}
                direction="column"
                align="center"
                justify="center"
                gap={1}
                boxSize="24"
                flexShrink={0}
                borderRadius="lg"
                bg="bg.muted"
                borderWidth="1px"
                borderColor="border.subtle"
              >
                <Icon as={FiImage} boxSize={6} color="fg.muted" />
                <Text fontSize="2xs" color="fg.muted" textAlign="center" lineHeight="1.1">
                  {noImageLabel ?? languageGB.defaltStrings.noPhoto}
                </Text>
              </Flex>
            ) : (
              <Image
                src={previewSrc ?? undefined}
                alt={label ?? 'image'}
                boxSize="24"
                flexShrink={0}
                borderRadius="lg"
                objectFit="cover"
                bg="bg.muted"
                borderWidth="1px"
                borderColor="border.subtle"
                onError={() => setImageFailed(true)}
              />
            )}

            <Flex direction="column" gap={3} minW={0} flex="1">
              {(file || hint) && (
                <Box minW={0}>
                  {file && (
                    <Text fontSize="sm" fontWeight="semibold" truncate>
                      {file.name}
                    </Text>
                  )}
                  <Text fontSize="xs" color="fg.muted">
                    {fileSizeLabel ?? hint}
                  </Text>
                </Box>
              )}
              <Flex gap={2} wrap="wrap">
                <Button title={changeLabel} variant="outline" onClick={openPicker} disabled={disabled} />
                {onRemove && (
                  <Button title={removeLabel} variant="ghost_danger" onClick={handleRemoveClick} disabled={disabled} />
                )}
              </Flex>
            </Flex>
          </Flex>
        ) : (
          // Vazio: área de arrastar e soltar tracejada
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
            gap={3}
            px={6}
            py={8}
            border="2px dashed"
            borderColor={displayError ? 'fg.error' : dragOver ? 'brandColorText' : 'semanticNeutral.300'}
            borderRadius="xl"
            bg={dragOver ? 'bg.muted' : disabled ? 'bg.disabled' : 'bg.subtle'}
            cursor={disabled ? 'not-allowed' : 'pointer'}
            opacity={disabled ? 0.6 : 1}
            transition="border-color 0.2s, background 0.2s"
            _hover={disabled ? undefined : { borderColor: 'green.600', bg: 'bg.muted' }}
          >
            <Flex
              align="center"
              justify="center"
              boxSize="12"
              borderRadius="lg"
              bg="cardBG"
              borderWidth="1px"
              borderColor="border.subtle"
              boxShadow="sm"
            >
              <Icon as={dragOver ? FiUpload : FiImage} boxSize={5} color="fg.default" />
            </Flex>
            <Box textAlign="center">
              <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                {dragOver ? dropzoneDraggingTitle : dropzoneTitle}
              </Text>
              {hint && (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {hint}
                </Text>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {editor && (
        <ImageEditorDialog
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialFile={file}
          accept={accept}
          strings={editor}
          onSave={(edited) => {
            setEditorOpen(false);
            validateAndSelect(edited);
          }}
        />
      )}

      {displayError && (
        <Text id={errorId} role="alert" aria-live="polite" fontSize="xs" color="fg.error" mt={1}>
          {displayError}
        </Text>
      )}
    </Field>
  );
}
