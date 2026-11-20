// Runs in the page (MAIN world) at document_start on Naukri's job search pages only.
// It keeps a copy of the search results the page itself fetches, so the job finder reads exactly
// what Naukri showed, without making any request of its own. Read-only: it changes nothing on the
// page and sends nothing anywhere; the extension reads `window.__nrJobs` when it needs it.
(() => {
  if (window.__nrCapture) return;
  window.__nrCapture = true;
  const store = (window.__nrJobs = []);
  const wanted = (url) => /\/jobapi\/v\d+\/search\b/.test(String(url || ''));
  const keep = (url, status, text) => {
    let json = null;
    try { json = typeof text === 'string' ? JSON.parse(text) : text; } catch { /* not JSON */ }
    store.push({ url: String(url).slice(0, 400), status, t: Date.now(), json });
    if (store.length > 8) store.shift();
  };

  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const p = origFetch.apply(this, arguments);
      if (wanted(url)) {
        p.then((res) => res.clone().text().then((t) => keep(url, res.status, t))).catch(() => {});
      }
      return p;
    };
  }

  const proto = XMLHttpRequest.prototype;
  const origOpen = proto.open;
  const origSend = proto.send;
  proto.open = function (method, url) {
    this.__nrUrl = url;
    return origOpen.apply(this, arguments);
  };
  proto.send = function () {
    if (wanted(this.__nrUrl)) {
      this.addEventListener('loadend', () => {
        try {
          const body = this.responseType === '' || this.responseType === 'text' ? this.responseText : this.response;
          keep(this.__nrUrl, this.status, body);
        } catch { /* unreadable response */ }
      });
    }
    return origSend.apply(this, arguments);
  };
})();
