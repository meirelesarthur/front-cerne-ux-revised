import { By } from "@/@types/by";
import { Option } from "@/@types/option";

const labels = new Map<By, string>([
  [0, "Empresa"],
  [1, "Funcionário"],
  [2, "Equipe"],
]);

const getLabel = (by: By): string => labels.get(by)!;

const getOption = (by: By): Option<By> => ({
  label: getLabel(by),
  value: by,
});

const options: Option<By>[] = Array.from(labels).map(([key, value]) => ({
  label: value,
  value: key,
}));

export const by = {
  getLabel,
  getOption,
  options,
};
