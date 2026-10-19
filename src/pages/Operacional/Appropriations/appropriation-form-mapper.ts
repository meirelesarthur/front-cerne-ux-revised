// src/pages/Operacional/Appropriations/appropriation-form-mapper.ts
// -----------------------------------------------------------------------------
// TASK-FE-737 (execução 034/035, GAP-BE-655) — mapeamento PURO
// `AppropriationDetail` (resposta do backend) → `AppropriationForm`
// (`useForm` do RHF), EXTRAÍDO de `CreateOrUpdateAppropriation.tsx`
// (`fillAppropriationForm`, modo edição) para ser reaproveitado LITERALMENTE
// por `FinishAppropriation.tsx` — evita reescrever a hidratação das 5
// categorias do zero e, de quebra, CORRIGE o bug do legado onde os 13 campos
// de qualidade/pesagem da Produção não vinham hidratados na tela de
// Finalização (Doc Bruta 08 §6) — a MESMA função que já mapeia
// `item.ph`/`item.phm`/etc. corretamente em modo edição passa a alimentar a
// Finalização também.
//
// Único ponto de DIVERGÊNCIA entre os 2 modos: o bloco de Máq/Implementos.
//   - `mode: 'edit'` (default, `CreateOrUpdateAppropriation.tsx`) —
//     COMPORTAMENTO 100% INALTERADO: `end_hour_meter`/`amount` hidratados
//     como vêm do Response (readonly informativo, só usados pelo bloco
//     `hasCalculatedData` do tab); SEM `end_hour_photo` (campo inexistente
//     em create/edit).
//   - `mode: 'finish'` (`FinishAppropriation.tsx`, TASK-FE-737) —
//     `end_hour_meter` nasce `null` quando ainda não finalizado (`<= 0`,
//     obriga o usuário a preencher, validado por
//     `finishAppropriationSchemaResolver`), ou hidratado com o valor real
//     quando > 0 (reabertura pós-finalização, mirror Doc Bruta §10.5);
//     `end_hour_photo` hidratado a partir de `end_hour_photo_url` (mirror
//     `start_hour_photo`, GAP-BE-653/TASK-FE-716).
//
// `area_total` SEMPRE nasce `null` aqui — cada caller resolve o próprio
// lookup best-effort (`listAreas`, ver `CreateOrUpdateAppropriation.tsx`/
// `FinishAppropriation.tsx`) via `useQuery` próprio (hook, não pertence a
// uma função pura de mapeamento).
// -----------------------------------------------------------------------------

import type { ModuleAppropriations } from '@/@types/language/module-appropriations';
import type {
  AppropriationDetail,
  AppropriationForm as AppropriationFormType,
} from '@/@types/v2/Appropriations';

export type AppropriationFormMapperMode = 'edit' | 'finish';

export interface MapAppropriationDetailOptions {
  /** Default `'edit'` — mirror EXATO do comportamento histórico de
   *  `CreateOrUpdateAppropriation.tsx`. `'finish'` ativa a hidratação de
   *  `end_hour_meter`/`end_hour_photo` da Finalização (TASK-FE-737). */
  mode?: AppropriationFormMapperMode;
}

