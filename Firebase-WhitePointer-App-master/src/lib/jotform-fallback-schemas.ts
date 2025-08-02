/**
 * Fallback JotForm schemas for when the API is not accessible
 * These schemas mirror the structure of actual JotForm data
 */

export const fallbackSchemas = {
  'claims': {
    form: {
      id: '232543267390861',
      username: 'whitepointer',
      title: 'Motor Vehicle Accident Claims Form',
      height: '539',
      status: 'ENABLED',
      created_at: '2023-11-01 10:00:00',
      updated_at: '2023-11-01 10:00:00',
      last_submission: '',
      new: '0',
      count: '0',
      type: 'LEGACY',
      favorite: '0',
      archived: '0',
      url: 'https://form.jotform.com/232543267390861'
    },
    questions: {
      '1': {
        qid: '1',
        type: 'control_head',
        text: 'Motor Vehicle Accident Claims Form',
        name: 'header',
        order: '1'
      },
      '3': {
        qid: '3',
        type: 'control_textbox',
        text: 'Case Number',
        name: 'caseNumber',
        required: 'Yes',
        order: '3'
      },
      '4': {
        qid: '4',
        type: 'control_textbox',
        text: 'Client Full Name',
        name: 'clientName',
        required: 'Yes',
        order: '4'
      },
      '5': {
        qid: '5',
        type: 'control_email',
        text: 'Client Email Address',
        name: 'clientEmail',
        required: 'Yes',
        order: '5'
      },
      '6': {
        qid: '6',
        type: 'control_phone',
        text: 'Client Phone Number',
        name: 'clientPhone',
        required: 'Yes',
        order: '6'
      },
      '7': {
        qid: '7',
        type: 'control_textarea',
        text: 'Client Address',
        name: 'clientAddress',
        required: 'Yes',
        order: '7'
      },
      '8': {
        qid: '8',
        type: 'control_datetime',
        text: 'Accident Date',
        name: 'accidentDate',
        required: 'Yes',
        order: '8'
      },
      '9': {
        qid: '9',
        type: 'control_textbox',
        text: 'Accident Time',
        name: 'accidentTime',
        order: '9'
      },
      '10': {
        qid: '10',
        type: 'control_textarea',
        text: 'Accident Description',
        name: 'accidentDescription',
        required: 'Yes',
        order: '10'
      },
      '11': {
        qid: '11',
        type: 'control_textbox',
        text: 'At-Fault Party Name',
        name: 'atFaultPartyName',
        required: 'Yes',
        order: '11'
      },
      '12': {
        qid: '12',
        type: 'control_phone',
        text: 'At-Fault Party Phone',
        name: 'atFaultPartyPhone',
        order: '12'
      },
      '13': {
        qid: '13',
        type: 'control_email',
        text: 'At-Fault Party Email',
        name: 'atFaultPartyEmail',
        order: '13'
      },
      '14': {
        qid: '14',
        type: 'control_textarea',
        text: 'At-Fault Party Address',
        name: 'atFaultPartyAddress',
        order: '14'
      },
      '15': {
        qid: '15',
        type: 'control_textbox',
        text: 'Client Insurance Company',
        name: 'clientInsuranceCompany',
        order: '15'
      },
      '16': {
        qid: '16',
        type: 'control_textbox',
        text: 'Client Claim Number',
        name: 'clientClaimNumber',
        order: '16'
      },
      '17': {
        qid: '17',
        type: 'control_textbox',
        text: 'At-Fault Party Insurance Company',
        name: 'atFaultPartyInsuranceCompany',
        order: '17'
      },
      '18': {
        qid: '18',
        type: 'control_textbox',
        text: 'At-Fault Party Claim Number',
        name: 'atFaultPartyClaimNumber',
        order: '18'
      },
      '19': {
        qid: '19',
        type: 'control_radio',
        text: 'Injury Status',
        name: 'injuryStatus',
        options: 'No Injuries|Minor Injuries|Major Injuries|Unknown',
        order: '19'
      },
      '20': {
        qid: '20',
        type: 'control_textarea',
        text: 'Additional Comments',
        name: 'additionalComments',
        order: '20'
      }
    }
  },
  'authority-to-act': {
    form: {
      id: '233183619631457',
      username: 'whitepointer',
      title: 'Authority to Act Form',
      height: '539',
      status: 'ENABLED',
      created_at: '2023-11-01 10:00:00',
      updated_at: '2023-11-01 10:00:00',
      last_submission: '',
      new: '0',
      count: '0',
      type: 'LEGACY',
      favorite: '0',
      archived: '0',
      url: 'https://form.jotform.com/233183619631457'
    },
    questions: {
      '1': {
        qid: '1',
        type: 'control_head',
        text: 'Authority to Act Form',
        name: 'header',
        order: '1'
      },
      '3': {
        qid: '3',
        type: 'control_textbox',
        text: 'Case Number',
        name: 'caseNumber',
        required: 'Yes',
        order: '3'
      },
      '4': {
        qid: '4',
        type: 'control_textbox',
        text: 'Client Full Name',
        name: 'clientName',
        required: 'Yes',
        order: '4'
      },
      '5': {
        qid: '5',
        type: 'control_email',
        text: 'Client Email',
        name: 'clientEmail',
        required: 'Yes',
        order: '5'
      },
      '6': {
        qid: '6',
        type: 'control_phone',
        text: 'Client Phone',
        name: 'clientPhone',
        required: 'Yes',
        order: '6'
      },
      '7': {
        qid: '7',
        type: 'control_textarea',
        text: 'Client Address',
        name: 'clientAddress',
        required: 'Yes',
        order: '7'
      }
    }
  },
  'not-at-fault-rental': {
    form: {
      id: '233241680987464',
      username: 'whitepointer',
      title: 'Not At Fault Rental Agreement',
      height: '539',
      status: 'ENABLED',
      created_at: '2023-11-01 10:00:00',
      updated_at: '2023-11-01 10:00:00',
      last_submission: '',
      new: '0',
      count: '0',
      type: 'LEGACY',
      favorite: '0',
      archived: '0',
      url: 'https://form.jotform.com/233241680987464'
    },
    questions: {
      '1': {
        qid: '1',
        type: 'control_head',
        text: 'Not At Fault Rental Agreement',
        name: 'header',
        order: '1'
      },
      '3': {
        qid: '3',
        type: 'control_textbox',
        text: 'Case Number',
        name: 'caseNumber',
        required: 'Yes',
        order: '3'
      },
      '4': {
        qid: '4',
        type: 'control_textbox',
        text: 'Client Name',
        name: 'clientName',
        required: 'Yes',
        order: '4'
      }
    }
  },
  'certis-rental': {
    form: {
      id: '233238940095055',
      username: 'whitepointer',
      title: 'Certis Rental Agreement',
      height: '539',
      status: 'ENABLED',
      created_at: '2023-11-01 10:00:00',
      updated_at: '2023-11-01 10:00:00',
      last_submission: '',
      new: '0',
      count: '0',
      type: 'LEGACY',
      favorite: '0',
      archived: '0',
      url: 'https://form.jotform.com/233238940095055'
    },
    questions: {
      '1': {
        qid: '1',
        type: 'control_head',
        text: 'Certis Rental Agreement',
        name: 'header',
        order: '1'
      },
      '3': {
        qid: '3',
        type: 'control_textbox',
        text: 'Case Number',
        name: 'caseNumber',
        required: 'Yes',
        order: '3'
      }
    }
  },
  'direction-to-pay': {
    form: {
      id: '233061493503046',
      username: 'whitepointer',
      title: 'Direction to Pay Form',
      height: '539',
      status: 'ENABLED',
      created_at: '2023-11-01 10:00:00',
      updated_at: '2023-11-01 10:00:00',
      last_submission: '',
      new: '0',
      count: '0',
      type: 'LEGACY',
      favorite: '0',
      archived: '0',
      url: 'https://form.jotform.com/233061493503046'
    },
    questions: {
      '1': {
        qid: '1',
        type: 'control_head',
        text: 'Direction to Pay Form',
        name: 'header',
        order: '1'
      },
      '3': {
        qid: '3',
        type: 'control_textbox',
        text: 'Case Number',
        name: 'caseNumber',
        required: 'Yes',
        order: '3'
      }
    }
  }
};