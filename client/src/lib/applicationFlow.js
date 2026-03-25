import { getResumeTargetRoute } from '../funnel/utils.js';

function appendAuthSource(route, applicationId) {
  const connector = route.includes('?') ? '&' : '?';
  return `${route}${connector}applicationId=${applicationId}&from=auth0`;
}

export async function getPostLoginFunnelRoute(apiBaseUrl, applicationId) {
  if (!applicationId) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/resume`);
    if (!response.ok) {
      return appendAuthSource('/m/standardBorrower/leadPropertyAddress', applicationId);
    }

    const payload = await response.json();
    const nextRoute = getResumeTargetRoute(payload?.last_step, payload?.data || {}, {
      isAuthenticated: true
    });

    if (!nextRoute) {
      return appendAuthSource('/m/standardBorrower/leadPropertyAddress', applicationId);
    }

    return appendAuthSource(nextRoute, applicationId);
  } catch (_error) {
    return appendAuthSource('/m/standardBorrower/leadPropertyAddress', applicationId);
  }
}
