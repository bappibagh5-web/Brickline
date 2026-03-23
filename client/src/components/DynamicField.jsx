import { stripStepPrefix } from '../lib/formUtils.js';

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? '' : asNumber;
}

export default function DynamicField({ field, stepName, stepData, onChange }) {
  const localKey = stripStepPrefix(field.key, stepName);
  const value = stepData?.[localKey] ?? '';
  const id = `${stepName}-${localKey}`;

  const handleValueChange = (nextValue) => {
    onChange(localKey, nextValue);
  };

  let input = null;

  if (field.type === 'boolean') {
    input = (
      <input
        id={id}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => handleValueChange(event.target.checked)}
      />
    );
  } else if (field.type === 'number' || field.type === 'currency') {
    input = (
      <input
        id={id}
        type="number"
        required={Boolean(field.required)}
        value={value}
        onChange={(event) => handleValueChange(parseNumber(event.target.value))}
      />
    );
  } else if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    input = (
      <select
        id={id}
        required={Boolean(field.required)}
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {options.map((option) => {
          const optionValue =
            typeof option === 'string' ? option : option.value ?? option.label;
          const optionLabel =
            typeof option === 'string' ? option : option.label ?? option.value;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    );
  } else {
    input = (
      <input
        id={id}
        type="text"
        required={Boolean(field.required)}
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
      />
    );
  }

  return (
    <div className="field-row">
      <label htmlFor={id}>{field.label}</label>
      {input}
    </div>
  );
}
