// src/constants/Grazing/options/grazing-color-options.ts
// -----------------------------------------------------------------------------
// Paleta FECHADA de 14 cores do campo `color` (Grazing) — TASK-GZ-FE-02.
//
// ⚠️ Correção de rota (2026-08-04, registrada aqui por não estar ainda no
// `Grazing-FrontEnd-contrato.md`/`TASK-GZ-FE-02-*.md`, ambos redigidos quando
// a decisão ainda estava pendente — ver divergência reportada no relato de
// conclusão desta Tarefa): o contrato de tela e a ficha desta Tarefa previam
// `<input type="color">` nativo para esta rodada, porque a lista fechada de
// 14 cores dependia de `TASK-AR-02` (Enum `AreaColor`, então não publicado).
// Essa dependência foi resolvida — `App\Enums\AreaColor` já existe no backend
// e `GrazingRequest::rules()` (`color`) já valida via `Rule::enum(AreaColor::class)`
// (confirmado por leitura direta de `GB.Cerne.Api/app/Http/Requests/Api/V1/
// GrazingRequest.php:75` e `GB.Cerne.Api/app/Enums/AreaColor.php:46-61` nesta
// sessão). Um `<input type="color">` livre aceitaria qualquer hex e o
// submit falharia com 422 fora da lista — por isso esta Tarefa implementa o
// seletor de paleta fechada diretamente, e não o color picker nativo previsto
// originalmente.
//
// Fonte dos 14 pares hex: MIRROR EXATO da ordem de declaração do enum
// `App\Enums\AreaColor` (`GB.Cerne.Api/app/Enums/AreaColor.php:48-61`), que
// por sua vez é mirror de `App\Area::colors()` (legado,
// `agro365/app/Area.php:82-108`). Os rótulos abaixo traduzem
// `AreaColor::label()` (PT-BR) para os 3 idiomas do front, mesma fábrica
// `(languageGB) => Map` de `control-productivity-options.ts`.
//
// ⚠️ Ponto de alinhamento futuro (NÃO resolvido nesta Tarefa, fora de escopo
// de um Executor de frontend decidir sozinho): a lista vive hoje duplicada
// em 2 lugares (Enum PHP + esta constante TS) sem uma fonte única publicada
// (ex. endpoint dedicado ou OpenAPI). Se o Enum do backend mudar, esta lista
// precisa ser atualizada em par — mesmo risco já registrado no cabeçalho do
// próprio `AreaColor.php`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

// Mesma ordem de `AreaColor` (backend) — NÃO reordenar (facilita comparação
// visual com o Enum na revisão de código).
export const GRAZING_COLOR_VALUES = [
  '#ffffff',
  '#0074d9',
  '#000000',
  '#2ecc40',
  '#ffdc00',
  '#ff4136',
  '#aaaaaa',
  '#dddddd',
  '#7fdbff',
  '#001f3f',
  '#39cccc',
  '#3d9970',
  '#01ff70',
  '#ff851b',
] as const;

export type GrazingColorValue = (typeof GRAZING_COLOR_VALUES)[number];

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.grazing.colorOptions;
  return new Map<GrazingColorValue, string>([
    ['#ffffff', text.white],
    ['#0074d9', text.blue],
    ['#000000', text.black],
    ['#2ecc40', text.green],
    ['#ffdc00', text.yellow],
    ['#ff4136', text.red],
    ['#aaaaaa', text.gray],
    ['#dddddd', text.lightGray],
    ['#7fdbff', text.lightBlue],
    ['#001f3f', text.darkBlue],
    ['#39cccc', text.turquoise],
    ['#3d9970', text.darkGreen],
    ['#01ff70', text.lightGreen],
    ['#ff851b', text.orange],
  ]);
};

const getLabel = (color: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(color as GrazingColorValue) ?? color;

const getOption = (color: string, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(color, languageGB),
  value: color,
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const grazingColorOptions = {
  getLabel,
  getOption,
  options,
};
