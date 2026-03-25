function mapLoanProgramToLoanType(loanProgram) {
  if (loanProgram === 'rental') {
    return 'rental';
  }

  if (loanProgram === 'new_construction') {
    return 'construction';
  }

  return 'bridge';
}

export async function resolveLoanType(apiBaseUrl, applicationId) {
  if (!applicationId) return 'bridge';

  try {
    const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
    if (!response.ok) return 'bridge';

    const payload = await response.json();
    const loanProgram = payload?.application_data?.loan_program;
    return mapLoanProgramToLoanType(loanProgram);
  } catch (_error) {
    return 'bridge';
  }
}

export async function getEligibilityRoute(apiBaseUrl, applicationId) {
  const loanType = await resolveLoanType(apiBaseUrl, applicationId);
  return `/apply/${loanType}/${applicationId}/eligibility`;
}
