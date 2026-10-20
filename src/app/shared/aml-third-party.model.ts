export interface AmlThirdPartyDetails {
  title: string;
  firstName: string;
  surname: string;
  middleName: string;
  alias: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
  mothersName: string;
  occupation: string;
  sourceOfWealth: string;
  nationalities: string[];
  residence: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  idIssuingCountry: string;
  employerName: string;
  employerAddress: string;
  employerPhone: string;
  employmentStatus: string;
  jobTitle: string;
}

export function createEmptyAmlThirdParty(): AmlThirdPartyDetails {
  return {
    title: '',
    firstName: '',
    surname: '',
    middleName: '',
    alias: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    mothersName: '',
    occupation: '',
    sourceOfWealth: '',
    nationalities: ['', ''],
    residence: '',
    phone: '',
    email: '',
    idType: '',
    idNumber: '',
    idIssueDate: '',
    idExpiryDate: '',
    idIssuingCountry: '',
    employerName: '',
    employerAddress: '',
    employerPhone: '',
    employmentStatus: '',
    jobTitle: '',
  };
}

export function cloneAmlThirdParty(details: AmlThirdPartyDetails): AmlThirdPartyDetails {
  return {
    ...details,
    nationalities: [details.nationalities[0] ?? '', details.nationalities[1] ?? ''],
  };
}
