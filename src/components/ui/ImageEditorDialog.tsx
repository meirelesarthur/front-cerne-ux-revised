// src/components/ui/ImageEditorDialog.tsx
// Modal "Editar imagem" (referência de UX do pedido): prévia quadrada do recorte, régua de escala,
// girar à esquerda/direita e escolher outro arquivo. Ao salvar devolve um `File` PNG já recortado
// (quadrado, `outputSize` px) — quem usa decide o que fazer com ele (ex.: enviar como logo).
// Tudo no navegador (canvas), sem dependência nova. Textos sempre por props (i18n no chamador).

import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { FiImage, FiRotateCcw, FiRotateCw } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

export interface ImageEditorStrings {
  title: string;
  /** Dica de formato/tamanho mínimo, ao lado da prévia. */
  hint: string;
  scaleLabel: string;
  rotateLabel: string;
  rotateLeft: string;
  rotateRight: string;
  uploadLabel: string;
  browse: string;
  /** Texto da prévia enquanto não há imagem. */
  empty: string;
  cancel: string;
  save: string;
  errorLoad: string;
}

export interface ImageEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recebe o recorte final (PNG quadrado). */
  onSave: (file: File) => void;
  strings: ImageEditorStrings;
  /** Imagem inicial (ex.: a já escolhida na sessão). */
  initialFile?: File | null;
  accept?: string;
  /** Lado do PNG exportado, em px. */
  outputSize?: number;
  /** Nome do arquivo gerado (sem extensão). */
  fileName?: string;
}

const PREVIEW_SIZE = 240;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export function ImageEditorDialog({
  isOpen,
  onClose,
  onSave,
  strings,
  initialFile = null,
  accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml',
  outputSize = 512,
  fileName = 'imagem',
}: ImageEditorDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
        setScale(MIN_SCALE);
        setRotation(0);
        setError(null);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setError(strings.errorLoad);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [strings.errorLoad]
  );

  // A cada abertura recomeça do zero (ou da imagem já escolhida).
  useEffect(() => {
    if (!isOpen) return;
    setImage(null);
    setScale(MIN_SCALE);
    setRotation(0);
    setError(null);
    if (initialFile) loadFile(initialFile);
  }, [isOpen, initialFile, loadFile]);

  const draw = useCallback(
    (canvas: HTMLCanvasElement, size: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      if (!image) return;
      const odd = (rotation / 90) % 2 !== 0;
      const w = odd ? image.naturalHeight : image.naturalWidth;
      const h = odd ? image.naturalWidth : image.naturalHeight;
      // "cover": o menor lado do recorte preenche o quadrado; a régua amplia a partir daí.
      const s = (size / Math.min(w, h)) * scale;
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        (-image.naturalWidth * s) / 2,
        (-image.naturalHeight * s) / 2,
        image.naturalWidth * s,
        image.naturalHeight * s
      );
    },
    [image, scale, rotation]
  );

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, PREVIEW_SIZE * 2);
  }, [draw, isOpen, image]);

  function handleSave() {
    const out = document.createElement('canvas');
    draw(out, outputSize);
    out.toBlob((blob) => {
      if (!blob) {
        setError(strings.errorLoad);
        return;
      }
      onSave(new File([blob], `${fileName}.png`, { type: 'image/png' }));
    }, 'image/png');
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={strings.title}
      size="lg"
      footer={
        <>
          <Button title={strings.cancel} variant="secondary" onClick={onClose} />
          <Button title={strings.save} variant="solid" onClick={handleSave} disabled={!image} />
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) loadFile(selected);
          e.target.value = '';
        }}
      />

      <Flex gap={6} direction={{ base: 'column', sm: 'row' }} align={{ base: 'center', sm: 'flex-start' }}>
        {/* Prévia = exatamente o que será exportado */}
        <Box
          position="relative"
          boxSize={`${PREVIEW_SIZE}px`}
          flexShrink={0}
          borderRadius="lg"
          borderWidth="2px"
          borderColor="fg.default"
          bg="bg.muted"
          overflow="hidden"
        >
          <canvas
            ref={canvasRef}
            aria-label={strings.title}
            style={{ width: '100%', height: '100%', display: image ? 'block' : 'none' }}
          />
          {!image && (
            <Flex direction="column" align="center" justify="center" gap={2} h="full" px={4} color="fg.muted">
              <Icon as={FiImage} boxSize={7} />
              <Text fontSize="sm" textAlign="center">
                {strings.empty}
              </Text>
            </Flex>
          )}
        </Box>

        <Flex direction="column" gap={5} flex="1" minW={0} w="full">
          <Text fontSize="sm" color="fg.muted">
            {strings.hint}
          </Text>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              {strings.scaleLabel}
            </Text>
            <Flex align="center" gap={3}>
              <Icon as={FiImage} boxSize={3} aria-hidden="true" />
              <input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={scale}
                aria-label={strings.scaleLabel}
                disabled={!image}
                onChange={(e) => setScale(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--chakra-colors-green-600)' }}
              />
              <Icon as={FiImage} boxSize={5} aria-hidden="true" />
            </Flex>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              {strings.rotateLabel}
            </Text>
            <Flex gap={2}>
              <IconButton
                aria-label={strings.rotateLeft}
                title={strings.rotateLeft}
                variant="ghost"
                size="sm"
                disabled={!image}
                onClick={() => setRotation((r) => (r + 270) % 360)}
              >
                <Icon as={FiRotateCcw} />
              </IconButton>
              <IconButton
                aria-label={strings.rotateRight}
                title={strings.rotateRight}
                variant="ghost"
                size="sm"
                disabled={!image}
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <Icon as={FiRotateCw} />
              </IconButton>
            </Flex>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              {strings.uploadLabel}
            </Text>
            <Button title={strings.browse} variant="outline" onClick={() => inputRef.current?.click()} />
          </Box>

          {error && (
            <Text role="alert" fontSize="xs" color="fg.error">
              {error}
            </Text>
          )}
        </Flex>
      </Flex>
    </CustomDialog>
  );
}

export default ImageEditorDialog;
