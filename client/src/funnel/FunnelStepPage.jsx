import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { funnelConfig, funnelInitialStepId } from './config.js';
import { useFunnel } from './FunnelContext.jsx';
import { getNextRoute, getStepByRoute } from './utils.js';
import { getStoredApplicationId, setStoredApplicationId } from './session.js';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
];

function StepRenderer({ step, value, setValue }) {
  if (step.options) {
    return (
      <div className="mt-6 grid gap-3">
        {step.options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={`rounded-xl border px-4 py-4 text-left text-base font-semibold transition ${
                selected
                  ? 'border-[#2f53eb] bg-[#eef2ff] text-[#2342c4]'
                  : 'border-[#dbe2ef] bg-white text-[#263157] hover:border-[#b8c6ee]'
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
          className="h-12 w-full rounded-xl border border-[#dbe2ef] bg-white px-4 text-base text-[#22305a] focus:border-[#4363ee] focus:outline-none"
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
    return (
      <div className="mt-6">
        <input
          type={step.inputType || 'text'}
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-12 w-full rounded-xl border border-[#dbe2ef] bg-white px-4 text-base text-[#22305a] placeholder:text-[#8d96b6] focus:border-[#4363ee] focus:outline-none"
          placeholder="Type your answer"
        />
      </div>
    );
  }

  return null;
}

export default function FunnelStepPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { answers, setAnswer } = useFunnel();
  const [applicationId, setApplicationId] = useState(
    () => searchParams.get('applicationId') || getStoredApplicationId() || ''
  );
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');

  const current = getStepByRoute(location.pathname);

  if (!current) {
    return <Navigate to={funnelConfig[funnelInitialStepId].route} replace />;
  }

  const { stepId, step } = current;
  const value = step.key ? answers[step.key] : null;

  const canProceed = step.key ? Boolean(String(value || '').trim()) : true;

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

  const handleNext = async () => {
    if (!canProceed) return;

    setError('');

    if (step.key && applicationId) {
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step_key: stepId,
          data: {
            [step.key]: value
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || 'Failed to save step.');
        return;
      }
    }

    const nextRoute = getNextRoute(stepId, value);
    if (!nextRoute) return;
    if (applicationId) {
      navigate(`${nextRoute}?applicationId=${applicationId}`);
      return;
    }
    navigate(nextRoute);
  };

  const handleBack = () => {
    if (stepId === funnelInitialStepId) return;
    navigate(-1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6fd] px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-[#dfe4f1] bg-white p-8 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepId === funnelInitialStepId}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4e5c86] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6d789a]">Brickline</p>
        </div>

        <h1 className="text-3xl font-bold text-[#1f2747]">{step.title || 'Continue'}</h1>
        {step.description ? <p className="mt-2 text-base text-[#60709a]">{step.description}</p> : null}
        {error ? <p className="mt-3 text-sm font-semibold text-[#b63d3d]">{error}</p> : null}
        {initializing ? <p className="mt-3 text-sm text-[#60709a]">Starting application session...</p> : null}

        <StepRenderer
          step={step}
          value={value}
          setValue={(nextValue) => setAnswer(step.key, nextValue)}
        />

        {step.next ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || initializing}
            className="topbar-btn mt-7 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <div className="mt-7 rounded-xl border border-[#d9e4ff] bg-[#eef3ff] p-4 text-center text-sm font-semibold text-[#2e51d4]">
            Funnel complete
          </div>
        )}
      </div>
    </div>
  );
}
