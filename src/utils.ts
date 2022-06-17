export const groupBy = <T>(
  items: T[],
  getter: (x: T) => string
): Record<string, T[]> =>
  items.reduce<Record<string, T[]>>((acc, item) => {
    const field = getter(item);
    const currentValue = acc[field];
    if (currentValue) {
      return { ...acc, [field]: [...currentValue, item] };
    }
    return { ...acc, [field]: [item] };
  }, {});
