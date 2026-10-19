// src/pages/CadastrosBase/Fazendas/steps/StepIdentificacao.tsx
// -----------------------------------------------------------------------------
// Etapa 1/6 do wizard de Fazenda — Identificação (TASK-FE-402): `description`,
// `descriptive`, `nif` (`MaskedInput kind="cpfCnpj"` — máscara dinâmica
// CPF↔CNPJ, esteira 001 Wave 3), `phone` (`MaskedInput kind="phone"`,
// máscara dinâmica fixo/celular), upload de logo com preview (`ImageUpload`,
// mirror `CreateOrUpdateFamiliaBens.tsx`) e `tenant_id` (`NumberInput`, só
// exibido para `Gestor_Plataf` em modo CRIAÇÃO — §8.1 do contrato:
// obrigatório para esse papel, `prohibited` para usuário comum, imutável no
// update via este Request).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { StepHeading, type StepProps } from './parts';

interface StepIdentificacaoProps extends StepProps {
  showTenantId: boolean;
  imageFile: File | null;
  currentImageUrl: string | null;
  onFileSelected: (file: File | null) => void;
  onRemoveImage: () => void;
}

export function StepIdentificacao({
  control,
  register,
  errors,
  disabled,
  loading,
  showTenantId,
  imageFile,
  currentImageUrl,
  onFileSelected,
  onRemoveImage,
}: StepIdentificacaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;

  return (
    <Box>
      <StepHeading title={text.steps.identificacao} subtitle={text.stepsSubtitle.identificacao} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
        <Input
          label={text.fields.description}
          placeholder={text.placeholders.description}
          maxLength={80}
          {...register('description')}
          error={errors.description?.message}
          isRequired
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.descriptive}
          placeholder={text.placeholders.descriptive}
          maxLength={80}
          {...register('descriptive')}
          error={errors.descriptive?.message}
          isRequired
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
        <MaskedInput
          kind="cpfCnpj"
          label={text.fields.nif}
          {...register('nif')}
          error={errors.nif?.message}
          disabled={disabled}
        />
        <MaskedInput
          kind="phone"
          label={text.fields.phone}
          {...register('phone')}
          error={errors.phone?.message}
          isRequired
          disabled={disabled}
        />
      </SimpleGrid>

      {showTenantId && (
        <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
          <Controller
            name="tenant_id"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.fields.tenantId}
                tooltip={text.hints.tenantIdCreateOnly}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                decimalPlaces={0}
                min={1}
                isRequired
                error={fieldState.error?.message}
                disabled={disabled}
              />
            )}
          />
        </SimpleGrid>
      )}

      <Box mt={2}>
        <ImageUpload
          label={text.fields.image}
          hint={`${text.hints.imageAccepted} ${text.hints.imageMaxSize}`}
          accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
          maxSizeMb={2}
          currentImageUrl={currentImageUrl}
          file={imageFile}
          onFileSelected={onFileSelected}
          onRemove={onRemoveImage}
          disabled={disabled}
          dropzoneTitle={text.image.dropzoneTitle}
          dropzoneDraggingTitle={text.image.dropzoneDragging}
          changeLabel={text.image.changeLabel}
          removeLabel={text.image.removeLabel}
          errorTypeMessage={text.image.errorType}
          errorSizeMessage={text.image.errorSize}
        />
      </Box>
    </Box>
  );
}
