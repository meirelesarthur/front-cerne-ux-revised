// src/pages/CadastrosBase/Areas/CreateMultipleAreas.tsx
// -----------------------------------------------------------------------------
// Tela "Adicionar Múltiplas Áreas" (Area — F-348/UT-000446, esteira 067,
// TASK-FE-421, SURF-05) — PÁGINA CHEIA (UX-GAP-02, default do contrato de
// tela §6, "página cheia com cards Pattern 12 + import de N KMLs + submit
// único `POST /areas/batch`" — o DS `cerne` só tem `MultiAreaModal` de N
// linhas manuais Nome+Área, sem KML e sem campos completos; não inventado
// aqui, seguido o default já registrado no contrato).
//
// Fluxo (fiel ao as-is do legado, IG-08, `CONTRATO-tela-frontend-area.md §2`
// SURF-05): usuário seleciona N arquivos KML de uma vez (`<input multiple>`)
// → LOOP client-side chamando `POST /api/v1/kml-import` 1× por arquivo
// (não existe parse em lote no backend) → cada sucesso vira 1 `AreaCard`
// (`./AreaCard.tsx`) já hidratado com o polígono/hectares calculados →
// usuário ajusta os campos de CADA card independentemente (nome, data,
// ativo, cor, etc. — CLM-09 corrigido: nenhum valor é fixado/replicado entre
// cards) → 1 único submit `POST /areas/batch` com TODOS os cards
// (all-or-nothing, transação no backend — `StoreAreasBatchAction`).
//
// SEM `useFieldArray` (Riscos da Tarefa, item 4): estado local (array de
// `CardEntry`) + 1 instância de `AreaCard` (com o próprio `useForm`) por
// item + 1 `Map` de handles imperativos (`AreaCardHandle`) para o pai
// orquestrar validação/coleta de payload/erro 422 por índice — ver
// `./AreaCard.tsx` para o racional completo.
//
// 422 por índice (`areas.<N>.<campo>`) é mapeado ao card `N` via
// `mapAreaApiFieldToFormField` (mirror da função homônima de
// `CreateOrUpdateArea.tsx`, duplicada aqui por decisão de escopo — nenhuma
// mudança no arquivo do editor single nesta Tarefa). 403 de limite de plano
// já é tratado GLOBALMENTE pelo interceptor (`services/api.ts`) — nada extra
// aqui (mirror 420).
// -----------------------------------------------------------------------------

