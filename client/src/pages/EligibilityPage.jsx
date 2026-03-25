import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';

export default function EligibilityPage() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const [isUsCitizen, setIsUsCitizen] = useState(false);
  const [nonOwnerOccupied, setNonOwnerOccupied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canContinue = isUsCitizen && nonOwnerOccupied && !saving;

  const handleContinue = async () => {
    if (!applicationId || !canContinue) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step_key: 'eligibility_confirmations',
          data: {
            is_us_citizen: true,
            non_owner_occupied: true
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save eligibility step.');
      }

      navigate(`/rate-calculator/${applicationId}/hard-money`);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save eligibility step.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f4] px-4 py-10 text-[#1f2937]">
      <div className="mx-auto w-full max-w-[600px] rounded-xl border border-[#e1e5f1] bg-white p-8 shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#546189] transition-colors hover:text-[#2f54eb]"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <h1 className="text-[28px] font-semibold leading-tight text-[#1f2747]">
          Please confirm that the following statements are true:
        </h1>

        <div className="mt-6 space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-[#e2e6f3] px-4 py-3">
            <input
              type="checkbox"
              checked={isUsCitizen}
              onChange={(event) => setIsUsCitizen(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#c9d1e6] text-[#2f54eb] focus:ring-[#2f54eb]"
            />
            <span className="text-[15px] text-[#2c375d]">I am a US citizen or a Permanent Resident</span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[#e2e6f3] px-4 py-3">
            <input
              type="checkbox"
              checked={nonOwnerOccupied}
              onChange={(event) => setNonOwnerOccupied(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#c9d1e6] text-[#2f54eb] focus:ring-[#2f54eb]"
            />
            <span className="text-[15px] text-[#2c375d]">I will not be living in the property</span>
          </label>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-[#b63d3d]">{error}</p> : null}

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 rounded-md border border-[#d7dded] px-5 text-sm font-semibold text-[#47537d] hover:bg-[#f4f7ff]"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className="h-10 rounded-md bg-[#2f54eb] px-6 text-sm font-semibold text-white transition-all hover:bg-[#2246d0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
