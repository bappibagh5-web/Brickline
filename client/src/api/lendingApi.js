async function parseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return response.json();
}

export async function getApplication(apiBaseUrl, applicationId) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to fetch application.');
  }

  return payload;
}

export async function patchApplicationStep(apiBaseUrl, applicationId, stepName, stepData) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      [stepName]: stepData
    })
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to save application step.');
  }

  return payload;
}

export async function getFields(apiBaseUrl, product, groupName) {
  const params = new URLSearchParams({
    product,
    group: groupName
  });
  const response = await fetch(`${apiBaseUrl}/fields?${params.toString()}`);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load fields.');
  }

  return Array.isArray(payload) ? payload : [];
}
