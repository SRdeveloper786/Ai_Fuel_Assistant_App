export interface Helpline {
  country: string;
  code: string; // ISO 3166-1 alpha-2
  police: string;
  ambulance: string;
  fire: string;
  roadside?: string;
}

export const HELPLINES: Helpline[] = [
  { country: "Pakistan", code: "PK", police: "15", ambulance: "1122", fire: "16", roadside: "130 (Motorway Police)" },
  { country: "India", code: "IN", police: "100 / 112", ambulance: "102", fire: "101", roadside: "1033 (NHAI Highway Helpline)" },
  { country: "United States", code: "US", police: "911", ambulance: "911", fire: "911", roadside: "511 (State Highway Patrol / Traveler Info)" },
  { country: "United Kingdom", code: "GB", police: "999 / 112", ambulance: "999", fire: "999", roadside: "0300 123 5000 (National Highways Helpline)" },
  { country: "Canada", code: "CA", police: "911", ambulance: "911", fire: "911", roadside: "511 (Provincial Road / Highway Conditions)" },
  { country: "United Arab Emirates", code: "AE", police: "999", ambulance: "998", fire: "997", roadside: "999 (Traffic Police Hotline)" },
  { country: "Saudi Arabia", code: "SA", police: "911 / 999", ambulance: "997", fire: "998", roadside: "911 (Security Operations Center / Highway)" },
  { country: "Australia", code: "AU", police: "000", ambulance: "000", fire: "000", roadside: "13 11 11 (NRMA / Roadside Assistance)" },
  { country: "Germany", code: "DE", police: "110", ambulance: "112", fire: "112", roadside: "22 22 22 (ADAC Roadside Assistance)" },
  { country: "Turkey", code: "TR", police: "112", ambulance: "112", fire: "112", roadside: "159 (KGM Highway Helpline)" },
  { country: "France", code: "FR", police: "17 / 112", ambulance: "15 / 112", fire: "18 / 112", roadside: "112 (Motorway Emergency SOS)" },
  { country: "Italy", code: "IT", police: "112 / 113", ambulance: "118 / 112", fire: "115 / 112", roadside: "803 116 (ACI Roadside Services)" },
  { country: "Spain", code: "ES", police: "112", ambulance: "112", fire: "112", roadside: "011 (DGT Highway / Traffic Info)" },
  { country: "Oman", code: "OM", police: "9999", ambulance: "9999", fire: "9999", roadside: "9999 (ROP Royal Oman Police)" },
  { country: "Qatar", code: "QA", police: "999", ambulance: "999", fire: "999", roadside: "999 (Moi Traffic Control)" },
  { country: "Kuwait", code: "KW", police: "112", ambulance: "112", fire: "112", roadside: "112 (General Emergency Hotline)" },
  { country: "Bahrain", code: "BH", police: "999", ambulance: "999", fire: "999", roadside: "999 (General Security Operations)" },
  { country: "Bangladesh", code: "BD", police: "999", ambulance: "999", fire: "999", roadside: "999 (National Emergency Service)" },
  { country: "Nepal", code: "NP", police: "100", ambulance: "102", fire: "101", roadside: "103 (Traffic Police Emergency)" },
  { country: "Sri Lanka", code: "LK", police: "119", ambulance: "1990 (Suwa Seriya)", fire: "110", roadside: "1969 (Expressways Helpline)" },
  { country: "Malaysia", code: "MY", police: "999", ambulance: "999", fire: "999", roadside: "1800 88 0000 (PLUS Highway Hotline)" },
  { country: "Singapore", code: "SG", police: "999", ambulance: "995 (SCDF)", fire: "995", roadside: "1800 225 5582 (LTA Expressway Services)" },
  { country: "New Zealand", code: "NZ", police: "111", ambulance: "111", fire: "111", roadside: "0800 4 HIGHWAYS (0800 44 44 49)" },
  { country: "South Africa", code: "ZA", police: "10111", ambulance: "10177", fire: "10177", roadside: "081 911 (Netcare 911 Emergency / Roadside)" },
  { country: "Japan", code: "JP", police: "110", ambulance: "119", fire: "119", roadside: "#9910 (Expressway / Road Emergency Line)" },
  { country: "China", code: "CN", police: "110", ambulance: "120", fire: "119", roadside: "12122 (Expressway Rescue Hotline)" },
  { country: "Brazil", code: "BR", police: "190", ambulance: "192", fire: "193", roadside: "191 (Federal Highway Police - PRF)" },
  { country: "Mexico", code: "MX", police: "911", ambulance: "911", fire: "911", roadside: "078 (Angeles Verdes - Green Angels Highway Service)" }
];
