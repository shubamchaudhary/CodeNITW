// What runs inside an Instahyre page (instahyre.js sends each one with scripting.executeScript).
// Every function stands alone: no imports, nothing outside itself, because it's serialized into the
// page. They find things by their visible text ("View job", "Apply", "Not interested"), not by
// class names, which Instahyre can change any day. They read, or click one thing, and answer.
// Nothing here ever clicks "Not interested".

/**
 * The page now: the job cards in the list, the job that's open (if any), and what stops a run.
 * → { cards: [{ key, title, company }], total, modal: null | { text, hasApply, applied },
 *     more, login, limit, captcha, url }
 */
export function pageObserve() {
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const shown = (e) => {
    if (!e || !e.getBoundingClientRect) return false;
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 3 && r.height > 3 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  // The deepest visible element whose whole text matches.
  const byText = (rx) => [...document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], div, span, p, li')]
    .filter((e) => {
      const t = clean(e.tagName === 'INPUT' ? e.value : e.textContent);
      return t && t.length < 60 && rx.test(t) && shown(e) && ![...e.children].some((c) => rx.test(clean(c.textContent)));
    });
  const clickable = (e) => e.closest('button, a, [role="button"]') || e;

  const views = byText(/^view job\b/i).map(clickable).filter((v, i, a) => a.indexOf(v) === i);
  // A card: the smallest ancestor of a "View job" that holds only that one "View job" and is big
  // enough to hold the job's title and blurb (the button's own column is too small).
  const nViews = (el) => [...el.querySelectorAll('button, a, [role="button"], div, span')].filter((x) => /^view job\b/i.test(clean(x.textContent)) && ![...x.children].some((c) => /^view job\b/i.test(clean(c.textContent)))).length;
  const cardOf = (v) => {
    let el = v;
    let best = null;
    for (let i = 0; i < 12 && el.parentElement; i++) {
      el = el.parentElement;
      if (nViews(el) !== 1) break; // a second job's button: this is the whole list
      const t = clean(el.textContent);
      if (!best) best = el;
      if (t.length > 90 && / - /.test(t)) return el;
      best = el;
    }
    return best || v.parentElement;
  };
  document.querySelectorAll('[data-nr-view]').forEach((e) => e.removeAttribute('data-nr-view'));
  views.forEach((v, i) => v.setAttribute('data-nr-view', String(i)));
  const seen = {};
  const cards = views.map((v) => {
    const card = cardOf(v);
    const text = clean(card && card.textContent);
    // "Company - Job title": the deepest short element inside the card with " - " in it.
    const titleEl = card && [...card.querySelectorAll('*')].find((e) => {
      const t = clean(e.textContent);
      return t.length > 5 && t.length < 140 && / - /.test(t) && ![...e.children].some((c) => / - /.test(clean(c.textContent)));
    });
    const head = clean(titleEl ? titleEl.textContent : text.slice(0, 100));
    const cut = head.indexOf(' - ');
    const company = cut > 0 ? head.slice(0, cut) : '';
    const title = cut > 0 ? head.slice(cut + 3) : head;
    const base = `${company}|${title}|${text.slice(0, 160)}`;
    seen[base] = (seen[base] || 0) + 1;
    return { key: `${base}#${seen[base]}`, title, company };
  });

  // The open job: its "Apply" (or "Applied") button, which a list card never has.
  const inCard = (e) => views.some((v) => cardOf(v) && cardOf(v).contains(e));
  const applyBtn = byText(/^apply$/i).map(clickable).find((e) => !inCard(e));
  const appliedBtn = byText(/^applied$/i).map(clickable).find((e) => !inCard(e));
  let modal = null;
  const anchor = applyBtn || appliedBtn;
  if (anchor) {
    let root = anchor;
    for (let i = 0; i < 14 && root.parentElement; i++) {
      root = root.parentElement;
      if (/job description/i.test(root.textContent || '') && clean(root.textContent).length > 300) break;
    }
    modal = { text: clean(root.textContent).slice(0, 9000), hasApply: !!applyBtn, applied: !!appliedBtn };
  }

  const body = clean(document.body ? document.body.innerText : '').slice(0, 20000);
  const more = byText(/^(?:load more|show more|view more|see more|more jobs|next(?: page)?|›|»)$/i).length > 0;
  const total = Number((body.match(/showing\s+\d+\s*-\s*\d+\s+out of\s+(\d+)/i) || [])[1]) || null;
  return {
    cards, total, modal, more,
    login: /\/(?:login|signin|sign-in|accounts)\b/i.test(location.pathname) || (!cards.length && /\b(?:log ?in|sign ?in)\b/i.test(body) && !/opportunities|search results/i.test(body)),
    limit: /(?:daily|today'?s)\s+(?:apply|application)s?\s+limit|limit (?:has been |is )?(?:reached|over|exhausted)|(?:no|out of) (?:more )?(?:applies|applications|credits) (?:left|remaining)|upgrade (?:now )?to (?:apply|continue)/i.test(body),
    // "No matching opportunities found": the search shows nothing (a link Instahyre didn't understand, or the list is used up).
    empty: !cards.length && /no matching opportunities found|no (?:jobs|results|opportunities) found/i.test(body),
    captcha: [...document.querySelectorAll('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenge"]')].some(shown),
    url: location.href,
  };
}

/** Opens one card's job: its "View job" button, tagged by the last pageObserve (cards[i] is button i). → { ok } */
export function pageOpen(index) {
  const v = document.querySelector(`[data-nr-view="${Number(index)}"]`);
  if (!v || !v.isConnected) return { ok: false };
  v.scrollIntoView({ block: 'center' });
  v.click();
  return { ok: true };
}

/** Presses "Apply" in the open job. → { ok } */
export function pageApply() {
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const cands = [...document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], div, span')]
    .filter((e) => /^apply$/i.test(clean(e.tagName === 'INPUT' ? e.value : e.textContent)) && e.getBoundingClientRect().width > 3 && ![...e.children].some((c) => /^apply$/i.test(clean(c.textContent))));
  const b = cands.map((e) => e.closest('button, a, [role="button"]') || e)[0];
  if (!b) return { ok: false };
  b.click();
  return { ok: true };
}

/** Closes the open job (its close button, else Escape). → { ok } */
export function pageClose() {
  const shown = (e) => e && e.getBoundingClientRect && e.getBoundingClientRect().width > 3;
  const x = [...document.querySelectorAll('button, a, [role="button"], span, i, div')]
    .filter((e) => shown(e) && (/close/i.test(e.getAttribute('aria-label') || '') || /^(?:×|✕|✖|x|close)$/i.test((e.textContent || '').trim()) || /(?:^|[\s_-])close(?:$|[\s_-])/i.test(String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || ''))))[0];
  if (x) x.click();
  else {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
  }
  return { ok: true };
}

/** "Load more" / "Next" under the list, if the page has one. → { ok } */
export function pageMore() {
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const b = [...document.querySelectorAll('button, a, [role="button"], div, span')]
    .filter((e) => /^(?:load more|show more|view more|see more|more jobs|next(?: page)?|›|»)$/i.test(clean(e.textContent)) && e.getBoundingClientRect().width > 3 && ![...e.children].some((c) => clean(c.textContent)))
    .map((e) => e.closest('button, a, [role="button"]') || e)[0];
  if (!b) return { ok: false };
  b.scrollIntoView({ block: 'center' });
  b.click();
  return { ok: true };
}
