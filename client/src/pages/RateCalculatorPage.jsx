import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  calculateDscrLoan,
  calculateLoan,
  getApplication,
  saveApplicationStep
} from '../api/lendingApi.js';
import CalculatorForm from '../components/CalculatorForm.jsx';
import CalculatorResults from '../components/CalculatorResults.jsx';
import DscrCalculatorForm from '../components/DscrCalculatorForm.jsx';
import DscrCalculatorResults from '../components/DscrCalculatorResults.jsx';
import OnboardingLayout from '../funnel/OnboardingLayout.jsx';
import {
  getStoredApplicationId,
  setStoredApplicationId,
  setStoredSelectedLoan
} from '../funnel/session.js';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';

function formatCurrencyInput(value) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numeric);
}

function parseCurrencyInput(value) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

const BRIDGE_DEFAULTS = {
  property_state: 'FL',
  property_type: '',
  est_fico: '700-719',
  personally_guaranteed: 'Yes',
  refinance: 'no',
  owned_six_months: 'yes',
  property_rehab: 'yes',
  purchase_price: '$200,000',
  purchase_loan_amount: '$150,000',
  refinance_loan_amount: '$150,000',
  remaining_mortgage: '$0',
  rehab_budget: '$75,000',
  comp_value: ''
};

const DSCR_DEFAULTS = {
  property_state: 'FL',
  property_type: 'Single Family',
  fico_bucket: '760-779',
  loan_amount: '$150,000',
  refinance: 'yes',
  purchase_price: '$300,000',
  estimated_property_value: '$450,000',
  remaining_mortgage: '$420,000',
  prepayment_penalty: '3-year',
  monthly_rent: '',
  annual_insurance: '',
  annual_taxes: '',
  monthly_hoa: ''
};

