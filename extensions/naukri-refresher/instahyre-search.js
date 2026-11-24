// Serialized by scripting.executeScript. A job click and the check authorizing it must run
// in the same document and JS turn: the opportunities SPA can switch lists without a reload.
export function pageSearch(plan, action = 'check', jobKey = '') {
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const visible = (e) => !!e?.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const all = (base, selector) => [...base.querySelectorAll(selector)].filter(visible);
  const u = new URL(location.href);
  const wait = (why) => ({ why, recommended: u.searchParams.get('matching') === 'true' });
  const stop = (why) => ({ stopped: true, why });
  // A tabs.update may return while the old document can still receive scripts.
  if (action === 'retire') globalThis.__nrRetiredSearch = true;
  if (globalThis.__nrRetiredSearch) return wait('Waiting for the opportunities page to reload.');
  if (/\/(?:login|signin|sign-in|accounts)\b/i.test(u.pathname)) return stop('Log in to Instahyre in the tab, then start again.');
  if (all(document, 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenge"]').length ||
      /just a moment|verify you are human/i.test(document.title)) return stop('Instahyre asked for a check. Complete it in the tab, then start again.');
  if (u.origin !== 'https://www.instahyre.com' || !/^\/candidate\/opportunities\/?$/.test(u.pathname)) {
    return wait('Waiting for the Instahyre opportunities page.');
  }
  const fieldSelector = 'input:not([type]), input[type="search"], input[type="text"], input[role="combobox"]';
  const buttons = all(document, 'button, a, [role="button"], [ng-click], [data-ng-click], input[type="button"], input[type="submit"]');
  const search = buttons.find((b) => norm(b.value || b.textContent) === 'search');
  if (!search) {
    if (action === 'restore') {
      const opener = buttons.find((b) => /^(?:search jobs|search for jobs|find jobs)$/.test(norm(b.textContent || b.getAttribute('aria-label'))));
      if (opener && !globalThis.__nrOpenedSearch) { globalThis.__nrOpenedSearch = true; opener.click(); }
    }
    return wait('Could not find the Search button on the opportunities page.');
  }
  let box = search.parentElement;
  let field;
  while (box && box !== document.body) {
    const fields = all(box, fieldSelector).filter((e) => !/location|cities|industr|function/i.test(e.placeholder || ''));
    if (fields.length) { if (fields.length === 1) field = fields[0]; break; }
    box = box.parentElement;
  }
  if (!field) return wait('Could not identify the skill field next to Search.');

  const chipSelector = '.ui-select-match-item, .select2-search-choice, .select2-selection__choice, .tag-item, .token, .selectize-input > .item, .bootstrap-tagsinput > .tag, .ng-value, [data-skill-chip]';
  const removeSelector = 'button, .close, .remove, .remove-button, .select2-search-choice-close, .select2-selection__choice__remove, .ng-value-icon, [aria-label*="remove" i], [data-role="remove"]';
  const chips = all(box, chipSelector);
  // Also recognize a removable pill with no library-specific CSS class.
  for (const x of all(box, 'button, a, span, i, [role="button"]')) {
    if (!/^[×✕✖x]$/i.test(x.textContent.trim()) && !x.matches('[aria-label*="remove" i]')) continue;
    const pill = x.parentElement;
    if (pill && !pill.contains(field) && !chips.some((c) => c.contains(x) || pill.contains(c))) chips.push(pill);
  }
  const label = (chip) => {
    const copy = chip.cloneNode(true);
    copy.querySelectorAll(removeSelector).forEach((x) => x.remove());
    return norm(copy.textContent.replace(/^[×✕✖]\s*|\s*[×✕✖]$/g, ''));
  };
  const selected = chips.map(label);
  const wanted = plan.skills.map(norm);
  const equal = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const sameSkills = equal(selected, wanted);
  const urlSkills = u.searchParams.getAll('skills').flatMap((s) => s.split(',')).map(norm);
  const meaningful = ([k, v]) => !['search', 'skills', 'page', 'matching'].includes(k) &&
    !(['company_size', 'job_type'].includes(k) && v === '0');
  const pairs = (items) => items.filter(meaningful).map((p) => JSON.stringify(p));
  const sameFilters = equal(pairs(plan.filters), pairs([...u.searchParams]));
  const route = !u.searchParams.has('matching') && u.searchParams.get('search') === 'true' &&
    equal(urlSkills, wanted) && sameFilters;
  const activeTabs = all(document, '.active, .selected, [aria-selected="true"], [aria-current="page"]')
    .map((el) => norm(el.textContent)).filter((t) => /^(?:search results|recommended jobs|applied jobs|not interested)(?:\s*[\d,]+)?$/.test(t));
  const results = activeTabs.length ? activeTabs.every((s) => s.startsWith('search results')) :
    /\bthat match your search\b/i.test(document.body.innerText);
  const beforeSearch = globalThis.__nrOldResults;
  const stillOld = beforeSearch?.some(({ el, signature }) => el.isConnected && visible(el) && norm(el.textContent) === signature);
  if (sameSkills && route && results && !stillOld && !all(document, '[aria-busy="true"]').length) {
    delete globalThis.__nrOldResults;
    if (action === 'open' || action === 'apply') {
      const attr = action === 'open' ? 'data-nr-view' : 'data-nr-apply';
      const button = all(document, '[' + attr + ']').find((e) => e.getAttribute(attr) === jobKey);
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return stop('The job changed before the click. Check the Instahyre tab.');
      button.scrollIntoView({ block: 'center' });
      if (action === 'open') document.documentElement.setAttribute('data-nr-open-job', jobKey);
      button.click();
    }
    return { ready: true };
  }
  const reason = !sameSkills ? 'The selected skill chips do not match the saved search.' :
    !sameFilters ? 'The filters in the results differ from the saved filters.' : 'Waiting for the filtered Search Results list.';
  if (action !== 'restore') return wait(reason);
  const foreign = (entries) => pairs(entries.filter(([k]) => k !== 'years'));
  if (!equal(foreign(plan.filters), foreign([...u.searchParams]))) {
    return stop('Instahyre changed additional filters in the saved link. Restore those filters in the tab before starting again.');
  }
  const extra = chips.find((c) => !wanted.includes(label(c)));
  if (extra) {
    const remove = extra.querySelector(removeSelector) || all(extra, 'a, span, i').find((e) => /^[×✕✖x]$/i.test(e.textContent.trim()));
    if (!remove) return stop('Could not remove the extra skill "' + label(extra) + '".');
    remove.click();
    return wait('Removing the extra skill "' + label(extra) + '".');
  }
  const missing = plan.skills.find((s) => !selected.includes(norm(s)));
  if (missing) {
    if (norm(field.value) !== norm(missing)) {
      field.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, missing);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new KeyboardEvent('keyup', { key: missing.slice(-1), bubbles: true }));
    } else {
      const menu = document.getElementById(field.getAttribute('aria-controls') || field.getAttribute('aria-owns') || '');
      const choices = menu ? all(menu, '[role="option"], li, .ui-select-choices-row, .option') :
        all(document, '[role="option"], .ui-select-choices-row, .select2-result-selectable, .select2-results__option, .suggestion-item, .selectize-dropdown .option, .dropdown-menu li, .autocomplete li, .suggestions li, .ui-autocomplete .ui-menu-item');
      const exact = choices.find((x) => norm(x.textContent) === norm(missing) && x.getAttribute('aria-disabled') !== 'true');
      if (exact) (exact.querySelector('a, [role="button"], .ui-select-choices-row-inner') || exact).click();
    }
    return wait('Waiting for Instahyre to select the exact skill "' + missing + '".');
  }
  const years = plan.filters.find(([k]) => k === 'years')?.[1];
  // The screenshot's experience slider uses its right endpoint for All. Only touch the
  // experience control. Salary and other sliders can share the same page.
  const heading = all(document, 'label, legend, h3, h4, h5, strong, b, div, span').find((e) => norm(e.textContent) === 'experience level');
  let group = heading?.parentElement;
  let slider;
  for (let i = 0; group && i < 4 && group !== document.body; i++, group = group.parentElement) {
    const sliders = all(group, 'input[type="range"], [role="slider"], .ui-slider-handle, .rz-pointer');
    if (sliders.length) { if (sliders.length === 1) slider = sliders[0]; break; }
  }
  if (years != null || slider || u.searchParams.has('years')) {
    const min = Number(slider?.getAttribute('min') || slider?.getAttribute('aria-valuemin') || 0);
    const max = Number(slider?.getAttribute('max') || slider?.getAttribute('aria-valuemax') || 25);
    const target = years == null ? max : Number(years);
    const raw = slider?.value ?? slider?.getAttribute('aria-valuenow');
    const current = raw != null ? Number(raw) : null;
    if (!slider && u.searchParams.get('years') !== (years ?? null)) return wait('Could not find the Experience level control for the saved search.');
    if (slider && (!Number.isInteger(target) || target < min || target > max)) return stop('The saved experience level is outside the visible slider range.');
    if (slider && current !== target) {
      if (slider.matches('input[type="range"]')) {
        slider.value = String(target);
        for (const type of ['input', 'change']) slider.dispatchEvent(new Event(type, { bubbles: true }));
      } else {
        // Bootstrap, Angular and jQuery sliders listen for keyboard events on the handle.
        slider.focus();
        const press = (key, keyCode) => {
          for (const type of ['keydown', 'keyup']) slider.dispatchEvent(new KeyboardEvent(type, { key, code: key, keyCode, which: keyCode, bubbles: true }));
        };
        if (years == null) press('End', 35);
        else { press('Home', 36); for (let n = min; n < target; n++) press('ArrowRight', 39); }
      }
      if (current !== null) return wait('Setting Experience level to ' + (years ?? 'All') + '.');
    }
  }
  if (search.disabled || search.getAttribute('aria-disabled') === 'true') return wait('Waiting for the Search button to become available.');
  // Some SPAs update the URL, chips and tab before the old recommendations disappear.
  // Remember visible card rows (or the previous empty message) until the list is repainted.
  const oldRows = buttons.filter((b) => /^view job\b/i.test(norm(b.textContent))).map((b) => {
    let row = b.parentElement;
    while (row?.parentElement && row !== document.body && !/\s[-–]\s/.test(row.textContent)) row = row.parentElement;
    return row && row !== document.body ? row : b;
  });
  oldRows.push(...all(document, 'h2, h3, h4, p, span, div').filter((e) => !e.children.length && /^no (?:matching )?(?:jobs|results|opportunities) found/i.test(norm(e.textContent))));
  globalThis.__nrOldResults = oldRows.map((el) => ({ el, signature: norm(el.textContent) }));
  search.click();
  return { submitted: true, why: 'Search was pressed. Waiting for Instahyre to confirm the requested filters and results.' };
}
