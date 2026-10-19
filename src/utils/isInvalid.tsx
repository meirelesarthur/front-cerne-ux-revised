export function isInvalid(obj: {
  [key: string]: {
    invalid: boolean;
  };
}): boolean {
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key].invalid) return true;
  }
  return false;
}
