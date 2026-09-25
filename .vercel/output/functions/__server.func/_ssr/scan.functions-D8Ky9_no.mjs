import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as SHELF } from "./shelf-ARY2GpjS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan.functions-D8Ky9_no.js
var hits = [];
function allowScan() {
	const now = Date.now();
	while (hits.length && now - hits[0] > 36e5) hits.shift();
	if (hits.length >= 8) return false;
	hits.push(now);
	return true;
}
function extractText(body) {
	if (!body || typeof body !== "object") return "";
	const record = body;
	if (typeof record.output_text === "string") return record.output_text;
	const chunks = [];
	if (Array.isArray(record.output)) for (const item of record.output) {
		if (!item || typeof item !== "object") continue;
		const block = item;
		if (typeof block.text === "string") chunks.push(block.text);
		if (!Array.isArray(block.content)) continue;
		for (const part of block.content) if (part && typeof part === "object" && typeof part.text === "string") chunks.push(part.text);
	}
	if (chunks.length) return chunks.join("\n");
	const content = record.choices?.[0]?.message?.content;
	return typeof content === "string" ? content : "";
}
function parseHits(text) {
	const start = text.indexOf("[");
	const end = text.lastIndexOf("]");
	if (start < 0 || end <= start) return [];
	const raw = JSON.parse(text.slice(start, end + 1));
	if (!Array.isArray(raw)) return [];
	return raw.slice(0, 12).flatMap((row) => {
		if (!row || typeof row !== "object") return [];
		const name = String(row.name ?? "").trim();
		if (!name || name.length > 80) return [];
		return [{
			name,
			qty: String(row.qty ?? "1").trim().slice(0, 40) || "1"
		}];
	});
}
var scanFoods_createServerFn_handler = createServerRpc({
	id: "f8fe3c4f8727056a09a9bad9289a72bed2607f138eff53664d118c82ec8aedc1",
	name: "scanFoods",
	filename: "src/lib/scan.functions.ts"
}, (opts) => scanFoods.__executeServer(opts));
var scanFoods = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object") throw new Error("Bad request");
	const image = input.image;
	if (typeof image !== "string" || !image.startsWith("data:image/")) throw new Error("Need a photo");
	if (image.length > 14e5) throw new Error("Photo is too large. Move closer and try again.");
	return { image };
}).handler(scanFoods_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Photo recognition is unavailable. Add the food by hand."
	};
	if (!allowScan()) return {
		ok: false,
		error: "Scan limit reached for this hour. Add items by hand, or try later."
	};
	const names = SHELF.map((food) => food.name).join(", ");
	const res = await fetch("https://api.x.ai/v1/responses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_output_tokens: 700,
			input: [{
				role: "user",
				content: [{
					type: "input_image",
					image_url: data.image,
					detail: "low"
				}, {
					type: "input_text",
					text: `List only foods you can actually see in this photo. Reply with a JSON array only, no markdown. Each object is {"name":"short English name","qty":"amount"}. Prefer these names when they fit: ${names}. Maximum 12 items. Do not invent expiry dates or foods that are not visible. If this is not food, return [].`
				}]
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `Could not read the photo (${res.status}). Try again, or add items by hand.`
	};
	try {
		return {
			ok: true,
			foods: parseHits(extractText(await res.json()))
		};
	} catch {
		return {
			ok: false,
			error: "The photo was read, but the list was unusable. Try again."
		};
	}
});
//#endregion
export { scanFoods_createServerFn_handler };
