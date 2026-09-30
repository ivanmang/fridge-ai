import type { UiKey } from "@/lib/i18n"

/** Stable Identify error codes returned by the scan server function. */
export type ScanErrorCode =
  | "unavailable"
  | "limit"
  | "busy"
  | "read"
  | "parse"
  | "timeout"
  | "tooLarge"
  | "needPhoto"

const SCAN_ERROR_KEYS: Record<ScanErrorCode, UiKey> = {
  unavailable: "scanUnavailable",
  limit: "scanLimit",
  busy: "scanBusy",
  read: "scanReadFailed",
  parse: "scanParseFailed",
  timeout: "scanTimeout",
  tooLarge: "tooLarge",
  needPhoto: "scanNeedPhoto",
}

export function isScanErrorCode(value: string): value is ScanErrorCode {
  return value in SCAN_ERROR_KEYS
}

export function scanErrorKey(code: string): UiKey {
  if (isScanErrorCode(code)) return SCAN_ERROR_KEYS[code]
  return "scanFailed"
}