export default function RateCalculatorPage() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [searchParams] = useSearchParams();
  const modeParam = String(searchParams.get('mode') || searchParams.get('loanProgram') || '').toLowerCase();
  const forceRentalMode = modeParam === 'dscr' || modeParam === 'rental';
  const effectiveApplicationId = applicationId || searchParams.get('applicationId') || getStoredApplicationId() || '';
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [loanProgram, setLoanProgram] = useState(forceRentalMode ? 'rental' : '');
  const [showDscrSection, setShowDscrSection] = useState(false);
  const [form, setForm] = useState({
    ...BRIDGE_DEFAULTS,
    ...DSCR_DEFAULTS
  });

  const isRentalCalculator = loanProgram === 'rental';
  const isFloridaCondo =
    String(form.property_state || '').toUpperCase() === 'FL'
    && String(form.property_type || '').trim() === 'Condo';

  const rehabCostInvalid = form.property_rehab === 'yes' && parseCurrencyInput(form.rehab_budget) < 1000;
  const requiresRemainingMortgage = form.refinance === 'yes' && form.owned_six_months === 'yes';
  const remainingMortgageInput = String(form.remaining_mortgage || '').trim();
  const remainingMortgageAmount = parseCurrencyInput(form.remaining_mortgage);
  const requiresArv = form.property_rehab === 'yes';
  const parsedArv = parseCurrencyInput(form.comp_value);

  const bridgeErrors = useMemo(
    () => Array.from(
      new Set([
        ...(isFloridaCondo ? ['We do not currently finance this property type in Florida.'] : []),
        ...(requiresArv && parsedArv <= 0 ? ['Please enter After Repair Value to continue'] : []),
        ...(rehabCostInvalid ? ['Minimum rehab cost is $1,000'] : []),
        ...(requiresRemainingMortgage && (!remainingMortgageInput || remainingMortgageAmount <= 0)
          ? ['Please enter remaining mortgage balance to continue']
          : []),
        ...(error && !isRentalCalculator ? [error] : [])
      ])
    ),
    [
      error,
      isFloridaCondo,
      isRentalCalculator,
      parsedArv,
      rehabCostInvalid,
      remainingMortgageAmount,
      remainingMortgageInput,
      requiresArv,
      requiresRemainingMortgage
    ]
  );

  const rentalErrors = useMemo(
    () => Array.from(
      new Set([
        ...(isFloridaCondo ? ['We do not currently finance this property type in Florida.'] : []),
        ...(error && isRentalCalculator ? [error] : [])
      ])
    ),
    [error, isFloridaCondo, isRentalCalculator]
  );

  useEffect(() => {
    if (!effectiveApplicationId) return;
    setStoredApplicationId(effectiveApplicationId);

    let ignore = false;
    const loadApplication = async () => {
      setPageLoading(true);
      try {
        const application = await getApplication(apiBaseUrl, effectiveApplicationId);
        if (ignore) return;

        const data = application?.application_data || {};
        const hasRentalData = Boolean(
          data.rental_experience_level !== undefined
          || data.rental_property_state !== undefined
          || data.rental_entity_question !== undefined
          || data.rental_entity_name !== undefined
          || data.rental_property_address !== undefined
          || data.rental_confirmation !== undefined
          || data.fico_bucket !== undefined
          || data.prepayment_penalty !== undefined
          || data.calculator_inputs?.fico_bucket !== undefined
          || data.calculator_inputs?.prepayment_penalty !== undefined
          || Object.keys(data).some((key) => key.startsWith('rental_'))
        );
        const nextLoanProgram = String(data.loan_program || '').toLowerCase();
        if (forceRentalMode) {
          setLoanProgram('rental');
        } else {
          setLoanProgram(nextLoanProgram || (hasRentalData ? 'rental' : ''));
        }

        const calculatorInputs = data.calculator_inputs || {};
        const personallyGuaranteed = String(
          data.personally_guaranteed
          || data.personallyGuaranteed
          || calculatorInputs.personally_guaranteed
          || 'Yes'
        ).toLowerCase() === 'no' ? 'No' : 'Yes';

        setForm((prev) => ({
          ...prev,
          property_state:
            data.property_state
            || data.state
            || data.lead_property_state
            || data.purchase_property_state
            || calculatorInputs.property_state
            || prev.property_state,
          property_type:
            data.property_type
            || calculatorInputs.property_type
            || prev.property_type,
          est_fico: data.est_fico || calculatorInputs.est_fico || prev.est_fico,
          personally_guaranteed: personallyGuaranteed,
          refinance: data.refinance || calculatorInputs.refinance || prev.refinance,
          owned_six_months: data.owned_six_months || calculatorInputs.owned_six_months || prev.owned_six_months,
          property_rehab: data.property_rehab || calculatorInputs.property_rehab || prev.property_rehab,
          purchase_price:
            data.purchase_price !== undefined
              ? formatCurrencyInput(data.purchase_price)
              : (calculatorInputs.purchase_price !== undefined ? formatCurrencyInput(calculatorInputs.purchase_price) : prev.purchase_price),
          purchase_loan_amount:
            (data.loan_amount !== undefined || data.purchase_loan !== undefined)
              ? formatCurrencyInput(data.loan_amount ?? data.purchase_loan)
              : (calculatorInputs.purchase_loan_amount !== undefined ? formatCurrencyInput(calculatorInputs.purchase_loan_amount) : prev.purchase_loan_amount),
          refinance_loan_amount:
            (data.refinance_loan_amount !== undefined || data.refinance_loan !== undefined || (data.refinance === 'yes' && data.loan_amount !== undefined))
              ? formatCurrencyInput(data.refinance_loan_amount ?? data.refinance_loan ?? data.loan_amount)
              : (calculatorInputs.refinance_loan_amount !== undefined ? formatCurrencyInput(calculatorInputs.refinance_loan_amount) : prev.refinance_loan_amount),
          remaining_mortgage:
            data.remaining_mortgage !== undefined
              ? formatCurrencyInput(data.remaining_mortgage)
              : (calculatorInputs.remaining_mortgage !== undefined ? formatCurrencyInput(calculatorInputs.remaining_mortgage) : prev.remaining_mortgage),
          rehab_budget:
            (data.rehab_cost !== undefined || data.rehab_budget !== undefined)
              ? formatCurrencyInput(data.rehab_cost ?? data.rehab_budget)
              : (calculatorInputs.rehab_budget !== undefined ? formatCurrencyInput(calculatorInputs.rehab_budget) : prev.rehab_budget),
          comp_value:
            (() => {
              const rawArv = data.arv ?? data.comp_value ?? calculatorInputs.arv ?? calculatorInputs.comp_value;
              const parsed = Number(rawArv);
              if (!Number.isFinite(parsed) || parsed <= 0) return '';
              return formatCurrencyInput(parsed);
            })(),
          fico_bucket: data.fico_bucket || calculatorInputs.fico_bucket || prev.fico_bucket,
          loan_amount:
            data.loan_amount !== undefined
              ? formatCurrencyInput(data.loan_amount)
              : (calculatorInputs.loan_amount !== undefined ? formatCurrencyInput(calculatorInputs.loan_amount) : prev.loan_amount),
          estimated_property_value:
            data.estimated_property_value !== undefined
              ? formatCurrencyInput(data.estimated_property_value)
              : (calculatorInputs.estimated_property_value !== undefined
                ? formatCurrencyInput(calculatorInputs.estimated_property_value)
                : prev.estimated_property_value),
          prepayment_penalty: data.prepayment_penalty || calculatorInputs.prepayment_penalty || prev.prepayment_penalty,
          monthly_rent:
            data.monthly_rent !== undefined
              ? formatCurrencyInput(data.monthly_rent)
              : (calculatorInputs.monthly_rent !== undefined ? formatCurrencyInput(calculatorInputs.monthly_rent) : prev.monthly_rent),
          annual_insurance:
            data.annual_insurance !== undefined
              ? formatCurrencyInput(data.annual_insurance)
              : (calculatorInputs.annual_insurance !== undefined ? formatCurrencyInput(calculatorInputs.annual_insurance) : prev.annual_insurance),
          annual_taxes:
            data.annual_taxes !== undefined
              ? formatCurrencyInput(data.annual_taxes)
              : (calculatorInputs.annual_taxes !== undefined ? formatCurrencyInput(calculatorInputs.annual_taxes) : prev.annual_taxes),
          monthly_hoa:
            data.monthly_hoa !== undefined
              ? formatCurrencyInput(data.monthly_hoa)
              : (calculatorInputs.monthly_hoa !== undefined ? formatCurrencyInput(calculatorInputs.monthly_hoa) : prev.monthly_hoa)
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
  }, [apiBaseUrl, effectiveApplicationId, forceRentalMode]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        if (isRentalCalculator) {
          if (rentalErrors.length > 0) {
            setMetrics(null);
            setLoading(false);
            return;
          }

          const loanAmount = parseCurrencyInput(form.loan_amount);
          const purchasePrice = parseCurrencyInput(form.purchase_price);
          const estimatedPropertyValue = parseCurrencyInput(form.estimated_property_value);
          const hasCoreInputs = Boolean(
            form.property_state
            && form.property_type
            && form.fico_bucket
            && form.prepayment_penalty
            && loanAmount > 0
            && (form.refinance === 'yes' ? estimatedPropertyValue > 0 : purchasePrice > 0)
          );

          if (!hasCoreInputs) {
            setMetrics(null);
            setLoading(false);
            return;
          }

          const payload = {
            property_state: form.property_state,
            property_type: form.property_type,
            fico_bucket: form.fico_bucket,
            loan_amount: loanAmount,
            refinance: form.refinance,
            prepayment_penalty: form.prepayment_penalty,
            purchase_price: purchasePrice,
            estimated_property_value: estimatedPropertyValue,
            remaining_mortgage: parseCurrencyInput(form.remaining_mortgage)
          };

          if (showDscrSection) {
            payload.monthly_rent = parseCurrencyInput(form.monthly_rent);
            payload.annual_insurance = parseCurrencyInput(form.annual_insurance);
            payload.annual_taxes = parseCurrencyInput(form.annual_taxes);
            payload.monthly_hoa = parseCurrencyInput(form.monthly_hoa);
          }

          const result = await calculateDscrLoan(apiBaseUrl, payload);
          if (!ignore) {
            setMetrics(result);
          }
          return;
        }

        if (form.purchase_price === '' || form.purchase_price === null || form.purchase_price === undefined) {
          setMetrics(null);
          setLoading(false);
          return;
        }

        if (bridgeErrors.length > 0) {
          setMetrics(null);
          setLoading(false);
          return;
        }

        const purchaseLoanAmount = parseCurrencyInput(form.purchase_loan_amount);
        const refinanceLoanAmount = parseCurrencyInput(form.refinance_loan_amount);
        const effectiveLoanAmount = form.refinance === 'yes' ? refinanceLoanAmount : purchaseLoanAmount;
        const personallyGuaranteedValue = String(form.personally_guaranteed || '').trim();
        const requiresRehabCost = form.property_rehab === 'yes';
        const parsedRehabCost = parseCurrencyInput(form.rehab_budget);

        if (!personallyGuaranteedValue) {
          setMetrics(null);
          setLoading(false);
          return;
        }

        const payload = {
          fico_bucket: form.est_fico,
          est_fico: form.est_fico,
          personally_guaranteed: personallyGuaranteedValue,
          property_type: form.property_type,
          propertyType: form.property_type,
          refinance: form.refinance,
          owned_six_months: form.owned_six_months,
          prop_owned_6_months: form.owned_six_months,
          property_rehab: form.property_rehab,
          estimated_property_value: parseCurrencyInput(form.purchase_price),
          purchase_price: parseCurrencyInput(form.purchase_price),
          loan_amount: effectiveLoanAmount,
          purchase_loan_amount: purchaseLoanAmount,
          refinance_loan_amount: refinanceLoanAmount,
          remaining_mortgage: requiresRemainingMortgage ? remainingMortgageAmount : 0,
          rehab_cost: requiresRehabCost ? parsedRehabCost : null
        };
        if (requiresArv) {
          payload.arv = parsedArv;
        }

        const result = await calculateLoan(apiBaseUrl, payload);
        if (!ignore) {
          setMetrics(result);
        }
      } catch (calcError) {
        if (!ignore) {
          setError(calcError.message || 'Calculator failed.');
          setMetrics(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    apiBaseUrl,
    bridgeErrors.length,
    form.annual_insurance,
    form.annual_taxes,
    form.comp_value,
    form.est_fico,
    form.estimated_property_value,
    form.fico_bucket,
    form.loan_amount,
    form.monthly_hoa,
    form.monthly_rent,
    form.owned_six_months,
    form.personally_guaranteed,
    form.prepayment_penalty,
    form.property_rehab,
    form.property_type,
    form.property_state,
    form.purchase_loan_amount,
    form.purchase_price,
    form.refinance,
    form.refinance_loan_amount,
    form.rehab_budget,
    form.remaining_mortgage,
    isRentalCalculator,
    parsedArv,
    remainingMortgageAmount,
    rentalErrors.length,
    requiresArv,
    requiresRemainingMortgage,
    showDscrSection
  ]);

  const handleFormChange = (field, value) => {
    const isCurrencyField = [
      'purchase_price',
      'purchase_loan_amount',
      'refinance_loan_amount',
      'remaining_mortgage',
      'rehab_budget',
      'comp_value',
      'loan_amount',
      'estimated_property_value',
      'monthly_rent',
      'annual_insurance',
      'annual_taxes',
      'monthly_hoa'
    ].includes(field);
    const nextValue = isCurrencyField ? formatCurrencyInput(value) : value;

    setForm((prev) => {
      const next = { ...prev, [field]: nextValue };

      if (!isRentalCalculator) {
        if (field === 'property_rehab' && value === 'no') {
          next.rehab_budget = '$0';
          next.comp_value = '';
        }
        if (field === 'refinance' && value === 'no') {
          next.refinance_loan_amount = '';
          next.remaining_mortgage = '';
        }
        if (field === 'refinance' && value === 'yes' && !next.refinance_loan_amount) {
          next.refinance_loan_amount = prev.purchase_loan_amount || '$0';
        }
        if (field === 'owned_six_months' && value === 'no') {
          next.remaining_mortgage = '';
        }
      }

      if (isRentalCalculator && field === 'refinance' && value === 'yes' && !next.estimated_property_value) {
        next.estimated_property_value = prev.purchase_price || '$0';
      }

      return next;
    });
  };

  const handleChooseProduct = async (product) => {
    if (!effectiveApplicationId || !product || loading || savingProduct) return;
    if (isFloridaCondo) {
      setError('We do not currently finance this property type in Florida.');
      return;
    }
    if (!String(form.property_type || '').trim()) {
      setError('Property Type is required.');
      return;
    }

    setSavingProduct(true);
    setError('');
    try {
      const selectedLoan = {
        term: product.term,
        rate: product.rate,
        monthlyPayment: product.monthly_payment,
        monthly_payment: product.monthly_payment
      };
      setStoredSelectedLoan(selectedLoan);

      const purchasePrice = parseCurrencyInput(form.purchase_price);
      const purchaseLoanAmount = parseCurrencyInput(form.purchase_loan_amount);
      const refinanceLoanAmount = parseCurrencyInput(form.refinance_loan_amount);
      const remainingMortgage = parseCurrencyInput(form.remaining_mortgage);
      const effectiveLoanAmount = isRentalCalculator
        ? parseCurrencyInput(form.loan_amount)
        : (form.refinance === 'yes' ? refinanceLoanAmount : purchaseLoanAmount);
      const rehabBudget = parseCurrencyInput(form.rehab_budget);
      const compValue = parseCurrencyInput(form.comp_value);
      const includesRehab = form.property_rehab === 'yes' && compValue > 0;

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selected_loan_product', {
        term: product.term,
        rate: product.rate,
        monthly_payment: product.monthly_payment,
        monthlyPayment: product.monthly_payment,
        total_loan: Number(metrics?.total_loan || effectiveLoanAmount || 0),
        purchase_loan: effectiveLoanAmount || Number(metrics?.purchase_loan || 0),
        rehab_loan: Number(metrics?.rehab_loan || 0)
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selectedLoan', {
        term: product.term,
        rate: product.rate,
        monthlyPayment: product.monthly_payment
      });

      const calculatorInputsPayload = isRentalCalculator
        ? {
            property_state: form.property_state,
            property_type: form.property_type,
            fico_bucket: form.fico_bucket,
            loan_amount: parseCurrencyInput(form.loan_amount),
            refinance: form.refinance,
            prepayment_penalty: form.prepayment_penalty,
            purchase_price: purchasePrice,
            estimated_property_value: parseCurrencyInput(form.estimated_property_value),
            remaining_mortgage: remainingMortgage,
            monthly_rent: parseCurrencyInput(form.monthly_rent),
            annual_insurance: parseCurrencyInput(form.annual_insurance),
            annual_taxes: parseCurrencyInput(form.annual_taxes),
            monthly_hoa: parseCurrencyInput(form.monthly_hoa)
          }
        : {
            property_state: form.property_state,
            property_type: form.property_type,
            propertyType: form.property_type,
            est_fico: form.est_fico,
            personally_guaranteed: form.personally_guaranteed,
            refinance: form.refinance,
            owned_six_months: form.owned_six_months,
            prop_owned_6_months: form.owned_six_months,
            property_rehab: form.property_rehab,
            estimated_property_value: purchasePrice,
            purchase_price: purchasePrice,
            loan_amount: effectiveLoanAmount,
            purchase_loan: purchaseLoanAmount,
            purchase_loan_amount: purchaseLoanAmount,
            refinance_loan: refinanceLoanAmount,
            refinance_loan_amount: refinanceLoanAmount,
            remaining_mortgage: form.refinance === 'yes' && form.owned_six_months === 'yes' ? remainingMortgage : 0,
            rehab_cost: form.property_rehab === 'yes' ? rehabBudget : null,
            rehab_budget: form.property_rehab === 'yes' ? rehabBudget : null
          };

      if (!isRentalCalculator && includesRehab) {
        calculatorInputsPayload.arv = compValue;
        calculatorInputsPayload.comp_value = compValue;
      }

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_inputs', calculatorInputsPayload);

      const calculatorResultsPayload = {
        ...(metrics || {}),
        ...calculatorInputsPayload
      };
      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_results', calculatorResultsPayload);

      const nextRoute = loanProgram === 'rental'
        ? '/m/rental/confirmation'
        : '/m/standardBorrower/reviewSubmit';
      navigate(`${nextRoute}?applicationId=${effectiveApplicationId}`);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save selected loan product.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <OnboardingLayout
      stepNumber={loanProgram === 'rental' ? 9 : 8}
      totalSteps={loanProgram === 'rental' ? 14 : 9}
      onBack={() => navigate(-1)}
      disableBack={false}
    >
      <div className="space-y-3">
        <header>
          <h1 className="text-[clamp(34px,3.1vw,48px)] font-bold leading-tight tracking-[-0.02em] text-[#0b1f57]">
            {isRentalCalculator ? 'Estimate Your Rental Rate' : 'Estimate Your Bridge Rate'}
          </h1>
        </header>

        {pageLoading ? <p className="text-sm text-[#60709a]">Loading application...</p> : null}

        <div className="space-y-3">
          {isRentalCalculator ? (
            <>
              <DscrCalculatorForm
                form={form}
                metrics={metrics}
                loading={loading}
                showDscrSection={showDscrSection}
                onToggleDscrSection={() => setShowDscrSection((prev) => !prev)}
                onFormChange={handleFormChange}
              />
              <DscrCalculatorResults
                metrics={metrics}
                loading={loading}
                savingProduct={savingProduct}
                externalErrors={rentalErrors}
                onChooseProduct={handleChooseProduct}
              />
            </>
          ) : (
            <>
              <CalculatorForm
                form={form}
                onFormChange={handleFormChange}
                metrics={metrics}
                loading={loading}
                rehabCostInvalid={rehabCostInvalid}
              />
              <CalculatorResults
                metrics={metrics}
                loading={loading}
                savingProduct={savingProduct}
                disableChoose={isFloridaCondo}
                externalErrors={bridgeErrors}
                onChooseProduct={handleChooseProduct}
              />
            </>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
