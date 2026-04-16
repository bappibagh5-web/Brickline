import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import StepLayout from '../StepLayout.jsx';

const STATE_NAME_BY_CODE = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
};

function highlightState(title) {
  return title.split('your property').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">your property</span> : null}
    </span>
  ));
}

export default function StateStep({
  title,
  value,
  setValue,
  canProceed,
  onNext,
  onBack,
  states
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const stateOptions = useMemo(
    () => (Array.isArray(states) ? states : []).map((code) => ({
      code,
      name: STATE_NAME_BY_CODE[code] || code
    })),
    [states]
  );

  const selectedOption = useMemo(
    () => stateOptions.find((state) => state.code === value) || null,
    [stateOptions, value]
  );

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return stateOptions;
    return stateOptions.filter((state) => (
      state.name.toLowerCase().includes(keyword) || state.code.toLowerCase().includes(keyword)
    ));
  }, [query, stateOptions]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectState = (stateCode) => {
    setValue(stateCode);
    setOpen(false);
    setQuery('');
  };

  const content = (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            value={open ? query : (selectedOption?.name || '')}
            onFocus={() => {
              setOpen(true);
              setQuery('');
            }}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              if (!open) setOpen(true);
              setQuery(event.target.value);
            }}
            placeholder="Select a state"
            className="h-12 w-full rounded-lg border border-[#d4dbeb] bg-white px-4 pr-10 text-base text-[#2f3f66] transition-all duration-150 focus:border-[#2f54eb] focus:outline-none"
            autoComplete="off"
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a96b6]" />
        </div>

        {open ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[#d4dbeb] bg-white shadow-[0_8px_24px_rgba(30,42,77,0.12)]">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#6676a1]">No states found</div>
            ) : (
              filteredOptions.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => handleSelectState(state.code)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    value === state.code
                      ? 'bg-[#eef3ff] text-[#1d3bb8]'
                      : 'text-[#2f3f66] hover:bg-[#f7f9ff]'
                  }`}
                >
                  <span>{state.name}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 min-w-[88px] items-center justify-center rounded-lg border border-[#d4dbeb] bg-white px-4 text-sm font-semibold text-[#4d5d86] transition-all duration-150 hover:bg-[#f5f8ff]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-sm font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
        >
          Next
        </button>
      </div>
    </div>
  );

  return <StepLayout title={highlightState(title)} content={content} />;
}
