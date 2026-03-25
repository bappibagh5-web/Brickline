function toNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function roundPercent(value) {
  return Number((value * 100).toFixed(2));
}

function normalizePercent(value) {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return num > 1 ? num / 100 : num;
}

const MAX_LTARV = 0.75;
const LOAN_PRODUCTS = [
  { term: 12, rate: 8.5 },
  { term: 18, rate: 9.2 },
  { term: 24, rate: 9.8 }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateLoanMetrics(input) {
  const purchasePrice = toNumber(input.purchase_price, 'purchase_price');
  const rehabBudget = toNumber(input.rehab_budget, 'rehab_budget');
  const purchaseAdvanceRaw = toNumber(input.purchase_advance_percent, 'purchase_advance_percent');
  const rehabAdvanceRaw = toNumber(input.rehab_advance_percent, 'rehab_advance_percent');
  const purchaseAdvance = normalizePercent(purchaseAdvanceRaw);
  const rehabAdvance = normalizePercent(rehabAdvanceRaw);
  const currentValue = toNumber(input.current_value, 'current_value');
  const compValue = toNumber(input.comp_value, 'comp_value');
  const rehabFactor = toNumber(input.rehab_factor, 'rehab_factor');

  const purchaseLoan = purchasePrice * purchaseAdvance;
  const rehabLoan = rehabBudget * rehabAdvance;
  if (purchaseLoan > purchasePrice) {
    throw new Error('Invalid percentage normalization: purchase_loan cannot exceed purchase_price.');
  }
  const totalLoan = purchaseLoan + rehabLoan;
  const totalCost = purchasePrice + rehabBudget;
  const arv = 0.75 * compValue + 0.25 * (currentValue + rehabBudget * rehabFactor);
  const ltc = totalCost === 0 ? 0 : totalLoan / totalCost;
  const ltarv = arv === 0 ? 0 : totalLoan / arv;
  const spread = arv - totalLoan;
  const maxLoanBasedOnArv = arv * MAX_LTARV;
  const minLoanBasedOnArv = maxLoanBasedOnArv * 0.8;
  const goodSpreadThreshold = arv * 0.15;
  const lowSpreadThreshold = arv * 0.1;

  let dealRating = 'risky';
  if (ltarv <= 75 && spread >= goodSpreadThreshold) {
    dealRating = 'good';
  } else if (ltarv <= 85) {
    dealRating = 'medium';
  }

  const riskFlags = [];
  if (ltarv > 75) {
    riskFlags.push('High leverage (LTARV above 75%)');
  }
  if (ltc > 85) {
    riskFlags.push('High loan-to-cost ratio');
  }
  if (spread < lowSpreadThreshold) {
    riskFlags.push('Low equity spread');
  }

  let confidenceScore = 100;
  if (ltarv > 75) {
    confidenceScore -= 10;
  }
  if (ltc > 85) {
    confidenceScore -= 10;
  }
  if (spread < lowSpreadThreshold) {
    confidenceScore -= 10;
  }
  confidenceScore = clamp(confidenceScore, 0, 100);

  const loanProducts = LOAN_PRODUCTS.map((product) => ({
    term: product.term,
    rate: product.rate,
    monthly_payment: roundMoney((totalLoan * (product.rate / 100)) / 12)
  }));

  return {
    purchase_loan: roundMoney(purchaseLoan),
    rehab_loan: roundMoney(rehabLoan),
    total_loan: roundMoney(totalLoan),
    total_cost: roundMoney(totalCost),
    arv: roundMoney(arv),
    ltc: roundPercent(ltc),
    ltarv: roundPercent(ltarv),
    spread: roundMoney(spread),
    min_loan: roundMoney(minLoanBasedOnArv),
    max_loan: roundMoney(maxLoanBasedOnArv),
    loan_products: loanProducts,
    deal_rating: dealRating,
    risk_flags: riskFlags,
    confidence_score: Number(confidenceScore.toFixed(2))
  };
}

module.exports = {
  calculateLoanMetrics
};
