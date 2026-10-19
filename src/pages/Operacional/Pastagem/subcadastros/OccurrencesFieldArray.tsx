// src/pages/Operacional/Pastagem/subcadastros/OccurrencesFieldArray.tsx
// -----------------------------------------------------------------------------
// Aba "Ocorrências" — TASK-PAST-FE-05 + TASK-PAST-FIX-FE-02 (fecha
// GAP-PAST-FE-02). `useFieldArray` de `occurrences` (sem limite de linhas —
// o limite de 3 é sobre IMAGENS por ocorrência). Prioridade default Média
// (`priorityOptions.defaultOption`). Botão adicionar SEMPRE visível
// (CLM-52).
//
// TASK-PAST-FIX-FE-02c (decisão do dono, correção de fidelidade) — CLM-53:
// a Action só persiste a linha se `recommendation` não for vazio (fiel ao
// legado, `agro365/.../PastureController@store/@update`). "Recomendação"
// vira visualmente obrigatória (asterisco) quando a linha JÁ TEM CONTEÚDO
// (diagnóstico preenchido e/ou ≥1 imagem) — validado por
// `pasture-schema.ts#occurrenceItemSchema` (`.test`), que BLOQUEIA o
// submit com erro inline neste campo + toaster específico (`onInvalid` em
// `CreateOrUpdatePastagem.tsx`) em vez de deixar o backend descartar a
// linha em silêncio (perdendo a imagem sem o usuário entender o motivo).
// Linha TOTALMENTE vazia (sem imagem/diagnóstico/recomendação) nunca
// bloqueia — passa a validação e é ignorada no submit.
//
// TASK-PAST-FIX-FE-02 — upload de imagem NOVA habilitado, mirror EXATO da
// UI já em produção de `AppropriationOccurrencesTab.tsx` (feature irmã,
// mesma aba "Ocorrências"): input de arquivo oculto por `useRef`, slot
// "+ Adicionar" (até 3 por ocorrência), preview real via
// `URL.createObjectURL(file)` (nova) / `<Image src={existingUrl}>`
// (persistida), trocar (replace = novo `onChange` no mesmo índice) e
// remover. A ÚNICA diferença de Appropriations é o SHAPE de envio: Pastagem
// converte a imagem nova para data URI base64 no submit
// (`CreateOrUpdatePastagem.tsx#buildOccurrencesPayload`, `fileToDataUri`) —
// SEM multipart, porque o payload de Pastagem é JSON único (5 subcadastros
// aninhados no mesmo POST/PUT). Validação de tipo/tamanho no cliente ANTES
// de aceitar o arquivo (mirror `get_pwa_file_upload_and_export_pattern §1`),
// feedback via `toaster` — nunca `alert()`.
// -----------------------------------------------------------------------------

import type { ChangeEvent, ElementType } from 'react';
import { useRef } from 'react';

