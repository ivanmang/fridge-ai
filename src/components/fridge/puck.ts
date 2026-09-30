import { translate, type Locale } from "@/lib/i18n"

export function puckError(locale: Locale, err: unknown) {
  const code = err instanceof Error ? err.message : ""
  if (code === "puckBad" || code === "puckOffline" || code === "puckEmpty" || code === "puckBadPhoto" || code === "puckBlank") {
    return translate(locale, code)
  }
  return translate(locale, "puckOffline")
}

export async function fetchDoorPhoto(host: string) {
  const url = doorPhotoUrl(host)
  if (!url) throw new Error("puckBad")
  let res: Response
  try {
    res = await fetch(url, {
      mode: "cors",
      cache: "no-store",
      targetAddressSpace: "local",
    } as RequestInit)
  } catch {
    throw new Error("puckOffline")
  }
  if (res.status === 404) throw new Error("puckEmpty")
  if (!res.ok) throw new Error("puckBadPhoto")
  const blob = await res.blob()
  if (!blob.size) throw new Error("puckBlank")
  return new File([blob], "door.jpg", { type: blob.type || "image/jpeg" })
}

export function doorPhotoUrl(host: string) {
  const trimmed = host.trim()
  if (!trimmed) return ""
  let url: URL
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`)
  } catch {
    return ""
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return ""
  url.pathname = "/latest.jpg"
  url.search = ""
  url.hash = ""
  return url.toString()
}

export async function shrinkImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let quality = 0.72
  let url = canvas.toDataURL("image/jpeg", quality)
  while (url.length > 1_200_000 && quality > 0.45) {
    quality -= 0.08
    url = canvas.toDataURL("image/jpeg", quality)
  }
  return url.length > 1_400_000 ? "" : url
}