export function mapAppropriationDetailToFormValues(
  data: AppropriationDetail,
  formText: ModuleAppropriations['appropriation']['form'],
  options: MapAppropriationDetailOptions = {}
): AppropriationFormType {
  const mode = options.mode ?? 'edit';

  return {
    date: data.date,
    area_uuid: data.area ? { label: data.area.description, value: data.area.uuid } : null,
    area_total: null,
    activity_uuid: data.activity ? { label: data.activity.name, value: data.activity.uuid } : null,
    operation_uuid: data.operation
      ? { label: data.operation.name, value: data.operation.uuid }
      : null,
    warehouse_production_uuid: data.warehouse_production
      ? { label: data.warehouse_production.description, value: data.warehouse_production.uuid }
      : null,
    cultivation_uuid: data.cultivation
      ? { label: data.cultivation.name, value: data.cultivation.uuid }
      : null,
    harvest_uuid: data.harvest
      ? { label: data.harvest.description, value: data.harvest.uuid }
      : null,
    employee_uuid: data.employee ? { label: data.employee.name, value: data.employee.uuid } : null,
    used_area: data.used_area ?? null,
    description: data.description ?? null,
    stock_items: data.stock_items.map((item) => ({
      // TASK-FE-703 (AP-35, execução 034) — `product_uuid` ganha
      // `.measurement` embutido a partir do `item.measurement` do próprio
      // Response: o Select "Un. Medida" (`AppropriationStockTab.tsx`)
      // resolve suas `options` a partir de `product_uuid.measurement`, não
      // de `measurement_uuid` isolado — sem o embed, `options=[]` no 1º
      // render pós-`reset()` e o Select aparenta vazio mesmo com o valor
      // salvo corretamente em `measurement_uuid`.
      product_uuid: {
        label: item.product.description,
        value: item.product.uuid,
        // TASK-FE-751 (destravada por ERRO-BE-018) — `description` (texto
        // completo, ex. "Hora") no lugar de `name` (abreviação, ex. "h");
        // fallback a `name` só por segurança (nunca deveria faltar, campo
        // aditivo obrigatório no Resource).
        measurement: item.measurement
          ? {
              label: item.measurement.description || item.measurement.name,
              value: item.measurement.uuid,
            }
          : null,
      },
      // GAP-BE-652 (TASK-FE-704/AP-35, execução 034, 6ª leva) — `warehouse`
      // vem do `AppropriationStockItemResponse` (Resource reexpõe o dado já
      // persistido via `stock_id → stocks.warehouse_id`).
      warehouse_uuid: item.warehouse
        ? { label: item.warehouse.description, value: item.warehouse.uuid }
        : null,
      quantity: item.quantity,
      // TASK-FE-751 — mirror EXATO do embed acima.
      measurement_uuid: item.measurement
        ? {
            label: item.measurement.description || item.measurement.name,
            value: item.measurement.uuid,
          }
        : null,
      product_um_label: item.measurement?.description || item.measurement?.name || null,
      // TASK-FE-734 (GAP-BE-655) — "Qtd Total" hidratada do persistido
      // (`total_quantity`) nos 2 modos; em `edit` o campo simplesmente não é
      // renderizado por `AppropriationStockTab.tsx` (continua
      // `InputReadOnly` derivada), então hidratar aqui é inofensivo — evita
      // 2 branches de shape para o mesmo tipo.
      total_quantity: item.total_quantity,
    })),
    equipment_items: data.equipment_items.map((item) => ({
      equipment_uuid: { label: item.equipment.description, value: item.equipment.uuid },
      start_hour_meter: item.start_hour_meter,
      note: item.note,
      // TASK-FE-737 (GAP-BE-655) — único bloco com hidratação DIFERENTE por
      // modo (ver cabeçalho do arquivo).
      end_hour_meter:
        mode === 'finish'
          ? item.end_hour_meter > 0
            ? item.end_hour_meter
            : null
          : item.end_hour_meter,
      amount: item.amount,
      // TASK-FE-751 — mirror EXATO do embed de `stock_items` acima.
      measurement_uuid: item.measurement
        ? {
            label: item.measurement.description || item.measurement.name,
            value: item.measurement.uuid,
          }
        : null,
      // GAP-BE-602/TASK-BE-1002 — hidrata a foto JÁ existente como
      // `existingUrl` (nunca `file`, reservado a upload NOVO desta sessão);
      // reenviada verbatim no submit se o usuário não trocar (omitir
      // apagaria a foto, TASK-FE-603).
      start_hour_photo: item.start_hour_photo_url
        ? { existingUrl: item.start_hour_photo_url, file: null }
        : null,
      // GAP-BE-653/TASK-FE-716/730/737 — Foto do Horímetro Final, exclusiva
      // da Finalização; 1ª finalização nasce sem `existingUrl` (Doc Bruta
      // §10.5, legado nunca pré-preenche este campo); reabertura
      // pós-finalização hidrata a partir de `end_hour_photo_url`.
      end_hour_photo:
        mode === 'finish'
          ? item.end_hour_photo_url
            ? { existingUrl: item.end_hour_photo_url, file: null }
            : null
          : null,
    })),
    labor_items: data.labor_items.map((item) => ({
      type:
        item.type === 'employee'
          ? { value: 1, label: formText.labor.typeOptions.employee }
          : item.type === 'function'
            ? { value: 2, label: formText.labor.typeOptions.function }
            : { value: 3, label: formText.labor.typeOptions.provider },
      employee_uuid:
        item.type === 'employee' ? { label: item.person.name, value: item.person.uuid } : null,
      function_uuid:
        item.type === 'function' ? { label: item.person.name, value: item.person.uuid } : null,
      provider_uuid:
        item.type === 'provider' ? { label: item.person.name, value: item.person.uuid } : null,
      // TASK-FE-664/AP-25 (GAP-BE-643) — mirror EXATO da hidratação de
      // `stock_items.measurement_uuid`/`production_items.measurement_uuid`.
      // TASK-FE-751 — `description` no lugar de `name`.
      measurement_uuid: item.measurement
        ? {
            label: item.measurement.description || item.measurement.name,
            value: item.measurement.uuid,
          }
        : null,
      quantity: item.quantity,
      type_payment: item.type_payment
        ? {
            value: item.type_payment,
            label:
              item.type_payment === 'V'
                ? formText.labor.paymentOptions.value
                : formText.labor.paymentOptions.quantityPerHectare,
          }
        : null,
      // GAP-BE-650/TASK-FE-686 (AP-30, execução 034, 5ª leva) — "Qtd Total"
      // deixou de ser só informativa (`total_quantity` real, editável); "Vl.
      // Unitário" (`amount`) hidratado do mesmo jeito. "Vl. Total" NÃO é
      // hidratado como campo próprio — nunca é RHF, recomputado ao vivo
      // (`total_quantity × amount`) no `LaborItemRow`.
      total_quantity: item.total_quantity,
      amount: item.amount,
      total_amount: item.total_amount,
    })),
    production_items: data.production_items.map((item) => ({
      // TASK-FE-703 (AP-36, execução 034) — mirror EXATO do fix de
      // `stock_items.product_uuid` acima: `.measurement` embutido a partir
      // de `item.measurement` do próprio Response, garantindo que o Select
      // "Un. Medida" (`AppropriationProductionTab.tsx`, dedupe de
      // `product_uuid.measurement`/`measurementSecond`) tenha ao menos a
      // opção salva disponível em `options`.
      product_uuid: {
        label: item.product.description,
        value: item.product.uuid,
        // TASK-FE-751 — mirror EXATO do embed de `stock_items` acima.
        measurement: item.measurement
          ? {
              label: item.measurement.description || item.measurement.name,
              value: item.measurement.uuid,
            }
          : null,
      },
      // TASK-FE-645 (AP-16, execução 034) — mirror EXATO da hidratação de
      // `stock_items.measurement_uuid` acima. TASK-FE-751 — `description`
      // no lugar de `name`.
      measurement_uuid: item.measurement
        ? {
            label: item.measurement.description || item.measurement.name,
            value: item.measurement.uuid,
          }
        : null,
      quantity: item.quantity,
      note: item.note,
      amount: item.amount,
      total: item.total,
      // TASK-FE-737 (GAP-BE-655, Achados do Roster §6, decisão do dono
      // 2026-08-11) — os 13 campos de qualidade/pesagem HIDRATAM com o valor
      // persistido nos 2 modos (esta função já fazia isso corretamente em
      // modo edição; reaproveitá-la na Finalização CORRIGE o bug do legado,
      // `_card_production_edit.blade.php` declarava esses 13 campos sem
      // `->value(...)`, Doc Bruta 08 §6).
      ph: item.ph,
      phm: item.phm,
      damaged: item.damaged,
      burned: item.burned,
      others: item.others,
      impurities: item.impurities,
      qb_impurities: item.qb_impurities,
      moisture: item.moisture,
      qb_moisture: item.qb_moisture,
      rate: item.rate,
      qb_technique: item.qb_technique,
      cleaning_drying: item.cleaning_drying,
      broken: item.broken,
    })),
    occurrences: data.occurrences.map((occurrence) => ({
      diagnosis: occurrence.diagnosis,
      recommendation: occurrence.recommendation,
      priority: occurrence.priority
        ? {
            value: occurrence.priority,
            label:
              occurrence.priority === '2'
                ? formText.occurrences.priorityOptions.high
                : occurrence.priority === '1'
                  ? formText.occurrences.priorityOptions.medium
                  : formText.occurrences.priorityOptions.low,
          }
        : null,
      images: occurrence.images.map((image) => ({
        latitude: image.latitude,
        longitude: image.longitude,
        existingUrl: image.url,
      })),
    })),
  };
}
