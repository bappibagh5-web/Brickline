import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import { funnelConfig, funnelInitialStepId } from './config.js';
import { useFunnel } from './FunnelContext.jsx';
import { getNextRoute, getStepByRoute } from './utils.js';
import {
  getStoredApplicationId,
  setStoredApplicationId,
  setStoredFunnelEmail
} from './session.js';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
];

const GOOGLE_SCRIPT_ID = 'brickline-google-places-script';

function loadGooglePlacesScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY.'));
      return;
    }

    if (window.google?.maps?.places) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Places script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Places script.'));
    document.head.appendChild(script);
  });
}

function mapPlaceToAddress(place) {
  const components = Array.isArray(place?.address_components) ? place.address_components : [];
  const findByType = (type) => components.find((component) => component.types?.includes(type));

  const streetNumber = findByType('street_number')?.long_name || '';
  const route = findByType('route')?.long_name || '';
  const city =
    findByType('locality')?.long_name ||
    findByType('postal_town')?.long_name ||
    findByType('sublocality')?.long_name ||
    '';
  const state = findByType('administrative_area_level_1')?.short_name || '';
  const zip = findByType('postal_code')?.long_name || '';
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim();

  return {
    address_line_1: addressLine1,
    address_line_2: '',
    city,
    state,
    zip,
    full_address: place?.formatted_address || addressLine1,
    place_id: place?.place_id || ''
  };
}

function getAddressFieldKey(step, field) {
  if (!step?.addressPrefix) return field;
  return `${step.addressPrefix}_${field}`;
}

function getAddressFieldValue(step, answers, field) {
  const prefixedKey = getAddressFieldKey(step, field);
  if (answers?.[prefixedKey] !== undefined && answers?.[prefixedKey] !== null) {
    return answers[prefixedKey];
  }
  return answers?.[field] || '';
}

