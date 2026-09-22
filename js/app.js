const STORE_KEY = "fridgeai.inventory.v1";
const SETTINGS_KEY = "fridgeai.settings.v1";
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const todayISO = () => new Date().toISOString().slice(0, 10);
function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().slice(0, 10);
}
function daysUntil(iso) {
  return Math.round((new Date(iso + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000);
}
function loadInventory() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function saveInventory(items) { localStorage.setItem(STORE_KEY, JSON.stringify(items)); }
function loadSettings() {
  try {
    return Object.assign({ diet: "any", household: 2, provider: "demo", apiKey: "" }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch { return { diet: "any", household: 2, provider: "demo", apiKey: "" }; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
let inventory = loadInventory();
let settings = loadSettings();
let page = "fridge";
function findShelf(name) {
  const q = name.toLowerCase().trim();
  return window.SHELF_LIFE.find((s) => s.name.toLowerCase() === q || s.aliases.some((a) => a.toLowerCase() === q))
    || window.SHELF_LIFE.find((s) => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q) || s.aliases.some((a) => q.includes(a.toLowerCase())));
}
function statusOf(item) {
  const d = daysUntil(item.expires);
  if (d < 0) return { key: "expired", label: "Expired", d };
  if (d <= 1) return { key: "danger", label: d === 0 ? "Use today" : "1 day left", d };
  if (d <= 3) return { key: "warn", label: d + " days left", d };
  return { key: "ok", label: d + " days left", d };
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c]));
}
function render() {
  $$(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $("#view-fridge").style.display = page === "fridge" ? "block" : "none";
  $("#view-recipes").style.display = page === "recipes" ? "block" : "none";
  $("#view-settings").style.display = page === "settings" ? "block" : "none";
  $("#stat-total").textContent = inventory.length;
  $("#stat-soon").textContent = inventory.filter((i) => ["danger", "warn"].includes(statusOf(i).key)).length;
  $("#stat-expired").textContent = inventory.filter((i) => statusOf(i).key === "expired").length;
  $("#stat-fresh").textContent = inventory.filter((i) => statusOf(i).key === "ok").length;
  if (page === "fridge") renderFridge();
  if (page === "recipes") renderRecipes();
  if (page === "settings") {
    $("#set-diet").value = settings.diet;
    $("#set-household").value = settings.household;
    $("#set-provider").value = settings.provider;
    $("#set-apikey").value = settings.apiKey;
  }
}
function renderFridge() {
  const q = ($("#search").value || "").toLowerCase();
  const filter = $("#filter-status").value;
  const items = inventory.filter((i) => !q || i.name.toLowerCase().includes(q))
    .filter((i) => filter === "all" || statusOf(i).key === filter || (filter === "soon" && ["warn", "danger"].includes(statusOf(i).key)))
    .sort((a, b) => daysUntil(a.expires) - daysUntil(b.expires));
  const urgent = inventory.filter((i) => statusOf(i).d <= 3).sort((a, b) => statusOf(a).d - statusOf(b).d);
  $("#priority-box").innerHTML = urgent.length
    ? "<h2>Use first</h2><div class=\"chips\">" + urgent.map((i) => "<span class=\"chip " + (statusOf(i).d <= 1 ? "hot" : "") + "\">" + (i.emoji || "") + " " + i.name + " · " + statusOf(i).label + "</span>").join("") + "</div>"
    : "<h2>Fridge is calm</h2><p class=\"hint\">Nothing expiring in 3 days.</p>";
  $("#item-grid").innerHTML = items.length ? items.map((i) => {
    const s = statusOf(i);
    return "<article class=\"card\"><div class=\"head\"><div><div class=\"item-name\">" + (i.emoji || "") + " " + escapeHtml(i.name) + "</div><div class=\"item-meta\">" + escapeHtml(i.qty || "1") + " · " + i.location + " · expires " + i.expires + "</div></div><span class=\"badge " + s.key + "\">" + s.label + "</span></div><div class=\"card-actions\"><button class=\"btn btn-ghost\" data-eat=\"" + i.id + "\">Cooked / used</button><button class=\"btn btn-danger\" data-del=\"" + i.id + "\">Remove</button></div></article>";
  }).join("") : "<div class=\"empty\">No items yet. Scan a photo or add food.</div>";
}
function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function hasIngredient(need) {
  const n = normalize(need);
  return inventory.some((item) => {
    const name = normalize(item.name);
    const shelf = findShelf(item.name);
    return name === n || name.includes(n) || n.includes(name) || (shelf && (normalize(shelf.name) === n || shelf.aliases.some((a) => normalize(a) === n)));
  });
}
function renderRecipes() {
  const cuisine = $("#recipe-cuisine").value;
  const onlyHave = $("#recipe-have").checked;
  let ranked = window.RECIPES.map((recipe) => {
    const haveNeed = recipe.need.filter(hasIngredient);
    const missing = recipe.need.filter((x) => !hasIngredient(x));
    const haveOpt = (recipe.optional || []).filter(hasIngredient);
    const urgentBoost = inventory.filter((i) => statusOf(i).d <= 3 && statusOf(i).d >= -1).filter((i) => recipe.need.concat(recipe.optional || []).some((n) => normalize(i.name).includes(normalize(n)) || normalize(n).includes(normalize(i.name)))).length;
    if (haveNeed.length === 0 && haveOpt < 2) return null;
    return { recipe, haveNeed, missing, urgentBoost, score: haveNeed.length * 5 + haveOpt * 1.2 + urgentBoost * 3 - missing.length * 4 };
  }).filter(Boolean);
  if (cuisine !== "any") ranked = ranked.filter((r) => r.recipe.cuisine === cuisine);
  if (onlyHave) ranked = ranked.filter((r) => r.missing.length === 0);
  if (settings.diet === "veg") ranked = ranked.filter((r) => !/chicken|beef|pork|salmon|fish|shrimp|bacon|ham|sausage|tuna|luncheon|spam/i.test(r.recipe.need.join(" ")));
  ranked.sort((a, b) => b.score - a.score);
  const urgentNames = inventory.filter((i) => statusOf(i).d <= 3).map((i) => i.name);
  $("#recipe-priority").innerHTML = urgentNames.length
    ? "<h2>Suggested around expiring food</h2><div class=\"chips\">" + urgentNames.map((n) => "<span class=\"chip hot\">" + n + "</span>").join("") + "</div>"
    : "<h2>Cook from what you have</h2>";
  $("#recipe-grid").innerHTML = ranked.length ? ranked.map(({ recipe, haveNeed, missing, urgentBoost }) => "<article class=\"card recipe\"><div class=\"cuisine\">" + recipe.emoji + " " + recipe.cuisine + " · " + recipe.time + " min</div><h3>" + recipe.name + "</h3><div class=\"match\">Have: " + (haveNeed.join(", ") || "—") + (urgentBoost ? " · uses food that should go first" : "") + (missing.length ? "<div class=\"missing\">Missing: " + missing.join(", ") + "</div>" : "<div>You can cook this now.</div>") + "</div><ol class=\"steps\">" + recipe.steps.map((s) => "<li>" + s + "</li>").join("") + "</ol></article>").join("") : "<div class=\"empty\">No matches yet.</div>";
}
function upsertItem(data) {
  const shelf = findShelf(data.name) || { emoji: "🍽️", location: data.location || "fridge", days: 5 };
  const bought = data.bought || todayISO();
  inventory.push({ id: data.id || uid(), name: data.name.trim(), qty: data.qty || "1", location: data.location || shelf.location, bought, expires: data.expires || addDays(bought, shelf.days), notes: data.notes || "", emoji: shelf.emoji, addedAt: Date.now() });
  saveInventory(inventory);
}
function openModal(id) { $(id).classList.add("open"); }
function closeModals() { $$(".modal-back").forEach((m) => m.classList.remove("open")); }
function fillAddForm() {
  $("#add-name").value = ""; $("#add-qty").value = "1"; $("#add-location").value = "fridge";
  $("#add-bought").value = todayISO(); $("#add-expires").value = addDays(todayISO(), 5); $("#add-notes").value = "";
}
async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = ""; for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
async function detectDemo(file) {
  const pool = ["Eggs", "Milk", "Tomato", "Pak choi", "Chicken thighs", "Tofu", "Spring onion", "Cooked rice"];
  if (file && file.name) {
    const n = file.name.toLowerCase();
    window.SHELF_LIFE.forEach((s) => { if (n.includes(s.name.toLowerCase().split(" ")[0])) pool.unshift(s.name); });
  }
  return [...new Set(pool)].slice(0, 6).map((name) => { const shelf = findShelf(name); return { name, qty: "1", days: shelf ? shelf.days : 5, emoji: shelf && shelf.emoji }; });
}
async function detectOpenAI(file) {
  if (!file) throw new Error("Choose a photo first.");
  const b64 = await fileToBase64(file);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + settings.apiKey },
    body: JSON.stringify({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: "Identify foods. JSON {\"items\":[{\"name\":\"Tomato\",\"qty\":\"4\"}]}" }, { type: "image_url", image_url: { url: "data:" + file.type + ";base64," + b64 } }] }] })
  });
  if (!res.ok) throw new Error(await res.text());
  const parsed = JSON.parse((await res.json()).choices[0].message.content);
  return (parsed.items || []).map((it) => { const shelf = findShelf(it.name); return { name: it.name, qty: String(it.qty || "1"), days: shelf ? shelf.days : 5, emoji: shelf && shelf.emoji }; });
}
async function detectGemini(file) {
  if (!file) throw new Error("Choose a photo first.");
  const b64 = await fileToBase64(file);
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(settings.apiKey), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Identify foods. JSON {\"items\":[{\"name\":\"Tomato\",\"qty\":\"4\"}]}" }, { inline_data: { mime_type: file.type || "image/jpeg", data: b64 } }] }] })
  });
  if (!res.ok) throw new Error(await res.text());
  const text = (await res.json()).candidates[0].content.parts.map((p) => p.text).join("\n");
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  return (parsed.items || []).map((it) => { const shelf = findShelf(it.name); return { name: it.name, qty: String(it.qty || "1"), days: shelf ? shelf.days : 5, emoji: shelf && shelf.emoji }; });
}
async function runDetect() {
  const status = $("#detect-status");
  status.textContent = "Detecting food…";
  try {
    let foods;
    if (settings.provider === "openai" && settings.apiKey) foods = await detectOpenAI(window._scanFile);
    else if (settings.provider === "gemini" && settings.apiKey) foods = await detectGemini(window._scanFile);
    else foods = await detectDemo(window._scanFile);
    $("#detect-results").innerHTML = foods.map((f) => "<label class=\"detect-row\"><span>" + (f.emoji || "") + " <strong>" + escapeHtml(f.name) + "</strong> · " + escapeHtml(f.qty) + "</span><input type=\"checkbox\" checked data-name=\"" + escapeHtml(f.name) + "\" data-qty=\"" + escapeHtml(f.qty) + "\"></label>").join("") || "<p class=\"hint\">Nothing detected.</p>";
    status.textContent = foods.length ? "Found " + foods.length + " item(s). Uncheck anything wrong, then add." : "No items.";
  } catch (err) { status.textContent = "Detection failed: " + err.message; }
}
function seedDemo() {
  if (inventory.length && !confirm("Add a Hong Kong sample fridge on top of current items?")) return;
  [["Eggs", "8", 28], ["Tomato", "4", 1], ["Pak choi", "1 bunch", 1], ["Tofu", "1 pack", 5], ["Chicken thighs", "4 pcs", 1], ["Cooked rice", "1 box", 1], ["Spring onion", "1 bunch", 7], ["Ginger", "1 knob", 21], ["Milk", "1L", 7]].forEach((row) => {
    upsertItem({ name: row[0], qty: row[1], expires: addDays(todayISO(), row[2]) });
  });
  render();
}
function bindEvents() {
  $$(".nav button").forEach((b) => b.addEventListener("click", () => { page = b.dataset.page; render(); }));
  $("#search").addEventListener("input", renderFridge);
  $("#filter-status").addEventListener("change", renderFridge);
  $("#recipe-cuisine").addEventListener("change", renderRecipes);
  $("#recipe-have").addEventListener("change", renderRecipes);
  $("#btn-add").addEventListener("click", () => { fillAddForm(); openModal("#modal-add"); });
  $("#btn-scan").addEventListener("click", () => openModal("#modal-scan"));
  $("#btn-seed").addEventListener("click", seedDemo);
  $("#add-name").addEventListener("input", () => {
    const shelf = findShelf($("#add-name").value);
    if (!shelf) return;
    $("#add-location").value = shelf.location;
    $("#add-expires").value = addDays($("#add-bought").value || todayISO(), shelf.days);
  });
  $("#form-add").addEventListener("submit", (e) => {
    e.preventDefault();
    upsertItem({ name: $("#add-name").value, qty: $("#add-qty").value, location: $("#add-location").value, bought: $("#add-bought").value, expires: $("#add-expires").value, notes: $("#add-notes").value });
    closeModals(); page = "fridge"; render();
  });
  $("#item-grid").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    const eat = e.target.closest("[data-eat]");
    if (del) { inventory = inventory.filter((i) => i.id !== del.dataset.del); saveInventory(inventory); render(); }
    if (eat) { inventory = inventory.filter((i) => i.id !== eat.dataset.eat); saveInventory(inventory); page = "recipes"; render(); }
  });
  $$("[data-close]").forEach((b) => b.addEventListener("click", closeModals));
  $$(".modal-back").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
  $("#scan-file").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    $("#scan-preview").src = URL.createObjectURL(file);
    $("#scan-preview").style.display = "block";
    window._scanFile = file;
  });
  $("#btn-detect").addEventListener("click", runDetect);
  $("#btn-add-detected").addEventListener("click", () => {
    $$("#detect-results input[type=checkbox]:checked").forEach((box) => upsertItem({ name: box.dataset.name, qty: box.dataset.qty || "1" }));
    closeModals(); page = "fridge"; render();
  });
  $("#save-settings").addEventListener("click", () => {
    settings = { diet: $("#set-diet").value, household: Number($("#set-household").value || 2), provider: $("#set-provider").value, apiKey: $("#set-apikey").value.trim() };
    saveSettings(settings); alert("Settings saved on this device.");
  });
  $("#btn-export").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ inventory, settings }, null, 2)], { type: "application/json" }));
    a.download = "fridge-ai-backup.json"; a.click();
  });
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const data = JSON.parse(await file.text());
    if (Array.isArray(data.inventory)) { inventory = data.inventory; saveInventory(inventory); }
    if (data.settings) { settings = Object.assign(settings, data.settings); saveSettings(settings); }
    render();
  });
  $("#btn-clear").addEventListener("click", () => { if (confirm("Clear all fridge items?")) { inventory = []; saveInventory(inventory); render(); } });
}
$("#food-list").innerHTML = window.SHELF_LIFE.map((s) => "<option value=\"" + s.name + "\">").join("");
bindEvents();
render();
