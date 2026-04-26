const EXPERIENCE_STANDARD = ['none', 'one_two'];
const EXPERIENCE_PRO = ['three_four', 'five_plus'];
const RENTAL_EXPERIENCE_DISQUALIFY = ['none'];
const NEW_CONSTRUCTION_EXPERIENCE_DISQUALIFY = ['none', 'one_property'];

export const funnelConfig = {
  loanProgram: {
    step_key: 'loan_program',
    route: '/m/getRate/loanProgram',
    key: 'loan_program',
    title: 'What type of financing are you looking for?',
    options: [
      { label: 'Fix & Flip / Bridge', value: 'fix_flip' },
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Rental (DSCR)', value: 'rental' },
      { label: 'Not sure yet', value: 'unsure' }
    ],
    next: {
      rental: 'rentalExperience',
      fix_flip: 'dealsLast24',
      new_construction: 'newConstructionExitsLast60',
      unsure: 'dealsLast24'
    }
  },

  newConstructionExitsLast60: {
    step_key: 'new_construction_exits_last_60',
    route: '/m/newConstruction/exitsLast60',
    key: 'new_construction_exits_last_60',
    title: 'How many new construction projects have you exited in the last 60 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1 property', value: 'one_property' },
      { label: '2-4 properties', value: 'two_four' },
      { label: '5 or more properties', value: 'five_plus' }
    ],
    next: ({ value }) => (
      NEW_CONSTRUCTION_EXPERIENCE_DISQUALIFY.includes(value)
        ? 'newConstructionDisqualification'
        : 'newConstructionPropertyState'
    )
  },

  newConstructionDisqualification: {
    step_key: 'new_construction_disqualification',
    route: '/m/newConstruction/disqualified',
    title: 'This new construction program requires prior completed exits.',
    description: 'Please select another financing path to continue with Brickline.',
    type: 'disqualification',
    next: null
  },

  newConstructionPropertyState: {
    step_key: 'new_construction_property_state',
    route: '/m/newConstruction/property-state',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'newConstructionLeadCapture'
  },

  newConstructionLeadCapture: {
    step_key: 'new_construction_lead_capture',
    route: '/m/newConstruction/lead-capture',
    key: 'borrower',
    title: 'You’re one step away from seeing your financing path',
    type: 'leadCapture',
    next: ({ isAuthenticated }) => (isAuthenticated ? 'newConstructionEntityOwnership' : 'accountCreationFlow')
  },

  newConstructionEntityOwnership: {
    step_key: 'new_construction_entity_question',
    route: '/m/newConstruction/entity-ownership',
    key: 'new_construction_has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'newConstructionEntityName',
      no: 'newConstructionDisqualification'
    }
  },

  newConstructionEntityName: {
    step_key: 'new_construction_entity_name',
    route: '/m/newConstruction/entity-name',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'rateCalculator'
  },

  rentalExperience: {
    step_key: 'rental_experience_level',
    route: '/m/rental/experience',
    key: 'rental_experience_level',
    title: 'How many properties have you financed in the last 24 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-4 properties', value: 'one_four' },
      { label: '5-9 properties', value: 'five_nine' },
      { label: 'Over 10 properties', value: 'over_ten' }
    ],
    next: ({ value }) => (RENTAL_EXPERIENCE_DISQUALIFY.includes(value) ? 'rentalPersonalHome' : 'rentalPropertyState')
  },

  rentalPersonalHome: {
    step_key: 'rental_personal_home',
    route: '/m/rental/personal-home',
    key: 'rental_personal_home',
    title: 'Is this loan for your personal home?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'rentalDisqualification',
      no: 'rentalPropertyState'
    }
  },

  rentalDisqualification: {
    step_key: 'rental_disqualification',
    route: '/m/rental/disqualified',
    title: 'This loan program is for investment properties only.',
    description: 'Because this is for a personal home, you do not qualify for the Rental (DSCR) funnel.',
    type: 'disqualification',
    next: null
  },

  rentalPropertyState: {
    step_key: 'rental_property_state',
    route: '/m/rental/property-state',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'rentalLeadCapture'
  },

  rentalLeadCapture: {
    step_key: 'rental_lead_capture',
    route: '/m/rental/lead-capture',
    key: 'borrower',
    title: 'You’re one step away from seeing your financing path',
    type: 'leadCapture',
    next: ({ isAuthenticated }) => (isAuthenticated ? 'rentalEntityOwnership' : 'accountCreationFlow')
  },

  dealsLast24: {
    step_key: 'deals_last_24',
    route: '/m/getRate/dealsLast24',
    key: 'deals_last_24',
    title: 'How many completed deals in the last 24 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-2 properties', value: 'one_two' },
      { label: '3-4 properties', value: 'three_four' },
      { label: '5+ properties', value: 'five_plus' }
    ],
    next: 'propertyState'
  },

  propertyState: {
    step_key: 'property_state',
    route: '/m/getRate/propertyState',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'leadCapture'
  },

  leadCapture: {
    step_key: 'lead_capture',
    route: '/m/getRate/leadCapture',
    key: 'borrower',
    title: 'You\u2019re one step away from seeing your financing path',
    type: 'leadCapture',
    next: ({ isAuthenticated, answers }) => (
      isAuthenticated ? getEntityStepByExperience(answers) : 'accountCreationFlow'
    )
  },

  accountCreationFlow: {
    step_key: 'account_creation_flow',
    route: '/check-email',
    title: 'Check your email',
    description: "We've sent you a secure link to continue your application.",
    next: ({ answers, isAuthenticated }) => getPostAuthStep(answers, isAuthenticated)
  },

  rentalEntityOwnership: {
    step_key: 'rental_entity_question',
    route: '/m/rental/entity-ownership',
    key: 'rental_has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'rentalEntityName',
      no: 'rateCalculator'
    }
  },

  rentalEntityName: {
    step_key: 'rental_entity_name',
    route: '/m/rental/entity-name',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'rateCalculator'
  },

  standardEntityQuestion: {
    step_key: 'entity_question',
    route: '/standardBorrower/entity',
    key: 'has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'standardEntityName',
      no: 'propertyAddress'
    }
  },

  proEntityQuestion: {
    step_key: 'entity_question',
    route: '/proBorrower/entity',
    key: 'has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'proEntityName',
      no: 'propertyAddress'
    }
  },

  standardEntityName: {
    step_key: 'entity_name',
    route: '/standardBorrower/entityName',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'propertyAddress'
  },

  proEntityName: {
    step_key: 'entity_name',
    route: '/proBorrower/entityName',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'propertyAddress'
  },

  propertyAddress: {
    step_key: 'property_address',
    route: '/m/standardBorrower/leadPropertyAddress',
    key: 'property_address',
    title: 'One last question to get your personalized rate:',
    description: 'What is the address of the property you would like to finance?',
    type: 'address',
    addressPrefix: 'lead_property',
    next: 'rateCalculator'
  },

  rateCalculator: {
    step_key: 'rate_calculator',
    route: '/rate-calculator',
    title: 'Rate Calculator',
    next: 'eligibilityConfirm'
  },

  rentalConfirmation: {
    step_key: 'rental_confirmation',
    route: '/m/rental/confirmation',
    key: 'rental_confirmation',
    title: 'Great news. Your estimated terms are ready.',
    description: 'Your pricing has been calculated successfully. Continue to complete the final steps.',
    type: 'confirmation',
    next: 'rentalPropertyAddress'
  },

  rentalPropertyAddress: {
    step_key: 'rental_property_address',
    route: '/m/rental/property-address',
    key: 'rental_property_address',
    title: 'What is the address of the property you would like to finance?',
    type: 'address',
    addressPrefix: 'finance_property',
    next: 'rentalExpectedClosingDate'
  },

  rentalExpectedClosingDate: {
    step_key: 'rental_expected_closing_date',
    route: '/m/rental/expected-closing-date',
    key: 'preferred_signing_date',
    title: 'What is your preferred signing date?',
    type: 'signingDate',
    next: 'rentalBorrowerDetails'
  },

  rentalBorrowerDetails: {
    step_key: 'rental_borrower_details',
    route: '/m/rental/borrower-details',
    key: 'borrower_details',
    title: 'Entity and Individual Details',
    type: 'borrowerDetails',
    inlineActions: true,
    next: 'rentalReviewSubmit'
  },

  rentalReviewSubmit: {
    step_key: 'rental_review_submit',
    route: '/m/rental/review-submit',
    key: 'review_submit',
    title: 'Review Your Loan Details.',
    type: 'reviewSubmit',
    inlineActions: true,
    next: null
  },

  eligibilityConfirm: {
    step_key: 'eligibility_confirmations',
    route: '/m/standardBorrower/eligibility',
    key: 'eligibility_confirmations',
    title: 'Please confirm that the following statements are true:',
    type: 'eligibilityConfirm',
    next: 'financePropertyAddress'
  },

  financePropertyAddress: {
    step_key: 'finance_property_address',
    route: '/m/standardBorrower/financePropertyAddress',
    key: 'finance_property_address',
    title: 'What is the address of the property you would like to finance?',
    type: 'address',
    addressPrefix: 'finance_property',
    next: 'preferredSigningDate'
  },

  preferredSigningDate: {
    step_key: 'preferred_signing_date',
    route: '/m/standardBorrower/preferredSigningDate',
    key: 'preferred_signing_date',
    title: 'What is your preferred signing date?',
    type: 'signingDate',
    next: 'borrowerDetails'
  },

  borrowerDetails: {
    step_key: 'borrower_details',
    route: '/m/standardBorrower/borrowerDetails',
    key: 'borrower_details',
    title: 'Entity and Individual Details',
    type: 'borrowerDetails',
    inlineActions: true,
    next: 'reviewSubmit'
  },

  reviewSubmit: {
    step_key: 'review_submit',
    route: '/m/standardBorrower/reviewSubmit',
    key: 'review_submit',
    title: 'Review your loan details.',
    type: 'reviewSubmit',
    inlineActions: true,
    next: null
  },

  dashboardExit: {
    step_key: 'dashboard_exit',
    route: '/dashboard',
    title: 'Done',
    next: null
  }
};

function getEntityStepByExperience(answers) {
  const experience = answers?.deals_last_24;

  if (EXPERIENCE_PRO.includes(experience)) {
    return 'proEntityQuestion';
  }

  if (EXPERIENCE_STANDARD.includes(experience)) {
    return 'standardEntityQuestion';
  }

  return 'standardEntityQuestion';
}

function getPostAuthStep(answers, isAuthenticated) {
  if (!isAuthenticated) {
    return 'accountCreationFlow';
  }

  const loanProgram = answers?.loan_program;
  if (loanProgram === 'rental') {
    return 'rentalEntityOwnership';
  }
  if (loanProgram === 'new_construction') {
    return 'newConstructionEntityOwnership';
  }

  return getEntityStepByExperience(answers);
}

export const funnelInitialStepId = 'loanProgram';