import { Box, Flex, Icon, Image, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { FiFileText, FiPlus, FiRefreshCw, FiTrash2, FiUpload, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { priorityOptions } from '@/constants/pastures/options/priority-options';

import type { PastureForm } from '@/@types/v2/Pastures';

import type { Control, FieldErrors } from 'react-hook-form';

export interface OccurrencesFieldArrayProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  isLoading: boolean;
  canSave: boolean;
}

const MAX_IMAGES_PER_OCCURRENCE = 3;
// Limite conservador — o backend ainda não confirmou o teto de tamanho de
// body aceito para o payload JSON único (post_max_size/upload_max_filesize/
// limites Nginx-Laravel, ver dependência da Tarefa). Assunção a confirmar,
// não inventada sem marcação.
const MAX_IMAGE_SIZE_MB = 2;

export function OccurrencesFieldArray({
  control,
  errors,
  isLoading,
  canSave,
}: OccurrencesFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'occurrences' });
  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({
      diagnosis: null,
      recommendation: null,
      priority: priorityOptions.defaultOption(languageGB),
      images: [],
    });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={5} mb={4}>
          {fields.map((field, index) => (
            <OccurrenceRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de ocorrência — componente próprio (mirror `OccurrenceRow` de
// `AppropriationOccurrencesTab.tsx`), único jeito de ter um `useFieldArray`
// ANINHADO (`occurrences.${index}.images`) estável por linha (Rules of
// Hooks).
// -----------------------------------------------------------------------------

interface OccurrenceRowProps {
  index: number;
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

function OccurrenceRow({ index, control, errors, isDisabled, onRemove }: OccurrenceRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;
  const occurrencesText = text.occurrences;
  const options = priorityOptions.options(languageGB);

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: `occurrences.${index}.images`,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // TASK-PAST-FIX-FE-02c (decisão do dono) — "Recomendação" passa a ser
  // visualmente obrigatória (asterisco, mirror do padrão dos demais campos
  // obrigatórios do form) quando a ocorrência já tem CONTEÚDO (diagnóstico
  // preenchido e/ou pelo menos 1 imagem) — mesma condição do teste
  // condicional de `pasture-schema.ts#occurrenceItemSchema`, nunca uma
  // condição nova/divergente.
  const diagnosisValue = useWatch({ control, name: `occurrences.${index}.diagnosis` });
  const hasContent = !!diagnosisValue?.trim() || imageFields.length > 0;
  const recommendationError = errors?.occurrences?.[index]?.recommendation?.message as
    string | undefined;

  function isValidImageFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      toaster.error({
        title: occurrencesText.images.title,
        description: text.errors.invalidFields,
      });
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toaster.error({
        title: occurrencesText.images.title,
        description: occurrencesText.images.maxHint,
      });
      return false;
    }
    return true;
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (imageFields.length >= MAX_IMAGES_PER_OCCURRENCE) return;
    if (!isValidImageFile(file)) return;
    appendImage({ latitude: 0, longitude: 0, file });
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
        <Controller
          name={`occurrences.${index}.diagnosis`}
          control={control}
          render={({ field: rowField }) => (
            <Textarea
              label={occurrencesText.fields.diagnosis}
              placeholder={occurrencesText.placeholders.diagnosis}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`occurrences.${index}.recommendation`}
          control={control}
          render={({ field: rowField }) => (
            <Textarea
              label={occurrencesText.fields.recommendation}
              placeholder={occurrencesText.placeholders.recommendation}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              disabled={isDisabled}
              // TASK-PAST-FIX-FE-02c — obrigatório (visual + validação) só
              // quando a linha já tem conteúdo (diagnóstico/imagem); linha
              // totalmente vazia nunca é bloqueada.
              isRequired={hasContent}
              error={recommendationError}
            />
          )}
        />

        <Controller
          name={`occurrences.${index}.priority`}
          control={control}
          render={({ field: rowField }) => (
            <Select
              label={occurrencesText.fields.priority}
              name={rowField.name}
              value={rowField.value}
              onChange={(option) => rowField.onChange(option ?? null)}
              options={options}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Imagens (upload real, até 3) — TASK-PAST-FIX-FE-02 ---- */}
      <Box mt={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            {occurrencesText.images.title}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {occurrencesText.images.maxHint}
          </Text>
        </Flex>

        <Flex gap={3} wrap="wrap">
          {imageFields.map((imageField, imageIndex) => (
            <OccurrenceImageThumb
              key={imageField.id}
              control={control}
              occurrenceIndex={index}
              imageIndex={imageIndex}
              isDisabled={isDisabled}
              onRemove={() => removeImage(imageIndex)}
              onValidate={isValidImageFile}
            />
          ))}

          {imageFields.length < MAX_IMAGES_PER_OCCURRENCE && (
            <Box
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={occurrencesText.images.addButton}
              aria-disabled={isDisabled}
              onClick={() => !isDisabled && inputRef.current?.click()}
              onKeyDown={(event) => {
                if (isDisabled) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={1}
              w="120px"
              h="120px"
              border="1.5px dashed"
              borderColor="border.subtle"
              borderRadius="lg"
              bg="bg.subtle"
              cursor={isDisabled ? 'not-allowed' : 'pointer'}
              opacity={isDisabled ? 0.6 : 1}
            >
              <Icon as={FiUpload} boxSize={5} color="fg.muted" />
              <Text fontSize="xs" color="fg.muted" textAlign="center" px={2}>
                {occurrencesText.images.addButton}
              </Text>
            </Box>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={isDisabled}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
        </Flex>
      </Box>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeItem}
          mensegerTooltip={text.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Thumbnail de imagem — distingue "já persistida" (`existingUrl`, preview
// via <Image>, sem reenvio de arquivo) de "nova" (`file`, preview via
// `URL.createObjectURL`, convertida para base64 no submit). "Trocar
// Imagem" = novo `onChange` no MESMO índice (mirror
// `AppropriationOccurrencesTab.tsx`).
// -----------------------------------------------------------------------------

interface OccurrenceImageThumbProps {
  control: Control<PastureForm>;
  occurrenceIndex: number;
  imageIndex: number;
  isDisabled: boolean;
  onRemove: () => void;
  onValidate: (file: File) => boolean;
}

function OccurrenceImageThumb({
  control,
  occurrenceIndex,
  imageIndex,
  isDisabled,
  onRemove,
  onValidate,
}: OccurrenceImageThumbProps) {
  const { languageGB } = useLanguage();
  const occurrencesText = languageGB.pastures.pasture.form.occurrences;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={`occurrences.${occurrenceIndex}.images.${imageIndex}`}
      control={control}
      render={({ field: rowField }) => {
        const value = rowField.value;
        const previewUrl = value?.file
          ? URL.createObjectURL(value.file)
          : (value?.existingUrl ?? '');

        function handleReplace(event: ChangeEvent<HTMLInputElement>) {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (!onValidate(file)) return;
          rowField.onChange({
            latitude: value?.latitude ?? 0,
            longitude: value?.longitude ?? 0,
            file,
          });
        }

        return (
          <Box w="120px" overflow="hidden">
            <Box w="120px" h="120px">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={occurrencesText.images.title}
                  w="120px"
                  h="120px"
                  objectFit="cover"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.subtle"
                />
              ) : (
                <Flex
                  w="120px"
                  h="120px"
                  align="center"
                  justify="center"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  bg="bg.subtle"
                >
                  <Icon as={FiFileText} boxSize={6} color="fg.muted" />
                </Flex>
              )}
            </Box>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              disabled={isDisabled}
              onChange={handleReplace}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
            />

            <Flex mt={1} gap={1} justify="center">
              <IconButtonTable
                aria-label={occurrencesText.images.changeButton}
                mensegerTooltip={occurrencesText.images.changeButton}
                size="xs"
                variant="outline"
                onClick={() => !isDisabled && inputRef.current?.click()}
                disabled={isDisabled}
              >
                <Icon as={FiRefreshCw} />
              </IconButtonTable>
              <IconButtonTable
                aria-label={occurrencesText.images.removeButton}
                mensegerTooltip={occurrencesText.images.removeButton}
                size="xs"
                color="red.500"
                variant="ghost"
                onClick={onRemove}
                disabled={isDisabled}
              >
                <Icon as={FiX} />
              </IconButtonTable>
            </Flex>
          </Box>
        );
      }}
    />
  );
}
