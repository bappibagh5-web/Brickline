const { calculateLoanMetrics } = require('../services/calculatorService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function calculate(req, res, next) {
  try {
    const body = req.body || {};

    const requiredFields = [
      'purchase_price',
      'rehab_budget',
      'purchase_advance_percent',
      'rehab_advance_percent',
      'current_value',
      'comp_value',
      'rehab_factor'
    ];

    const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length > 0) {
      throw createHttpError(400, `Missing required fields: ${missing.join(', ')}`);
    }

    const data = calculateLoanMetrics(body);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    if (!error.status) {
      error.status = 400;
    }
    next(error);
  }
}

module.exports = {
  calculate
};
