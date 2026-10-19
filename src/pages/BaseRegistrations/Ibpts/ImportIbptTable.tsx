// src/pages/BaseRegistrations/Ibpts/ImportIbptTable.tsx
// -----------------------------------------------------------------------------
// Tela de IMPORT (#62 "Nova Tabela") de IBPT — Cadastros Base, execução 032,
// TASK-FE-2412. Rota: /cadastros-base/ibpt/novo (guardada por
// `ibpts_create`). ÚNICA ação de escrita deste módulo — sem tela de Edição
// (contrato de API §10: reimportar a UF já é o mecanismo de atualização,
// RN-01).
//
// Molde estrutural híbrido (contrato de tela §4): casca `FormContainer` de
// `CreateOrUpdateSystemUpdate.tsx` (página com footer Cancelar/Salvar) +
// mecânica de upload/mutação de `EquipmentImportModal.tsx`/
// `OpeningBalanceImportModal.tsx` (multipart via `useMutation` direto — NÃO
// `useRequest` genérico, porque o payload não é um DTO JSON simples).
//
// `file` fica FORA do RHF (estado local `useState<File|null>`, mesmo padrão
// dos 2 modais de import citados) — o componente `FileUpload` não é um
// campo RHF registrado.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { ufOptions } from '@/constants/BaseRegistrations/options/uf-options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { ibptSchemaResolver } from '@/validations/schemas/BaseRegistrations/ibpt-schema';

import { importIbptTable } from '@/services/v2/BaseRegistrations/ibpt-service';

import type { IbptImportFormValues } from '@/@types/v2/BaseRegistrations/ibpt';

const IBPTS_LIST_ROUTE = '/cadastros-base/ibpt';

export default function ImportIbptTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.ibpt;
  const importText = text.import;

  const canSave = can('ibpts_create');

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<IbptImportFormValues>({
    mode: 'onChange',
    resolver: ibptSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      uf: null,
      versao: '',
    },
  });

  const importMutation = useMutation({
    mutationFn: importIbptTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.ibpts] });
      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      navigate(IBPTS_LIST_ROUTE);
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const rows = resData?.errors?.rows;

      // Abort-all (contrato de API §9): CSV malformado → 422 com
      // `errors.rows: string[]`, NADA é gravado. Permanece na tela para o
      // usuário corrigir e reenviar — sem invalidar cache.
      if (Array.isArray(rows) && rows.length > 0) {
        setRowErrors(rows);
        return;
      }

      const fieldErrors = resData?.errors;
      if (fieldErrors?.uf) {
        setError('uf', { message: fieldErrors.uf[0] });
      }
      if (fieldErrors?.versao) {
        setError('versao', { message: fieldErrors.versao[0] });
      }
      if (fieldErrors?.file) {
        setFileError(fieldErrors.file[0]);
      }
      if (fieldErrors?.uf || fieldErrors?.versao || fieldErrors?.file) {
        return;
      }

      toaster.error({
        title: text.singularLabel,
        description:
          extractApiFieldErrorMessage(error) ??
          resData?.message ??
          languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = importMutation.isPending;

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setFileError(undefined);
    setRowErrors([]);
  }

  function handleFileRemove() {
    setFile(null);
    setFileError(undefined);
  }

  async function onSubmit(data: IbptImportFormValues) {
    setRowErrors([]);

    if (!file) {
      setFileError(importText.validation.fileRequired);
      return;
    }

    await importMutation.mutateAsync({
      file,
      uf: data.uf!.value,
      versao: data.versao,
    });
  }

  return (
    <FormContainer
      title={importText.title.create}
      subtitle={importText.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={importText.submitButton}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <Flex
          align="flex-start"
          gap={3}
          p={4}
          mb={6}
          bg="orange.500/10"
          border="1px solid"
          borderColor="orange.500/30"
          borderRadius="lg"
        >
          <Icon as={FiAlertTriangle} color="orange.400" boxSize={5} flexShrink={0} mt="1px" />
          <Flex direction="column" gap={1}>
            <Text fontSize="sm" fontWeight="semibold">
              {importText.warning.title}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {importText.warning.description}
            </Text>
          </Flex>
        </Flex>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="uf"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={importText.fields.uf}
                options={ufOptions}
                value={field.value}
                onChange={field.onChange}
                isRequired
                isDisabled={!canSave || isSubmitting}
                error={errors.uf?.message as string | undefined}
              />
            )}
          />

          <Input
            {...register('versao')}
            label={importText.fields.versao}
            isRequired
            disabled={!canSave || isSubmitting}
            error={errors.versao?.message}
            maxLength={30}
          />
        </SimpleGrid>

        <SimpleGrid columns={1} gap={6} mt={6}>
          <FileUpload
            label={importText.fields.file}
            hint={importText.fileUpload.hint}
            accept=".csv,.txt"
            maxSizeMb={10}
            file={file}
            onFileSelected={handleFileSelected}
            onRemove={handleFileRemove}
            disabled={!canSave || isSubmitting}
            dropzoneTitle={importText.fileUpload.dropzoneTitle}
            dropzoneDraggingTitle={importText.fileUpload.dropzoneDraggingTitle}
            changeLabel={importText.fileUpload.changeLabel}
            removeLabel={importText.fileUpload.removeLabel}
            errorTypeMessage={importText.fileUpload.errorTypeMessage}
            errorSizeMessage={importText.fileUpload.errorSizeMessage}
            error={fileError}
          />

          {rowErrors.length > 0 && (
            <Flex
              direction="column"
              gap={2}
              p={4}
              bg="red.500/10"
              border="1px solid"
              borderColor="red.500/30"
              borderRadius="lg"
            >
              <Flex align="center" gap={2}>
                <Icon as={FiAlertTriangle} color="fg.error" boxSize={4} />
                <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                  {importText.rowErrors.title}
                </Text>
              </Flex>
              <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                {rowErrors.map((rowError, index) => (
                  <Text as="li" key={`${index}-${rowError}`} fontSize="xs" color="fg.muted">
                    {rowError}
                  </Text>
                ))}
              </Box>
            </Flex>
          )}
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
