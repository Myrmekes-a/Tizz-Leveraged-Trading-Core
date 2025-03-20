export function removeProperties(obj, propertiesToRemove) {
  for (const prop of propertiesToRemove) {
    if (obj.hasOwnProperty(prop)) {
      delete obj[prop];
    }
  }
  return obj;
}

export function removeEmptyData<T>(
  data: Record<string, any>,
  dto?: new () => T,
): Record<string, any> {
  let allowedKeys: string[] = [];
  if (dto) {
    allowedKeys = Object.keys(new dto());
  }

  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (
        (dto ? allowedKeys.includes(key) : true) &&
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );
}