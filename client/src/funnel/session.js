const APPLICATION_ID_STORAGE_KEY = 'brickline_application_id';

export function getStoredApplicationId() {
  return window.localStorage.getItem(APPLICATION_ID_STORAGE_KEY);
}

export function setStoredApplicationId(applicationId) {
  if (!applicationId) return;
  window.localStorage.setItem(APPLICATION_ID_STORAGE_KEY, applicationId);
}

export function clearStoredApplicationId() {
  window.localStorage.removeItem(APPLICATION_ID_STORAGE_KEY);
}
