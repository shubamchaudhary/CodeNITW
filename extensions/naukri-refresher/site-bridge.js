// Connects the job finder to your site, so there's no token to copy or paste.
//
// Runs only on https://interviewplanprep.vercel.app (the manifest's match), in the extension's
// own isolated world. Your site's Job tracker page (src/pages/JobTracker/finderBridge.js), when
// you're signed in as the owner, pings; this answers with a hello (version, which list this
// browser searches for, whether it needs a token). If it does, the page asks /api/radar for the
// finder's own token and posts it here; the background keeps it only if your site accepts it.
//
// It never reads the page, never sends the stored token anywhere, and the background only lets
// it ask these two things (background.js `allowed`).
(() => {
  const ext = globalThis.browser ?? globalThis.chrome;
  const NS = 'nr-finder';
  const origin = location.origin;
  const post = (msg) => window.postMessage({ ns: NS, from: 'extension', ...msg }, origin);
  const ask = async (msg) => {
    try {
      return await ext.runtime.sendMessage(msg);
    } catch (e) {
      return { error: String((e && e.message) || e) }; // the extension was reloaded or updated
    }
  };

  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.origin !== origin) return;
    const d = e.data;
    if (!d || typeof d !== 'object' || d.ns !== NS || d.from !== 'site') return;
    if (d.type === 'ping') {
      const h = await ask({ type: 'jobsBridgeHello' });
      if (h && !h.error) post({ type: 'hello', version: h.version, scope: h.scope, enabled: h.enabled, needsToken: h.needsToken });
    } else if (d.type === 'token' && typeof d.token === 'string' && d.token.length <= 200) {
      const r = await ask({ type: 'jobsPair', token: d.token });
      post({ type: 'paired', ok: !!(r && r.ok), short: (r && (r.short || r.error)) || '', scope: r && r.scope });
    }
  });
})();
