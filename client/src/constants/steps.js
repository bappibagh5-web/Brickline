export const STEPS = ['application', 'property', 'borrower', 'guarantor'];

export function createInitialFormData() {
  return {
    application: {},
    property: {},
    borrower: {},
    guarantor: {}
  };
}
