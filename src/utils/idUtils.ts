/** Generate a stable unique id. Uses the platform crypto UUID where available. */
export const createId = (prefix = 'mix'): string => {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${uuid}`;
};