import { ElementType, useRef, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import L from 'leaflet';
import 'leaflet-draw';
import { FiUpload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { extractOuterRings, type GeoPoint } from '@/utils/geo/polygon-geometry';
import { generateClientId, isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { createAreasBatch } from '@/services/v2/BaseRegistrations/areas-service';
import { importKml } from '@/services/v2/shared/kml-import-service';

import type {
  AreaBatchItemRequest,
  AreaBatchRequest,
  AreaCoordinates,
  AreaData,
  AreaForm,
} from '@/@types/v2/BaseRegistrations/areas';

import { AreaCard, emptyAreaForm, type AreaCardHandle } from './AreaCard';

const ACCEPTED_EXTENSIONS = ['.kml', '.kmz'];

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function stripFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index > 0 ? fileName.slice(0, index) : fileName;
}

// Hectares geodésicos de 1 anel — MESMA fórmula de `AreaMapEditor.commitFeature`
// (`L.GeometryUtil.geodesicArea`/10000, 2 casas) — consistência entre o
// valor que nasce do import em lote e o que nasceria desenhando/reimportando
// o MESMO polígono dentro do card (`AreaMapEditor`, single-file).
function computeHectares(ring: GeoPoint[]): number {
  if (ring.length < 3) return 0;
  const latLngRing = ring.map((point) => L.latLng(point.lat, point.lng));
  const m2 = L.GeometryUtil.geodesicArea(latLngRing);
  return m2 > 0 ? Math.round((m2 / 10000) * 100) / 100 : 0;
}

// Mirror EXATO de `mapAreaApiFieldToFormField` (`CreateOrUpdateArea.tsx`) —
// duplicada aqui (não exportada de lá, decisão de escopo desta Tarefa: zero
// mudança no arquivo do editor single). Resolve o SEGMENTO de campo depois do
// índice (`areas.3.description` → `description`; `areas.3.infrastructure.0`
// → `infrastructure`, ignorando o sub-índice do array aninhado).
function mapAreaApiFieldToFormField(apiField: string): keyof AreaForm | null {
  const map: Partial<Record<string, keyof AreaForm>> = {
    description: 'description',
    registration: 'registration',
    date: 'date',
    type: 'type',
    color: 'color',
    recreation_area: 'recreation_area',
    is_enabled: 'is_enabled',
    note: 'note',
    coordinates: 'coordinates',
    total_area: 'total_area',
    productive_area: 'productive_area',
    unproductive_area: 'unproductive_area',
    infrastructure: 'infrastructure',
    proprietary_uuid: 'proprietary',
    activity_uuid: 'activity',
  };
  return map[apiField] ?? null;
}

const AREA_BATCH_ERROR_KEY = /^areas\.(\d+)\.(.+)$/;

// Mirror EXATO de `buildAreaCreatePayload` (`CreateOrUpdateArea.tsx`), SEM
// `farm_uuid` próprio (1 única Fazenda serve TODO o lote, em
// `AreaBatchRequest.farm_uuid`) — shape `AreaBatchItemRequest` (=
// `AreaWritePayload`, `@/@types/v2/BaseRegistrations/areas`).
function buildAreaItemPayload(data: AreaForm): AreaBatchItemRequest {
  return {
    description: data.description.trim(),
    registration: data.registration?.trim() || undefined,
    date: data.date as string,
    coordinates: data.coordinates as AreaCoordinates,
    type: data.type!.value,
    color: data.color!.value,
    recreation_area: !!data.recreation_area,
    total_area: data.total_area,
    productive_area: data.productive_area,
    unproductive_area: data.unproductive_area,
    is_enabled: !!data.is_enabled,
    note: data.note?.trim() || undefined,
    activity_icon_coordinates: data.activity_icon_coordinates ?? undefined,
    infrastructure_icon_coordinates: data.infrastructure_icon_coordinates ?? undefined,
    activity_uuid: data.activity?.value ?? null,
    proprietary_uuid: data.proprietary?.value ?? null,
    infrastructure: (data.infrastructure ?? []).map((item) => item.value),
  };
}

interface CardEntry {
  /** Identidade client-side ESTÁVEL do card (`generateClientId()`) — chave
   *  de render + chave do `Map` de handles, NUNCA reordenada/reciclada
   *  enquanto o card existir (remoção é a única mutação estrutural). */
  id: string;
  /** Nome do arquivo KML de origem — exibido no header do card. */
  fileName: string;
  /** Valores iniciais do card (já hidratados pelo import: description
   *  derivada do nome do arquivo + coordinates/áreas calculadas). Fixados no
   *  momento da criação do card — o `AreaCard` não remonta ao adicionar/
   *  remover OUTROS cards da lista (chave estável `id`). */
  defaultValues: AreaForm;
}

export default function CreateMultipleAreas() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const canSave = can('farms_create');
  const isFarmValid = isValidGuid(farmId);

  const multipleText = languageGB.areas.area.multiple;
  const formText = languageGB.areas.area.form;

  const [cards, setCards] = useState<CardEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importingFileName, setImportingFileName] = useState<string | null>(null);

  // Handles imperativos por card (validate/getFormValues/setFieldError) —
  // NUNCA guarda dado de formulário aqui, só a REFERÊNCIA de cada instância
  // (o dado de servidor mora dentro de cada `AreaCard`, Regra "sem
  // duplicar estado de servidor no Zustand/estado do pai").
  const cardHandlesRef = useRef<Map<string, AreaCardHandle>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const areaBatchMutation = useRequest<AreaData[]>({
    asyncFunction: (payload: AreaBatchRequest) => createAreasBatch(payload),
    entityName: languageGB.areas.area.pluralLabel,
    queryKey: queryKey.cadastrosBase.areas,
    typesRequest: 'create',
    personalizedMessage: multipleText.createdSuccessToast,
    actionSuccess: () => {
      navigate(-1);
    },
  });

  const isSubmitting = areaBatchMutation.isPending;
  const disabled = !canSave || isSubmitting || isImporting;

  function openFilePicker() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function handleRemoveCard(id: string) {
    if (disabled) return;
    setCards((prev) => prev.filter((card) => card.id !== id));
    cardHandlesRef.current.delete(id);
  }

  // Import de N KMLs — LOOP client-side (IG-08 preservado, `POST /kml-import`
  // 1× por arquivo). Falha de UM arquivo (extensão inválida/sem polígono
  // utilizável/erro de rede) só pula ESSE arquivo (toast) — não aborta os
  // demais; nada aqui é o all-or-nothing do SUBMIT (esse é do `/areas/batch`).
  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || disabled) return;

    setIsImporting(true);
    // eslint-disable-next-line no-restricted-syntax -- laço sequencial deliberado (mirror `useFarmAreaGeometries`/legado IG-08)
    for (const file of files) {
      if (!hasAcceptedExtension(file.name)) {
        toaster.error({
          title: multipleText.importButton,
          description: `${multipleText.importInvalidExtension} (${file.name})`,
          duration: 7000,
        });
        // eslint-disable-next-line no-continue
        continue;
      }

      setImportingFileName(file.name);
      try {
        // eslint-disable-next-line no-await-in-loop -- import sequencial deliberado (1 POST por arquivo, IG-08)
        const featureCollection = await importKml(file);
        const polygonFeatures = (featureCollection.features ?? []).filter(
          (feature) =>
            feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon'
        );

        if (polygonFeatures.length === 0) {
          toaster.error({
            title: multipleText.importButton,
            description: `${multipleText.importFileErrorToast} (${file.name})`,
            duration: 7000,
          });
          // eslint-disable-next-line no-continue
          continue;
        }

        const feature = polygonFeatures[0] as AreaCoordinates;
        const ring = extractOuterRings(feature)[0] ?? [];
        const hectares = computeHectares(ring);

        setCards((prev) => [
          ...prev,
          {
            id: generateClientId(),
            fileName: file.name,
            defaultValues: {
              ...emptyAreaForm(),
              description: stripFileExtension(file.name),
              coordinates: feature,
              total_area: hectares,
              productive_area: hectares,
              unproductive_area: 0,
            },
          },
        ]);
      } catch {
        toaster.error({
          title: multipleText.importButton,
          description: `${multipleText.importFileErrorToast} (${file.name})`,
          duration: 7000,
        });
      }
    }
    setImportingFileName(null);
    setIsImporting(false);
  }

  // Submit ÚNICO em lote (all-or-nothing, `POST /areas/batch`) — valida
  // TODOS os cards (Yup completo por card) antes de montar o payload; 422 por
  // índice é roteado ao card correspondente (`setFieldError`), nunca
  // descartado silenciosamente.
  async function handleSubmit() {
    if (disabled) return;

    if (cards.length === 0) {
      toaster.error({
        title: multipleText.title,
        description: multipleText.emptySubmitToast,
        duration: 7000,
      });
      return;
    }

    const validations = await Promise.all(
      cards.map((card) => cardHandlesRef.current.get(card.id)?.validate() ?? Promise.resolve(false))
    );
    if (validations.some((isValid) => !isValid)) {
      toaster.error({
        title: multipleText.title,
        description: multipleText.validationErrorToast,
        duration: 7000,
      });
      return;
    }

    const areas = cards.map((card) =>
      buildAreaItemPayload(cardHandlesRef.current.get(card.id)!.getFormValues())
    );

    try {
      await areaBatchMutation.mutateAsync({ farm_uuid: farmId as string, areas });
    } catch (error) {
      // 422 flat → por índice/campo (Riscos #2) — 403 de limite de plano já é
      // tratado GLOBALMENTE pelo interceptor (`services/api.ts`); o toast de
      // erro genérico já foi exibido pelo `onError` interno do `useRequest`
      // (mirror 420) — aqui só o roteamento por card.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = (error.response.data?.errors ?? {}) as Record<string, string[]>;
        Object.entries(fieldErrors).forEach(([key, messages]) => {
          const match = AREA_BATCH_ERROR_KEY.exec(key);
          if (!match || !messages?.[0]) return;

          const index = Number(match[1]);
          const field = match[2].split('.')[0];
          const formField = mapAreaApiFieldToFormField(field);
          const card = cards[index];

          if (card && formField) {
            cardHandlesRef.current.get(card.id)?.setFieldError(formField, messages[0]);
          }
        });
      }
    }
  }

  if (!isFarmValid) {
    return (
      <FormContainer title={multipleText.title}>
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={6}
          textAlign="center"
        >
          <Text fontSize="md" fontWeight="semibold" color="fg.error">
            {formText.farmNotFound.title}
          </Text>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            {formText.farmNotFound.description}
          </Text>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={multipleText.title}
      subtitle={multipleText.subtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <Button
              title={multipleText.submitButton}
              type="button"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={disabled || cards.length === 0}
            />
          )}
        </>
      }
    >
      <Flex align="center" gap={3} mb={6} wrap="wrap">
        <Button
          title={isImporting ? multipleText.importInProgress : multipleText.importButton}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={openFilePicker}
          loading={isImporting}
          disabled={disabled}
        />
        {importingFileName && (
          <Text fontSize="xs" color="fg.muted">
            {importingFileName}
          </Text>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.kmz"
          multiple
          style={{ display: 'none' }}
          onChange={handleFilesSelected}
          aria-hidden="true"
          tabIndex={-1}
        />
      </Flex>

      {cards.length === 0 ? (
        <EmptyState
          variant="empty"
          message={multipleText.emptyState.title}
          description={multipleText.emptyState.description}
        />
      ) : (
        cards.map((card, index) => (
          <AreaCard
            key={card.id}
            ref={(handle) => {
              if (handle) {
                cardHandlesRef.current.set(card.id, handle);
              } else {
                cardHandlesRef.current.delete(card.id);
              }
            }}
            cardNumber={index + 1}
            fileName={card.fileName}
            farmUuid={farmId as string}
            defaultValues={card.defaultValues}
            disabled={disabled}
            onRemove={() => handleRemoveCard(card.id)}
          />
        ))
      )}
    </FormContainer>
  );
}
