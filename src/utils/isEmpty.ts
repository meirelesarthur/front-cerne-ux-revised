export function isEmpty(obj: any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) return true;
  }
  return false;
}
