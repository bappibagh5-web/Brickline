export function stripStepPrefix(key, stepName) {
  const prefix = `${stepName}.`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

export function getValueByPath(obj, path) {
  if (!path) return undefined;

  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[part];
  }, obj);
}

export function shouldRenderField(field, formData) {
  const conditional = field?.conditional;
  if (!conditional || !conditional.depends_on) {
    return true;
  }

  const currentValue = getValueByPath(formData, conditional.depends_on);
  return currentValue === conditional.value;
}
