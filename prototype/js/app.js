const STORE_KEY = "fridgeai.inventory.v1";
const SETTINGS_KEY = "fridgeai.settings.v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function daysUntil(iso) {
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(iso + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

function loadInventory() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function saveInventory(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}
function loadSettings() {
  try {
    return Object.assign({
      diet: "any",
      cuisine: "any",
      household: 2,
      provider: "demo",
      apiKey: "",
    }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch { return { diet: "any", cuisine: "any", household: 2, provider: "demo", apiKey: "" }; }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

let inventory = loadInventory();
let settings = loadSettings();
let page = "fridge";
let detectCandidates = [];

function findShelf(name) {
  const q = name.toLowerCase().trim();
  return window.SHELF_LIFE.find((s) =>
    s.name.toLowerCase() === q || s.aliases.some((a) => a.toLowerCase() === q)
  ) || window.SHELF_LIFE.find((s) =>
    q.includes(s.name.toLowerCase()) || s.aliases.some((a) => q.includes(a.toLowerCase()))
    || s.name.toLowerCase().includes(q)
  );
}

function statusOf(item) {
  const d = daysUntil(item.expires);
  if (d < 0) return { key: "expired", label: "Expired", d };
  if (d <= 1) return { key: "danger", label: d === 0 ? "Use today" : "1 day left", d };
  if (d <= 3) return { key: "warn", label: `${d} days left`, d };
  return { key: "ok", label: `${d} days left`, d };
}

function render() {
  $$(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $("#view-fridge").style.display = page === "fridge" ? "block" : "none";
  $("#view-recipes").style.display = page === "recipes" ? "block" : "none";
  $("#view-settings").style.display = page === "settings" ? "block" : "none";
  renderStats();
  if (page === "fridge") renderFridge();
  if (page === "recipes") renderRecipes();
  if (page === "settings") renderSettings();
}

function renderStats() {
  const total = inventory.length;
  const expired = inventory.filter((i) => statusOf(i).key === "expired").length;
  const soon = inventory.filter((i) => ["danger", "warn"].includes(statusOf(i).key)).length;
  const fresh = inventory.filter((i) => statusOf(i).key === "ok").length;
  $("#stat-total").textContent = total;
  $("#stat-soon").textContent = soon;
  $("#stat-expired").textContent = expired;
  $("#stat-fresh").textContent = fresh;
}

function renderFridge() {
  const q = ($("#search").value || "").toLowerCase();
  const filter = $("#filter-status").value;
  const items = inventory
    .filter((i) => !q || i.name.toLowerCase().includes(q) || (i.notes || "").toLowerCase().includes(q))
    .filter((i) => filter === "all" || statusOf(i).key === filter || (filter === "soon" && ["warn", "danger"].includes(statusOf(i).key)))
    .sort((a, b) => daysUntil(a.expires) - daysUntil(b.expires));

  const urgent = inventory.filter((i) => statusOf(i).d <= 3).sort((a, b) => statusOf(a).d - statusOf(b).d);
  $("#priority-box").innerHTML = urgent.length
    ? `<h2>Use first</h2><div class="chips">${urgent.map((i) => {
        const s = statusOf(i);
        return `<span class="chip ${s.d <= 1 ? "hot" : ""}">${i.emoji || "🍽️"} ${i.name} · ${s.label}</span>`;
      }).join("")}</div>`
    : `<h2>Fridge is calm</h2><p class="hint">Nothing is expiring in the next 3 days. Add a scan or an item after grocery run.</p>`;

  if (!items.length) {
    $("#item-grid").innerHTML = `<div class="empty">No items yet. Scan a fridge photo or add food manually.</div>`;
    return;
  }
  $("#item-grid").innerHTML = items.map((i) => {
    const s = statusOf(i);
    return `<article class="card">
      <div class="head">
        <div>
          <div class="item-name">${i.emoji || "🍽️"} ${escapeHtml(i.name)}</div>
          <div class="item-meta">${escapeHtml(i.qty || "1")} · ${i.location} · expires ${i.expires}</div>
        </div>
        <span class="badge ${s.key}">${s.label}</span>
      </div>
      ${i.notes ? `<div class="item-meta">${escapeHtml(i.notes)}</div>` : ""}
      <div class="card-actions">
        <button class="btn btn-ghost" data-eat="${i.id}">Cooked / used</button>
        <button class="btn btn-danger" data-del="${i.id}">Remove</button>
      </div>
    </article>`;
  }).join("");
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function inventoryNames() {
  return inventory.map((i) => normalize(i.name));
}

function hasIngredient(need) {
  const n = normalize(need);
  return inventory.some((item) => {
    const name = normalize(item.name);
    return name === n || name.includes(n) || n.includes(name) ||
      (findShelf(item.name) && (normalize(findShelf(item.name).name) === n ||
        findShelf(item.name).aliases.some((a) => normalize(a) === n)));
  });
}

function recipeScore(recipe) {
  const haveNeed = recipe.need.filter(hasIngredient);
  const haveOpt = (recipe.optional || []).filter(hasIngredient);
  const missing = recipe.need.filter((x) => !hasIngredient(x));
  const urgentBoost = inventory
    .filter((i) => statusOf(i).d <= 3 && statusOf(i).d >= -1)
    .filter((i) => recipe.need.concat(recipe.optional || []).some((n) => {
      const name = normalize(i.name);
      const nn = normalize(n);
      return name.includes(nn) || nn.includes(name);
    })).length;
  if (haveNeed.length === 0 && haveOpt < 2) return null;
  const score = haveNeed.length * 5 + haveOpt * 1.2 + urgentBoost * 3 - missing.length * 4;
  return { recipe, haveNeed, haveOpt, missing, urgentBoost, score };
}

function renderRecipes() {
  const cuisine = $("#recipe-cuisine").value;
  const onlyHave = $("#recipe-have").checked;
  let ranked = window.RECIPES.map(recipeScore).filter(Boolean);
  if (cuisine !== "any") ranked = ranked.filter((r) => r.recipe.cuisine === cuisine);
  if (onlyHave) ranked = ranked.filter((r) => r.missing.length === 0);
  if (settings.diet === "veg") {
    const meat = /chicken|beef|pork|salmon|fish|shrimp|bacon|ham|sausage|tuna|luncheon|spam/i;
    ranked = ranked.filter((r) => !meat.test(r.recipe.need.join(" ")));
  }
  ranked.sort((a, b) => b.score - a.score);
  const urgentNames = inventory.filter((i) => statusOf(i).d <= 3).map((i) => i.name);
  $("#recipe-priority").innerHTML = urgentNames.length
    ? `<h2>Suggested around expiring food</h2><div class="chips">${urgentNames.map((n) => `<span class="chip hot">${n}</span>`).join("")}</div>`
    : `<h2>Cook from what you have</h2><p class="hint">Add fridge items to unlock better matches. Recipes prioritize food that expires soon.</p>`;

  if (!ranked.length) {
    $("#recipe-grid").innerHTML = `<div class="empty">No matches yet. Add a few staple items (eggs, rice, greens) or uncheck “only what I have”.</div>`;
    return;
  }
  $("#recipe-grid").innerHTML = ranked.map(({ recipe, haveNeed, missing, urgentBoost }) => `
    <article class="card recipe">
      <div class="cuisine">${recipe.emoji} ${recipe.cuisine} · ${recipe.time} min · ${recipe.servings} serv</div>
      <h3>${recipe.name}</h3>
      <div class="match">
        Have: ${haveNeed.join(", ") || "—"}${urgentBoost ? " · uses food that should go first" : ""}
        ${missing.length ? `<div class="missing">Missing: ${missing.join(", ")}</div>` : `<div>You can cook this now.</div>`}
      </div>
      <ol class="steps">${recipe.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
    </article>
  `).join("");
}

function renderSettings() {
  $("#set-diet").value = settings.diet;
  $("#set-household").value = settings.household;
  $("#set-provider").value = settings.provider;
  $("#set-apikey").value = settings.apiKey;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function upsertItem(data) {
  const shelf = findShelf(data.name) || { emoji: "🍽️", location: data.location || "fridge", days: 5 };
  const bought = data.bought || todayISO();
  const item = {
    id: data.id || uid(),
    name: data.name.trim(),
    qty: data.qty || "1",
    location: data.location || shelf.location,
    bought,
    expires: data.expires || addDays(bought, shelf.days),
    notes: data.notes || "",
    emoji: shelf.emoji,
    addedAt: Date.now(),
  };
  inventory.push(item);
  saveInventory(inventory);
}

function openModal(id) { $(id).classList.add("open"); }
function closeModals() { $$(".modal-back").forEach((m) => m.classList.remove("open")); }

function fillAddForm(preset = {}) {
  const shelf = preset.name ? findShelf(preset.name) : null;
  $("#add-name").value = preset.name || "";
  $("#add-qty").value = preset.qty || "1";
  $("#add-location").value = preset.location || shelf?.location || "fridge";
  $("#add-bought").value = preset.bought || todayISO();
  $("#add-expires").value = preset.expires || (shelf ? addDays(todayISO(), shelf.days) : addDays(todayISO(), 5));
  $("#add-notes").value = preset.notes || "";
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
  $("#add-bought").addEventListener("change", () => {
    const shelf = findShelf($("#add-name").value);
    if (shelf) $("#add-expires").value = addDays($("#add-bought").value, shelf.days);
  });

  $("#form-add").addEventListener("submit", (e) => {
    e.preventDefault();
    upsertItem({
      name: $("#add-name").value,
      qty: $("#add-qty").value,
      location: $("#add-location").value,
      bought: $("#add-bought").value,
      expires: $("#add-expires").value,
      notes: $("#add-notes").value,
    });
    closeModals();
    page = "fridge";
    render();
  });

  $("#item-grid").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    const eat = e.target.closest("[data-eat]");
    if (del) {
      inventory = inventory.filter((i) => i.id !== del.dataset.del);
      saveInventory(inventory); render();
    }
    if (eat) {
      inventory = inventory.filter((i) => i.id !== eat.dataset.eat);
      saveInventory(inventory);
      page = "recipes"; render();
    }
  });

  $$("[data-close]").forEach((b) => b.addEventListener("click", closeModals));
  $$(".modal-back").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));

  $("#scan-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    $("#scan-preview").src = url;
    $("#scan-preview").style.display = "block";
    window._scanFile = file;
  });

  $("#btn-detect").addEventListener("click", runDetect);
  $("#btn-add-detected").addEventListener("click", () => {
    $$("#detect-results input[type=checkbox]:checked").forEach((box) => {
      upsertItem({ name: box.dataset.name, qty: box.dataset.qty || "1" });
    });
    closeModals();
    page = "fridge";
    render();
  });

  $("#save-settings").addEventListener("click", () => {
    settings = {
      diet: $("#set-diet").value,
      household: Number($("#set-household").value || 2),
      provider: $("#set-provider").value,
      apiKey: $("#set-apikey").value.trim(),
    };
    saveSettings(settings);
    alert("Settings saved on this device.");
  });

  $("#btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ inventory, settings }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fridge-ai-backup.json";
    a.click();
  });
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = JSON.parse(await file.text());
    if (Array.isArray(data.inventory)) { inventory = data.inventory; saveInventory(inventory); }
    if (data.settings) { settings = Object.assign(settings, data.settings); saveSettings(settings); }
    render();
  });
  $("#btn-clear").addEventListener("click", () => {
    if (confirm("Clear all fridge items?")) { inventory = []; saveInventory(inventory); render(); }
  });
}