function AddressAutocompleteField({ value, setValue }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [query, setQuery] = useState(value?.full_address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (value?.full_address && value.full_address !== query) {
      setQuery(value.full_address);
    }
  }, [query, value?.full_address]);

  useEffect(() => {
    let ignore = false;
    loadGooglePlacesScript(apiKey)
      .then((google) => {
        if (ignore) return;
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
        setReady(true);
      })
      .catch((error) => {
        if (ignore) return;
        setInputError(error.message || 'Google Places failed to load.');
      });

    return () => {
      ignore = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !autocompleteServiceRef.current) return;

    const input = String(query || '').trim();
    if (input.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setInputError('');
    const timer = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        },
        (predictions, status) => {
          setLoading(false);
          const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK;
          if (status !== okStatus || !Array.isArray(predictions)) {
            setSuggestions([]);
            return;
          }
          setSuggestions(predictions);
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [query, ready]);

  const handleSelectSuggestion = (prediction) => {
    const placeId = prediction?.place_id;
    if (!placeId || !placesServiceRef.current) return;

    setLoading(true);
    setInputError('');
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ['address_components', 'formatted_address', 'place_id']
      },
      (place, status) => {
        setLoading(false);
        const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status !== okStatus || !place) {
          setInputError('Could not load address details. Try another suggestion.');
          return;
        }

        const mapped = mapPlaceToAddress(place);
        setValue(mapped);
        setQuery(mapped.full_address || prediction.description || '');
        setSuggestions([]);
      }
    );
  };

  return (
    <div className="mt-6 space-y-3">
      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Address Line 1</span>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setValue({
              address_line_1: '',
              address_line_2: value?.address_line_2 || '',
              city: '',
              state: '',
              zip: '',
              full_address: nextQuery,
              place_id: ''
            });
          }}
          placeholder="Start typing property address..."
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        />
      </label>

      <div className="relative">
        {loading ? <p className="text-xs text-[#5f6b8f]">Searching address...</p> : null}
        {suggestions.length > 0 ? (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-[#d6dbea] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="block w-full border-b border-[#eef2fb] px-3 py-2 text-left text-sm text-[#27345d] hover:bg-[#f4f7ff]"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Address Line 2</span>
        <input
          value={value?.address_line_2 || ''}
          onChange={(event) => setValue({ ...value, address_line_2: event.target.value })}
          placeholder="Apartment, suite, unit (optional)"
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">City</span>
          <input readOnly value={value?.city || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">State</span>
          <input readOnly value={value?.state || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Zip</span>
          <input readOnly value={value?.zip || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
      </div>

      {inputError ? <p className="text-xs text-[#b63d3d]">{inputError}</p> : null}
      <p className="text-xs text-[#5f6b8f]">Please choose an address from suggestions.</p>
    </div>
  );
}

function getStepValue(step, answers) {
  if (step.type === 'name') {
    return {
      first_name: answers.first_name || '',
      last_name: answers.last_name || ''
    };
  }

  if (step.type === 'address') {
    return {
      address_line_1: getAddressFieldValue(step, answers, 'address_line_1'),
      address_line_2: getAddressFieldValue(step, answers, 'address_line_2'),
      city: getAddressFieldValue(step, answers, 'city'),
      state: getAddressFieldValue(step, answers, 'state'),
      zip: getAddressFieldValue(step, answers, 'zip'),
      full_address: getAddressFieldValue(step, answers, 'full_address') || answers.property_address || '',
      place_id: getAddressFieldValue(step, answers, 'place_id')
    };
  }

  if (!step.key) return null;
  return answers[step.key] ?? '';
}

function StepRenderer({ step, value, setValue }) {
  if (step.options) {
    return (
      <div className="mt-6 grid gap-2.5">
        {step.options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={`h-11 rounded-none border px-4 text-left text-[14px] font-normal transition-all duration-150 ${
                selected
                  ? 'border-[#4e6bf0] bg-[#eef2ff] text-[#1f3aa0]'
                  : 'border-[#9aa4ae] bg-[#f4f5f5] text-[#475569] hover:border-[#4e6bf0] hover:bg-[#f3f6ff]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === 'select') {
    return (
      <div className="mt-6">
        <select
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        >
          <option value="">Select a state</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (step.type === 'input') {
    const inputPlaceholder = step.key === 'email' ? 'Enter Your Email Address' : 'Type your answer';
    return (
      <div className="mt-6">
        <input
          type={step.inputType || 'text'}
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder={inputPlaceholder}
        />
      </div>
    );
  }

  if (step.type === 'name') {
    return (
      <div className="mt-6 grid gap-2.5">
        <input
          type="text"
          value={value?.first_name || ''}
          onChange={(event) => setValue({ ...value, first_name: event.target.value })}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder="First name"
        />
        <input
          type="text"
          value={value?.last_name || ''}
          onChange={(event) => setValue({ ...value, last_name: event.target.value })}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder="Last name"
        />
      </div>
    );
  }

  if (step.type === 'address') {
    return <AddressAutocompleteField value={value} setValue={setValue} />;
  }

  return null;
}

export default function FunnelStepPage() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { answers, setAnswer } = useFunnel();
  const { user } = useAuth();
  const [applicationId, setApplicationId] = useState(
    () => searchParams.get('applicationId') || getStoredApplicationId() || ''
  );
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checkEmailSaved, setCheckEmailSaved] = useState(false);

  const current = getStepByRoute(location.pathname);

  if (!current) {
    return <Navigate to={funnelConfig[funnelInitialStepId].route} replace />;
  }

  const { stepId, step } = current;
  const value = getStepValue(step, answers);
  const isEmailCapture = stepId === 'emailCapture';

  const canProceed = (() => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      return Boolean(firstName && lastName);
    }

    if (step.type === 'address') {
      return Boolean(String(value?.place_id || '').trim());
    }

    if (!step.key) {
      return Boolean(step.next);
    }

    return Boolean(String(value || '').trim());
  })();

  useEffect(() => {
    let ignore = false;

    const syncApplicationSession = async () => {
      try {
        const fromUrl = searchParams.get('applicationId');
        const fromStorage = getStoredApplicationId();
        const existingApplicationId = fromUrl || fromStorage;

        if (existingApplicationId) {
          if (ignore) return;
          setApplicationId(existingApplicationId);
          setStoredApplicationId(existingApplicationId);

          if (!fromUrl) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('applicationId', existingApplicationId);
            setSearchParams(nextParams, { replace: true });
          }
          return;
        }

        const response = await fetch(`${apiBaseUrl}/applications/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to start application.');
        }

        const newApplicationId = payload.application_id;
        if (!newApplicationId) {
          throw new Error('Server did not return application_id.');
        }

        if (ignore) return;

        setApplicationId(newApplicationId);
        setStoredApplicationId(newApplicationId);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('applicationId', newApplicationId);
        setSearchParams(nextParams, { replace: true });
      } catch (syncError) {
        if (ignore) return;
        setError(syncError.message);
      } finally {
        if (!ignore) {
          setInitializing(false);
        }
      }
    };

    syncApplicationSession();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, searchParams, setSearchParams]);

  useEffect(() => {
    if (stepId !== 'accountCreationFlow' && checkEmailSaved) {
      setCheckEmailSaved(false);
      return;
    }

    if (stepId !== 'accountCreationFlow' || !applicationId || checkEmailSaved) {
      return;
    }

    let ignore = false;
    const persistCheckEmailStep = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: { check_email_viewed: true }
          })
        });

        if (!response.ok || ignore) return;
        setCheckEmailSaved(true);
      } catch (_error) {
        // Keep flow resilient even if this persistence call fails.
      }
    };

    persistCheckEmailStep();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, applicationId, checkEmailSaved, stepId]);

  const setStepValue = (nextValue) => {
    if (step.type === 'name') {
      const firstName = String(nextValue?.first_name || '');
      const lastName = String(nextValue?.last_name || '');
      const fullName = `${firstName} ${lastName}`.trim();

      setAnswer('first_name', firstName);
      setAnswer('last_name', lastName);
      setAnswer('name', fullName);
      return;
    }

    if (step.type === 'address') {
      setAnswer('address_line_1', nextValue?.address_line_1 || '');
      setAnswer('address_line_2', nextValue?.address_line_2 || '');
      setAnswer('city', nextValue?.city || '');
      setAnswer('state', nextValue?.state || '');
      setAnswer('zip', nextValue?.zip || '');
      setAnswer('full_address', nextValue?.full_address || '');
      setAnswer('place_id', nextValue?.place_id || '');
      setAnswer(getAddressFieldKey(step, 'address_line_1'), nextValue?.address_line_1 || '');
      setAnswer(getAddressFieldKey(step, 'address_line_2'), nextValue?.address_line_2 || '');
      setAnswer(getAddressFieldKey(step, 'city'), nextValue?.city || '');
      setAnswer(getAddressFieldKey(step, 'state'), nextValue?.state || '');
      setAnswer(getAddressFieldKey(step, 'zip'), nextValue?.zip || '');
      setAnswer(getAddressFieldKey(step, 'full_address'), nextValue?.full_address || '');
      setAnswer(getAddressFieldKey(step, 'place_id'), nextValue?.place_id || '');
      setAnswer('property_address', nextValue?.full_address || '');
      return;
    }

    if (!step.key) return;
    setAnswer(step.key, nextValue);
  };

  const getStepPayload = () => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      return {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim()
      };
    }

    if (step.type === 'address') {
      const baseAddress = {
        address_line_1: String(value?.address_line_1 || '').trim(),
        address_line_2: String(value?.address_line_2 || '').trim(),
        city: String(value?.city || '').trim(),
        state: String(value?.state || '').trim(),
        zip: String(value?.zip || '').trim(),
        full_address: String(value?.full_address || '').trim(),
        place_id: String(value?.place_id || '').trim()
      };

      if (!step.addressPrefix) {
        return baseAddress;
      }

      return {
        ...baseAddress,
        [getAddressFieldKey(step, 'address_line_1')]: baseAddress.address_line_1,
        [getAddressFieldKey(step, 'address_line_2')]: baseAddress.address_line_2,
        [getAddressFieldKey(step, 'city')]: baseAddress.city,
        [getAddressFieldKey(step, 'state')]: baseAddress.state,
        [getAddressFieldKey(step, 'zip')]: baseAddress.zip,
        [getAddressFieldKey(step, 'full_address')]: baseAddress.full_address,
        [getAddressFieldKey(step, 'place_id')]: baseAddress.place_id
      };
    }

    if (!step.key) {
      return null;
    }

    return {
      [step.key]: value
    };
  };

  const handleNext = async () => {
    if (!canProceed) return;

    setError('');
    setSaving(true);

    try {
      const payloadData = getStepPayload();
      const shouldSaveStep = Boolean(payloadData && applicationId);

      if (isEmailCapture && typeof value === 'string') {
        setStoredFunnelEmail(value);
      }

      if (shouldSaveStep) {
        if (stepId === 'fullName' && user?.id) {
          await fetch(`${apiBaseUrl}/applications/${applicationId}/attach-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.id
            })
          }).catch(() => null);
        }

        const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: payloadData
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload?.error || 'Failed to save step.');
          return;
        }
      }

      const nextRoute = getNextRoute(stepId, value, answers, {
        isAuthenticated: Boolean(user)
      });
      if (!nextRoute) return;

      if (applicationId) {
        navigate(`${nextRoute}?applicationId=${applicationId}`);
        return;
      }
      navigate(nextRoute);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleSkip = async () => {
    if (!step.allowSkip || saving || initializing) return;

    setError('');
    setSaving(true);
    try {
      if (applicationId) {
        await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: { skipped: true }
          })
        }).catch(() => null);
      }

      const nextRoute = getNextRoute(stepId, value, answers, {
        isAuthenticated: Boolean(user)
      });

      if (!nextRoute) return;

      if (applicationId) {
        navigate(`${nextRoute}?applicationId=${applicationId}`);
        return;
      }
      navigate(nextRoute);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (stepId === funnelInitialStepId) return;
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f4] text-[#1f2937]">
      <header className="flex h-12 items-center justify-between border-b border-[#d6d9db] bg-white px-5">
        <p className="text-lg font-bold tracking-tight text-[#2f54eb]">Brickline</p>
        <p className="text-xs text-[#4b5563]">Questions? 1-844-415-4663</p>
      </header>

      <main className="grid min-h-[calc(100vh-48px-72px)] grid-cols-1 lg:grid-cols-12">
        <section className="px-5 py-10 lg:col-span-7 lg:px-16 xl:px-20">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepId === funnelInitialStepId}
            className="mb-5 inline-flex items-center gap-1 rounded px-1 py-1 text-xs font-medium text-[#4e5c86] transition-all duration-150 hover:text-[#2f54eb] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="max-w-[520px]">
            <h1 className="text-[48px] text-[clamp(32px,3.2vw,48px)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1f2937]">{step.title || 'Continue'}</h1>
            {step.description ? <p className="mt-2 text-sm text-[#60709a]">{step.description}</p> : null}
            {error ? <p className="mt-3 text-sm font-semibold text-[#b63d3d]">{error}</p> : null}
            {initializing ? <p className="mt-3 text-xs text-[#60709a]">Starting application session...</p> : null}

            <StepRenderer
              step={step}
              value={value}
              setValue={setStepValue}
            />

            {stepId === 'accountCreationFlow' ? (
              <button
                type="button"
                onClick={handleOpenEmail}
                className="mt-6 inline-flex h-10 min-w-[140px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0]"
              >
                Open your email
              </button>
            ) : step.next ? (
              <div className="mt-6 flex items-center gap-3">
                {step.allowSkip ? (
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={initializing || saving}
                    className="inline-flex h-10 min-w-[88px] items-center justify-center rounded border border-[#9aa4ae] bg-white px-4 text-sm font-semibold text-[#475569] transition-all duration-150 hover:bg-[#f3f6ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skip
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || initializing || saving}
                  className="inline-flex h-10 min-w-[88px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Next'}
                </button>
              </div>
            ) : (
              <div className="mt-6 max-w-[460px] rounded-md border border-[#cfd8ff] bg-[#eef2ff] p-3 text-center text-sm font-semibold text-[#1f3aa0]">
                Funnel complete
              </div>
            )}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-[#d6d9db] bg-white lg:col-span-5 lg:block">
          <div className="absolute inset-0 bg-[#f2f4f5]" />
          <div className="absolute left-[6%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute left-[24%] top-0 h-full w-[80px] bg-[#f6f7f8]" />
          <div className="absolute right-[18%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute right-0 top-0 h-full w-[120px] bg-[#cfd8e2]" />
          <div className="absolute left-[-10%] top-[14%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute right-[-8%] top-[36%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute left-[34%] top-[64%] h-[180px] w-[340px] rotate-[38deg] bg-[#ffffff]" />

          <div className="absolute left-[18%] top-[0%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
              alt="investor"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute left-[18%] top-[40%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
              alt="borrower"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute right-[2%] top-[24%] h-[48%] w-[36%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"
              alt="property work"
              className="h-full w-full object-cover"
            />
          </div>
        </aside>
      </main>

      <footer className="border-t border-[#d9dddd] bg-[#f2f3f3] px-5 py-3 text-[11px] text-[#6b7280]">
        <p>Terms of Service | Privacy Policy | Disclosures</p>
      </footer>
    </div>
  );
}
