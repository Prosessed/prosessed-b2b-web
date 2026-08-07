import { isValidPhoneNumber } from "libphonenumber-js"

/** Combines a dial code (e.g. "+91") with a local number into E.164 form. */
export function toE164(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "")
  return `${dialCode}${digits}`
}

export function isValidMobileNumber(e164: string): boolean {
  try {
    return isValidPhoneNumber(e164)
  } catch {
    return false
  }
}
