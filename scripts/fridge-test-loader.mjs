import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("./fridge-alias-hooks.mjs", import.meta.url)
