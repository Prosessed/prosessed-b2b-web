export interface CountryDialCode {
  name: string
  iso2: string
  dialCode: string
  flag: string
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: "India", iso2: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Australia", iso2: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "United States", iso2: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", iso2: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "New Zealand", iso2: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Singapore", iso2: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Canada", iso2: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Malaysia", iso2: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "South Africa", iso2: "ZA", dialCode: "+27", flag: "🇿🇦" },
]

export const DEFAULT_COUNTRY_ISO2 = "IN"
