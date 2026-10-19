// src/@types/v2/FeedlotMap/death.ts
// Tipagem de "Lançar Morte" do Curral — TASK-FE-042-216. Mirror
// `GET /feedlot-map/corrals/{uuid}/death-data` (`[[09-front-sanitario-morte]]`
// §2): animais `ACTIVE` do curral (com `batch_uuid` de CADA — o endpoint
// reusado `POST /death-animals` exige `batch_uuid`, resolvido do animal
// selecionado, sem input próprio) + causas de morte habilitadas.

// `label` monta `${identification} – ${batch_description}` (execução 063,
// F-036 rejeição QA rodada 3, decisão do dono pela fidelidade ao legado
// `ModalMorte.js:122-124`) — mapeamento feito na borda do serviço
// (`getCorralDeathData`, `feedlot-map-service.ts`), nunca no componente.
export interface FeedlotCorralDeathAnimalOption {
  value: string;
  label: string;
  batch_uuid: string;
}

export interface FeedlotCorralDeathCauseOption {
  value: string;
  label: string;
}

export interface FeedlotCorralDeathData {
  animals: FeedlotCorralDeathAnimalOption[];
  causes: FeedlotCorralDeathCauseOption[];
}
