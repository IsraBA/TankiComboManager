// background.js  [service worker]

// The only context allowed to read cross-origin translation responses.
// Why, and the full flow: CLAUDE.mds/translator.md

const TRANSLATE_TIMEOUT_MS = 8000;
const LINGVA_INSTANCES = ['https://lingva.lunar.icu', 'https://lingva.ml'];

// The SW is ephemeral, so this cache only helps within one lifetime
const swCache = new Map();

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TRANSLATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { credentials: 'omit', signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Unofficial Google endpoint: reports the DETECTED SOURCE language (data[2]),
// which is why it's tried first — it's what lets us show "[RU] >> ...".
async function googleCall(text, targetLang) {
  const url = 'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) +
    '&dt=t&q=' + encodeURIComponent(text);
  const d = await fetchJson(url);
  const segs = (d && d[0]) || [];
  const tr = segs.map((s) => (s && s[0]) || '').join('');
  if (!tr) throw new Error('empty translation');
  return { text: tr, lang: (d && d[2]) || null };
}

// Lingva proxies Google too but returns only the translation (no source lang).
async function lingvaCall(instance, text, targetLang) {
  const url = instance + '/api/v1/auto/' + encodeURIComponent(targetLang) +
    '/' + encodeURIComponent(text);
  const d = await fetchJson(url);
  if (d == null || d.translation == null) throw new Error('no translation field');
  return { text: d.translation, lang: null };
}

// Try backends in order; first success wins. Worst case (all fail/slow) is
// bounded by TRANSLATE_TIMEOUT_MS per backend.
async function translate(text, targetLang) {
  const key = targetLang + '\n' + text;
  if (swCache.has(key)) return swCache.get(key);

  const attempts = [() => googleCall(text, targetLang)]
    .concat(LINGVA_INSTANCES.map((inst) => () => lingvaCall(inst, text, targetLang)));

  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      swCache.set(key, res);
      if (swCache.size > 500) swCache.clear();  // crude bound; MAIN owns the real cache
      return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('all backends failed');
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'translate') return;
  const text = String(msg.text || '');
  const targetLang = String(msg.targetLang || 'en');
  if (!text) { sendResponse({ ok: false, error: 'empty text' }); return; }

  translate(text, targetLang)
    .then((res) => sendResponse({ ok: true, text: res.text, lang: res.lang }))
    .catch((e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
  return true;  // keep the message channel open for the async sendResponse
});