async function fileToBase64(file) {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function runDetect() {
  const status = $("#detect-status");
  status.textContent = "Detecting food…";
  const file = window._scanFile;
  try {
    let foods;
    if (settings.provider === "openai" && settings.apiKey) foods = await detectOpenAI(file);
    else if (settings.provider === "gemini" && settings.apiKey) foods = await detectGemini(file);
    else foods = await detectDemo(file);
    detectCandidates = foods;
    $("#detect-results").innerHTML = foods.map((f, i) => `
      <label class="detect-row">
        <span>${f.emoji || "🍽️"} <strong>${escapeHtml(f.name)}</strong> · ${escapeHtml(f.qty || "1")} · ~${f.days || 5} days</span>
        <input type="checkbox" checked data-name="${escapeHtml(f.name)}" data-qty="${escapeHtml(f.qty || "1")}">
      </label>
    `).join("") || `<p class="hint">Nothing detected. Try a brighter photo or add items manually.</p>`;
    status.textContent = foods.length ? `Found ${foods.length} item(s). Uncheck anything wrong, then add.` : "No items.";
  } catch (err) {
    console.error(err);
    status.textContent = "Detection failed: " + err.message;
  }
}

async function detectDemo(file) {
  // Offline / no-key path: fuzzy-match likely foods so the product is usable immediately.
  // If a photo exists we still return a review list biased toward common fridge items.
  const names = window.SHELF_LIFE.filter((s) => ["produce", "dairy", "protein"].includes(s.category)).slice(0, 8);
  const picked = [];
  const pool = [
    "Eggs", "Milk", "Tomato", "Pak choi", "Chicken thighs", "Tofu", "Spring onion", "Leftover rice",
  ];
  if (file && file.name) {
    const n = file.name.toLowerCase();
    window.SHELF_LIFE.forEach((s) => {
      if (n.includes(s.name.toLowerCase().split(" ")[0])) pool.unshift(s.name);
    });
  }
  [...new Set(pool)].slice(0, 6).forEach((name) => {
    const shelf = findShelf(name);
    picked.push({ name, qty: "1", days: shelf?.days || 5, emoji: shelf?.emoji });
  });
  return picked;
}

async function detectOpenAI(file) {
  if (!file) throw new Error("Choose a photo first.");
  const b64 = await fileToBase64(file);
  const prompt = `Identify distinct food ingredients visible in this fridge / grocery photo.
Return ONLY JSON: {"items":[{"name":"Tomato","qty":"4","confidence":0.8}]}
Use common grocery names. No commentary.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + settings.apiKey,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${b64}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return (parsed.items || []).map((it) => {
    const shelf = findShelf(it.name);
    return { name: it.name, qty: String(it.qty || "1"), days: shelf?.days || 5, emoji: shelf?.emoji };
  });
}

async function detectGemini(file) {
  if (!file) throw new Error("Choose a photo first.");
  const b64 = await fileToBase64(file);
  const prompt = `Identify distinct food ingredients visible in this fridge / grocery photo.
Return ONLY JSON: {"items":[{"name":"Tomato","qty":"4","confidence":0.8}]}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: file.type || "image/jpeg", data: b64 } },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "{}";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = JSON.parse(json);
  return (parsed.items || []).map((it) => {
    const shelf = findShelf(it.name);
    return { name: it.name, qty: String(it.qty || "1"), days: shelf?.days || 5, emoji: shelf?.emoji };
  });
}

function seedDemo() {
  if (inventory.length && !confirm("Add a Hong Kong sample fridge on top of current items?")) return;
  [
    { name: "Eggs", qty: "8" },
    { name: "Tomato", qty: "4", notes: "A bit soft" },
    { name: "Pak choi", qty: "1 bunch" },
    { name: "Tofu", qty: "1 pack" },
    { name: "Chicken thighs", qty: "4 pcs" },
    { name: "Cooked rice", qty: "1 box leftover" },
    { name: "Spring onion", qty: "1 bunch" },
    { name: "Ginger", qty: "1 knob" },
    { name: "Milk", qty: "1L" },
  ].forEach((x, idx) => {
    const shelf = findShelf(x.name);
    upsertItem({
      ...x,
      expires: addDays(todayISO(), idx === 2 || idx === 4 || idx === 5 ? 1 : shelf.days),
    });
  });
  render();
}

function fillDatalist() {
  $("#food-list").innerHTML = window.SHELF_LIFE.map((s) => `<option value="${s.name}">`).join("");
}

fillDatalist();
bindEvents();
render();
