import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const root = path.resolve(import.meta.dirname, "..")

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(root, "src", specifier.slice(2))
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")]
    const hit = candidates.find((candidate) => existsSync(candidate))
    if (hit) return nextResolve(pathToFileURL(hit).href, context)
  }
  return nextResolve(specifier, context)
}
