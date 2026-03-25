import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { calculateLoan, getApplication, saveApplicationStep } from '../api/lendingApi.js';
import CalculatorForm from '../components/CalculatorForm.jsx';
import CalculatorResults from '../components/CalculatorResults.jsx';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';

function toPercentDisplay(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return numeric > 0 && numeric <= 1 ? String(numeric * 100) : String(numeric);
}

export default function RateCalculatorPage() {
  const apiBaseUrl = getApiBaseUrl();
  const { applicationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [form, setForm] = useState({
    property_state: '',
    est_fico: '',
    refinance: 'no',
    property_rehab: 'yes',
    purchase_price: '',
    rehab_budget: '',
    purchase_advance_percent: '80',
    rehab_advance_percent: '100',
    comp_value: '',
    rehab_factor: '0.6'
  });

  useEffect(() => {
    if (!applicationId) return;

    let ignore = false;
    const loadApplication = async () => {
      setPageLoading(true);
      try {
        const application = await getApplication(apiBaseUrl, applicationId);
        if (ignore) return;
        const data = application?.application_data || {};
        setForm((prev) => ({
          ...prev,
          property_state: data.property_state || prev.property_state,
          refinance: data.refinance || prev.refinance,
          property_rehab: data.property_rehab || prev.property_rehab,
          purchase_price: data.purchase_price ?? prev.purchase_price,
          rehab_budget: data.rehab_budget ?? prev.rehab_budget,
          purchase_advance_percent: data.purchase_advance_percent !== undefined
            ? toPercentDisplay(data.purchase_advance_percent)
            : prev.purchase_advance_percent,
          rehab_advance_percent: data.rehab_advance_percent !== undefined
            ? toPercentDisplay(data.rehab_advance_percent)
            : prev.rehab_advance_percent,
          comp_value: data.comp_value ?? prev.comp_value,
          rehab_factor: data.rehab_factor ?? prev.rehab_factor
        }));
      } catch (_loadError) {
        if (!ignore) {
          setError('Could not load application data.');
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    };

    loadApplication();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, applicationId]);

  useEffect(() => {
    if (form.purchase_price === '' || form.purchase_price === null || form.purchase_price === undefined) {
      setMetrics(null);
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await calculateLoan(apiBaseUrl, {
          purchase_price: Number(form.purchase_price || 0),
          rehab_budget: Number(form.rehab_budget || 0),
          current_value: Number(form.purchase_price || 0),
          comp_value: Number(form.comp_value || 0),
          purchase_advance_percent: Number(form.purchase_advance_percent || 0),
          rehab_advance_percent: form.property_rehab === 'yes' ? Number(form.rehab_advance_percent || 0) : 0,
          rehab_factor: Number(form.rehab_factor || 0)
        });
        if (!ignore) {
          setMetrics(result);
        }
      } catch (calcError) {
        if (!ignore) {
          setError(calcError.message || 'Calculator failed.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    apiBaseUrl,
    form.purchase_price,
    form.rehab_budget,
    form.comp_value,
    form.purchase_advance_percent,
    form.rehab_advance_percent,
    form.rehab_factor,
    form.property_rehab
  ]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      ...(field === 'property_rehab' && value === 'no'
        ? { rehab_advance_percent: '0', rehab_budget: '0' }
        : {}),
      [field]: value
    }));
  };

  const handleChooseProduct = async (product) => {
    if (!applicationId || !product || loading || savingProduct) return;

    setSavingProduct(true);
    setError('');
    try {
      await saveApplicationStep(apiBaseUrl, applicationId, 'selected_loan_product', {
        term: product.term,
        rate: product.rate,
        monthly_payment: product.monthly_payment
      });
    } catch (saveError) {
      setError(saveError.message || 'Failed to save selected loan product.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-[920px] space-y-4">
        <header>
          <h1 className="section-title">Estimate Your Bridge Rate</h1>
        </header>

        {error ? <p className="text-sm font-medium text-[#b63d3d]">{error}</p> : null}
        {pageLoading ? <p className="text-sm text-[#60709a]">Loading application...</p> : null}

        <div className="space-y-4">
          <CalculatorForm
            form={form}
            onFormChange={handleFormChange}
            metrics={metrics}
            loading={loading}
          />
          <CalculatorResults
            metrics={metrics}
            loading={loading}
            savingProduct={savingProduct}
            onChooseProduct={handleChooseProduct}
          />
        </div>
      </div>
    </div>
  );
}
