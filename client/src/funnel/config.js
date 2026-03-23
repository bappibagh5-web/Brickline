export const funnelConfig = {
  loanProgram: {
    route: '/m/getRate/loanProgram',
    key: 'loan_program',
    title: 'What type of loan are you looking for?',
    options: [
      { label: 'Fix & Flip / Bridge', value: 'fix_flip' },
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Rental', value: 'rental' },
      { label: "I'm not sure yet", value: 'unsure' }
    ],
    next: {
      fix_flip: 'exitsLast24',
      new_construction: 'infillExitsLast60',
      rental: 'rentalBorrowerDeals',
      unsure: 'exitsLast24'
    }
  },

  exitsLast24: {
    route: '/m/getRate/exitsLast24',
    key: 'experience',
    title: 'How many completed deals in the last 24 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-2 properties', value: 'one_two' },
      { label: '3-4 properties', value: 'three_four' },
      { label: '5+ properties', value: 'five_plus' }
    ],
    next: {
      none: 'standardBorrowerPropertyState',
      one_two: 'standardBorrowerPropertyState',
      three_four: 'proBorrowerPropertyState',
      five_plus: 'proBorrowerPropertyState'
    }
  },

  infillExitsLast60: {
    route: '/m/getRate/infillExitsLast60',
    key: 'experience',
    title: 'How many infill exits in the last 60 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-2 properties', value: 'one_two' },
      { label: '3-4 properties', value: 'three_four' },
      { label: '5+ properties', value: 'five_plus' }
    ],
    next: {
      none: 'standardBorrowerPropertyState',
      one_two: 'standardBorrowerPropertyState',
      three_four: 'proBorrowerPropertyState',
      five_plus: 'proBorrowerPropertyState'
    }
  },

  rentalBorrowerDeals: {
    route: '/m/rentalBorrower/dealsLast24',
    key: 'experience',
    title: 'How many rental deals in the last 24 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-2 properties', value: 'one_two' },
      { label: '3-4 properties', value: 'three_four' },
      { label: '5+ properties', value: 'five_plus' }
    ],
    next: {
      none: 'standardBorrowerPropertyState',
      one_two: 'standardBorrowerPropertyState',
      three_four: 'proBorrowerPropertyState',
      five_plus: 'proBorrowerPropertyState'
    }
  },

  standardBorrowerPropertyState: {
    route: '/m/standardBorrower/propertyState',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'entityQuestion'
  },

  proBorrowerPropertyState: {
    route: '/m/proBorrower/propertyState',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'entityQuestion'
  },

  entityQuestion: {
    route: '/m/standardBorrower/entity',
    key: 'has_entity',
    title: 'Do you have an entity for this loan?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: 'emailStep'
  },

  emailStep: {
    route: '/m/standardBorrower/yourEmail',
    key: 'email',
    title: 'What is your email address?',
    type: 'input',
    inputType: 'email',
    next: 'phoneStep'
  },

  phoneStep: {
    route: '/m/standardBorrower/yourPhone',
    key: 'phone',
    title: 'What is your phone number?',
    type: 'input',
    inputType: 'tel',
    next: 'nameStep'
  },

  nameStep: {
    route: '/m/standardBorrower/yourName',
    key: 'name',
    title: 'What is your full name?',
    type: 'input',
    inputType: 'text',
    next: 'checkEmail'
  },

  checkEmail: {
    route: '/m/standardBorrower/checkYourEmail',
    key: null,
    title: 'Check your email',
    description: 'We sent next steps to your inbox. You can return anytime.',
    next: null
  }
};

export const funnelInitialStepId = 'loanProgram';
