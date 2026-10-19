// src/pages/Operacional/Appropriations/tabs/AppropriationOccurrencesTab.tsx
// -----------------------------------------------------------------------------
// Aba "Ocorrências" (diagnóstico fitossanitário) — TASK-FE-2710 (extensão de
// fidelidade v1.1 §19-E2, `TASK-BE-999`, JÁ CONSTRUÍDO). `useFieldArray` de
// `occurrences` (sem limite de linhas — o limite de 3 é sobre IMAGENS por
// ocorrência, não sobre número de ocorrências).
//
// Campos: Diagnóstico (obrigatório quando a linha existe), Recomendações
// (opcional), Prioridade (Select 3 opções fixas) — inalterados desde a v1.0.
// **Imagens (upload real, até 3 por ocorrência, novo por esta extensão)**:
// componente local de upload (não o `Form/FileUpload.tsx` genérico
// single-file — aqui é upload MÚLTIPLO por LINHA de uma lista dinâmica,
// distinguindo imagem já persistida (`existingUrl`, preview sem reenvio —
// update não-destrutivo, contrato §19-E2) de imagem NOVA (`file`, vai no
// payload como multipart). `latitude`/`longitude` sem captura de
// geolocalização nesta fatia — enviados como `0`/`0` (fallback documentado
// no contrato, mirror Produção).
//
// Sub-componente `OccurrenceRow` (1 componente por linha, mirror
// `InvoiceItemRow.tsx`) porque a lista de imagens é um `useFieldArray`
// ANINHADO (`occurrences.${index}.images`) — Rules of Hooks exige que cada
// linha tenha seu próprio componente para chamar o hook de forma estável.
// -----------------------------------------------------------------------------

import type { ChangeEvent, ElementType } from 'react';
import { useRef } from 'react';

import { Box, Flex, Icon, Image, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiFileText, FiPlus, FiRefreshCw, FiTrash2, FiUpload, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';
import type { AppropriationForm, OccurrencePriorityValue } from '@/@types/v2/Appropriations';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface AppropriationOccurrencesTabProps {
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isLoading: boolean;
  canSave: boolean;
  // TASK-FE-610/AP-09 — banner "≥1 item" agora lido de estado do componente
  // pai (setado só no onSubmit), não mais de `errors.occurrences?.message`.
  itemsError: string | null;
}

const MAX_IMAGES_PER_OCCURRENCE = 3;

export function AppropriationOccurrencesTab({
  control,
  errors,
  isLoading,
  canSave,
  itemsError,
}: AppropriationOccurrencesTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'occurrences' });

  const isDisabled = !canSave || isLoading;

  const priorityOptions: Option<OccurrencePriorityValue>[] = [
    { value: '0', label: formText.occurrences.priorityOptions.low },
    { value: '1', label: formText.occurrences.priorityOptions.medium },
    { value: '2', label: formText.occurrences.priorityOptions.high },
  ];

  function handleAdd() {
    append({ diagnosis: null, recommendation: null, priority: priorityOptions[0], images: [] });
  }

  return (
    <Box pt={4}>
      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
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
              priorityOptions={priorityOptions}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={formText.addItem}
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
// Linha de ocorrência — componente próprio (mirror `InvoiceItemRow`), único
// jeito de ter um `useFieldArray` ANINHADO estável por linha.
// -----------------------------------------------------------------------------

interface OccurrenceRowProps {
  index: number;
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  priorityOptions: Option<OccurrencePriorityValue>[];
  isDisabled: boolean;
  onRemove: () => void;
}

function OccurrenceRow({
  index,
  control,
  errors,
  priorityOptions,
  isDisabled,
  onRemove,
}: OccurrenceRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;
  const rowErrors = errors.occurrences?.[index];

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: `occurrences.${index}.images`,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (imageFields.length >= MAX_IMAGES_PER_OCCURRENCE) return;
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
              label={formText.occurrences.fields.diagnosis}
              placeholder={formText.occurrences.placeholders.diagnosis}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              error={rowErrors?.diagnosis?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`occurrences.${index}.recommendation`}
          control={control}
          render={({ field: rowField }) => (
            <Textarea
              label={formText.occurrences.fields.recommendation}
              placeholder={formText.occurrences.placeholders.recommendation}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`occurrences.${index}.priority`}
          control={control}
          render={({ field: rowField }) => (
            <Select
              label={formText.occurrences.fields.priority}
              name={rowField.name}
              value={rowField.value}
              onChange={(option) => rowField.onChange(option ?? null)}
              options={priorityOptions}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Imagens (upload real, até 3) — v1.1 §19-E2 ---- */}
      <Box mt={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            {formText.occurrences.images.title}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {formText.occurrences.images.maxHint}
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
            />
          ))}

          {imageFields.length < MAX_IMAGES_PER_OCCURRENCE && (
            <Box
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={formText.occurrences.images.addButton}
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
                {formText.occurrences.images.addButton}
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
          aria-label={formText.removeItem}
          mensegerTooltip={formText.removeItem}
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
// via <Image>, sem reenvio) de "nova" (`file`, preview via
// `URL.createObjectURL`, vai no payload). "Trocar Imagem" = remover +
// adicionar nova (não há endpoint dedicado de replace, mirror a decisão do
// task-packet).
// -----------------------------------------------------------------------------

interface OccurrenceImageThumbProps {
  control: Control<AppropriationForm>;
  occurrenceIndex: number;
  imageIndex: number;
  isDisabled: boolean;
  onRemove: () => void;
}

function OccurrenceImageThumb({
  control,
  occurrenceIndex,
  imageIndex,
  isDisabled,
  onRemove,
}: OccurrenceImageThumbProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;
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
          rowField.onChange({
            latitude: value?.latitude ?? 0,
            longitude: value?.longitude ?? 0,
            file,
          });
        }

        return (
          // TASK-FE-682/AP-28 — ações movidas para uma faixa PRÓPRIA, ABAIXO
          // da miniatura (fluxo normal, não mais `position="absolute"` sobre
          // a imagem), mirror do princípio "ações nunca sobre conteúdo
          // visual" já usado em `Form/FileUpload.tsx:212-228`.
          // TASK-FE-702/AP-33 — com ≥2 thumbs lado a lado, os 2 `Button`
          // de TEXTO (whiteSpace:noWrap, `button.ts:8`) transbordavam
          // horizontalmente para fora do Box de 120px, sobrepondo o thumb
          // vizinho. Botões trocados para ícone-only (`IconButtonTable`,
          // mesmo padrão já usado em outras telas para ações compactas de
          // linha), acessibilidade preservada via `aria-label`/tooltip;
          // `overflow="hidden"` acrescentado como defesa adicional.
          <Box w="120px" overflow="hidden">
            <Box w="120px" h="120px">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={formText.occurrences.images.title}
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
                aria-label={formText.occurrences.images.changeButton}
                mensegerTooltip={formText.occurrences.images.changeButton}
                size="xs"
                variant="outline"
                onClick={() => !isDisabled && inputRef.current?.click()}
                disabled={isDisabled}
              >
                <Icon as={FiRefreshCw} />
              </IconButtonTable>
              <IconButtonTable
                aria-label={formText.occurrences.images.removeButton}
                mensegerTooltip={formText.occurrences.images.removeButton}
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
