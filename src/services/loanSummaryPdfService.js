const PDFDocument = require('pdfkit');
const { calculateLoanMetrics } = require('./calculatorService');

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCurrency(value) {
  const numeric = toNumber(value, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(numeric);
}

function formatPercent(value) {
  const numeric = toNumber(value, 0);
  return `${numeric.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString('en-US');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US');
}

function getAddress(data) {
  return (
    data.finance_property_full_address
    || data.purchase_property_full_address
    || data.lead_property_full_address
    || data.full_address
    || data.property_address
    || 'N/A'
  );
}

function getBorrowerName(data) {
  const borrowerDetails = data.borrower_details || {};
  const firstName = borrowerDetails.first_name || data.first_name || '';
  const lastName = borrowerDetails.last_name || data.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Borrower';
}

function buildMetrics(data) {
  return calculateLoanMetrics({
    purchase_price: toNumber(data.purchase_price, 60000),
    rehab_budget: toNumber(data.rehab_budget, 60000),
    purchase_advance_percent: toNumber(data.purchase_advance_percent, 75),
    rehab_advance_percent: toNumber(data.rehab_advance_percent, 100),
    current_value: toNumber(data.current_value, toNumber(data.purchase_price, 60000)),
    comp_value: toNumber(data.comp_value, 250000),
    rehab_factor: toNumber(data.rehab_factor, 0.6)
  });
}

function writeSectionHeading(doc, heading) {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1f2937').text(heading);
  doc.moveDown(0.35);
  doc.strokeColor('#d1d5db').lineWidth(1).moveTo(doc.x, doc.y).lineTo(560, doc.y).stroke();
  doc.moveDown(0.4);
}

function writeRow(doc, label, value) {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#4b5563')
    .text(label, { continued: true });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#111827')
    .text(` ${value}`);
}

async function generateLoanSummaryPdf(application) {
  const data = application?.application_data || {};
  const metrics = buildMetrics(data);
  const selectedProduct = data.selected_loan_product || metrics.loan_products?.[0] || {};
  const downPayment = Math.max(toNumber(data.purchase_price, 60000) - metrics.purchase_loan, 0);
  const originationFee = metrics.total_loan * 0.02;
  const serviceFee = 1495;
  const cashToClose = downPayment + originationFee + serviceFee;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const completed = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(19).fillColor('#111827').text('Brickline Loan Summary');
  doc.moveDown(0.6);
  writeRow(doc, 'Date:', formatDate(new Date()));
  writeRow(doc, 'Borrower:', getBorrowerName(data));
  writeRow(doc, 'Property Address:', getAddress(data));

  writeSectionHeading(doc, 'Loan Details');
  writeRow(doc, 'Total Loan Amount:', formatCurrency(metrics.total_loan));
  writeRow(doc, 'Purchase Loan Amount:', formatCurrency(metrics.purchase_loan));
  writeRow(doc, 'Rehab Amount:', formatCurrency(metrics.rehab_loan));
  writeRow(doc, 'Monthly Payment:', formatCurrency(selectedProduct.monthly_payment || 0));
  writeRow(doc, 'Interest Rate:', formatPercent(selectedProduct.rate || 0));

  writeSectionHeading(doc, 'Costs');
  writeRow(doc, 'Cash to Close:', formatCurrency(cashToClose));
  writeRow(doc, 'Down Payment:', formatCurrency(downPayment));
  writeRow(doc, 'Origination Fee:', formatCurrency(originationFee));
  writeRow(doc, 'Service Fee:', formatCurrency(serviceFee));

  writeSectionHeading(doc, 'Details');
  writeRow(doc, 'Loan Term:', `${selectedProduct.term || 12} months`);
  writeRow(doc, 'Loan Type:', 'Hard Money');
  writeRow(doc, 'Interest-only Period:', `${selectedProduct.term || 12} months`);
  writeRow(doc, 'Signing Date:', formatDate(data.preferred_signing_date));
  writeRow(doc, 'Purpose:', data.loan_program || 'Investment');
  writeRow(doc, 'Property Type:', data.loan_program || 'Bridge');
  writeRow(doc, 'Purchase Price:', formatCurrency(data.purchase_price || 0));
  writeRow(doc, 'ARV:', formatCurrency(metrics.arv));
  writeRow(doc, 'LTC:', formatPercent(metrics.ltc));

  doc.end();
  return completed;
}

module.exports = {
  generateLoanSummaryPdf
};

